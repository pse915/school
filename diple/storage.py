"""Versioned storage: local SQLite is not persistent on Streamlit Cloud.

Google Sheets adapter is single-writer / best-effort revision verification, NOT a
transactional multi-school SaaS backend.
"""
from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from .model import validate_project


class VersionConflict(Exception):
    pass


def identity(project):
    s = project['school']
    return f"{s['id']}:{s['academic_year']}:{s['semester']}"


class SQLiteStorage:
    def __init__(self, path='timetable-local.sqlite3'):
        self.path = str(path)
        self._connect().close()

    def _connect(self):
        connection = sqlite3.connect(self.path, timeout=20)
        connection.execute('CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, rev INTEGER NOT NULL, payload TEXT NOT NULL)')
        connection.commit()
        return connection

    def read(self, key):
        with self._connect() as db:
            row = db.execute('SELECT rev,payload FROM projects WHERE id=?', (key,)).fetchone()
        return (json.loads(row[1]), row[0]) if row else (None, 0)

    def save(self, project, expected_revision=0):
        err = validate_project(project)
        if err:
            raise ValueError('; '.join(err))
        key = identity(project)
        with self._connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT rev FROM projects WHERE id=?', (key,)).fetchone()
            old = int(row[0]) if row else 0
            if old != expected_revision:
                raise VersionConflict(f'다른 저장본이 발견되었습니다: 서버 {old}, 화면 {expected_revision}')
            new = old+1
            db.execute('INSERT INTO projects(id,rev,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET rev=excluded.rev, payload=excluded.payload',
                       (key, new, json.dumps(project, ensure_ascii=False)))
            db.commit()
        return new


class GoogleSheetsStorage:
    """One spreadsheet for one school; multiple term rows, max 24000 chars/cell.

    Not atomic for parallel writers. Restrict administrator to one at a time.
    """
    def __init__(self, spreadsheet_id, service_account_info):
        import gspread
        gc = gspread.service_account_from_dict(dict(service_account_info))
        spreadsheet = gc.open_by_key(spreadsheet_id)
        try:
            self.ws = spreadsheet.worksheet('Diple_Data')
        except gspread.WorksheetNotFound:
            self.ws = spreadsheet.add_worksheet(title='Diple_Data', rows=500, cols=5)
            self.ws.update(range_name='A1:D1', values=[['project_key','revision','chunk_index','json_chunk']])

    def _rows(self):
        return self.ws.get_all_values()[1:]

    def read(self, key):
        rows = [row for row in self._rows() if len(row) >= 4 and row[0] == key]
        if not rows:
            return None, 0
        rev = max(int(r[1]) for r in rows)
        selected = sorted((r for r in rows if int(r[1])==rev), key=lambda r: int(r[2]))
        return json.loads(''.join(r[3] for r in selected)), rev

    def save(self, project, expected_revision=0):
        err = validate_project(project)
        if err:
            raise ValueError('; '.join(err))
        key = identity(project)
        _, current = self.read(key)
        if current != expected_revision:
            raise VersionConflict(f'다른 저장본이 발견되었습니다: 서버 {current}, 화면 {expected_revision}')
        new = current+1
        payload = json.dumps(project, ensure_ascii=False, separators=(',', ':'))
        chunks = [payload[i:i+24000] for i in range(0, len(payload), 24000)]
        existing = len(self._rows())
        start = existing+2
        rows = [[key, str(new), str(i), chunk] for i, chunk in enumerate(chunks)]
        self.ws.update(range_name=f'A{start}:D{start+len(rows)-1}', values=rows)
        _, observed = self.read(key)
        if observed != new:
            raise RuntimeError('Google Sheets 저장 응답은 성공했지만 재조회 검증 실패')
        return new


def dumps(project):
    return json.dumps(project, ensure_ascii=False, indent=2).encode('utf-8')


def loads(contents):
    obj = json.loads(contents)
    errors = validate_project(obj)
    if errors:
        raise ValueError('\n'.join(errors))
    return obj

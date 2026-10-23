"""Separate, append-only planning versions. Not a multi-writer transactional database.

Saving is opt-in and never touches legacy tabs. A Google Sheets write can have an
ambiguous network outcome; the server checks the latest record before any retry.
"""
import base64
from datetime import datetime, timezone
import hashlib
import json
import threading
import zlib

_LOCK = threading.RLock()
TAB = 'Diple_Planning'
HEADER = ['project_key', 'revision', 'payload_zlib_b64', 'sha256', 'saved_at_utc']


def key_for(project):
    school=project['school']
    if not str(school.get('id','')).strip():
        raise ValueError('학교 ID가 비어 있습니다.')
    year=int(school.get('academic_year',0)); semester=int(school.get('semester',0))
    if year<2000 or year>2200 or semester not in (1,2):
        raise ValueError('학년도·학기 범위 오류')
    return f'{school["id"]}:{year}:{semester}'


class PlanningSheetRepository:
    def __init__(self, application):
        self.app=application

    def _spreadsheet(self):
        ns=self.app.program.namespace
        spreadsheet_id=self.app.repo.settings.get('planning_sheet_id') or self.app.repo.settings.get('work_sheet_id') or ns['WORK_SHEET_ID']
        return ns['get_gspread_client']().open_by_key(spreadsheet_id)

    def _sheet(self, create=False):
        sp=self._spreadsheet()
        try:
            return sp.worksheet(TAB)
        except Exception as exc:
            # Never turn authentication/network errors into a new worksheet.
            if exc.__class__.__name__!='WorksheetNotFound':
                raise
            if not create: return None
            ws=sp.add_worksheet(title=TAB,rows=2000,cols=5)
            ws.update(range_name='A1:E1',values=[HEADER])
            return ws

    def read(self, key):
        ws=self._sheet(create=False)
        if ws is None: return None,0
        rows=ws.get_all_values()
        if not rows or rows[0][:5]!=HEADER: raise ValueError('수업계획 저장 시트 헤더가 기대한 형식이 아닙니다.')
        relevant=[r for r in rows[1:] if len(r)>=5 and r[0]==key]
        if not relevant:return None,0
        rev=max(int(r[1]) for r in relevant)
        latest=[r for r in relevant if int(r[1])==rev]
        if len(latest)!=1:raise ValueError('동일 버전이 중복 기록되었습니다. 관리자 점검이 필요합니다.')
        raw=zlib.decompress(base64.b64decode(latest[0][2]))
        if hashlib.sha256(raw).hexdigest()!=latest[0][3]:raise ValueError('수업계획 저장 데이터 무결성 오류')
        return json.loads(raw),rev

    def save(self, project, expected_rev):
        if not self.app.repo.writable:
            raise PermissionError('기존 Master 저장 설정이 읽기 전용입니다. 저장이 차단되었습니다.')
        key=key_for(project)
        raw=json.dumps(project,ensure_ascii=False,separators=(',',':')).encode('utf-8')
        encoded=base64.b64encode(zlib.compress(raw,9)).decode('ascii')
        if len(encoded)>42000:raise ValueError('한 행의 저장 한도를 넘었습니다. JSON으로 내보내기 후 데이터 저장소 확장이 필요합니다.')
        with _LOCK:
            ws=self._sheet(create=True)
            _,current=self.read(key)
            if current!=expected_rev:raise ValueError(f'다른 버전이 이미 저장되어 있습니다: 서버 {current}, 작업 {expected_rev}')
            new=current+1
            digest=hashlib.sha256(raw).hexdigest()
            try:
                ws.append_row([key,str(new),encoded,digest,datetime.now(timezone.utc).isoformat()],value_input_option='RAW')
            except Exception as exc:
                # Network timeouts may have occurred after commit. Never retry blindly.
                try:
                    record,rev=self.read(key)
                    if rev==new and record==project:return rev
                except Exception: pass
                raise RuntimeError('저장 결과를 확정할 수 없습니다. 최신 버전을 먼저 조회하세요.') from exc
            record,observed=self.read(key)
            if observed!=new or record!=project:
                raise RuntimeError('기록 후 재조회가 일치하지 않습니다. 최신 시트를 확인하세요.')
            return new

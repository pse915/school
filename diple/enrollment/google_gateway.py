"""Google Sheets + Apps Script CAS document gateway for enrollment SQLite snapshots.

This adapter is EXPERIMENTAL until deployed with school credentials and stress
verified. A single shared signed write gateway serializes all writes and uses
inactive worksheet + ScriptProperties pointer as an atomic commit marker.
Every write CAS-checks the remote revision. Designed for modest load only.
"""
from __future__ import annotations
from contextlib import contextmanager
import base64
import hashlib
import hmac
import json
import secrets
import sqlite3
import time
import requests
from .repository import EnrollmentRepository,DDL,SCHEMA_VERSION
from .service import VersionConflict,EnrollmentError


class GoogleSheetsGatewayRepository(EnrollmentRepository):
    def __init__(self,url,shared_key,namespace='enrollment_v1',timeout=45):
        if not str(url).startswith('https://script.google.com/macros/s/') or not str(url).endswith('/exec'):
            raise EnrollmentError('운영 Apps Script HTTPS 웹앱 /exec 주소가 필요합니다.')
        if not shared_key or len(shared_key)<32:
            raise EnrollmentError('Apps Script 공유 키는 최소 32자 이상의 난수여야 합니다.')
        self.url=url;self.shared_key=shared_key.encode();self.namespace=namespace;self.timeout=timeout
        # First startup must initialize a durable schema; safe on concurrent starts.
        try:
            with self.tx(True) as db:
                db.executescript(DDL)
                db.execute('INSERT OR IGNORE INTO enrollment_meta VALUES (?,?)',('schema_version',str(SCHEMA_VERSION)))
        except VersionConflict:
            # A simultaneous worker committed the same initial schema.
            pass
        with self.tx() as db:
            row=db.execute("SELECT value FROM enrollment_meta WHERE name='schema_version'").fetchone()
            if not row or int(row['value'])!=SCHEMA_VERSION:
                raise EnrollmentError('Google Sheets 저장소 스키마 버전이 맞지 않습니다.')

    def _send(self,action,payload='',expected_revision=0):
        now=int(time.time());nonce=secrets.token_hex(16)
        digest=hashlib.sha256(payload.encode()).hexdigest()
        signed='\n'.join([action,self.namespace,str(now),nonce,str(expected_revision),digest]).encode()
        signature=hmac.new(self.shared_key,signed,hashlib.sha256).hexdigest()
        doc={'action':action,'namespace':self.namespace,'timestamp':now,'nonce':nonce,
             'expected_revision':expected_revision,'payload':payload,'signature':signature}
        try:
            response=requests.post(self.url,json=doc,timeout=self.timeout)
            response.raise_for_status()
            out=response.json()
        except (requests.RequestException,ValueError) as e:
            raise EnrollmentError('영구 저장 게이트웨이 연결 실패. 제출 여부를 재조회한 뒤 같은 요청 키로 재시도하세요.') from e
        if not isinstance(out,dict) or not out.get('ok'):
            kind=out.get('code','gateway') if isinstance(out,dict) else 'gateway'
            if kind=='revision_conflict':
                raise VersionConflict('동시 저장 충돌. 다른 학생의 제출을 덮어쓰지 않았습니다. 화면을 새로고침해 다시 시도하세요.')
            raise EnrollmentError('원격 저장 게이트웨이 오류: '+str(kind))
        return out

    def _load(self):
        doc=self._send('read')
        value=doc.get('payload','');rev=int(doc.get('revision',0))
        if value and hashlib.sha256(value.encode()).hexdigest()!=doc.get('payload_sha256'):
            raise EnrollmentError('원격 저장본 체크섬 불일치 — 데이터 사용을 중지했습니다.')
        raw=base64.b64decode(value,validate=True) if value else b''
        return raw,rev

    @contextmanager
    def tx(self,write=False):
        payload,revision=self._load()
        connection=sqlite3.connect(':memory:',isolation_level=None,check_same_thread=False)
        connection.row_factory=sqlite3.Row
        try:
            if payload:connection.deserialize(payload)
            connection.execute('PRAGMA foreign_keys=ON')
            connection.execute('BEGIN IMMEDIATE' if write else 'BEGIN')
            yield connection
            connection.commit()
            if write:
                serialized=connection.serialize()
                content=base64.b64encode(serialized).decode('ascii')
                self._send('write',content,revision)
        except Exception:
            try:connection.rollback()
            except sqlite3.Error:pass
            raise
        finally:connection.close()

    def run_read(self,sql,args=()):
        with self.tx() as db:
            return [dict(x) for x in db.execute(sql,args)]

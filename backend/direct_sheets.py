"""Direct service-account Sheets snapshots for ONE Streamlit writer process.

A shared process lock serializes every session for a document. Sheets batchUpdate
atomically replaces one snapshot, but provides no cross-host compare-and-swap.
Do not point another app/writer or a gateway at this store.
"""
from contextlib import contextmanager
import base64,hashlib,json,sqlite3,threading,uuid,time,os
from diple.enrollment.repository import EnrollmentRepository,DDL,SCHEMA_VERSION
from diple.enrollment.service import EnrollmentError,VersionConflict

_LOCKS={};_GUARD=threading.Lock();_CACHE={};_UNCERTAIN={}
MAX_PAYLOAD=12*1024*1024
CHUNK=30000

class DirectSheetsRepository(EnrollmentRepository):
    def __init__(self,client,spreadsheet_id,namespace):
        if any(int(os.environ.get(k,'1'))>1 for k in ('WEB_CONCURRENCY','STREAMLIT_WORKERS')):
            raise EnrollmentError('직접 시트 저장은 단일 Streamlit writer만 지원합니다. 다중 worker에서는 기존 게이트웨이를 사용하세요.')
        self.namespace=namespace
        self.cache_key=(spreadsheet_id,namespace)
        self.title='_DipleExt_'+namespace
        self.uncertain=self.cache_key in _UNCERTAIN
        with _GUARD:self.lock=_LOCKS.setdefault(spreadsheet_id,threading.RLock())
        try:
            self.sheet=client.open_by_key(spreadsheet_id)
            if self.sheet.id!=spreadsheet_id:raise EnrollmentError('확장 문서 ID 확인 실패')
            with self.lock:
                titles={s.title:s for s in self.sheet.worksheets()}
                # Switching from gateway storage is a data migration, never an empty init.
                if any(n.startswith('DIPLE5A_') for n in titles):
                    raise EnrollmentError('기존 게이트웨이 데이터가 있습니다. 자동 전환·초기화를 차단했습니다. 기존 연결을 유지하고 별도 데이터 이전 검증이 필요합니다.')
                self.ws=titles.get(self.title)
                if self.ws is None:self.ws=self.sheet.add_worksheet(title=self.title,rows=1000,cols=1)
                with self.tx('auto') as db:
                    db.executescript(DDL)
                    db.execute('INSERT OR IGNORE INTO enrollment_meta VALUES (?,?)',('schema_version',str(SCHEMA_VERSION)))
                with self.tx() as db:
                    row=db.execute("SELECT value FROM enrollment_meta WHERE name='schema_version'").fetchone()
                    if not row or int(row[0])!=SCHEMA_VERSION:raise EnrollmentError('확장 저장소 schema 버전 불일치')
        except EnrollmentError:raise
        except Exception as exc:raise EnrollmentError('확장 시트 연결 실패. 시트 주소와 기존 서비스 계정의 편집자 공유 권한을 확인하세요.') from exc

    def _load(self,fresh=False):
        cached=_CACHE.get(self.cache_key)
        if not fresh and not self.uncertain and cached and time.monotonic()-cached[0]<2:return cached[1]
        try:rows=self.ws.get_all_values()
        except Exception as exc:raise EnrollmentError('확장 시트 조회 실패. 연결 복구 후 다시 조회하세요.') from exc
        if not rows:
            value=(b'',0,'');_CACHE[self.cache_key]=(time.monotonic(),value);return value
        try:
            meta=json.loads(rows[0][0])
            if meta['format']!='diple-direct-v1' or meta['namespace']!=self.namespace:raise ValueError('format')
            count=int(meta['chunks']);revision=int(meta['revision'])
            if not 1<=revision or not 1<=count<1000:raise ValueError('metadata')
            payload=''.join(rows[i+1][0] for i in range(count))
            if len(payload)>MAX_PAYLOAD or hashlib.sha256(payload.encode()).hexdigest()!=meta['sha256']:raise ValueError('checksum')
            value=(base64.b64decode(payload,validate=True),revision,meta['request_id'])
            _CACHE[self.cache_key]=(time.monotonic(),value);return value
        except Exception as exc:raise EnrollmentError('확장 시트 저장본 형식·체크섬 오류. 자동 초기화하지 않습니다.') from exc

    def _commit(self,raw,revision):
        payload=base64.b64encode(raw).decode('ascii')
        if len(payload)>MAX_PAYLOAD:raise EnrollmentError('확장 저장본 용량 제한 초과. 기존 저장본은 유지했습니다.')
        request_id=uuid.uuid4().hex
        chunks=[payload[i:i+CHUNK] for i in range(0,len(payload),CHUNK)]
        meta={'format':'diple-direct-v1','namespace':self.namespace,'revision':revision+1,'chunks':len(chunks),'sha256':hashlib.sha256(payload.encode()).hexdigest(),'request_id':request_id}
        values=[json.dumps(meta,separators=(',',':'))]+chunks
        request={'requests':[{'updateCells':{'range':{'sheetId':self.ws.id,'startRowIndex':0,'endRowIndex':self.ws.row_count,'startColumnIndex':0,'endColumnIndex':1},'rows':[{'values':[{'userEnteredValue':{'stringValue':v}}]} for v in values],'fields':'userEnteredValue'}}]}
        try:self.sheet.batch_update(request)
        except Exception as exc:
            # Reconcile a lost response; NEVER blindly replay a snapshot write.
            try:
                saved,rev,key=self._load(True)
                if key==request_id and rev==revision+1 and saved==raw:return
            except Exception:pass
            self.uncertain=True;_UNCERTAIN[self.cache_key]=(request_id,revision+1,hashlib.sha256(raw).hexdigest())
            raise EnrollmentError('저장 응답이 불확실합니다. 자동 재저장하지 않습니다. 새로 조회하여 제출·확정 상태를 확인하세요.') from exc
        try:saved,rev,key=self._load(True)
        except Exception:
            self.uncertain=True;_UNCERTAIN[self.cache_key]=(request_id,revision+1,hashlib.sha256(raw).hexdigest())
            raise
        if key!=request_id or rev!=revision+1 or saved!=raw:
            self.uncertain=True;_UNCERTAIN[self.cache_key]=(request_id,revision+1,hashlib.sha256(raw).hexdigest())
            raise VersionConflict('저장 후 다른 쓰기가 감지되었습니다. 여러 앱의 동시 쓰기를 중지하고 재조회하세요.')

    @contextmanager
    def tx(self,write=False):
        with self.lock:
            pending=_UNCERTAIN.get(self.cache_key)
            raw,revision,key=self._load(fresh=bool(write) or bool(pending))
            if pending and (key,revision,hashlib.sha256(raw).hexdigest())==pending:
                _UNCERTAIN.pop(self.cache_key,None)
            self.uncertain=self.cache_key in _UNCERTAIN
            if write is True and self.uncertain:raise EnrollmentError('이 문서의 저장 결과 확인이 필요합니다. 이전 요청의 저장 ID가 확인될 때까지 모든 세션의 쓰기를 차단합니다.')
            db=sqlite3.connect(':memory:',isolation_level=None,check_same_thread=False);db.row_factory=sqlite3.Row
            try:
                if raw:db.deserialize(raw)
                initial=db.serialize() if raw else b''
                db.execute('PRAGMA foreign_keys=ON')
                if write!='auto':db.execute('BEGIN IMMEDIATE' if write else 'BEGIN')
                yield db
                db.commit()
                if write:
                    after=db.serialize()
                    if write=='auto' and after==initial:return
                    if self.cache_key in _UNCERTAIN:raise EnrollmentError('이전 저장 결과 확인이 필요하여 쓰기를 차단합니다.')
                    current,rev,_=self._load(True)
                    if rev!=revision or current!=raw:raise VersionConflict('확장 시트가 변경되었습니다. 최신 자료를 다시 조회하세요.')
                    self._commit(after,revision)
            except Exception:
                try:db.rollback()
                except sqlite3.Error:pass
                raise
            finally:db.close()

    def run_read(self,sql,args=()):
        with self.tx() as db:return [dict(r) for r in db.execute(sql,args)]

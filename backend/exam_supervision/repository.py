"""Persistent configuration, changed-cell batches, and single-writer ownership.

Google Sheets has no CAS primitive. Fingerprints detect changes before/after
saving. The compatible GAS gate excludes the other application; human editors
must pause edits during a save. Multi-sheet changes use one atomic batchUpdate.
"""
import copy
import hashlib
import json
import re
import threading
from contextlib import contextmanager
from .engine import require,clean
from .models import HEADERS,SH,check_headers,column_map,normalize_rows
CONFIG_SHEET='시험감독_통합설정';CONFIG_HEADERS=['설정키','JSON 또는 값'];PROTOCOL='single-writer-v1'
LOCKS={};GUARD=threading.Lock()
DEFAULT_EXAM_SPREADSHEET_ID='1VhT7PD44DCa7qja3Li4ZxT9u3v1-w1Ty4b7yFAiS9yA'
def fingerprint(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,separators=(',',':'),sort_keys=True).encode()).hexdigest()
def spreadsheet_id(value):
    text=clean(value);m=re.fullmatch(r'https://docs\.google\.com/spreadsheets/d/([A-Za-z0-9_-]{20,})(?:/[^\s]*)?(?:\?[^\s]*)?',text)
    if m:return m[1]
    require(re.fullmatch(r'[A-Za-z0-9_-]{20,}',text),'Google Sheets 주소 또는 스프레드시트 ID를 입력하세요.');return text
def entered(v):
    if type(v) is bool:return {'boolValue':v}
    if type(v) in (float,int):return {'numberValue':v}
    return {'stringValue':str(v)} if v not in ('',None) else {}
class SaveUncertain(RuntimeError):pass
class Conflict(RuntimeError):pass

class Repository:
    def __init__(self,app):
        self.app=app;self.book=None;self.tables={};self.baseline=None;self.uncertain=False;self.configuration=None;self.config_baseline=None;self.metadata={}
    def client(self):return self.app.program.namespace['get_gspread_client']()
    def work_id(self):return self.app.repo.settings.get('work_sheet_id') or self.app.program.namespace['WORK_SHEET_ID']
    def writable(self):require(self.app.repo.writable,'현재 앱은 읽기 전용입니다. 기존 migration.allow_writes 설정을 확인하세요.')
    @contextmanager
    def lock(self):
        with GUARD:lock=LOCKS.setdefault(self.book.id,threading.RLock())
        with lock:yield
    def load_config(self):
        book=self.client().open_by_key(self.work_id());meta=book.fetch_sheet_metadata();exists=any(s['properties']['title']==CONFIG_SHEET for s in meta['sheets'])
        rows=book.values_get("'"+CONFIG_SHEET+"'!A:B").get('values',[]) if exists else []
        if rows:require(rows[0][:2]==CONFIG_HEADERS,'시험감독 통합설정 열 제목 오류')
        pairs={r[0]:r[1] for r in rows[1:] if len(r)>1}
        try:config=json.loads(pairs.get('connection','{}'))
        except ValueError as exc:raise ValueError('시험감독 연결 설정 JSON이 손상되었습니다. 자동 덮어쓰기를 중단했습니다.') from exc
        require(isinstance(config,dict),'시험감독 연결 설정 형식 오류')
        if not config.get('spreadsheetId'):
            config={**config,'spreadsheetId':self.app.repo.settings.get('exam_spreadsheet_id') or DEFAULT_EXAM_SPREADSHEET_ID}
        self.config_baseline=fingerprint(rows);self.configuration=config;return config
    @staticmethod
    def diff_requests(props,rows,old,width):
        def text(v):return str(v).upper() if type(v) is bool else str(int(v)) if type(v) in (float,int) and float(v).is_integer() else str(v) if v is not None else ''
        requests=[]
        for i in range(max(len(rows),len(old))):
            before=old[i] if i<len(old) else [];after=rows[i] if i<len(rows) else [];col=0
            while col<width:
                a=after[col] if col<len(after) else '';b=before[col] if col<len(before) else ''
                if text(a)==text(b):col+=1;continue
                start=col;values=[]
                while col<width:
                    a=after[col] if col<len(after) else '';b=before[col] if col<len(before) else ''
                    if text(a)==text(b):break
                    values.append({'userEnteredValue':entered(a)});col+=1
                requests.append({'updateCells':{'range':{'sheetId':props['sheetId'],'startRowIndex':i,'endRowIndex':i+1,'startColumnIndex':start,'endColumnIndex':col},'rows':[{'values':values}],'fields':'userEnteredValue'}})
        return requests
    def save_config(self,config):
        self.writable();book=self.client().open_by_key(self.work_id());meta=book.fetch_sheet_metadata();tab=next((s['properties'] for s in meta['sheets'] if s['properties']['title']==CONFIG_SHEET),None)
        rows=book.values_get("'"+CONFIG_SHEET+"'!A:B").get('values',[]) if tab else []
        require(self.config_baseline is not None and self.config_baseline==fingerprint(rows),'연결 설정이 변경되었습니다. 다시 불러오세요.')
        new=copy.deepcopy(rows or [CONFIG_HEADERS]);found=False
        for r in new[1:]:
            if r and r[0]=='connection':r[:]=['connection',json.dumps(config,ensure_ascii=False)];found=True
        if not found:new.append(['connection',json.dumps(config,ensure_ascii=False)])
        requests=[]
        if tab is None:
            ids={s['properties']['sheetId'] for s in meta['sheets']};sid=1
            while sid in ids:sid+=1
            tab={'sheetId':sid};requests.append({'addSheet':{'properties':{'sheetId':sid,'title':CONFIG_SHEET,'gridProperties':{'rowCount':100,'columnCount':2}}}})
        requests+=self.diff_requests(tab,new,rows,2)
        try:book.batch_update({'requests':requests})
        except Exception as exc:raise SaveUncertain('연결 설정 저장 응답을 확인하지 못했습니다. 설정을 다시 불러오세요.') from exc
        self.configuration=config;self.config_baseline=fingerprint(new)
    def connect(self,sid):
        sid=spreadsheet_id(sid);ns=self.app.program.namespace
        reserved={ns['TIMETABLE_SHEET_ID'],ns['WORK_SHEET_ID'],self.work_id(),self.app.repo.settings.get('timetable_sheet_id')}
        require(sid not in reserved,'시간표·업무 시트와 별도의 시험감독 스프레드시트를 선택하세요.')
        self.book=self.client().open_by_key(sid);self.reload();return self.status()
    def read_all(self):
        meta=self.book.fetch_sheet_metadata();self.metadata={s['properties']['title']:s['properties'] for s in meta['sheets']};names=[n for n in [*HEADERS,'수업시간표'] if n in self.metadata]
        ranges=["'"+n.replace("'","''")+"'" for n in names]
        values=self.book.values_batch_get(ranges,params={'valueRenderOption':'FORMATTED_VALUE'}).get('valueRanges',[]) if names else []
        require(len(values)==len(names),'시트 일괄 조회 응답이 불완전합니다.');return {n:v.get('values',[]) for n,v in zip(names,values)}
    def reload(self):self.tables=self.read_all();self.baseline=fingerprint(self.tables);self.uncertain=False;return self.tables
    def status(self):
        pairs={clean(r[0]):clean(r[1]) for r in self.tables.get(SH['settings'],[])[1:] if len(r)>1}
        return dict(name=self.book.title,id=self.book.id,url=self.book.url,errors=check_headers(self.tables),missing=[n for n in HEADERS if n not in self.tables],protocol=pairs.get('_integration_protocol',''),writer=pairs.get('_integration_writer','GAS'),pauseUntil=pairs.get('_integration_pause_until',''),nextWriter=pairs.get('_integration_next_writer',''),uncertain=self.uncertain)
    def commit(self,changes,allow_handoff=False,initialize=False):
        self.writable();require(self.book is not None,'시험감독 시트를 연결하세요.');require(not self.uncertain,'이전 저장 결과를 확인하지 못했습니다. 최신 자료를 다시 불러오세요.')
        require(changes and set(changes)<=set(HEADERS),'허용되지 않은 시험감독 시트 쓰기')
        with self.lock():
            latest=self.read_all()
            if fingerprint(latest)!=self.baseline:raise Conflict('시트 또는 다른 창에서 데이터가 변경되었습니다. 입력을 보존했습니다. 최신 자료를 확인하세요.')
            # Ownership can be repaired before other sheets are initialized.
            if allow_handoff:require(set(changes)=={SH['settings']},'저장 주체 전환은 감독설정만 변경할 수 있습니다.')
            if not initialize:
                errors=check_headers({SH['settings']:latest.get(SH['settings'],[])}) if allow_handoff else check_headers(latest)
                require(not errors,'시트 헤더 오류: '+'; '.join(errors))
            if not allow_handoff and not initialize:
                status=self.status();require(status['protocol']==PROTOCOL and status['writer']=='STREAMLIT','통합본에 저장 권한이 없습니다. 저장 주체를 먼저 전환하세요.')
            requests=[];used={p['sheetId'] for p in self.metadata.values()}
            for name,rows in changes.items():
                old=latest.get(name,[]);head=HEADERS[name];require(rows and (rows[0][:len(head)]==head or name in (SH['roster'],SH['classes'])),'저장 헤더 오류: '+name)
                props=self.metadata.get(name);width=max(len(head),len(rows[0]))
                if name==SH['print']:width=max(width,max((len(r) for r in rows),default=2),max((len(r) for r in old),default=2))
                if props is None:
                    sid=1
                    while sid in used:sid+=1
                    used.add(sid);grid={'rowCount':max(100,len(rows)),'columnCount':max(26,width)};props={'sheetId':sid,'gridProperties':grid}
                    requests.append({'addSheet':{'properties':{'sheetId':sid,'title':name,'gridProperties':grid}}})
                else:
                    grid=props['gridProperties'];needed={}
                    if max(len(old),len(rows))>grid['rowCount']:needed['rowCount']=max(len(old),len(rows))
                    if width>grid['columnCount']:needed['columnCount']=width
                    if needed:requests.append({'updateSheetProperties':{'properties':{'sheetId':props['sheetId'],'gridProperties':needed},'fields':','.join('gridProperties.'+k for k in needed)}})
                requests+=self.diff_requests(props,rows,old,width)
            try:
                if requests:self.book.batch_update({'requests':requests})
                saved=self.read_all()
                for name,rows in changes.items():require(normalize_rows(saved.get(name,[]))==normalize_rows(rows),'저장 후 검증 실패: '+name)
                self.tables=saved;self.baseline=fingerprint(saved);self.app.repo.write_count+=1
            except Exception as exc:
                self.uncertain=True;raise SaveUncertain('저장 응답 또는 저장 후 검증을 확인하지 못했습니다. 재저장 전에 최신 자료를 불러와 결과를 확인하세요.') from exc
        return self.tables
    def initialize(self):
        self.writable();changes={};tables=self.tables
        for name,head in HEADERS.items():
            if not tables.get(name):changes[name]=[head]
        for name in (SH['roster'],SH['classes']):
            if name in changes:continue
            rows=copy.deepcopy(tables[name]);cols=column_map(rows[0])
            for field in HEADERS[name]:
                if cols.get(field,-1)<0:rows[0].append(field)
            if rows!=tables[name]:changes[name]=rows
        rules=tables.get(SH['rules'],[])
        if rules and rules[0][:7]==['교사명','규칙','날짜','요일','교시','수업학급','사유']:
            require(len(rules[0])<8 or rules[0][7] in ('','종료일'),'교사감독규칙 H열에 다른 데이터가 있습니다.');updated=copy.deepcopy(rules);updated[0]=HEADERS[SH['rules']]+updated[0][8:];changes[SH['rules']]=updated
        require(not check_headers({**tables,**changes}),'기존 시트 열 제목이 다릅니다. 자동 덮어쓰기를 중단했습니다.')
        if changes:self.commit(changes,initialize=True)
        return self.status()

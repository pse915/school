"""Optimistic sheet revisions without changing names, columns or value format."""
import hashlib
import json
import threading
from contextlib import contextmanager

_locks = {}
_locks_guard = threading.Lock()
ALLOWED = {'교사정보','시간표','결강','보강','맞교환','시간강사','누적보강','복무','예산','수업교체신청','아이디저장함','아이디추가요청'}

def revision(values):
    return hashlib.sha256(json.dumps(values,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

class SheetConflict(RuntimeError):
    pass

class SheetRepository:
    def __init__(self, program, settings=None):
        self.program = program
        self.settings = settings or {}
        self.baselines = {}
        self.uncertain = set()
        self.write_count=0
        self.original_save = program.namespace['df_to_worksheet']
        program.namespace['get_worksheet'] = self.get
        program.namespace['df_to_worksheet'] = self.save

    @property
    def writable(self):
        return self.settings.get('allow_writes',False) is True

    def get(self, spreadsheet_id, title):
        if title not in ALLOWED:
            raise ValueError('원본에 없는 워크시트입니다.')
        ns=self.program.namespace
        if spreadsheet_id==ns['TIMETABLE_SHEET_ID']:
            spreadsheet_id=self.settings.get('timetable_sheet_id') or spreadsheet_id
        elif spreadsheet_id==ns['WORK_SHEET_ID']:
            spreadsheet_id=self.settings.get('work_sheet_id') or spreadsheet_id
        state=self.program.port.session_state
        key=f'{spreadsheet_id}:{title}'
        cache=state.setdefault('_react_worksheets',{})
        if key not in cache:
            try:
                client=ns['get_gspread_client']()
                sheet=client.open_by_key(spreadsheet_id)
                raw=sheet.worksheet(title)
                cache[key]=TrackedWorksheet(raw,key,self)
            except Exception as exc:
                state['_gsheet_last_error']=str(exc)
                return None
        return cache[key]

    def save(self, worksheet, df):
        if not self.writable:
            raise PermissionError('현재 앱은 읽기 전용입니다. 관리자에게 저장 설정을 요청하세요.')
        if not isinstance(worksheet,TrackedWorksheet):
            raise RuntimeError('검증된 워크시트만 저장할 수 있습니다.')
        key=worksheet.key
        with _locks_guard:
            lock=_locks.setdefault(key,threading.RLock())
        with lock:
            if key in self.uncertain:
                raise SheetConflict('이전 저장의 결과를 확인하지 못했습니다. 최신 데이터를 다시 불러온 뒤 확인하세요.')
            latest=worksheet.raw.get_all_values()
            if key not in self.baselines:
                raise SheetConflict('저장 전 원본 시트 조회가 필요합니다. 최신 데이터를 불러오세요.')
            if revision(latest)!=self.baselines[key]:
                raise SheetConflict('다른 사용자가 시트를 수정했습니다. 입력값을 보존한 뒤 최신 데이터를 다시 불러오세요.')
            try:
                result=self.original_save(worksheet.raw,df)
                self.baselines[key]=revision(worksheet.raw.get_all_values())
                self.write_count+=1
                return result
            except Exception:
                self.uncertain.add(key)
                raise

class TrackedWorksheet:
    def __init__(self,raw,key,repo):
        self.raw,self.key,self.repo=raw,key,repo
    def get_all_values(self):
        values=self.raw.get_all_values()
        self.repo.baselines.setdefault(self.key,revision(values))
        return values
    def __getattr__(self,name):
        return getattr(self.raw,name)

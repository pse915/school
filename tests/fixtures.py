"""Synthetic fixtures used exclusively by tests. Never imported by app entrypoint."""
import copy
import uuid
from datetime import date
import pandas as pd
from backend.services.application import Application

class MemoryWorksheet:
    def __init__(self, values=None):
        self.values=copy.deepcopy(values or [])
        self.row_count=2000; self.col_count=40; self.writes=0
    def get_all_values(self): return copy.deepcopy(self.values)
    def update(self,range_name,values,value_input_option=None):
        assert range_name=='A1' and value_input_option=='USER_ENTERED'
        self.values=copy.deepcopy(values);self.writes+=1
    def clear(self): self.values=[];self.writes+=1
    def batch_clear(self,ranges): pass

class MemorySpreadsheet:
    def __init__(self,worksheets): self.worksheets=worksheets
    def worksheet(self,title): return self.worksheets[title]
    def fetch_sheet_metadata(self):
        return {'sheets':[{'properties':{'title':name,'sheetId':i,'gridProperties':{'rowCount':2000,'columnCount':40}}} for i,name in enumerate(self.worksheets)]}

class MemoryClient:
    def __init__(self,sheets):self.sheets=sheets
    def open_by_key(self,spreadsheet_id): return MemorySpreadsheet(self.sheets)

def make_application(role='마스터', allowed='', readonly=False):
    app=Application(secrets={'NEIS_API_KEY':'TEST-KEY'},settings={'allow_writes':not readonly})
    ns=app.program.namespace
    sheets={name:MemoryWorksheet() for name in ['교사정보','시간표','결강','보강','맞교환','시간강사','누적보강','복무','예산','수업교체신청','아이디저장함','아이디추가요청']}
    sheets['교사정보']=MemoryWorksheet([['교사명','담당과목'],['테스트가','국어'],['테스트나','수학'],['테스트다','국어'],['테스트라','영어']])
    sheets['시간표']=MemoryWorksheet([['교사명','요일','교시','과목','학급'],
        ['테스트가','월','1','국어','1-1'],['테스트나','화','2','수학','1-1'],['테스트다','월','2','국어','1-2'],['테스트라','월','3','영어','3-1'],
        ['테스트가','수','1','국어','1-1'],['테스트나','목','2','수학','1-1'],['테스트다','금','2','국어','1-2']])
    sheets['아이디저장함']=MemoryWorksheet([['아이디','이름','권한','허용탭'],['tester','테스트가',role,allowed],['admin','테스트나','마스터','']])
    sheets['예산']=MemoryWorksheet([['일시','내용','변동금액','잔액'],['2026-10-01 09:00:00','테스트 예산','2200000','2200000']])
    client=MemoryClient(sheets)
    ns['get_gspread_client']=lambda:client
    ns['get_gspread_client'].clear=lambda:None
    def neis(*args,**kwargs):return ns['_neis_schedule_empty_df']()
    neis.clear=lambda:None
    ns['neis_fetch_schedule']=neis
    ns['neis_find_school'].clear=lambda:None
    ns['_today_kst']=lambda:date(2026,10,12)
    app.initialize()
    return app,sheets

def request(app,operation,payload,rid=None):
    return {'operation':operation,'requestId':rid or str(uuid.uuid4()),'payload':payload,'dataVersion':str(app.version)}

def command(app,operation,payload):return app.dispatch(request(app,operation,payload))

def click(app,label,values=None):
    matches=[k for k,v in app.port.controls.items() if v['node'].get('label')==label]
    assert matches, f'Missing {label}. Controls: '+str([s['node'].get('label') for s in app.port.controls.values()])
    return command(app,'control',{'control':matches[0],'values':values or {}})

def login(app):
    control=next(k for k,v in app.port.controls.items() if v['node'].get('label')=='아이디')
    return click(app,'로그인',{control:'tester'})

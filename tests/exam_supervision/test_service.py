import copy,json,time
import pytest
from backend.exam_supervision import engine as E
from backend.exam_supervision.models import HEADERS,SH,model,normalize_rows,read_state,date_text,clock_text
from backend.exam_supervision.repository import PROTOCOL,Conflict,SaveUncertain,Repository,spreadsheet_id
from backend.exam_supervision.service import Service,TAB
from backend.exam_supervision.view import PAGES
from tests.fixtures import make_application,login

class Book:
    id='synthetic-exam-spreadsheet-2026';title='합성 시험감독';url='https://docs.google.com/spreadsheets/d/'+id
    def __init__(self):
        self.tables={n:[copy.deepcopy(h)] for n,h in HEADERS.items()};self.ids={n:i+1 for i,n in enumerate(self.tables)};self.batches=[];self.fail_after=False;self.failed=False
        self.tables[SH['roster']]+=[[str(i),'테스트가' if i==1 else '교사'+str(i),'역사','','','O','O','O'] for i in range(1,9)]
        self.tables[SH['classes']]+=[[1,1],[1,2]]
        self.tables[SH['schedule']]+=[[1,'2026-11-23',p,1,c,f'1-{c}','EXAM' if p==1 else 'STUDY','국어' if p==1 else '','',''] for p in (1,2) for c in (1,2)]
        self.tables[SH['teaching']]+=[[r[1],'수업없음','','','',''] for r in self.tables[SH['roster']][1:]]
        s=E.default_state();s['editableMigration']=1
        self.tables[SH['settings']]+=[['state',json.dumps(s)],['_integration_protocol',PROTOCOL],['_integration_writer','STREAMLIT']]
    def fetch_sheet_metadata(self):
        if self.failed:raise OSError('lost response')
        return {'sheets':[{'properties':dict(title=n,sheetId=i,gridProperties=dict(rowCount=2000,columnCount=40))} for n,i in self.ids.items()]}
    def values_batch_get(self,ranges,params=None):return {'valueRanges':[{'values':normalize_rows(self.tables[r.strip("'")])} for r in ranges]}
    def values_get(self,ran):return {'values':normalize_rows(self.tables[ran.split('!')[0].strip("'")])}
    def batch_update(self,body):
        stage=copy.deepcopy(self.tables)
        for q in body['requests']:
            if 'addSheet' in q:
                p=q['addSheet']['properties'];self.ids[p['title']]=p['sheetId'];stage[p['title']]=[]
            if 'updateCells' not in q:continue
            q=q['updateCells'];rg=q['range'];n=next(n for n,i in self.ids.items() if i==rg['sheetId']);r=rg['startRowIndex'];c=rg['startColumnIndex']
            for row in q['rows']:
                while len(stage[n])<=r:stage[n].append([])
                for v in row['values']:
                    while len(stage[n][r])<=c:stage[n][r].append('')
                    v=v.get('userEnteredValue',{});stage[n][r][c]=next(iter(v.values()),'');c+=1
                r+=1
        self.tables=stage;self.batches.append(body)
        if self.fail_after:self.failed=True;raise OSError('response lost after commit')
        return {}

def setup(role='마스터',readonly=False,all_view=False):
    app,_=make_application(role,allowed=TAB,readonly=readonly);login(app);s=Service(app);b=Book();s.repo.book=b;s.repo.configuration=dict(teacherView=True,teacherAll=all_view);s.repo.reload();app._exam_service=s;return app,s,b

def assignments(s):
    c=model(s.repo.tables,True)['ctx'];r=E.solve(c,2026,200);assert r['ok'];return r['assignments']
def save(s,arr=None):return s.handle('saveAssignments',{**s.token_payload(),'assignments':assignments(s) if arr is None else arr})

def test_atomic_publication_and_read_only_archives():
    _,s,b=setup();old=copy.deepcopy(b.tables[SH['versions']]);save(s)
    assert len(b.batches)==1
    assert all(len(b.tables[SH[k]])>1 for k in ('draft','result','stats','print','history'))
    assert model(s.repo.tables,True)['ctx'].validate(model(s.repo.tables)['draft'])['valid']
    assert b.tables[SH['versions']]==old

def test_external_edit_conflict():
    _,s,b=setup();a=assignments(s);b.tables[SH['roster']][1][2]='외부수정'
    with pytest.raises(Conflict):save(s,a)
    assert not b.batches and b.tables[SH['roster']][1][2]=='외부수정'

def test_uncertain_save_requires_reload():
    _,s,b=setup();a=assignments(s);b.fail_after=True
    with pytest.raises(SaveUncertain):save(s,a)
    assert s.repo.uncertain and len(b.batches)==1
    with pytest.raises(ValueError,match='이전 저장'):save(s,a)
    b.failed=False;b.fail_after=False;s.reload();assert not s.repo.uncertain

@pytest.mark.parametrize('action',['saveAssignments','saveClasses','repair'])
def test_teacher_rejects_admin_requests(action):
    _,s,b=setup(role='일반교사')
    with pytest.raises(PermissionError):s.handle(action,s.token_payload())
    assert not b.batches

def test_teacher_own_scope():
    _,s,_=setup(role='일반교사');assert s.handle('getTeacher')['teacher']['id']=='1'
    with pytest.raises(ValueError,match='자신의'):s.handle('getTeacher',{'teacherId':'2'})

def test_readonly_cannot_initialize_or_save():
    _,s,b=setup(readonly=True)
    with pytest.raises(ValueError,match='읽기 전용'):s.initialize()
    with pytest.raises(ValueError,match='읽기 전용'):save(s)
    assert not b.batches

def test_stale_revision():
    _,s,b=setup()
    with pytest.raises(ValueError,match='오래된'):s.handle('saveAssignments',dict(revision=99,dataToken=s.repo.baseline,assignments=assignments(s)))
    assert not b.batches

def test_identity_change_denied():
    app,s,b=setup();app.port.session_state['user_id']='someoneelse'
    with pytest.raises(PermissionError):s.handle('getAdminData')
    assert s.repo.book is None and not b.batches

@pytest.mark.parametrize('page',PAGES)
def test_all_pages_render_in_existing_react_bridge(page):
    app,s,b=setup();app.port.session_state.update(active_tab=TAB,exam_page=page);app._render()
    serialized=json.dumps(app.port.nodes,ensure_ascii=False,default=str)
    assert '시험감독 화면' in serialized
    assert 'Traceback' not in serialized and 'iframe' not in serialized.lower() and '작업을 실행하지 못했습니다:' not in serialized

def test_manual_subject_violation_rejected():
    _,s,b=setup();a=assignments(s);s.repo.tables[SH['roster']][1][2]='국어';b.tables[SH['roster']][1][2]='국어';s.repo.reload();a[0]['teacherId']='1'
    with pytest.raises(ValueError,match='동일교과'):save(s,a)
    assert not b.batches

def test_background_result_requires_explicit_apply():
    _,s,b=setup();s.start_job('generate',{**s.token_payload(),'seed':2026,'budgetMs':200});s.job['future'].result(timeout=10)
    assert s.job_status()['result']['ok'] and not b.batches
    s.apply_job();assert len(b.batches)==1

def test_background_result_rejects_external_edit():
    _,s,b=setup();s.start_job('generate',{**s.token_payload(),'seed':2026,'budgetMs':200});s.job['future'].result(timeout=10);b.tables[SH['roster']][1][2]='외부수정'
    with pytest.raises(Conflict):s.apply_job()
    assert not b.batches

def test_manual_result_edit_is_read_without_writes_and_preserved():
    _,s,b=setup();save(s);b.tables[SH['result']][1][9],b.tables[SH['result']][1][10]=b.tables[SH['result']][1][10],b.tables[SH['result']][1][9]
    s.reload();m=model(s.repo.tables,True);assert m['draftSource']=='result';before=len(b.batches);s.handle('getConfirmed');assert len(b.batches)==before
    save(s,m['draft']);assert model(s.repo.tables)['draftSource']=='draft'

def test_handoff_barrier():
    _,s,b=setup();b.tables[SH['settings']][-1][1]='GAS';s.repo.reload();s.handoff('STREAMLIT');assert s.repo.status()['writer']=='PAUSED'
    with pytest.raises(ValueError,match='대기'):s.handoff('STREAMLIT')
    for r in b.tables[SH['settings']]:
        if r[0]=='_integration_pause_until':r[1]='0'
    s.repo.reload();s.handoff('STREAMLIT');assert s.repo.status()['writer']=='STREAMLIT'

def test_corrupt_state_and_empty_teaching_fail_closed():
    _,s,b=setup();b.tables[SH['settings']][1][1]='{bad';s.repo.reload()
    with pytest.raises(ValueError,match='손상'):s.handle('getAdminData')
    _,s,b=setup();b.tables[SH['teaching']]=[HEADERS[SH['teaching']]];s.repo.reload()
    with pytest.raises(ValueError):assignments(s)

def test_diff_preserves_unchanged_custom_cells_and_never_executes_formula():
    p=dict(sheetId=1);q=Repository.diff_requests(p,[['번호','사용자열'],['1','=IMPORTXML("x")']],[['번호','사용자열'],['1','original']],2)
    assert len(q)==1 and q[0]['updateCells']['range']['startColumnIndex']==1
    assert q[0]['updateCells']['rows'][0]['values'][0]['userEnteredValue']=={'stringValue':'=IMPORTXML("x")'}

@pytest.mark.parametrize('text,expected',[('2026. 11. 23.','2026-11-23'),('11/23/2026','2026-11-23'),('2026년11월23일','2026-11-23')])
def test_date_compatibility(text,expected):assert date_text(text)==expected

def test_sheet_url_validation():
    assert spreadsheet_id(Book.url)==Book.id
    with pytest.raises(ValueError):spreadsheet_id('https://evil.test/abc')

def test_existing_dispatch_deduplicates_exam_save_requests():
    from tests.fixtures import request
    app,s,b=setup();req=request(app,'exam.saveAssignments',{**s.token_payload(),'assignments':assignments(s)})
    app.dispatch(req);assert app.response['success'],app.response
    app.dispatch(req);assert app.response['success'] and len(b.batches)==1

def test_roleswap_and_swap_revalidate_and_record_history():
    _,s,b=setup();save(s);a=model(s.repo.tables)['draft'];x,y=next((x,y) for x in a for y in a if x['role']=='MAIN' and y['role']=='ASSIST' and x['classId']==y['classId'] and x['period']==y['period'])
    s.handle('roleSwap',{**s.token_payload(),'key1':x['key'],'key2':y['key']});new={r['key']:r for r in model(s.repo.tables)['draft']}
    assert new[x['key']]['teacherId']==y['teacherId'] and new[y['key']]['fixed']
    assert len(b.batches)==2 and len(b.tables[SH['history']])>2

@pytest.mark.parametrize('action,rows',[
 ('saveClasses',[dict(grade=1,classNo=1),dict(grade=1,classNo=2)]),
 ('saveUnavailable',[dict(teacherId='1',date='2026-11-23',period=2,reason='출장')]),
 ('saveVisiting',[dict(teacherName='테스트가',type='타교출강',date='2026-11-23',weekday='월',period=1,location='타교',note='출강')]),
 ('saveTeachingRules',[dict(teacherName='테스트가',mode='제외',startDate='2026-11-23',endDate='2026-11-24',weekday='',period='',classId='',reason='출장 일정')]),
 ('saveTeaching',[dict(teacherName='테스트가',weekday='수업없음',period='',subject='',classId='',subjectGroup='')]),
])
def test_condition_tables_save_atomically(action,rows):
    _,s,b=setup();s.handle(action,{**s.token_payload(),'rows':rows});assert len(b.batches)==1 and read_state(s.repo.tables)['revision']==1

def test_persistent_connection_configuration_roundtrip():
    _,s,b=setup();from backend.exam_supervision.repository import CONFIG_SHEET
    class Client:
        def open_by_key(self,key):return b
    s.repo.client=lambda:Client();assert s.repo.load_config()=={}
    cfg=dict(spreadsheetId=b.id,teacherView=True,teacherAll=False);s.repo.save_config(cfg)
    new=Repository(s.app);new.client=lambda:Client();assert new.load_config()==cfg
    assert CONFIG_SHEET in b.tables

def test_roster_save_keeps_custom_column_and_explicit_deletions():
    _,s,b=setup();b.tables[SH['roster']][0].append('사용자열');b.tables[SH['roster']][1].append('수식의 표시값');s.repo.reload()
    teachers=model(s.repo.tables)['ctx'].teachers;rows=[dict(originalId=t['id'],id=t['id'],name=t['name'],subjectsText='역사',crossSubjectsText='',homeroom='',MAIN='O',ASSIST='O',STUDY='O') for t in teachers]
    rows[0]['crossSubjectsText']='영어';s.handle('saveRoster',{**s.token_payload(),'rows':rows,'deletedTeacherIds':[]})
    assert b.tables[SH['roster']][1][-1]=='수식의 표시값'
    roster_id=b.ids[SH['roster']];assert all(q.get('updateCells',{}).get('range',{}).get('startColumnIndex')!=8 for q in b.batches[-1]['requests'] if q.get('updateCells',{}).get('range',{}).get('sheetId')==roster_id)
    with pytest.raises(ValueError,match='명시'):s.handle('saveRoster',{**s.token_payload(),'rows':rows[:-1],'deletedTeacherIds':[]})

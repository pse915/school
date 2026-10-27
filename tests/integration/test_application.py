import base64
import hashlib
import uuid
from datetime import date
import pandas as pd
import pytest
from tests.fixtures import make_application,login,click,request,command
from backend.repositories.sheets import SheetConflict

def test_real_login_and_all_twelve_menu_render_paths():
    app,_=make_application();login(app)
    ns=app.program.namespace
    for tab in ns['ALL_APP_TABS']:
        snapshot=command(app,'navigate',{'tab':tab})
        assert snapshot['response']['success'],(tab,snapshot['response'])
        errors=[n['label'] for n in app._walk(snapshot['nodes']) if n['kind']=='error']
        assert not errors,(tab,errors)
        assert snapshot['activeTab']==tab

def test_guest_does_not_gain_admin_from_forged_action():
    app,_=make_application();click(app,'게스트로 입장')
    result=command(app,'navigate',{'tab':'🔑 아이디·권한 관리'})
    assert not result['response']['success']
    result=command(app,'control',{'control':'id_editor','values':{'user_role':'마스터'}})
    assert not result['response']['success']

def test_teacher_admin_menu_denied_even_with_explicit_allowed_tabs():
    app,_=make_application(role='일반교사',allowed='🔑 아이디·권한 관리,시간표 조회');login(app)
    result=command(app,'navigate',{'tab':'🔑 아이디·권한 관리'})
    assert not result['response']['success']

def test_deleted_user_revalidated_before_request():
    app,sheets=make_application();login(app)
    sheets['아이디저장함'].values=sheets['아이디저장함'].values[:1]+sheets['아이디저장함'].values[2:]
    result=command(app,'navigate',{'tab':'교무호봉획정'})
    assert not result['response']['success'] and not result['loggedIn']

def test_duplicate_request_is_not_written_twice():
    app,sheets=make_application()
    form_fields={spec['node']['label']:key for key,spec in app.port.controls.items()}
    rid=str(uuid.uuid4())
    payload={'control':form_fields['요청 제출'],'values':{form_fields['이름 *']:'신청인',form_fields['이메일 *']:'test@example.invalid',form_fields['추가하고 싶은 아이디 *']:'newid'}}
    req=request(app,'control',payload,rid)
    first=app.dispatch(req);second=app.dispatch(req)
    assert first['response']['success'] and second['response']['success']
    assert sheets['아이디추가요청'].writes==1
    assert len(sheets['아이디추가요청'].values)==2
    changed={**req,'payload':{**payload,'control':'로그인'}}
    with pytest.raises(ValueError):app.dispatch(changed)

def test_absence_and_substitute_sheet_budget_cancel():
    app,sheets=make_application();login(app);ns=app.program.namespace
    lesson={'일자':'2026-10-12','교사명':'테스트가','교시':1,'요일':'월','학급':'1-1','과목':'국어'}
    assert ns['_register_absence_from_weekly'](lesson,'출장','테스트')
    assert sheets['결강'].values[1][:9]==['2026-10-12-테스트가','2026-10-12','월','테스트가','출장','테스트','1','1-1','국어']
    assert ns['add_substitute']('2026-10-12-테스트가','2026-10-12','월',1,'1-1','국어','테스트가','테스트다','수동','1순위','')
    assert ns['get_current_budget']()==2190000
    effective=ns['get_effective_timetable_for_date']('2026-10-12')
    assert effective[(effective['교사명']=='테스트다')&(effective['교시']==1)].iloc[0]['변경유형']=='보강'
    assert ns['cancel_substitute']('2026-10-12-테스트가',1)
    assert ns['get_current_budget']()==2200000

def test_test_swap_never_writes_actual_sheets_and_real_swap_saves():
    app,sheets=make_application();login(app);ns=app.program.namespace
    a={'교사명':'테스트가','요일':'월','교시':1,'학급':'1-1','과목':'국어'}
    b={'교사명':'테스트나','요일':'화','교시':2,'학급':'1-1','과목':'수학'}
    before=sum(s.writes for s in sheets.values())
    assert ns['do_swap'](a,b,'2026-10-12','2026-10-13',is_test=True)
    assert sum(s.writes for s in sheets.values())==before
    assert app.port.session_state.swaps.empty
    assert len(app.port.session_state.test_swaps)==1
    app.port.session_state.test_swaps=pd.DataFrame();ns['_invalidate_all_caches']()
    assert ns['do_swap'](a,b,'2026-10-12','2026-10-13')
    assert sheets['맞교환'].writes==1

def test_sheet_conflict_does_not_overwrite_external_change():
    app,sheets=make_application();login(app)
    ws=app.repo.get(app.program.namespace['WORK_SHEET_ID'],'보강');ws.get_all_values()
    sheets['보강'].values=[['외부수정'],['보존해야 하는 값']]
    with pytest.raises(SheetConflict):app.repo.save(ws,pd.DataFrame([{'x':'test'}]))
    assert sheets['보강'].writes==0 and sheets['보강'].values[1][0]=='보존해야 하는 값'

def test_failed_write_blocks_blind_retry():
    app,sheets=make_application();login(app)
    ws=app.repo.get(app.program.namespace['WORK_SHEET_ID'],'결강');ws.get_all_values()
    def fail(*args,**kwargs):raise TimeoutError('test timeout')
    sheets['결강'].update=fail
    with pytest.raises(RuntimeError):app.repo.save(ws,pd.DataFrame([{'x':'test'}]))
    with pytest.raises(SheetConflict):app.repo.save(ws,pd.DataFrame([{'x':'test'}]))

def test_readonly_does_not_auto_seed_or_save():
    app,sheets=make_application(readonly=True)
    result=click(app,'요청 제출',{next(k for k,v in app.port.controls.items() if v['node'].get('label')=='이름 *'):'테스트'})
    assert sum(s.writes for s in sheets.values())==0

def test_upload_chunks_integrity_and_size_limit():
    app,_=make_application();login(app);command(app,'navigate',{'tab':'교무호봉획정'})
    control=next(k for k,v in app.port.controls.items() if v['node']['kind']=='upload')
    raw=b'%PDF-1.7\n'+b'x'*300000
    start=command(app,'upload_start',{'control':control,'name':'test.pdf','size':len(raw),'mime':'application/pdf'})['response']['result']
    for i,offset in enumerate(range(0,len(raw),start['chunkBytes'])):
        r=command(app,'upload_chunk',{'control':control,'uploadId':start['uploadId'],'index':i,'data':base64.b64encode(raw[offset:offset+start['chunkBytes']]).decode()})
        assert r['response']['success']
    result=command(app,'upload_finish',{'control':control,'uploadId':start['uploadId'],'sha256':hashlib.sha256(raw).hexdigest()})
    assert result['response']['success']
    assert app.port.session_state.salary_ai_file.getvalue()==raw
    rejected=command(app,'upload_start',{'control':control,'name':'large.pdf','size':50*1024*1024+1,'mime':'application/pdf'})
    assert not rejected['response']['success']

def test_salary_ui_calculate_and_binary_report_download():
    app,_=make_application();login(app);command(app,'navigate',{'tab':'교무호봉획정'})
    result=click(app,'📊 호봉 계산 및 조서 생성')
    assert result['response']['success']
    assert app.port.session_state.salary_result['final_step']==9
    control=next(k for k,v in app.port.controls.items() if v['node']['kind']=='download')
    result=command(app,'download_chunk',{'control':control,'offset':0})
    assert result['response']['success']
    assert '호봉 획정' in base64.b64decode(result['response']['result']['data']).decode()

def test_owner_filter_and_edu_master_transfer():
    app,_=make_application(role='일반교사');login(app);ns=app.program.namespace
    df=pd.DataFrame([{'입력자':'tester','x':1},{'입력자':'admin','x':2}])
    assert ns['filter_by_owner'](df)['x'].tolist()==[1]
    app.port.session_state.user_role='교육과정부'
    original=pd.DataFrame([{'아이디':'admin','이름':'테스트','권한':'마스터','허용탭':''}])
    edited=original.copy();edited.loc[0,'권한']='일반교사'
    assert not ns['_validate_id_admin_edit'](original,edited)[0]

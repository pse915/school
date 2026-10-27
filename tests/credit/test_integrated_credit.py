from copy import deepcopy
from datetime import datetime,timedelta,timezone
import pytest
from tests.fixtures import make_application,login,click,command
from backend.credit.install import IntegratedEnrollment,load_views,resource_errors,TAB,student_timetable
from backend.credit.planning import save_confirmed
from diple.enrollment.repository import SQLiteEnrollmentRepository
from diple.enrollment.service import AccessDenied
from diple.sectioning import generate_plan,SectioningError,SectioningPlanService

@pytest.fixture
def integrated(tmp_path):
    app,_=make_application();login(app)
    app.port.secrets['credit']={'school_id':'test-school','gateway_url':'configured-test-double'}
    svc=IntegratedEnrollment(SQLiteEnrollmentRepository(tmp_path/'synthetic.sqlite3'),app)
    app._credit_service=svc
    return app,svc

def setup_campaign(svc):
    token=svc.admin_token;school='test-school';now=datetime.now(timezone.utc)
    cid=svc.create_campaign(token,school,{'academic_year':2026,'semester':1,'grade':1,'title':'합성 신청','manager':'tester',
        'starts_at':(now-timedelta(days=1)).isoformat(),'ends_at':(now+timedelta(days=1)).isoformat(),
        'edits_until':(now+timedelta(days=2)).isoformat(),'min_total_credits':3,'max_total_credits':3})
    group=svc.add_group(token,school,cid,'선택',1,2,min_credits=3,max_credits=3,target_units=3)
    offer=svc.add_offering(token,school,cid,group,course_id='A',course_name='과목A',credits=3,section_capacity=1)
    codes=svc.import_roster(token,school,2026,1,[{'student_id':'S1','grade':1,'class_id':'1-1','number':1,'name':'합성학생1'},
        {'student_id':'S2','grade':1,'class_id':'1-1','number':2,'name':'합성학생2'}],{'1-1':1})
    for x in codes:svc.activate(school,x['student_id'],x['activation_code'],'synthetic_password_123')
    svc.publish(token,school,cid)
    users=[svc.login(school,x,'synthetic_password_123') for x in ('S1','S2')]
    for i,u in enumerate(users):svc.submit(u,school,cid,[offer],'test-request-key-'+str(i),0)
    svc.advance(token,school,cid,'신청 마감');svc.advance(token,school,cid,'검토 중')
    snap=svc.finalize(token,school,cid)
    return cid,snap,users

def test_existing_admin_identity_and_cross_school_rejection(integrated):
    app,svc=integrated
    assert svc.session_info(svc.admin_token)['username']=='tester'
    with pytest.raises(AccessDenied):svc.list_campaigns(svc.admin_token,'other-school')
    app.port.session_state.logged_in=False
    with pytest.raises(AccessDenied):svc.list_campaigns(svc.admin_token,'test-school')

def test_six_react_pages_and_all_enrollment_subpages(integrated):
    app,svc=integrated;setup_campaign(svc)
    result=command(app,'navigate',{'tab':TAB})
    assert result['response']['success']
    adapter,view,_=load_views(app)
    for page in ['수강신청 생성','선택과목 그룹','학생명렬','신청 게시·상태','신청 현황','미신청자','개설 가능성 분석','결과 검토','최종 확정','데이터 내보내기','감사 로그']:
        app.port.reset();adapter.pages=[page]
        view.admin_page({'school':{'id':'test-school','academic_year':2026,'semester':1},'classes':[{'id':'1-1','grade':1}],'subjects':[{'id':'A','name':'과목A'}]})
        errors=[x['label'] for x in app._walk(app.port.nodes) if x['kind']=='error']
        assert not errors,(page,errors)
    # Sectioning and timetable entry points render without unsupported widgets.
    for index in (3,4,5):
        command(app,'navigate',{'tab':TAB})
        result=command(app,'control',{'control':'credit_page','values':{'credit_page':index}})
        assert result['response']['success'],result['response']

def test_plan_real_slots_conflicts_and_student_private_view(integrated):
    app,svc=integrated;cid,snap,users=setup_campaign(svc)
    plan=generate_plan(snap)
    for i,sec in enumerate(plan['sections']):
        sec.update(teacher_id='T'+str(i),room_id='R'+str(i),slots=['월1','월2','수1'])
    assert not resource_errors(plan)
    bad=deepcopy(plan);bad['sections'][1]['teacher_id']='T0'
    with pytest.raises(SectioningError,match='충돌'):save_confirmed(svc,svc.admin_token,'test-school',snap,bad)
    saved=save_confirmed(svc,svc.admin_token,'test-school',snap,plan)
    assert saved['resources_confirmed']
    assert SectioningPlanService(svc).get(svc.admin_token,'test-school',saved['plan_id'])['sections'][0]['slots']==['월1','월2','수1']
    app.port.session_state.logged_in=False;app.port.session_state.student_enrollment_token=users[0]
    app.port.reset();student_timetable(app)
    tables=[x for x in app.port.nodes if x['kind']=='table']
    assert tables and all(row['학생ID']=='S1' for row in tables[0]['table']['rows'])

def test_student_entry_does_not_replace_legacy_login():
    app,_=make_application()
    assert any(x['node']['label']=='로그인' for x in app.port.controls.values())
    result=click(app,'학생 온라인 수강신청')
    assert not result['loggedIn']
    assert 'credit_portal_close' in app.port.controls
    result=click(app,'교직원 로그인으로')
    assert any(x['node']['label']=='로그인' for x in app.port.controls.values())

def test_extra_widget_server_decoders(integrated):
    app,svc=integrated;adapter=load_views(app)[0];app.port.reset()
    adapter.number_input('정원',min_value=1,value=32,key='n')
    with pytest.raises(ValueError):app.port.controls['n']['decoder'](-1)
    with pytest.raises(ValueError):app.port.controls['n']['decoder'](1.5)
    adapter.multiselect('선택',['a','b'],key='m')
    with pytest.raises(ValueError):app.port.controls['m']['decoder']([2])

def test_student_login_and_result_through_actual_v2_dispatch(integrated):
    app,svc=integrated;setup_campaign(svc)
    app.port.session_state.logged_in=False
    app.port.session_state['_credit_portal']=True
    app._render()
    fields={v['node'].get('label'):k for k,v in app.port.controls.items()}
    result=click(app,'로그인',{fields['학교 내부 ID']:'test-school',
        fields['학생 고유 ID (관리자가 발급)']:'S1',fields['비밀번호']:'synthetic_password_123'})
    assert result['response']['success'],result['response']
    assert app.port.session_state.get('student_enrollment_token')
    assert not any(n['kind']=='error' for n in app._walk(result['nodes']))
    assert any('S1' in str(n.get('label','')) for n in app._walk(result['nodes']))
    assert not any(n['kind']=='navigation' for n in result['nodes'])

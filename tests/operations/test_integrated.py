import copy,json
from datetime import date
import pytest
from tests.fixtures import command,click
from tests.operations.fixtures import integrated_app
from diple.operations.service import Conflict,OperationError
from backend.operations.install import TAB

@pytest.fixture
def env(tmp_path):return integrated_app(tmp_path/'test.sqlite3')

def first(env,day='2026-10-12'):
    app,svc,p,source,sheets=env
    return svc.day(p,day,svc.actor())['lessons'][0]

def move(env,period=4):
    l=first(env)
    return [{'action':'move','date':'2026-10-12','occurrence_id':l['id'],'to_period':period}]

def test_all_twelve_pages_in_existing_authenticated_bridge(env):
    app,svc,p,source,sheets=env
    result=command(app,'navigate',{'tab':TAB});assert result['response']['success']
    for index in range(12):
        result=command(app,'control',{'control':'ops_page','values':{'ops_page':index}})
        assert result['response']['success'],(index,result['response'])
        assert not any(n['kind']=='error' for n in app._walk(result['nodes'])),(index,result['nodes'])

def test_atomic_workflow_publish_and_original_preservation(env):
    app,svc,p,source,sheets=env;a=svc.actor();before=copy.deepcopy(app.port.session_state['timetable'])
    draft=svc.save_draft(p,a,'move',move(env),'보관 변경안');assert draft['revision']==1
    preview=svc.preview(p,a,move(env));req=svc.submit_checked(p,a,'move',move(env),'검증된 이동 요청',preview['expected_revisions'])
    with pytest.raises(Conflict):svc.confirm(p,a,req)
    svc.begin_review(p,a,req);svc.review(p,a,req,True,'검토 완료');svc.confirm(p,a,req)
    assert svc.day(p,'2026-10-12',a)['rev']==1
    assert svc.day(p,'2026-10-12',a)['published_rev']==0
    svc.publish(p,a,'2026-10-12',1)
    assert svc.day(p,'2026-10-12',a,published=True)['rev']==1
    assert app.port.session_state['timetable'].equals(before)
    assert all(ws.writes==0 for name,ws in sheets.items() if name!='아이디추가요청')
    assert any(x['action']=='published' for x in svc.history(p,a))

def test_exam_and_outside_duty_rechecked_at_confirmation(env):
    app,svc,p,source,sheets=env;a=svc.actor();l=first(env)
    req=svc.submit(p,a,'move',move(env),'이동 승인 요청');svc.review(p,a,req,True,'승인 완료')
    source.duties=[{'date':'2026-10-12','period':4,'teacher_id':l['teacher_ids'][0]}];svc.refresh_external()
    with pytest.raises(Conflict,match='시험감독'):svc.confirm(p,a,req)
    assert svc.day(p,'2026-10-12',a)['rev']==0

def test_cas_request_staleness_and_rejection(env):
    app,svc,p,source,sheets=env;a=svc.actor()
    one=svc.submit(p,a,'move',move(env,4),'먼저 제출');two=svc.submit(p,a,'move',move(env,5),'나중 제출')
    for ident in (one,two):svc.review(p,a,ident,True,'검토 승인')
    svc.confirm(p,a,one)
    with pytest.raises(Conflict):svc.confirm(p,a,two)
    third=svc.submit(p,a,'move',move(env,6),'별도 변경 요청');svc.review(p,a,third,False,'사유 반려')
    with pytest.raises(Conflict):svc.confirm(p,a,third)

def test_editor_validates_before_request_and_is_not_auto_approved(env):
    app,svc,p,source,sheets=env;command(app,'navigate',{'tab':TAB});l=first(env)
    preview=command(app,'ops.preview',{'day':'2026-10-12','revision':0,'occurrence_id':l['id'],'to_period':4,'reason':'드래그 변경 검증'})
    assert preview['response']['success'],preview['response']
    token=app._ops_preview['token'];assert not svc.requests(p,svc.actor())
    result=command(app,'ops.submit_preview',{'token':token})
    assert result['response']['success'];assert svc.requests(p,svc.actor())[0]['status']=='submitted'
    assert svc.day(p,'2026-10-12',svc.actor())['rev']==0
    again=command(app,'ops.submit_preview',{'token':token});assert not again['response']['success']

def test_preview_closed_on_menu_navigation(env):
    app,svc,p,source,sheets=env;command(app,'navigate',{'tab':TAB});l=first(env)
    command(app,'ops.preview',{'day':'2026-10-12','revision':0,'occurrence_id':l['id'],'to_period':4,'reason':'이동 검증'})
    assert app._ops_preview
    command(app,'navigate',{'tab':'시간표 조회'});assert app._ops_preview is None

def test_remote_auto_transaction_does_not_write_read_only_queries(monkeypatch):
    from tests.credit.test_gateway import FakeSignedGateway
    from diple.enrollment.google_gateway import GoogleSheetsGatewayRepository
    from diple.operations.service import OperationsService
    fake=FakeSignedGateway('a'*48);monkeypatch.setattr('diple.enrollment.google_gateway.requests.post',fake.post)
    repo=GoogleSheetsGatewayRepository('https://script.google.com/macros/s/fake/exec','a'*48,'testns')
    svc=OperationsService(repo=repo);before=fake.revision
    with svc._db() as db:assert db.execute('SELECT count(*) FROM base_versions').fetchone()[0]==0
    assert fake.revision==before
    with svc._db() as db:
        db.execute('BEGIN IMMEDIATE');db.execute("INSERT INTO enrollment_meta VALUES ('operations-test','ok')");db.commit()
    assert fake.revision==before+1
    other=OperationsService(repo=repo)
    with other._db() as db:assert db.execute("SELECT value FROM enrollment_meta WHERE name='operations-test'").fetchone()[0]=='ok'

def test_existing_exam_assignment_write_guard_uses_actual_operations(env):
    app,svc,p,source,sheets=env
    from backend.operations.exam_adapter import validate_assignments
    from tests.exam_supervision.test_service import Book
    from backend.exam_supervision.service import Service
    exam=Service(app);exam.repo.book=Book();exam.repo.configuration={'teacherView':True};exam.repo.reload()
    # Existing synthetic roster teacher 1 matches the first legacy timetable teacher.
    with pytest.raises(OperationError,match='시험감독 충돌'):
        validate_assignments(app,exam,[{'date':'2026-10-12','period':1,'teacherId':'1'}])

def test_existing_exam_read_adapter_never_writes_or_initializes():
    from tests.fixtures import make_application,login
    from tests.exam_supervision.test_service import Book
    from backend.exam_supervision.service import Service
    from backend.operations.source import LegacyReadAdapter
    app,_=make_application();login(app);exam=Service(app);book=Book()
    exam.repo.book=book;exam.repo.configuration={'teacherView':True};exam.repo.reload();app._exam_service=exam
    before=copy.deepcopy(book.tables)
    assert LegacyReadAdapter(app).exam()==[]
    assert book.tables==before and not book.batches

def test_phase5b_actual_students_join_the_existing_timetable_without_omission(env):
    from datetime import datetime,timedelta,timezone
    from backend.operations.source import build_project
    from diple.sectioning import generate_plan
    from backend.credit.planning import save_confirmed
    app,svc,p,source,sheets=env;credit=app._credit_service;token=credit.admin_token;school='qa-school';n=datetime.now(timezone.utc)
    cid=credit.create_campaign(token,school,{'academic_year':2026,'semester':1,'grade':1,'manager':'tester','title':'이동반 검증',
        'starts_at':(n-timedelta(days=1)).isoformat(),'ends_at':(n+timedelta(days=1)).isoformat(),'edits_until':(n+timedelta(days=1)).isoformat()})
    group=credit.add_group(token,school,cid,'선택',1,1,target_units=1)
    offering=credit.add_offering(token,school,cid,group,course_id='과학',course_name='과학',credits=1,units=1)
    codes=credit.import_roster(token,school,2026,1,[{'student_id':'S1','grade':1,'class_id':'1-1','number':1,'name':'합성학생'}],{'1-1':1})
    credit.activate(school,'S1',codes[0]['activation_code'],'synthetic_password_123');student=credit.login(school,'S1','synthetic_password_123')
    credit.publish(token,school,cid);credit.submit(student,school,cid,[offering],'unique-enrollment-request',0)
    credit.advance(token,school,cid,'신청 마감');credit.advance(token,school,cid,'검토 중');snap=credit.finalize(token,school,cid)
    plan=generate_plan(snap)
    for sec in plan['sections']:sec.update(teacher_id='테스트가',room_id='과학실',slots=['금4'])
    save_confirmed(credit,token,school,snap,plan)
    merged=build_project(app,2026,1)
    assert any(l['student_ids']==['S1'] for l in merged['lessons'])
    # A homeroom class at the same slot conflicts with the exact elective student membership.
    with credit.repo.tx(True) as db:
        row=db.execute('SELECT plan_id,plan_json FROM sectioning_plans ORDER BY version DESC LIMIT 1').fetchone();bad=json.loads(row['plan_json'])
        bad['sections'][0]['slots']=['월1'];db.execute('UPDATE sectioning_plans SET plan_json=? WHERE plan_id=?',(json.dumps(bad),row['plan_id']))
    with pytest.raises(OperationError,match='통합 충돌'):build_project(app,2026,1)

def test_crossdate_publication_is_atomic_for_linked_request(env):
    app,svc,p,source,sheets=env;a=svc.actor();target=first(env)
    changes=[{'action':'move','date':'2026-10-12','occurrence_id':target['id'],'to_date':'2026-10-13','to_period':4}]
    req=svc.submit(p,a,'move',changes,'날짜간 원자적 이동');svc.review(p,a,req,True,'검토 승인');svc.confirm(p,a,req)
    svc.publish(p,a,'2026-10-12',1)
    assert svc.day(p,'2026-10-12',a,published=True)['published_rev']==1
    assert svc.day(p,'2026-10-13',a,published=True)['published_rev']==1

def test_remote_operations_interleaved_writers_reject_all_of_losing_transaction(monkeypatch):
    from tests.credit.test_gateway import FakeSignedGateway
    from diple.enrollment.google_gateway import GoogleSheetsGatewayRepository
    from diple.operations.service import OperationsService
    fake=FakeSignedGateway('a'*48);monkeypatch.setattr('diple.enrollment.google_gateway.requests.post',fake.post)
    repo=GoogleSheetsGatewayRepository('https://script.google.com/macros/s/fake/exec','a'*48,'testns');one=OperationsService(repo=repo);two=OperationsService(repo=repo)
    with pytest.raises(Conflict):
        with one._db() as first:
            first.execute('BEGIN IMMEDIATE');first.execute("INSERT INTO enrollment_meta VALUES('loser','not committed')")
            with two._db() as second:
                second.execute('BEGIN IMMEDIATE');second.execute("INSERT INTO enrollment_meta VALUES('winner','committed')")
    with repo.tx() as db:
        assert not db.execute("SELECT 1 FROM enrollment_meta WHERE name='loser'").fetchone()
        assert db.execute("SELECT value FROM enrollment_meta WHERE name='winner'").fetchone()[0]=='committed'

def test_remote_gateway_rejects_wrong_clone_before_writes(monkeypatch):
    from tests.credit.test_gateway import FakeSignedGateway
    from diple.enrollment.google_gateway import GoogleSheetsGatewayRepository
    from diple.enrollment.service import EnrollmentError
    fake=FakeSignedGateway('a'*48);monkeypatch.setattr('diple.enrollment.google_gateway.requests.post',fake.post)
    with pytest.raises(EnrollmentError,match='복제 시트'):
        GoogleSheetsGatewayRepository('https://script.google.com/macros/s/fake/exec','a'*48,'testns',expected_spreadsheet_id='clone-required')
    assert fake.revision==0

def test_part_time_working_periods_and_school_assignment_limit(env):
    import pandas as pd
    from backend.operations.source import build_project,LegacyReadAdapter
    app,svc,p,source,sheets=env
    app.port.session_state['part_time']=pd.DataFrame([{'시간강사명':'시간강사A','담당과목':'국어','시작일':'2026-10-01','종료일':'2026-10-31','월1':'O'}])
    merged=build_project(app,2026,1);assert any(t['id']=='시간강사A' for t in merged['teachers'])
    read=LegacyReadAdapter(app);l=first(env);l['teacher_ids']=['시간강사A']
    assert not read.blocked(merged,'2026-10-12',l)
    l['period']=4;assert any('근무교시' in x for x in read.blocked(merged,'2026-10-12',l))
    p['teachers'][0]['max_daily_substitutes']=0
    l=first(env);l['kind']='substitute'
    assert any('대강 상한' in x for x in svc.conflicts(p,{'2026-10-12':[l]}))

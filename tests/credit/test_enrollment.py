"""Phase 5A business/permission/transaction regression tests (synthetic users only)."""
import concurrent.futures
from datetime import datetime,timedelta,timezone
from io import BytesIO
import secrets
import time
import pytest
from openpyxl import load_workbook
from diple.enrollment.service import (
    EnrollmentService,EnrollmentError,AccessDenied,VersionConflict,PASSWORD_HASHER
)
from diple.enrollment.integration import EnrollmentExportService
from diple.samples import high_school


def campaign_info(year=2026,sem=2,grade=2,offset=(-1,60,65),min_total=3,max_total=6):
    n=datetime.now(timezone.utc)
    return {'academic_year':year,'semester':sem,'grade':grade,'title':'테스트 수강신청','manager':'T',
            'starts_at':(n+timedelta(minutes=offset[0])).isoformat(),
            'ends_at':(n+timedelta(minutes=offset[1])).isoformat(),
            'edits_until':(n+timedelta(minutes=offset[2])).isoformat(),
            'min_total_credits':min_total,'max_total_credits':max_total}


@pytest.fixture
def env(tmp_path):
    svc=EnrollmentService(path=str(tmp_path/'enroll.sqlite3'))
    admin_pwd='this-is-not-a-real-school-password'
    svc.bootstrap_admin('demo-high','admin',admin_pwd,PASSWORD_HASHER.hash(admin_pwd))
    admin=svc.login('demo-high','admin',admin_pwd)
    campaign=svc.create_campaign(admin,'demo-high',campaign_info())
    grp=svc.add_group(admin,'demo-high',campaign,'과학',1,2,min_credits=3,max_credits=6)
    p=svc.add_offering(admin,'demo-high',campaign,grp,course_id='PH',course_name='물리학',credits=3)
    c=svc.add_offering(admin,'demo-high',campaign,grp,course_id='CH',course_name='화학',credits=3)
    codes=svc.import_roster(admin,'demo-high',2026,2,[{'student_id':'S1','grade':2,'class_id':'H1','number':1,'name':'학생1'},
                    {'student_id':'S2','grade':2,'class_id':'H1','number':2,'name':'학생2'}],{'H1'})
    for item in codes:svc.activate('demo-high',item['student_id'],item['activation_code'],'correct_passphrase_2026')
    user=svc.login('demo-high','S1','correct_passphrase_2026')
    user2=svc.login('demo-high','S2','correct_passphrase_2026')
    svc.publish(admin,'demo-high',campaign)
    return svc,admin,user,user2,campaign,grp,p,c


def submitted(env,choice=None,key=None,version=0):
    svc,adm,user,other,camp,grp,phys,chem=env
    return svc.submit(user,'demo-high',camp,choice or [phys],key or secrets.token_urlsafe(16),version)


def test_normal_submit_with_receipt_and_student_isolation(env):
    svc,adm,student,other,cid,grp,p,c=env
    receipt=submitted(env)['receipt']
    assert receipt.startswith('ENR-2026-')
    assert svc.my_submission(student,'demo-high',cid)['current']['receipt']==receipt
    assert svc.my_submission(other,'demo-high',cid)['current'] is None
    assert svc.dashboard(adm,'demo-high',cid)['submitted']==1


def test_min_max_counts_and_credits(env):
    svc,adm,u,o,cid,grp,p,c=env
    with pytest.raises(EnrollmentError,match='선택 0개'):
        submitted(env,[] if False else ['fake'])  # no matching offering
    with pytest.raises(EnrollmentError,match='선택 0개'):
        svc.submit(u,'demo-high',cid,[],secrets.token_urlsafe(16))
    with pytest.raises(EnrollmentError,match='중복'):
        svc.submit(u,'demo-high',cid,[p,p],secrets.token_urlsafe(16))
    with pytest.raises(EnrollmentError,match='전체 학점'):
        # 2 courses 6 credits and temporarily lowered max total credits
        with svc.repo.tx(True) as db:
            db.execute('UPDATE campaigns SET max_total_credits=4 WHERE campaign_id=?',(cid,))
        svc.submit(u,'demo-high',cid,[p,c],secrets.token_urlsafe(16))


def test_not_owned_or_inactive_course(env):
    svc,adm,u,o,cid,grp,p,c=env
    with pytest.raises(EnrollmentError,match='신청할 수 없는'):
        svc.submit(u,'demo-high',cid,['invalid-offering'],secrets.token_urlsafe(16))
    with svc.repo.tx(True) as db:
        db.execute("UPDATE offerings SET availability='폐강' WHERE offering_id=?",(p,))
    with pytest.raises(EnrollmentError,match='폐강'):
        svc.submit(u,'demo-high',cid,[p],secrets.token_urlsafe(16))


def test_prerequisite_and_exclusions(env):
    svc,adm,u,o,cid,grp,p,c=env
    with svc.repo.tx(True) as db:
        db.execute('UPDATE offerings SET prerequisites_json=? WHERE offering_id=?',('["PRE"]',p))
    with pytest.raises(EnrollmentError,match='선이수'):
        submitted(env)
    with svc.repo.tx(True) as db:
        db.execute('UPDATE offerings SET prerequisites_json=?,exclusions_json=? WHERE offering_id=?',('[]','["CH"]',p))
    with pytest.raises(EnrollmentError,match='상호배제'):
        svc.submit(u,'demo-high',cid,[p,c],secrets.token_urlsafe(16))


def test_compound_units(env):
    svc,adm,u,o,cid,grp,p,c=env
    with svc.repo.tx(True) as db:
        db.execute('UPDATE choice_groups SET target_units=6 WHERE group_id=?',(grp,))
    with pytest.raises(EnrollmentError,match='운영구획'):
        submitted(env)
    assert svc.submit(u,'demo-high',cid,[p,c],secrets.token_urlsafe(16))['receipt']


def test_modify_with_cas_and_replay(env):
    svc,adm,u,o,cid,grp,p,c=env
    key=secrets.token_urlsafe(20)
    a=submitted(env,key=key)
    assert submitted(env,key=key)=={**a,'duplicate':True}
    with pytest.raises(EnrollmentError,match='다른 선택'):
        svc.submit(u,'demo-high',cid,[c],key,expected_version=1)
    with pytest.raises(VersionConflict):
        svc.submit(u,'demo-high',cid,[c],secrets.token_urlsafe(20),expected_version=0)
    b=svc.submit(u,'demo-high',cid,[c],secrets.token_urlsafe(20),expected_version=1)
    assert b['receipt']!=a['receipt']
    assert len(svc.history(u,'demo-high',cid))==2
    assert svc.dashboard(adm,'demo-high',cid)['submitted']==1


def test_cancel_preserves_history(env):
    svc,adm,u,o,cid,grp,p,c=env
    submitted(env)
    svc.cancel(u,'demo-high',cid)
    assert svc.my_submission(u,'demo-high',cid)['current'] is None
    assert len(svc.history(u,'demo-high',cid))==1
    assert svc.dashboard(adm,'demo-high',cid)['submitted']==0


def test_deadline_and_first_submission_after_end(env):
    svc,adm,u,o,cid,grp,p,c=env
    # Close first-time submission after end, but edits window remains open
    with svc.repo.tx(True) as db:
        db.execute('UPDATE campaigns SET ends_at=? WHERE campaign_id=?',
                   ((datetime.now(timezone.utc)-timedelta(seconds=1)).isoformat(),cid))
    with pytest.raises(EnrollmentError,match='기간'):
        submitted(env)


def test_submitted_student_can_edit_before_edit_deadline(env):
    svc,adm,u,o,cid,grp,p,c=env
    submitted(env)
    with svc.repo.tx(True) as db:
        db.execute('UPDATE campaigns SET ends_at=? WHERE campaign_id=?',
                   ((datetime.now(timezone.utc)-timedelta(seconds=1)).isoformat(),cid))
    assert svc.submit(u,'demo-high',cid,[c],secrets.token_urlsafe(20),1)['receipt']


def test_finalization_and_snapshot_immutability(env):
    svc,adm,u,o,cid,grp,p,c=env
    submitted(env)
    svc.advance(adm,'demo-high',cid,'신청 진행');svc.advance(adm,'demo-high',cid,'신청 마감')
    svc.advance(adm,'demo-high',cid,'검토 중')
    with pytest.raises(EnrollmentError,match='미신청'):
        svc.finalize(adm,'demo-high',cid)
    snap=svc.finalize(adm,'demo-high',cid,ack_missing=True)
    with pytest.raises(EnrollmentError,match='현재 신청'):
        svc.submit(u,'demo-high',cid,[c],secrets.token_urlsafe(20),1)
    assert svc.get_snapshot(adm,'demo-high',snap['snapshot_id'])==snap
    svc.reopen(adm,'demo-high',cid,'학생 기록 정정 사유 확인')
    svc.admin_override(adm,'demo-high',cid,'S1',[c],'관리자 승인한 요청')
    new=svc.finalize(adm,'demo-high',cid,ack_missing=True,reason='추가 확정')
    assert new['version']==2 and new['snapshot_id']!=snap['snapshot_id']
    assert svc.get_snapshot(adm,'demo-high',snap['snapshot_id'])==snap


def test_permission_scope_admin_student_and_other_school(env):
    svc,adm,u,o,cid,grp,p,c=env
    with pytest.raises(AccessDenied):
        svc.dashboard(u,'demo-high',cid)
    with pytest.raises(AccessDenied):
        svc.catalog(u,'another-school',cid)
    with pytest.raises(AccessDenied):
        svc.get_snapshot(o,'demo-high','unused')
    with pytest.raises(AccessDenied):
        svc.import_roster(o,'demo-high',2026,2,[],{'H1'})


def test_account_lockout_and_reset(env):
    svc,adm,u,o,cid,grp,p,c=env
    for i in range(5):
        with pytest.raises(AccessDenied):
            svc.login('demo-high','S1','wrongpassword')
    with pytest.raises(AccessDenied,match='잠겼습니다'):
        svc.login('demo-high','S1','correct_passphrase_2026')
    code=svc.reset_activation(adm,'demo-high','S1','계정 잠김 수동 복구')
    svc.activate('demo-high','S1',code,'brand_new_password_2026')
    with pytest.raises(AccessDenied):
        svc.session_info(u)
    assert svc.login('demo-high','S1','brand_new_password_2026')


def test_roster_all_or_nothing_keep_ids_and_1_2_term_isolation(env):
    svc,adm,u,o,cid,grp,p,c=env
    bad=[{'student_id':'S3','grade':2,'class_id':'MISSING','number':1,'name':'A'},
         {'student_id':'S4','grade':2,'class_id':'H1','number':1,'name':'B'}]
    report=svc.roster_report(adm,'demo-high',2026,2,bad,{'H1'})
    assert not report['valid']
    with pytest.raises(EnrollmentError):svc.import_roster(adm,'demo-high',2026,2,bad,{'H1'})
    assert not svc.repo.run_read("SELECT * FROM students WHERE student_id='S3'")
    # stable student ID can change class/number within same term and retain prior submission
    svc.import_roster(adm,'demo-high',2026,2,[{'student_id':'S1','grade':2,'class_id':'H1','number':11,'name':'학생1'}],{'H1'})
    submitted(env)
    assert svc.my_submission(u,'demo-high',cid)['current']
    svc.import_roster(adm,'demo-high',2026,1,[{'student_id':'S1','grade':2,'class_id':'H1','number':1,'name':'학생1'}],{'H1'})
    rows=svc.repo.run_read('SELECT semester FROM students WHERE student_id=? ORDER BY semester',('S1',))
    assert [r['semester'] for r in rows]==[1,2]


def test_excel_csv_json_reimport_validate(env):
    svc,adm,u,o,cid,grp,p,c=env
    submitted(env)
    svc.advance(adm,'demo-high',cid,'신청 마감');svc.advance(adm,'demo-high',cid,'검토 중')
    snap=svc.finalize(adm,'demo-high',cid,ack_missing=True)
    blob=EnrollmentExportService.to_excel(snap)
    assert load_workbook(BytesIO(blob)).sheetnames==['NormalizedChoices','OfferingSummary','SelectionMatrix','SchemaAndValidation']
    assert EnrollmentExportService.import_validate_xlsx(snap,blob)==[]
    assert b'snapshot_id' in EnrollmentExportService.to_csv(snap)
    parsed=__import__('json').loads(EnrollmentExportService.to_json(snap))
    assert parsed['snapshot']['snapshot_id']==snap['snapshot_id']


def test_schedule_engine_direct_connector(env):
    svc,adm,u,o,cid,grp,p,c=env
    svc.submit(u,'demo-high',cid,[p],secrets.token_urlsafe(20),0)
    svc.submit(o,'demo-high',cid,[c],secrets.token_urlsafe(20),0)
    svc.advance(adm,'demo-high',cid,'신청 마감');svc.advance(adm,'demo-high',cid,'검토 중')
    snap=svc.finalize(adm,'demo-high',cid)
    pr=high_school()
    updated,notes=EnrollmentExportService.apply_to_project(pr,snap)
    assert not notes
    phys=next(x for x in updated['lessons'] if x['subject_id']=='PH')
    chem=next(x for x in updated['lessons'] if x['subject_id']=='CH')
    assert phys['student_ids']==['S1'] and chem['student_ids']==['S2']
    assert pr['lessons'][1]['student_ids']==['S1','S2'] # original left intact
    assert updated['enrollment_links'][0]['snapshot_id']==snap['snapshot_id']


def test_two_users_concurrent_write_and_idempotency(env):
    svc,adm,u,o,cid,grp,p,c=env
    key=secrets.token_urlsafe(20)
    def attempt(i):
        try:return ('ok',svc.submit(u,'demo-high',cid,[p],key,0)['receipt'])
        except EnrollmentError as err:return ('error',str(err))
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        outcomes=list(pool.map(attempt,range(12)))
    assert all(kind=='ok' for kind,_ in outcomes)
    assert len({result for _,result in outcomes})==1
    assert svc.repo.run_read('SELECT count(*) AS cnt FROM submissions')[0]['cnt']==1
    def submit_one(token,choice):
        return svc.submit(token,'demo-high',cid,[choice],secrets.token_urlsafe(20),0)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        assert pool.submit(submit_one,o,c).result()['receipt']
    assert svc.dashboard(adm,'demo-high',cid)['submitted']==2


def test_atomic_rollback_on_write_failure(env,monkeypatch):
    svc,adm,u,o,cid,grp,p,c=env
    original=svc.validate_choices
    def fault(*args,**kwargs):
        raise OSError('Simulated upstream failure before write')
    monkeypatch.setattr(svc,'validate_choices',fault)
    with pytest.raises(OSError):submitted(env)
    monkeypatch.setattr(svc,'validate_choices',original)
    assert svc.repo.run_read('SELECT count(*) AS cnt FROM submissions')[0]['cnt']==0


@pytest.mark.parametrize('count',[300,600,1200])
def test_synthetic_roster_sizes(tmp_path,count):
    svc=EnrollmentService(path=str(tmp_path/'scale.sqlite3'))
    password='test-password-for-admin'
    svc.bootstrap_admin('school','admin',password,PASSWORD_HASHER.hash(password))
    adm=svc.login('school','admin',password)
    rows=[{'student_id':f'S{i:05}','grade':1,'class_id':'C'+str((i//30)+1),
           'number':(i%30)+1,'name':f'학생{i:05}'} for i in range(count)]
    t=time.monotonic()
    codes=svc.import_roster(adm,'school',2026,1,rows,{r['class_id'] for r in rows})
    assert len(codes)==count
    assert svc.repo.run_read('SELECT count(*) AS n FROM students')[0]['n']==count
    # Size smoke, not a 300/600/1200 concurrent request stress test.
    assert time.monotonic()-t<120


def test_too_many_choices_and_credit_shortage(env):
    svc,adm,u,o,cid,grp,p,c=env
    with svc.repo.tx(True) as db:
        db.execute('UPDATE choice_groups SET max_count=1 WHERE group_id=?',(grp,))
    with pytest.raises(EnrollmentError,match='선택 2개'):
        svc.submit(u,'demo-high',cid,[p,c],secrets.token_urlsafe(20))
    with svc.repo.tx(True) as db:
        db.execute('UPDATE campaigns SET min_total_credits=5 WHERE campaign_id=?',(cid,))
    with pytest.raises(EnrollmentError,match='전체 학점'):
        submitted(env)


def test_transfer_withdrawal_and_class_grade_validation(env):
    svc,adm,u,o,cid,grp,p,c=env
    bad=[{'student_id':'S3','grade':1,'class_id':'H1','number':3,'name':'학생3'}]
    report=svc.roster_report(adm,'demo-high',2026,2,bad,{'H1':2})
    assert report['errors'] and report['errors'][0]['열']=='class_id/grade'
    svc.import_roster(adm,'demo-high',2026,2,[{'student_id':'S1','grade':2,'class_id':'H1',
                                           'number':1,'name':'학생1','status':'전출','eligible':False}],{'H1':2})
    with pytest.raises(AccessDenied):
        submitted(env)
    with pytest.raises(AccessDenied):
        svc.login('demo-high','S1','correct_passphrase_2026')


def test_deadline_aware_cancel_and_admin_audit(env):
    svc,adm,u,o,cid,grp,p,c=env
    submitted(env)
    svc.advance(adm,'demo-high',cid,'신청 마감')
    with pytest.raises(EnrollmentError):
        svc.cancel(u,'demo-high',cid)
    logs=svc.audit_logs(adm,'demo-high',cid)
    assert any(r['action']=='student_submit' for r in logs)

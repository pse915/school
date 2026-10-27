from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
import json
from unittest.mock import patch
import pytest
from backend.direct_sheets import DirectSheetsRepository
from backend.sheet_config import resolve,enabled
from diple.enrollment.service import EnrollmentError,VersionConflict
from tests.semester.direct_fixture import Spreadsheet,Client
from tests.semester.test_service import env

def repository(sheet=None):
    sheet=sheet or Spreadsheet();return DirectSheetsRepository(Client(sheet),sheet.id,'test-store'),sheet

def test_only_sheet_url_is_enough_and_school_id_stable():
    a=resolve({'school_sheets':{'Semester_sheet':'https://docs.google.com/spreadsheets/d/direct-copy/edit'}})
    b=resolve({'school_sheets':{'Gogyohak_sheet':'direct-copy'}})
    assert a['storage_mode']=='direct' and a['school_id']==b['school_id']
    assert enabled({'school_sheets':{'Semester_sheet':'direct-copy'}})
    assert 'gateway_url' not in a

def test_persist_reopen_readonly_does_not_write():
    repo,s=repository()
    with repo.tx(True) as db:db.execute('CREATE TABLE example (n INTEGER)');db.execute('INSERT INTO example VALUES(7)')
    count=s.writes
    again=DirectSheetsRepository(Client(s),s.id,'test-store')
    assert again.run_read('SELECT * FROM example')==[{'n':7}] and count==s.writes

def test_failed_transaction_no_partial_write():
    repo,s=repository();count=s.writes
    with pytest.raises(RuntimeError):
        with repo.tx(True) as db:db.execute('CREATE TABLE discarded(n)');raise RuntimeError('reject')
    assert s.writes==count
    assert not repo.run_read("SELECT name FROM sqlite_master WHERE name='discarded'")

def test_sessions_share_one_document_lock():
    repo,s=repository();other=DirectSheetsRepository(Client(s),s.id,'test-store')
    with repo.tx(True) as db:db.execute('CREATE TABLE counter(n)');db.execute('INSERT INTO counter VALUES(0)')
    def inc(i):
        with (repo if i%2 else other).tx(True) as db:db.execute('UPDATE counter SET n=n+1')
    with ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(inc,range(24)))
    assert repo.run_read('SELECT n FROM counter')==[{'n':24}]

def test_external_revision_change_is_not_overwritten():
    repo,s=repository()
    with pytest.raises(VersionConflict):
        with repo.tx(True) as db:
            db.execute('CREATE TABLE rejected(n)')
            meta=json.loads(repo.ws.values[0][0]);meta['revision']+=1;repo.ws.values[0][0]=json.dumps(meta)
    assert not repo.run_read("SELECT name FROM sqlite_master WHERE name='rejected'")

def test_lost_response_reconciles_and_failed_write_requires_read():
    repo,s=repository();s.fail='after'
    with repo.tx(True) as db:db.execute('CREATE TABLE saved(n)')
    assert repo.run_read("SELECT name FROM sqlite_master WHERE name='saved'")
    s.fail='before'
    with pytest.raises(EnrollmentError,match='응답'):
        with repo.tx(True) as db:db.execute('CREATE TABLE not_saved(n)')
    with pytest.raises(EnrollmentError,match='확인'):
        with repo.tx(True):pass
    assert not repo.run_read("SELECT name FROM sqlite_master WHERE name='not_saved'")
    # A read of the old revision does not prove a timed-out request cannot commit late.
    with pytest.raises(EnrollmentError,match='확인'):
        with repo.tx(True):pass
    other=DirectSheetsRepository(Client(s),s.id,'test-store')
    with pytest.raises(EnrollmentError,match='확인'):
        with other.tx(True):pass
    # Simulate the original timed-out request eventually committing. Its receipt unblocks writes.
    s.batch_update(s.last_request)
    assert repo.run_read("SELECT name FROM sqlite_master WHERE name='not_saved'")
    with repo.tx(True) as db:db.execute('CREATE TABLE recovered(n)')

def test_corrupt_data_and_old_gateway_never_initialized():
    repo,s=repository();s.tabs[0].values[0][0]='broken';count=s.writes
    with pytest.raises(EnrollmentError,match='체크섬'):DirectSheetsRepository(Client(s),s.id,'test-store')
    assert s.writes==count
    s=Spreadsheet();s.add_worksheet('DIPLE5A_old_namespace_A',1000,1)
    with pytest.raises(EnrollmentError,match='게이트웨이'):repository(s)
    assert len(s.tabs)==1 and s.writes==0

def test_integrated_semester_finalize_apply_reopen_without_gateway(env):
    from tests.operations.fixtures import integrated_app,seed_credit_campaign
    from backend.credit.install import get_service as credit_service
    from backend.semester.install import get_service
    from backend.semester.model import compile_project,digest
    from backend.semester.solver import solve
    sheet=Spreadsheet();client=Client(sheet)
    app,ops,legacy,source,original=integrated_app()
    before=app.port.session_state['timetable'].copy(deep=True)
    app.port.secrets.pop('credit');app.port.secrets['school_sheets']={'Gogyohak_sheet':sheet.id,'School_id':'qa-school'}
    app._credit_service=None
    with patch.dict(app.program.namespace,{'get_gspread_client':lambda:client}):credit=credit_service(app)
    assert isinstance(credit.repo,DirectSheetsRepository)
    seed_credit_campaign(app)
    campaigns=credit.list_campaigns(credit.admin_token,'qa-school');assert campaigns
    campaign=campaigns[0]['campaign_id']
    offering=credit.repo.run_read('SELECT offering_id FROM offerings WHERE campaign_id=?',(campaign,))[0]['offering_id']
    student=credit.login('qa-school','S1','synthetic_password_123')
    credit.save_draft(student,'qa-school',campaign,[offering])
    receipt=credit.submit(student,'qa-school',campaign,[offering],'direct-student-request')
    assert receipt['receipt'] and credit.my_submission(student,'qa-school',campaign)['current']
    assert credit.submit(student,'qa-school',campaign,[offering],'direct-student-request')['receipt']==receipt['receipt']
    from backend.operations.service import IntegratedOperations
    app._operations_service=IntegratedOperations(app,credit.repo,source)
    svc=get_service(app);tid=svc.create(2026,1,'직접저장','2026-10-12','2026-12-31')
    raw=deepcopy(env[3]);svc.save(tid,raw,1);p=compile_project(raw);result=solve(p,2)
    cid=svc.add_candidate(tid,2,digest(raw),p,result);fid=svc.finalize(tid,cid,'직접 저장 확인','direct-request');svc.apply(tid,fid,'2026-10-12')
    reopened=DirectSheetsRepository(client,sheet.id,credit.repo.namespace)
    assert reopened.run_read('SELECT version_id FROM semester_pointers')[0]['version_id']==fid
    assert reopened.run_read('SELECT * FROM base_versions')
    assert app.port.session_state['timetable'].equals(before)

def test_close_preview_does_not_require_store_connectivity(env):
    from backend.semester.install import handle
    app=env[0];app._semester_preview={'token':'offline-preview'}
    with patch('backend.semester.install.get_service',side_effect=AssertionError('store offline')):
        assert handle(app,'close_preview',{})=={'closed':True}
    assert app._semester_preview is None

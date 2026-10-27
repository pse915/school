from copy import deepcopy
from datetime import date
from pathlib import Path
import tempfile
from tests.fixtures import make_application,login
from backend.credit.install import IntegratedEnrollment
from diple.enrollment.repository import SQLiteEnrollmentRepository
from backend.operations.service import IntegratedOperations
from backend.operations.source import build_project

class SyntheticSource:
    def __init__(self):self.project=None;self.duties=[];self.blocked_teachers=set()
    def exam(self):return deepcopy(self.duties)
    def blocked(self,project,day,lesson):return [t+': 출장·외부 일정' for t in lesson['teacher_ids'] if t in self.blocked_teachers]
    def daily_lessons(self,project,day):
        from diple.operations.service import OperationsService
        return OperationsService._lesson_occurrences(project,day)

def integrated_app(path=None,repo=None):
    app,sheets=make_application();login(app)
    app.port.secrets['credit']={'school_id':'qa-school','gateway_url':'synthetic-test-only','academic_year':2026,'semester':1}
    app.port.secrets['operations']={'allow_cross_subject_substitute':True,'max_periods':7}
    repo=repo or SQLiteEnrollmentRepository(path or Path(tempfile.mkdtemp())/'synthetic.sqlite3')
    credit=IntegratedEnrollment(repo,app);app._credit_service=credit
    project=build_project(app,2026,1);source=SyntheticSource();source.project=project
    svc=IntegratedOperations(app,repo,source);app._operations_service=svc
    svc.register_base(project,'2026-10-12',svc.actor())
    return app,svc,project,source,sheets

def seed_credit_campaign(app):
    """Synthetic browser-only enrollment fixture; never imported by production entrypoint."""
    from datetime import datetime,timedelta,timezone
    svc=app._credit_service;token=svc.admin_token;school='qa-school'
    existing=svc.list_campaigns(token,school)
    if existing:return
    now=datetime.now(timezone.utc)
    cid=svc.create_campaign(token,school,{'academic_year':2026,'semester':1,'grade':1,'manager':'tester','title':'브라우저 수강신청',
        'starts_at':(now-timedelta(days=1)).isoformat(),'ends_at':(now+timedelta(days=1)).isoformat(),'edits_until':(now+timedelta(days=2)).isoformat(),
        'min_total_credits':3,'max_total_credits':3})
    group=svc.add_group(token,school,cid,'선택과학',1,1,min_credits=3,max_credits=3,target_units=1)
    svc.add_offering(token,school,cid,group,course_id='선택과학',course_name='선택과학',credits=3,units=1,section_capacity=20)
    codes=svc.import_roster(token,school,2026,1,[{'student_id':'S1','grade':1,'class_id':'1-1','number':1,'name':'합성학생'}],{'1-1':1})
    svc.activate(school,'S1',codes[0]['activation_code'],'synthetic_password_123')
    svc.publish(token,school,cid)

"""Tenant scoped Phase 5A/5B hooks, using the existing srbmaster authentication."""
from pathlib import Path
from types import ModuleType
from datetime import datetime
import secrets
import hashlib
import pandas as pd
from backend.bridge.port import Rerender
from .adapter import CreditPort
from backend.sheet_config import enabled as sheets_enabled
from diple.enrollment.service import EnrollmentService,AccessDenied,EnrollmentError
from diple.enrollment.google_gateway import GoogleSheetsGatewayRepository

TAB='고교학점제'
PAGES=['수강신청 관리','학생명렬·선택과목','신청 현황','자동 이동반 편성','학생별 시간표','편성 확정·출력']

class IntegratedEnrollment(EnrollmentService):
    def __init__(self,repo,app):
        super().__init__(repo=repo)
        self.app=app;self.admin_token=secrets.token_urlsafe(40)
    def _authorize(self,token,school_id=None,role=None):
        if token!=self.admin_token:return super()._authorize(token,school_id,role)
        state=self.app.port.session_state
        if not state.get('logged_in') or not self.app.program.call('can_manage_ids'):raise AccessDenied('기존 학교 관리자 권한이 필요합니다.')
        if state.get('_auth_stale'):raise AccessDenied('관리자 권한을 재확인해야 합니다.')
        scope=config(self.app)['school_id']
        if school_id is not None and school_id!=scope or role not in (None,'admin'):raise AccessDenied('학교 또는 역할 권한 오류')
        return {'school_id':scope,'role':'admin','student_id':None,'username':state.get('user_id'),'account_id':state.get('user_id')}
    def bootstrap_admin(self,*args,**kw):raise AccessDenied('기존 srbmaster 관리자 인증을 사용하세요.')

def config(app):
    from backend.sheet_config import resolve
    return resolve(app.port.secrets)

def get_service(app):
    if getattr(app,'_credit_service',None) is None:
        c=config(app)
        namespace='srb_credit_v1_'+hashlib.sha256(c.get('school_id','').encode()).hexdigest()[:24]
        if c.get('storage_mode')=='direct':
            from backend.direct_sheets import DirectSheetsRepository
            repo=DirectSheetsRepository(app.program.call('get_gspread_client'),c['expected_spreadsheet_id'],namespace)
        else:
            if not c.get('school_id') or not c.get('gateway_url') or not c.get('gateway_shared_key'):
                raise EnrollmentError('확장 시트 주소를 school_sheets.Gogyohak_sheet 또는 Semester_sheet에 입력하고 기존 서비스 계정에 편집 권한을 공유하세요. 기존 credit 게이트웨이도 지원합니다.')
            repo=GoogleSheetsGatewayRepository(c['gateway_url'],c['gateway_shared_key'],namespace,expected_spreadsheet_id=c.get('expected_spreadsheet_id'))
        app._credit_service=IntegratedEnrollment(repo,app)
    return app._credit_service

def load_views(app):
    if getattr(app,'_credit_views',None):return app._credit_views
    adapter=CreditPort(app.port)
    shared={'st':adapter,'service':lambda:get_service(app),'_secret':lambda section,key,default=None:config(app).get(key,default),
            '_admin_login':lambda svc,sid:svc.admin_token}
    views=[]
    for name in ('enrollment_view','sectioning_view'):
        mod=ModuleType('backend.credit.'+name);mod.__dict__.update(shared)
        exec(compile(Path(__file__).with_name(name+'.py').read_text(),name+'.py','exec'),mod.__dict__)
        views.append(mod)
    views[1].render_resources=lambda snap,plan,svc,token,school:resource_view(app,snap,plan,svc,token,school)
    app._credit_views=(adapter,*views)
    return app._credit_views

def install(app):
    ns=app.program.namespace;original=ns['get_user_allowed_tabs'];toolbar=ns['render_top_toolbar']
    app._credit_service=None;app._credit_views=None
    def allowed():
        tabs=list(original())
        if app.port.session_state.get('logged_in') and ns['can_manage_ids']() and TAB not in tabs:tabs.append(TAB)
        return tabs
    ns['get_user_allowed_tabs']=allowed
    ns['ALL_APP_TABS'].append(TAB)
    def credit_toolbar(tabs):
        tabs=list(tabs)
        if TAB in allowed() and TAB not in tabs:tabs.append(TAB)
        toolbar(tabs)
        if app.port.session_state.get('active_tab')==TAB:
            if TAB not in allowed():raise AccessDenied('관리자 전용 메뉴입니다.')
            render_admin(app);app.port.stop()
    ns['render_top_toolbar']=credit_toolbar

def portal_link(app):
    if app.port.button('학생 온라인 수강신청',key='credit_portal_open'):
        app.port.session_state['_credit_portal']=True;raise Rerender()

def render_entry(app):
    p=app.port
    if p.session_state.get('logged_in') or not p.session_state.get('_credit_portal'):return False
    if p.button('교직원 로그인으로',key='credit_portal_close'):
        p.session_state.clear();p.active_dialog=None;p.widget_defaults.clear();app.responses.clear();app.uploads.clear();raise Rerender()
    try:
        adapter,enrollment,_=load_views(app);enrollment.student_page()
        student_timetable(app)
        from backend.operations.install import student_view
        student_view(app)
    except (EnrollmentError,ValueError) as exc:p.error(str(exc))
    return True

def project_scope(app):
    p=app.port;c=config(app)
    adapter=load_views(app)[0]
    year=adapter.number_input('학년도',min_value=2020,max_value=2100,value=int(c.get('academic_year',datetime.now().year)),key='credit_scope_year')
    semester=p.selectbox('학기',[1,2],key='credit_scope_semester')
    class_text=p.text_input('학급 목록 (학년-반, 쉼표로 구분)',value='1-1,2-1,3-1',key='credit_classes')
    classes=[]
    for ident in class_text.split(','):
        ident=ident.strip()
        if ident:
            grade=int(ident.split('-')[0])
            if grade not in (1,2,3):raise ValueError('학급은 1-1 형식으로 입력하세요.')
            classes.append({'id':ident,'name':ident,'grade':grade})
    subjects=p.text_input('개설 과목 목록 (쉼표 구분)',key='credit_subjects')
    return {'school':{'id':c.get('school_id',''),'name':app.program.namespace['SCHOOL_NAME'],'academic_year':year,'semester':semester},
            'classes':classes,'subjects':[{'id':x.strip(),'name':x.strip()} for x in subjects.split(',') if x.strip()], 'students':[]}

def render_admin(app):
    p=app.port
    try:
        adapter,enrollment,sectioning=load_views(app)
        if not sheets_enabled(p.secrets):
            p.info('확장 시트 미설정: Secrets의 school_sheets.Gogyohak_sheet에 문서 주소를 입력하세요. 기존 서비스 계정의 편집 권한이 필요합니다.')
            return
        project=project_scope(app)
        page=p.selectbox('고교학점제 업무',PAGES,key='credit_page')
        get_service(app)
        adapter.pages={'수강신청 관리':['수강신청 생성','신청 게시·상태','최종 확정','감사 로그'],
                       '학생명렬·선택과목':['선택과목 그룹','학생명렬'],
                       '신청 현황':['신청 현황','미신청자','개설 가능성 분석','결과 검토'],
                       '편성 확정·출력':['최종 확정','데이터 내보내기']}.get(page)
        if page=='자동 이동반 편성':sectioning.admin_sectioning_page(project)
        elif page=='학생별 시간표':admin_timetable(app,project)
        else:enrollment.admin_page(project)
    except (EnrollmentError,ValueError) as exc:p.error(str(exc))

from diple.resources import resource_errors

def resource_view(app,snapshot,plan,svc,token,school):
    p=app.port
    p.caption('교사·교실과 실제 요일·교시를 지정하세요. 3시간 수업은 월1,월2,수1처럼 2+1시간으로 지정할 수 있습니다.')
    import json
    before=json.dumps(plan['sections'],sort_keys=True)
    for sec in plan['sections']:
        sec['teacher_id']=p.text_input(sec['section_id']+' 교사ID',value=sec.get('teacher_id',''),key='credit_t_'+sec['section_id'])
        sec['room_id']=p.text_input(sec['section_id']+' 교실ID',value=sec.get('room_id',''),key='credit_r_'+sec['section_id'])
        slots=p.text_input(sec['section_id']+' 요일·교시',value=','.join(sec.get('slots',[])),key='credit_slots_'+sec['section_id'])
        sec['slots']=[x.strip() for x in slots.split(',') if x.strip()]
    if json.dumps(plan['sections'],sort_keys=True)!=before:plan['resources_confirmed']=False
    errors=resource_errors(plan)
    if errors:p.warning('\n'.join(errors))
    if p.button('교사·교실 포함 검증 후 확정',key='credit_resource_save',disabled=bool(errors)):
        from .planning import save_confirmed
        saved=save_confirmed(svc,token,school,snapshot,plan)
        p.session_state.phase5b_plan=saved;p.success('검증된 운영구획 편성 확정 버전을 저장했습니다.')

def timetable_rows(snapshot,plan,student_id=None):
    secs={s['section_id']:s for s in plan['sections']};courses={o['offering_id']:o['course_name'] for o in snapshot['offerings']}
    return [{'학생ID':a['student_id'],'과목':courses[a['offering_id']],'운영그룹':secs[a['section_id']]['group_id'],
             '구획':secs[a['section_id']]['lane']+1,'시작':secs[a['section_id']]['offset']+1,'시수':secs[a['section_id']]['units'],
             '요일·교시':','.join(secs[a['section_id']].get('slots',[])), '교사':secs[a['section_id']].get('teacher_id',''),'교실':secs[a['section_id']].get('room_id','')}
            for a in plan['assignments'] if student_id is None or a['student_id']==student_id]

def admin_timetable(app,project):
    p=app.port;svc=get_service(app);token=svc.admin_token;school=project['school']['id']
    campaigns=svc.list_campaigns(token,school)
    if not campaigns:p.info('수강신청 회차를 생성하세요.');return
    campaign=p.selectbox('조회 회차',campaigns,format_func=lambda x:x['title'],key='credit_tt_campaign')
    snaps=svc.snapshots(token,school,campaign['campaign_id'])
    if not snaps:p.info('신청 결과를 먼저 확정하세요.');return
    snap_id=p.selectbox('조회 버전',snaps,format_func=lambda x:str(x['version']),key='credit_tt_snapshot')['snapshot_id']
    from diple.sectioning import SectioningPlanService
    planner=SectioningPlanService(svc);versions=planner.list_versions(token,school,snap_id)
    if not versions:p.info('편성 저장 버전이 없습니다.');return
    version=p.selectbox('편성 버전',versions,format_func=lambda x:str(x['version']),key='credit_tt_plan')
    plan=planner.get(token,school,version['plan_id']);snapshot=svc.get_snapshot(token,school,snap_id)
    students=[s['student_id'] for s in snapshot['students']]
    who=p.selectbox('학생',students,key='credit_tt_student')
    rows=timetable_rows(snapshot,plan,who);p.caption('교사·교실 포함 확정 버전에서 실제 요일·교시를 확인할 수 있습니다.');p.dataframe(pd.DataFrame(rows))
    p.download_button('학생 시간표 CSV',pd.DataFrame(rows).to_csv(index=False).encode('utf-8-sig'),'student_timetable.csv')

def student_timetable(app):
    p=app.port;token=p.session_state.get('student_enrollment_token')
    if not token:return
    svc=get_service(app);identity=svc.session_info(token);who=identity['student_id'];school=identity['school_id']
    with svc.repo.tx() as db:
        exists=db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sectioning_plans'").fetchone()
        if not exists:return
        records=db.execute('SELECT plan_json,snapshot_id FROM sectioning_plans WHERE school_id=? ORDER BY created_at DESC',(school,)).fetchall()
        import json
        for rec in records:
            plan=json.loads(rec['plan_json'])
            if not plan.get('resources_confirmed'):continue
            row=db.execute('SELECT snapshot_json FROM snapshots WHERE snapshot_id=? AND campaign_id=?',(rec['snapshot_id'],plan['campaign_id'])).fetchone()
            if not row:continue
            snap=json.loads(row[0]);profiles=svc.my_profile(token,school)
            if not any(x['student_id']==who for x in snap['students']):continue
            if not any(int(x['academic_year'])==int(snap['academic_year']) and int(x['semester'])==int(snap['semester']) for x in profiles):continue
            rows=timetable_rows(snap,plan,who)
            p.subheader('내 확정 시간표');p.dataframe(pd.DataFrame(rows));return

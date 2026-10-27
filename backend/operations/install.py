"""Components v2 hooks for dated operations. No legacy worksheet writes."""
from backend.sheet_config import enabled as sheets_enabled
from copy import deepcopy
from datetime import date
import secrets
import pandas as pd
from diple.operations.service import OperationError,Conflict
from backend.credit.install import get_service as credit_service,config as credit_config
from backend.credit.adapter import CreditPort
from .service import IntegratedOperations
from .source import build_project

TAB='학기 중 운영'
PAGES=['일일·주간 시간표','결강 등록','대강 추천·배정','보강 관리','수업 이동','직접 맞교환','연쇄 수업교환','교실 변경','학사행사','변경요청','승인·확정','변경 이력']

def get_service(app):
    repo=credit_service(app).repo
    if getattr(app,'_operations_service',None) is None:app._operations_service=IntegratedOperations(app,repo)
    return app._operations_service

def get_project(app):
    p=app.port;credit=credit_config(app);year=int(p.session_state.get('ops_year',credit.get('academic_year',date.today().year)))
    semester=int(p.session_state.get('ops_semester',credit.get('semester',1)))
    return build_project(app,year,semester)

def install(app):
    ns=app.program.namespace;original=ns['get_user_allowed_tabs'];toolbar=ns['render_top_toolbar']
    app._operations_service=None;app._ops_preview=None
    def allowed():
        tabs=list(original())
        if app.port.session_state.get('logged_in') and app.port.session_state.get('user_role')!='게스트' and TAB not in tabs:tabs.append(TAB)
        return tabs
    ns['get_user_allowed_tabs']=allowed
    ns['ALL_APP_TABS'].append(TAB)
    def wrapped(tabs):
        current=list(tabs)
        if TAB in allowed() and TAB not in current:current.append(TAB)
        toolbar(current)
        if app.port.session_state.get('active_tab')==TAB:
            if TAB not in allowed():raise PermissionError('학기 중 운영 권한이 없습니다.')
            render(app);app.port.stop()
    ns['render_top_toolbar']=wrapped

def stage(app,svc,project,actor,kind,changes,reason):
    svc.refresh_external()
    preview=svc.preview(project,actor,changes)
    if preview['errors']:raise Conflict(' / '.join(preview['errors'][:8]))
    app._ops_preview={'token':secrets.token_urlsafe(24),'owner':app._owner(),'scope':project['school'],
        'kind':kind,'changes':deepcopy(changes),'reason':reason,'preview':preview}
    return {'valid':True}

def handle(app,action,payload):
    if not app.port.session_state.get('logged_in'):raise PermissionError('로그인이 필요합니다.')
    svc=get_service(app);actor=svc.actor();project=get_project(app)
    svc.refresh_external()
    if action=='preview':
        day=payload['day'];state=svc.day(project,day,actor)
        if state['base_id'].startswith('semester-') and payload.get('base_id')!=state['base_id']:raise Conflict('기본 시간표 버전이 변경되었습니다. 최신 화면에서 다시 선택하세요.')
        if payload.get('revision')!=state['rev']:raise Conflict('이전 화면입니다. 다시 조회하세요.')
        source=payload['occurrence_id'];target=payload.get('target_id');period=payload['to_period'];to_day=payload.get('to_date',day)
        if type(period)!=int or not 1<=period<=12:raise OperationError('교시 범위 오류')
        changes=[{'action':'move','date':day,'occurrence_id':source,'to_date':to_day,'to_period':period}]
        if target:
            if to_day!=day:raise OperationError('드래그 맞교환은 같은 날짜만 지원합니다.')
            lessons={x['id']:x for x in state['lessons']}
            if target not in lessons or source not in lessons or target==source:raise OperationError('교환 대상 오류')
            changes=svc.swap_changes(project,actor,day,[source,target])
        return stage(app,svc,project,actor,'swap' if target else 'move',changes,payload.get('reason','시간표 변경 요청'))
    if action=='close_preview':app._ops_preview=None;return {'closed':True}
    if action=='submit_preview':
        pending=app._ops_preview
        if not pending or payload.get('token')!=pending['token'] or pending['owner']!=app._owner() or pending['scope']!=project['school']:raise Conflict('유효한 미리보기가 없습니다.')
        req=svc.submit_checked(project,actor,pending['kind'],pending['changes'],pending['reason'],pending['preview']['expected_revisions'])
        app._ops_preview=None
        return {'request_id':req,'status':'submitted'}
    raise OperationError('지원하지 않는 학기 중 운영 요청')

def safe_lessons(lessons):
    return [{k:v for k,v in l.items() if k not in ('student_ids',)} for l in lessons]

def grid_node(app,svc,project,actor,day):
    state=svc.day(project,day,actor)
    preview=getattr(app,'_ops_preview',None)
    wire_preview=None
    if preview and preview['owner']==app._owner():
        wire_preview={'token':preview['token'],'reason':preview['reason'],'kind':preview['kind'],
            'before':{d:safe_lessons(v) for d,v in preview['preview']['before'].items()},
            'after':{d:safe_lessons(v) for d,v in preview['preview']['after'].items()}}
    displayed=safe_lessons(state['lessons'])
    if actor['role']=='admin':
        affected={x['lesson']['id'] for x in svc.affected(project,actor,day)}
        displayed=[{**l,'unassigned':l['id'] in affected} for l in displayed]
    app.port.emit('operations_editor',key='operations_editor',day=day,revision=state['rev'],base_id=state['base_id'],publishedRevision=state['published_rev'],
        lessons=displayed,preview=wire_preview,max_period=max(project['periods_by_day'].values()),
        classes=project['classes'])
    return state

def render(app):
    p=app.port;a=CreditPort(p)
    if not sheets_enabled(p.secrets):
        p.info('학기 중 운영 확장 저장소를 설정하면 사용할 수 있습니다. 임시 SQLite 운영 저장은 비활성화되어 있습니다.');return
    try:
        svc=get_service(app);actor=svc.actor();admin=actor['role']=='admin';svc.refresh_external()
        a.number_input('운영 학년도',min_value=2020,max_value=2100,value=int(credit_config(app).get('academic_year',date.today().year)),key='ops_year')
        p.selectbox('운영 학기',[1,2],key='ops_semester')
        day=p.date_input('운영 날짜',value=app.program.call('_today_kst'),key='ops_day').isoformat()
        page=p.selectbox('학기 중 운영 업무',PAGES if admin else ['일일·주간 시간표','수업 이동','변경요청'],key='ops_page')
        project=get_project(app)
        if admin:
            with p.expander('기본 시간표·이동반 기준 버전'):
                effective=p.date_input('기준 적용 시작일',value=date.fromisoformat(day),key='ops_effective').isoformat()
                if p.button('현재 시간표·확정 이동반을 기준으로 등록',key='ops_register'):
                    p.success('기준 등록: '+svc.register_base(project,effective,actor))
        current_base=svc.day(project,day,actor)['base_id']
        scope_key=(project['school']['id'],project['school']['academic_year'],project['school']['semester'],day)
        prior=p.session_state.get('_ops_screen_base')
        p.session_state['_ops_screen_base']=(scope_key,current_base)
        if p.event and prior and prior[0]==scope_key and prior[1]!=current_base:
            p.session_state['_ops_base_changed_notice']=True;p.rerun()
        if p.session_state.pop('_ops_base_changed_notice',False):p.warning('기본 시간표 버전이 변경되어 이전 화면의 작업은 실행하지 않았습니다. 다시 선택하세요.')
        if page=='일일·주간 시간표':
            mode=p.radio('조회 범위',['일일','주간'],key='ops_view')
            if mode=='주간':
                for item in svc.week(project,day,actor):p.subheader(item['day']);p.dataframe(pd.DataFrame(safe_lessons(item['lessons'])))
            else:
                state=grid_node(app,svc,project,actor,day)
                p.caption(f"확정 변경 버전 {state['rev']} / 배포 버전 {state['published_rev']}")
                if p.checkbox('마지막 배포 결과',key='ops_show_published'):p.dataframe(pd.DataFrame(safe_lessons(svc.day(project,day,actor,published=True)['lessons'])))
                p.download_button('일일 시간표 Excel',svc.operational_excel(project,actor,day),'daily_operations.xlsx')
            if admin:
                try:
                    p.subheader('기존 시험감독 저장 결과');p.dataframe(pd.DataFrame([r for r in svc.exams() if r['date']==day]))
                except OperationError as exc:p.warning(str(exc))
            return
        daily=svc.day(project,day,actor);lessons=daily['lessons'];names={t['id']:t['name'] for t in project['teachers']}
        if page=='결강 등록':
            teacher=p.selectbox('결강 교사',list(names),key='ops_abs_teacher')
            end=p.date_input('결강 종료일',value=date.fromisoformat(day),key='ops_abs_end').isoformat()
            periods=a.multiselect('결강 교시 (비우면 전일)',list(range(1,13)),key='ops_abs_periods')
            kind=p.selectbox('결강 종류',['출장','연가','병가','공가','기타'],key='ops_abs_kind')
            reason=p.text_input('결강 사유',key='ops_abs_reason')
            if p.button('결강 등록',key='ops_abs_save'):p.success(svc.absent(project,actor,teacher,day,end,periods,kind,reason))
            p.dataframe(pd.DataFrame(svc.affected(project,actor,day)));return
        if page=='대강 추천·배정':
            affected=svc.affected(project,actor,day)
            if not affected:p.info('등록된 결강 영향 수업이 없습니다.');return
            chosen=p.selectbox('대강 대상 수업',list({x['lesson']['id']:x['lesson'] for x in affected}),key='ops_sub_lesson')
            candidates=svc.substitute_candidates(project,actor,day,chosen)
            for candidate in candidates:
                if candidate['eligible'] and not candidate['reason']:candidate['reason']='시간 중복 없음 · 담당교과 및 학교 제한 통과'
            p.dataframe(pd.DataFrame(candidates))
            eligible=[c['teacher_id'] for c in candidates if c['eligible']]
            if not eligible:p.warning('가능한 대강 후보가 없어 미배정으로 유지합니다.');return
            teacher=p.selectbox('대강 후보',eligible,key='ops_sub_teacher')
            if p.button('대강 변경안 검증',key='ops_sub_preview'):stage(app,svc,project,actor,'substitute',[{'action':'substitute','date':day,'occurrence_id':chosen,'teacher_id':teacher}],'결강 대강 배정 요청')
            grid_node(app,svc,project,actor,day);return
        if page in ('변경요청','승인·확정','변경 이력'):
            if page=='변경 이력':p.dataframe(pd.DataFrame(svc.history(project,actor)));return
            drafts=svc.drafts(project,actor)
            if drafts:
                draft=p.selectbox('임시 저장 변경안',drafts,format_func=lambda x:x['reason'],key='ops_saved_draft')
                if p.button('임시 변경안 다시 검증',key='ops_reload_draft'):
                    import json
                    stage(app,svc,project,actor,draft['kind'],json.loads(draft['changes']),draft['reason'])
            requests=svc.requests(project,actor)
            p.dataframe(pd.DataFrame(requests))
            if requests:
                req=p.selectbox('변경요청 선택',requests,format_func=lambda x:x['kind']+' · '+x['status']+' · '+x['request_id'][:8],key='ops_request')
                reason=p.text_input('검토 처리 사유',value='변경안 검토 완료',key='ops_review_reason')
                if admin:
                    if req['status']=='submitted' and p.button('검토 시작',key='ops_review_start'):svc.begin_review(project,actor,req['request_id']);p.rerun()
                    if req['status'] in ('submitted','reviewing'):
                        if p.button('승인',key='ops_approve'):svc.review(project,actor,req['request_id'],True,reason);p.rerun()
                        if p.button('반려',key='ops_reject'):svc.review(project,actor,req['request_id'],False,reason);p.rerun()
                    if req['status']=='approved' and p.button('변경 확정',key='ops_confirm'):svc.confirm(project,actor,req['request_id']);p.rerun()
            if admin and p.button('현재 날짜 확정본 배포',key='ops_publish'):svc.publish(project,actor,day,daily['rev']);p.rerun()
            grid_node(app,svc,project,actor,day);return
        reason=p.text_input('변경 사유',value='수업 운영 변경 요청',key='ops_reason')
        changes=[];kind='move'
        if page=='학사행사':
            title=p.text_input('행사명',key='ops_event_title')
            classes=a.multiselect('대상 학급 (비우면 전체)',[c['id'] for c in project['classes']],key='ops_event_classes')
            periods=a.multiselect('행사 교시 (비우면 전일)',list(range(1,13)),key='ops_event_periods')
            changes=[{'action':'event','date':day,'title':title,'class_ids':classes,'periods':periods}];kind='event'
        elif page in ('직접 맞교환','연쇄 수업교환'):
            selected=a.multiselect('교환할 수업 (선택 순서로 순환)',[l['id'] for l in lessons if l['status']!='cancelled'],format_func=lambda ident:next(str(l['period'])+'교시 '+l['label']+' '+','.join(l['teacher_ids']) for l in lessons if l['id']==ident),key='ops_chain')
            if len(selected)>=2:changes=svc.swap_changes(project,actor,day,selected)
            kind='chain' if page=='연쇄 수업교환' else 'swap'
            if kind=='swap' and len(selected)!=2:changes=[]
            if kind=='chain' and len(selected)<3:changes=[]
        elif lessons:
            chosen=p.selectbox('변경할 수업',lessons,format_func=lambda l:str(l['period'])+'교시 '+l['label']+' '+','.join(l['teacher_ids']),key='ops_form_lesson')
            if page=='교실 변경':
                room=p.selectbox('변경 교실',[r['id'] for r in project['rooms']],key='ops_room')
                changes=[{'action':'room','date':day,'occurrence_id':chosen['id'],'room_id':room}];kind='room'
            else:
                target=p.date_input('변경 대상일',value=date.fromisoformat(day),key='ops_target_day').isoformat()
                period=a.number_input('변경 대상 교시',min_value=1,max_value=12,value=chosen['period'],key='ops_target_period')
                kind='makeup' if page=='보강 관리' else 'move'
                changes=[{'action':kind,'date':day,'occurrence_id':chosen['id'],'to_date':target,'to_period':period}]
        if p.button('임시 저장',key='ops_draft_save',disabled=not changes):p.success(str(svc.save_draft(project,actor,kind,changes,reason)))
        if p.button('서버 검증·미리보기',key='ops_form_preview',disabled=not changes):stage(app,svc,project,actor,kind,changes,reason)
        grid_node(app,svc,project,actor,day)
    except (ValueError,PermissionError) as exc:p.error(str(exc))

def student_view(app):
    """Only authenticated enrollment identity can select its published dated lessons."""
    token=app.port.session_state.get('student_enrollment_token')
    if not token:return
    try:
        credit=credit_service(app);identity=credit.session_info(token)
        profiles=credit.my_profile(token,identity['school_id'])
        if not profiles:return
        p=app.port;day=p.date_input('나의 변경 시간표 날짜',value=date.today(),key='student_operations_day').isoformat()
        profile=profiles[0];svc=get_service(app)
        actor={'school_id':identity['school_id'],'user_id':identity['student_id'],'role':'student'}
        project=svc.student_project(identity['school_id'],profile['academic_year'],profile['semester'],day,actor)
        daily=svc.day(project,day,actor,published=True)
        p.subheader('나의 배포된 변경 시간표');p.dataframe(pd.DataFrame(safe_lessons(daily['lessons'])))
    except OperationError:app.port.info('이 날짜의 배포된 변경 시간표가 없습니다.')

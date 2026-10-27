"""Semester React v2 screens and allowlisted commands using existing authentication."""
from backend.sheet_config import enabled as sheets_enabled
from datetime import date
from copy import deepcopy
import json,uuid
import pandas as pd
from backend.credit.adapter import CreditPort
from backend.credit.install import get_service as credit_service,config
from .model import SemesterError,compile_project,digest,validate,WEIGHTS
from .service import SemesterService
from . import jobs
from .io import FIELDS,NUMBERS,rows_for_editor,parse_rows,template,read_upload,timetable_rows,export_excel,export_html

TAB='학기 시간표 편성'
PAGES=['학년도·학기 관리','교사·학급·교실·과목','교육과정·시수·교사 배당','선택과목·이동반 연결','편성 조건','자동편성','시간표 편집','검증·후보 비교','확정·적용·출력','편성 이력']

def authorize(app,write=False,confirm=False):
    state=app.port.session_state
    if not state.get('logged_in') or state.get('user_role')=='게스트' or state.get('_auth_stale'):raise PermissionError('기존 로그인 및 최신 권한 확인이 필요합니다.')
    settings=app.port.secrets.get('semester',{});ident=state.get('user_id');admin=app.program.call('can_manage_ids')
    if confirm and not(admin or ident in settings.get('confirm_ids',[])):raise PermissionError('학기 확정·적용 권한이 없습니다.')
    if write and not(admin or ident in settings.get('scheduler_ids',[])):raise PermissionError('학기 편성 담당자 권한이 없습니다.')
    return ident

def get_service(app):
    if getattr(app,'_semester_service',None) is None:
        app._semester_service=SemesterService(credit_service(app).repo,config(app)['school_id'],lambda **kw:authorize(app,**kw),lambda:app.program.call('_today_kst'),display_name=app.program.namespace['SCHOOL_NAME'])
    return app._semester_service

def install(app):
    ns=app.program.namespace;allowed=ns['get_user_allowed_tabs'];toolbar=ns['render_top_toolbar']
    app._semester_service=None;app._semester_job=None;app._semester_preview=None
    def tabs():
        values=list(allowed())
        if app.port.session_state.get('logged_in') and app.port.session_state.get('user_role')!='게스트' and TAB not in values:values.append(TAB)
        return values
    ns['get_user_allowed_tabs']=tabs;ns['ALL_APP_TABS'].append(TAB)
    def wrapped(current):
        current=list(current)
        if TAB in tabs() and TAB not in current:current.append(TAB)
        toolbar(current)
        if app.port.session_state.get('active_tab')==TAB:
            render(app);app.port.stop()
    ns['render_top_toolbar']=wrapped
    from .integration import install_reader
    install_reader(app)

def selected(app,service):
    tid=app.port.session_state.get('semester_term_id')
    if not tid:raise SemesterError('학기를 선택하세요.')
    return service.get(tid)

def handle(app,action,payload):
    authorize(app)
    if action=='close_preview':app._semester_preview=None;return {'closed':True}
    svc=get_service(app);term=selected(app,svc)
    if action=='poll':return jobs.poll(app,svc)
    if action=='cancel_job':authorize(app,write=True);jobs.stop(app);return {'status':'CANCELLED'}
    authorize(app,write=True)
    if action=='preview':
        candidate=svc.candidate(term['id'],payload['candidate_id'])
        if candidate['source_revision']!=term['revision']:raise SemesterError('입력이 바뀐 후보입니다. 다시 편성하세요.')
        places=deepcopy(candidate['result']['placements']);lookup={p['session_id']:p for p in places};source=payload['session_id'];target=payload.get('target_id');start=payload['start']
        if source not in lookup or target and target not in lookup:raise SemesterError('회차 ID 오류')
        changes=[{'session_id':source,'start':start}]
        if target:
            if source==target:raise SemesterError('같은 회차는 교환할 수 없습니다.')
            changes=[{'session_id':source,'start':lookup[target]['start']},{'session_id':target,'start':lookup[source]['start']}]
        for change in changes:lookup[change['session_id']]['start']=change['start']
        errors=validate(candidate['project'],places)
        if errors:raise SemesterError(' / '.join(errors[:12]))
        app._semester_preview={'token':uuid.uuid4().hex,'term_id':term['id'],'candidate_id':candidate['id'],'owner':app._owner(),'changes':changes,
            'before':[p for p in candidate['result']['placements'] if p['session_id'] in {c['session_id'] for c in changes}],
            'after':[p for p in places if p['session_id'] in {c['session_id'] for c in changes}]}
        return {'valid':True}
    if action=='apply_preview':
        pending=app._semester_preview
        if not pending or pending['token']!=payload.get('token') or pending['owner']!=app._owner() or pending['term_id']!=term['id']:raise SemesterError('미리보기가 만료되었습니다.')
        ident=svc.edit(term['id'],pending['candidate_id'],pending['changes']);app._semester_preview=None;app.port.session_state['semester_candidate_id']=ident
        return {'candidate_id':ident}
    raise SemesterError('지원하지 않는 학기 요청')

def choose_candidate(p,svc,term):
    candidates=svc.candidates(term['id'])
    if not candidates:p.info('먼저 자동편성 후보를 생성하세요.');return None
    ids=[c['id'] for c in candidates];current=p.session_state.get('semester_candidate_id')
    ident=p.selectbox('편성 후보',ids,index=ids.index(current) if current in ids else 0,format_func=lambda v:v[:8]+' · '+next(json.loads(c['result_json'])['status'] for c in candidates if c['id']==v),key='semester_candidate_select')
    p.session_state['semester_candidate_id']=ident
    return svc.candidate(term['id'],ident)

def render_editor(app,svc,term,candidate):
    p=app.port;project=candidate['project'];results=candidate['result'];preview=app._semester_preview
    from diple.model import expand_sessions
    subjects={s['id']:s['name'] for s in project['subjects']};teachers={t['id']:t['name'] for t in project['teachers']}
    sessions={s['session_id']:s for s in expand_sessions(project)}
    audience=p.selectbox('조회 기준',['학교 전체','학급별','교사별','교실별','이동반별','학생별'],key='semester_audience')
    field={'학급별':'class_ids','교사별':'teacher_ids','학생별':'student_ids'}.get(audience)
    category={'학급별':'classes','교사별':'teachers','교실별':'rooms','학생별':'students'}.get(audience)
    value=None
    if category:
        opts=[x['id'] for x in project[category]]
        if opts:value=p.selectbox('조회 대상',opts,format_func=lambda ident:next(str(r.get('name',ident))+' ('+ident+')' for r in project[category] if r['id']==ident),key='semester_audience_target')
    elif audience=='이동반별':
        opts=[r['id'] for r in project['curriculum'] if r.get('source_plan_id')]
        if opts:value=p.selectbox('이동반 배당',opts,key='semester_audience_credit')
    lessons=[]
    for placed in results['placements']:
        session=sessions[placed['session_id']]
        if field and value and value not in session[field]:
            if audience!='학생별' or not any(s['id']==value and s['class_id'] in session['class_ids'] for s in project['students']):continue
        if audience=='교실별' and value and placed.get('room_id')!=value:continue
        if audience=='이동반별' and (not value or session['source_request_id']!=value):continue
        lessons.append({'id':session['session_id'],'start':placed['start'],'duration':session['duration'],'label':subjects[session['subject_id']],
            'teachers':', '.join(teachers[t] for t in session['teacher_ids']),'room':placed.get('room_id',''),'classes':session['class_ids'],'locked':bool(session.get('fixed_start'))})
    visible_preview={k:v for k,v in preview.items() if k in ('token','before','after')} if preview and preview['owner']==app._owner() and preview['term_id']==term['id'] else None
    p.emit('semester_editor',key='semester_editor',candidate_id=candidate['id'],lessons=lessons,grid=project['periods_by_day'],preview=visible_preview)

def render(app):
    p=app.port;a=CreditPort(p)
    if not sheets_enabled(p.secrets):p.info('학기 편성은 기존 확장 저장소 설정 후 사용할 수 있습니다. 임시 디스크 저장은 사용하지 않습니다.');return
    try:
        svc=get_service(app);settings=p.secrets.get('semester',{});admin=app.program.call('can_manage_ids');write=admin or p.session_state.get('user_id') in settings.get('scheduler_ids',[])
        confirm=admin or p.session_state.get('user_id') in settings.get('confirm_ids',[])
        if not write and not confirm:
            from .integration import active
            day=p.date_input('조회 날짜',value=app.program.call('_today_kst'),key='semester_read_day').isoformat();project=active(app,day)
            if not project:p.info('이 날짜에 배포된 학기 시간표가 없습니다.');return
            teacher=next((t['id'] for t in project['teachers'] if t['name']==p.session_state.get('user_name')),None)
            result={'status':'APPLIED',**project['published']};rows=timetable_rows(project,result)
            p.dataframe(pd.DataFrame([{k:v for k,v in row.items() if k!='학생ID'} for row in rows if teacher and teacher in row['교사ID'].split(',')]));return
        page=p.selectbox('학기 편성 업무',PAGES if write else [PAGES[7],PAGES[8],PAGES[9]],key='semester_page')
        terms=svc.list();ids=[t['id'] for t in terms]
        if terms:
            tid=p.selectbox('작업 학기',ids,index=ids.index(p.session_state.get('semester_term_id')) if p.session_state.get('semester_term_id') in ids else 0,format_func=lambda t:json.loads(next(x['project_json'] for x in terms if x['id']==t))['term']['name'],key='semester_term_select')
            if tid!=p.session_state.get('semester_term_id'):
                jobs.stop(app);app._semester_preview=None;p.session_state['semester_term_id']=tid
        if page=='학년도·학기 관리':
            year=a.number_input('학년도',min_value=2020,max_value=2100,value=app.program.call('_today_kst').year,key='semester_create_year')
            semester=p.selectbox('학기',[1,2],key='semester_create_semester');name=p.text_input('학기명',value='새 학기 시간표',key='semester_create_name')
            start=p.date_input('학기 시작일',value=app.program.call('_today_kst'),key='semester_create_start').isoformat()
            end=p.date_input('학기 종료일',value=date(start and int(start[:4]),12,31),key='semester_create_end').isoformat()
            copy_id=p.selectbox('기초자료 복사 원본',['']+ids,key='semester_copy_source')
            p.caption('복사는 기초 마스터와 편성 조건만 복사합니다. 학생·신청·확정 상태는 복사하지 않습니다.')
            if p.button('학기 생성',key='semester_create'):
                p.session_state['semester_term_id']=svc.create(year,semester,name,start,end,copy_id or None);p.rerun()
            p.dataframe(pd.DataFrame([{k:v for k,v in t.items() if k!='project_json'} for t in terms]));return
        term=selected(app,svc);project=term['project']
        p.caption(f"{project['term']['name']} · 자료 버전 {term['revision']}")
        if page=='교사·학급·교실·과목' and p.button('기존 시간표 자료를 작업본으로 가져오기',key='semester_import_legacy'):
            from backend.operations.source import build_project
            source=build_project(app,term['academic_year'],term['semester']);updated=deepcopy(project)
            for category in ('teachers','classes','rooms','subjects','students'):updated[category]=deepcopy(source[category])
            if not source.get('semester_version_id'):
                capacities=app.port.secrets.get('operations',{}).get('room_capacities',{})
                for room in updated['rooms']:room['capacity']=int(capacities.get(room['id'],0))
            ns=app.program.namespace;availability=ns['get_teacher_availability_index'](p.session_state.get('_data_version',0));parttime=p.session_state.get('part_time',pd.DataFrame())
            for teacher in updated['teachers']:
                name=teacher['name'];configured,slots=availability.get(name,(False,set()))
                if configured:teacher['available_slots']=[d+str(n) for d,n in sorted(slots)]
                if isinstance(parttime,pd.DataFrame):
                    rows=[row for _,row in parttime.iterrows() if str(row.get('시간강사명','')).strip()==name]
                    if rows:
                        covering=[row for row in rows if (not ns['normalize_date_str'](row.get('시작일','')) or ns['normalize_date_str'](row.get('시작일',''))<=project['term']['starts_at']) and (not ns['normalize_date_str'](row.get('종료일','')) or ns['normalize_date_str'](row.get('종료일',''))>=project['term']['ends_at'])]
                        teacher['available_slots']=[d+str(n) for d,count in project['periods_by_day'].items() for n in range(1,count+1) if any(ns['_part_time_available'](row,d,n) for row in covering)]

            updated['curriculum']=[{**deepcopy(l),'split':[l['duration']]*(l['weekly_periods']//l['duration'])} for l in source['lessons']]
            updated['legacy_mapping']={category:{r['id']:r.get('name',r['id']) for r in updated[category]} for category in ('teachers','classes','subjects','rooms')}
            svc.save(term['id'],updated,term['revision']);p.rerun()
        if page in ('교사·학급·교실·과목','교육과정·시수·교사 배당'):
            category=p.selectbox('입력 자료',['teachers','classes','rooms','subjects','students'] if page.startswith('교사') else ['curriculum'],key='semester_category')
            p.caption('고유 ID는 연결 기준입니다. 목록은 ["T1","T2"] 또는 쉼표 구분, 시수 분할은 2+1로 입력합니다.')
            p.download_button('Excel 입력 양식',template(),'semester_input.xlsx')
            upload=p.file_uploader('학기 기초자료 Excel/CSV',type=['xlsx','csv'],key='semester_upload')
            import_rows=None
            if upload:
                df=read_upload(upload,category)
                p.dataframe(df)
                mapping={key:p.selectbox('열 매핑 '+key,['']+list(df.columns),index=(list(df.columns).index(key)+1 if key in df.columns else 0),key='semester_map_'+category+'_'+key) for key in FIELDS[category]}
                if p.button('업로드 자료 검증·미리보기',key='semester_import_preview'):
                    prepared=parse_rows([{key:row.get(source,'') for key,source in mapping.items()} for row in df.to_dict('records')],category)
                    p.session_state['semester_import_preview']=(term['id'],category,term['revision'],prepared);p.success('행 형식·ID 검증을 통과했습니다. 전체 편성 검증은 사전검증에서 수행합니다.')
                saved=p.session_state.get('semester_import_preview')
                if saved and saved[:3]==(term['id'],category,term['revision']):
                    p.dataframe(pd.DataFrame(saved[3]))
                    if p.button('검증된 업로드 자료 반영',key='semester_import_apply'):
                        updated=deepcopy(project);updated[category]=saved[3];svc.save(term['id'],updated,term['revision']);p.session_state.pop('semester_import_preview',None);p.rerun()
            if category=='classes':
                counts={g:a.number_input(str(g)+'학년 학급 수',min_value=0,max_value=30,value=sum(c.get('grade')==g for c in project['classes']),key='semester_grade_count_'+str(g)) for g in (1,2,3)}
                if p.button('학년별 학급 목록 생성·조정',key='semester_generate_classes'):
                    oldbyname={c['name']:c for c in project['classes']};desired=[]
                    for grade,count in counts.items():
                        for number in range(1,count+1):
                            name=str(grade)+'-'+str(number);desired.append(deepcopy(oldbyname.get(name,{'id':'G'+str(grade)+'C'+str(number),'name':name,'grade':grade,'size':0,'blocked':[]})))
                    removed={c['id'] for c in project['classes']}-{c['id'] for c in desired}
                    if any(removed&set(r.get('class_ids',[])) for r in project['curriculum']) or any(s['class_id'] in removed for s in project['students']):raise SemesterError('수업·학생이 연결된 학급은 먼저 연결을 조정해야 삭제할 수 있습니다.')
                    updated=deepcopy(project);updated['classes']=desired;svc.save(term['id'],updated,term['revision']);p.rerun()
            rows=rows_for_editor(project,category);df=pd.DataFrame(rows,columns=FIELDS[category])
            configuration={k:p.column_config.NumberColumn(k,default=0,min_value=0) for k in NUMBERS if k in df.columns}
            edited=p.data_editor(df,key='semester_edit_'+category,num_rows='dynamic',column_config=configuration)
            if p.button('자료 저장',key='semester_save_data'):
                updated=deepcopy(project);updated[category]=parse_rows(edited.to_dict('records'),category);svc.save(term['id'],updated,term['revision']);p.rerun()
            with p.expander('기존 데이터 이름·ID 연결'):
                mapping=project.get('legacy_mapping',{}).get(category,{})
                table=pd.DataFrame([{'id':row['id'],'legacy_name':mapping.get(row['id'],row.get('name',''))} for row in project[category]],columns=['id','legacy_name'])
                edited_map=p.data_editor(table,key='semester_mapping_editor',disabled=['id'])
                if p.button('기존 데이터 연결 저장',key='semester_save_mapping'):
                    updated=deepcopy(project);updated['legacy_mapping'][category]={r['id']:r['legacy_name'] for r in edited_map.to_dict('records') if r['legacy_name']};svc.save(term['id'],updated,term['revision']);p.rerun()
            return
        if page=='선택과목·이동반 연결':
            with svc.repo.tx() as db:
                exists=db.execute("SELECT 1 FROM sqlite_master WHERE name='sectioning_plans'").fetchone()
                rows=[dict(r) for r in db.execute('SELECT plan_id,plan_json FROM sectioning_plans WHERE school_id=?',(svc.school,))] if exists else []
            plans=[r for r in rows if json.loads(r['plan_json'])['academic_year']==term['academic_year'] and json.loads(r['plan_json'])['semester']==term['semester']]
            if not plans:p.info('이 학년도·학기의 저장된 이동반 계획이 없습니다.');return
            ident=p.selectbox('연결할 분반 버전',[r['plan_id'] for r in plans],key='semester_credit_plan');plan=json.loads(next(r['plan_json'] for r in plans if r['plan_id']==ident))
            p.dataframe(pd.DataFrame(plan['sections']));keep=p.checkbox('저장된 실제 요일·교시 고정',value=True,key='semester_credit_keep')
            teachers={};rooms={}
            for sec in plan['sections']:
                sid=sec['section_id'];teachers[sid]=p.selectbox(sid+' 담당교사',[r['id'] for r in project['teachers']],key='semester_credit_teacher_'+sid)
                rooms[sid]=p.selectbox(sid+' 사용교실',[r['id'] for r in project['rooms']],key='semester_credit_room_'+sid)
            with svc.repo.tx() as db:
                rec=db.execute('SELECT snapshot_json FROM snapshots WHERE snapshot_id=?',(plan['source_snapshot_id'],)).fetchone()
            snapshot=json.loads(rec[0])
            class_map={cl:p.selectbox(cl+' 원본 학급을 연결할 학급',[r['id'] for r in project['classes']],key='semester_credit_class_'+cl) for cl in sorted({s['class_id'] for s in snapshot['students']})}
            replace=a.multiselect('명시적으로 대체할 기존 배당 ID',[r['id'] for r in project['curriculum']],key='semester_credit_replace')
            if p.button('분반 검증·연결',key='semester_credit_link'):svc.link_credit(term['id'],term['revision'],ident,teachers,rooms,replace,keep,class_map);p.rerun()
            return
        if page=='편성 조건':
            updated=deepcopy(project)
            for day in '월화수목금':updated['periods_by_day'][day]=a.number_input(day+'요일 교시 수',min_value=0,max_value=12,value=project['periods_by_day'].get(day,0),key='semester_period_'+day)
            labels={'balance':'교사 일일 시수 균형','subject_spread':'동일 과목 요일 분산','gaps':'교사 중간 공강','continuous':'4교시 연속 부담','late':'늦은 교시 집중','room_changes':'교사 일별 사용교실 수','changes':'참조 후보 대비 변경'}
            for key,label in labels.items():updated['weights'][key]=a.number_input(label+' 가중치',min_value=0,max_value=100,value=project['weights'].get(key,0),key='semester_weight_'+key)
            bellrows=[{'학년':'공통' if grade=='default' else grade,'교시':int(period),'시작':times[0],'종료':times[1]} for grade,bells in project.get('bell_schedules',{}).items() for period,times in bells.items()]
            p.caption('학년별 시정표: 미설정 교시는 08:40 시작, 45분 수업·5분 휴식 기준입니다. 공통 또는 학년 숫자를 입력하세요.')
            belltable=p.data_editor(pd.DataFrame(bellrows,columns=['학년','교시','시작','종료']),key='semester_bells',num_rows='dynamic',column_config={'교시':p.column_config.NumberColumn('교시',default=1,min_value=1,max_value=12)})
            if p.button('편성 조건 저장',key='semester_save_rules'):
                updated['bell_schedules']={}
                for row in belltable.to_dict('records'):
                    grade=str(row['학년']).strip();grade='default' if grade=='공통' else grade
                    period=int(row['교시'])
                    if grade not in ('default','1','2','3') or not 1<=period<=12:raise SemesterError('시정표 학년·교시 오류')
                    if str(period) in updated['bell_schedules'].get(grade,{}):raise SemesterError('시정표 학년·교시 중복')
                    updated['bell_schedules'].setdefault(grade,{})[str(period)]=[str(row['시작']),str(row['종료'])]
                if updated['curriculum']:compile_project(updated)
                svc.save(term['id'],updated,term['revision']);p.rerun()
            return
        if page=='자동편성':
            try:compiled=compile_project(project);p.success('시수·교사 배당 사전검증 통과')
            except ValueError as exc:p.error(str(exc));return
            seconds=a.number_input('후보당 탐색 제한 초',min_value=1,max_value=180,value=10,key='semester_seconds')
            seed=a.number_input('편성 seed',min_value=1,max_value=999999,value=1,key='semester_seed');count=a.number_input('생성 후보 수',min_value=1,max_value=5,value=1,key='semester_count')
            reference=None;fixed=[];candidates=svc.candidates(term['id'])
            if candidates:
                refid=p.selectbox('재편성 참조 후보',['']+[c['id'] for c in candidates],key='semester_reference')
                if refid:
                    reference=svc.candidate(term['id'],refid)['result'];fixed=a.multiselect('재편성 중 고정할 회차 (선택 범위 밖 수업)',[r['session_id'] for r in reference['placements']],key='semester_fixed')
            if p.button('자동편성 실행',key='semester_solve'):jobs.start(app,svc,term['id'],seconds,seed,count,reference,fixed)
            state=jobs.poll(app,svc)
            if state:p.emit('semester_job',key='semester_job',state=state)
            return
        if page=='편성 이력':p.dataframe(pd.DataFrame(svc.history(term['id'])));return
        if page=='검증·후보 비교':
            comparisons=[]
            for c in svc.candidates(term['id']):
                r=json.loads(c['result_json']);comparisons.append({'후보':c['id'],'입력버전':c['source_revision'],'상태':r['status'],'점수':r.get('objective'),'소요초':r.get('elapsed'),**r.get('metrics',{})})
            p.dataframe(pd.DataFrame(comparisons))
        candidate=choose_candidate(p,svc,term)
        if not candidate:return
        errors=validate(candidate['project'],candidate['result']['placements'])
        p.info('전체 검증 오류 '+str(len(errors))+'건'+(' · 입력 변경으로 이전 후보' if candidate['source_revision']!=term['revision'] else ''))
        if errors:p.error(' / '.join(errors));return
        if page=='시간표 편집':
            render_editor(app,svc,term,candidate)
            from diple.model import expand_sessions
            sessions=expand_sessions(candidate['project']);ids=[s['session_id'] for s in sessions]
            selected_ids=a.multiselect('순서대로 연쇄 교환할 회차',ids,key='semester_chain')
            if p.button('연쇄 교환 검증·새 후보',key='semester_chain_apply',disabled=len(selected_ids)<3):
                starts={r['session_id']:r['start'] for r in candidate['result']['placements']}
                ident=svc.edit(term['id'],candidate['id'],[{'session_id':v,'start':starts[selected_ids[(i+1)%len(selected_ids)]]} for i,v in enumerate(selected_ids)]);p.session_state['semester_candidate_id']=ident;p.rerun()
            sid=p.selectbox('고정·교실 변경 회차',ids,key='semester_lock_sid');locked=p.checkbox('이 회차 고정',key='semester_lock_value')
            if p.button('고정 상태 저장',key='semester_lock'):p.session_state['semester_candidate_id']=svc.edit(term['id'],candidate['id'],[],(sid,locked));p.rerun()
            rooms=['']+[r['id'] for r in candidate['project']['rooms']];room=p.selectbox('변경 교실',rooms,key='semester_edit_room')
            if p.button('교실 변경 검증',key='semester_edit_room_save'):
                placed=next(v for v in candidate['result']['placements'] if v['session_id']==sid);p.session_state['semester_candidate_id']=svc.edit(term['id'],candidate['id'],[{'session_id':sid,'start':placed['start'],'room_id':room}]);p.rerun()
            if candidate['parent_id'] and p.button('편집 취소 (이전 후보)',key='semester_undo'):p.session_state['semester_candidate_id']=candidate['parent_id'];p.rerun()
            children=[c['id'] for c in svc.candidates(term['id']) if c['parent_id']==candidate['id']]
            if children:
                child=p.selectbox('다시 실행할 편집 후보',children,key='semester_redo_candidate')
                if p.button('편집 다시 실행',key='semester_redo'):p.session_state['semester_candidate_id']=child;p.rerun()
        if page=='확정·적용·출력':
            reason=p.text_input('확정 사유',value='학기 시간표 전체 검토 완료',key='semester_final_reason')
            p.session_state.setdefault('semester_finalize_key',uuid.uuid4().hex)
            if p.button('전체 재검증 후 학기 확정',key='semester_finalize'):
                svc.finalize(term['id'],candidate['id'],reason,p.session_state['semester_finalize_key']);p.session_state['semester_finalize_key']=uuid.uuid4().hex;p.rerun()
            finals=svc.finals(term['id'])
            if finals:
                version=p.selectbox('적용할 확정 버전',[r['id'] for r in finals],key='semester_final_select');effective=p.date_input('기본 시간표 적용 시작일',value=app.program.call('_today_kst'),key='semester_apply_date').isoformat()
                pointer=svc.pointer(term['academic_year'],term['semester'],effective);p.caption('현재 적용 버전: '+str(pointer['version_id'] if pointer else '없음'))
                from .integration import future_legacy_blockers
                with svc.repo.tx() as db:blockers=svc.activation_blockers(db,svc.school,term['academic_year'],term['semester'],effective)
                blockers+=future_legacy_blockers(app,effective)
                if blockers:p.warning('적용 전 조정 필요: '+' / '.join(blockers))
                if p.button('확정본 적용·배포',key='semester_apply',disabled=bool(blockers)):
                    from backend.operations.install import get_service as operations_service
                    operations_service(app)
                    svc.apply(term['id'],version,effective,pointer['revision'] if pointer else 0,blockers);app.program.namespace['_invalidate_all_caches']();p.rerun()
                selected_final=svc.final(term['id'],version)
                p.download_button('확정본 시간표 Excel',export_excel(selected_final['project'],selected_final['result'],{'version_id':version,'effective_from':effective if pointer and pointer['version_id']==version else '미적용','checksum':selected_final['checksum']}),'semester_final.xlsx')
                p.caption('이전 확정 버전을 선택하고 같은 적용일의 최신 포인터 버전을 확인한 뒤 적용하면 복구됩니다. 과거 날짜와 기존 변경은 덮어쓰지 않습니다.')
            p.download_button('학기 시간표 Excel',export_excel(candidate['project'],candidate['result'],{'candidate_id':candidate['id'],'state':'CANDIDATE'}),'semester_timetable.xlsx')
            p.download_button('학기 시간표 인쇄용 HTML',export_html(candidate['project'],candidate['result']),'semester_timetable.html')
        elif page=='검증·후보 비교':p.dataframe(pd.DataFrame([{k:v for k,v in r.items() if k!='학생ID'} for r in timetable_rows(candidate['project'],candidate['result'])]))
    except (ValueError,KeyError,PermissionError) as exc:p.error(str(exc))

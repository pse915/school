"""Read-only bridge from legacy Sheets-backed timetable and Phase 5B snapshots."""
from copy import deepcopy
from datetime import date
import hashlib,json
import pandas as pd
from diple.model import expand_sessions,validate_placements
from diple.operations.service import OperationError

def fingerprint(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,default=str).encode()).hexdigest()

def build_project(app,year,semester):
    from backend.credit.install import get_service,config
    c=config(app);school=c.get('school_id')
    if not school:raise OperationError('credit.school_id 학교 범위 설정이 필요합니다.')
    from backend.semester.integration import active
    selected=app.port.session_state.get('ops_day',app.program.call('_today_kst'))
    applied=active(app,selected.isoformat() if hasattr(selected,'isoformat') else str(selected),year,semester)
    if applied:return applied
    state=app.port.session_state;settings=dict(app.port.secrets.get('operations',{}))
    tt=state.get('timetable',pd.DataFrame());teacher_df=state.get('teachers',pd.DataFrame())
    if tt.empty:raise OperationError('기존 기본 시간표를 먼저 불러오세요.')
    teachers={}
    for row in teacher_df.to_dict('records'):
        name=str(row.get('교사명','')).strip()
        if name:teachers[name]={'id':name,'name':name,'subject':str(row.get('담당과목','')),'blocked':[],'max_weekly':99}
    part_time=state.get('part_time',pd.DataFrame())
    if isinstance(part_time,pd.DataFrame):
        for row in part_time.to_dict('records'):
            name=str(row.get('시간강사명','')).strip()
            if name:teachers.setdefault(name,{'id':name,'name':name,'subject':str(row.get('담당과목','')),'blocked':[],'max_weekly':99})
    for name,overrides in settings.get('teacher_rules',{}).items():
        if name in teachers:
            for key in ('substitute_subject_ids','working_weekdays','unavailable_dates','max_daily_substitutes'):
                if key in overrides:teachers[name][key]=deepcopy(overrides[key])
    classes={};subjects={};rooms={};students={};lessons=[];placements=[]
    grid={d:int(settings.get('max_periods',7)) for d in '월화수목금'}
    def lesson(ident,teacher,subject,clazz,members,room,slot,source):
        if teacher not in teachers:raise OperationError('기존 교사명과 연결되지 않은 교사ID: '+teacher)
        subjects.setdefault(subject,{'id':subject,'name':subject,'credits':0})
        if clazz:
            for cl in clazz:classes.setdefault(cl,{'id':cl,'name':cl,'grade':int(cl.split('-')[0]),'size':0,'blocked':[]})
        if room:rooms.setdefault(room,{'id':room,'name':room,'capacity':int(settings.get('room_capacities',{}).get(room,999)),'blocked':[]})
        item={'id':ident,'subject_id':subject,'teacher_ids':[teacher],'class_ids':clazz,'student_ids':members,
              'room_ids':[room] if room else [],'weekly_periods':1,'duration':1,'fixed_slots':[],'forbidden_slots':[],
              'simultaneous_group':'','source':source}
        lessons.append(item);placements.append({'session_id':ident+'#1','start':slot,'room_id':room})
    seen=set()
    for row in tt.to_dict('records'):
        teacher=str(row.get('교사명','')).strip();subject=str(row.get('과목','')).strip();clazz=str(row.get('학급','')).strip()
        wd=str(row.get('요일','')).strip();period=int(row.get('교시',0))
        if not teacher or not subject or not clazz or wd not in grid or not 1<=period<=12:continue
        teachers.setdefault(teacher,{'id':teacher,'name':teacher,'subject':subject,'blocked':[],'max_weekly':99})
        grid[wd]=max(grid[wd],period)
        key=(teacher,subject,clazz,wd,period)
        if key in seen:continue
        seen.add(key);ident='legacy-'+fingerprint(key)[:20]
        lesson(ident,teacher,subject,[x.strip() for x in clazz.split(',')],[],str(row.get('교실','')).strip(),wd+str(period),'legacy')
    svc=get_service(app)
    with svc.repo.tx() as db:
        exists=db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sectioning_plans'").fetchone()
        if exists:
            rows=db.execute('SELECT plan_json,snapshot_id FROM sectioning_plans WHERE school_id=? ORDER BY version DESC',(school,)).fetchall()
            used=set()
            for rec in rows:
                plan=json.loads(rec['plan_json'])
                if not plan.get('resources_confirmed') or int(plan['academic_year'])!=year or int(plan['semester'])!=semester or plan['campaign_id'] in used:continue
                used.add(plan['campaign_id'])
                snaprow=db.execute('SELECT snapshot_json FROM snapshots WHERE snapshot_id=?',(rec['snapshot_id'],)).fetchone()
                if not snaprow:raise OperationError('확정 분반의 신청 스냅샷이 없습니다.')
                snap=json.loads(snaprow[0]);members={sec['section_id']:[] for sec in plan['sections']}
                for a in plan['assignments']:members[a['section_id']].append(a['student_id'])
                for s in snap['students']:
                    cl=s['class_id'];classes.setdefault(cl,{'id':cl,'name':cl,'grade':int(s['grade']),'size':0,'blocked':[]})
                    students[s['student_id']]={'id':s['student_id'],'name':s.get('name',s['student_id']),'class_id':cl}
                names={o['offering_id']:o['course_name'] for o in snap['offerings']}
                from diple.resources import resource_errors
                if resource_errors(plan):raise OperationError('확정 분반 실제 시간 검증 실패')
                teacher_map=settings.get('teacher_map',{})
                for sec in plan['sections']:
                    teacher=teacher_map.get(sec['teacher_id'],sec['teacher_id'])
                    for i,slot in enumerate(sec['slots']):
                        lesson('credit-'+sec['section_id']+'-'+str(i),teacher,names[sec['offering_id']],[],members[sec['section_id']],sec['room_id'],slot,'credit')
    # expand_sessions produces lesson_id#occurrence; do not assume its format.
    by_lesson={s['id']:s['session_id'] for s in expand_sessions({'lessons':lessons})}
    for p,l in zip(placements,lessons):p['session_id']=by_lesson[l['id']]
    project={'school':{'id':school,'name':app.program.namespace['SCHOOL_NAME'],'academic_year':year,'semester':semester,
              'allow_cross_subject_substitute':settings.get('allow_cross_subject_substitute',False)},'periods_by_day':grid,
             'teachers':list(teachers.values()),'classes':list(classes.values()),'rooms':list(rooms.values()),'students':list(students.values()),
             'subjects':list(subjects.values()),'lessons':lessons,'published':{'placements':placements}}
    errors=validate_placements(project,placements)
    if errors:raise OperationError('기존 시간표·확정 이동반 통합 충돌: '+' / '.join(errors[:8]))
    return project

class LegacyReadAdapter:
    def __init__(self,app):self.app=app
    def exam(self):
        from backend.exam_supervision.install import get_service
        service=get_service(self.app);service.authorize('getConfirmed');service.ensure_connected();service.repo.reload()
        data=service.handle('getConfirmed',{})
        from backend.exam_supervision.models import read_state
        variants=[(data,'기존 시험감독 저장본')]
        active=read_state(service.repo.tables).get('activeVersion')
        if active:variants.append((service.version_preview(active,raw=True),'기존 시험감독 확정본 '+active))
        result=[]
        for variant,label in variants:
            names={t['id']:t['name'] for t in variant['teachers']}
            result.extend({'date':a['date'],'period':int(a['period']),'teacher_id':names.get(a['teacherId'],a['teacherId']),
                'class_id':a.get('classId',''),'role':a.get('role',''),'source':label} for a in variant['assignments'])
        return result
    def blocked(self,project,day,lesson):
        app=self.app;ns=app.program.namespace;errors=[];periods=range(lesson['period'],lesson['period']+lesson['duration'])
        duties=ns['_duty_slot_index'](app.port.session_state.get('_data_version',0))
        for stable_teacher in lesson['teacher_ids']:
            teacher=project.get('legacy_mapping',{}).get('teachers',{}).get(stable_teacher,next((t['name'] for t in project['teachers'] if t['id']==stable_teacher),stable_teacher))
            for period in periods:
                if (day,0) in duties.get(teacher,set()) or (day,period) in duties.get(teacher,set()):errors.append(teacher+': 출장·휴가')
                weekday='월화수목금'[date.fromisoformat(day).weekday()] if date.fromisoformat(day).weekday()<5 else ''
                if not ns['teacher_slot_is_available'](teacher,weekday,period,app.port.session_state.get('_data_version',0)):
                    errors.append(teacher+': 시간강사·겸임 근무 불가')
                part_time=app.port.session_state.get('part_time',pd.DataFrame())
                if isinstance(part_time,pd.DataFrame) and not part_time.empty:
                    candidates=[row for _,row in part_time.iterrows() if str(row.get('시간강사명','')).strip()==teacher]
                    if candidates:
                        def permits(row):
                            start=ns['normalize_date_str'](row.get('시작일',''));end=ns['normalize_date_str'](row.get('종료일',''))
                            return (not start or start<=day) and (not end or day<=end) and ns['_part_time_available'](row,weekday,period)
                        if not any(permits(row) for row in candidates):errors.append(teacher+': 시간강사 계약기간·근무교시 제한')
        return errors

    def daily_lessons(self,project,day):
        from diple.operations.service import OperationsService
        if project.get('semester_version_id'):
            return OperationsService._lesson_occurrences(project,day)
        ns=self.app.program.namespace
        tt=ns['get_effective_timetable_for_date'](day,self.app.port.session_state.get('_data_version',0))
        regular=[]
        if isinstance(tt,pd.DataFrame):
            for row in tt.to_dict('records'):
                teacher=str(row.get('교사명','')).strip();subject=str(row.get('과목','')).strip();clazz=str(row.get('학급','')).strip()
                period=int(row.get('교시',0))
                if not teacher or not subject or not clazz or period<1:continue
                ident='legacy-dated-'+fingerprint([teacher,subject,clazz,period])[:20]
                regular.append({'id':day+':'+ident,'base_session_id':ident,'lesson_id':ident,'date':day,'period':period,'duration':1,
                    'teacher_ids':[teacher],'origin_teacher_ids':[teacher],'class_ids':[x.strip() for x in clazz.split(',')],
                    'student_ids':[],'room_id':str(row.get('교실','')).strip(),'subject_id':subject,'label':subject,
                    'kind':'base','status':'scheduled','origin_period':period,'room_options':[],'locked':False})
        credit_ids={l['id'] for l in project['lessons'] if l.get('source')=='credit'}
        credits=[l for l in OperationsService._lesson_occurrences(project,day) if l['lesson_id'] in credit_ids]
        return regular+credits

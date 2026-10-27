"""Semester curriculum -> existing scheduler model, plus independent clock validation."""
from copy import deepcopy
from collections import defaultdict
from datetime import date
import hashlib,json
from diple.model import validate_project,validate_placements,expand_sessions,block_slots,index

def digest(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

class SemesterError(ValueError):pass
class RevisionConflict(SemesterError):pass

WEIGHTS={'balance':3,'subject_spread':6,'gaps':2,'continuous':2,'late':1,'room_changes':1,'changes':8}

def empty_project(school,year,semester,name,start,end):
    return {'school':{'id':school,'academic_year':int(year),'semester':int(semester),'name':name},
            'term':{'name':name,'starts_at':start,'ends_at':end},'periods_by_day':{d:7 for d in '월화수목금'},
            'bell_schedules':{},'teachers':[],'classes':[],'rooms':[],'subjects':[],'students':[],
            'curriculum':[],'weights':dict(WEIGHTS),'legacy_mapping':{'teachers':{},'classes':{},'subjects':{},'rooms':{}},'credit_links':[]}

def compile_project(raw):
    p=deepcopy(raw);lessons=[]
    if set(raw.get('periods_by_day',{}))-set('월화수목금'):raise SemesterError('현재 편성 엔진은 월요일~금요일 운영을 지원합니다.')
    for request in raw.get('curriculum',[]):
        row=deepcopy(request);ident=str(row.get('id','')).strip()
        parts=row.get('parts') or [{'duration':n,'teacher_ids':row.get('teacher_ids',[])} for n in row.get('split',[1]*int(row.get('weekly_periods',0)))]
        if not ident or not parts or sum(int(part['duration']) for part in parts)!=int(row.get('weekly_periods',0)):
            raise SemesterError(f'{ident}: 주당 시수와 분할 시수 합계가 다릅니다.')
        fixed=row.get('fixed_slots',[])
        if fixed and len(fixed)!=len(parts):raise SemesterError(f'{ident}: 분할 회차마다 고정교시를 지정하세요.')
        for i,part in enumerate(parts):
            duration=int(part['duration'])
            if duration<1:raise SemesterError('분할 시수는 양수여야 합니다.')
            lesson={k:deepcopy(row.get(k,[])) for k in ('class_ids','student_ids','room_ids','forbidden_slots')}
            lesson.update(id=ident+'__'+str(i+1),source_request_id=ident,subject_id=row['subject_id'],teacher_ids=part.get('teacher_ids',row.get('teacher_ids',[])),
                weekly_periods=duration,duration=duration,fixed_slots=[fixed[i]] if fixed else [],
                simultaneous_group=(row['simultaneous_group']+'__'+str(i+1)) if row.get('simultaneous_group') else '',
                timing_block=row.get('timing_block',''),timing_offset=int(row.get('timing_offset',0)),timing_block_length=int(row.get('timing_block_length',0)))
            lessons.append(lesson)
    p['lessons']=lessons
    used_classes={c for l in lessons for c in l['class_ids']};used_rooms={r for l in lessons for r in l['room_ids']}
    for c in p['classes']:
        known=max(int(c.get('size',0)),sum(s['class_id']==c['id'] for s in p['students']))
        if c['id'] in used_classes and int(c.get('size',0))<1:raise SemesterError(c['id']+': 학급 인원을 확인해야 편성할 수 있습니다.')
        c['size']=known
    for room in p['rooms']:
        if room['id'] in used_rooms and int(room.get('capacity',0))<1:raise SemesterError(room['id']+': 실제 교실 수용인원 입력이 필요합니다.')
    errors=validate_project(p)
    if errors:raise SemesterError(' / '.join(errors[:20]))
    for teacher in p['teachers']:
        if teacher.get('starts_at') and teacher['starts_at']>p['term']['starts_at'] or teacher.get('ends_at') and teacher['ends_at']<p['term']['ends_at']:raise SemesterError(teacher['id']+': 계약기간이 학기 전체를 포함하지 않습니다. 적용 기간을 나누거나 담당교사를 조정하세요.')
        if 'working_weekdays' in teacher:
            teacher['blocked']=sorted(set(teacher.get('blocked',[]))|{d+str(n) for d,count in p['periods_by_day'].items() if d not in teacher['working_weekdays'] for n in range(1,count+1)})
        if 'available_slots' in teacher:
            teacher['blocked']=sorted(set(teacher.get('blocked',[]))|{d+str(n) for d,count in p['periods_by_day'].items() for n in range(1,count+1)}-set(teacher['available_slots']))
    for session in expand_sessions(p):
        for day,count in p['periods_by_day'].items():
            for period in range(1,count-session['duration']+2):spans(p,session,day+str(period))
    return p

def spans(project,session,start):
    """Real minute intervals; a mixed-grade joint lesson needs matching bells."""
    classes=index(project,'classes');students=index(project,'students')
    grades={str(classes[c]['grade']) for c in session.get('class_ids',[])}
    grades|={str(classes[students[s]['class_id']]['grade']) for s in session.get('student_ids',[])}
    schedules=project.get('bell_schedules',{})
    def one(grade):
        bells=schedules.get(grade,schedules.get('default',{}));result=[]
        for i in range(int(start[1:]),int(start[1:])+session['duration']):
            a,b=bells.get(str(i),[f'{8+(40+50*(i-1))//60:02d}:{(40+50*(i-1))%60:02d}',f'{9+(25+50*(i-1))//60:02d}:{(25+50*(i-1))%60:02d}'])
            def minute(s):
                h,m=map(int,s.split(':'))
                if not 0<=h<24 or not 0<=m<60:raise SemesterError('시정표 시각 오류')
                return h*60+m
            left,right=minute(a),minute(b)
            if left>=right:raise SemesterError('시정표 종료 시각은 시작 이후여야 합니다.')
            result.append((left,right))
        return tuple(result)
    variants={one(g) for g in (grades or {'default'})}
    if len(variants)>1:raise SemesterError(session['id']+': 합동수업 대상 학년의 실제 시정표가 다릅니다.')
    return next(iter(variants))

def validate(project,placements,complete=True):
    issues=validate_placements(project,placements,require_complete=complete)
    if project.get('bell_schedules'):
        issues=[e for e in issues if not(e.startswith(('teacher ','class ','student ','room ')) and ' 중복:' in e)]
    sessions={s['session_id']:s for s in expand_sessions(project)};resources=defaultdict(list)
    from diple.engine import _resources
    for placed in placements:
        s=sessions.get(placed.get('session_id'))
        if not s:continue
        try:intervals=spans(project,s,placed['start'])
        except (ValueError,KeyError):continue
        for kind,ident in _resources(project,s,placed.get('room_id','')):
            for left,right in intervals:resources[(kind,ident,placed['start'][0])].append((left,right,s['session_id']))
    for (kind,ident,day),entries in resources.items():
        ordered=sorted(entries)
        for i,a in enumerate(ordered):
            for b in ordered[i+1:]:
                if b[0]>=a[1]:break
                if a[2]!=b[2]:issues.append(f'{kind} {ident} {day}: 실제 시각 중복 {a[2]} / {b[2]}')
    return sorted(set(issues))

def summary(project,placements):
    sessions={s['session_id']:s for s in expand_sessions(project)};loads=defaultdict(lambda:defaultdict(int));course_days=defaultdict(list);used=defaultdict(set);rooms=defaultdict(set)
    for p in placements:
        s=sessions[p['session_id']];day=p['start'][0];period=int(p['start'][1:])
        for t in s['teacher_ids']:
            loads[t][day]+=s['duration'];used[(t,day)].update(range(period,period+s['duration']))
            if p.get('room_id'):rooms[(t,day)].add(p['room_id'])
        for c in s['class_ids']:course_days[(c,s['subject_id'],day)].append(s)
    result={'balance':sum(max([d.get(w,0) for w in '월화수목금'])-min([d.get(w,0) for w in '월화수목금']) for d in loads.values()),
            'subject_spread':sum(max(0,len(v)-1) for v in course_days.values()),
            'gaps':sum(max(v)-min(v)+1-len(v) for v in used.values() if v),
            'continuous':sum(sum(all(n+i in v for i in range(4)) for n in v) for v in used.values()),
            'late':sum(int(p['start'][1:])*sessions[p['session_id']]['duration'] for p in placements),
            'room_changes':sum(max(0,len(v)-1) for v in rooms.values())}
    return result

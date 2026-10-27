"""Phase 5B: allocation of immutable enrollment snapshots to elective sections.

Each choice is assigned to exactly one section. A group consists of virtual
non-overlapping lanes; every lane contains `target_units` contiguous timetable
periods. Section positions are relative to each lane, NOT real weekdays.
These positions are linked to the existing timetable solver by timing_block.
"""
from __future__ import annotations
from collections import Counter, defaultdict
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
from itertools import combinations
from math import ceil
import json
import uuid


def _new_id():
    return uuid.uuid4().hex


def _now():
    return datetime.now(timezone.utc).isoformat()


def _sid(snapshot_id,offering_id,index):
    return 'SEC-'+sha256(f'{snapshot_id}|{offering_id}|{index}'.encode()).hexdigest()[:20]


class SectioningError(ValueError):
    pass


def preflight(snapshot):
    errors=[];warnings=[];counts=Counter()
    sid=snapshot.get('snapshot_id')
    if not sid:errors.append('확정 스냅샷 ID가 없습니다.')
    offerings={o['offering_id']:o for o in snapshot.get('offerings',[])}
    groups={g['group_id']:g for g in snapshot.get('groups',[])}
    if len(offerings)!=len(snapshot.get('offerings',[])) or len(groups)!=len(snapshot.get('groups',[])):
        errors.append('그룹/과목 ID가 중복되었습니다.')
    seen=set()
    by_group=defaultdict(list)
    for stu in snapshot.get('students',[]):
        student_id=stu['student_id']
        if student_id in seen:errors.append(f'{student_id}: 학생 ID 중복')
        seen.add(student_id)
        if len(set(stu.get('choices',[]))) != len(stu.get('choices',[])):
            errors.append(f'{student_id}: 선택과목 중복')
        for oid in stu.get('choices',[]):
            if oid not in offerings:
                errors.append(f'{student_id}: 없는 과목 {oid}');continue
            o=offerings[oid];counts[oid]+=1
            if o['group_id'] not in groups:errors.append(f'{oid}: 없는 선택그룹');continue
            by_group[o['group_id']].append((student_id,oid))
            if o.get('availability')=='폐강':errors.append(f'{oid}: 폐강 과목을 신청했습니다.')
            if int(o.get('units',0))<1:errors.append(f'{oid}: 운영 단위는 1 이상이어야 합니다.')
    if not snapshot.get('students'):errors.append('배정할 유효 제출자가 없습니다.')
    for oid,count in counts.items():
        o=offerings[oid]
        if count<int(o.get('min_students') or 0):warnings.append(f"{o['course_name']}: 최소 개설 인원 미달 ({count}/{o['min_students']})")
        if count>int(o.get('planned_capacity') or 99999):warnings.append(f"{o['course_name']}: 계획 정원 초과 ({count}/{o['planned_capacity']}); 자동 선발하지 않음")
        if int(o.get('section_capacity') or 0)<1:errors.append(f'{oid}: 분반 정원은 1 이상이어야 합니다.')
        if o.get('joint_education'):warnings.append(f"{o['course_name']}: 공동교육과정 장소·이동시간은 수동 확인 필요")
    return {'errors':errors,'warnings':warnings,'counts':dict(counts)}


def _layout(snapshot, group_id, max_lanes=12):
    g=next(g for g in snapshot['groups'] if g['group_id']==group_id)
    offers={o['offering_id']:o for o in snapshot['offerings'] if o['group_id']==group_id}
    unit=int(g.get('target_units') or max((int(o['units']) for o in offers.values()), default=1))
    if unit<1:raise SectioningError(f"{g['name']}: 운영구획 단위가 올바르지 않습니다.")
    schoices={s['student_id']:[o for o in s['choices'] if o in offers] for s in snapshot['students']}
    totals={sid:sum(int(offers[o]['units']) for o in ch) for sid,ch in schoices.items()}
    for o in offers.values():
        if int(o['units'])>unit:raise SectioningError(f"{o['course_name']}: 운영시간이 그룹 구획 {unit}시간을 초과합니다.")
    lane_count=max(1, max((ceil(n/unit) for n in totals.values()),default=1))
    if lane_count>max_lanes:raise SectioningError(f"{g['name']}: 필요한 구획 {lane_count}개가 최대 {max_lanes}개를 초과합니다.")
    return g,offers,unit,lane_count,schoices


def _fallback(group_id,unit,lanes,students,offers,sections,max_offerings=17):
    """Exact placement of each *course* for small-medium instances.

    All sections of the same course use the same time window. We do not claim
    optimal class distribution or advanced teacher/room allocation here.
    """
    selected={o:set() for o in offers}
    for student,choices in students.items():
        for oid in choices:selected[oid].add(student)
    used=[o for o in offers if selected[o]]
    if len(used)>max_offerings:
        raise SectioningError('OR-Tools가 없고 선택과목이 17개를 초과합니다. OR-Tools를 설치하세요.')
    collisions={o:set() for o in used}
    for a,b in combinations(used,2):
        if selected[a] & selected[b]:collisions[a].add(b);collisions[b].add(a)
    seq=sorted(used,key=lambda o:(-len(collisions[o]),-len(selected[o]),o))
    positions={o:[(l,off) for l in range(lanes) for off in range(unit-int(offers[o]['units'])+1)] for o in seq}
    assignment={};visited=0;limit=500000
    def dfs(n):
        nonlocal visited
        if n>=len(seq):return True
        if visited>=limit:return False
        oid=seq[n];size=int(offers[oid]['units'])
        for pos in positions[oid]:
            visited+=1
            if any(other in assignment and pos[0]==assignment[other][0]
                   and pos[1]<assignment[other][1]+int(offers[other]['units'])
                   and assignment[other][1]<pos[1]+size for other in collisions[oid]):continue
            assignment[oid]=pos
            if dfs(n+1):return True
            del assignment[oid]
        return False
    if not dfs(0):
        raise SectioningError(f'기본 분반 수와 동일 과목 동시 운영 규칙으로 시간구획을 찾지 못했습니다 (탐색 {visited}회). CP-SAT 또는 추가 구획/분반을 검토하세요.')
    by_course=defaultdict(list)
    for sec in sections:by_course[sec['offering_id']].append(sec)
    result=[]
    for oid,parts in by_course.items():
        if oid not in assignment:continue
        start=assignment[oid]
        for part in parts:part['lane'],part['offset']=start
        members=sorted(selected[oid])
        for n,sid in enumerate(members):
            sec=parts[n%len(parts)]
            result.append({'student_id':sid,'offering_id':oid,'section_id':sec['section_id']})
    return result, 'exact-course-placement-fallback'


def _cp_sat(unit,lanes,students,offers,sections,seconds,seed):
    from ortools.sat.python import cp_model
    model=cp_model.CpModel();lookup=defaultdict(list);start={};variables={};sstarts=defaultdict(list)
    for sec in sections:lookup[sec['offering_id']].append(sec)
    for sec in sections:
        oid=sec['offering_id'];dur=int(offers[oid]['units'])
        legal=[l*unit+offset for l in range(lanes) for offset in range(unit-dur+1)]
        v=model.NewIntVarFromDomain(cp_model.Domain.FromValues(legal),'pos_'+sec['section_id'])
        start[sec['section_id']]=v
    for stu,choices in students.items():
        intervals=[]
        for oid in choices:
            dur=int(offers[oid]['units'])
            opts=[]
            select_pos=model.NewIntVar(0,lanes*unit-1,'studentpos_'+stu+'_'+oid)
            for sec in lookup[oid]:
                v=model.NewBoolVar('choice_'+stu+'_'+sec['section_id'])
                variables[(stu,sec['section_id'])]=v;opts.append(v)
                model.Add(select_pos==start[sec['section_id']]).OnlyEnforceIf(v)
            model.AddExactlyOne(opts)
            intervals.append(model.NewFixedSizeIntervalVar(select_pos,dur,'interval_'+stu+'_'+oid))
        if intervals:model.AddNoOverlap(intervals)
    penalty=[]
    for sec in sections:
        qty=model.NewIntVar(0,sec['capacity'],'occupancy_'+sec['section_id'])
        model.Add(qty==sum(variables[(stu,sec['section_id'])] for stu,choices in students.items() if sec['offering_id'] in choices))
        model.Add(qty>=1)
        penalty.append(qty*qty if False else qty)  # count bounds provide balanced split below
    # Bounded equalization, plus deterministic lane preference.
    for oid,parts in lookup.items():
        for first,second in zip(parts,parts[1:]):
            a=model.NewIntVar(0,first['capacity'],'size_'+first['section_id'])
            b=model.NewIntVar(0,second['capacity'],'size_'+second['section_id'])
            model.Add(a==sum(variables[(stu,first['section_id'])] for stu,ch in students.items() if oid in ch))
            model.Add(b==sum(variables[(stu,second['section_id'])] for stu,ch in students.items() if oid in ch))
            model.Add(a>=b);model.Add(a-b<=1)
    model.Minimize(sum(start.values()))
    solver=cp_model.CpSolver();solver.parameters.max_time_in_seconds=float(seconds)
    solver.parameters.random_seed=int(seed);solver.parameters.num_search_workers=4
    status=solver.Solve(model)
    if status not in (cp_model.OPTIMAL,cp_model.FEASIBLE):
        raise SectioningError('CP-SAT 이동반 편성 결과가 '+solver.StatusName(status)+'입니다. 구획수/분반정원/과목 조합을 점검하세요.')
    for sec in sections:
        n=solver.Value(start[sec['section_id']]);sec['lane']=n//unit;sec['offset']=n%unit
    result=[]
    for (stu,secid),v in variables.items():
        if solver.BooleanValue(v):
            sec=next(x for x in sections if x['section_id']==secid)
            result.append({'student_id':stu,'offering_id':sec['offering_id'],'section_id':secid})
    return result,'cp-sat-'+solver.StatusName(status).lower()


def generate_plan(snapshot, *, seconds=20, seed=1, force_fallback=False, max_lanes=12):
    report=preflight(snapshot)
    if report['errors']:raise SectioningError(' / '.join(report['errors'][:12]))
    groups=[];all_sections=[];all_assignments=[];engines=[]
    for g in snapshot['groups']:
        gid=g['group_id'];group,offers,unit,lanes,students=_layout(snapshot,gid,max_lanes)
        counters=Counter(o for choices in students.values() for o in choices)
        sections=[]
        for oid,course in offers.items():
            count=counters[oid]
            if not count:continue
            cap=int(course['section_capacity'])
            for idx in range(1,ceil(count/cap)+1):
                sections.append({'section_id':_sid(snapshot['snapshot_id'],oid,idx),'offering_id':oid,
                     'course_id':course['course_id'],'group_id':gid,'number':idx,
                     'capacity':cap,'units':int(course['units']),'lane':None,'offset':None})
        if not sections:continue
        if force_fallback:
            allocations,engine=_fallback(gid,unit,lanes,students,offers,sections)
        else:
            try:allocations,engine=_cp_sat(unit,lanes,students,offers,sections,seconds,seed)
            except ImportError:allocations,engine=_fallback(gid,unit,lanes,students,offers,sections)
        groups.append({'group_id':gid,'name':group['name'],'lane_units':unit,'lane_count':lanes,'solver':engine})
        all_sections+=sections;all_assignments+=allocations;engines.append(engine)
    plan={'plan_id':_new_id(),'source_snapshot_id':snapshot['snapshot_id'],'source_snapshot_version':snapshot['version'],
          'school_id':snapshot['school_id'],'academic_year':snapshot['academic_year'],
          'semester':snapshot['semester'],'campaign_id':snapshot['campaign_id'],'created_at':_now(),
          'solver':', '.join(sorted(set(engines))),'groups':groups,'sections':all_sections,
          'assignments':sorted(all_assignments,key=lambda a:(a['student_id'],a['offering_id'])),
          'warnings':report['warnings'],'status':'DRAFT'}
    errors=validate_plan(snapshot,plan)
    if errors:raise SectioningError('내부 편성 결과 검증 실패: '+' / '.join(errors[:10]))
    return plan


def validate_plan(snapshot,plan):
    errors=[]
    for key,source in [('source_snapshot_id','snapshot_id'),('school_id','school_id'),('academic_year','academic_year'),('semester','semester'),('campaign_id','campaign_id')]:
        if plan.get(key)!=snapshot.get(source):errors.append(f'{key}: 확정 스냅샷 범위 불일치')
    if plan.get('source_snapshot_version')!=snapshot.get('version'):errors.append('확정 스냅샷 버전 불일치')
    offerings={o['offering_id']:o for o in snapshot['offerings']}
    students={s['student_id']:s for s in snapshot['students']}
    sections={s['section_id']:s for s in plan.get('sections',[])}
    if len(sections)!=len(plan.get('sections',[])):errors.append('이동반 ID 중복')
    groups={g['group_id']:g for g in plan.get('groups',[])}
    seen=set();sizes=Counter();occupied=defaultdict(set)
    for rec in plan.get('assignments',[]):
        stu=rec['student_id'];oid=rec['offering_id'];secid=rec['section_id']
        key=(stu,oid)
        if key in seen:errors.append(f'{stu}: {oid} 중복 배정')
        seen.add(key)
        if stu not in students or oid not in offerings or oid not in students[stu]['choices']:
            errors.append(f'{stu}: 신청하지 않은 과목 {oid} 배정');continue
        sec=sections.get(secid)
        if not sec or sec['offering_id']!=oid:
            errors.append(f'{stu}: 잘못된 분반 ID {secid}');continue
        group=groups.get(sec['group_id'])
        if not group:errors.append(f'{secid}: 그룹 누락');continue
        lane=int(sec['lane']);off=int(sec['offset']);units=int(sec['units'])
        if lane<0 or lane>=int(group['lane_count']) or off<0 or off+units>int(group['lane_units']):
            errors.append(f'{secid}: 구획 시간 범위 초과');continue
        sizes[secid]+=1
        for n in range(off,off+units):
            pos=(sec['group_id'],lane,n)
            if pos in occupied[stu]:errors.append(f'{stu}: 이동반 시간 중복 {pos}')
            occupied[stu].add(pos)
    required={(s['student_id'],o) for s in students.values() for o in s['choices']}
    for student,offering in sorted(required-seen):errors.append(f'{student}: 미배정 과목 {offering}')
    for secid,sec in sections.items():
        if sec['offering_id'] not in offerings:
            errors.append(f'{secid}: 등록되지 않은 선택과목')
            continue
        source=offerings[sec['offering_id']]
        if sec['group_id']!=source['group_id']:errors.append(f'{secid}: 선택그룹 변경됨')
        if sec['course_id']!=source['course_id']:errors.append(f'{secid}: 교과 ID 변경됨')
        if int(sec['capacity'])!=int(source['section_capacity']):errors.append(f'{secid}: 원본 분반정원 변경됨')
        if int(sec['units'])!=int(source['units']):errors.append(f'{secid}: 운영시간 변경됨')
        if sizes[secid]<1:errors.append(f'{secid}: 빈 분반')
        if sizes[secid]>int(sec['capacity']):errors.append(f'{secid}: 정원 초과')
    return errors


def move_student(snapshot,plan,student_id,offering_id,target_section_id):
    """Copy-only manual section reassignment; never touches original 5A submission."""
    out=deepcopy(plan)
    target=next((x for x in out['sections'] if x['section_id']==target_section_id),None)
    if not target or target['offering_id']!=offering_id:raise SectioningError('대상 분반이 선택과목과 일치하지 않습니다.')
    found=False
    for a in out['assignments']:
        if a['student_id']==student_id and a['offering_id']==offering_id:
            a['section_id']=target_section_id;found=True;break
    if not found:raise SectioningError('학생의 기존 과목배정이 없습니다.')
    errors=validate_plan(snapshot,out)
    if errors:raise SectioningError('변경 거부: '+' / '.join(errors[:6]))
    out['plan_id']=_new_id();out['created_at']=_now();out['status']='DRAFT'
    out['resources_confirmed']=False
    return out


def apply_plan_to_project(project,snapshot,plan,teacher_map,room_map=None,*,replace_lessons=False):
    """Copy-only typed handoff to timetable; no guessed teachers or arbitrary deletions.

    `teacher_map` maps section_id -> existing teacher ID; room_map is optional.
    Times are linked through timing_block/offset; actual period allocation is
    performed by Diple's normal timetable engine.
    """
    from .model import validate_project
    errors=validate_plan(snapshot,plan)
    if errors:raise SectioningError('분반 검증 실패: '+' / '.join(errors[:8]))
    p=deepcopy(project);sch=p['school']
    if (sch['id'],int(sch['academic_year']),int(sch['semester']))!=(snapshot['school_id'],snapshot['academic_year'],snapshot['semester']):
        raise SectioningError('학교·학년도·학기가 확정 신청과 일치하지 않습니다.')
    teacher_map=teacher_map or {};room_map=room_map or {}
    teachers={t['id'] for t in p['teachers']};rooms={r['id'] for r in p['rooms']}
    known_subjects={s['id'] for s in p['subjects']};classes={c['id'] for c in p['classes']}
    existing_students={s['id']:s for s in p.get('students',[])}
    for stu in snapshot['students']:
        if stu['class_id'] not in classes:raise SectioningError(f"{stu['student_id']}: 원반이 시간표 프로젝트에 없습니다.")
        old=existing_students.get(stu['student_id'])
        if old and old['class_id']!=stu['class_id']:
            raise SectioningError(f"{stu['student_id']}: 원반이 기존 시간표와 다릅니다.")
        if not old:p.setdefault('students',[]).append({'id':stu['student_id'],'name':stu['student_id'],'class_id':stu['class_id']})
    if replace_lessons:
        existing_courses={s['course_id'] for s in plan['sections']}
        removable=[x for x in p['lessons'] if x['subject_id'] in existing_courses and not x.get('class_ids')]
        p['lessons']=[x for x in p['lessons'] if x not in removable]
    else:
        existing_courses={s['course_id'] for s in plan['sections']}
        collisions=[x['id'] for x in p['lessons'] if x['subject_id'] in existing_courses and not x.get('class_ids')]
        if collisions:
            raise SectioningError('기존 선택반 수업 '+', '.join(collisions[:8])+'과 중복됩니다. 명시적으로 교체에 동의해야 합니다.')
    members=defaultdict(list)
    for a in plan['assignments']:members[a['section_id']].append(a['student_id'])
    names={g['group_id']:g for g in plan['groups']}
    for sec in plan['sections']:
        sid=sec['section_id'];tid=teacher_map.get(sid)
        if tid not in teachers:raise SectioningError(f'{sid}: 등록된 담당교사를 명시적으로 지정해야 합니다.')
        room=room_map.get(sid,'')
        if room and room not in rooms:raise SectioningError(f'{sid}: 등록되지 않은 교실 {room}')
        if sec['course_id'] not in known_subjects:raise SectioningError(f"{sec['course_id']}: 시간표 과목 ID가 없습니다.")
        g=names[sec['group_id']]
        lesson={'id':'L-'+sid,'subject_id':sec['course_id'],'teacher_ids':[tid],'class_ids':[],
                'student_ids':sorted(members[sid]),'room_ids':[room] if room else [],
                'weekly_periods':int(sec['units']),'duration':int(sec['units']),
                'simultaneous_group':'','fixed_slots':[],'forbidden_slots':[],
                'timing_block':f"{snapshot['snapshot_id']}:{sec['group_id']}:{sec['lane']}",
                'timing_offset':int(sec['offset']),'timing_block_length':int(g['lane_units']),
                'source_section_id':sid,'source_snapshot_id':snapshot['snapshot_id']}
        p['lessons'].append(lesson)
    p.setdefault('sectioning_links',[]).append({'snapshot_id':snapshot['snapshot_id'],'plan_id':plan['plan_id'],
                                                'section_count':len(plan['sections'])})
    issues=validate_project(p)
    if issues:raise SectioningError('시간표 프로젝트 검증 실패: '+' / '.join(issues[:10]))
    return p


class SectioningPlanService:
    """Versioned, tenant-scoped plans stored via Phase 5A repository tx."""
    def __init__(self,enrollment_service):self.enrollment=enrollment_service

    def _table(self,db):
        db.execute('''CREATE TABLE IF NOT EXISTS sectioning_plans (
           plan_id TEXT PRIMARY KEY, school_id TEXT NOT NULL, campaign_id TEXT NOT NULL,
           snapshot_id TEXT NOT NULL, version INTEGER NOT NULL, plan_json TEXT NOT NULL,
           created_by TEXT NOT NULL, created_at TEXT NOT NULL, reason TEXT NOT NULL,
           UNIQUE(snapshot_id,version))''')

    def save(self,token,school_id,snapshot,plan,reason='초기 편성',ack_warnings=False):
        actor=self.enrollment._authorize(token,school_id,'admin')
        if snapshot['school_id']!=school_id or plan['school_id']!=school_id:
            raise SectioningError('다른 학교의 분반 정보를 저장할 수 없습니다.')
        issues=validate_plan(snapshot,plan)
        if plan.get('resources_confirmed'):
            from .resources import resource_errors
            issues+=resource_errors(plan)
        if issues:raise SectioningError('저장 전 검증 실패: '+' / '.join(issues[:6]))
        if plan.get('warnings') and not ack_warnings:
            raise SectioningError('미달 인원/계획 초과/공동교육과정 경고가 있습니다. 검토 확인 후 저장하세요.')
        if len(reason.strip())<4:raise SectioningError('저장 사유는 4자 이상 입력해야 합니다.')
        with self.enrollment.repo.tx(True) as db:
            self._table(db)
            s=db.execute('SELECT snapshot_json FROM snapshots WHERE snapshot_id=? AND campaign_id=?',
                         (snapshot['snapshot_id'],snapshot['campaign_id'])).fetchone()
            if not s or json.loads(s['snapshot_json'])!=snapshot:
                raise SectioningError('저장소의 확정 스냅샷이 변경되었거나 존재하지 않습니다.')
            v=db.execute('SELECT COALESCE(MAX(version),0)+1 FROM sectioning_plans WHERE snapshot_id=?',
                         (snapshot['snapshot_id'],)).fetchone()[0]
            stamped=deepcopy(plan);stamped['plan_id']=_new_id();stamped['version']=int(v);stamped['status']='SAVED'
            stamped['created_at']=_now()
            db.execute('INSERT INTO sectioning_plans VALUES (?,?,?,?,?,?,?,?,?)',
                       (stamped['plan_id'],school_id,snapshot['campaign_id'],snapshot['snapshot_id'],v,
                        json.dumps(stamped,ensure_ascii=False),actor['username'],stamped['created_at'],reason))
            self.enrollment._audit(db,school_id,actor['username'],'section_plan_saved',snapshot['campaign_id'],reason,
                                   {'snapshot_id':snapshot['snapshot_id'],'plan_id':stamped['plan_id'],'version':v})
            return stamped

    def list_versions(self,token,school_id,snapshot_id):
        self.enrollment._authorize(token,school_id,'admin')
        with self.enrollment.repo.tx() as db:
            # Read existing Phase 5A database, do not change it to list plans.
            present=db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sectioning_plans'").fetchone()
            if not present:return []
            return [dict(r) for r in db.execute('''SELECT plan_id,version,created_by,created_at,reason
               FROM sectioning_plans WHERE school_id=? AND snapshot_id=? ORDER BY version DESC''',(school_id,snapshot_id))]

    def get(self,token,school_id,plan_id):
        self.enrollment._authorize(token,school_id,'admin')
        with self.enrollment.repo.tx() as db:
            present=db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sectioning_plans'").fetchone()
            if not present:raise SectioningError('저장된 분반 계획이 없습니다.')
            r=db.execute('SELECT plan_json FROM sectioning_plans WHERE plan_id=? AND school_id=?',(plan_id,school_id)).fetchone()
            if not r:raise SectioningError('해당 학교의 분반 계획을 찾을 수 없습니다.')
            return json.loads(r['plan_json'])

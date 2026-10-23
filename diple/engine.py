"""OR-Tools CP-SAT scheduler with an explicitly limited offline backtracker.

Never publish a solution without independently running validate_placements.
"""
from __future__ import annotations
from collections import defaultdict
from itertools import product
from .model import DAYS, expand_sessions, slots_for, slot_parts, block_slots, validate_project, validate_placements, index


def _resources(project, session, room):
    keys = [('teacher', a) for a in session.get('teacher_ids', [])]
    keys += [('class', a) for a in session.get('class_ids', [])]
    enrolled = {a for a in session.get('student_ids', [])}
    enrolled.update(st['id'] for st in project.get('students', []) if st.get('class_id') in session.get('class_ids', []))
    keys += [('student', a) for a in enrolled]
    if room:
        keys.append(('room', room))
    return keys


def options(project, session):
    allslots = slots_for(project)
    resources = _resources
    t = index(project, 'teachers')
    c = index(project, 'classes')
    r = index(project, 'rooms')
    stu = index(project, 'students')
    blocked_map = {'teacher': t, 'class': c, 'student': stu, 'room': r}
    roomchoices = session.get('room_ids') or ['']
    ret = []
    for start in ([session['fixed_start']] if session['fixed_start'] else allslots):
        occupied = block_slots(start, session['duration'], project['periods_by_day'])
        if not occupied or set(occupied) & set(session.get('forbidden_slots', [])):
            continue
        if session.get('timing_block'):
            _,num=slot_parts(start)
            anchor=num-int(session.get('timing_offset',0))
            length=int(session.get('timing_block_length',0))
            if anchor<1 or anchor+length-1>project['periods_by_day'][start[0]]:
                continue
        for room in roomchoices:
            keys = resources(project, session, room)
            if any(set(occupied) & set(blocked_map[typ][ident].get('blocked', [])) for typ, ident in keys):
                continue
            if room:
                cap = int(r[room].get('capacity', 99999))
                size = max(len(session.get('student_ids', [])), sum(int(c[x].get('size', 0)) for x in session.get('class_ids', [])))
                if size > cap:
                    continue
            ret.append((start, room, occupied, keys))
    return ret


def diagnose(project):
    issues = validate_project(project)
    if issues:
        return issues
    sess = expand_sessions(project)
    for s in sess:
        if not options(project, s):
            issues.append(f"{s['session_id']}: 가능한 요일·교시·교실 조합이 없습니다. 교사 근무 가능 시간, 교실 정원, 고정 수업을 확인하세요.")
    return issues


def solve_cp_sat(project, seconds=15, seed=1):
    from ortools.sat.python import cp_model
    issues = diagnose(project)
    if issues:
        return {'status': 'INVALID', 'placements': [], 'errors': issues, 'engine': 'CP-SAT'}
    sessions = expand_sessions(project)
    model = cp_model.CpModel()
    opts = {}
    variables = {}
    resources = defaultdict(list)
    starts = defaultdict(list)
    day_counts = defaultdict(list)
    for s in sessions:
        sid = s['session_id']
        opts[sid] = options(project, s)
        vs = []
        for k, (start, room, occupied, keys) in enumerate(opts[sid]):
            v = model.NewBoolVar(f'place_{sid}_{k}')
            variables[(sid, k)] = v
            vs.append(v)
            starts[(sid, start)].append(v)
            for slot in occupied:
                for typ, ident in keys:
                    resources[(typ, ident, slot)].append(v)
            for teacher in s.get('teacher_ids', []):
                day_counts[(teacher, start[0])].append((v, s['duration']))
        model.AddExactlyOne(vs)
    for vs in resources.values():
        if len(vs) > 1:
            model.AddAtMostOne(vs)
    groups = defaultdict(list)
    for s in sessions:
        if s.get('simultaneous_group'):
            groups[(s['simultaneous_group'], s['occurrence'])].append(s)
    for sess in groups.values():
        for s1, s2 in zip(sess, sess[1:]):
            for start in slots_for(project):
                model.Add(sum(starts.get((s1['session_id'], start), [])) == sum(starts.get((s2['session_id'], start), [])))
    # Phase 5B composite elective blocks: relative start offsets within a lane.
    timed=defaultdict(list)
    for session in sessions:
        if session.get('timing_block'):
            timed[session['timing_block']].append(session)
    for block,sess in timed.items():
        anchors=[]
        for day in DAYS:
            for num in range(1,int(project['periods_by_day'].get(day,0))+1):
                fits=all(num+int(item['timing_block_length'])-1 <= int(project['periods_by_day'][day]) for item in sess)
                if fits:anchors.append((day,num))
        if not anchors:
            return {'status':'INVALID','placements':[],'errors':[f'{block}: 동시수업 구획을 배치할 주간 시간이 없습니다.'],'engine':'CP-SAT'}
        picked={a:model.NewBoolVar('block_'+str(len(starts))+'_'+str(i)) for i,a in enumerate(anchors)}
        model.AddExactlyOne(list(picked.values()))
        for item in sess:
            off=int(item['timing_offset']);sid=item['session_id']
            for (day,num),v in picked.items():
                start=f'{day}{num+off}'
                model.Add(sum(starts.get((sid,start),[]))==v)
    # Balanced daily teacher loads; secondary deterministic tie breaking.
    penalties = []
    for teacher in project.get('teachers', []):
        counts = []
        for day in DAYS:
            c = model.NewIntVar(0, 12, f'count_{teacher["id"]}_{day}')
            model.Add(c == sum(v * duration for v, duration in day_counts[(teacher['id'], day)]))
            counts.append(c)
        high = model.NewIntVar(0, 12, f'hi_{teacher["id"]}')
        low = model.NewIntVar(0, 12, f'lo_{teacher["id"]}')
        model.AddMaxEquality(high, counts)
        model.AddMinEquality(low, counts)
        penalties.append(high - low)
    model.Minimize(sum(penalties))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(seconds)
    solver.parameters.random_seed = int(seed)
    solver.parameters.num_search_workers = 4
    status_id = solver.Solve(model)
    names = {cp_model.OPTIMAL:'OPTIMAL', cp_model.FEASIBLE:'FEASIBLE', cp_model.INFEASIBLE:'INFEASIBLE',
             cp_model.UNKNOWN:'UNKNOWN', cp_model.MODEL_INVALID:'MODEL_INVALID'}
    status = names.get(status_id, 'UNKNOWN')
    placed = []
    if status in ('OPTIMAL', 'FEASIBLE'):
        for sid, choices in opts.items():
            for k, (start, room, _, _) in enumerate(choices):
                if solver.BooleanValue(variables[(sid, k)]):
                    placed.append({'session_id': sid, 'start': start, 'room_id': room})
        errors = validate_placements(project, placed)
        if errors:
            return {'status': 'VALIDATION_FAILED', 'placements': [], 'errors': errors, 'engine': 'CP-SAT'}
    else:
        errors = [f'CP-SAT 결과: {status}. 고정·배정금지·자원 제약 완화 검토.']
    return {'status': status, 'placements': placed, 'errors': errors if status not in ('OPTIMAL','FEASIBLE') else [],
            'objective': solver.ObjectiveValue() if placed else None, 'engine': 'CP-SAT'}


def solve_offline_small(project, max_sessions=26, node_limit=200000):
    """Dependency-free exact-feasibility fallback for tiny fixtures ONLY.

    Not optimized, not for full-size school use, never reports OPTIMAL.
    """
    issues = diagnose(project)
    if issues:
        return {'status': 'INVALID', 'placements': [], 'errors': issues, 'engine': 'small-backtracking'}
    sessions = expand_sessions(project)
    if len(sessions) > max_sessions:
        return {'status': 'UNAVAILABLE', 'placements': [], 'errors': ['작은 예제 전용 엔진의 회차 제한을 넘었습니다. OR-Tools를 설치하세요.'], 'engine': 'small-backtracking'}
    groups = defaultdict(list)
    for s in sessions:
        if s.get('timing_block'):
            key=('timing_block',s['timing_block'])
        else:
            key = (s.get('simultaneous_group'), s['occurrence']) if s.get('simultaneous_group') else (s['session_id'],)
        groups[key].append(s)
    # Assemble bundles; multi-session synchronized groups share a start.
    bundles = []
    for g in groups.values():
        choices = [options(project, s) for s in g]
        combinations=1
        for op in choices: combinations *= len(op)
        if combinations > 200000:
            return {'status':'UNAVAILABLE','placements':[], 'errors':['동시수업 후보 조합이 커서 소형 백트래킹을 중단합니다. OR-Tools가 필요합니다.'], 'engine':'small-backtracking'}
        allowed = []
        for combo in product(*choices):
            if g[0].get('timing_block'):
                anchors=[(op[0][0],int(op[0][1:])-int(item.get('timing_offset',0))) for item,op in zip(g,combo)]
                if len(set(anchors)) != 1:continue
            elif any(x[0] != combo[0][0] for x in combo[1:]):
                continue
            occ = set()
            collision = False
            for op in combo:
                for kind, ident in op[3]:
                    for slot in op[2]:
                        key = (kind, ident, slot)
                        if key in occ:
                            collision = True
                        occ.add(key)
            if not collision:
                allowed.append((combo, occ))
        bundles.append((g, allowed))
    bundles.sort(key=lambda x: len(x[1]))
    answer = []
    nodes = [0]
    exhausted = [False]
    def search(at, taken):
        if at == len(bundles):
            return True
        if nodes[0] >= node_limit:
            exhausted[0] = True
            return False
        sess, choices = bundles[at]
        for combo, occ in choices:
            nodes[0] += 1
            if taken.isdisjoint(occ):
                answer.extend([{'session_id': s['session_id'], 'start': op[0], 'room_id': op[1]} for s, op in zip(sess, combo)])
                if search(at + 1, taken | occ):
                    return True
                del answer[-len(sess):]
        return False
    worked = search(0, set())
    if worked:
        errors = validate_placements(project, answer)
        return {'status': 'FEASIBLE' if not errors else 'VALIDATION_FAILED', 'placements': answer if not errors else [], 'errors': errors, 'engine': 'small-backtracking', 'explored': nodes[0]}
    return {'status': 'UNKNOWN' if exhausted[0] else 'INFEASIBLE', 'placements': [], 'errors': [f'해를 찾지 못했습니다. 탐색 노드 {nodes[0]}개.'], 'engine': 'small-backtracking'}


def solve(project, seconds=15, seed=1, offline_fallback=True):
    try:
        return solve_cp_sat(project, seconds, seed)
    except ImportError:
        if offline_fallback:
            return solve_offline_small(project)
        return {'status':'UNAVAILABLE','placements':[], 'errors':['OR-Tools가 설치되지 않았습니다. requirements.txt를 설치하세요.'], 'engine':'CP-SAT'}

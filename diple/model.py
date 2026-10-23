"""Pure-Python project format and validation. All identifiers are stable strings.

One project represents ONE school and ONE academic year/semester. Student data is
not needed for ordinary homeroom scheduling; elective groups may hold student IDs.
"""
from __future__ import annotations
from copy import deepcopy
from collections import defaultdict

DAYS = ['월', '화', '수', '목', '금']


def slots_for(project):
    grid = project.get('periods_by_day', {'월': 6, '화': 6, '수': 6, '목': 6, '금': 6})
    return [f'{day}{p}' for day in DAYS for p in range(1, int(grid.get(day, 0)) + 1)]


def slot_parts(slot):
    if not isinstance(slot, str) or len(slot) < 2 or slot[0] not in DAYS:
        raise ValueError(f'시간 형식 오류: {slot!r}; 예: 월1')
    try:
        n = int(slot[1:])
    except ValueError as e:
        raise ValueError(f'시간 형식 오류: {slot!r}') from e
    if n < 1:
        raise ValueError(f'교시는 1 이상이어야 함: {slot!r}')
    return slot[0], n


def block_slots(start, duration, grid):
    day, first = slot_parts(start)
    if first + duration - 1 > int(grid.get(day, 0)):
        return None
    return [f'{day}{p}' for p in range(first, first + duration)]


def index(project, key):
    return {str(item['id']): item for item in project.get(key, [])}


def _ids_unique(project, key, errors):
    vals = [str(x.get('id', '')).strip() for x in project.get(key, [])]
    if '' in vals:
        errors.append(f'{key}: ID가 비어 있습니다.')
    if len(vals) != len(set(vals)):
        errors.append(f'{key}: 중복 ID가 있습니다.')


def validate_project(project):
    errors = []
    if not isinstance(project, dict):
        return ['프로젝트는 JSON 객체여야 합니다.']
    for key in ('teachers', 'classes', 'rooms', 'subjects', 'lessons', 'students'):
        _ids_unique(project, key, errors)
    if not project.get('lessons'):
        errors.append('수업 요구사항이 비어 있습니다.')
    grid = project.get('periods_by_day', {})
    if any(not isinstance(grid.get(day, 0), int) or not 0 <= grid.get(day, 0) <= 12 for day in DAYS):
        errors.append('요일별 교시는 0~12 사이 정수여야 합니다.')
    available = set(slots_for(project))
    for category in ('teachers', 'classes', 'rooms'):
        for item in project.get(category, []):
            invalid = set(item.get('blocked', [])) - available
            if invalid:
                errors.append(f"{category} {item['id']}: 없는 교시 {sorted(invalid)}")
    teachers = index(project, 'teachers')
    classes = index(project, 'classes')
    rooms = index(project, 'rooms')
    subjects = index(project, 'subjects')
    students = index(project, 'students')
    for st in project.get('students', []):
        if st.get('class_id') not in classes:
            errors.append(f"학생 {st['id']}: 미등록 소속 학급 {st.get('class_id')}")
    loads = defaultdict(int)
    classloads = defaultdict(int)
    sim_counts = defaultdict(list)
    block_defs = defaultdict(list)
    for lesson in project.get('lessons', []):
        lid = lesson.get('id', '?')
        periods, duration = lesson.get('weekly_periods', 0), lesson.get('duration', 1)
        if not isinstance(periods, int) or not isinstance(duration, int) or duration < 1 or periods < 1 or periods % duration:
            errors.append(f'{lid}: 시수는 연속교시의 양의 배수여야 합니다.')
            continue
        for field, table in [('teacher_ids', teachers), ('class_ids', classes), ('room_ids', rooms), ('student_ids', students)]:
            for ident in lesson.get(field, []):
                if str(ident) not in table:
                    errors.append(f'{lid}: {field}의 미등록 ID {ident}')
        if lesson.get('subject_id') not in subjects:
            errors.append(f'{lid}: 미등록 과목 {lesson.get("subject_id")}')
        if not lesson.get('teacher_ids'):
            errors.append(f'{lid}: 담당교사 미등록')
        if not lesson.get('class_ids') and not lesson.get('student_ids'):
            errors.append(f'{lid}: 학급 또는 학생 그룹이 없습니다.')
        if len(set(lesson.get('teacher_ids', []))) != len(lesson.get('teacher_ids', [])):
            errors.append(f'{lid}: 담당교사 ID 중복')
        if len(set(lesson.get('class_ids', []))) != len(lesson.get('class_ids', [])):
            errors.append(f'{lid}: 학급 ID 중복')
        if len(set(lesson.get('student_ids', []))) != len(lesson.get('student_ids', [])):
            errors.append(f'{lid}: 학생 ID 중복')
        for teacher in lesson.get('teacher_ids', []):
            loads[teacher] += periods
        for cls in lesson.get('class_ids', []):
            classloads[cls] += periods
        n = periods // duration
        fixed = lesson.get('fixed_slots', [])
        if len(fixed) not in (0, n):
            errors.append(f'{lid}: 고정 시작교시는 지정할 경우 회차({n})마다 필요합니다.')
        if len(set(fixed)) != len(fixed):
            errors.append(f'{lid}: 고정 시작교시 중복')
        if set(fixed) - available:
            errors.append(f'{lid}: 없는 고정교시 {sorted(set(fixed)-available)}')
        if set(lesson.get('forbidden_slots', [])) - available:
            errors.append(f'{lid}: 없는 금지교시')
        for item in fixed:
            if block_slots(item, duration, grid) is None:
                errors.append(f'{lid}: 연속수업이 하루를 초과합니다.')
        block = str(lesson.get('timing_block', '')).strip()
        if block:
            offset = lesson.get('timing_offset',0)
            length = lesson.get('timing_block_length',0)
            if not isinstance(offset,int) or not isinstance(length,int) or offset < 0 or length < 1 or offset+duration > length:
                errors.append(f'{lid}: 연동 이동수업 구획 범위 오류')
            if periods != duration:
                errors.append(f'{lid}: 연동 이동수업은 현재 한 주에 연속 1회만 지원합니다.')
            block_defs[block].append((lid,length))
        group = lesson.get('simultaneous_group', '').strip()
        if group:
            sim_counts[group].append((lid, n, duration))
        for student_id in lesson.get('student_ids', []):
            student = students.get(student_id)
            if student and lesson.get('class_ids') and student.get('class_id') in lesson['class_ids']:
                # This combination is legitimate for a lesson, avoid double counting in checks.
                pass
    for group, items in sim_counts.items():
        if len({n for _, n, _ in items}) > 1 or len({dur for _, _, dur in items}) > 1:
            errors.append(f'동시수업 {group}: 회차 수와 연속 길이가 일치해야 합니다.')
    for key, defs in block_defs.items():
        if len({x[1] for x in defs}) > 1:
            errors.append(f'{key}: 연동 이동수업 구획 길이가 일치하지 않습니다.')
    total = len(available)
    for ident, num in loads.items():
        if num > len(available - set(teachers.get(ident, {}).get('blocked', []))):
            errors.append(f'교사 {ident}: 필요 {num}교시 > 사용 가능 교시')
        max_weekly = teachers.get(ident, {}).get('max_weekly', 0)
        if max_weekly and num > int(max_weekly):
            errors.append(f'교사 {ident}: 최대 설정시수 {max_weekly} 초과({num})')
    for ident, num in classloads.items():
        if num > len(available - set(classes.get(ident, {}).get('blocked', []))):
            errors.append(f'학급 {ident}: 필요 {num}교시 > 사용 가능 교시')
    return errors


def expand_sessions(project):
    result = []
    for lesson in project.get('lessons', []):
        duration = int(lesson['duration'])
        for occurrence in range(int(lesson['weekly_periods']) // duration):
            result.append({**deepcopy(lesson), 'session_id': f"{lesson['id']}#{occurrence+1}", 'occurrence': occurrence,
                           'fixed_start': (lesson.get('fixed_slots', []) or [None] * (lesson['weekly_periods'] // duration))[occurrence]})
    return result


def validate_placements(project, placements, require_complete=True):
    errors = validate_project(project)
    if errors:
        return errors
    expected = {s['session_id']: s for s in expand_sessions(project)}
    used = defaultdict(list)
    seen = set()
    group_anchors = {}
    block_anchors = {}
    grid = project['periods_by_day']
    blocked = {k: index(project, k) for k in ('teachers', 'classes', 'rooms', 'students')}
    for place in placements:
        sid = place.get('session_id', '')
        if sid not in expected:
            errors.append(f'미등록 수업 회차: {sid}')
            continue
        if sid in seen:
            errors.append(f'수업 회차가 두 번 배정됨: {sid}')
        seen.add(sid)
        lesson = expected[sid]
        start = place.get('start', '')
        try:
            occupied = block_slots(start, lesson['duration'], grid)
        except ValueError:
            occupied = None
        if not occupied:
            errors.append(f'{sid}: 사용할 수 없는 연속교시 {start}')
            continue
        if lesson['fixed_start'] and lesson['fixed_start'] != start:
            errors.append(f'{sid}: 고정교시 위반')
        room = place.get('room_id', '')
        if room and room not in lesson.get('room_ids', []):
            errors.append(f'{sid}: 허용되지 않은 교실 {room}')
        if lesson.get('room_ids') and not room:
            errors.append(f'{sid}: 필수 특별실 미지정')
        if room and room not in blocked['rooms']:
            errors.append(f'{sid}: 미등록 교실 {room}')
        g = lesson.get('simultaneous_group', '')
        if g:
            key = (g, lesson['occurrence'])
            if key in group_anchors and group_anchors[key] != start:
                errors.append(f'{sid}: 동시수업 {g} 시간 위반')
            group_anchors[key] = start
        if lesson.get('timing_block'):
            key = lesson['timing_block']
            offset = int(lesson.get('timing_offset',0))
            length = int(lesson.get('timing_block_length',0))
            day, period = slot_parts(start)
            anchor = (day,period-offset)
            if anchor[1] < 1 or anchor[1]+length-1 > grid[day]:
                errors.append(f'{sid}: 연동 이동수업 구획이 하루 수업시간을 초과합니다.')
            if key in block_anchors and block_anchors[key] != anchor:
                errors.append(f'{sid}: 연동 이동수업 구획 동시성/상대교시 위반')
            block_anchors[key] = anchor
        if room:
            room_cap = int(blocked['rooms'].get(room, {}).get('capacity', 99999))
            student_count = len(lesson.get('student_ids', []))
            class_cap = sum(int(blocked['classes'].get(c, {}).get('size', 0)) for c in lesson.get('class_ids', []))
            if max(student_count, class_cap) > room_cap:
                errors.append(f'{sid}: 교실 정원 초과 ({max(student_count,class_cap)}>{room_cap})')
        people = [('teacher', t, 'teachers') for t in lesson.get('teacher_ids', [])]
        people += [('class', c, 'classes') for c in lesson.get('class_ids', [])]
        enrolled = set(lesson.get('student_ids', []))
        enrolled.update(s['id'] for s in project.get('students', []) if s.get('class_id') in lesson.get('class_ids', []))
        people += [('student', s, 'students') for s in enrolled]
        if room:
            people += [('room', room, 'rooms')]
        for slot in occupied:
            if slot in lesson.get('forbidden_slots', []):
                errors.append(f'{sid}: 수업 금지교시 {slot}')
            for kind, ident, category in people:
                if slot in blocked[category].get(ident, {}).get('blocked', []):
                    errors.append(f'{sid}: {kind} {ident} 배정금지 {slot}')
                used[(kind, ident, slot)].append(sid)
    if require_complete:
        for sid in expected.keys() - seen:
            errors.append(f'미배정 수업 {sid}')
    for (kind, ident, slot), sessions in used.items():
        if len(sessions) > 1:
            errors.append(f'{kind} {ident} {slot} 중복: {", ".join(sessions)}')
    return sorted(set(errors))

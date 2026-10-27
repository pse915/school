"""Grade/day/period exam schedule matrix adapter for the existing ReactPort.

The worksheet schema and allocator remain unchanged. A matrix entry is either
empty (not participating), '자습' (STUDY), or a nonempty exam subject (EXAM).
This module has no Google API or Streamlit imports and is easy to test.
"""
from __future__ import annotations

import copy

from . import engine as E

PERIODS = (1, 2, 3, 4, 5)


def matrix_from_schedule(schedule, grade, day, classes):
    """Return a stable five-row matrix, including inactive periods."""
    by_slot = {(int(r['period']), str(r['classId'])): r for r in schedule
               if int(r['grade']) == grade and int(r['day']) == day}
    result = []
    for period in PERIODS:
        row = {'교시': period}
        for clazz in classes:
            cid = clazz['id']
            item = by_slot.get((period, cid))
            row[cid] = ('자습' if item['type'] == 'STUDY' else str(item.get('subject', ''))) if item else ''
        result.append(row)
    return result


def grade_day_defaults(schedule, saved_plan, grades):
    """Respect persisted gradePlan, including disabled dates and active periods."""
    output = {}
    for grade in grades:
        own = [r for r in schedule if int(r['grade']) == grade]
        previous = saved_plan.get(str(grade), {}) if isinstance(saved_plan, dict) else {}
        old_days = previous.get('days', [])
        total = max(1, len(old_days), max([int(r['day']) for r in own] or [1]))
        days = []
        for day in range(1, min(total, 5) + 1):
            current = [r for r in own if int(r['day']) == day]
            old = next((d for d in old_days if int(d['day']) == day), {})
            periods = sorted({int(r['period']) for r in current}) or [1, 2, 3]
            days.append(dict(day=day, enabled=old.get('enabled', bool(current) or not schedule),
                             date=str(old.get('date', current[0]['date'] if current else '')),
                             periods=old.get('periods', periods)))
        output[str(grade)] = dict(enabled=previous.get('enabled', bool(own) or not schedule), days=days)
    return output


def build_schedule(schedule, classes, grade_data):
    """Construct a complete atomic save payload from every grade/day matrix.

    `grade_data[g] = {'enabled':bool,'days':[{'day':int,'enabled':bool,
    'date':str,'periods':[int], 'matrix':[dict], 'times':{int:(str,str)}}]}`.
    The backend still validates date/class/subject/time constraints.
    """
    by_grade = {}
    for clazz in classes:
        by_grade.setdefault(int(clazz['grade']), []).append(clazz['id'])
    expected = set(by_grade)
    E.require(set(grade_data) == expected, '등록된 모든 학년의 시험일정이 필요합니다.')
    old_times = {(int(r['grade']), int(r['day']), int(r['period']), r['classId']):
                 (str(r.get('start', '')), str(r.get('end', ''))) for r in schedule}
    first_times = {}
    for r in schedule:
        first_times.setdefault((int(r['grade']), int(r['day']), int(r['period'])),
                               (str(r.get('start', '')), str(r.get('end', ''))))
    result = []
    plan = {}
    for grade in sorted(expected):
        info = grade_data[grade]
        days = info['days']
        E.require(1 <= len(days) <= 5, f'{grade}학년 시험일수는 1~5일입니다.')
        plan_days = []
        for index, spec in enumerate(days, 1):
            E.require(spec['day'] == index, f'{grade}학년 일차는 연속 번호여야 합니다.')
            periods = sorted(set(spec['periods']))
            E.require(all(type(p) is int and p in PERIODS for p in periods), '운영 교시는 1~5교시입니다.')
            plan_days.append({'day': index, 'enabled': bool(spec['enabled']),
                              'date': spec['date'], 'periods': periods})
            if not info['enabled'] or not spec['enabled']:
                continue
            E.require(E.valid_date(spec['date']), f'{grade}학년 {index}일차 시험 날짜를 입력하세요.')
            E.require(periods, f'{grade}학년 {index}일차 운영 교시를 선택하세요.')
            entries = {int(r['교시']): r for r in spec['matrix']}
            E.require(set(entries) == set(PERIODS), f'{grade}학년 {index}일차 표의 교시가 잘못되었습니다.')
            for period in periods:
                start, end = spec['times'].get(period, ('', ''))
                count = 0
                for cid in by_grade[grade]:
                    cell = str(entries[period].get(cid, '') or '').strip()
                    if not cell or cell == '미운영':
                        continue
                    kind = 'STUDY' if cell == '자습' else 'EXAM'
                    old_time = old_times.get((grade, index, period, cid), ('', ''))
                    current_time = (start, end)
                    # Preserve rare per-class time differences unless the user
                    # explicitly changes this period's time in the editor.
                    if current_time == first_times.get((grade, index, period), ('', '')):
                        current_time = old_time if (grade, index, period, cid) in old_times else current_time
                    result.append(dict(day=index, date=spec['date'], period=period,
                                       classId=cid, type=kind, subject='' if kind == 'STUDY' else cell,
                                       start=current_time[0], end=current_time[1]))
                    count += 1
                E.require(count > 0, f'{grade}학년 {index}일차 {period}교시에는 운영 학급이 없습니다. 표에 과목 또는 자습을 입력하세요.')
        plan[str(grade)] = {'enabled': bool(info['enabled']), 'days': plan_days}
    E.require(result, '시험을 실시하는 학년·날짜·교시를 하나 이상 설정하세요.')
    # Validate in-memory before any Sheets write or teacher assignment mutation.
    details = {c['id']: c for c in classes}
    validated = [{**r, 'grade': details[r['classId']]['grade'],
                  'classNo': details[r['classId']]['classNo']} for r in result]
    E.validate_schedule(validated, classes)
    E.grade_plan(validated, classes, plan)
    return {'rows': result, 'gradePlan': plan}


def safe_matrix_update(rows, classes, period, new_value):
    """Bulk modify only one period, keeping other periods and classes unchanged."""
    allowed = {c['id'] for c in classes}
    changed = copy.deepcopy(rows)
    for row in changed:
        if int(row['교시']) == period:
            for cid in allowed:
                row[cid] = new_value
    return changed


def class_deletion_dependencies(old, new, schedule, teachers):
    """Block removing classes still referenced by schedule or homeroom teachers."""
    existing = {c['id'] for c in old}
    destination = {f"{int(c['grade'])}-{int(c['classNo'])}" for c in new}
    removed = existing - destination
    scheduled = sorted({r['classId'] for r in schedule if r['classId'] in removed})
    homerooms = sorted({t['homeroom'] for t in teachers if t.get('homeroom') in removed})
    return scheduled, homerooms

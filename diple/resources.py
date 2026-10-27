"""Actual weekday/period validation, separate from virtual allocation lanes."""
def resource_errors(plan):
    import re
    errors=[];seen={};by_section={}
    for sec in plan['sections']:
        sid=sec['section_id'];teacher=sec.get('teacher_id');room=sec.get('room_id')
        slots=sec.get('slots',[]);by_section[sid]=slots
        if not teacher or not room:errors.append(sid+': 교사·교실 지정 필요')
        if len(slots)!=sec['units'] or len(set(slots))!=len(slots) or any(not re.fullmatch(r'[월화수목금토일](?:[1-9]|1[0-6])',x) for x in slots):
            errors.append(sid+': 시수에 맞는 요일·교시 지정 필요 (예: 월1,월2,수1)')
        for resource,ident in [('teacher',teacher),('room',room)]:
            for slot in slots:
                key=(resource,ident,slot)
                if ident and key in seen:errors.append(sid+': 교사 또는 교실 충돌 ('+seen[key]+')')
                seen[key]=sid
    students={}
    for a in plan['assignments']:
        for slot in by_section.get(a['section_id'],[]):
            key=(a['student_id'],slot)
            if key in students:errors.append(a['student_id']+': 학생 시간 중복')
            students[key]=a['section_id']
    return errors

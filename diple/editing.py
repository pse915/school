"""Safe all-or-nothing changes; published schedule stays untouched."""
from copy import deepcopy
from datetime import datetime, timezone
from .model import validate_placements


def move_session(project, placements, session_id, start, room_id=None):
    amended = deepcopy(placements)
    target = next((p for p in amended if p['session_id'] == session_id), None)
    if target is None:
        return None, [f'없는 회차: {session_id}']
    target['start'] = start
    if room_id is not None:
        target['room_id'] = room_id
    errors = validate_placements(project, amended)
    return (amended, []) if not errors else (None, errors)


def swap_sessions(project, placements, first, second):
    amended = deepcopy(placements)
    a = next((p for p in amended if p['session_id'] == first), None)
    b = next((p for p in amended if p['session_id'] == second), None)
    if not a or not b or a is b:
        return None, ['서로 다른 두 회차를 선택하세요.']
    a['start'], b['start'] = b['start'], a['start']
    errors = validate_placements(project, amended)
    return (amended, []) if not errors else (None, errors)


def save_candidate(project, result, label):
    if result['status'] not in ('FEASIBLE', 'OPTIMAL'):
        raise ValueError('검증된 시간표가 아닙니다.')
    errors = validate_placements(project, result['placements'])
    if errors:
        raise ValueError('; '.join(errors))
    old = project.get('candidates', [])
    version_id = f'v{max([int(x["id"][1:]) for x in old if x["id"].startswith("v") and x["id"][1:].isdigit()] + [0]) + 1}'
    project.setdefault('candidates', []).append({'id':version_id,'label':label or version_id,'status':result['status'],
        'engine':result['engine'], 'placements':deepcopy(result['placements']), 'created_at':datetime.now(timezone.utc).isoformat()})
    return version_id


def publish(project, candidate_id):
    cand = next((c for c in project.get('candidates',[]) if c['id']==candidate_id),None)
    if not cand:
        raise ValueError('후보 버전을 찾지 못했습니다.')
    errors = validate_placements(project, cand['placements'])
    if errors:
        raise ValueError('검증 실패: '+'; '.join(errors))
    project['published'] = {'candidate_id':candidate_id,'placements':deepcopy(cand['placements']),
                            'published_at':datetime.now(timezone.utc).isoformat()}
    return project['published']

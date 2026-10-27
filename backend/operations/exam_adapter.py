"""Compatible per-instance guards; existing exam algorithms and storage remain intact."""
from backend.sheet_config import enabled as sheets_enabled
from diple.operations.service import OperationError

def actual_teacher_schedule(app,project,day,teacher_id):
    from .install import get_service
    svc=get_service(app);actor=svc.actor()
    result=svc.day(project,day,actor)
    return [l for l in result['lessons'] if l['status']!='cancelled' and teacher_id in l['teacher_ids']]

def academic_events(app,project,day):
    from .install import get_service
    svc=get_service(app);actor=svc.actor()
    if actor['role']!='admin':raise PermissionError('관리자 일정 조회 권한이 필요합니다.')
    school=project['school']
    with svc._db() as db:return [dict(r) for r in db.execute('SELECT * FROM academic_events WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(school['id'],school['academic_year'],school['semester'],day))]

def attach(app):
    service=getattr(app,'_exam_service',None)
    if service is None or getattr(service,'_operations_guard_installed',False):return
    original=service.apply_assignments
    def guarded(assignments,*args,**kw):
        validate_assignments(app,service,assignments)
        return original(assignments,*args,**kw)
    service.apply_assignments=guarded
    service._operations_guard_installed=True

def validate_assignments(app,exam,assignments):
    # No new operations settings means the original exam path remains identical.
    if not sheets_enabled(app.port.secrets):return
    from .install import get_service,get_project
    from backend.exam_supervision.models import read_roster
    svc=get_service(app);project=get_project(app);school=project['school'];actor=svc.actor()
    with svc._db() as db:
        active=db.execute('SELECT 1 FROM base_versions WHERE school_id=? AND academic_year=? AND semester=?',(school['id'],school['academic_year'],school['semester'])).fetchone()
    if not active:return
    names={t['id']:t['name'] for t in read_roster(exam.repo.tables)['teachers']}
    days={}
    for assignment in assignments:
        day=assignment['date'];period=int(assignment['period']);teacher=names.get(assignment['teacherId'])
        if day not in days:
            # Compare saved and public variants; publication must not introduce a clash either.
            current=svc.day(project,day,actor)['lessons'];published=svc.day(project,day,actor,published=True)['lessons']
            days[day]=current+published
        if any(l['status']!='cancelled' and teacher in [project.get('legacy_mapping',{}).get('teachers',{}).get(t,next((x['name'] for x in project['teachers'] if x['id']==t),t)) for t in l['teacher_ids']] and l['period']<=period<l['period']+l['duration'] for l in days[day]):
            raise OperationError(f'{day} {period}교시 {teacher}: 학기 중 실제 수업·대강과 시험감독 충돌')

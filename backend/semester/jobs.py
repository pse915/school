from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from threading import Event
import uuid,time
from .model import compile_project,digest,SemesterError
from .solver import solve
POOL=ThreadPoolExecutor(max_workers=2,thread_name_prefix='semester-solver')

def start(app,service,term_id,seconds,seed,count,reference=None,fixed_ids=None):
    previous=getattr(app,'_semester_job',None)
    if previous and not previous['future'].done():raise SemesterError('이 세션의 편성이 실행 중입니다. 취소 후 다시 실행하세요.')
    service.actor(write=True)
    if previous and previous['future'].done() and not previous.get('saved') and not previous['cancel'].is_set():poll(app,service)
    if not 1<=seconds<=180 or not 1<=count<=5:raise SemesterError('탐색시간 1~180초, 후보 수 1~5 범위입니다.')
    term=service.get(term_id);project=compile_project(term['project']);cancel=Event()
    if reference and fixed_ids:
        if set(fixed_ids)-{l['id']+'#1' for l in project['lessons']}:raise SemesterError('고정할 참조 회차가 현재 입력에 없습니다.')
        ref={r['session_id']:r for r in reference['placements']}
        for lesson in project['lessons']:
            ident=lesson['id']+'#1'
            if ident in fixed_ids:
                if ident not in ref:raise SemesterError('고정 회차가 참조 후보에 없습니다.')
                lesson['fixed_slots']=[ref[ident]['start']];lesson['room_ids']=[ref[ident]['room_id']] if ref[ident].get('room_id') else []
    ref={r['session_id']:{k:r.get(k,'') for k in ('start','room_id')} for r in reference['placements']} if reference else None
    job={'id':uuid.uuid4().hex,'term_id':term_id,'revision':term['revision'],'input_hash':digest(term['project']),'project':project,'cancel':cancel,'owner':app._owner(),'saved':False,'status':'RUNNING'}
    def compute():
        results=[]
        for i in range(count):
            if cancel.is_set():break
            results.append(solve(project,seconds,seed+i,cancel,ref))
        return results
    with service.repo.tx(True) as db:
        old=db.execute('SELECT * FROM semester_job_locks WHERE term_id=?',(term_id,)).fetchone()
        if old and old['expires']>time.time():raise SemesterError('이 학기의 편성이 다른 세션에서 실행 중입니다. 완료 또는 만료 후 다시 실행하세요.')
        db.execute('INSERT OR REPLACE INTO semester_job_locks VALUES(?,?,?)',(term_id,job['id'],time.time()+seconds*count+120))
    job['service']=service
    job['future']=POOL.submit(compute);app._semester_job=job;return job['id']

def stop(app):
    job=getattr(app,'_semester_job',None)
    if job:
        job['cancel'].set();job['status']='CANCELLED';job['future'].cancel()
        release(job)

def release(job):
    try:
        with job['service'].repo.tx(True) as db:db.execute('DELETE FROM semester_job_locks WHERE term_id=? AND job_id=?',(job['term_id'],job['id']))
    except Exception:
        # A failed lease cleanup must not prevent logout. The lease expires.
        pass

def poll(app,service):
    job=getattr(app,'_semester_job',None)
    if not job:return None
    if job['owner']!=app._owner():stop(app);return {'status':'CANCELLED'}
    if job['cancel'].is_set():return {'status':'CANCELLED','id':job['id']}
    if not job['future'].done():return {'status':'RUNNING','id':job['id']}
    if not job['saved']:
        try:
            with service.repo.tx() as db:
                lease=db.execute('SELECT job_id FROM semester_job_locks WHERE term_id=?',(job['term_id'],)).fetchone()
                if not lease or lease[0]!=job['id']:raise SemesterError('실행 소유권이 만료되어 결과를 폐기했습니다.')
            term=service.get(job['term_id'])
            if term['revision']!=job['revision'] or digest(term['project'])!=job['input_hash']:raise SemesterError('입력이 변경되어 계산 결과를 폐기했습니다.')
            results=job['future'].result();ids=[]
            for result in results:
                if result['status'] in ('FEASIBLE','OPTIMAL'):ids.append(service.add_candidate(job['term_id'],job['revision'],job['input_hash'],job['project'],result))
            job['result']={'status':results[-1]['status'] if results else 'CANCELLED','candidate_ids':ids,'results':[{k:v for k,v in r.items() if k!='placements'} for r in results]}
        except Exception as exc:job['result']={'status':'ERROR','message':str(exc)}
        job['saved']=True
        release(job)
    return {**job['result'],'id':job['id']}

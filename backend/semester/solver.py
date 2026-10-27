"""CP-SAT semester solver reusing existing session/options/resource primitives."""
from collections import defaultdict
from threading import Thread
import time
from diple.engine import options,_resources
from diple.model import expand_sessions
from .model import validate,spans,summary,SemesterError

def solve(project,seconds=15,seed=1,cancel=None,reference=None):
    from ortools.sat.python import cp_model
    started=time.monotonic();m=cp_model.CpModel();sessions=expand_sessions(project);choices={};variables={};resources=defaultdict(list);by_start=defaultdict(list)
    period_vars=defaultdict(list);daily=defaultdict(list);subjectday=defaultdict(list);roomday=defaultdict(list);penalties={k:[] for k in project['weights']}
    for s in sessions:
        opts=options(project,s);choices[s['session_id']]=opts
        if not opts:return {'status':'INVALID','placements':[],'errors':[s['session_id']+': 가능한 교사·교시·교실 조합이 없습니다.'],'elapsed':time.monotonic()-started}
        vs=[]
        for i,(start,room,occupied,keys) in enumerate(opts):
            v=m.NewBoolVar(s['session_id']+'_'+str(i));vs.append(v);variables[(s['session_id'],i)]=v;by_start[(s['session_id'],start)].append(v)
            actual=spans(project,s,start)
            for kind,ident in keys:
                for left,right in actual:resources[(kind,ident,start[0])].append((left,right,v))
            for t in s['teacher_ids']:
                daily[(t,start[0])].append((v,s['duration']))
                for slot in occupied:period_vars[(t,slot[0],int(slot[1:]))].append(v)
                if room:roomday[(t,start[0],room)].append(v)
            for c in s['class_ids']:subjectday[(c,s['subject_id'],start[0])].append(v)
            penalties.setdefault('late',[]).append(v*int(start[1:])*s['duration'])
            if reference and reference.get(s['session_id'])!={'start':start,'room_id':room}:penalties.setdefault('changes',[]).append(v)
        m.AddExactlyOne(vs)
    # Sweep all real-time interval boundaries; constraints use physical time, not only period numbers.
    for entries in resources.values():
        points=sorted({a for a,b,v in entries}|{b for a,b,v in entries})
        seen=set()
        for left,right in zip(points,points[1:]):
            active=tuple(sorted({v.Index():v for a,b,v in entries if a<right and b>left}.values(),key=lambda v:v.Index()))
            key=tuple(v.Index() for v in active)
            if len(active)>1 and key not in seen:m.AddAtMostOne(active);seen.add(key)
    simultaneous=defaultdict(list);blocks=defaultdict(list)
    for s in sessions:
        if s.get('simultaneous_group'):simultaneous[(s['simultaneous_group'],s['occurrence'])].append(s)
        if s.get('timing_block'):blocks[s['timing_block']].append(s)
    for group in simultaneous.values():
        for a,b in zip(group,group[1:]):
            for day,count in project['periods_by_day'].items():
                for n in range(1,count+1):m.Add(sum(by_start.get((a['session_id'],day+str(n)),[]))==sum(by_start.get((b['session_id'],day+str(n)),[])))
    for group in blocks.values():
        anchors=[(d,n) for d,count in project['periods_by_day'].items() for n in range(1,count+1) if all(n+s['timing_block_length']-1<=count for s in group)]
        picked=[m.NewBoolVar('block_'+group[0]['session_id']+str(i)) for i in range(len(anchors))];m.AddExactlyOne(picked)
        for s in group:
            for (d,n),v in zip(anchors,picked):m.Add(sum(by_start.get((s['session_id'],d+str(n+s['timing_offset'])),[]))==v)
    for teacher in project['teachers']:
        counts=[]
        for day,maxp in project['periods_by_day'].items():
            count=m.NewIntVar(0,12,'load'+teacher['id']+day);m.Add(count==sum(v*d for v,d in daily[(teacher['id'],day)]));counts.append(count)
            busy=[]
            for n in range(1,maxp+1):
                used=m.NewBoolVar('used'+teacher['id']+day+str(n));m.AddMaxEquality(used,period_vars[(teacher['id'],day,n)] or [0]);busy.append(used)
            for n,v in enumerate(busy):
                if n and n<len(busy)-1:
                    before=m.NewBoolVar('before'+teacher['id']+day+str(n));after=m.NewBoolVar('after'+teacher['id']+day+str(n));hole=m.NewBoolVar('hole'+teacher['id']+day+str(n))
                    m.AddMaxEquality(before,busy[:n]);m.AddMaxEquality(after,busy[n+1:]);m.Add(hole>=before+after-v-1);penalties.setdefault('gaps',[]).append(hole)
                if n+4<=len(busy):
                    run=m.NewIntVar(0,1,'run'+teacher['id']+day+str(n));m.Add(run>=sum(busy[n:n+4])-3);penalties.setdefault('continuous',[]).append(run)
            roomused=[]
            for (tid,d,room),vs in roomday.items():
                if tid==teacher['id'] and d==day:
                    r=m.NewBoolVar('room'+tid+d+room);m.AddMaxEquality(r,vs);roomused.append(r)
            if roomused:
                over=m.NewIntVar(0,len(roomused),'rooms'+teacher['id']+day);m.Add(over>=sum(roomused)-1);penalties.setdefault('room_changes',[]).append(over)
        high=m.NewIntVar(0,12,'high'+teacher['id']);low=m.NewIntVar(0,12,'low'+teacher['id']);m.AddMaxEquality(high,counts);m.AddMinEquality(low,counts);penalties.setdefault('balance',[]).append(high-low)
    for key,vs in subjectday.items():
        extra=m.NewIntVar(0,len(vs),'spread'+str(key));m.Add(extra>=sum(vs)-1);penalties.setdefault('subject_spread',[]).append(extra)
    m.Minimize(sum(int(project['weights'].get(k,0))*sum(vs) for k,vs in penalties.items()))
    solver=cp_model.CpSolver();solver.parameters.max_time_in_seconds=float(seconds);solver.parameters.random_seed=int(seed);solver.parameters.num_search_workers=4
    done=__import__('threading').Event()
    def watcher():
        while not done.wait(.05):
            if cancel and cancel.is_set():solver.StopSearch();return
    thread=Thread(target=watcher,daemon=True);thread.start()
    try:status_id=solver.Solve(m)
    finally:done.set()
    status=solver.StatusName(status_id)
    if cancel and cancel.is_set():status='CANCELLED'
    placed=[]
    if status in ('OPTIMAL','FEASIBLE'):
        for sid,opts in choices.items():
            for i,option in enumerate(opts):
                if solver.BooleanValue(variables[(sid,i)]):placed.append({'session_id':sid,'start':option[0],'room_id':option[1]})
    errors=validate(project,placed) if placed else []
    if errors:status='VALIDATION_FAILED'
    if status=='INFEASIBLE':
        fixed=[{'session_id':s['session_id'],'start':s['fixed_start'],'room_id':s['room_ids'][0] if len(s.get('room_ids',[]))==1 else ''} for s in sessions if s['fixed_start']]
        errors=[e for e in validate(project,fixed,complete=False) if e.startswith(('teacher ','student ','class '))]
        errors.append('현재 필수조건의 조합에서 불가능합니다. 고정·금지·동시수업·자원 정원을 검토하세요. 최소 충돌 집합을 계산한 결과는 아닙니다.')
    elif status=='UNKNOWN':errors=['탐색 제한시간 내 해를 찾지 못했습니다. 불가능 판정이 아닙니다. 시간·조건을 검토하세요.']
    elif status=='CANCELLED':errors=['계산이 취소되어 이 실행의 결과는 저장하지 않습니다.']
    return {'status':status,'placements':placed if not errors else [],'errors':errors,'engine':'CP-SAT semester','elapsed':time.monotonic()-started,
            'objective':solver.ObjectiveValue() if placed else None,'metrics':{**summary(project,placed), 'changes':sum(reference.get(p['session_id'])!={'start':p['start'],'room_id':p.get('room_id','')} for p in placed) if reference else 0} if placed else {}}

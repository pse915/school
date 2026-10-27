"""Reproducible synthetic whole-school scale benchmark; no real school data."""
import json,sys,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backend.semester.model import empty_project,compile_project
from backend.semester.solver import solve

def school(classes=18,teacher_count=36):
    p=empty_project('benchmark',2027,1,'합성 성능학교','2027-03-01','2027-07-31')
    p['teachers']=[{'id':'T'+str(n),'name':'교사'+str(n),'blocked':[],'max_weekly':30} for n in range(teacher_count)]
    p['subjects']=[{'id':'S'+str(n),'name':'과목'+str(n),'credits':5} for n in range(5)]
    for c in range(classes):
        cl='C'+str(c);room='R'+str(c);p['classes'].append({'id':cl,'name':'학급'+str(c),'grade':c//6+1,'size':25,'blocked':[]})
        p['rooms'].append({'id':room,'name':'교실'+str(c),'capacity':30,'blocked':[]})
        p['students'] += [{'id':cl+'-ST'+str(n),'class_id':cl,'name':'합성학생'} for n in range(25)]
        for sub in range(5):p['curriculum'].append({'id':cl+'-S'+str(sub),'subject_id':'S'+str(sub),'teacher_ids':['T'+str((c*5+sub)%teacher_count)],'class_ids':[cl],'student_ids':[],'room_ids':[room],'weekly_periods':5,'split':[1]*5,'fixed_slots':[],'forbidden_slots':[]})
    return p
if __name__=='__main__':
    results=[]
    for n,t in [(6,12),(18,36)]:
        raw=school(n,t);begin=time.monotonic();project=compile_project(raw);result=solve(project,seconds=10,seed=1)
        results.append({'classes':n,'teachers':t,'students':len(raw['students']),'sessions':sum(r['weekly_periods'] for r in raw['curriculum']),
            'limit_seconds':10,'wall_seconds':time.monotonic()-begin,'status':result['status'],'assigned':len(result['placements']),'errors':result['errors'],'objective':result.get('objective')})
    print(json.dumps(results,ensure_ascii=False,indent=2))

import copy,json,random,subprocess,time
import pytest
from backend.exam_supervision import engine as E

def original(**p):
    return json.loads(subprocess.run(['node','tests/exam_supervision/original_runner.cjs'],input=json.dumps(p),text=True,capture_output=True,check=True).stdout)

def context(seed=0):
    rng=random.Random(seed);teachers=[dict(id=str(i),name='교사'+str(i),subjects=[['국어','수학','과학','역사'][i%4]],crossSubjects=['영어'] if i%5==0 else [],homeroom='1-1' if i==0 else '',roleEligibility=dict(MAIN=i%7!=0,ASSIST=True,STUDY=True)) for i in range(10)]
    schedule=[dict(day=d,date=f'2026-11-{22+d}',period=p,grade=1,classNo=1,classId='1-1',type='STUDY' if p==2 else 'EXAM',subject='' if p==2 else '국어' if p==1 else '수학',start='',end='') for d in (1,2) for p in (1,2,3)]
    settings=E.default_state()['settings'];settings['optimization'].update(profile=['balanced','fairness','consecutive','grade'][seed%4],gradeStrength=(seed%3)/2)
    return E.Context(dict(teachers=teachers,schedule=schedule,settings=settings,unavailable=[dict(teacherId='2',date='2026-11-23',period=1)],teaching=dict(enabled=True,known=[t['id'] for t in teachers],rows=[dict(teacherId=t['id'],weekday='월',period=p,classId='2-1',subject='역사') for t in teachers for p in range(1,6) if rng.random()<.2]),visiting=[],teachingRules=[]))

def close(a,b):
    if isinstance(a,dict):
        assert set(a)==set(b)
        for k in a:close(a[k],b[k])
    elif isinstance(a,list):
        assert len(a)==len(b)
        for x,y in zip(a,b):close(x,y)
    elif isinstance(a,(float,int)) and not isinstance(a,bool):assert a==pytest.approx(b)
    else:assert a==b

@pytest.mark.parametrize('seed',range(12))
def test_rules_validation_statistics_objective_match_original(seed):
    c=context(seed);r=E.make_attempt(c.jobs,c,seed+1,{j['key']:[t for t in c.teachers if not c.eligible(t,j)] for j in c.jobs});arr=r.get('assignments',[])
    expected=original(op='inspect',ctx=c.data,arr=arr)
    close(dict(jobs=c.jobs,eligible=[[c.eligible(t,j,arr) for t in c.teachers] for j in c.jobs],validation=c.validate(arr),stats=E.build_stats(arr,c),vector=E.objective_vector(arr,c)),expected)

@pytest.mark.parametrize('seed',range(8))
def test_seeded_matching_matches_original(seed):
    c=context(seed);r=E.make_attempt(c.jobs,c,seed+1,{j['key']:[t for t in c.teachers if not c.eligible(t,j)] for j in c.jobs})
    close(r,original(op='attempt',ctx=c.data,seed=seed+1))

@pytest.mark.parametrize('seed',[0,1,-1,2026,4294967295,9973])
def test_rng_exact(seed):
    r=E.seeded(seed);assert [r() for _ in range(20)]==original(op='seed',seed=seed)

@pytest.mark.parametrize('seed',range(4))
def test_solver_incremental_trials_and_fixed_positions(seed):
    c=context(seed);r=E.solve(c,seed+10,250);assert r['ok'];arr=r['assignments'];assert c.validate(arr)['valid']
    inc=E.IncrementalObjective(arr,c);close(inc.vector(),E.objective_vector(arr,c));before=inc.vector()
    for a in arr:
        for t in c.teachers:
            changed={**a,'teacherId':t['id']};proposal=[changed if b['key']==a['key'] else b for b in arr]
            close(inc.trial([(a,changed)]),E.objective_vector(proposal,c));close(inc.vector(),before)
    c.fixed={arr[0]['key']:arr[0]['teacherId']};improved=E.optimize_local(arr,c,time.monotonic()+.1);assert improved['assignments'][0]['teacherId']==arr[0]['teacherId'];assert c.validate(improved['assignments'])['valid']

def test_original_self_tests():
    result=original(op='selfTests');assert all(r['status']=='통과' for r in result['tests']),result

def test_fail_closed_and_cancellation():
    c=context();c.instructors=set(t['id'] for t in c.teachers);assert not E.solve(c,1,50)['ok']
    assert E.solve(context(),1,50,lambda:True)['cancelled']

def test_times_and_lunch():
    assert E.conflict_time(dict(date='a',period=1,start='09:00',end='10:00'),dict(date='a',period=2,start='09:30',end='10:30'))
    assert E.run_summary({1,2,3,4},2)['four']==0

@pytest.mark.parametrize('case',['fallback','visiting','rules','overlap'])
def test_exception_rules_match_original(case):
    data=context(2).data
    if case=='fallback':
        data['teaching']['known']=['0','1'];data['settings'].update(missingTimetableFallback=True,missingFallbackTeacherIds=['3','4','5'])
    elif case=='visiting':
        data['visiting']=[dict(teacherId='3',type='타교출강',date='',weekday='월',period=0,location='타교'),dict(teacherId='3',type='타교출강',date='2026-11-23',weekday='월',period=1,location='본교')]
    elif case=='rules':
        data['teachingRules']=[dict(teacherId='2',mode='포함',startDate='2026-11-23',endDate='2026-11-23',weekday='',period=1,classId='',reason='정규수업 조치'),dict(teacherId='3',mode='제외',startDate='2026-11-23',endDate='2026-11-24',weekday='',period=0,classId='',reason='출장')]
    else:
        for r in data['schedule']:r.update(start='09:00',end='10:00')
    c=E.Context(data);expected=original(op='inspect',ctx=data,arr=[])
    close([[c.eligible(t,j,[]) for t in c.teachers] for j in c.jobs],expected['eligible'])


def test_production_diagnostics():
    assert E.self_tests()['failed']==0

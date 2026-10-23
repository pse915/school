"""Python port of Code.gs's active hard rules and lexicographic allocator.

No JavaScript engine, Google, Streamlit, or pandas dependency. Contexts and
indexes are request-local. The unmodified original is retained for comparisons.
"""
import copy
import math
import re
import time
import unicodedata
from collections import Counter, defaultdict
from datetime import date

ROLES={'MAIN':'정감독','ASSIST':'부감독','STUDY':'자습감독'}
OPTIMIZATION=dict(profile='balanced',gradeStrength=.5,mainWeight=3,assistWeight=2,studyWeight=1,
                  avoidThree=True,avoidFour=True,roleFairness=True,burdenFairness=True,dateBalance=True,lunchBreakAfter=0)

def require(condition,message):
    if not condition:raise ValueError(message)
def clean(value):return '' if value is None else str(value).strip()
def norm(value):return re.sub(r'\s+','',unicodedata.normalize('NFKC',clean(value))).lower()
def subjects(value):return list(dict.fromkeys(x.strip() for x in re.split(r'[,;/、，\n\r]+',clean(value)) if x.strip()))
def integer(value,label='숫자'):
    try:
        n=float(value);require(math.isfinite(n) and n.is_integer(),label+'은 정수여야 합니다.');return int(n)
    except (ValueError,TypeError,OverflowError) as exc:raise ValueError(label+' 형식 오류: '+str(value)) from exc

def class_id(value):
    text=re.sub(r'학년|반|\s+','',clean(value));m=re.fullmatch(r'(\d+)[-–_/](\d+)',text)
    if m:return f'{int(m[1])}-{int(m[2])}'
    m=re.fullmatch(r'\d{4}[./-](\d{1,2})[./-](\d{1,2})\.?',text)
    return f'{int(m[1])}-{int(m[2])}' if m else ''
def valid_date(value):
    try:return date.fromisoformat(value).isoformat()==value
    except (ValueError,TypeError):return False
def weekday(value):
    require(valid_date(value),'날짜 형식 오류: '+str(value));return '월화수목금토일'[date.fromisoformat(value).weekday()]

def optimization(settings,strict=False):
    opt={**OPTIMIZATION,**settings.get('optimization',{})}
    require(opt['profile'] in ('balanced','fairness','consecutive','grade'),'최적화 프리셋 오류')
    for k in ('gradeStrength','mainWeight','assistWeight','studyWeight'):
        opt[k]=float(opt[k]);require(math.isfinite(opt[k]),'최적화 숫자 오류: '+k)
    require(0<=opt['gradeStrength']<=1,'학년 우대 범위는 0~100%입니다.')
    require(10>=opt['mainWeight']>opt['assistWeight']>opt['studyWeight']>0,'업무강도는 정감독 > 부감독 > 자습감독 > 0, 정감독 10 이하입니다.')
    for k in ('avoidThree','avoidFour','roleFairness','burdenFairness','dateBalance'):
        if strict:require(type(opt[k]) is bool,'최적화 사용 여부 오류: '+k)
        opt[k]=bool(opt[k])
    opt['lunchBreakAfter']=integer(opt['lunchBreakAfter']);require(0<=opt['lunchBreakAfter']<=10,'점심 휴식 교시 오류')
    return opt

def default_state():
    return dict(state='EDITABLE',revision=0,activeVersion='',editingBaseVersion='',updatedAt='',gradePlan=None,
                rosterVerified=False,rosterFingerprint='',lastError='',settings=dict(studyCount=1,aliases={},maxPerTeacher=0,
                instructorIds=[],missingTimetableFallback=False,missingFallbackTeacherIds=[],optimization=copy.deepcopy(OPTIMIZATION)))

def validate_schedule(rows,classes):
    require(rows,'시험일정을 먼저 입력하세요.');by={c['id']:c for c in classes};seen=set();dates={};days={}
    for r in rows:
        require(type(r['day']) is int and 1<=r['day']<=5,'시험일차는 1~5일차입니다.')
        require(valid_date(r['date']),'시험 날짜 오류: '+str(r['date']))
        require(type(r['period']) is int and 1<=r['period']<=5,'교시는 1~5교시입니다.')
        c=by.get(r['classId']);require(c and c['grade']==r['grade'] and c['classNo']==r['classNo'],'학급·학년·반 불일치: '+r['classId'])
        require(r['type'] in ('EXAM','STUDY'),'시험/자습 구분 오류');require(r['type']!='EXAM' or clean(r['subject']),'시험과목이 비었습니다.')
        key=(r['date'],r['period'],r['classId']);require(key not in seen,'중복 시험일정: '+str(key));seen.add(key)
        gd,gt=(r['grade'],r['day']),(r['grade'],r['date'])
        require(gd not in dates or dates[gd]==r['date'],'같은 학년·일차의 날짜가 다릅니다.')
        require(gt not in days or days[gt]==r['day'],'같은 학년·날짜의 일차가 다릅니다.');dates[gd]=r['date'];days[gt]=r['day']
        for k in ('start','end'):require(not r.get(k) or re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d',r[k]),'시각 형식 오류')
        require(not(r.get('start') and r.get('end')) or r['start']<r['end'],'종료시각은 시작 이후여야 합니다.')
    # Each grade may operate independently for up to five days, as the
    # original grade-based editor supports. Counting (grade, day) pairs
    # across grades incorrectly rejected three grades with separate days.
    require(all(1 <= day <= 5 for _, day in dates), '학년별 시험기간은 최대 5일입니다.')

def grade_plan(rows,classes,supplied=None):
    grades=sorted({c['grade'] for c in classes})
    if supplied is None:
        result={}
        for g in grades:
            own=[r for r in rows if r['grade']==g];days=[]
            for d in range(1,max([r['day'] for r in own] or [1])+1):
                current=[r for r in own if r['day']==d]
                days.append(dict(day=d,enabled=bool(current) or not rows,date=current[0]['date'] if current else '',periods=sorted({r['period'] for r in current}) or [1,2,3]))
            result[str(g)]=dict(enabled=bool(own) or not rows,days=days)
        return result
    require(isinstance(supplied,dict) and set(supplied)=={str(g) for g in grades},'등록된 모든 학년의 운영 설정이 필요합니다.')
    result=copy.deepcopy(supplied)
    for g in grades:
        item=result[str(g)];require(type(item.get('enabled')) is bool and 1<=len(item.get('days',[]))<=5,'학년별 운영 설정 오류')
        item['days'].sort(key=lambda d:d['day'])
        for n,d in enumerate(item['days'],1):
            require(d['day']==n and type(d.get('enabled')) is bool,'시험일차는 연속 번호여야 합니다.')
            ps=d['periods'];require(isinstance(ps,list) and len(ps)==len(set(ps)) and all(type(p) is int and 1<=p<=5 for p in ps),'활성 교시 오류')
            if item['enabled'] and d['enabled']:
                require(valid_date(d['date']) and ps,'시험 날짜·교시가 필요합니다.')
                require(all(any(r['grade']==g and r['day']==n and r['period']==p for r in rows) for p in ps),'활성 교시에 학급 일정이 없습니다.')
    for r in rows:
        item=result[str(r['grade'])];d=next((d for d in item['days'] if d['day']==r['day']),None)
        require(item['enabled'] and d and d['enabled'] and d['date']==r['date'] and r['period'] in d['periods'],'미실시 학년·일차·교시 포함')
    require(rows,'실시하는 학급·교시가 필요합니다.');return result

def make_jobs(schedule,settings):
    jobs=[]
    for r in schedule:
        roles=['MAIN','ASSIST'] if r['type']=='EXAM' else ['STUDY'+str(i+1) for i in range(int(settings.get('studyCount',1)))]
        for role in roles:
            job={k:r[k] for k in ('day','date','period','classId','type','subject')}
            job.update(role=role,key=f"{r['date']}|{r['period']}|{r['classId']}|{role}",start=r.get('start',''),end=r.get('end',''));jobs.append(job)
    return jobs

def conflict_time(a,b):return a['date']==b['date'] and (a['period']==b['period'] or bool(a.get('start') and a.get('end') and b.get('start') and b.get('end') and a['start']<b['end'] and b['start']<a['end']))
def rule_applies(rule,job):
    start=rule.get('startDate') or rule.get('date') or '';end=rule.get('endDate') or start
    return (not start or start<=job['date']<=end) and (not rule.get('weekday') or rule['weekday']==weekday(job['date'])) and (not rule.get('period') or rule['period']==job['period'])

class Context:
    def __init__(self,data):
        self.data=copy.deepcopy(data);self.teachers=self.data['teachers'];self.schedule=self.data['schedule'];self.settings=self.data['settings']
        self.teaching=self.data.get('teaching') or {};self.visits=defaultdict(list);self.rules=defaultdict(list);self.lessons=defaultdict(list);self.released=defaultdict(set)
        self.known=set(self.teaching.get('known',[]));self.instructors=set(map(str,self.settings.get('instructorIds',[])))
        self.absent={(r['teacherId'],r['date'],r['period']) for r in self.data.get('unavailable',[])}
        self.by_id={t['id']:t for t in self.teachers};self.fixed=self.data.get('fixed',{});self.jobs=make_jobs(self.schedule,self.settings);self.grade_hours=defaultdict(Counter)
        for r in self.data.get('visiting',[]):self.visits[r['teacherId']].append(r)
        for r in self.data.get('teachingRules',[]):self.rules[r['teacherId']].append(r)
        for r in self.schedule:self.released[r['date'],r['period']].add(r['classId'])
        for r in self.teaching.get('rows',[]):
            self.lessons[r['teacherId'],r['weekday'],r['period']].append(r);g=clean(r.get('classId')).split('-')[0]
            if g.isdigit() and 1<=int(g)<=12:self.grade_hours[r['teacherId']][int(g)]+=1
        self.dates=list(dict.fromkeys(r['date'] for r in self.schedule));self.baseline={}
        for d in self.dates:
            for t in self.teachers:self.baseline[t['id'],d]={p for p in range(1,11) if any(not r.get('classId') or r['classId'] not in self.released[d,p] for r in self.lessons[t['id'],weekday(d),p])}
        self._fallback=None
    def matching_rules(self,t,j):return [r for r in self.rules[t['id']] if rule_applies(r,j)]
    def missing_restricted(self,t,j):return bool(self.teaching.get('enabled') and t['id'] not in self.known and not any(r['type']=='본교방문' for r in self.visits[t['id']]) and not any(r['mode']=='포함' and not r.get('classId') for r in self.matching_rules(t,j)))
    def fallback_plan(self):
        if self._fallback is not None:return self._fallback
        regular=Context({**self.data,'settings':{**self.settings,'missingTimetableFallback':False}});groups=defaultdict(list);plan={}
        for j in self.jobs:groups[j['date'],j['period']].append(j)
        for key,jobs in groups.items():
            candidates={j['key']:[t for t in self.teachers if not regular.eligible(t,j)] for j in jobs};owner={};by={j['key']:j for j in jobs}
            def match(job,seen):
                for t in candidates[job['key']]:
                    if t['id'] in seen:continue
                    seen.add(t['id'])
                    if t['id'] not in owner or match(by[owner[t['id']]],seen):owner[t['id']]=job['key'];return True
                return False
            matched=sum(match(j,set()) for j in jobs);plan[key]=dict(date=key[0],period=key[1],required=len(jobs),regularMatched=matched,shortage=len(jobs)-matched)
        self._fallback=plan;return plan
    def fallback_allowed(self,t,j):return self.settings.get('missingTimetableFallback') is True and t['id'] in self.settings.get('missingFallbackTeacherIds',[]) and self.fallback_plan().get((j['date'],j['period']),{}).get('shortage',0)>0
    def fallback_assignment(self,a):
        t=self.by_id.get(a['teacherId']);return bool(self.settings.get('missingTimetableFallback') is True and t and self.missing_restricted(t,a))
    def eligible(self,t,j,used=None):
        why=[];tid=t['id'];role='STUDY' if j['role'].startswith('STUDY') else j['role']
        if 'roleEligibility' in t and t['roleEligibility'].get(role) is not True:why.append(ROLES[role]+'불가(X)')
        if str(tid) in self.instructors:why.append('강사감독자동제외')
        if t.get('homeroom') and t['homeroom']==j['classId']:why.append('담임학급')
        if j['type']=='EXAM':
            canonical=lambda s:self.settings.get('aliases',{}).get(norm(s),norm(s));sub=canonical(j['subject'])
            if any(canonical(s)==sub for s in t.get('subjects',[])):why.append('동일교과')
            if any(canonical(s)==sub for s in t.get('crossSubjects',[])):why.append('상치교과')
        if (tid,j['date'],j['period']) in self.absent:why.append('배정불가')
        rules=self.matching_rules(t,j)
        if any(r['mode']=='제외' for r in rules):why.append('교사감독규칙제외')
        if self.teaching.get('enabled'):
            if self.missing_restricted(t,j) and not self.fallback_allowed(t,j):why.append('교사시간표미등록')
            else:
                inclusions=[r for r in rules if r['mode']=='포함'];full=any(not r.get('classId') for r in inclusions)
                conflicts=[r for r in self.lessons[tid,weekday(j['date']),j['period']] if (not r.get('classId') or r['classId'] not in self.released[j['date'],j['period']]) and not full and not any(v.get('classId') and v['classId']==r.get('classId') for v in inclusions)]
                if conflicts:why.append('정규수업('+','.join(dict.fromkeys(r.get('classId') or r.get('subject') or '학급미확인' for r in conflicts))+')')
        visits=self.visits[tid];matches=[r for r in visits if (not r.get('date') or r['date']==j['date']) and (not r.get('weekday') or r['weekday']==weekday(j['date'])) and (not r.get('period') or r['period']==j['period'])]
        matches.sort(key=lambda r:(-bool(r.get('date')),-bool(r.get('period'))))
        if matches:
            top=matches[0];same=[r for r in matches if bool(r.get('date'))==bool(top.get('date')) and bool(r.get('period'))==bool(top.get('period'))]
            if any(r['location']!=top['location'] for r in same):why.append('겸임근무설정충돌')
            elif top['location']=='타교':why.append('타교근무')
        elif any(r['type']=='본교방문' for r in visits):why.append('겸임본교방문미확인')
        if used and any(a['teacherId']==tid and a['key']!=j['key'] and conflict_time(a,j) for a in used):why.append('동일시간중복')
        return why
    def validate(self,arr):
        jobs={j['key']:j for j in self.jobs};seen=set();errors=[]
        for a in arr:
            j=jobs.get(a.get('key'));t=self.by_id.get(a.get('teacherId'))
            if j is None:errors.append('존재하지 않는 감독 자리: '+str(a.get('key')));continue
            if t is None:errors.append('알 수 없는 교사: '+str(a.get('teacherId')));continue
            if any(a.get(k)!=j[k] for k in ('day','date','period','classId','role','type','subject')):errors.append('원본 시험일정과 다른 배정 레코드: '+a['key'])
            if a['key'] in seen:errors.append('자리 중복: '+a['key'])
            seen.add(a['key']);why=self.eligible(t,j)
            if why:errors.append(a['key']+': '+','.join(why))
        errors.extend('감독자 미배정: '+j['key'] for j in self.jobs if j['key'] not in seen)
        groups=defaultdict(list)
        for a in arr:groups[a['teacherId'],a['date']].append(a)
        for items in groups.values():
            for i,a in enumerate(items):
                for b in items[i+1:]:
                    if conflict_time(a,b):errors.append('같은 시간 중복 배정: '+a['teacherId']+' '+a['key']+' / '+b['key'])
        maximum=self.settings.get('maxPerTeacher',0)
        if maximum:errors.extend('개인별 감독 상한 초과: '+tid for tid,n in Counter(a['teacherId'] for a in arr).items() if n>maximum)
        return dict(valid=not errors,errors=errors,required=len(self.jobs),assigned=len(arr))
    def affinity(self,tid,grade):
        hours=self.grade_hours[tid];return hours[grade]/sum(hours.values()) if hours else 0

def stats_map(arr,teachers):
    out={t['id']:dict(total=0,MAIN=0,ASSIST=0,STUDY=0,days={},periods=[]) for t in teachers}
    for a in arr:
        s=out.get(a['teacherId'])
        if s is None:continue
        s['total']+=1;s['STUDY' if a['role'].startswith('STUDY') else a['role']]+=1;s['days'][a['date']]=s['days'].get(a['date'],0)+1;s['periods'].append(a)
    return out

def build_stats(arr,ctx):
    counts=stats_map(arr,ctx.teachers);n=len([t for t in ctx.teachers if t['id'] not in ctx.instructors]);avg=len(arr)/n if n else 0;out=[]
    for t in ctx.teachers:
        s=counts[t['id']];out.append(dict(id=t['id'],name=t['name'],subjects=', '.join(t.get('subjects',[])),crossSubjects=', '.join(t.get('crossSubjects',[])),homeroom=t.get('homeroom',''),isInstructor=t['id'] in ctx.instructors,main=s['MAIN'],assist=s['ASSIST'],study=s['STUDY'],total=s['total'],delta=0 if t['id'] in ctx.instructors else round(s['total']-avg,2),days=s['days']))
    return out

def run_summary(periods,break_after=0):
    values=sorted(map(int,periods));segments=[]
    if values:
        length=1
        for a,b in zip(values,values[1:]):
            if b==a+1 and (not break_after or a!=break_after):length+=1
            else:segments.append(length);length=1
        segments.append(length)
    return dict(maxRun=max(segments or [0]),three=sum(n>=3 for n in segments),four=sum(n>=4 for n in segments),five=sum(n>=5 for n in segments),segments=segments)

def workload_analysis(arr,ctx):
    opt=optimization(ctx.settings);periods=defaultdict(set)
    for a in arr:periods[a['teacherId'],a['date']].add(a['period'])
    out=dict(teachers={},extraThree=0,extraFour=0,extraFive=0,totalThree=0,totalFour=0,totalFive=0)
    for (tid,d),original in ctx.baseline.items():
        before=run_summary(original,opt['lunchBreakAfter']);after=run_summary(original|periods[tid,d],opt['lunchBreakAfter'])
        item=out['teachers'].setdefault(tid,dict(maxBefore=0,maxAfter=0,addedThree=0,addedFour=0,addedFive=0,byDate={}))
        item['maxBefore']=max(item['maxBefore'],before['maxRun']);item['maxAfter']=max(item['maxAfter'],after['maxRun']);day=dict(before=before['maxRun'],after=after['maxRun'])
        for k in ('Three','Four','Five'):
            delta=max(0,after[k.lower()]-before[k.lower()]);out['extra'+k]+=delta;out['total'+k]+=after[k.lower()];item['added'+k]+=delta;day['added'+k]=delta
        item['byDate'][d]=day
    return out

def spread(values):return max(values)-min(values) if values else 0
def variance(values):
    mean=sum(values)/len(values) if values else 0;return sum((x-mean)**2 for x in values)/len(values) if values else 0

def objective_parts(arr,ctx):
    opt=optimization(ctx.settings);counts=stats_map(arr,ctx.teachers);active=[t for t in ctx.teachers if t['id'] not in ctx.instructors]
    vals={k:[counts[t['id']][k] for t in active] for k in ('MAIN','ASSIST','STUDY','total')}
    burdens=[opt['mainWeight']*s['MAIN']+opt['assistWeight']*s['ASSIST']+opt['studyWeight']*s['STUDY'] for s in (counts[t['id']] for t in active)]
    affinity=sum(ctx.affinity(a['teacherId'],int(a['classId'].split('-')[0])) for a in arr if a['teacherId'] in ctx.by_id)
    fair=sum(spread(vals[k])*w+variance(vals[k])*v for k,w,v in [('MAIN',120,6),('ASSIST',120,6),('STUDY',85,4),('total',100,8)])
    return dict(fairness=fair,burden=spread(burdens)*15+variance(burdens)*2,gradePenalty=opt['gradeStrength']*(len(arr)-affinity),gradeBonus=opt['gradeStrength']*affinity,mainSpread=spread(vals['MAIN']),assistSpread=spread(vals['ASSIST']),studySpread=spread(vals['STUDY']),totalSpread=spread(vals['total']),burdenSpread=spread(burdens),daily=sum(n*n for t in active for n in counts[t['id']]['days'].values()),work=workload_analysis(arr,ctx),gradeAffinityTotal=affinity,settings=opt)

def objective_vector(arr,ctx):
    v=objective_parts(arr,ctx);o=v['settings'];severe=([sum(ctx.fallback_assignment(a) for a in arr)] if ctx.settings.get('missingTimetableFallback') is True else [])+([v['work']['extraFive'],v['work']['extraFour']] if o['avoidFour'] else [0,0])
    fair=v['fairness'] if o['roleFairness'] else 0;burden=v['burden'] if o['burdenFairness'] else 0;three=v['work']['extraThree'] if o['avoidThree'] else 0;grade=v['gradePenalty'];days=v['daily'] if o['dateBalance'] else 0
    if o['profile']=='consecutive':return severe+[three,fair,burden,grade,days]
    if o['profile']=='grade':return severe+[fair,grade,burden,three,days]
    return severe+[fair,burden,three,grade,days]
def compare(a,b):
    if b is None:return -1
    for x,y in zip(a,b):
        if x<y-.000001:return -1
        if x>y+.000001:return 1
    return 0

def score(arr,ctx):
    v=objective_vector(arr,ctx);body=v[1:] if len(v)==8 else v
    return round((v[0]*1e15 if len(v)==8 else 0)+sum(x*w for x,w in zip(body,(1e12,1e10,1e5,1e3,20,2,1))),3)

def optimization_report(arr,ctx):
    p=objective_parts(arr,ctx);counts=stats_map(arr,ctx.teachers);o=p['settings'];teachers=[]
    for t in ctx.teachers:
        tid=t['id'];c=counts[tid];hours=ctx.grade_hours[tid];ordered=sorted(hours,key=lambda g:-hours[g]);work=p['work']['teachers'].get(tid,dict(maxBefore=0,maxAfter=0,addedThree=0,addedFour=0,addedFive=0,byDate={}))
        teachers.append(dict(id=tid,name=t['name'],isInstructor=tid in ctx.instructors,main=c['MAIN'],assist=c['ASSIST'],study=c['STUDY'],total=c['total'],burden=round(c['MAIN']*o['mainWeight']+c['ASSIST']*o['assistWeight']+c['STUDY']*o['studyWeight'],2),gradeHours=dict(hours),primaryGrade=ordered[0] if ordered else None,gradeShares={g:hours[g]/sum(hours.values()) for g in hours},**work))
    metrics={k:p[k] for k in ('mainSpread','assistSpread','studySpread','totalSpread','burdenSpread','gradeAffinityTotal')}
    metrics.update(required=len(ctx.jobs),assigned=len(arr),addedThree=p['work']['extraThree'],addedFour=p['work']['extraFour'],addedFive=p['work']['extraFive'],totalThree=p['work']['totalThree'],totalFour=p['work']['totalFour'],score=score(arr,ctx))
    return dict(metrics=metrics,teachers=teachers,optimization=o,fallbackUsage=[dict(teacherId=a['teacherId'],name=ctx.by_id[a['teacherId']]['name'],**{k:a[k] for k in ('date','period','classId','role')}) for a in arr if ctx.fallback_assignment(a)])

def seeded(seed):
    a=int(seed or 13579)&0xffffffff
    def random():
        nonlocal a
        a=(((a^(a>>15))*(1|a))+0x6D2B79F5)&0xffffffff;z=(((a^(a>>7))*(61|a))&0xffffffff)^a
        return ((z^(z>>14))&0xffffffff)/4294967296
    return random

def make_attempt(jobs,ctx,seed,candidates):
    rand=seeded(seed);all_rows=[];counts=stats_map([],ctx.teachers);opt=optimization(ctx.settings);groups=defaultdict(list)
    for j in jobs:groups[j['date'],j['period']].append(j)
    keys=sorted(groups,key=lambda k:(sum(len(candidates[j['key']]) for j in groups[k])/len(groups[k]),f'{k[0]}|{k[1]}'))
    for group in keys:
        ordered=sorted(groups[group],key=lambda j:(len(candidates[j['key']]),j['key']));by={j['key']:j for j in ordered};owner={};matched={};locked=set()
        for j in ordered:
            tid=ctx.fixed.get(j['key'])
            if not tid:continue
            if tid not in {t['id'] for t in candidates[j['key']]} or any(a['teacherId']==tid and conflict_time(a,j) for a in all_rows) or tid in owner:return dict(ok=False,reason='고정 배정 충돌',job=j['key'])
            owner[tid]=j['key'];matched[j['key']]=tid;locked.add(j['key'])
        def dfs(j,seen,allow_fallback=True):
            possible=[t for t in candidates[j['key']] if (allow_fallback or not ctx.fallback_assignment({**j,'teacherId':t['id']})) and (not ctx.settings.get('maxPerTeacher') or counts[t['id']]['total']<ctx.settings['maxPerTeacher']) and not any(a['teacherId']==t['id'] and conflict_time(a,j) for a in all_rows)]
            weighted=[];role='STUDY' if j['role'].startswith('STUDY') else j['role']
            for t in possible:
                tid=t['id'];s=counts[tid];ratio=ctx.affinity(tid,int(j['classId'].split('-')[0]));adjacent=any(a['date']==j['date'] and abs(a['period']-j['period'])==1 for a in s['periods'])
                occupied=ctx.baseline.get((tid,j['date']),set())|{a['period'] for a in s['periods'] if a['date']==j['date']};before=run_summary(occupied,opt['lunchBreakAfter']);after=run_summary(occupied|{j['period']},opt['lunchBreakAfter'])
                heavy=max(0,after['four']-before['four'])*75+max(0,after['five']-before['five'])*250 if opt['avoidFour'] else 0;medium=max(0,after['three']-before['three'])*15 if opt['avoidThree'] else 0
                weight=opt[{'MAIN':'mainWeight','ASSIST':'assistWeight','STUDY':'studyWeight'}[role]];affinity=50*math.log(1+opt['gradeStrength']*ratio) if opt['gradeStrength'] else 0
                cost=180*s['total']+40*s[role]+10*weight*s['total']+12*abs(s['MAIN']-s['ASSIST']+(1 if role=='MAIN' else -1 if role=='ASSIST' else 0))+8*s['days'].get(j['date'],0)+9*adjacent+heavy+medium-affinity+rand()*15
                weighted.append((cost,t))
            for _,t in sorted(weighted,key=lambda pair:pair[0]):
                tid=t['id']
                if tid in seen:continue
                seen.add(tid);prev=owner.get(tid)
                if prev is None or (prev not in locked and dfs(by[prev],seen,allow_fallback)):matched[j['key']]=tid;owner[tid]=j['key'];return True
            return False
        if ctx.settings.get('missingTimetableFallback') is True:
            for j in ordered:
                if j['key'] not in locked:dfs(j,set(),False)
        for j in ordered:
            if j['key'] in locked or j['key'] in matched:continue
            if not dfs(j,set()):
                explanations=[]
                for job in ordered:
                    if job['key'] not in matched:explanations.append(dict(job=job['key'],possible=sum(not ctx.eligible(t,job,all_rows) for t in ctx.teachers),reasons=dict(Counter(w for t in ctx.teachers for w in ctx.eligible(t,job,all_rows)))))
                return dict(ok=False,reason='같은 교시의 감독 인원 및 후보 경합으로 완전 배정 불가',unmatched=explanations,capacity=len(ordered),matched=len(matched))
        for j in ordered:
            tid=matched[j['key']];a={**j,'teacherId':tid,'fixed':bool(ctx.fixed.get(j['key']))};all_rows.append(a);s=counts[tid];s['total']+=1;s['STUDY' if j['role'].startswith('STUDY') else j['role']]+=1;s['days'][j['date']]=s['days'].get(j['date'],0)+1;s['periods'].append(a)
    return dict(ok=True,assignments=all_rows)

class IncrementalObjective:
    """Exact incremental evaluator; trials roll back, never decide legality."""
    def __init__(self,arr,ctx):
        self.ctx,self.size,self.opt=ctx,len(arr),optimization(ctx.settings);self.counts=stats_map([],ctx.teachers);self.periods=defaultdict(Counter);self.active=[t['id'] for t in ctx.teachers if t['id'] not in ctx.instructors]
        self.affinity_total=0;self.fallback_total=0;self.day_metrics={};self.base_metrics={k:run_summary(v,self.opt['lunchBreakAfter']) for k,v in ctx.baseline.items()};self.extra=[0,0,0]
        for a in arr:self.update(a,1)
        for k in ctx.baseline:self.refresh(k)
    def update(self,a,direction):
        tid=a['teacherId'];s=self.counts[tid];s['STUDY' if a['role'].startswith('STUDY') else a['role']]+=direction;s['total']+=direction;s['days'][a['date']]=s['days'].get(a['date'],0)+direction
        if not s['days'][a['date']]:del s['days'][a['date']]
        k=(tid,a['date']);self.periods[k][a['period']]+=direction
        if not self.periods[k][a['period']]:del self.periods[k][a['period']]
        self.affinity_total+=direction*self.ctx.affinity(tid,int(a['classId'].split('-')[0]))
        if self.ctx.fallback_assignment(a):self.fallback_total+=direction
    def refresh(self,k):
        for i,v in enumerate(self.day_metrics.get(k,[0,0,0])):self.extra[i]-=v
        base=self.ctx.baseline.get(k,set());before=self.base_metrics.get(k,run_summary(base,self.opt['lunchBreakAfter']));after=run_summary(base|{p for p,n in self.periods[k].items() if n>0},self.opt['lunchBreakAfter'])
        new=[max(0,after[x]-before[x]) for x in ('three','four','five')];self.day_metrics[k]=new
        for i,v in enumerate(new):self.extra[i]+=v
    def vector(self):
        o=self.opt;vals={k:[self.counts[tid][k] for tid in self.active] for k in ('MAIN','ASSIST','STUDY','total')};burdens=[s['MAIN']*o['mainWeight']+s['ASSIST']*o['assistWeight']+s['STUDY']*o['studyWeight'] for s in (self.counts[tid] for tid in self.active)]
        fair=sum(spread(vals[k])*w+variance(vals[k])*v for k,w,v in [('MAIN',120,6),('ASSIST',120,6),('STUDY',85,4),('total',100,8)]) if o['roleFairness'] else 0;burden=spread(burdens)*15+variance(burdens)*2 if o['burdenFairness'] else 0
        severe=([self.fallback_total] if self.ctx.settings.get('missingTimetableFallback') is True else [])+([self.extra[2],self.extra[1]] if o['avoidFour'] else [0,0]);three=self.extra[0] if o['avoidThree'] else 0;grade=o['gradeStrength']*(self.size-self.affinity_total);days=sum(n*n for tid in self.active for n in self.counts[tid]['days'].values()) if o['dateBalance'] else 0
        if o['profile']=='consecutive':return severe+[three,fair,burden,grade,days]
        if o['profile']=='grade':return severe+[fair,grade,burden,three,days]
        return severe+[fair,burden,three,grade,days]
    def trial(self,changes):
        affected=set()
        for before,after in changes:self.update(before,-1);self.update(after,1);affected.update([(before['teacherId'],before['date']),(after['teacherId'],after['date'])])
        for k in affected:self.refresh(k)
        result=self.vector()
        for before,after in reversed(changes):self.update(after,-1);self.update(before,1)
        for k in affected:self.refresh(k)
        return result

def optimize_local(arr,ctx,until,cancelled=lambda:False):
    best=copy.deepcopy(arr);changes=0;candidates={a['key']:[t for t in ctx.teachers if not ctx.eligible(t,a)] for a in best};ids={k:{t['id'] for t in ts} for k,ts in candidates.items()}
    evaluation=IncrementalObjective(best,ctx);best_vector=evaluation.vector()
    def occupancy():
        by=defaultdict(list)
        for i,a in enumerate(best):by[a['teacherId']].append((i,a))
        return by
    occupied=occupancy()
    def conflict(job,tid,*exceptions):return any(i not in exceptions and conflict_time(a,job) for i,a in occupied[tid])
    improved=True
    while improved and changes<200 and time.monotonic()<until and not cancelled():
        improved=False
        for i,a in enumerate(best):
            if ctx.fixed.get(a['key']):continue
            for t in candidates[a['key']]:
                if time.monotonic()>=until or cancelled():break
                if t['id']==a['teacherId'] or conflict(a,t['id'],i):continue
                if ctx.settings.get('maxPerTeacher') and len(occupied[t['id']])>=ctx.settings['maxPerTeacher']:continue
                replacement={**a,'teacherId':t['id']};v=evaluation.trial([(a,replacement)])
                if compare(v,best_vector)<0:
                    proposal=best[:];proposal[i]=replacement
                    if ctx.validate(proposal)['valid']:best,best_vector,improved=proposal,v,True;changes+=1;break
            if improved or time.monotonic()>=until or cancelled():break
        if not improved:
            for i,a in enumerate(best):
                if ctx.fixed.get(a['key']):continue
                for j in range(i+1,len(best)):
                    if time.monotonic()>=until or cancelled():break
                    b=best[j]
                    if ctx.fixed.get(b['key']) or a['teacherId']==b['teacherId'] or b['teacherId'] not in ids[a['key']] or a['teacherId'] not in ids[b['key']]:continue
                    if conflict(a,b['teacherId'],i,j) or conflict(b,a['teacherId'],i,j):continue
                    aa,bb={**a,'teacherId':b['teacherId']},{**b,'teacherId':a['teacherId']};v=evaluation.trial([(a,aa),(b,bb)])
                    if compare(v,best_vector)<0:
                        proposal=best[:];proposal[i],proposal[j]=aa,bb
                        if ctx.validate(proposal)['valid']:best,best_vector,improved=proposal,v,True;changes+=1;break
                if improved or time.monotonic()>=until or cancelled():break
        if improved:occupied=occupancy();evaluation=IncrementalObjective(best,ctx);best_vector=evaluation.vector()
    check=ctx.validate(best);require(check['valid'],'최적화 결과 검증 실패: '+'; '.join(check['errors'][:4]))
    return dict(assignments=best,score=score(best,ctx),vector=best_vector,changes=changes)

def solve(ctx,seed=2026,ms=145000,cancelled=lambda:False):
    begin=time.monotonic();deadline=begin+min(ms or 145000,145000)/1000
    if not ctx.jobs:return dict(ok=True,assignments=[],score=0,elapsed=0)
    require(len(ctx.jobs)<=1500,'감독 자리 1,500개를 초과합니다.');candidates={j['key']:[t for t in ctx.teachers if not ctx.eligible(t,j)] for j in ctx.jobs};best=None;last=None
    for i in range(12):
        if time.monotonic()>=deadline or cancelled():break
        r=make_attempt(ctx.jobs,ctx,int(seed or 1009)+i*9973,candidates)
        if not r['ok']:last=r;continue
        check=ctx.validate(r['assignments'])
        if not check['valid']:last=dict(reason='; '.join(check['errors'][:6]));continue
        v=objective_vector(r['assignments'],ctx)
        if best is None or compare(v,best['vector'])<0:best=dict(assignments=r['assignments'],vector=v,score=score(r['assignments'],ctx))
    if cancelled():return dict(ok=False,cancelled=True,detail={'reason':'계산을 취소했습니다.'})
    if best is None:return dict(ok=False,detail=last or {'reason':'제약으로 인한 배정 실패 또는 실행 시간 초과'},elapsed=round((time.monotonic()-begin)*1000))
    improved=optimize_local(best['assignments'],ctx,min(deadline,time.monotonic()+10),cancelled)
    if compare(improved['vector'],best['vector'])<0:best=improved
    return dict(ok=True,assignments=best['assignments'],score=best['score'],elapsed=round((time.monotonic()-begin)*1000),validated=ctx.validate(best['assignments']))

def self_tests():
    """Small, production-safe diagnostics; exhaustive parity tests live in tests/."""
    teachers=[dict(id=str(i),name='진단'+str(i),subjects=['역사'],crossSubjects=[],homeroom='',roleEligibility=dict(MAIN=True,ASSIST=True,STUDY=True)) for i in range(4)]
    row=dict(day=1,date='2026-11-23',period=1,grade=1,classNo=1,classId='1-1',type='EXAM',subject='국어',start='',end='')
    c=Context(dict(teachers=teachers,schedule=[row],settings=default_state()['settings'],unavailable=[],teaching=dict(enabled=True,known=[t['id'] for t in teachers],rows=[])))
    j=c.jobs[0];t=c.teachers[0];arr=[{**job,'teacherId':str(i),'fixed':False} for i,job in enumerate(c.jobs)];tests=[]
    def check(name,fn):
        try:require(fn(),'진단 불일치');tests.append(dict(name=name,status='통과'))
        except Exception as exc:tests.append(dict(name=name,status='실패',detail=str(exc)))
    check('필수 정·부감독 생성',lambda:len(c.jobs)==2)
    check('완전 배정 검증',lambda:c.validate(arr)['valid'])
    check('누락 배정 차단',lambda:not c.validate(arr[:1])['valid'])
    check('동시간 중복 차단',lambda:not c.validate([{**a,'teacherId':'0'} for a in arr])['valid'])
    check('담당 교과 제한',lambda:'동일교과' in c.eligible({**t,'subjects':['국어']},j))
    check('상치교과 제한',lambda:'상치교과' in c.eligible({**t,'crossSubjects':['국어']},j))
    check('담임 제한',lambda:'담임학급' in c.eligible({**t,'homeroom':'1-1'},j))
    check('역할 제한',lambda:'정감독불가(X)' in c.eligible({**t,'roleEligibility':dict(MAIN=False)},j))
    check('실제 시각 중복',lambda:conflict_time({**j,'start':'09:00','end':'10:00'},{**j,'period':2,'start':'09:30','end':'10:30'}))
    check('점심 단절',lambda:run_summary({1,2,3,4},2)['four']==0)
    check('증분 평가 동등성',lambda:all(abs(a-b)<1e-8 for a,b in zip(IncrementalObjective(arr,c).vector(),objective_vector(arr,c))))
    check('시드 재현성',lambda:seeded(2026)()==seeded(2026)())
    return dict(tests=tests,passed=sum(t['status']=='통과' for t in tests),failed=sum(t['status']=='실패' for t in tests),note='합성 자료 진단이며 실제 Google Sheets 및 운영 배포 검증을 대체하지 않습니다.')

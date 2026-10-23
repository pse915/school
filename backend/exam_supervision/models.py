"""Original worksheet schemas and non-mutating compatibility readers."""
import copy
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path
from .engine import Context,clean,norm,integer,class_id,subjects,require,valid_date,weekday,default_state,validate_schedule,grade_plan
SCHEMA=json.loads(Path(__file__).with_name('schema.json').read_text(encoding='utf8'));HEADERS=SCHEMA['HEADERS'];SH=SCHEMA['SH'];HEADERS['관리자ID']=['이름','이메일']
ALIASES={'번호':['번호','교사ID','ID','식별번호'],'이름':['이름','교사명','성명'],'과목':['과목','담당교과','교과'],'담임학급':['담임학급','담임','담임반'],'상치교과':['상치교과','상치교과목'],'학년':['학년'],'반':['반'],'정감독':['정감독'],'부감독':['부감독'],'자습감독':['자습감독']}
def cell(row,n):return row[n] if 0<=n<len(row) else ''
def nonempty(row):return any(clean(v) for v in row)
def column_map(header):
    by={norm(h):i for i,h in enumerate(header)}
    return {k:next((by[norm(a)] for a in aliases if norm(a) in by),-1) for k,aliases in ALIASES.items()}
def date_text(value):
    text=clean(value);m=re.fullmatch(r'(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*[.일]?',text)
    if m:return f'{int(m[1]):04d}-{int(m[2]):02d}-{int(m[3]):02d}'
    m=re.fullmatch(r'(\d{1,2})/(\d{1,2})/(\d{4})',text)
    return f'{int(m[3]):04d}-{int(m[1]):02d}-{int(m[2]):02d}' if m else text[:10]
def clock_text(value):
    text=clean(value);m=re.fullmatch(r'(오전|오후|AM|PM)?\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?',text,re.I)
    if not m:return text
    hour=int(m[2]);meridian=(m[1] or m[4] or '').upper()
    if meridian in ('오후','PM') and hour<12:hour+=12
    if meridian in ('오전','AM') and hour==12:hour=0
    return f'{hour:02d}:{m[3]}'
def normalize_rows(rows):
    out=[]
    for row in rows:
        r=[str(v).upper() if type(v) is bool else str(int(v)) if type(v) in (int,float) and float(v).is_integer() else str(v) if v is not None else '' for v in row]
        while r and not r[-1]:r.pop()
        out.append(r)
    while out and not out[-1]:out.pop()
    return out
def result_fingerprint(rows):return hashlib.sha256(json.dumps(normalize_rows(rows),ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def check_headers(tables):
    errors=[]
    for name,head in HEADERS.items():
        rows=tables.get(name,[])
        if not rows:continue
        if name in (SH['roster'],SH['classes']):
            cols=column_map(rows[0]);errors.extend(name+': '+field+' 열 누락' for field in head if cols.get(field,-1)<0)
        elif name==SH['rules'] and rows[0][:7]==['교사명','규칙','날짜','요일','교시','수업학급','사유'] and cell(rows[0],7) in ('','종료일'):continue
        elif rows[0][:len(head)]!=head:errors.append(name+': 열 제목 불일치')
    return errors

def read_state(tables):
    pairs={clean(cell(r,0)):cell(r,1) for r in tables.get(SH['settings'],[])[1:] if clean(cell(r,0))};base=default_state()
    if pairs.get('state') not in ('',None):
        try:parsed=json.loads(pairs['state'])
        except (ValueError,TypeError) as exc:raise ValueError('감독설정 state JSON이 손상되었습니다. 자동 초기화하지 않았습니다.') from exc
        require(isinstance(parsed,dict),'state 형식 오류');require(type(parsed.get('revision',0)) is int and parsed.get('revision',0)>=0,'revision 오류');base.update(parsed);require(isinstance(base['settings'],dict),'settings 형식 오류')
    return base

def read_roster(tables):
    rows=tables.get(SH['roster'],[])
    if not rows:return dict(teachers=[],errors=['배정인원 시트가 없습니다.'],columns={})
    cols=column_map(rows[0]);errors=[];teachers=[];seen=set()
    for field in HEADERS[SH['roster']]:
        if cols[field]<0:errors.append('배정인원: '+field+' 열 누락')
    for i,row in enumerate(rows[1:],2):
        if not nonempty(row):continue
        get=lambda k:clean(cell(row,cols[k]));tid=get('번호');name=get('이름');subs=subjects(get('과목'));cross=subjects(get('상치교과'));home=class_id(get('담임학급'))
        if not tid or not name or not subs:errors.append(str(i)+'행의 번호·이름·과목 누락')
        if tid in seen:errors.append('교사 번호 중복: '+tid)
        seen.add(tid)
        if get('담임학급') and not home:errors.append(str(i)+'행 담임학급 형식 오류')
        roles={}
        for role,field in [('MAIN','정감독'),('ASSIST','부감독'),('STUDY','자습감독')]:
            flag=norm(get(field)).upper();roles[role]=flag=='O'
            if cols[field]>=0 and flag not in ('O','X'):errors.append(str(i)+'행 '+field+'은 O 또는 X여야 합니다.')
        teachers.append(dict(id=tid,name=name,subjects=subs,crossSubjects=cross,homeroom=home,roleEligibility=roles,rosterRow=i))
    return dict(teachers=teachers,errors=errors,columns={k:v+1 for k,v in cols.items() if k in HEADERS[SH['roster']]})

def grade_class(grade,clazz,raw='',location='학급'):
    """Read numeric columns or an explicit grade-class pair without sheet writes."""
    def pair(value):
        text=clean(value)
        m=re.fullmatch(r'(\d+)\s*[-–_/]\s*(\d+)',text)
        return tuple(map(int,m.groups())) if m else None
    gp,cp,rp=pair(grade),pair(clazz),pair(class_id(raw))
    pairs=[v for v in (gp,cp,rp) if v]
    require(not clean(raw) or rp is not None,location+' 학급 형식 오류: '+clean(raw))
    if pairs:
        g,c=pairs[0]
        require(all(v==(g,c) for v in pairs),location+' 학년·반·학급값 불일치')
        if clean(grade) and not gp:require(integer(grade,location+' 학년')==g,location+' 학년·학급값 불일치')
        if clean(clazz) and not cp:require(integer(clazz,location+' 반')==c,location+' 반·학급값 불일치')
    else:g,c=integer(grade,location+' 학년'),integer(clazz,location+' 반')
    require(g>0 and c>0,location+' 학년·반 오류')
    return g,c

def read_classes(tables):
    rows=tables.get(SH['classes'],[])
    if not rows:return []
    cols=column_map(rows[0]);require(cols['학년']>=0 and cols['반']>=0,'학년·반 열 누락');out=[];seen=set()
    for rowno,row in enumerate(rows[1:],2):
        g,c=cell(row,cols['학년']),cell(row,cols['반'])
        if not clean(g) and not clean(c):continue
        g,c=grade_class(g,c,location=f"{SH['classes']} {rowno}행");cid=f'{g}-{c}';require(cid not in seen,'중복 학급: '+cid);seen.add(cid);out.append(dict(grade=g,classNo=c,id=cid))
    return sorted(out,key=lambda r:(r['grade'],r['classNo']))

def read_schedule(tables):
    out=[]
    for rowno,row in enumerate(tables.get(SH['schedule'],[])[1:],2):
        if not clean(cell(row,0)):continue
        location=f"{SH['schedule']} {rowno}행";g,c=grade_class(cell(row,3),cell(row,4),cell(row,5),location);cid=f'{g}-{c}'
        out.append(dict(day=integer(cell(row,0),location+' 일차'),date=date_text(cell(row,1)),period=integer(cell(row,2),location+' 교시'),grade=g,classNo=c,classId=cid,type=clean(cell(row,6)),subject=clean(cell(row,7)),start=clock_text(cell(row,8)),end=clock_text(cell(row,9))))
    return out

def read_draft(tables,schedule):
    by={(r['date'],r['period'],r['classId']):r for r in schedule};out=[]
    for r in tables.get(SH['draft'],[])[1:]:
        if not clean(cell(r,0)):continue
        d,p,cid,role=date_text(cell(r,1)),integer(cell(r,2)),class_id(cell(r,3)) or clean(cell(r,3)),clean(cell(r,6));slot=by.get((d,p,cid),{})
        out.append(dict(key=f'{d}|{p}|{cid}|{role}',day=integer(cell(r,0)),date=d,period=p,classId=cid,type=clean(cell(r,4)),subject=clean(cell(r,5)),role=role,teacherId=clean(cell(r,7)),fixed=clean(cell(r,8)).upper()=='TRUE',start=slot.get('start',''),end=slot.get('end','')))
    return out

def read_results(tables,teachers,schedule,old):
    previous={a['key']:a for a in old};by={(r['date'],r['period'],r['classId']):r for r in schedule};out=[]
    for row in tables.get(SH['result'],[])[1:]:
        if not clean(cell(row,2)):continue
        d,p,cid=date_text(cell(row,2)),integer(cell(row,3)),class_id(cell(row,6));slot=by.get((d,p,cid),{})
        base=dict(day=integer(cell(row,1)),date=d,period=p,classId=cid,type='EXAM' if cell(row,7)=='시험' else 'STUDY',subject=clean(cell(row,8)),start=slot.get('start',''),end=slot.get('end',''))
        def add(role,name):
            text=clean(name)
            if not text:return
            matches=[t for t in teachers if t['name']==text or t['id']==text];key=f'{d}|{p}|{cid}|{role}'
            out.append({**previous.get(key,{}),**base,'key':key,'role':role,'teacherId':matches[0]['id'] if len(matches)==1 else text,'fixed':bool(previous.get(key,{}).get('fixed'))})
        add('MAIN',cell(row,9));add('ASSIST',cell(row,10))
        for i,name in enumerate(x for x in re.split('[,，]',clean(cell(row,11))) if x.strip()):add('STUDY'+str(i+1),name)
    return out

def read_availability(tables,teachers,classes):
    by=defaultdict(list)
    for t in teachers:by[norm(t['name'])].append(t)
    unknown={k:set() for k in ('teaching','visiting','rules')}
    def resolve(name,source):
        found=by[norm(name)];require(len(found)<=1,'동명이인 자동 매핑 불가: '+name)
        if not found:unknown[source].add(name);return ''
        return found[0]['id']
    def wd(value):
        x=clean(value).removesuffix('요일');require(not x or x in list('월화수목금토일'),'요일 형식 오류: '+x);return x
    canonical,alias=tables.get(SH['teaching'],[]),tables.get('수업시간표',[]);has=lambda rows:any(nonempty(r) for r in rows[1:]);use_alias=not has(canonical) and has(alias);raw=alias if use_alias else canonical
    teaching=dict(rows=[],unknown=[],errors=[],known=[],exemptions=[],enabled=has(raw),total=sum(nonempty(r) for r in raw[1:]),source='수업시간표' if use_alias else SH['teaching'],ignoredAlias=not use_alias and has(alias))
    if has(raw):require(raw[0][:6]==HEADERS[SH['teaching']],'교사시간표 열 제목 오류')
    known=set();exemptions=set()
    for i,row in enumerate(raw[1:],2):
        if not nonempty(row):continue
        try:
            name,w,p,subject,cid=(clean(cell(row,n)) for n in range(5));require(name,'교사명 누락');tid=resolve(name,'teaching')
            if w=='수업없음':
                require(not p and not subject and not cid,'수업없음 행의 나머지 칸을 비우세요.')
                if tid:known.add(tid);exemptions.add(tid)
                continue
            w,p=wd(w),integer(p);require(w and 1<=p<=10,'요일·교시 오류');require(subject or cid,'과목·학급이 모두 비어 있습니다.');parsed=class_id(cid)
            if cid and not parsed:teaching['errors'].append(f'교사시간표 {i}행 학급 형식 확인 필요 ({cid})')
            if tid:known.add(tid);teaching['rows'].append(dict(teacherId=tid,teacherName=name,weekday=w,period=p,classId=parsed,subject=subject,subjectGroup=clean(cell(row,5)),row=i))
        except ValueError as exc:teaching['errors'].append(f'교사시간표 {i}행: {exc}')
    for tid in exemptions:
        if any(r['teacherId']==tid for r in teaching['rows']):teaching['errors'].append('수업없음과 실제 수업이 동시에 존재: '+tid)
    teaching.update(known=sorted(known),exemptions=sorted(exemptions),unknown=sorted(unknown['teaching']));visiting=[];rules=[];ve=[];re_errors=[];class_ids={c['id'] for c in classes}
    for source,name in [('visiting',SH['visiting']),('rules',SH['rules'])]:
        for i,row in enumerate(tables.get(name,[])[1:],2):
            if not nonempty(row):continue
            try:
                teacher,mode,d=clean(cell(row,0)),clean(cell(row,1)),date_text(cell(row,2));w,p=wd(cell(row,3)),integer(cell(row,4) or 0)
                require(teacher and 0<=p<=10,'교사명·교시 오류');require(d or w,'날짜 또는 요일이 필요합니다.');require(not d or valid_date(d),'날짜 형식 오류');tid=resolve(teacher,source)
                if source=='visiting':
                    loc=clean(cell(row,5));require(mode in ('타교출강','본교방문') and loc in ('본교','타교'),'겸임 구분·장소 오류');require(not(d and w) or weekday(d)==w,'날짜·요일 불일치')
                    if tid:visiting.append(dict(teacherId=tid,teacherName=teacher,type=mode,date=d,weekday=w,period=p,location=loc,note=clean(cell(row,6)),row=i))
                else:
                    end=date_text(cell(row,7));rawclass=clean(cell(row,5));cid=class_id(rawclass);reason=clean(cell(row,6))
                    require(mode in ('제외','포함'),'제외 또는 포함을 선택하세요.');require(not end or d and valid_date(end) and end>=d,'종료일 오류');require(not(d and not end and w) or weekday(d)==w,'시작일·요일 불일치');require(not rawclass or cid in class_ids,'미등록 수업학급');require(len(reason)>=2,'사유는 2자 이상입니다.')
                    if mode=='포함':require(d and p>0 and len(reason)>=4,'포함 규칙은 날짜·교시와 4자 이상 사유가 필요합니다.')
                    else:require(not cid,'제외 규칙에는 수업학급을 지정하지 마세요.')
                    if tid:rules.append(dict(teacherId=tid,teacherName=teacher,mode=mode,date=d,startDate=d,endDate=end,weekday=w,period=p,classId=cid,reason=reason,row=i))
            except ValueError as exc:(ve if source=='visiting' else re_errors).append(f'{name} {i}행: {exc}')
    return dict(teaching=teaching,visiting=dict(rows=visiting,errors=ve,unknown=sorted(unknown['visiting'])),rules=dict(rows=rules,errors=re_errors,unknown=sorted(unknown['rules'])))

def model(tables,strict=False,prefer_draft=False):
    state=read_state(tables);roster=read_roster(tables);classes=read_classes(tables);schedule=read_schedule(tables);available=read_availability(tables,roster['teachers'],classes)
    unavailable=[dict(teacherId=clean(cell(r,0)),date=date_text(cell(r,1)),period=integer(cell(r,2)),reason=clean(cell(r,3))) for r in tables.get(SH['unavailable'],[])[1:] if clean(cell(r,0))]
    if strict:
        require(not roster['errors'],'교사 명단 오류: '+'; '.join(roster['errors']));validate_schedule(schedule,classes);require(available['teaching']['enabled'],'교사시간표/수업시간표에 수업을 입력하거나 교사명·수업없음 행으로 확인하세요.')
        for k in ('teaching','visiting','rules'):
            require(not available[k]['errors'],k+': '+'; '.join(available[k]['errors'][:5]))
            if k!='teaching':require(not available[k]['unknown'],'명단에 없는 교사: '+', '.join(available[k]['unknown']))
    ctx=Context(dict(teachers=roster['teachers'],schedule=schedule,settings=state['settings'],unavailable=unavailable,teaching=available['teaching'],visiting=available['visiting']['rows'],teachingRules=available['rules']['rows']))
    draft=read_draft(tables,schedule);source='draft';results=tables.get(SH['result'],[]);marker=state.get('_streamlit_result_fingerprint')
    if not prefer_draft and (marker and marker!=result_fingerprint(results) or not draft and any(nonempty(r) for r in results[1:])):draft=read_results(tables,roster['teachers'],schedule,draft);source='result'
    return dict(state=state,roster=roster,classes=classes,schedule=schedule,draft=draft,draftSource=source,available=available,unavailable=unavailable,ctx=ctx,gradePlan=state.get('gradePlan') or grade_plan(schedule,classes))

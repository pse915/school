"""Authenticated, session-local exam workflows and atomic result publication."""
import copy
import hashlib
import json
import re
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone,timedelta
from . import engine as E
from .models import HEADERS,SH,model,read_state,read_roster,read_schedule,read_draft,cell,nonempty,column_map,result_fingerprint
from .repository import Repository,PROTOCOL,fingerprint
TAB='시험감독 관리';POOL=ThreadPoolExecutor(max_workers=2,thread_name_prefix='exam-allocation')
READ_ACTIONS={'bootstrap','getStatus','getConfirmed','getTeacher','getAdminData','getTeachingData','availabilityReport','optimizationReport','fairness','history','diagnose','listVersions','getVersionLibrary','getVersionPreview'}
def now():return datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%dT%H:%M:%S')
def dump(value):return json.dumps(value,ensure_ascii=False,separators=(',',':'))

class Service:
    def __init__(self,app):
        self.app=app;self.repo=Repository(app);self.owner=self.identity();self.last=None;self.job=None;self.notice=''
    def identity(self):return tuple(self.app.port.session_state.get(k) for k in ('user_id','user_name','user_role'))
    @property
    def admin(self):return bool(self.app.program.call('can_manage_ids'))
    def authorize(self,action):
        s=self.app.port.session_state
        if self.owner!=self.identity():self.close();raise PermissionError('다른 사용자의 시험감독 세션입니다.')
        if not s.get('logged_in') or s.get('user_role')=='게스트':raise PermissionError('로그인이 필요합니다.')
        if TAB not in self.app.program.call('get_user_allowed_tabs'):raise PermissionError('시험감독 메뉴 권한이 없습니다.')
        if not self.admin:
            cfg=self.repo.configuration if self.repo.configuration is not None else self.repo.load_config()
            if not cfg.get('teacherView'):raise PermissionError('교사 감독 조회가 허용되지 않았습니다.')
            if action not in ('bootstrap','getTeacher') and not(cfg.get('teacherAll') and action=='getConfirmed'):raise PermissionError('관리자 전용 기능입니다.')
    def close(self):
        if self.job:self.job['cancel'].set();self.job['future'].cancel()
        self.job=None;self.last=None;self.repo.book=None;self.repo.tables={}
    def ensure_connected(self):
        if self.repo.configuration is None:self.repo.load_config()
        if self.repo.book is None and self.repo.configuration.get('spreadsheetId'):self.repo.connect(self.repo.configuration['spreadsheetId'])
        E.require(self.repo.book is not None,'연결·권한 설정에서 시험감독 Google Sheets 주소를 등록하세요.')
    def connect(self,url,persist=False,teacher_view=False,teacher_all=False):
        self.authorize('connect')
        if self.repo.configuration is None:self.repo.load_config()
        previous=(self.repo.book,self.repo.tables,self.repo.baseline)
        try:
            status=self.repo.connect(url)
            if persist:self.repo.save_config(dict(spreadsheetId=status['id'],teacherView=teacher_view is True,teacherAll=teacher_all is True,updatedAt=now(),updatedBy=self.identity()[0]))
            return status
        except Exception:self.repo.book,self.repo.tables,self.repo.baseline=previous;raise
    def reload(self):
        self.authorize('bootstrap');self.ensure_connected();self.repo.reload();self.last=None;return self.handle('bootstrap',{})
    def token_payload(self):return dict(revision=read_state(self.repo.tables)['revision'],dataToken=self.repo.baseline)
    def _check_revision(self,payload):
        s=read_state(self.repo.tables);E.require(payload.get('revision')==s['revision'] and payload.get('dataToken')==self.repo.baseline,'오래된 화면의 요청입니다. 입력을 보존한 뒤 최신 자료를 확인하세요.')
    def _settings_rows(self,state,tables=None):
        rows=copy.deepcopy((tables if tables is not None else self.repo.tables).get(SH['settings'],[HEADERS[SH['settings']]]))
        for r in rows[1:]:
            if r and r[0]=='state':r[:2]=['state',dump(state)];break
        else:rows.append(['state',dump(state)])
        return rows
    def handoff(self,writer,exclusive=False):
        self.authorize('handoff');self.ensure_connected();E.require(writer in ('GAS','STREAMLIT'),'저장 주체 오류');status=self.repo.status()
        E.require(status['protocol']==PROTOCOL or exclusive is True,'제공한 Code.gs의 installIntegrationProtocol을 먼저 실행하세요. Apps Script를 사용하지 않는 시트는 단독 사용을 선택할 수 있습니다.')
        pairs={r[0]:r[1] for r in self.repo.tables.get(SH['settings'],[])[1:] if len(r)>1};pairs['_integration_protocol']=PROTOCOL
        if status['protocol']!=PROTOCOL and exclusive is True:pairs['_integration_writer']=writer
        elif status['writer']==writer:return status
        elif status['writer']=='STREAMLIT':pairs['_integration_writer']=writer
        elif status['writer']=='PAUSED':
            remaining=float(status['pauseUntil'] or 0)-time.time();E.require(remaining<=0,f'Apps Script 처리 종료 대기 중입니다. {max(1,int(remaining))}초 뒤 전환 적용을 다시 누르세요.');pairs['_integration_writer']=writer
        else:pairs.update(_integration_writer='PAUSED',_integration_pause_until=str(time.time()+390),_integration_next_writer=writer)
        tables={**self.repo.tables,SH['settings']:[HEADERS[SH['settings']]]+[[k,v] for k,v in pairs.items()]};s=read_state(self.repo.tables);s['revision']+=1;s['updatedAt']=now()
        self.repo.commit({SH['settings']:self._settings_rows(s,tables)},allow_handoff=True);return self.repo.status()
    @staticmethod
    def draft_rows(arr):return [HEADERS[SH['draft']]]+[[a[k] for k in ('day','date','period','classId','type','subject','role','teacherId')]+[bool(a.get('fixed')),now()] for a in arr]
    def initialize(self):
        self.authorize('initialize');self.repo.writable();self.ensure_connected();status=self.repo.status();E.require(status['protocol']==PROTOCOL and status['writer']=='STREAMLIT','필수 시트 준비 전 저장 주체를 Streamlit으로 전환하세요.');self.repo.initialize();tables=self.repo.tables;s=read_state(tables);changes={}
        if not s.get('editableMigration') and self.repo.status()['writer']=='STREAMLIT' and self.repo.status()['protocol']==PROTOCOL:
            if not any(nonempty(r) for r in tables.get(SH['draft'],[])[1:]) and s.get('activeVersion'):
                snap=self.version_preview(s['activeVersion'],raw=True)
                if not read_schedule(tables) and snap.get('schedule'):changes[SH['schedule']]=[HEADERS[SH['schedule']]]+[[r.get(k,'') for k in ('day','date','period','grade','classNo','classId','type','subject','start','end')] for r in snap['schedule']]
                if not read_roster(tables)['teachers'] and snap.get('teachers'):changes[SH['roster']]=[HEADERS[SH['roster']]]+[[t['id'],t['name'],', '.join(t.get('subjects',[])),t.get('homeroom',''),', '.join(t.get('crossSubjects',[]))]+['X' if t.get('roleEligibility',{}).get(role) is False else 'O' for role in E.ROLES] for t in snap['teachers']]
                if snap.get('assignments'):changes[SH['draft']]=self.draft_rows(snap['assignments'])
            s.update(editableMigration=1,legacyVersion=s.get('activeVersion',''),activeVersion='',editingBaseVersion='',state='EDITABLE');changes[SH['settings']]=self._settings_rows(s);self.repo.commit(changes)
        return self.repo.status()
    def _materialize(self,m):
        ctx,arr=m['ctx'],m['draft'];by={}
        for a in arr:by.setdefault((a['date'],a['period'],a['classId']),[]).append(a)
        names={t['id']:t['name'] for t in ctx.teachers};schedule=list(m['schedule']);keys={(r['date'],r['period'],r['classId']) for r in schedule}
        for a in arr:
            k=(a['date'],a['period'],a['classId'])
            if k not in keys:
                parts=a['classId'].split('-');schedule.append({**a,'grade':int(parts[0]),'classNo':int(parts[1])});keys.add(k)
        rows=[]
        for r in schedule:
            assigned=by.get((r['date'],r['period'],r['classId']),[]);get=lambda role:', '.join(names.get(a['teacherId'],a['teacherId']) for a in assigned if a['role']==role)
            study=', '.join(names.get(a['teacherId'],a['teacherId']) for a in assigned if a['role'].startswith('STUDY'))
            rows.append(['',r['day'],r['date'],r['period'],r['grade'],r['classNo'],r['classId'],'시험' if r['type']=='EXAM' else '자습',r['subject'],get('MAIN'),get('ASSIST'),study,'저장됨',now(),''])
        stats=E.build_stats(arr,ctx);classes=sorted({r['classId'] for r in m['schedule']});index={(r['date'],r['period'],r['classId']):r for r in m['schedule']};printing=[]
        for d in sorted({r['date'] for r in m['schedule']}):
            printing.extend([[d+' 감독 배정']+['']*max(1,len(classes)),['교시']+classes])
            for p in sorted({r['period'] for r in m['schedule'] if r['date']==d}):
                row=[str(p)+'교시']
                for cid in classes:
                    slot=index.get((d,p,cid));row.append(('자습' if slot['type']=='STUDY' else slot['subject'])+' / '+' · '.join(('정' if a['role']=='MAIN' else '부' if a['role']=='ASSIST' else '자습')+' '+names.get(a['teacherId'],a['teacherId']) for a in by.get((d,p,cid),[])) if slot else '')
                printing.append(row)
            printing.append(['']*(len(classes)+1))
        return {SH['result']:[HEADERS[SH['result']]]+rows,SH['stats']:[HEADERS[SH['stats']]]+[[t['id'],t['name'],t['main'],t['assist'],t['study'],t['total'],t['delta'],dump(t['days'])] for t in stats],SH['print']:[HEADERS[SH['print']]]+printing}
    def _save(self,changes,state,action,reason='',before=None,after=None):
        state=copy.deepcopy(state);state.update(state='EDITABLE',activeVersion='',editingBaseVersion='',updatedAt=now(),revision=state['revision']+1)
        tables={**self.repo.tables,**changes};tables[SH['settings']]=self._settings_rows(state,tables);m=model(tables,prefer_draft=SH['draft'] in changes)
        if m['draftSource']=='result' and SH['draft'] not in changes:changes={**changes,SH['draft']:self.draft_rows(m['draft'])}
        changes={**changes,**self._materialize(m)};state['_streamlit_result_fingerprint']=result_fingerprint(changes[SH['result']]);state['resultFingerprint']=fingerprint(changes[SH['result']]);changes[SH['settings']]=self._settings_rows(state,tables)
        old={a['key']:a['teacherId'] for a in (before or [])};diff=[a for a in (after or []) if old.get(a['key'])!=a['teacherId']];audit=copy.deepcopy(self.repo.tables.get(SH['history'],[HEADERS[SH['history']]]));change_id=str(uuid.uuid4())
        audit.extend([[change_id,now(),str(self.identity()[0]),action,'','',a.get('key','전체 시간표'),old.get(a.get('key'),''),a.get('teacherId',''),reason or action] for a in (diff or [{}])]);changes[SH['history']]=audit
        self.repo.commit(changes);self.last=None;return dict(ok=True,revision=state['revision'],dataToken=self.repo.baseline)
    def confirmed(self,m=None):
        m=m or model(self.repo.tables)
        return dict(status='EDITABLE',version='',confirmedAt='',modifiedAt=m['state'].get('updatedAt',''),schedule=m['schedule'],studyCount=m['state']['settings'].get('studyCount',1),assignments=m['draft'],teachers=[dict(id=t['id'],name=t['name']) for t in m['ctx'].teachers],stats=E.build_stats(m['draft'],m['ctx']))
    def admin_data(self,m):
        try:strict=model(self.repo.tables,True);validation=strict['ctx'].validate(m['draft'])
        except ValueError as exc:validation=dict(valid=False,errors=[str(exc)])
        return dict(**self.token_payload(),state='EDITABLE',roster=m['roster'],classes=m['classes'],settings=m['state']['settings'],schedule=m['schedule'],gradePlan=m['gradePlan'],unavailable=m['unavailable'],draft=m['draft'],validation=validation,stats=E.build_stats(m['draft'],m['ctx']))
    def availability(self,m):
        ctx=m['ctx'];t=ctx.teaching;slots=[];seen=set()
        for j in ctx.jobs:
            k=(j['date'],j['period'])
            if k in seen:continue
            seen.add(k);excluded=[];reasons={};possible=0
            for teacher in ctx.teachers:
                why=ctx.eligible(teacher,j)
                if not why:possible+=1;continue
                excluded.append(dict(id=teacher['id'],name=teacher['name'],reasons=why))
                for w in why:reasons[w]=reasons.get(w,0)+1
            slots.append(dict(date=j['date'],weekday=E.weekday(j['date']),period=j['period'],possible=possible,excluded=len(excluded),reasons=reasons,excludedTeachers=excluded))
        return dict(teachingRows=t.get('total',0),teachingSource=t.get('source',SH['teaching']),ignoredAlias=t.get('ignoredAlias',False),teachingMatched=len(t.get('known',[])),teacherCount=len(ctx.teachers),teachingRuleCount=len(ctx.data.get('teachingRules',[])),missingTimetableFallback=ctx.settings.get('missingTimetableFallback') is True,fallbackSlots=[v for v in ctx.fallback_plan().values() if v['shortage']>0] if ctx.settings.get('missingTimetableFallback') else [],missingTeachers=[x['name'] for x in ctx.teachers if t.get('enabled') and x['id'] not in ctx.known and not any(v['type']=='본교방문' for v in ctx.visits[x['id']])],unknownTeachers=t.get('unknown',[]),invalidRows=t.get('errors',[]),visitingRows=len(ctx.data.get('visiting',[])),slots=slots)
    def version_preview(self,version,raw=False):
        E.require(isinstance(version,str) and re.fullmatch(r'v\d+\.\d+',version),'버전 번호 오류');rows=[r for r in self.repo.tables.get(SH['versions'],[])[1:] if cell(r,0)==version];E.require(rows,'배정 버전 스냅샷이 없습니다: '+version);rows.sort(key=lambda r:E.integer(cell(r,5)))
        E.require(len(rows)==E.integer(cell(rows[0],6)),'스냅샷 청크 누락')
        for i,r in enumerate(rows,1):E.require(E.integer(cell(r,5))==i and E.integer(cell(r,6))==len(rows) and cell(r,8)==cell(rows[0],8),'스냅샷 청크·체크섬 불일치')
        text=''.join(str(cell(r,7)) for r in rows);E.require(hashlib.sha256(text.encode()).hexdigest()==cell(rows[0],8),'스냅샷 무결성 검증 실패');parsed=json.loads(text)
        if raw:return parsed
        return dict(version=version,status=cell(rows[0],1),confirmedAt=cell(rows[0],2),modifiedAt=cell(rows[0],2),**{k:parsed.get(k,[]) for k in ('schedule','teachers','assignments')})
    def fairness(self,m,tid):
        ctx,arr=m['ctx'],m['draft'];teacher=ctx.by_id.get(tid);E.require(teacher,'교사를 찾을 수 없습니다.');exclusions={k:0 for k in ('동일교과','상치교과','담임학급','배정불가')};possible=0
        for j in ctx.jobs:
            why=ctx.eligible(teacher,j)
            if not why:possible+=1
            for w in why:exclusions[w]=exclusions.get(w,0)+1
        transfer=None;vector=E.objective_vector(arr,ctx)
        for a in arr:
            if a['teacherId']!=tid or a.get('fixed'):continue
            for t in ctx.teachers:
                if t['id']==tid or ctx.eligible(t,a,[r for r in arr if r['key']!=a['key']]):continue
                after=[{**r,'teacherId':t['id']} if r['key']==a['key'] else r for r in arr]
                if ctx.validate(after)['valid'] and E.compare(E.objective_vector(after,ctx),vector)<0:transfer=dict(slot=a['key'],toId=t['id'],toName=t['name']);break
            if transfer:break
        report=E.optimization_report(arr,ctx)
        return dict(teacher={**next(s for s in E.build_stats(arr,ctx) if s['id']==tid),**next(s for s in report['teachers'] if s['id']==tid)},totalJobs=len(ctx.jobs),eligibleJobs=possible,exclusions=exclusions,transfer=transfer,explanation='제약별 제외 수치는 중복 집계될 수 있으며 감독 횟수 편차의 인과관계를 단독으로 증명하지 않습니다.')
    def _save_table(self,action,p,m):
        state=copy.deepcopy(m['state']);rows=p.get('rows',[]);E.require(isinstance(rows,list) and len(rows)<=10000,'표 형식·행 개수 오류');changes={}
        if action=='saveClasses':
            found=set();values=[]
            for r in rows:
                g,c=E.integer(r['grade']),E.integer(r['classNo']);E.require(1<=g<=12 and 1<=c<=100 and (g,c) not in found,'학년 1~12·반 1~100 또는 중복 오류');found.add((g,c));values.append([g,c])
            from .schedule_editor import class_deletion_dependencies
            missing_schedule, missing_homerooms = class_deletion_dependencies(
                m['classes'], [dict(grade=g, classNo=c) for g,c in found],
                m['schedule'], m['ctx'].teachers)
            E.require(not missing_schedule and not missing_homerooms,
                '기존 시험일정 또는 담임교사와 연결된 학급은 삭제할 수 없습니다. '+
                '시험일정: '+', '.join(missing_schedule)+' / 담임학급: '+', '.join(missing_homerooms))
            original=self.repo.tables[SH['classes']];cols=column_map(original[0]);out=copy.deepcopy(original)
            while len(out)<len(values)+1:out.append(['']*len(out[0]))
            for i in range(1,len(out)):
                while len(out[i])<len(out[0]):out[i].append('')
                out[i][cols['학년']],out[i][cols['반']]=values[i-1] if i<=len(values) else ('','')
            changes[SH['classes']]=out;state['gradePlan']=None
        elif action=='saveRoster':
            E.require(len(rows)<=500,'교사는 500명까지 저장할 수 있습니다.');original=self.repo.tables[SH['roster']];cols=column_map(original[0]);known={t['id']:t for t in m['ctx'].teachers};seen=set();existing=set();out=copy.deepcopy(original);deleted=p.get('deletedTeacherIds',[])
            E.require(isinstance(deleted,list) and len(deleted)==len(set(deleted)) and all(tid in known for tid in deleted),'삭제 교사 목록 오류')
            for r in rows:
                tid,name,subs,cross,home=(E.clean(r.get(k)) for k in ('id','name','subjectsText','crossSubjectsText','homeroom'));oldid=E.clean(r.get('originalId'))
                E.require(tid and len(tid)<=80 and name and len(name)<=100 and subs and len(subs)<=300 and len(cross)<=300,'교사 번호·이름·교과 오류');E.require(tid not in seen and tid not in deleted,'교사 번호 중복 또는 삭제 대상 포함');seen.add(tid);E.require(not home or E.class_id(home),'담임학급 형식 오류')
                if oldid:E.require(oldid==tid and tid in known,'기존 교사 번호를 변경할 수 없습니다.');existing.add(tid)
                else:E.require(tid not in known,'이미 등록된 교사 번호입니다: '+tid)
                values={'번호':tid,'이름':name,'과목':subs,'상치교과':cross,'담임학급':E.class_id(home)}
                for role,label in E.ROLES.items():
                    flag=E.norm(r.get(role)).upper();E.require(flag in ('O','X'),label+'은 O 또는 X입니다.');values[label]=flag
                dest=known[tid]['rosterRow']-1 if oldid else len(out)
                if dest==len(out):out.append(['']*len(original[0]))
                while len(out[dest])<len(original[0]):out[dest].append('')
                for field,value in values.items():E.require(cols[field]>=0,'필수 열 누락');out[dest][cols[field]]=value
            E.require(all(tid in existing or tid in deleted for tid in known),'누락 교사는 삭제 대상으로 명시하세요.')
            for tid in deleted:out[known[tid]['rosterRow']-1]=['']*len(original[0])
            changes[SH['roster']]=out
            if deleted:
                remaining={E.norm(r.get('name')) for r in rows};removed={E.norm(known[tid]['name']) for tid in deleted}-remaining
                changes[SH['unavailable']]=[HEADERS[SH['unavailable']]]+[r for r in self.repo.tables.get(SH['unavailable'],[])[1:] if E.clean(cell(r,0)) not in deleted]
                for key in ('visiting','rules'):changes[SH[key]]=[HEADERS[SH[key]]]+[r for r in self.repo.tables.get(SH[key],[])[1:] if E.norm(cell(r,0)) not in removed]
                for key in ('instructorIds','missingFallbackTeacherIds'):state['settings'][key]=[tid for tid in state['settings'].get(key,[]) if tid not in deleted]
            errors=read_roster({**self.repo.tables,**changes})['errors'];E.require(not errors,'명단 오류: '+'; '.join(errors));state.update(rosterVerified=False,rosterFingerprint='',draftConstraintFingerprint='',lastError='')
        elif action=='saveSchedule':
            by={c['id']:c for c in m['classes']};values=[]
            for r in rows:
                cid=E.clean(r.get('classId'));cl=by.get(cid);E.require(cl,'미등록 학급: '+cid)
                values.append(dict(day=E.integer(r.get('day')),date=E.clean(r.get('date')),period=E.integer(r.get('period')),grade=cl['grade'],classNo=cl['classNo'],classId=cid,type=r.get('type'),subject=E.clean(r.get('subject')),start=E.clean(r.get('start')),end=E.clean(r.get('end'))))
            E.validate_schedule(values,m['classes']);state['gradePlan']=E.grade_plan(values,m['classes'],p.get('gradePlan'));changes[SH['schedule']]=[HEADERS[SH['schedule']]]+[[r[k] for k in ('day','date','period','grade','classNo','classId','type','subject','start','end')] for r in values]
        elif action in ('saveUnavailable','saveVisiting','saveTeachingRules','saveTeaching'):
            key={'saveUnavailable':'unavailable','saveVisiting':'visiting','saveTeachingRules':'rules','saveTeaching':'teaching'}[action]
            fields={'unavailable':['teacherId','date','period','reason'],'visiting':['teacherName','type','date','weekday','period','location','note'],'rules':['teacherName','mode','startDate','weekday','period','classId','reason','endDate'],'teaching':['teacherName','weekday','period','subject','classId','subjectGroup']}[key];values=[[E.clean(r.get(k)) for k in fields] for r in rows]
            if key=='unavailable':
                seen=set()
                for r in values:
                    r[2]=E.integer(r[2]);ident=tuple(r[:3]);E.require(r[0] in m['ctx'].by_id and E.valid_date(r[1]) and 1<=r[2]<=5 and ident not in seen,'배정불가 형식 또는 중복 오류');seen.add(ident)
            if key=='rules':
                for i,r in enumerate(values):r[2]=E.clean(rows[i].get('startDate') or rows[i].get('date'));r[6]=r[6] or '규칙 설정'
            if key=='visiting':
                seen=set()
                for r in values:
                    ident=tuple(r[i] for i in (0,2,3,4));E.require(ident not in seen,'겸임교사 중복 시간');seen.add(ident);E.require(not r[4] or 1<=E.integer(r[4])<=10,'겸임교사 교시는 빈칸 또는 1~10입니다.')
            changes[SH[key]]=[HEADERS[SH[key]]]+values;prospective=model({**self.repo.tables,**changes})
            if key!='unavailable':
                available=prospective['available'][key];E.require(not available['errors'] and not available['unknown'],'시간표·근무·규칙 오류: '+'; '.join(available['errors']+available['unknown']))
            state['draftConstraintFingerprint']=''
        elif action=='saveInstructorFlags':
            ids=p.get('instructorIds');E.require(isinstance(ids,list) and len(ids)==len(set(ids)) and all(tid in m['ctx'].by_id for tid in ids),'강사 목록 오류');state['settings']['instructorIds']=sorted(ids);state.update(rosterVerified=False,rosterFingerprint='',draftConstraintFingerprint='')
        elif action=='saveSettings':
            settings=p.get('settings',{});study=E.integer(settings.get('studyCount'));maximum=E.integer(settings.get('maxPerTeacher',0));E.require(study in (0,1,2) and 0<=maximum<=100,'감독 인원·상한 오류');aliases={E.norm(k):E.norm(v) for k,v in settings.get('aliases',{}).items()};E.require(all(k and v for k,v in aliases.items()),'교과 동의어 오류')
            fallback=settings.get('missingTimetableFallback',state['settings'].get('missingTimetableFallback',False));ids=settings.get('missingFallbackTeacherIds',state['settings'].get('missingFallbackTeacherIds',[]));E.require(type(fallback) is bool and isinstance(ids,list) and all(type(tid) is str and tid in m['ctx'].by_id for tid in ids) and len(ids)==len(set(ids)) and (not fallback or ids),'시간표 미등록 교사 투입 설정 오류')
            state['settings']=dict(studyCount=study,maxPerTeacher=maximum,aliases=aliases,instructorIds=state['settings'].get('instructorIds',[]),missingTimetableFallback=fallback,missingFallbackTeacherIds=sorted(ids),optimization=E.optimization({'optimization':settings.get('optimization',state['settings'].get('optimization',{}))},True))
        else:raise ValueError('지원하지 않는 저장 작업: '+action)
        return self._save(changes,state,action,p.get('reason',''))
    def handle(self,action,p=None):
        p=p or {};self.authorize(action);self.ensure_connected()
        if action in ('listVersions','getVersionLibrary'):
            versions=[];seen=set()
            for r in reversed(self.repo.tables.get(SH['versions'],[])[1:]):
                ver=cell(r,0)
                if not ver or ver in seen:continue
                seen.add(ver);versions.append(dict(version=ver,status=cell(r,1),at=cell(r,2),by=cell(r,3),reason=cell(r,4)))
            return dict(versions=versions,previews={},preloaded=0,allLoaded=not versions)
        if action=='getVersionPreview':return self.version_preview(p.get('version'))
        if action=='selfTests':return E.self_tests()
        if action=='history':return [{k:cell(r,i) for i,k in enumerate(['id','at','actor','action','from','to','slot','before','after','reason'])} for r in self.repo.tables.get(SH['history'],[])[1:][::-1][:500] if E.clean(cell(r,0))]
        m=model(self.repo.tables,strict=action in ('generate','improve','saveAssignments','update','swap','roleSwap','optimizationReport','compareGradeBonus','fairness'))
        if action in ('bootstrap','getStatus'):
            if not self.admin:return self.handle('getConfirmed' if (self.repo.configuration or {}).get('teacherAll') else 'getTeacher',{'teacherId':p.get('teacherId')})
            return dict(connection=self.repo.status(),admin=True,confirmed=self.confirmed(m),adminData=self.admin_data(m))
        if action=='getConfirmed':return self.confirmed(m)
        if action=='getTeacher':
            tid=E.clean(p.get('teacherId'));teachers=m['ctx'].teachers
            if not self.admin and not(self.repo.configuration or {}).get('teacherAll'):
                own=[t for t in teachers if E.norm(t['name'])==E.norm(self.app.port.session_state.get('user_name'))];E.require(len(own)==1,'교사명이 없거나 동명이인입니다. 관리자에게 명단 구분을 요청하세요.');E.require(not tid or tid==own[0]['id'],'자신의 감독 일정만 조회할 수 있습니다.');tid=own[0]['id']
            teacher=next((t for t in teachers if t['id']==tid),None);E.require(teacher,'교사를 찾을 수 없습니다.');data=self.confirmed(m)
            return dict(teacher={'id':tid,'name':teacher['name']},assignments=[a for a in data['assignments'] if a['teacherId']==tid],stats=next((s for s in data['stats'] if s['id']==tid),{}),modifiedAt=data['modifiedAt'],version='',state='EDITABLE')
        if action=='getAdminData':return self.admin_data(m)
        if action=='getTeachingData':return dict(availabilityReport=self.availability(m),visiting=m['available']['visiting']['rows'],teachingRules=m['available']['rules']['rows'],visitingErrors=m['available']['visiting']['errors']+m['available']['visiting']['unknown'],teachingRuleErrors=m['available']['rules']['errors']+m['available']['rules']['unknown'])
        if action in ('availabilityReport','diagnose'):return self.availability(m)
        if action=='optimizationReport':return E.optimization_report(m['draft'],m['ctx'])
        if action=='fairness':return self.fairness(m,E.clean(p.get('teacherId')))
        if action=='compareGradeBonus':return self.compute(action,m,p)
        self._check_revision(p)
        if action.startswith('save') and action!='saveAssignments':return self._save_table(action,p,m)
        if action in ('generate','improve'):
            result=self.compute(action,m,p)
            if not result.get('ok',True) or action=='improve' and p.get('apply') is not True:return result
            return self.apply_assignments(result.get('assignments',result.get('proposal')),p,action)
        if action=='saveAssignments':return self.apply_assignments(p.get('assignments',[]),p,action)
        if action in ('update','swap','roleSwap'):
            arr=copy.deepcopy(m['draft']);by={a['key']:a for a in arr}
            if action=='update':
                a=by.get(E.clean(p.get('key')));tid=E.clean(p.get('teacherId'));E.require(a and tid in m['ctx'].by_id,'변경할 자리·교사를 찾을 수 없습니다.');a.update(teacherId=tid,fixed=True)
            else:
                a,b=by.get(p.get('key1')),by.get(p.get('key2'));E.require(a and b and a is not b,'교환할 두 자리를 선택하세요.')
                if action=='roleSwap':E.require(all(a[k]==b[k] for k in ('date','period','classId')) and a['role'] in ('MAIN','ASSIST') and b['role'] in ('MAIN','ASSIST'),'같은 학급의 정·부감독만 교환할 수 있습니다.')
                a['teacherId'],b['teacherId']=b['teacherId'],a['teacherId'];a['fixed']=b['fixed']=True
            return self.apply_assignments(arr,p,action,allow_partial=True)
        if action=='repair':return self._save({},m['state'],'repair','출력 시트 재생성')
        raise ValueError('알 수 없는 시험감독 요청: '+action)
    def compute(self,action,m,p,cancelled=lambda:False):
        ctx=m['ctx'];ctx.fixed={a['key']:a['teacherId'] for a in m['draft'] if a.get('fixed')}
        if action=='generate':return E.solve(ctx,E.integer(p.get('seed',2026)),E.integer(p.get('budgetMs',145000)),cancelled)
        if action=='improve':
            check=ctx.validate(m['draft']);E.require(check['valid'],'; '.join(check['errors'][:4]));r=E.optimize_local(m['draft'],ctx,time.monotonic()+20,cancelled)
            return dict(before=E.score(m['draft'],ctx),after=r['score'],changes=r['changes'],proposal=r['assignments'],comparison=dict(before=E.optimization_report(m['draft'],ctx)['metrics'],after=E.optimization_report(r['assignments'],ctx)['metrics']))
        opt=E.optimization(ctx.settings);zero=E.Context({**ctx.data,'settings':{**ctx.settings,'optimization':{**opt,'gradeStrength':0}}});on=E.Context({**ctx.data,'settings':{**ctx.settings,'optimization':opt}});seed=E.integer(p.get('seed',2026));r0=E.solve(zero,seed,3500,cancelled);r1=E.solve(on,seed,3500,cancelled)
        if not r0['ok'] or not r1['ok']:return dict(ok=False,zero=r0['ok'],current=r1['ok'],explanation='두 배정을 모두 완성하지 못했습니다. 절대 제약을 완화하지 않았습니다.')
        return dict(ok=True,seed=seed,gradeStrength=opt['gradeStrength'],applied=False,zero=E.optimization_report(r0['assignments'],zero)['metrics'],current=E.optimization_report(r1['assignments'],on)['metrics'],elapsedMs=dict(zero=r0['elapsed'],current=r1['elapsed']),note='같은 시드·예산의 1회 비교이며 설정 비율이 실제 확률 증가를 보장하지 않습니다.')
    def start_job(self,action,p):
        self.authorize(action);self.ensure_connected();self._check_revision(p);E.require(action in ('generate','improve','compareGradeBonus'),'계산 작업 오류');E.require(not self.job or self.job['future'].done(),'다른 계산이 진행 중입니다.')
        m=model(self.repo.tables,True);cancel=threading.Event();job=dict(action=action,payload=copy.deepcopy(p),baseline=self.repo.baseline,cancel=cancel,started=time.monotonic());job['future']=POOL.submit(self.compute,action,m,p,cancel.is_set);self.job=job;return dict(started=True)
    def job_status(self):
        self.authorize('getAdminData')
        if not self.job:return None
        future=self.job['future']
        if not future.done():return dict(running=True,elapsed=round(time.monotonic()-self.job['started']))
        if self.job['cancel'].is_set() or future.cancelled():return dict(running=False,cancelled=True)
        return dict(running=False,result=future.result(),action=self.job['action'])
    def apply_job(self):
        self.authorize('saveAssignments');E.require(self.job and self.job['future'].done() and not self.job['cancel'].is_set(),'저장할 계산 결과가 없습니다.');job=self.job;E.require(job['baseline']==self.repo.baseline,'계산 후 자료가 바뀌었습니다. 다시 계산하세요.');r=job['future'].result();E.require(r.get('ok',True),'완성되지 않은 배정은 저장할 수 없습니다.');E.require(job['action'] in ('generate','improve'),'비교 결과는 저장할 수 없습니다.')
        out=self.apply_assignments(r.get('assignments',r.get('proposal')),job['payload'],job['action']);self.job=None;return out
    def apply_assignments(self,arr,p,action,allow_partial=False):
        self.authorize('saveAssignments');self._check_revision(p);m=model(self.repo.tables,True);ctx=m['ctx'];E.require(isinstance(arr,list) and len(arr)<=1500,'배정 목록 오류');check,before=ctx.validate(arr),ctx.validate(m['draft'])
        E.require(check['valid'] or allow_partial and len(check['errors'])<len(before['errors']) and all(e in before['errors'] for e in check['errors']),'배정 검증 실패: '+'; '.join(check['errors'][:12]))
        return self._save({SH['draft']:self.draft_rows(arr)},m['state'],action,p.get('reason',''),m['draft'],arr)

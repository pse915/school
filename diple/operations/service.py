"""Phase 6 dated timetable service.

SQLite transactions protect a *single durable SQLite host*. Streamlit Community Cloud's
local filesystem is ephemeral and MUST NOT be used as a production database. This service
intentionally rejects remote multiwriter claims for the legacy Google Sheets adapter.
"""
from __future__ import annotations
from contextlib import contextmanager
from collections import defaultdict
from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
from hashlib import sha256
from itertools import combinations
from pathlib import Path
from uuid import uuid4
import secrets
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, VerificationError
import json
import sqlite3

from diple.model import DAYS, index, expand_sessions, validate_placements


class OperationError(ValueError): pass
class Conflict(OperationError): pass
class PermissionDenied(OperationError): pass


def now(): return datetime.now(timezone.utc).isoformat()
def j(data): return json.dumps(data,ensure_ascii=False,separators=(',',':'),sort_keys=True)
def unj(value): return json.loads(value)
def uid(): return str(uuid4())
def valid_date(value):
    try: return date.fromisoformat(value)
    except (TypeError,ValueError): raise OperationError('날짜는 YYYY-MM-DD 형식이어야 합니다.') from None


def scope(project):
    s=project['school'];return (s['id'],int(s['academic_year']),int(s['semester']))


def is_manager(actor):return actor.get('role') in ('admin','scheduler')


def ensure(actor,school,roles=None):
    if not actor or actor.get('school_id')!=school or (roles and actor.get('role') not in roles):
        raise PermissionDenied('학교별 권한 또는 사용자 역할을 확인할 수 없습니다.')


class OperationsService:
    def __init__(self,path='diple-operations-local.sqlite3',repo=None):
        self.repo=repo
        self.path=str(path)
        self._setup()

    @contextmanager
    def _db(self):
        if self.repo is not None:
            from diple.enrollment.service import VersionConflict
            try:
                with self.repo.tx('auto') as db:yield db
            except VersionConflict as exc:raise Conflict(str(exc)) from exc
            return
        db=sqlite3.connect(self.path,timeout=25,isolation_level=None)
        db.row_factory=sqlite3.Row
        db.execute('PRAGMA busy_timeout=25000')
        db.execute('PRAGMA foreign_keys=ON')
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback();raise
        finally:db.close()

    def _setup(self):
        with self._db() as db:
            if self.repo is None:db.execute('PRAGMA journal_mode=WAL')
            db.executescript('''
            CREATE TABLE IF NOT EXISTS base_versions(
              base_id TEXT PRIMARY KEY, school_id TEXT NOT NULL,academic_year INTEGER NOT NULL, semester INTEGER NOT NULL,
              effective_from TEXT NOT NULL,project_json TEXT NOT NULL,created_at TEXT NOT NULL,actor TEXT NOT NULL,
              UNIQUE(school_id,academic_year,semester,effective_from,base_id));
            CREATE INDEX IF NOT EXISTS idx_base ON base_versions(school_id,academic_year,semester,effective_from);
            CREATE TABLE IF NOT EXISTS daily_states(
              school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,day TEXT NOT NULL,
              revision INTEGER NOT NULL,base_id TEXT NOT NULL,draft_json TEXT NOT NULL,
              published_revision INTEGER NOT NULL DEFAULT 0,published_json TEXT NOT NULL,updated_at TEXT NOT NULL,
              PRIMARY KEY(school_id,academic_year,semester,day));
            CREATE TABLE IF NOT EXISTS change_requests(
              request_id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
              actor TEXT NOT NULL,role TEXT NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL,
              reason TEXT NOT NULL,changes_json TEXT NOT NULL,expected_json TEXT NOT NULL,
              before_json TEXT, after_json TEXT, created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
              decision_actor TEXT,decision_reason TEXT);
            CREATE INDEX IF NOT EXISTS idx_request ON change_requests(school_id,academic_year,semester,status);
            CREATE TABLE IF NOT EXISTS teacher_absences(
              id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
              teacher_id TEXT NOT NULL,from_day TEXT NOT NULL,to_day TEXT NOT NULL,
              periods_json TEXT NOT NULL,kind TEXT NOT NULL,reason TEXT NOT NULL,evidence INTEGER NOT NULL,
              created_by TEXT NOT NULL,created_at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS academic_events(
              id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
              day TEXT NOT NULL,title TEXT NOT NULL,scope_json TEXT NOT NULL,periods_json TEXT NOT NULL,
              request_id TEXT NOT NULL,created_at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS change_audit(
              id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
              day TEXT,request_id TEXT,actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS notifications(
              id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
              teacher_id TEXT NOT NULL,day TEXT NOT NULL,request_id TEXT NOT NULL,message TEXT NOT NULL,
              read_at TEXT,created_at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS teacher_accounts(
              account_id TEXT PRIMARY KEY,school_id TEXT NOT NULL,teacher_id TEXT NOT NULL,
              password_hash TEXT,activation_hash TEXT,failed_count INTEGER NOT NULL DEFAULT 0, locked_until TEXT,
              UNIQUE(school_id,teacher_id));
            CREATE TABLE IF NOT EXISTS teacher_sessions(
              token_hash TEXT PRIMARY KEY,school_id TEXT NOT NULL,teacher_id TEXT NOT NULL,expires_at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS daily_history(
              id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
              day TEXT NOT NULL,revision INTEGER NOT NULL,payload TEXT NOT NULL,actor TEXT NOT NULL,at TEXT NOT NULL);
            ''')

    def _audit(self,db,sc,actor,action,day=None,request_id=None,detail=None):
        db.execute('INSERT INTO change_audit VALUES(?,?,?,?,?,?,?,?,?,?)',
                   (uid(),*sc,day,request_id,actor,action,j(detail or {}),now()))

    def register_base(self,project,effective_from,actor):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        valid_date(effective_from)
        pub=project.get('published')
        if not pub: raise OperationError('기존 기본 시간표 확정본이 없습니다.')
        errors=validate_placements(project,pub['placements'])
        if errors: raise OperationError('기존 확정 시간표 검증 실패: '+'; '.join(errors[:5]))
        frozen=deepcopy(project)
        # Immutable copy: do not serialize any login credentials or drafts to the base.
        frozen={k:frozen[k] for k in ('school','periods_by_day','teachers','classes','rooms','students','subjects','lessons','published')}
        if project.get('bell_schedules'):
            frozen['bell_schedules']=deepcopy(project['bell_schedules'])
        base_id='base-'+sha256(j({'scope':sc,'project':frozen}).encode()).hexdigest()[:20]
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('INSERT OR IGNORE INTO base_versions VALUES (?,?,?,?,?,?,?,?)',
                       (base_id,*sc,effective_from,j(frozen),now(),actor['user_id']))
            self._audit(db,sc,actor['user_id'],'base_registered',detail={'base_id':base_id,'effective_from':effective_from})
            db.commit()
        return base_id

    def _base(self,db,sc,day):
        result=db.execute('''SELECT * FROM base_versions WHERE school_id=? AND academic_year=? AND semester=?
            AND effective_from<=? ORDER BY effective_from DESC,created_at DESC LIMIT 1''',(*sc,day)).fetchone()
        if not result: raise OperationError('해당 날짜에 적용할 확정 기본 시간표 버전이 없습니다.')
        return result

    @staticmethod
    def _lesson_occurrences(project,day):
        day_obj=valid_date(day)
        if day_obj.weekday()>4:return []
        day_kr=DAYS[day_obj.weekday()]
        by_id={s['session_id']:s for s in expand_sessions(project)}
        teachers=index(project,'teachers');subjects=index(project,'subjects')
        placements=project['published']['placements'];out=[]
        for placement in placements:
            sid=placement['session_id'];s=by_id[sid]
            if not placement['start'].startswith(day_kr):continue
            start=int(placement['start'][1:]);d=int(s['duration'])
            out.append({'id':day+':'+sid,'base_session_id':sid,'lesson_id':s['id'],
             'date':day,'period':start,'duration':d,'teacher_ids':list(s.get('teacher_ids',[])),
             'class_ids':list(s.get('class_ids',[])),'student_ids':list(s.get('student_ids',[])),
             'room_id':placement.get('room_id',''),'subject_id':s['subject_id'],
             'kind':'base','status':'scheduled','origin_teacher_ids':list(s.get('teacher_ids',[])),
             'timing_block':s.get('timing_block',''),'timing_offset':int(s.get('timing_offset',0)),
             'simultaneous_group':s.get('simultaneous_group',''),'locked':bool(s.get('locked') or s.get('fixed_slots')),
             'label':subjects.get(s['subject_id'],{}).get('name',s['subject_id']),'origin_period':start,
             'room_options':list(s.get('room_ids',[]))})
        return out

    def _get_state(self,db,sc,day,write=False):
        valid_date(day)
        row=db.execute('SELECT * FROM daily_states WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(*sc,day)).fetchone()
        if row:return {'day':day,'rev':row['revision'],'base_id':row['base_id'],
                       'lessons':unj(row['draft_json']),'published_rev':row['published_revision'],
                       'published_lessons':unj(row['published_json'])}
        base=self._base(db,sc,day)
        lessons=self._lesson_occurrences(unj(base['project_json']),day)
        state={'day':day,'rev':0,'base_id':base['base_id'],'lessons':lessons,
               'published_rev':0,'published_lessons':deepcopy(lessons)}
        if write:
            db.execute('INSERT INTO daily_states VALUES(?,?,?,?,?,?,?,?,?,?)',
                       (*sc,day,0,state['base_id'],j(lessons),0,j(lessons),now()))
        return state

    def day(self,project,day,actor,*,published=False):
        sc=scope(project);ensure(actor,sc[0]);valid_date(day)
        with self._db() as db: state=self._get_state(db,sc,day)
        lessons=state['published_lessons'] if published or actor['role']=='student' else state['lessons']
        if actor['role']=='student':
            student_id=actor['user_id']
            students=index(project,'students')
            class_id=students.get(student_id,{}).get('class_id')
            lessons=[l for l in lessons if student_id in l['student_ids'] or (class_id and class_id in l['class_ids'])]
        elif actor['role']=='teacher':
            lessons=[l for l in lessons if actor['user_id'] in l['teacher_ids'] or actor['user_id'] in l['origin_teacher_ids']]
        return {**state,'lessons':deepcopy(lessons),'published_lessons':[]}

    def week(self,project,day,actor,published=False):
        beginning=valid_date(day)-timedelta(days=valid_date(day).weekday())
        return [self.day(project,(beginning+timedelta(days=i)).isoformat(),actor,published=published) for i in range(5)]

    def absent(self,project,actor,teacher_id,from_day,to_day,periods,kind,reason,evidence=False):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        if teacher_id not in index(project,'teachers'):raise OperationError('등록되지 않은 교사입니다.')
        start=valid_date(from_day);end=valid_date(to_day)
        if end<start or (end-start).days>180:raise OperationError('결강 기간은 0~180일로 설정해야 합니다.')
        selected=sorted(set(int(x) for x in periods))
        if any(x<1 or x>12 for x in selected):raise OperationError('교시는 1~12로 제한합니다.')
        ident=uid()
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('INSERT INTO teacher_absences VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
                       (ident,*sc,teacher_id,from_day,to_day,j(selected),kind,reason,int(evidence),actor['user_id'],now()))
            self._audit(db,sc,actor['user_id'],'absence_registered',detail={'absence_id':ident,'teacher_id':teacher_id})
            db.commit()
        return ident

    def absences(self,project,actor,day):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'));valid_date(day)
        with self._db() as db:
            found=db.execute('''SELECT * FROM teacher_absences WHERE school_id=? AND academic_year=? AND semester=? AND from_day<=? AND to_day>=?''',(*sc,day,day)).fetchall()
        return [dict(r) for r in found]

    def affected(self,project,actor,day):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        current=self.day(project,day,actor)['lessons']
        absences=self.absences(project,actor,day)
        return [{'absence_id':a['id'],'teacher_id':a['teacher_id'],'lesson':l} for a in absences
                for l in current if a['teacher_id'] in l['teacher_ids'] and
                (not unj(a['periods_json']) or bool(set(range(l['period'],l['period']+l['duration'])) & set(unj(a['periods_json']))))
                and l['status']!='cancelled']

    def _teacher_absent(self,db,sc,teacher,day,periods):
        rows=db.execute('''SELECT periods_json FROM teacher_absences WHERE school_id=? AND academic_year=? AND semester=?
                     AND teacher_id=? AND from_day<=? AND to_day>=?''',(*sc,teacher,day,day)).fetchall()
        return any(not unj(row[0]) or bool(set(unj(row[0])) & set(periods)) for row in rows)

    @staticmethod
    def _bell(project,lesson):
        # Optional school custom bell hours: project['bell_schedules'] = {'default':{'1':['09:00','09:45']},'2':{...}}
        school_bells=project.get('bell_schedules') or {}
        classes=index(project,'classes');students=index(project,'students')
        grades={str(classes[c].get('grade')) for c in lesson['class_ids'] if c in classes}
        grades.update(str(classes[students[s]['class_id']].get('grade')) for s in lesson['student_ids']
                      if s in students and students[s].get('class_id') in classes)
        selected=[school_bells.get(g,school_bells.get('default',{})) for g in grades] or [school_bells.get('default',{})]
        intervals=[]
        for i in range(lesson['period'],lesson['period']+lesson['duration']):
            for schedule in selected:
                start,end=schedule.get(str(i),((datetime(2000,1,1,8,40)+timedelta(minutes=50*(i-1))).strftime('%H:%M'),
                    (datetime(2000,1,1,9,25)+timedelta(minutes=50*(i-1))).strftime('%H:%M')))
                a,b=start.split(':'),end.split(':');minute=int(a[0])*60+int(a[1]);end_min=int(b[0])*60+int(b[1])
                if minute>=end_min:raise OperationError('시정표 시작·종료 시각이 올바르지 않습니다.')
                intervals.append((minute,end_min))
        return intervals

    def conflicts(self,project,states,db=None):
        sc=scope(project);errors=[]
        for day,lessons in states.items():
            effective=project
            if db is not None:
                pinned=self._get_state(db,sc,day)
                row=db.execute('SELECT project_json FROM base_versions WHERE base_id=? AND school_id=?',
                               (pinned['base_id'],sc[0])).fetchone()
                if row:effective=unj(row['project_json'])
            teachers=index(effective,'teachers');rooms=index(effective,'rooms')
            students=index(effective,'students');classes=index(effective,'classes')
            by_resource=defaultdict(list)
            max_periods=int(effective['periods_by_day'].get(DAYS[valid_date(day).weekday()],0)) if valid_date(day).weekday()<5 else 0
            anchors=defaultdict(list)
            for l in lessons:
                if l.get('status')=='cancelled':continue
                if int(l['period'])<1 or int(l['period'])+int(l['duration'])-1>max_periods:
                    errors.append(f"{day} {l['id']}: 운영 교시 범위 초과")
                if l.get('locked') and (l['date']!=l['id'][:10] or l['period']!=self._original_period(l)):
                    errors.append(f"{day} {l['id']}: 잠긴 수업은 이동할 수 없습니다")
                if l['teacher_ids'] and any(t not in teachers for t in l['teacher_ids']):
                    errors.append(f"{day}: 존재하지 않는 담당 교사")
                if l['room_id'] and l['room_id'] not in rooms:errors.append(f"{day}: 존재하지 않는 교실")
                if l['room_id'] and l['room_id'] in rooms:
                    cap=int(rooms[l['room_id']].get('capacity',999999))
                    count=max(len(l['student_ids']),sum(int(classes.get(c,{}).get('size',0)) for c in l['class_ids']))
                    if count>cap:errors.append(f"{day} {l['id']}: 교실 수용 인원 초과 ({count}>{cap})")
                if l['room_id'] and l.get('room_options') and l['room_id'] not in l['room_options']:
                    errors.append(f"{day} {l['id']}: 허용되지 않은 교실")
                members=set(l['student_ids'])
                # all homeroom students; elective lessons deliberately use student_ids without class_ids
                members.update(s['id'] for s in effective.get('students',[]) if s.get('class_id') in l['class_ids'])
                intervals=self._bell(effective,l)
                for resource,ident_list in [('teacher',l['teacher_ids']),('student',members),('class',l['class_ids']),('room',[l['room_id']] if l['room_id'] else [])]:
                    for key in ident_list:
                        for span in intervals:by_resource[(resource,key)].append((span,l['id']))
                weekly_slot=DAYS[valid_date(day).weekday()] if valid_date(day).weekday()<5 else ''
                for t in l['teacher_ids']:
                    if any(weekly_slot+str(p) in teachers.get(t,{}).get('blocked',[]) for p in range(l['period'],l['period']+l['duration'])):
                        errors.append(f'{day} {l["id"]}: 교사 {t} 배정 금지 교시')
                    if db and self._teacher_absent(db,sc,t,day,range(l['period'],l['period']+l['duration'])):
                        errors.append(f'{day} {l["id"]}: 교사 {t} 결강 등록 시간')
                if l['room_id'] and any(weekly_slot+str(p) in rooms[l['room_id']].get('blocked',[]) for p in range(l['period'],l['period']+l['duration'])):
                    errors.append(f'{day} {l["id"]}: 교실 배정 금지 교시')
                for c in l['class_ids']:
                    if any(weekly_slot+str(p) in classes[c].get('blocked',[]) for p in range(l['period'],l['period']+l['duration'])):
                        errors.append(f'{day} {l["id"]}: 학급 배정 금지 교시')
                if l.get('timing_block'):
                    anchors[l['timing_block']].append((l['id'],l['period']-l.get('timing_offset',0)))
            for (resource,ident),entries in by_resource.items():
                for a,b in combinations(entries,2):
                    if a[1]!=b[1] and a[0][0]<b[0][1] and b[0][0]<a[0][1]:
                        errors.append(f'{day}: {resource} {ident} 시간 중복 {a[1]} / {b[1]}')
            for group,items in anchors.items():
                if len(set(v for _,v in items))>1:errors.append(f'{day}: 이동반 구획 {group} 동시성 훼손')
        return sorted(set(errors))

    @staticmethod
    def _original_period(l):
        # Pinned origin for locked regular sessions, based on original date/period metadata.
        return int(l.get('origin_period',l['period']))

    def _plan(self,project,db,sc,changes):
        if not changes:raise OperationError('변경 작업이 비어 있습니다.')
        dates=set()
        for ch in changes:
            if ch.get('date'): dates.add(ch['date'])
            if ch.get('to_date'): dates.add(ch['to_date'])
        if len(dates)>25:raise OperationError('한 요청에서 변경할 날짜는 25일 이하입니다.')
        state={day:self._get_state(db,sc,day,write=False) for day in sorted(dates)}
        draft={day:deepcopy(s['lessons']) for day,s in state.items()}
        for n,ch in enumerate(changes):
            day=ch.get('date');to_day=ch.get('to_date',day)
            if not day or not to_day:raise OperationError('변경일 누락')
            kind=ch.get('action','move')
            if kind=='event':
                periods=set(int(x) for x in ch.get('periods',[]))
                class_scope=set(ch.get('class_ids',[]))
                grades=set(int(x) for x in ch.get('grades',[]))
                class_lookup=index(project,'classes')
                for l in draft[day]:
                    member_class_ids=set(l['class_ids'])|{index(project,'students').get(s,{}).get('class_id') for s in l['student_ids']}
                    impacted=(not class_scope and not grades or bool(member_class_ids&class_scope) or
                              any(class_lookup.get(c,{}).get('grade') in grades for c in member_class_ids))
                    if impacted and (not periods or bool(set(range(l['period'],l['period']+l['duration']))&periods)):
                        l['status']='cancelled';l['kind']='event';l['event_label']=ch.get('title','학사행사')
                continue
            original=next((l for l in draft[day] if l['id']==ch.get('occurrence_id')),None)
            if original is None:raise OperationError(f'{day}에 수업 ID {ch.get("occurrence_id")}가 없습니다.')
            if original.get('locked') and kind not in ('substitute','cancel'):
                raise OperationError('고정·잠금 수업은 이동/교환할 수 없습니다.')
            if kind=='cancel':
                original['status']='cancelled';original['kind']='cancelled';continue
            if kind=='substitute':
                original['teacher_ids']=[ch['teacher_id']];original['kind']='substitute';continue
            if kind=='room':
                original['room_id']=ch['room_id'];original['kind']='room_changed';continue
            if kind in ('move','copy','makeup'):
                p=int(ch['to_period']);
                if kind=='move':
                    draft[day].remove(original)
                    dest=original
                else:
                    dest=deepcopy(original)
                    dest['id']='extra:'+ch.get('change_id',f'{n}')+':'+original['id']
                    dest['kind']=kind
                    dest['status']='scheduled'
                    dest['locked']=False
                if to_day!=day and original.get('timing_block'):
                    raise OperationError('이동반 구획의 날짜 간 이동은 전체 구획 단위로 변경해야 합니다.')
                dest['period']=p;dest['date']=to_day
                if ch.get('teacher_id'):dest['teacher_ids']=[ch['teacher_id']]
                if ch.get('room_id') is not None:dest['room_id']=ch['room_id']
                dest['kind']=kind
                draft[to_day].append(dest)
                continue
            raise OperationError(f'지원하지 않는 변경 유형: {kind}')
        # Open absences may legitimately remain unresolved while administrators
        # process one replacement at a time. Reject newly introduced faults;
        # the final publish gate checks the complete resolved daily schedule.
        original={d:x['lessons'] for d,x in state.items()}
        initial=set(self.conflicts(project,original,db))
        final=set(self.conflicts(project,draft,db))
        # Compare stable absent/conflict signatures: faults involving unrelated
        # lessons should not block independent replacement work.
        errors=sorted(final-initial)
        return state,draft,errors

    def preview(self,project,actor,changes):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler','teacher'))
        with self._db() as db:state,after,errors=self._plan(project,db,sc,changes)
        if actor['role']=='teacher':self._teacher_scope(actor,state,changes)
        return {'before':{d:s['lessons'] for d,s in state.items()},'after':after,
                'expected_revisions':{d:s['rev'] for d,s in state.items()},'errors':errors}

    @staticmethod
    def _teacher_scope(actor,state,changes):
        ident=actor['user_id']
        if not all(ch.get('action')!='event' for ch in changes):raise PermissionDenied('교사는 학사행사 등록을 요청할 수 없습니다.')
        for ch in changes:
            found=next((l for l in state[ch['date']]['lessons'] if l['id']==ch.get('occurrence_id')),None)
            if not found or ident not in found.get('origin_teacher_ids',[]):
                raise PermissionDenied('본인 담당 수업만 변경 요청할 수 있습니다.')

    def submit(self,project,actor,kind,changes,reason,expected_versions=None):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler','teacher'))
        if len(reason.strip())<3:raise OperationError('변경 사유를 3자 이상 작성하세요.')
        if kind not in ('move','swap','chain','substitute','cancel','room','makeup','copy','event','other'):
            raise OperationError('지원하지 않는 변경 유형')
        # Immutable, deterministic extra occurrence IDs across preview and confirmation.
        changes=deepcopy(changes)
        for ch in changes:ch.setdefault('change_id',uid())
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            state,after,errors=self._plan(project,db,sc,changes)
            if actor['role']=='teacher':self._teacher_scope(actor,state,changes)
            if errors:raise Conflict('; '.join(errors[:10]))
            ident=uid();expected={d:s['rev'] for d,s in state.items()}
            if expected_versions is not None and expected!=expected_versions:raise Conflict('미리보기 이후 변경되었습니다. 다시 검증하세요.')
            db.execute('INSERT INTO change_requests VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                       (ident,*sc,actor['user_id'],actor['role'],kind,'submitted',reason,j(changes),j(expected),None,None,now(),now(),None,None))
            self._audit(db,sc,actor['user_id'],'request_submitted',request_id=ident,detail={'kind':kind,'days':list(expected)})
            db.commit()
        return ident

    def requests(self,project,actor,status=None):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler','teacher'))
        with self._db() as db:
            clauses='WHERE school_id=? AND academic_year=? AND semester=?';params=list(sc)
            if actor['role']=='teacher':clauses+=' AND actor=?';params.append(actor['user_id'])
            if status:clauses+=' AND status=?';params.append(status)
            data=db.execute('SELECT * FROM change_requests '+clauses+' ORDER BY created_at DESC',params).fetchall()
        return [dict(r) for r in data]

    def _request(self,db,sc,request_id):
        r=db.execute('SELECT * FROM change_requests WHERE request_id=? AND school_id=? AND academic_year=? AND semester=?',(request_id,*sc)).fetchone()
        if not r:raise OperationError('요청을 찾을 수 없습니다.')
        return r

    def review(self,project,actor,request_id,accept,reason):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        if len(reason.strip())<2:raise OperationError('처리 사유를 입력하세요.')
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE');r=self._request(db,sc,request_id)
            if r['status'] not in ('submitted','reviewing'):raise Conflict('이미 처리된 요청입니다.')
            status='approved' if accept else 'rejected'
            db.execute('UPDATE change_requests SET status=?,decision_actor=?,decision_reason=?,updated_at=? WHERE request_id=?',
                       (status,actor['user_id'],reason,now(),request_id))
            self._audit(db,sc,actor['user_id'],'request_'+status,request_id=request_id,detail={'reason':reason});db.commit()
        return status

    def confirm(self,project,actor,request_id):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE');r=self._request(db,sc,request_id)
            if r['status']!='approved':raise Conflict('승인된 요청만 확정할 수 있습니다.')
            expected=unj(r['expected_json']);changes=unj(r['changes_json'])
            for day,rev in expected.items():
                current=self._get_state(db,sc,day,write=True)
                if current['rev']!=rev:raise Conflict(f'{day}: 다른 관리자가 수정했습니다. 다시 후보를 확인하세요.')
            before,after,errors=self._plan(project,db,sc,changes)
            if errors:raise Conflict('; '.join(errors[:10]))
            for day,lessons in after.items():
                db.execute('UPDATE daily_states SET revision=?,draft_json=?,updated_at=? WHERE school_id=? AND academic_year=? AND semester=? AND day=?',
                           (expected[day]+1,j(lessons),now(),*sc,day))
                db.execute('INSERT INTO daily_history VALUES(?,?,?,?,?,?,?,?,?)',
                           (uid(),*sc,day,expected[day]+1,j(lessons),actor['user_id'],now()))
                self._audit(db,sc,actor['user_id'],'day_confirmed',day,request_id,{'revision':expected[day]+1})
            for c in changes:
                if c.get('action')=='substitute':
                    self._audit(db,sc,c['teacher_id'],'substitute_assigned',c['date'],request_id,{'assigned_by':actor['user_id']})
                if c.get('action')=='event':
                    db.execute('INSERT INTO academic_events VALUES(?,?,?,?,?,?,?,?,?,?)',
                        (uid(),*sc,c['date'],c.get('title','학사행사'),j({'class_ids':c.get('class_ids',[]),'grades':c.get('grades',[])}),
                          j(c.get('periods',[])),request_id,now()))
            db.execute('UPDATE change_requests SET status=?,before_json=?,after_json=?,updated_at=? WHERE request_id=?',
                       ('confirmed',j({d:s['lessons'] for d,s in before.items()}),j(after),now(),request_id))
            db.commit()
        return {d:expected[d]+1 for d in after}

    def publish(self,project,actor,day,expected_revision):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE');state=self._get_state(db,sc,day,write=True)
            if state['rev']!=expected_revision:raise Conflict('화면의 날짜 버전과 현재 저장 버전이 다릅니다.')
            errors=self.conflicts(project,{day:state['lessons']},db)
            if errors:raise Conflict('; '.join(errors[:10]))
            db.execute('UPDATE daily_states SET published_revision=?,published_json=?,updated_at=? WHERE school_id=? AND academic_year=? AND semester=? AND day=?',
                       (state['rev'],j(state['lessons']),now(),*sc,day))
            teachers=set(t for l in state['lessons'] for t in (l['teacher_ids']+l['origin_teacher_ids']))
            for t in teachers:
                db.execute('INSERT INTO notifications VALUES (?,?,?,?,?,?,?,?,?,?)',
                           (uid(),*sc,t,day,'daily-publication',f'{day} 변경 시간표가 배포되었습니다.',None,now()))
            self._audit(db,sc,actor['user_id'],'published',day,detail={'revision':state['rev']});db.commit()
        return state['rev']

    def cancel_confirmed(self,project,actor,request_id,reason):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        if len(reason.strip())<3:raise OperationError('취소 사유를 작성하세요.')
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE');r=self._request(db,sc,request_id)
            if r['status']!='confirmed':raise Conflict('확정 상태의 요청만 취소할 수 있습니다.')
            before=unj(r['before_json']);after=unj(r['after_json']);expected=unj(r['expected_json'])
            for day,prior in before.items():
                current=self._get_state(db,sc,day,write=True)
                if current['rev']!=expected[day]+1 or current['lessons']!=after[day]:
                    raise Conflict(f'{day}: 이후 변경이 있으므로 일괄 취소할 수 없습니다. 수동 복구 요청을 사용하세요.')
                errors=self.conflicts(project,{day:prior},db)
                if errors:raise Conflict('; '.join(errors[:10]))
            for day,prior in before.items():
                rev=expected[day]+2
                db.execute('UPDATE daily_states SET revision=?,draft_json=?,updated_at=? WHERE school_id=? AND academic_year=? AND semester=? AND day=?',
                           (rev,j(prior),now(),*sc,day))
                db.execute('INSERT INTO daily_history VALUES(?,?,?,?,?,?,?,?,?)',
                           (uid(),*sc,day,rev,j(prior),actor['user_id'],now()))
            db.execute('UPDATE change_requests SET status=?,updated_at=?,decision_reason=? WHERE request_id=?',
                       ('cancelled',now(),reason,request_id))
            self._audit(db,sc,actor['user_id'],'confirmed_cancelled',request_id=request_id,detail={'reason':reason});db.commit()
        return True

    def substitute_candidates(self,project,actor,day,occurrence_id):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        with self._db() as db:
            state=self._get_state(db,sc,day)
            chosen=next((l for l in state['lessons'] if l['id']==occurrence_id),None)
            if not chosen:raise OperationError('대강 대상 수업을 찾을 수 없습니다.')
            candidates=[]
            for teacher in project.get('teachers',[]):
                tid=teacher['id'];trial=deepcopy(state['lessons']);target=next(l for l in trial if l['id']==occurrence_id)
                target['teacher_ids']=[tid];target['kind']='substitute'
                faults=sorted(set(self.conflicts(project,{day:trial},db))-set(self.conflicts(project,{day:state['lessons']},db)))
                if self._teacher_absent(db,sc,tid,day,range(chosen['period'],chosen['period']+chosen['duration'])):
                    faults.append(f'{day}: 교사 {tid} 결강 등록 시간')
                related=1 if teacher.get('subject') in (chosen['subject_id'],chosen['label']) else 0
                allowed=teacher.get('substitute_subject_ids')
                if allowed is not None and chosen['subject_id'] not in allowed:
                    faults.append('학교가 지정한 담당 가능 교과가 아닙니다.')
                if allowed is None and not project['school'].get('allow_cross_subject_substitute',False) and not related:
                    faults.append('담당 교과 적합성 검증 실패 (학교 설정에서 교과 외 대강을 허용할 수 있습니다).')
                allowed_days=teacher.get('working_weekdays')
                if allowed_days is not None and DAYS[valid_date(day).weekday()] not in allowed_days:
                    faults.append('시간강사 근무 가능 요일이 아닙니다.')
                if teacher.get('unavailable_dates') and day in teacher['unavailable_dates']:
                    faults.append('교사 외부 일정 또는 부재 날짜입니다.')
                current_load=sum(l['duration'] for l in state['lessons'] if tid in l['teacher_ids'] and l['status']!='cancelled')
                related=1 if teacher.get('subject') in (chosen['subject_id'],chosen['label']) else 0
                past=db.execute('SELECT count(*) FROM change_audit WHERE school_id=? AND actor=? AND action=?',
                                (sc[0],tid,'substitute_assigned')).fetchone()[0]
                candidates.append({'teacher_id':tid,'name':teacher.get('name',tid),'eligible':not faults,
                                   'reason':'; '.join(faults[:4]),'subject_match':bool(related),
                                   'daily_periods':current_load,'prior_assignments':past,
                                   'score':related*100-past*12-current_load*3})
        return sorted(candidates,key=lambda c:(not c['eligible'],-c['score'],c['teacher_id']))

    def swap_changes(self,project,actor,day,occurrence_ids):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler','teacher'))
        if len(occurrence_ids)<2 or len(set(occurrence_ids))!=len(occurrence_ids):
            raise OperationError('서로 다른 두 개 이상의 수업을 선택하세요.')
        state=self.day(project,day,{'school_id':sc[0],'user_id':'system','role':'admin'})
        selected=[]
        for ident in occurrence_ids:
            l=next((x for x in state['lessons'] if x['id']==ident),None)
            if not l:raise OperationError('교환할 수업을 찾지 못했습니다.')
            selected.append(l)
        return [{'action':'move','date':day,'occurrence_id':l['id'],'to_date':day,
                 'to_period':selected[(i+1)%len(selected)]['period']} for i,l in enumerate(selected)]

    def find_swaps(self,project,actor,day,occurrence_id,max_candidates=20):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler','teacher'))
        state=self.day(project,day,{'school_id':sc[0],'user_id':'system','role':'admin'})
        others=[l for l in state['lessons'] if l['id']!=occurrence_id]
        result=[]
        for o in others[:150]:
            changes=self.swap_changes(project,{'school_id':sc[0],'user_id':'system','role':'admin'},day,[occurrence_id,o['id']])
            attempt=self.preview(project,{'school_id':sc[0],'user_id':'system','role':'admin'},changes)
            if not attempt['errors']:
                result.append({'other':o['id'],'period':o['period'],'changes':changes})
                if len(result)>=max_candidates:break
        return result

    def backup(self,project,actor):
        sc=scope(project);ensure(actor,sc[0],('admin',))
        tables=['base_versions','daily_states','change_requests','teacher_absences','academic_events','change_audit','notifications','daily_history']
        with self._db() as db:
            result={name:[dict(r) for r in db.execute('SELECT * FROM '+name+' WHERE school_id=? AND academic_year=? AND semester=?',sc)] for name in tables}
        return {'format':'diple-operations-backup-v1','scope':list(sc),'generated_at':now(),'tables':result}

    def restore(self,project,actor,backup,*,expected_days=None):
        """Restore saved DRAFT lessons as new immutable revisions.

        Published public schedules, history, audit and approvals remain intact.
        This is a conflict-checked *schedule recovery*, not database rollback.
        """
        sc=scope(project);ensure(actor,sc[0],('admin',))
        if backup.get('format')!='diple-operations-backup-v1' or tuple(backup.get('scope',[]))!=sc:
            raise OperationError('백업 형식 또는 학교·학년도·학기가 일치하지 않습니다.')
        tables=['base_versions','daily_states','change_requests','teacher_absences',
                'academic_events','change_audit','notifications','daily_history']
        if set(backup.get('tables',{}))!=set(tables):
            raise OperationError('필요한 데이터 테이블이 누락되었거나 알 수 없는 테이블이 있습니다.')
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            current={r['day']:r['revision'] for r in db.execute(
                'SELECT day,revision FROM daily_states WHERE school_id=? AND academic_year=? AND semester=?',sc)}
            if expected_days is None or expected_days!=current:
                raise Conflict('복원 전 현재 저장소의 날짜별 revision 동기화가 필요합니다.')
            for table,rows in backup['tables'].items():
                legal={r[1] for r in db.execute('PRAGMA table_info('+table+')')}
                for row in rows:
                    if set(row)!=legal:raise OperationError('백업 열 구성이 현재 DB 스키마와 다릅니다.')
                    if (row['school_id'],row['academic_year'],row['semester'])!=sc:
                        raise PermissionDenied('백업 내부에 다른 학교 데이터가 있습니다.')
            # Preserve all prior audit/request history; merge historical entries.
            for table in (x for x in tables if x!='daily_states'):
                for row in backup['tables'][table]:
                    names=list(row)
                    db.execute('INSERT OR IGNORE INTO '+table+'('+','.join(names)+') VALUES ('+
                               ','.join('?' for _ in names)+')',list(row.values()))
            restored_rows=list(backup['tables']['daily_states'])
            backup_days={x['day'] for x in restored_rows}
            for day in sorted(set(current)-backup_days):
                base=self._base(db,sc,day)
                frozen=unj(base['project_json'])
                restored_rows.append({'day':day,'base_id':base['base_id'],
                                      'draft_json':j(self._lesson_occurrences(frozen,day)),
                                      'revision':0,'published_revision':0,'published_json':'[]'})
            for saved in restored_rows:
                day=saved['day'];prior=db.execute('SELECT * FROM daily_states WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(*sc,day)).fetchone()
                next_rev=current[day]+1 if day in current else max(1,int(saved['revision'])+1)
                if prior:
                    # Do NOT silently expose a restored draft to students.
                    db.execute('UPDATE daily_states SET revision=?,base_id=?,draft_json=?,updated_at=? WHERE school_id=? AND academic_year=? AND semester=? AND day=?',
                               (next_rev,saved['base_id'],saved['draft_json'],now(),*sc,day))
                else:
                    db.execute('INSERT INTO daily_states VALUES(?,?,?,?,?,?,?,?,?,?)',
                               (*sc,day,next_rev,saved['base_id'],saved['draft_json'],
                                saved['published_revision'],saved['published_json'],now()))
                db.execute('INSERT INTO daily_history VALUES(?,?,?,?,?,?,?,?,?)',
                           (uid(),*sc,day,next_rev,saved['draft_json'],actor['user_id'],now()))
                self._audit(db,sc,actor['user_id'],'draft_restored',day,detail={'revision':next_rev,'previous_revision':current.get(day)})
            self._audit(db,sc,actor['user_id'],'backup_restore_completed',
                        detail={'generated_at':backup.get('generated_at'), 'days':len(restored_rows)})
            db.commit()
        return True

    def issue_teacher_activation(self,project,actor,teacher_id):
        sc=scope(project);ensure(actor,sc[0],('admin',))
        if teacher_id not in index(project,'teachers'):raise OperationError('미등록 교사')
        code=secrets.token_urlsafe(24)
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('INSERT INTO teacher_accounts(account_id,school_id,teacher_id,activation_hash) VALUES(?,?,?,?) '
                       'ON CONFLICT(school_id,teacher_id) DO UPDATE SET password_hash=NULL,activation_hash=excluded.activation_hash,failed_count=0,locked_until=NULL',
                       (uid(),sc[0],teacher_id,sha256(code.encode()).hexdigest()))
            db.execute('DELETE FROM teacher_sessions WHERE school_id=? AND teacher_id=?',(sc[0],teacher_id))
            self._audit(db,sc,actor['user_id'],'teacher_activation',detail={'teacher_id':teacher_id})
            db.commit()
        return code

    def activate_teacher(self,school_id,teacher_id,code,password):
        if not 12<=len(password)<=256:raise OperationError('12자 이상의 비밀번호가 필요합니다.')
        hasher=PasswordHasher(type=Type.ID,time_cost=2,memory_cost=19456,parallelism=1)
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute('SELECT * FROM teacher_accounts WHERE school_id=? AND teacher_id=?',(school_id,teacher_id)).fetchone()
            if not row or not row['activation_hash'] or not secrets.compare_digest(row['activation_hash'],sha256(code.encode()).hexdigest()):
                raise PermissionDenied('활성화 정보가 일치하지 않습니다.')
            db.execute('UPDATE teacher_accounts SET activation_hash=NULL,password_hash=?,failed_count=0,locked_until=NULL WHERE account_id=?',
                       (hasher.hash(password),row['account_id']))
            db.commit()
        return True

    def login_teacher(self,school_id,teacher_id,password):
        hasher=PasswordHasher(type=Type.ID,time_cost=2,memory_cost=19456,parallelism=1)
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute('SELECT * FROM teacher_accounts WHERE school_id=? AND teacher_id=?',(school_id,teacher_id)).fetchone()
            if not row or not row['password_hash']:raise PermissionDenied('로그인 실패')
            if row['locked_until'] and datetime.fromisoformat(row['locked_until'])>datetime.now(timezone.utc):
                raise PermissionDenied('계정이 잠겼습니다.')
            try: ok=hasher.verify(row['password_hash'],password)
            except (VerifyMismatchError,VerificationError):ok=False
            if not ok:
                count=row['failed_count']+1
                lock=(datetime.now(timezone.utc)+timedelta(minutes=15)).isoformat() if count>=5 else None
                db.execute('UPDATE teacher_accounts SET failed_count=?,locked_until=? WHERE account_id=?',(count,lock,row['account_id']))
                db.commit()
                raise PermissionDenied('로그인 실패')
            db.execute('UPDATE teacher_accounts SET failed_count=0,locked_until=NULL WHERE account_id=?',(row['account_id'],))
            token=secrets.token_urlsafe(32)
            expires=(datetime.now(timezone.utc)+timedelta(hours=8)).isoformat()
            db.execute('INSERT INTO teacher_sessions VALUES(?,?,?,?)',(sha256(token.encode()).hexdigest(),school_id,teacher_id,expires))
            db.commit()
        return token

    def teacher_actor(self,school_id,token):
        with self._db() as db:
            row=db.execute('SELECT * FROM teacher_sessions WHERE school_id=? AND token_hash=?',(school_id,sha256(token.encode()).hexdigest())).fetchone()
            if not row or datetime.fromisoformat(row['expires_at'])<=datetime.now(timezone.utc):
                raise PermissionDenied('교사 세션이 만료되었습니다.')
        return {'school_id':school_id,'user_id':row['teacher_id'],'role':'teacher'}

    def logout_teacher(self,school_id,token):
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('DELETE FROM teacher_sessions WHERE school_id=? AND token_hash=?',(school_id,sha256(token.encode()).hexdigest()))
            db.commit()

    def restore_revisions(self,project,actor):
        sc=scope(project);ensure(actor,sc[0],('admin',))
        with self._db() as db:
            return {r['day']:r['revision'] for r in db.execute('SELECT day,revision FROM daily_states WHERE school_id=? AND academic_year=? AND semester=?',sc)}

    def teacher_notifications(self,project,actor):
        sc=scope(project);ensure(actor,sc[0],('teacher',))
        with self._db() as db:
            return [dict(r) for r in db.execute('SELECT * FROM notifications WHERE school_id=? AND teacher_id=? ORDER BY created_at DESC LIMIT 100',
                            (sc[0],actor['user_id'])).fetchall()]

    def teacher_project(self,school_id,year,semester,day,token):
        self.teacher_actor(school_id,token)
        sc=(school_id,int(year),int(semester))
        with self._db() as db:
            state=self._get_state(db,sc,day)
            row=db.execute('SELECT project_json FROM base_versions WHERE base_id=? AND school_id=?',(state['base_id'],school_id)).fetchone()
            if not row:raise OperationError('등록된 기본 시간표 버전을 찾을 수 없습니다.')
            project=unj(row['project_json'])
        return project

    def student_project(self,school_id,year,semester,day,actor):
        ensure(actor,school_id,('student',))
        sc=(school_id,int(year),int(semester))
        with self._db() as db:
            state=self._get_state(db,sc,day)
            row=db.execute('SELECT project_json FROM base_versions WHERE base_id=? AND school_id=?',(state['base_id'],school_id)).fetchone()
            if not row:raise OperationError('등록된 기본 시간표 버전을 찾을 수 없습니다.')
            return unj(row['project_json'])

    def plan_daily_substitutes(self,project,actor,day,max_nodes=12000):
        """Bounded multi-absence search, no non-eligible teacher is ever forced.

        Returns *suggestions only*. Explicit request->approval->confirm->publish is
        still required; this deliberately cannot auto-publish.
        """
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        impacted=self.affected(project,actor,day)
        lessons={x['lesson']['id']:x['lesson'] for x in impacted}
        work=list(lessons.values())
        if len(work)>12:raise OperationError('자동 동시 후보 탐색은 하루 결강 12개 수업 이하에서 지원합니다.')
        if not work:return {'changes':[],'unassigned':[],'visited':0}
        candidate_lists={l['id']:[x for x in self.substitute_candidates(project,actor,day,l['id']) if x['eligible']][:12] for l in work}
        # Most constrained first; stable seed-free deterministic results.
        work.sort(key=lambda l:(len(candidate_lists[l['id']]),l['period'],l['id']))
        best={'assigned':-1,'score':-10**9,'changes':[]};nodes=0
        with self._db() as db:
            baseline=self._get_state(db,sc,day)['lessons']
            baseline_faults=set(self.conflicts(project,{day:baseline},db))
            def dfs(i,chosen,current,score):
                nonlocal nodes
                nodes+=1
                if nodes>max_nodes:return
                if i==len(work):
                    if len(chosen)>best['assigned'] or (len(chosen)==best['assigned'] and score>best['score']):
                        best.update(assigned=len(chosen),score=score,changes=deepcopy(chosen))
                    return
                if len(chosen)+len(work)-i<best['assigned']:return
                lesson=work[i]
                for candidate in candidate_lists[lesson['id']]:
                    changed=deepcopy(current)
                    target=next(x for x in changed if x['id']==lesson['id'])
                    target['teacher_ids']=[candidate['teacher_id']];target['kind']='substitute'
                    if set(self.conflicts(project,{day:changed},db))-baseline_faults:continue
                    operation={'action':'substitute','date':day,'occurrence_id':lesson['id'],'teacher_id':candidate['teacher_id']}
                    dfs(i+1,chosen+[operation],changed,score+candidate['score'])
                dfs(i+1,chosen,current,score)
            dfs(0,[],baseline,0)
        ids={c['occurrence_id'] for c in best['changes']}
        return {'changes':best['changes'],'unassigned':[l['id'] for l in work if l['id'] not in ids],
                'visited':nodes,'optimality_proven':nodes<=max_nodes}

    def operational_excel(self,project,actor,day):
        """Review workbook (NOT an official NEIS upload schema)."""
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        from io import BytesIO
        import pandas as pd
        states=self.week(project,day,actor,published=True)
        all_rows=[];teachers=[];classes=[];students=[];rooms=[]
        for state in states:
            for l in state['lessons']:
                row={'날짜':state['day'],'시작 교시':l['period'],'연속 교시':l['duration'],
                     '과목':l['label'],'수업ID':l['id'],'담당교사ID':','.join(l['teacher_ids']),
                     '학급ID':','.join(l['class_ids']),'학생수':len(l['student_ids']),
                     '교실':l['room_id'],'변경유형':l['kind'],'상태':l['status']}
                all_rows.append(row)
                for t in l['teacher_ids']:teachers.append({'교사 ID':t,**row})
                for c in l['class_ids']:classes.append({'학급 ID':c,**row})
                for s in l['student_ids']:students.append({'학생 ID':s,**row})
                if l['room_id']:rooms.append({'교실 ID':l['room_id'],**row})
        with self._db() as db:
            audit=[dict(x) for x in db.execute('SELECT day,actor,action,detail,at FROM change_audit WHERE school_id=? AND academic_year=? AND semester=? ORDER BY at DESC LIMIT 2000',sc)]
        mem=BytesIO()
        with pd.ExcelWriter(mem,engine='openpyxl') as xlsx:
            for tab,rows in [('전체',all_rows),('교사별',teachers),('학급별',classes),('학생별',students),('교실별',rooms),('감사로그',audit)]:
                pd.DataFrame(rows or [{'자료':'없음'}]).to_excel(xlsx,sheet_name=tab,index=False)
        return mem.getvalue()

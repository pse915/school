"""Integrated transactions and read-only external schedule guards."""
from contextlib import contextmanager
from copy import deepcopy
import json
from diple.operations.service import OperationsService,OperationError,Conflict,ensure,scope,uid,now,j,unj
from .source import LegacyReadAdapter,fingerprint

class IntegratedOperations(OperationsService):
    def __init__(self,app,repo,source=None):
        self.app=app;self.source=source or LegacyReadAdapter(app)
        self._exam_cache=None
        super().__init__(repo=repo)
        with self._db() as db:
            db.execute('CREATE TABLE IF NOT EXISTS operation_drafts (id TEXT PRIMARY KEY, school_id TEXT, academic_year INTEGER, semester INTEGER, actor TEXT, kind TEXT, changes TEXT, reason TEXT, revision INTEGER, created_at TEXT)')
            db.execute('CREATE TABLE IF NOT EXISTS source_day_versions (school_id TEXT, academic_year INTEGER, semester INTEGER, day TEXT, fingerprint TEXT, PRIMARY KEY(school_id,academic_year,semester,day))')
    def register_base(self,project,effective_from,actor):
        if project.get('semester_version_id'):raise OperationError('적용된 학기 확정본은 학기 시간표 편성의 적용 화면에서 관리하세요.')
        return super().register_base(project,effective_from,actor)
    def actor(self):
        state=self.app.port.session_state
        if not state.get('logged_in') or state.get('_auth_stale'):raise OperationError('현재 로그인 권한을 확인할 수 없습니다.')
        from backend.credit.install import config
        role='admin' if self.app.program.call('can_manage_ids') else 'teacher'
        user=state.get('user_id') if role=='admin' else state.get('user_name')
        if role=='teacher':
            from .install import get_project
            project=get_project(self.app)
            matches=[t['id'] for t in project['teachers'] if t.get('name')==user or project.get('legacy_mapping',{}).get('teachers',{}).get(t['id'])==user]
            if len(matches)==1:user=matches[0]
        return {'school_id':config(self.app)['school_id'],'user_id':user,'role':role}
    def refresh_external(self):self._exam_cache=None
    def exams(self):
        if self._exam_cache is None:
            try:self._exam_cache=self.source.exam()
            except Exception as exc:raise OperationError('시험감독 일정을 확인하지 못해 신규 확정을 제한합니다. 기존 감독 저장소 연결을 확인하세요.') from exc
        return self._exam_cache
    def _base(self,db,sc,day):
        rows=db.execute('SELECT * FROM base_versions WHERE school_id=? AND academic_year=? AND semester=? AND effective_from<=? ORDER BY effective_from DESC,created_at DESC',(*sc,day)).fetchall()
        for row in rows:
            project=unj(row['project_json'])
            if project.get('semester_version_id') and day>project['term']['ends_at']:continue
            return row
        raise OperationError('해당 날짜에 유효한 확정 기본 시간표가 없습니다.')
    def _get_state(self,db,sc,day,write=False):
        exists=db.execute('SELECT 1 FROM daily_states WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(*sc,day)).fetchone()
        state=super()._get_state(db,sc,day,write=False)
        if exists:return state
        base=self._base(db,sc,day);project=unj(base['project_json'])
        lessons=self.source.daily_lessons(project,day)
        state.update(lessons=lessons,published_lessons=deepcopy(lessons))
        if write:
            db.execute('INSERT INTO daily_states VALUES(?,?,?,?,?,?,?,?,?,?)',(*sc,day,0,state['base_id'],j(lessons),0,j(lessons),now()))
            db.execute('INSERT OR REPLACE INTO source_day_versions VALUES(?,?,?,?,?)',(*sc,day,fingerprint(lessons)))
        return state
    def conflicts(self,project,states,db=None):
        errors=super().conflicts(project,states,db)
        exams=self.exams()
        for day,lessons in states.items():
            for teacher in project['teachers']:
                load=sum(l['duration'] for l in lessons if l.get('kind')=='substitute' and l['status']!='cancelled' and teacher['id'] in l['teacher_ids'])
                if teacher.get('max_daily_substitutes') is not None and load>int(teacher['max_daily_substitutes']):errors.append(teacher['id']+': 일일 대강 상한 초과 '+str(load))
            if db:
                prior=db.execute('SELECT fingerprint FROM source_day_versions WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(*scope(project),day)).fetchone()
                if prior and prior[0]!=fingerprint(self.source.daily_lessons(project,day)):
                    errors.append(day+': 기존 날짜별 시간표가 변경되었습니다. 기준 동기화 검토가 필요합니다.')
            for l in lessons:
                if l['status']=='cancelled':continue
                for e in exams:
                    if e['date']==day and e['teacher_id'] in [project.get('legacy_mapping',{}).get('teachers',{}).get(t,next((r['name'] for r in project['teachers'] if r['id']==t),t)) for t in l['teacher_ids']] and l['period']<=e['period']<l['period']+l['duration']:
                        errors.append(day+': '+e['teacher_id']+' 시험감독 중복')
                errors.extend(day+': '+reason for reason in self.source.blocked(project,day,l))
                # Subject eligibility must be enforced on submit/confirm, not only recommendation UI.
                if l.get('kind')=='substitute':
                    for tid in l['teacher_ids']:
                        teacher=next((t for t in project['teachers'] if t['id']==tid),{})
                        allowed=teacher.get('substitute_subject_ids')
                        if allowed is not None and l['subject_id'] not in allowed:errors.append(tid+': 담당 가능 교과 제한')
                        if allowed is None and not project['school'].get('allow_cross_subject_substitute') and teacher.get('subject') not in (l['subject_id'],l['label']):errors.append(tid+': 담당교과 부적합')
                        if teacher.get('working_weekdays') is not None and '월화수목금'[__import__('datetime').date.fromisoformat(day).weekday()] not in teacher['working_weekdays']:errors.append(tid+': 겸임·시간강사 근무요일 제한')
        return sorted(set(errors))
    def save_draft(self,project,actor,kind,changes,reason,draft_id=None,expected_revision=0):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler','teacher'))
        ident=draft_id or uid()
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE')
            prior=db.execute('SELECT * FROM operation_drafts WHERE id=? AND school_id=?',(ident,sc[0])).fetchone()
            if prior and (prior['actor']!=actor['user_id'] or prior['revision']!=expected_revision):raise Conflict('임시 변경안 버전 충돌')
            if not prior and expected_revision:raise Conflict('임시 변경안이 없습니다.')
            db.execute('INSERT OR REPLACE INTO operation_drafts VALUES(?,?,?,?,?,?,?,?,?,?)',(ident,*sc,actor['user_id'],kind,j(changes),reason,expected_revision+1,now()))
            self._audit(db,sc,actor['user_id'],'draft_saved',detail={'draft_id':ident,'revision':expected_revision+1})
        return {'id':ident,'revision':expected_revision+1}
    def drafts(self,project,actor):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler','teacher'))
        with self._db() as db:return [dict(r) for r in db.execute('SELECT * FROM operation_drafts WHERE school_id=? AND academic_year=? AND semester=? AND actor=? ORDER BY created_at DESC',(*sc,actor['user_id']))]
    def begin_review(self,project,actor,request_id):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE');r=self._request(db,sc,request_id)
            if r['status']!='submitted':raise Conflict('제출된 요청만 검토할 수 있습니다.')
            db.execute("UPDATE change_requests SET status='reviewing',updated_at=? WHERE request_id=?",(now(),request_id))
            self._audit(db,sc,actor['user_id'],'request_reviewing',request_id=request_id)
    def submit_checked(self,project,actor,kind,changes,reason,expected):
        preview=self.preview(project,actor,changes)
        if preview['expected_revisions']!=expected:raise Conflict('미리보기 이후 시간표가 변경되었습니다. 다시 검증하세요.')
        return self.submit(project,actor,kind,changes,reason,expected_versions=expected)
    def history(self,project,actor):
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        with self._db() as db:return [dict(r) for r in db.execute('SELECT * FROM change_audit WHERE school_id=? AND academic_year=? AND semester=? ORDER BY at DESC LIMIT 500',sc)]
    def publish(self,project,actor,day,expected_revision):
        """Publish the transitive date set of related confirmed requests atomically."""
        sc=scope(project);ensure(actor,sc[0],('admin','scheduler'))
        with self._db() as db:
            db.execute('BEGIN IMMEDIATE');primary=self._get_state(db,sc,day,write=True)
            if primary['rev']!=expected_revision:raise Conflict('배포 화면 버전이 오래되었습니다.')
            linked={day};requests=db.execute("SELECT expected_json FROM change_requests WHERE school_id=? AND academic_year=? AND semester=? AND status='confirmed'",sc).fetchall()
            changed=True
            while changed:
                changed=False
                for row in requests:
                    dates=set(unj(row[0]))
                    if linked&dates and not dates<=linked:linked|=dates;changed=True
            states={d:self._get_state(db,sc,d,write=True) for d in linked}
            errors=self.conflicts(project,{d:s['lessons'] for d,s in states.items()},db)
            if errors:raise Conflict(' / '.join(errors[:12]))
            for d,state in states.items():
                db.execute('UPDATE daily_states SET published_revision=?,published_json=?,updated_at=? WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(state['rev'],j(state['lessons']),now(),*sc,d))
                self._audit(db,sc,actor['user_id'],'published',d,detail={'revision':state['rev'],'atomic_dates':sorted(linked)})
                for teacher in {t for l in state['lessons'] for t in l['teacher_ids']+l['origin_teacher_ids']}:
                    db.execute('INSERT INTO notifications VALUES(?,?,?,?,?,?,?,?,?,?)',(uid(),*sc,teacher,d,'daily-publication',d+' 변경 시간표 배포',None,now()))
        return states[day]['rev']

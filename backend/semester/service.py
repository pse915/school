"""Versioned semester workspaces/candidates and atomic Phase 6 activation in the same repository."""
from copy import deepcopy
from datetime import date,datetime,timezone
import json,uuid
from .model import SemesterError,RevisionConflict,digest,compile_project,validate,empty_project

DDL='''
CREATE TABLE IF NOT EXISTS semester_job_locks (term_id TEXT PRIMARY KEY,job_id TEXT NOT NULL,expires REAL NOT NULL);
CREATE TABLE IF NOT EXISTS semester_meta (version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS semester_terms (id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,revision INTEGER NOT NULL,project_json TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS semester_term_history (term_id TEXT NOT NULL,revision INTEGER NOT NULL,project_json TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(term_id,revision));
CREATE TABLE IF NOT EXISTS semester_candidates (id TEXT PRIMARY KEY,term_id TEXT NOT NULL,source_revision INTEGER NOT NULL,input_hash TEXT NOT NULL,project_json TEXT NOT NULL,result_json TEXT NOT NULL,parent_id TEXT,created_at TEXT NOT NULL,actor TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS semester_finals (id TEXT PRIMARY KEY,term_id TEXT NOT NULL,candidate_id TEXT NOT NULL,project_json TEXT NOT NULL,result_json TEXT NOT NULL,checksum TEXT NOT NULL,actor TEXT NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS semester_pointers (school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,effective_from TEXT NOT NULL,version_id TEXT NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(school_id,academic_year,semester,effective_from));
CREATE TABLE IF NOT EXISTS semester_audit (id TEXT PRIMARY KEY,school_id TEXT NOT NULL,term_id TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,detail_json TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS semester_receipts (school_id TEXT NOT NULL,request_key TEXT NOT NULL,signature TEXT NOT NULL,result_json TEXT NOT NULL,PRIMARY KEY(school_id,request_key));
'''
def now():return datetime.now(timezone.utc).isoformat()
def uid():return uuid.uuid4().hex

class SemesterService:
    def __init__(self,repo,school,authorize,clock=date.today,display_name=None):
        self.repo=repo;self.school=school;self.authorize=authorize;self.clock=clock;self.display_name=display_name
        with repo.tx('auto') as db:
            db.executescript(DDL)
            if not db.execute('SELECT 1 FROM semester_meta').fetchone():db.execute('INSERT INTO semester_meta VALUES (1)')
            if db.execute('SELECT version FROM semester_meta').fetchone()[0]!=1:raise SemesterError('학기 저장소 버전 불일치')
    def actor(self,write=False,confirm=False):return self.authorize(write=write,confirm=confirm)
    def _row(self,db,term_id):
        row=db.execute('SELECT * FROM semester_terms WHERE id=? AND school_id=?',(term_id,self.school)).fetchone()
        if not row:raise SemesterError('현재 학교의 학기를 찾을 수 없습니다.')
        return dict(row)
    def _audit(self,db,term,action,actor,detail):db.execute('INSERT INTO semester_audit VALUES(?,?,?,?,?,?,?)',(uid(),self.school,term,actor,action,json.dumps(detail,ensure_ascii=False),now()))
    def list(self):
        self.actor()
        with self.repo.tx() as db:return [dict(r) for r in db.execute('SELECT id,academic_year,semester,revision,project_json FROM semester_terms WHERE school_id=? ORDER BY academic_year DESC,semester DESC,created_at DESC',(self.school,))]
    def get(self,term_id):
        self.actor()
        with self.repo.tx() as db:r=self._row(db,term_id)
        r['project']=json.loads(r.pop('project_json'));return r
    def create(self,year,semester,name,start,end,copy_id=None):
        actor=self.actor(write=True)
        if not 2020<=int(year)<=2100 or int(semester) not in (1,2) or not name.strip():raise SemesterError('학년도·학기·학기명을 확인하세요.')
        if date.fromisoformat(start)>date.fromisoformat(end):raise SemesterError('학기 시작일이 종료일 이후입니다.')
        with self.repo.tx(True) as db:
            p=empty_project(self.school,year,semester,name,start,end)
            if self.display_name:p['school']['name']=self.display_name
            if copy_id:
                previous=json.loads(self._row(db,copy_id)['project_json']);p.update({k:deepcopy(previous[k]) for k in ('teachers','classes','rooms','subjects','periods_by_day','weights','bell_schedules','legacy_mapping')})
                p['copy_from']=copy_id
                # Students, elective assignments, curriculum and approvals are not silently carried to another scope.
            ident=uid();db.execute('INSERT INTO semester_terms VALUES(?,?,?,?,?,?,?)',(ident,self.school,int(year),int(semester),1,json.dumps(p,ensure_ascii=False),now()))
            db.execute('INSERT INTO semester_term_history VALUES(?,?,?,?,?)',(ident,1,json.dumps(p,ensure_ascii=False),actor,now()))
            self._audit(db,ident,'term_created',actor,{'copy_from':copy_id});return ident
    def save(self,term_id,project,expected_revision):
        actor=self.actor(write=True)
        with self.repo.tx(True) as db:
            r=self._row(db,term_id);before=json.loads(r['project_json']);p=deepcopy(project)
            if r['revision']!=expected_revision:raise RevisionConflict('다른 사용자가 학기 자료를 수정했습니다. 최신 자료를 확인하세요.')
            for k in ('id','academic_year','semester'):
                if p['school'].get(k)!=before['school'].get(k):raise SemesterError('학교·학년도·학기는 작업본에서 변경할 수 없습니다.')
            # Partial drafts may be saved; they cannot be solved or finalized until preflight passes.
            if len(json.dumps(p))>8_000_000:raise SemesterError('입력 자료가 저장 제한을 초과합니다.')
            db.execute('INSERT OR IGNORE INTO semester_term_history VALUES(?,?,?,?,?)',(term_id,expected_revision,r['project_json'],actor,now()))
            db.execute('INSERT INTO semester_term_history VALUES(?,?,?,?,?)',(term_id,expected_revision+1,json.dumps(p,ensure_ascii=False),actor,now()))
            db.execute('UPDATE semester_terms SET revision=?,project_json=? WHERE id=?',(expected_revision+1,json.dumps(p,ensure_ascii=False),term_id))
            self._audit(db,term_id,'draft_saved',actor,{'revision':expected_revision+1});return expected_revision+1
    def candidates(self,term_id):
        self.actor()
        with self.repo.tx() as db:
            self._row(db,term_id)
            return [dict(r) for r in db.execute('SELECT id,source_revision,parent_id,created_at,result_json FROM semester_candidates WHERE term_id=? ORDER BY created_at DESC',(term_id,))]
    def candidate(self,term_id,candidate_id):
        self.actor()
        with self.repo.tx() as db:
            self._row(db,term_id);r=db.execute('SELECT * FROM semester_candidates WHERE id=? AND term_id=?',(candidate_id,term_id)).fetchone()
            if not r:raise SemesterError('후보를 찾을 수 없습니다.')
            r=dict(r)
        r['project']=json.loads(r.pop('project_json'));r['result']=json.loads(r.pop('result_json'));return r
    def add_candidate(self,term_id,revision,input_hash,project,result,parent_id=None):
        actor=self.actor(write=True)
        if result['status'] not in ('FEASIBLE','OPTIMAL'):raise SemesterError('해를 찾은 결과만 후보로 저장할 수 있습니다.')
        errors=validate(project,result['placements'])
        if errors:raise SemesterError(' / '.join(errors[:12]))
        with self.repo.tx(True) as db:
            r=self._row(db,term_id)
            if revision!=r['revision'] or input_hash!=digest(json.loads(r['project_json'])):raise RevisionConflict('계산 중 입력 버전이 변경되었습니다. 결과를 적용하지 않았습니다.')
            ident=uid();db.execute('INSERT INTO semester_candidates VALUES(?,?,?,?,?,?,?,?,?)',(ident,term_id,revision,input_hash,json.dumps(project,ensure_ascii=False),json.dumps(result,ensure_ascii=False),parent_id,now(),actor))
            self._audit(db,term_id,'candidate_created',actor,{'id':ident,'parent':parent_id,'input_hash':input_hash});return ident
    def edit(self,term_id,candidate_id,changes,lock=None):
        self.actor(write=True);candidate=self.candidate(term_id,candidate_id);p=deepcopy(candidate['project']);places=deepcopy(candidate['result']['placements']);lookup={v['session_id']:v for v in places}
        if not changes and lock is None:raise SemesterError('변경이 없습니다.')
        if len({c['session_id'] for c in changes})!=len(changes):raise SemesterError('수업 회차 중복')
        for change in changes:
            if change['session_id'] not in lookup:raise SemesterError('수업 회차가 없습니다.')
            lookup[change['session_id']]['start']=change['start']
            if 'room_id' in change:lookup[change['session_id']]['room_id']=change['room_id']
        if lock is not None:
            ident,enabled=lock;lesson_id=ident.rsplit('#',1)[0]
            lesson=next((l for l in p['lessons'] if l['id']==lesson_id),None)
            if not lesson or ident not in lookup:raise SemesterError('고정할 수업이 없습니다.')
            lesson['fixed_slots']=[lookup[ident]['start']] if enabled else []
        errors=validate(p,places)
        if errors:raise SemesterError('편집 거부: '+' / '.join(errors[:12]))
        from .model import summary
        result={**candidate['result'],'status':'FEASIBLE','placements':places,'metrics':summary(p,places),'engine':'validated manual edit'}
        return self.add_candidate(term_id,candidate['source_revision'],candidate['input_hash'],p,result,candidate_id)
    def finals(self,term_id):
        self.actor()
        with self.repo.tx() as db:
            self._row(db,term_id)
            return [dict(r) for r in db.execute('SELECT id,candidate_id,actor,reason,created_at FROM semester_finals WHERE term_id=? ORDER BY created_at DESC',(term_id,))]
    def finalize(self,term_id,candidate_id,reason,request_key):
        actor=self.actor(confirm=True);c=self.candidate(term_id,candidate_id)
        if len(reason.strip())<3 or not request_key:raise SemesterError('확정 사유와 요청키가 필요합니다.')
        errors=validate(c['project'],c['result']['placements'])
        if errors:raise SemesterError('확정 검증 실패: '+' / '.join(errors))
        signature=digest([term_id,candidate_id,reason,actor])
        with self.repo.tx(True) as db:
            receipt=db.execute('SELECT * FROM semester_receipts WHERE school_id=? AND request_key=?',(self.school,request_key)).fetchone()
            if receipt:
                if receipt['signature']!=signature:raise RevisionConflict('같은 요청키에 다른 확정 내용을 사용할 수 없습니다.')
                return json.loads(receipt['result_json'])
            r=self._row(db,term_id)
            if r['revision']!=c['source_revision'] or digest(json.loads(r['project_json']))!=c['input_hash']:raise RevisionConflict('이전 입력으로 만든 후보는 확정할 수 없습니다.')
            ident=uid();checksum=digest([c['project'],c['result']['placements']])
            db.execute('INSERT INTO semester_finals VALUES(?,?,?,?,?,?,?,?,?)',(ident,term_id,candidate_id,json.dumps(c['project'],ensure_ascii=False),json.dumps(c['result'],ensure_ascii=False),checksum,actor,reason,now()))
            db.execute('INSERT INTO semester_receipts VALUES(?,?,?,?)',(self.school,request_key,signature,json.dumps(ident)))
            self._audit(db,term_id,'finalized',actor,{'version':ident,'checksum':checksum});return ident
    def final(self,term_id,version_id):
        self.actor()
        with self.repo.tx() as db:
            self._row(db,term_id)
            row=db.execute('SELECT * FROM semester_finals WHERE id=? AND term_id=?',(version_id,term_id)).fetchone()
            if not row:raise SemesterError('확정본이 없습니다.')
            row=dict(row)
        row['project']=json.loads(row.pop('project_json'));row['result']=json.loads(row.pop('result_json'))
        if row['checksum']!=digest([row['project'],row['result']['placements']]):raise SemesterError('확정본 체크섬 오류')
        return row

    def activation_blockers(self,db,school,year,semester,effective):
        blockers=[]
        for table in ('daily_states','change_requests'):
            if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",(table,)).fetchone():continue
            if table=='daily_states':
                blockers += [r[0]+': 기존 날짜별 확정·배포 변경' for r in db.execute('SELECT day FROM daily_states WHERE school_id=? AND academic_year=? AND semester=? AND day>=? AND (revision>0 OR published_revision>0)',(school,year,semester,effective))]
            else:
                for r in db.execute("SELECT request_id,expected_json FROM change_requests WHERE school_id=? AND academic_year=? AND semester=? AND status IN ('submitted','reviewing','approved','confirmed')",(school,year,semester)):
                    if any(d>=effective for d in json.loads(r[1])):blockers.append(r[0]+': 기존 변경요청 검토 필요')
        return blockers
    def apply(self,term_id,version_id,effective,expected_pointer=0,legacy_blockers=None):
        actor=self.actor(confirm=True)
        if date.fromisoformat(effective)<self.clock():raise SemesterError('과거 날짜에는 새 기본본을 적용할 수 없습니다.')
        with self.repo.tx(True) as db:
            term=self._row(db,term_id);r=db.execute('SELECT * FROM semester_finals WHERE id=? AND term_id=?',(version_id,term_id)).fetchone()
            if not r:raise SemesterError('이 학교·학기의 확정본이 없습니다.')
            p=json.loads(r['project_json']);result=json.loads(r['result_json'])
            if r['checksum']!=digest([p,result['placements']]):raise SemesterError('확정본 체크섬 불일치')
            for category in ('teachers','classes'):
                names=[p.get('legacy_mapping',{}).get(category,{}).get(r['id'],r.get('name',r['id'])) for r in p[category]]
                if len(set(names))!=len(names):raise SemesterError('기존 조회에 연결할 '+category+' 식별 이름이 중복됩니다. 명시적으로 구분하세요.')
            if not p['term']['starts_at']<=effective<=p['term']['ends_at']:raise SemesterError('적용일이 학기 범위를 벗어납니다.')
            overlaps=db.execute('SELECT p.academic_year,p.semester,p.effective_from,f.project_json FROM semester_pointers p JOIN semester_finals f ON p.version_id=f.id WHERE p.school_id=?',(self.school,)).fetchall()
            for other in overlaps:
                if (other['academic_year'],other['semester'])!=(term['academic_year'],term['semester']):
                    end=json.loads(other['project_json'])['term']['ends_at']
                    if max(effective,other['effective_from'])<=min(p['term']['ends_at'],end):raise SemesterError('다른 학년도·학기의 적용 기간과 겹칩니다.')
            errors=validate(p,result['placements'])
            errors+=self.activation_blockers(db,self.school,term['academic_year'],term['semester'],effective)+(legacy_blockers or [])
            if errors:raise SemesterError('적용 제한: '+' / '.join(errors[:15]))
            pointer=db.execute('SELECT * FROM semester_pointers WHERE school_id=? AND academic_year=? AND semester=? AND effective_from=?',(self.school,term['academic_year'],term['semester'],effective)).fetchone()
            if pointer and pointer['version_id']==version_id and pointer['revision'] in (expected_pointer,expected_pointer+1):return pointer['revision']
            if (pointer['revision'] if pointer else 0)!=expected_pointer:raise RevisionConflict('다른 관리자가 적용 포인터를 변경했습니다.')
            if not db.execute("SELECT 1 FROM sqlite_master WHERE name='base_versions'").fetchone():raise SemesterError('Phase 6 저장소를 먼저 준비해야 합니다.')
            published=deepcopy(p);published['published']={'placements':result['placements']};published['semester_version_id']=version_id
            # Stable IDs remain authoritative; names are only display/legacy mapping metadata.
            base_id='semester-'+uid()
            db.execute('INSERT INTO base_versions VALUES(?,?,?,?,?,?,?,?)',(base_id,self.school,term['academic_year'],term['semester'],effective,json.dumps(published,ensure_ascii=False),now(),actor))
            db.execute('INSERT OR REPLACE INTO semester_pointers VALUES(?,?,?,?,?,?)',(self.school,term['academic_year'],term['semester'],effective,version_id,expected_pointer+1))
            # Unmodified materialized dates may safely follow the new base. Modified dates were blocked above.
            from diple.operations.service import OperationsService
            rows=db.execute('SELECT day FROM daily_states WHERE school_id=? AND academic_year=? AND semester=? AND day>=? AND day<=?',(self.school,term['academic_year'],term['semester'],effective,p['term']['ends_at'])).fetchall()
            for row in rows:
                lessons=OperationsService._lesson_occurrences(published,row[0]);blob=json.dumps(lessons,ensure_ascii=False)
                db.execute('UPDATE daily_states SET base_id=?,draft_json=?,published_json=? WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(base_id,blob,blob,self.school,term['academic_year'],term['semester'],row[0]))
                db.execute('DELETE FROM source_day_versions WHERE school_id=? AND academic_year=? AND semester=? AND day=?',(self.school,term['academic_year'],term['semester'],row[0]))
            self._audit(db,term_id,'applied',actor,{'version':version_id,'effective_from':effective,'previous':pointer['version_id'] if pointer else None,'pointer_revision':expected_pointer+1})
            return expected_pointer+1
    def pointer(self,year,semester,effective):
        self.actor()
        with self.repo.tx() as db:r=db.execute('SELECT * FROM semester_pointers WHERE school_id=? AND academic_year=? AND semester=? AND effective_from=?',(self.school,year,semester,effective)).fetchone()
        return dict(r) if r else None
    def history(self,term_id):
        self.actor()
        with self.repo.tx() as db:
            self._row(db,term_id);return [dict(r) for r in db.execute('SELECT * FROM semester_audit WHERE school_id=? AND term_id=? ORDER BY created_at DESC',(self.school,term_id))]
    def link_credit(self,term_id,expected_revision,plan_id,teacher_map,room_map,replace_ids=None,keep_slots=True,class_map=None):
        self.actor(write=True);term=self.get(term_id);p=deepcopy(term['project'])
        with self.repo.tx() as db:
            if not db.execute("SELECT 1 FROM sqlite_master WHERE name='sectioning_plans'").fetchone():raise SemesterError('저장된 이동반 계획이 없습니다.')
            rec=db.execute('SELECT plan_json,snapshot_id FROM sectioning_plans WHERE school_id=? AND plan_id=?',(self.school,plan_id)).fetchone()
            if not rec:raise SemesterError('학교에 속한 이동반 계획이 없습니다.')
            plan=json.loads(rec[0]);snaprow=db.execute('SELECT snapshot_json FROM snapshots WHERE snapshot_id=?',(rec[1],)).fetchone()
            if not snaprow:raise SemesterError('신청 확정본이 없습니다.')
            snap=json.loads(snaprow[0])
        from diple.sectioning import validate_plan
        if validate_plan(snap,plan):raise SemesterError('이동반 원본 검증 실패')
        if int(plan['academic_year'])!=term['academic_year'] or int(plan['semester'])!=term['semester']:raise SemesterError('학년도·학기가 다른 분반입니다.')
        if any(x['plan_id']==plan_id for x in p['credit_links']):raise SemesterError('이미 연결한 분반입니다.')
        replace_ids=set(replace_ids or [])
        if replace_ids-{r['id'] for r in p['curriculum']}:raise SemesterError('대체할 수업 ID가 없습니다.')
        p['curriculum']=[r for r in p['curriculum'] if r['id'] not in replace_ids]
        for student in snap['students']:
            student=deepcopy(student);student['class_id']=(class_map or {}).get(student['class_id'],student['class_id'])
            if not any(c['id']==student['class_id'] for c in p['classes']):raise SemesterError('학생 소속 학급 ID 매핑 필요: '+student['class_id'])
            existing=next((s for s in p['students'] if s['id']==student['student_id']),None)
            if existing and existing['class_id']!=student['class_id']:raise SemesterError('동일 학생 ID의 소속 학급이 다릅니다: '+student['student_id'])
            if not existing:p['students'].append({'id':student['student_id'],'class_id':student['class_id'],'name':student.get('name',student['student_id'])})
        course={o['offering_id']:o for o in snap['offerings']}
        for section in plan['sections']:
            sid=section['section_id'];teacher=teacher_map.get(sid,section.get('teacher_id'));room=room_map.get(sid,section.get('room_id'))
            if teacher not in {t['id'] for t in p['teachers']} or room not in {r['id'] for r in p['rooms']}:raise SemesterError(sid+': 교사·교실 ID 매핑 필요')
            o=course[section['offering_id']]
            if not any(s['id']==o['course_id'] for s in p['subjects']):p['subjects'].append({'id':o['course_id'],'name':o['course_name'],'credits':o['credits']})
            members=[a['student_id'] for a in plan['assignments'] if a['section_id']==sid]
            units=int(section['units']);slots=section.get('slots',[])
            if keep_slots and len(slots)!=units:raise SemesterError('고정 배치할 실제 요일·교시가 없습니다.')
            # Actual saved slots can be split (e.g. 2+1); reflow preserves relative virtual blocks.
            row={'id':'credit-'+sid,'subject_id':o['course_id'],'teacher_ids':[teacher],'class_ids':[],'student_ids':members,'room_ids':[room],
                 'weekly_periods':units,'split':[1]*units if keep_slots else [units],'fixed_slots':slots if keep_slots else [],'forbidden_slots':[],'source_plan_id':plan_id}
            if not keep_slots:
                group=next(g for g in plan['groups'] if g['group_id']==section['group_id'])
                row.update(timing_block=plan_id+':'+section['group_id']+':'+str(section['lane']),timing_offset=section['offset'],timing_block_length=group['lane_units'])
            p['curriculum'].append(row)
        p['credit_links'].append({'plan_id':plan_id,'snapshot_id':snap['snapshot_id'],'replaced_ids':sorted(replace_ids),'keep_slots':keep_slots})
        compile_project(p)
        return self.save(term_id,p,expected_revision)

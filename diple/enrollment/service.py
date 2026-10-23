"""Student enrollment domain service: all permission checks run in Python server.

Local SQLite transactions are safe against simultaneous writers on ONE host.
They do not make ephemeral Streamlit Cloud filesystem a durable database.
"""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import hashlib
import hmac
import json
import secrets
import sqlite3
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, VerificationError
from .repository import SQLiteEnrollmentRepository, j, unj

PASSWORD_HASHER=PasswordHasher(time_cost=2,memory_cost=19456,parallelism=1,hash_len=32,salt_len=16,type=Type.ID)
STATES=['작성 중','게시됨','신청 진행','신청 마감','검토 중','최종 확정','분반 전달']
ALLOWED={'작성 중':['게시됨'],'게시됨':['신청 진행','신청 마감'],
         '신청 진행':['신청 마감'],'신청 마감':['검토 중'],
         '검토 중':['최종 확정'],'최종 확정':['분반 전달'], '분반 전달':[]}
VALID_STATUS={'재학','전입','전출','휴학','졸업'}


def utcnow():
    return datetime.now(timezone.utc).isoformat()


def utc_parse(s):
    v=datetime.fromisoformat(s.replace('Z','+00:00'))
    if v.tzinfo is None:
        raise EnrollmentError('일시는 시간대(+09:00 또는 UTC)를 포함해야 합니다.')
    return v.astimezone(timezone.utc)


def uid():
    return str(uuid4())


class EnrollmentError(ValueError):
    pass


class AccessDenied(EnrollmentError):
    pass


class VersionConflict(EnrollmentError):
    pass


class EnrollmentService:
    def __init__(self, repo=None, path='diple-enrollment-local.sqlite3'):
        self.repo=repo or SQLiteEnrollmentRepository(path)

    def _audit(self, db, school, actor, action, campaign=None, reason='', detail=None):
        db.execute('INSERT INTO audit VALUES (?,?,?,?,?,?,?,?)',
                   (uid(),school,campaign,actor,action,reason,j(detail or {}),utcnow()))

    def bootstrap_admin(self, school_id, username, password, trusted_hash):
        """One-time bootstrap requires a hash from private Streamlit Secrets.

        Never allow caller-controlled trusted_hash from a browser field.
        """
        if not trusted_hash or not trusted_hash.startswith('$argon2id$'):
            raise AccessDenied('보안 설정에 관리자 Argon2id 해시가 없습니다.')
        try:
            PASSWORD_HASHER.verify(trusted_hash,password)
        except (VerifyMismatchError,VerificationError):
            raise AccessDenied('인증 정보가 일치하지 않습니다.') from None
        with self.repo.tx(True) as db:
            count=db.execute("SELECT count(*) FROM accounts WHERE school_id=? AND role='admin'",(school_id,)).fetchone()[0]
            if count:
                return False
            db.execute('INSERT INTO accounts(account_id,school_id,username,role,password_hash) VALUES (?,?,?,?,?)',
                       (uid(),school_id,username,'admin',trusted_hash))
            self._audit(db,school_id,'system','admin_bootstrap')
            return True

    def _acct(self, db, school, username):
        return db.execute('SELECT * FROM accounts WHERE school_id=? AND username=?',(school,username)).fetchone()

    def activate(self, school_id, student_id, code, new_password):
        if len(new_password)<12 or len(new_password)>256:
            raise EnrollmentError('새 비밀번호는 12~256자로 설정해 주세요.')
        with self.repo.tx(True) as db:
            account=self._acct(db,school_id,student_id)
            if not account or account['role']!='student' or not account['activation_hash']:
                raise AccessDenied('활성화 정보가 올바르지 않습니다.')
            if not hmac.compare_digest(account['activation_hash'], hashlib.sha256(code.encode()).hexdigest()):
                raise AccessDenied('활성화 정보가 올바르지 않습니다.')
            db.execute('UPDATE accounts SET password_hash=?,activation_hash=NULL,failed_count=0,locked_until=NULL WHERE account_id=?',
                       (PASSWORD_HASHER.hash(new_password),account['account_id']))
            self._audit(db,school_id,student_id,'account_activate')

    def reset_activation(self, admin_token, school_id, student_id, reason):
        actor=self._authorize(admin_token,school_id,'admin')
        if len(reason.strip())<4:
            raise EnrollmentError('비밀번호 초기화 사유를 4자 이상 입력하세요.')
        code=secrets.token_urlsafe(18)
        with self.repo.tx(True) as db:
            row=self._acct(db,school_id,student_id)
            if not row or row['role']!='student':
                raise EnrollmentError('학생 계정을 찾을 수 없습니다.')
            db.execute('UPDATE accounts SET password_hash=NULL,activation_hash=?,failed_count=0,locked_until=NULL WHERE account_id=?',
                       (hashlib.sha256(code.encode()).hexdigest(),row['account_id']))
            db.execute('DELETE FROM auth_sessions WHERE account_id=?',(row['account_id'],))
            self._audit(db,school_id,actor['username'],'reset_activation',reason=reason,detail={'student_id':student_id})
        return code

    def login(self, school_id, username, password):
        now=datetime.now(timezone.utc)
        with self.repo.tx(True) as db:
            account=self._acct(db,school_id,username)
            if not account or not account['password_hash']:
                raise AccessDenied('로그인 정보가 올바르지 않습니다.')
            if account['locked_until'] and utc_parse(account['locked_until'])>now:
                raise AccessDenied('계정이 잠겼습니다. 관리자에게 문의하세요.')
            try:
                valid=PASSWORD_HASHER.verify(account['password_hash'],password)
            except (VerifyMismatchError,VerificationError):
                valid=False
            if not valid:
                fails=int(account['failed_count'])+1
                lock=(now+timedelta(minutes=15)).isoformat() if fails>=5 else None
                db.execute('UPDATE accounts SET failed_count=?,locked_until=? WHERE account_id=?',(fails,lock,account['account_id']))
                raise_login=True
            else:
                raise_login=False
                if account['role']=='student':
                    student=db.execute('SELECT * FROM students WHERE student_id=? AND school_id=? ORDER BY academic_year DESC,semester DESC LIMIT 1',
                                       (account['student_id'],school_id)).fetchone()
                    if not student or not student['eligible'] or student['status'] not in ('재학','전입'):
                        raise AccessDenied('현재 수강신청 권한이 없는 학생입니다.')
                db.execute('UPDATE accounts SET failed_count=0,locked_until=NULL WHERE account_id=?',(account['account_id'],))
                token=secrets.token_urlsafe(40)
                expiry=(now+timedelta(minutes=30)).isoformat()
                db.execute('INSERT INTO auth_sessions VALUES (?,?,?)',
                           (hashlib.sha256(token.encode()).hexdigest(), account['account_id'], expiry))
        if raise_login:
            raise AccessDenied('로그인 정보가 올바르지 않습니다.')
        return token

    def logout(self, token):
        with self.repo.tx(True) as db:
            db.execute('DELETE FROM auth_sessions WHERE token_hash=?',(hashlib.sha256(token.encode()).hexdigest(),))

    def _authorize(self, token, school_id=None, role=None):
        if not token:
            raise AccessDenied('로그인이 필요합니다.')
        token_hash=hashlib.sha256(token.encode()).hexdigest()
        with self.repo.tx() as db:
            row=db.execute('SELECT a.*,s.expires_at FROM auth_sessions s JOIN accounts a ON a.account_id=s.account_id '
                           'WHERE s.token_hash=?',(token_hash,)).fetchone()
            if not row or utc_parse(row['expires_at'])<=datetime.now(timezone.utc):
                raise AccessDenied('로그인 시간이 만료되었습니다. 다시 로그인하세요.')
            if school_id is not None and row['school_id']!=school_id:
                raise AccessDenied('다른 학교의 자료에 접근할 수 없습니다.')
            if role is not None and row['role']!=role:
                raise AccessDenied('권한이 없습니다.')
            return dict(row)

    def session_info(self, token):
        row=self._authorize(token)
        return {k:row[k] for k in ('school_id','role','student_id','username')}

    def _campaign(self, db, campaign_id, school_id):
        row=db.execute('SELECT * FROM campaigns WHERE campaign_id=? AND school_id=?',(campaign_id,school_id)).fetchone()
        if not row:
            raise EnrollmentError('대상 수강신청이 존재하지 않습니다.')
        return dict(row)

    def create_campaign(self, admin_token, school_id, data):
        actor=self._authorize(admin_token,school_id,'admin')
        starts=utc_parse(data['starts_at']);ends=utc_parse(data['ends_at']);edits=utc_parse(data['edits_until'])
        if starts>=ends or edits<starts:
            raise EnrollmentError('신청 시작·종료 및 수정 가능 기간을 다시 확인하세요.')
        if int(data['grade']) not in (1,2,3):
            raise EnrollmentError('대상 학년은 1~3입니다.')
        campaign_id=uid();now=utcnow()
        fields=(campaign_id,school_id,int(data['academic_year']),int(data['semester']),data['title'].strip(),
                int(data['grade']),j(data.get('class_ids',[])),data['manager'],starts.isoformat(),ends.isoformat(),
                edits.isoformat(),data.get('campaign_type','본신청'),data.get('confirm_method','관리자 확인'),
                data.get('notice',''),data.get('contact',''),int(data.get('min_total_credits',0)),
                int(data.get('max_total_credits',999)),now,now)
        with self.repo.tx(True) as db:
            db.execute('INSERT INTO campaigns(campaign_id,school_id,academic_year,semester,title,grade,class_ids_json,manager,'
                       'starts_at,ends_at,edits_until,campaign_type,confirm_method,notice,contact,min_total_credits,max_total_credits,created_at,updated_at) '
                       'VALUES ('+','.join(['?']*len(fields))+')',fields)
            self._audit(db,school_id,actor['username'],'create_campaign',campaign_id)
        return campaign_id

    def list_campaigns(self, token, school_id, student_only=False):
        actor=self._authorize(token,school_id)
        with self.repo.tx() as db:
            rows=[dict(r) for r in db.execute('SELECT * FROM campaigns WHERE school_id=? ORDER BY created_at DESC',(school_id,))]
            if actor['role']=='admin' and not student_only:
                return rows
            if actor['role']!='student':
                return []
            eligible=[]
            for r in rows:
                student=db.execute('SELECT * FROM students WHERE student_id=? AND school_id=? AND academic_year=? AND semester=?',
                                   (actor['student_id'],school_id,r['academic_year'],r['semester'])).fetchone()
                if student and r['published'] and student['eligible'] and student['status'] in ('재학','전입') \
                   and r['grade']==student['grade'] \
                   and (not unj(r['class_ids_json']) or student['class_id'] in unj(r['class_ids_json'])):
                    eligible.append(r)
            return eligible

    def add_group(self, token, school_id, campaign_id, name, min_count, max_count, *, required=True,
                  min_credits=0,max_credits=999,target_units=None):
        actor=self._authorize(token,school_id,'admin')
        if min_count<0 or max_count<min_count or min_credits<0 or max_credits<min_credits:
            raise EnrollmentError('과목 수와 학점 범위를 확인하세요.')
        gid=uid()
        with self.repo.tx(True) as db:
            self._assert_editable(db,campaign_id,school_id)
            db.execute('INSERT INTO choice_groups VALUES (?,?,?,?,?,?,?,?,?)',
                       (gid,campaign_id,name,int(required),min_count,max_count,min_credits,max_credits,target_units))
            self._audit(db,school_id,actor['username'],'add_group',campaign_id,detail={'group_id':gid})
        return gid

    def add_offering(self, token, school_id, campaign_id, group_id, *, course_id,course_name,credits,units=None,
                     min_students=0,planned_capacity=999,section_capacity=32,prerequisites=None,exclusions=None,
                     allowed_grades=None,allowed_classes=None,joint_education=False,availability='개설 예정'):
        actor=self._authorize(token,school_id,'admin')
        if int(credits)<=0 or int(units if units is not None else credits)<=0 or int(section_capacity)<=0:
            raise EnrollmentError('학점·구획 단위·분반 정원은 양수여야 합니다.')
        offering_id=uid()
        with self.repo.tx(True) as db:
            self._assert_editable(db,campaign_id,school_id)
            grp=db.execute('SELECT 1 FROM choice_groups WHERE group_id=? AND campaign_id=?',(group_id,campaign_id)).fetchone()
            if not grp:
                raise EnrollmentError('이 수강신청의 과목 그룹이 아닙니다.')
            db.execute('INSERT INTO offerings(offering_id,campaign_id,group_id,course_id,course_name,credits,units,'
                       'min_students,planned_capacity,section_capacity,prerequisites_json,exclusions_json,'
                       'allowed_grade_json,allowed_class_json,joint_education,availability) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                       (offering_id,campaign_id,group_id,course_id,course_name,int(credits),int(units if units is not None else credits),
                        int(min_students),int(planned_capacity),int(section_capacity),j(prerequisites or []),j(exclusions or []),
                        j(allowed_grades or []),j(allowed_classes or []),int(joint_education),availability))
            self._audit(db,school_id,actor['username'],'add_offering',campaign_id,
                        detail={'offering_id':offering_id,'course_id':course_id})
        return offering_id

    def _assert_editable(self, db, campaign_id, school_id):
        c=self._campaign(db,campaign_id,school_id)
        if c['state']!='작성 중':
            raise EnrollmentError('게시 이후 그룹/과목 변경은 제출 이력 보호를 위해 차단됩니다. 새 회차를 생성하세요.')
        return c

    def publish(self, token, school_id, campaign_id):
        actor=self._authorize(token,school_id,'admin')
        with self.repo.tx(True) as db:
            c=self._assert_editable(db,campaign_id,school_id)
            groups=db.execute('SELECT * FROM choice_groups WHERE campaign_id=?',(campaign_id,)).fetchall()
            if not groups:
                raise EnrollmentError('선택 그룹이 없습니다.')
            for g in groups:
                count=db.execute('SELECT count(*) FROM offerings WHERE group_id=?',(g['group_id'],)).fetchone()[0]
                if count<g['min_count']:
                    raise EnrollmentError(f"{g['name']}: 선택 가능한 과목 수가 부족합니다.")
            db.execute("UPDATE campaigns SET state='게시됨',published=1,revision=revision+1,updated_at=? WHERE campaign_id=?",(utcnow(),campaign_id))
            self._audit(db,school_id,actor['username'],'publish',campaign_id)

    def advance(self, token, school_id, campaign_id, next_state, reason=''):
        actor=self._authorize(token,school_id,'admin')
        with self.repo.tx(True) as db:
            campaign=self._campaign(db,campaign_id,school_id)
            if next_state not in ALLOWED.get(campaign['state'],[]):
                raise EnrollmentError(f"허용되지 않은 상태 변경: {campaign['state']} → {next_state}")
            if next_state=='최종 확정':
                raise EnrollmentError('확정은 전체 검증과 스냅샷 생성으로만 실행할 수 있습니다.')
            if next_state=='분반 전달':
                ok=db.execute('SELECT 1 FROM snapshots WHERE campaign_id=?',(campaign_id,)).fetchone()
                if not ok: raise EnrollmentError('확정된 스냅샷이 없습니다.')
            db.execute('UPDATE campaigns SET state=?,updated_at=? WHERE campaign_id=?',
                       (next_state,utcnow(),campaign_id))
            self._audit(db,school_id,actor['username'],'change_state',campaign_id,reason,{'state':next_state})

    def roster_report(self, token, school_id,year,semester, rows, valid_classes):
        self._authorize(token,school_id,'admin')
        errors=[]; seen_ids=set(); seen_number=set(); prepared=[]
        existing={r['student_id']:r for r in self.repo.run_read('SELECT * FROM students WHERE school_id=?',(school_id,))}
        for num,row in enumerate(rows,start=2):
            try:
                sid=str(row.get('student_id') or '').strip()
                grade=int(row['grade']);class_id=str(row['class_id']).strip();number=int(row['number']);name=str(row['name']).strip()
                status=str(row.get('status','재학')).strip();eligible=bool(row.get('eligible',True))
                cyear=int(row.get('academic_year',year));cterm=int(row.get('semester',semester))
                if not sid: raise EnrollmentError('student_id: 학생 내부 ID 누락')
                if not name: raise EnrollmentError('name: 학생 이름 누락')
                if grade not in (1,2,3): raise EnrollmentError('grade: 1~3학년만 허용')
                if number<=0: raise EnrollmentError('number: 번호는 1 이상')
                if (cyear,cterm)!=(year,semester): raise EnrollmentError('academic_year/semester: 불일치')
                if class_id not in valid_classes: raise EnrollmentError('class_id: 존재하지 않는 학급 ID')
                if isinstance(valid_classes,dict) and int(valid_classes[class_id])!=grade:
                    raise EnrollmentError('class_id/grade: 학급의 학년 정보와 불일치')
                if status not in VALID_STATUS: raise EnrollmentError('status: 허용되지 않는 재학 상태')
                k=(grade,class_id,number)
                if sid in seen_ids: raise EnrollmentError('student_id: 파일 내 학생 ID 중복')
                if k in seen_number: raise EnrollmentError('grade/class_id/number: 학적 정보 중복')
                old=existing.get(sid)
                if old and old['school_id']!=school_id: raise EnrollmentError('student_id: 다른 학교의 내부 ID')
                seen_ids.add(sid);seen_number.add(k)
                prepared.append({'student_id':sid,'school_id':school_id,'academic_year':year,'semester':semester,
                                 'grade':grade,'class_id':class_id,'number':number,'name':name,'status':status,
                                 'eligible':int(eligible),'prior_courses':row.get('prior_courses',[]) if isinstance(row.get('prior_courses',[]),list) else [],
                                 'change':'수정' if old else '신규'})
            except (ValueError,KeyError,TypeError,EnrollmentError) as exc:
                detail=str(exc)
                col=detail.split(':',1)[0] if ':' in detail else '필수 필드/학적'
                if isinstance(exc,KeyError):col=str(exc).strip("'")
                errors.append({'행':num,'열':col,'오류':detail,'수정 방법':'해당 열과 기존 명렬을 대조하여 수정 후 재검증'})
        for row in prepared:
            with_conflict=self.repo.run_read('SELECT student_id FROM students WHERE school_id=? AND academic_year=? AND semester=? AND '
                                             'grade=? AND class_id=? AND number=?',
                                             (school_id,year,semester,row['grade'],row['class_id'],row['number']))
            if with_conflict and with_conflict[0]['student_id']!=row['student_id']:
                errors.append({'행':next(i+2 for i,r in enumerate(rows) if str(r.get('student_id'))==row['student_id']),
                               '열':'student_id','오류':'해당 학적에 다른 학생 ID 존재','수정 방법':'전입·학적 변경 여부를 확인'})
        return {'valid':not errors,'errors':errors,'rows':prepared}

    def import_roster(self, token,school_id,year,semester,rows,valid_classes):
        actor=self._authorize(token,school_id,'admin')
        report=self.roster_report(token,school_id,year,semester,rows,valid_classes)
        if not report['valid']:
            raise EnrollmentError(f"일괄 업로드 오류 {len(report['errors'])}건. 반영하지 않았습니다.")
        codes=[]
        with self.repo.tx(True) as db:
            for s in report['rows']:
                old=db.execute('SELECT * FROM students WHERE student_id=? AND school_id=? AND academic_year=? AND semester=?',
                               (s['student_id'],school_id,year,semester)).fetchone()
                if old and old['school_id']!=school_id:
                    raise AccessDenied('다른 학교의 학생 ID를 재사용할 수 없습니다.')
                db.execute('INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(student_id,school_id,academic_year,semester) DO UPDATE SET '
                           'academic_year=excluded.academic_year,semester=excluded.semester,grade=excluded.grade,'
                           'class_id=excluded.class_id,number=excluded.number,name=excluded.name,status=excluded.status,'
                           'eligible=excluded.eligible,prior_courses=excluded.prior_courses,updated_at=excluded.updated_at',
                           (s['student_id'],school_id,year,semester,s['grade'],s['class_id'],s['number'],s['name'],
                            s['status'],s['eligible'],j(s['prior_courses']),utcnow()))
                account=db.execute('SELECT 1 FROM accounts WHERE school_id=? AND username=?',(school_id,s['student_id'])).fetchone()
                if not account:
                    code=secrets.token_urlsafe(18)
                    db.execute('INSERT INTO accounts(account_id,school_id,username,role,student_id,activation_hash) VALUES (?,?,?,?,?,?)',
                               (uid(),school_id,s['student_id'],'student',s['student_id'],hashlib.sha256(code.encode()).hexdigest()))
                    codes.append({'student_id':s['student_id'],'activation_code':code})
            self._audit(db,school_id,actor['username'],'import_roster',detail={'count':len(rows),'new_codes':len(codes)})
        return codes

    def catalog(self,token,school_id,campaign_id):
        actor=self._authorize(token,school_id)
        with self.repo.tx() as db:
            c=self._campaign(db,campaign_id,school_id)
            if actor['role']=='student':
                self._eligible(db,actor,c)
                if not c['published']:raise AccessDenied('게시되지 않은 신청입니다.')
            groups=[dict(r) for r in db.execute('SELECT * FROM choice_groups WHERE campaign_id=? ORDER BY rowid',(campaign_id,))]
            offerings=[dict(r) for r in db.execute('SELECT * FROM offerings WHERE campaign_id=? ORDER BY rowid',(campaign_id,))]
            return {'campaign':c,'groups':groups,'offerings':offerings}

    def _eligible(self,db,actor,c):
        if actor['role']!='student':raise AccessDenied('학생 계정이 필요합니다.')
        student=db.execute('SELECT * FROM students WHERE student_id=? AND school_id=? AND academic_year=? AND semester=?',
                           (actor['student_id'],c['school_id'],c['academic_year'],c['semester'])).fetchone()
        if not student or not student['eligible'] or student['status'] not in ('재학','전입'):
            raise AccessDenied('신청 가능한 학생이 아닙니다.')
        if (student['academic_year'],student['semester'],student['grade'])!=(c['academic_year'],c['semester'],c['grade']):
            raise AccessDenied('대상 학년도·학기·학년과 다릅니다.')
        if unj(c['class_ids_json']) and student['class_id'] not in unj(c['class_ids_json']):
            raise AccessDenied('대상 학급이 아닙니다.')
        return student

    def validate_choices(self,db,c,student,choices):
        errors=[]
        if not isinstance(choices,list) or any(not isinstance(x,str) for x in choices):
            return ['과목 선택 형식이 올바르지 않습니다.']
        if len(set(choices))!=len(choices): errors.append('동일 과목이 두 번 선택되었습니다.')
        groups=[dict(x) for x in db.execute('SELECT * FROM choice_groups WHERE campaign_id=?',(c['campaign_id'],))]
        offerings={x['offering_id']:dict(x) for x in db.execute('SELECT * FROM offerings WHERE campaign_id=?',(c['campaign_id'],))}
        for ident in choices:
            if ident not in offerings:errors.append(f'신청할 수 없는 과목 ID: {ident}')
        selected=[offerings[s] for s in choices if s in offerings]
        selected_course_ids=[s['course_id'] for s in selected]
        if len(set(selected_course_ids))!=len(selected_course_ids):errors.append('여러 그룹에서 같은 과목을 중복 신청했습니다.')
        for g in groups:
            rows=[x for x in selected if x['group_id']==g['group_id']]
            if not g['required'] and not rows: continue
            if not g['min_count']<=len(rows)<=g['max_count']:
                errors.append(f"{g['name']}: 선택 {len(rows)}개 / 허용 {g['min_count']}~{g['max_count']}개")
            credits=sum(x['credits'] for x in rows)
            if not g['min_credits']<=credits<=g['max_credits']:
                errors.append(f"{g['name']}: 학점 {credits} / 허용 {g['min_credits']}~{g['max_credits']}")
            if g['target_units'] is not None and sum(x['units'] for x in rows)!=g['target_units']:
                errors.append(f"{g['name']}: 운영구획 단위합 {sum(x['units'] for x in rows)} / 필요 {g['target_units']}")
        total=sum(x['credits'] for x in selected)
        if not c['min_total_credits']<=total<=c['max_total_credits']:
            errors.append(f"전체 학점 {total} / 허용 {c['min_total_credits']}~{c['max_total_credits']}")
        completed=set(unj(student['prior_courses']))
        for x in selected:
            if x['availability']=='폐강':errors.append(f"{x['course_name']}: 폐강 과목입니다.")
            if unj(x['allowed_grade_json']) and student['grade'] not in unj(x['allowed_grade_json']):
                errors.append(f"{x['course_name']}: 학년 신청 조건 불충족")
            if unj(x['allowed_class_json']) and student['class_id'] not in unj(x['allowed_class_json']):
                errors.append(f"{x['course_name']}: 학급 신청 조건 불충족")
            missing=set(unj(x['prerequisites_json']))-completed
            if missing: errors.append(f"{x['course_name']}: 선이수 과목 부족 {sorted(missing)}")
            if set(unj(x['exclusions_json']))&set(selected_course_ids):
                errors.append(f"{x['course_name']}: 상호배제 과목과 동시 선택 불가")
        return errors

    def _check_open(self,c,for_edit=False):
        now=datetime.now(timezone.utc)
        close=utc_parse(c['edits_until'] if for_edit else c['ends_at'])
        if not c['published'] or c['state'] not in ('게시됨','신청 진행'):
            raise EnrollmentError('현재 신청을 받지 않는 회차입니다.')
        if not (utc_parse(c['starts_at'])<=now<=close):
            raise EnrollmentError('현재 신청 가능 기간이 아닙니다.')

    def my_submission(self,token,school_id,campaign_id):
        actor=self._authorize(token,school_id,'student')
        with self.repo.tx() as db:
            c=self._campaign(db,campaign_id,school_id)
            self._eligible(db,actor,c)
            curr=db.execute('SELECT s.*,cur.version FROM current_submissions cur JOIN submissions s ON cur.submission_id=s.submission_id '
                            'WHERE cur.campaign_id=? AND cur.student_id=?',(campaign_id,actor['student_id'])).fetchone()
            draft=db.execute('SELECT * FROM drafts WHERE campaign_id=? AND student_id=?',(campaign_id,actor['student_id'])).fetchone()
            return {'current': {**dict(curr),'choices':unj(curr['choices_json'])} if curr else None,
                    'draft':{**dict(draft),'choices':unj(draft['choices_json'])} if draft else None,
                    'version':int(curr['version']) if curr else 0}

    def save_draft(self,token,school_id,campaign_id,choices):
        actor=self._authorize(token,school_id,'student')
        with self.repo.tx(True) as db:
            c=self._campaign(db,campaign_id,school_id)
            self._eligible(db,actor,c);has_current=db.execute('SELECT 1 FROM current_submissions WHERE campaign_id=? AND student_id=?',
                                   (campaign_id,actor['student_id'])).fetchone()
            self._check_open(c,for_edit=bool(has_current))
            if not isinstance(choices,list):raise EnrollmentError('신청 형식 오류')
            row=db.execute('SELECT revision FROM drafts WHERE campaign_id=? AND student_id=?',
                           (campaign_id,actor['student_id'])).fetchone()
            rev=int(row['revision'])+1 if row else 1
            db.execute('INSERT INTO drafts VALUES (?,?,?,?,?) ON CONFLICT(campaign_id,student_id) DO UPDATE SET '
                       'choices_json=excluded.choices_json,revision=excluded.revision,saved_at=excluded.saved_at',
                       (campaign_id,actor['student_id'],j(choices),rev,utcnow()))
        return rev

    def submit(self,token,school_id,campaign_id,choices,request_key,expected_version=0):
        actor=self._authorize(token,school_id,'student')
        if len(request_key)<12 or len(request_key)>128:
            raise EnrollmentError('유효한 중복요청 방지 키가 필요합니다.')
        with self.repo.tx(True) as db:
            c=self._campaign(db,campaign_id,school_id)
            student=self._eligible(db,actor,c)
            duplicate=db.execute('SELECT * FROM submissions WHERE campaign_id=? AND student_id=? AND request_key=?',
                                 (campaign_id,actor['student_id'],request_key)).fetchone()
            if duplicate:
                if unj(duplicate['choices_json'])!=choices:
                    raise EnrollmentError('이미 사용한 요청 키가 다른 선택 내용으로 재사용되었습니다.')
                return {'receipt':duplicate['receipt'],'submission_id':duplicate['submission_id'],'duplicate':True}
            current=db.execute('SELECT * FROM current_submissions WHERE campaign_id=? AND student_id=?',
                               (campaign_id,actor['student_id'])).fetchone()
            self._check_open(c,for_edit=bool(current))
            errors=self.validate_choices(db,c,student,choices)
            if errors:raise EnrollmentError(' / '.join(errors))
            old_version=int(current['version']) if current else 0
            if old_version!=expected_version:
                raise VersionConflict('다른 창에서 신청 내역이 변경되었습니다. 다시 조회한 뒤 재제출하세요.')
            subid=uid();receipt=f"ENR-{c['academic_year']}-{secrets.token_hex(6).upper()}"
            db.execute('INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?)',
                       (subid,receipt,campaign_id,actor['student_id'],request_key,j(choices),c['revision'],utcnow()))
            db.execute('INSERT INTO current_submissions VALUES (?,?,?,?) ON CONFLICT(campaign_id,student_id) DO UPDATE SET '
                       'submission_id=excluded.submission_id,version=excluded.version',
                       (campaign_id,actor['student_id'],subid,old_version+1))
            db.execute('DELETE FROM drafts WHERE campaign_id=? AND student_id=?',(campaign_id,actor['student_id']))
            self._audit(db,school_id,actor['username'],'student_submit',campaign_id,detail={'receipt':receipt,'version':old_version+1})
            return {'receipt':receipt,'submission_id':subid,'duplicate':False}

    def my_profile(self,token,school_id):
        actor=self._authorize(token,school_id,'student')
        rows=self.repo.run_read('SELECT student_id,name,academic_year,semester,grade,class_id,number,status,eligible FROM students '
                                'WHERE student_id=? AND school_id=? ORDER BY academic_year DESC,semester DESC',
                                (actor['student_id'],school_id))
        return rows

    def cancel(self,token,school_id,campaign_id):
        """Cancel the active submission while retaining all immutable submission history."""
        actor=self._authorize(token,school_id,'student')
        with self.repo.tx(True) as db:
            c=self._campaign(db,campaign_id,school_id)
            self._eligible(db,actor,c);self._check_open(c,for_edit=True)
            current=db.execute('SELECT * FROM current_submissions WHERE campaign_id=? AND student_id=?',
                               (campaign_id,actor['student_id'])).fetchone()
            if not current:raise EnrollmentError('취소할 현재 유효 신청이 없습니다.')
            db.execute('DELETE FROM current_submissions WHERE campaign_id=? AND student_id=?',
                       (campaign_id,actor['student_id']))
            self._audit(db,school_id,actor['username'],'cancel_submission',campaign_id,
                        detail={'former_submission_id':current['submission_id']})

    def history(self,token,school_id,campaign_id):
        actor=self._authorize(token,school_id,'student')
        with self.repo.tx() as db:
            c=self._campaign(db,campaign_id,school_id);self._eligible(db,actor,c)
            return [dict(r) for r in db.execute('SELECT receipt,choices_json,submitted_at,campaign_revision FROM submissions '
                                                 'WHERE campaign_id=? AND student_id=? ORDER BY submitted_at DESC',
                                                 (campaign_id,actor['student_id']))]

    def dashboard(self,token,school_id,campaign_id):
        self._authorize(token,school_id,'admin')
        with self.repo.tx() as db:
            c=self._campaign(db,campaign_id,school_id)
            roster=[dict(x) for x in db.execute('SELECT * FROM students WHERE school_id=? AND academic_year=? AND semester=? AND grade=? '
                                                "AND eligible=1 AND status IN ('재학','전입')",
                                                (school_id,c['academic_year'],c['semester'],c['grade']))]
            cls=set(unj(c['class_ids_json']))
            roster=[s for s in roster if not cls or s['class_id'] in cls]
            current={r['student_id']:dict(r) for r in db.execute('SELECT cur.student_id,s.choices_json,s.receipt FROM current_submissions cur '
                                                                 'JOIN submissions s ON cur.submission_id=s.submission_id WHERE cur.campaign_id=?',(campaign_id,))}
            counts={r['offering_id']:0 for r in db.execute('SELECT offering_id FROM offerings WHERE campaign_id=?',(campaign_id,))}
            problems=[]
            for s in roster:
                if s['student_id'] in current:
                    choices=unj(current[s['student_id']]['choices_json'])
                    for offering_id in choices:
                        if offering_id in counts:counts[offering_id]+=1
                    errs=self.validate_choices(db,c,s,choices)
                    if errs:problems.append({'student_id':s['student_id'],'errors':errs})
            offerings=[dict(r) for r in db.execute('SELECT * FROM offerings WHERE campaign_id=?',(campaign_id,))]
            subjects=[{**x,'applicants':counts[x['offering_id']],
                       'below_minimum':counts[x['offering_id']]<x['min_students'],
                       'over_plan':counts[x['offering_id']]>x['planned_capacity']} for x in offerings]
            missing=[{k:s[k] for k in ('student_id','grade','class_id','number','name')} for s in roster if s['student_id'] not in current]
            return {'campaign':c,'eligible':len(roster),'submitted':len(roster)-len(missing),'missing':missing,
                    'problem_count':len(problems),'problems':problems,'courses':subjects,
                    'submission_rate':round(100*(len(roster)-len(missing))/len(roster),1) if roster else 0}

    def finalize(self,token,school_id,campaign_id,*,ack_missing=False,reason='최초 확정'):
        actor=self._authorize(token,school_id,'admin')
        with self.repo.tx(True) as db:
            c=self._campaign(db,campaign_id,school_id)
            if c['state']!='검토 중':raise EnrollmentError('신청 마감 후 검토 중 상태에서만 확정할 수 있습니다.')
            roster=[dict(x) for x in db.execute('SELECT * FROM students WHERE school_id=? AND academic_year=? AND semester=? AND grade=? '
                                                "AND eligible=1 AND status IN ('재학','전입')",
                                                (school_id,c['academic_year'],c['semester'],c['grade']))]
            cls=set(unj(c['class_ids_json']));roster=[s for s in roster if not cls or s['class_id'] in cls]
            subs={r['student_id']:dict(r) for r in db.execute('SELECT cur.student_id,s.choices_json,s.receipt '
                         'FROM current_submissions cur JOIN submissions s ON s.submission_id=cur.submission_id WHERE cur.campaign_id=?',(campaign_id,))}
            missing=[s['student_id'] for s in roster if s['student_id'] not in subs]
            if missing and not ack_missing:raise EnrollmentError(f'미신청 학생 {len(missing)}명 — 확인 후 명시적으로 확정하세요.')
            result=[]
            for s in roster:
                entry=subs.get(s['student_id'])
                if not entry:continue
                choices=unj(entry['choices_json']);errs=self.validate_choices(db,c,s,choices)
                if errs:raise EnrollmentError(f"{s['student_id']} 오류: {errs}")
                result.append({'student_id':s['student_id'],'grade':s['grade'],'class_id':s['class_id'],
                               'number':s['number'],'choices':choices,'receipt':entry['receipt']})
            offerings=[dict(x) for x in db.execute('SELECT * FROM offerings WHERE campaign_id=?',(campaign_id,))]
            groups=[dict(x) for x in db.execute('SELECT * FROM choice_groups WHERE campaign_id=?',(campaign_id,))]
            version=db.execute('SELECT COALESCE(MAX(version),0)+1 FROM snapshots WHERE campaign_id=?',(campaign_id,)).fetchone()[0]
            snapshot_id=uid();now=utcnow()
            snap={'snapshot_id':snapshot_id,'version':version,'school_id':school_id,'academic_year':c['academic_year'],
                  'semester':c['semester'],'campaign_id':campaign_id,'campaign_revision':c['revision'],
                  'groups':groups,'offerings':offerings,'students':result,'missing_ids':missing,'created_at':now}
            db.execute('INSERT INTO snapshots VALUES (?,?,?,?,?,?,?)',(snapshot_id,campaign_id,version,j(snap),actor['username'],now,reason))
            db.execute("UPDATE campaigns SET state='최종 확정',updated_at=? WHERE campaign_id=?",(now,campaign_id))
            self._audit(db,school_id,actor['username'],'finalize',campaign_id,reason,{'snapshot_id':snapshot_id,'version':version})
        return snap

    def reopen(self,token,school_id,campaign_id,reason):
        actor=self._authorize(token,school_id,'admin')
        if len(reason.strip())<8:raise EnrollmentError('재확정 사유는 8자 이상 입력하세요.')
        with self.repo.tx(True) as db:
            c=self._campaign(db,campaign_id,school_id)
            if c['state'] not in ('최종 확정','분반 전달'):
                raise EnrollmentError('확정된 신청만 재검토할 수 있습니다.')
            db.execute("UPDATE campaigns SET state='검토 중',revision=revision+1,updated_at=? WHERE campaign_id=?",(utcnow(),campaign_id))
            self._audit(db,school_id,actor['username'],'reopen',campaign_id,reason)

    def admin_override(self,token,school_id,campaign_id,student_id,choices,reason):
        actor=self._authorize(token,school_id,'admin')
        if len(reason.strip())<8:raise EnrollmentError('수동 수정 사유가 필요합니다(8자 이상).')
        with self.repo.tx(True) as db:
            c=self._campaign(db,campaign_id,school_id)
            if c['state'] not in ('신청 마감','검토 중'):
                raise EnrollmentError('학생 신청 검토 기간에만 관리자 예외 수정 가능')
            student=db.execute('SELECT * FROM students WHERE student_id=? AND school_id=? AND academic_year=? AND semester=?',
                               (student_id,school_id,c['academic_year'],c['semester'])).fetchone()
            if not student:raise EnrollmentError('학생을 찾을 수 없습니다.')
            if not student['eligible'] or student['status'] not in ('재학','전입') or student['grade']!=c['grade']:
                raise EnrollmentError('신청 대상 학생이 아닙니다.')
            if unj(c['class_ids_json']) and student['class_id'] not in unj(c['class_ids_json']):
                raise EnrollmentError('해당 신청 대상 학급의 학생이 아닙니다.')
            errors=self.validate_choices(db,c,student,choices)
            if errors:raise EnrollmentError(' / '.join(errors))
            old=db.execute('SELECT version FROM current_submissions WHERE campaign_id=? AND student_id=?',(campaign_id,student_id)).fetchone()
            ver=(int(old['version']) if old else 0)+1
            subid=uid();receipt=f"ENR-{c['academic_year']}-{secrets.token_hex(6).upper()}"
            db.execute('INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?)',
                       (subid,receipt,campaign_id,student_id,uid(),j(choices),c['revision'],utcnow()))
            db.execute('INSERT INTO current_submissions VALUES (?,?,?,?) ON CONFLICT(campaign_id,student_id) DO UPDATE SET '
                       'submission_id=excluded.submission_id,version=excluded.version',(campaign_id,student_id,subid,ver))
            self._audit(db,school_id,actor['username'],'admin_override',campaign_id,reason,{'student_id':student_id,'receipt':receipt})
            return receipt

    def get_snapshot(self,token,school_id,snapshot_id):
        self._authorize(token,school_id,'admin')
        with self.repo.tx() as db:
            row=db.execute('SELECT s.snapshot_json FROM snapshots s JOIN campaigns c ON c.campaign_id=s.campaign_id '
                           'WHERE s.snapshot_id=? AND c.school_id=?',(snapshot_id,school_id)).fetchone()
            if not row:raise AccessDenied('확정 스냅샷을 조회할 수 없습니다.')
            return unj(row['snapshot_json'])

    def snapshots(self,token,school_id,campaign_id):
        self._authorize(token,school_id,'admin')
        with self.repo.tx() as db:
            self._campaign(db,campaign_id,school_id)
            return [dict(x) for x in db.execute('SELECT snapshot_id,version,created_by,created_at,reason FROM snapshots '
                                                'WHERE campaign_id=? ORDER BY version DESC',(campaign_id,))]

    def audit_logs(self,token,school_id,campaign_id=None):
        self._authorize(token,school_id,'admin')
        sql='SELECT created_at,actor,action,reason,detail_json FROM audit WHERE school_id=?'
        args=[school_id]
        if campaign_id:
            sql+=' AND campaign_id=?';args.append(campaign_id)
        return self.repo.run_read(sql+' ORDER BY created_at DESC LIMIT 500',args)

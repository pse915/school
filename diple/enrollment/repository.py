"""SQLite enrollment repositories. Transactional local/development backend only.

Streamlit Community Cloud's local filesystem is ephemeral. This class deliberately
fails its production-safety check when asked to deploy on that platform.
"""
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

SCHEMA_VERSION = 1
DDL = '''
CREATE TABLE IF NOT EXISTS enrollment_meta (name TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS students (
 student_id TEXT NOT NULL,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
 grade INTEGER NOT NULL,class_id TEXT NOT NULL,number INTEGER NOT NULL,name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT '재학',eligible INTEGER NOT NULL DEFAULT 1,prior_courses TEXT NOT NULL DEFAULT '[]',
 updated_at TEXT NOT NULL, PRIMARY KEY(student_id,school_id,academic_year,semester),
 UNIQUE(school_id,academic_year,semester,grade,class_id,number)
);
CREATE INDEX IF NOT EXISTS student_scope_idx ON students(school_id,academic_year,semester);
CREATE TABLE IF NOT EXISTS accounts (
 account_id TEXT PRIMARY KEY,school_id TEXT NOT NULL,username TEXT NOT NULL,role TEXT NOT NULL,
 student_id TEXT, password_hash TEXT,activation_hash TEXT,failed_count INTEGER NOT NULL DEFAULT 0,
 locked_until TEXT, UNIQUE(school_id,username)
);
CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL,expires_at TEXT NOT NULL,
 FOREIGN KEY(account_id) REFERENCES accounts(account_id)
);
CREATE TABLE IF NOT EXISTS campaigns (
 campaign_id TEXT PRIMARY KEY,school_id TEXT NOT NULL,academic_year INTEGER NOT NULL,semester INTEGER NOT NULL,
 title TEXT NOT NULL,grade INTEGER NOT NULL,class_ids_json TEXT NOT NULL DEFAULT '[]',manager TEXT NOT NULL,
 starts_at TEXT NOT NULL,ends_at TEXT NOT NULL,edits_until TEXT NOT NULL,
 campaign_type TEXT NOT NULL,confirm_method TEXT NOT NULL,notice TEXT NOT NULL,contact TEXT NOT NULL,
 min_total_credits INTEGER NOT NULL DEFAULT 0,max_total_credits INTEGER NOT NULL DEFAULT 999,
 state TEXT NOT NULL DEFAULT '작성 중',published INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS choice_groups (
 group_id TEXT PRIMARY KEY,campaign_id TEXT NOT NULL,name TEXT NOT NULL,required INTEGER NOT NULL DEFAULT 1,
 min_count INTEGER NOT NULL,max_count INTEGER NOT NULL,min_credits INTEGER NOT NULL DEFAULT 0,
 max_credits INTEGER NOT NULL DEFAULT 999,target_units INTEGER,
 FOREIGN KEY(campaign_id) REFERENCES campaigns(campaign_id)
);
CREATE TABLE IF NOT EXISTS offerings (
 offering_id TEXT PRIMARY KEY,campaign_id TEXT NOT NULL,group_id TEXT NOT NULL,course_id TEXT NOT NULL,
 course_name TEXT NOT NULL,credits INTEGER NOT NULL,units INTEGER NOT NULL,
 min_students INTEGER NOT NULL DEFAULT 0,planned_capacity INTEGER NOT NULL DEFAULT 999,
 confirmed_capacity INTEGER,section_capacity INTEGER NOT NULL DEFAULT 32,selection_policy TEXT NOT NULL DEFAULT '희망수집',
 availability TEXT NOT NULL DEFAULT '개설 예정', prerequisites_json TEXT NOT NULL DEFAULT '[]',
 exclusions_json TEXT NOT NULL DEFAULT '[]',allowed_grade_json TEXT NOT NULL DEFAULT '[]',
 allowed_class_json TEXT NOT NULL DEFAULT '[]',joint_education INTEGER NOT NULL DEFAULT 0,
 UNIQUE(campaign_id,group_id,course_id),
 FOREIGN KEY(campaign_id) REFERENCES campaigns(campaign_id),FOREIGN KEY(group_id) REFERENCES choice_groups(group_id)
);
CREATE TABLE IF NOT EXISTS drafts (
 campaign_id TEXT NOT NULL,student_id TEXT NOT NULL,choices_json TEXT NOT NULL,revision INTEGER NOT NULL,
 saved_at TEXT NOT NULL,PRIMARY KEY(campaign_id,student_id)
);
CREATE TABLE IF NOT EXISTS submissions (
 submission_id TEXT PRIMARY KEY,receipt TEXT NOT NULL UNIQUE,campaign_id TEXT NOT NULL,student_id TEXT NOT NULL,
 request_key TEXT NOT NULL,choices_json TEXT NOT NULL,campaign_revision INTEGER NOT NULL,submitted_at TEXT NOT NULL,
 UNIQUE(campaign_id,student_id,request_key)
);
CREATE TABLE IF NOT EXISTS current_submissions (
 campaign_id TEXT NOT NULL,student_id TEXT NOT NULL,submission_id TEXT NOT NULL,
 version INTEGER NOT NULL,PRIMARY KEY(campaign_id,student_id),
 FOREIGN KEY(submission_id) REFERENCES submissions(submission_id)
);
CREATE TABLE IF NOT EXISTS snapshots (
 snapshot_id TEXT PRIMARY KEY,campaign_id TEXT NOT NULL,version INTEGER NOT NULL,
 snapshot_json TEXT NOT NULL,created_by TEXT NOT NULL,created_at TEXT NOT NULL,reason TEXT NOT NULL,
 UNIQUE(campaign_id,version)
);
CREATE TABLE IF NOT EXISTS audit (
 audit_id TEXT PRIMARY KEY,school_id TEXT NOT NULL,campaign_id TEXT,actor TEXT NOT NULL,
 action TEXT NOT NULL,reason TEXT NOT NULL,detail_json TEXT NOT NULL,created_at TEXT NOT NULL
);
'''


class EnrollmentRepository:
    """Abstract marker for replaceable adapters; required read/write atomic behavior."""
    def tx(self, write=False):
        raise NotImplementedError


class StudentRepository(EnrollmentRepository):
    pass


class CourseRepository(EnrollmentRepository):
    pass


class AuthenticationRepository(EnrollmentRepository):
    pass


class AuditLogRepository(EnrollmentRepository):
    pass


class SQLiteEnrollmentRepository(StudentRepository, CourseRepository, AuthenticationRepository, AuditLogRepository):
    def __init__(self, path='diple-enrollment-local.sqlite3'):
        self.path = str(path)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.tx(write=True) as db:
            db.executescript(DDL)
            db.execute('INSERT OR IGNORE INTO enrollment_meta(name,value) VALUES (?,?)', ('schema_version',str(SCHEMA_VERSION)))
            version=int(db.execute("SELECT value FROM enrollment_meta WHERE name='schema_version'").fetchone()['value'])
            if version != SCHEMA_VERSION:
                raise RuntimeError(f'Enrollment DB schema mismatch: {version} != {SCHEMA_VERSION}')

    @contextmanager
    def tx(self, write=False):
        connection=sqlite3.connect(self.path,timeout=30,isolation_level=None,check_same_thread=False)
        connection.row_factory=sqlite3.Row
        connection.execute('PRAGMA foreign_keys=ON')
        connection.execute('PRAGMA busy_timeout=30000')
        try:
            if write!='auto':connection.execute('BEGIN IMMEDIATE' if write else 'BEGIN')
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def run_read(self, sql, args=()):
        with self.tx() as db:
            return [dict(x) for x in db.execute(sql,args)]


def j(obj):
    return json.dumps(obj,ensure_ascii=False,separators=(',',':'),sort_keys=True)


def unj(raw):
    return json.loads(raw)

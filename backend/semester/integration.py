"""Read an applied semester from the shared extension repository. No legacy sheet overwrite."""
from backend.sheet_config import enabled as sheets_enabled
from copy import deepcopy
from datetime import date
import json
import pandas as pd
from .model import SemesterError

def active(app,day,year=None,semester=None):
    if not app.port.session_state.get('logged_in'):return None
    if not sheets_enabled(app.port.secrets):return None
    from backend.credit.install import get_service,config
    repo=get_service(app).repo;school=config(app)['school_id']
    with repo.tx() as db:
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='semester_pointers'").fetchone():return None
        rows=db.execute('''SELECT p.*,f.project_json,f.result_json FROM semester_pointers p JOIN semester_finals f ON f.id=p.version_id
            WHERE p.school_id=? AND p.effective_from<=? ORDER BY p.effective_from DESC''',(school,day)).fetchall()
        matched=[]
        for r in rows:
            if year is not None and r['academic_year']!=year or semester is not None and r['semester']!=semester:continue
            project=json.loads(r['project_json'])
            if day>project['term']['ends_at']:continue
            matched.append((r,project))
        if not matched:return None
        if len({(r['academic_year'],r['semester']) for r,p in matched})>1:raise SemesterError('해당 날짜의 학기 적용 범위가 겹칩니다. 학년도·학기를 확인하세요.')
        r,p=matched[0];p['published']={'placements':json.loads(r['result_json'])['placements']};p['semester_version_id']=r['version_id'];p['semester_effective_from']=r['effective_from']
        return p

def legacy_rows(project,day,lessons):
    teachers={t['id']:t['name'] for t in project['teachers']};subjects={s['id']:s['name'] for s in project['subjects']};classes={c['id']:c['name'] for c in project['classes']}
    mapping=project.get('legacy_mapping',{})
    result=[]
    for l in lessons:
        if l['status']=='cancelled':continue
        for teacher in l['teacher_ids']:
            for period in range(l['period'],l['period']+l['duration']):
                result.append({'교사명':mapping.get('teachers',{}).get(teacher,teachers[teacher]),'요일':'월화수목금'[date.fromisoformat(day).weekday()],
                    '교시':period,'과목':mapping.get('subjects',{}).get(l['subject_id'],subjects[l['subject_id']]),
                    '학급':','.join(mapping.get('classes',{}).get(c,classes[c]) for c in l['class_ids']) or '이동반:'+l['lesson_id'],
                    '교실':l.get('room_id',''),'일자':day,'변경유형':'학기기본본' if l.get('kind')=='base' else l.get('kind',''),
                    '원본교사':','.join(teachers.get(t,t) for t in l.get('origin_teacher_ids',[]))})
    return pd.DataFrame(result,columns=['교사명','요일','교시','과목','학급','교실','일자','변경유형','원본교사'])

def future_legacy_blockers(app,effective):
    result=[]
    for key in ('absences','subs','swaps','part_time'):
        df=app.port.session_state.get(key)
        if not isinstance(df,pd.DataFrame) or df.empty:continue
        dates=[c for c in df.columns if c in ('일자','날짜','종료일','일자1','일자2','대상일','원본일자','변경일자') or '일자' in c]
        for row in df.to_dict('records'):
            if any(str(row.get(c,''))[:10]>=effective for c in dates if str(row.get(c,''))[:10] not in ('','nan')):
                result.append(key+': 적용일 이후 기존 날짜별 변경 검토 필요');break
    return result

def install_reader(app):
    ns=app.program.namespace;original=ns['get_effective_timetable_for_date']
    def getter(on_date,version=0,use_test=False,neis_cache_key=''):
        norm=ns['normalize_date_str'](on_date)
        p=active(app,norm) if norm and not use_test else None
        if p:
            from backend.operations.install import get_service
            svc=get_service(app)
            # The original read path must not disclose student membership; all classes may be viewed as before.
            actor={'school_id':p['school']['id'],'user_id':'legacy-reader','role':'admin'}
            with svc._db() as db:
                sc=(p['school']['id'],p['school']['academic_year'],p['school']['semester'])
                state=svc._get_state(db,sc,norm)
                pinned=json.loads(db.execute('SELECT project_json FROM base_versions WHERE base_id=?',(state['base_id'],)).fetchone()[0])
                return legacy_rows(pinned,norm,state['published_lessons'])
        return original(on_date,version,use_test,neis_cache_key)
    getter.clear=original.clear;ns['get_effective_timetable_for_date']=getter
    old_validate=ns['validate_swap'];old_swap=ns['do_swap']
    def changes(a,b,da,db):
        from backend.operations.install import get_service
        p=active(app,da);q=active(app,db)
        if not p or not q or p['semester_version_id']!=q['semester_version_id']:raise SemesterError('교환 날짜의 기본 시간표 버전이 다릅니다.')
        svc=get_service(app);actor=svc.actor();selected=[]
        for row,day in ((a,da),(b,db)):
            daily=svc.day(p,day,actor)['lessons']
            names={t['id']:p.get('legacy_mapping',{}).get('teachers',{}).get(t['id'],t['name']) for t in p['teachers']}
            subjects={s['id']:p.get('legacy_mapping',{}).get('subjects',{}).get(s['id'],s['name']) for s in p['subjects']}
            found=[l for l in daily if l['period']==int(row['교시']) and row['교사명'] in [names[t] for t in l['teacher_ids']] and subjects[l['subject_id']]==row['과목']]
            if len(found)!=1:raise SemesterError('교환 수업을 고유하게 찾을 수 없습니다. 학기 중 운영 화면에서 선택하세요.')
            selected.append(found[0])
        cs=[{'action':'move','date':da,'occurrence_id':selected[0]['id'],'to_date':db,'to_period':selected[1]['period']},
            {'action':'move','date':db,'occurrence_id':selected[1]['id'],'to_date':da,'to_period':selected[0]['period']}]
        return svc,p,actor,cs
    def validate_swap(a,b,da,db,is_test=False,**kw):
        if is_test or not active(app,da):return old_validate(a,b,da,db,is_test=is_test,**kw)
        try:
            svc,p,actor,cs=changes(a,b,da,db);svc.refresh_external();r=svc.preview(p,actor,cs)
            return (not r['errors'],' / '.join(r['errors']))
        except ValueError as exc:return False,str(exc)
    def do_swap(a,b,da,db,is_test=False,**kw):
        if is_test or not active(app,da):return old_swap(a,b,da,db,is_test=is_test,**kw)
        from .install import get_service as semester_service
        semester_service(app).actor(confirm=True)
        svc,p,actor,cs=changes(a,b,da,db);svc.refresh_external()
        req=svc.submit(p,actor,'swap',cs,'기존 맞교환 화면에서 관리자가 확인한 변경')
        svc.review(p,actor,req,True,'기존 확인창 승인');svc.confirm(p,actor,req);state=svc.day(p,da,actor);svc.publish(p,actor,da,state['rev'])
        ns['_invalidate_all_caches']();return True
    ns['validate_swap']=validate_swap;ns['do_swap']=do_swap

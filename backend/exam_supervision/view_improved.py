"""Exam navigation and forms. No changes to allocator, repository, or write protocol.

Every save continues through Service.handle with its original action, schema,
revision and dataToken. No job result is persisted until explicit confirmation.
"""
import copy
import json
from collections import Counter
from . import engine as E
from .models import model,SH,cell
from .view import PAGES,LEGACY_PAGES,display,export,grid,run,render_connection

TEACHER_PAGES=PAGES[1:3]
CONDITIONS=PAGES[4:11]
STEP_PAGES=[PAGES[3],PAGES[4],PAGES[11],PAGES[12],PAGES[13]]

def checked(p,s):
    status=s.repo.status()
    if s.repo.uncertain:return False,'이전 저장 결과 확인 필요: 최신 자료를 불러온 뒤 변경 이력을 확인하세요.'
    if not s.app.repo.writable:return False,'앱의 Google Sheets 쓰기 설정이 비활성화되어 있습니다.'
    if status['writer']=='PAUSED':return False,'저장 주체 전환 대기 중입니다. 전환 시점을 확인하세요.'
    if status['writer']=='GAS':return False,'현재 Apps Script가 저장 주체입니다. 통합본에서는 조회만 가능합니다.'
    if status['writer']!='STREAMLIT':return False,'저장 주체 상태를 확인할 수 없습니다.'
    if status['errors']:return False,'시트 열 구성을 확인해야 합니다: '+'; '.join(status['errors'])
    if status['protocol']!='EXAM_SUPERVISION_V1':
        # version string is imported from the repository below to avoid assumptions
        from .repository import PROTOCOL
        if status['protocol']!=PROTOCOL:return False,'저장 주체 전환 프로토콜이 준비되지 않았습니다.'
    return True,'Streamlit에서 시험감독 자료를 저장할 수 있습니다.'

def summary(p,s,m,meta):
    ctx=m['ctx'];check=ctx.validate(m['draft']);required=check['required'];assigned=check['assigned']
    status=s.repo.status();updated=m['state'].get('updatedAt','')
    dates=sorted({r['date'] for r in m['schedule']})
    writable,why=checked(p,s)
    meta.update(overview={'sheet':status['name'],'teachers':len(ctx.teachers),'classes':len(m['classes']),
        'dates':len(dates),'required':required,'assigned':assigned,'errors':len(check['errors']),
        'verified':bool(check['valid'] and required>0),'savedAt':updated or '기록 없음','writer':status['writer'],
        'writable':writable,'readOnlyReason':why,'uncertain':s.repo.uncertain},
        steps=[{'label':'시험일정','state':'설정됨' if m['schedule'] and m['classes'] else '확인 필요'},
               {'label':'교사·조건','state':'설정됨' if ctx.teachers else '확인 필요'},
               {'label':'자동 배정','state':'검증 통과' if check['valid'] and required else '확인 필요'},
               {'label':'공정성 검토','state':'확인 필요'},
               {'label':'저장·출력','state':'최근 저장 있음' if updated else '확인 필요'}])
    return writable,why,check

def screen_header(p,title,desc):
    p.subheader(title);p.caption(desc)

def page_overview(p,s,m,meta):
    d=meta['overview'];screen_header(p,'시험감독 준비 현황','실제 연결된 시트와 현재 배정 데이터로 계산한 요약입니다. 화면 진입만으로 검증이나 저장이 완료되지는 않습니다.')
    for cards in ((('연결된 시험감독 시트',d['sheet']),('등록 교사',d['teachers']),('등록 학급',d['classes']),('시험 날짜',d['dates'])),
                  (('필요한 감독 자리',d['required']),('배정된 자리',d['assigned']),('배정 검증 오류',d['errors']),('최근 저장',d['savedAt']))):
        cols=p.columns(4)
        for col,(label,value) in zip(cols,cards):col.metric(label,value)
    p.info(('저장 가능' if d['writable'] else '읽기 전용')+' · '+d['readOnlyReason'])
    if not m['classes']:tip='학급부터 등록하세요.'
    elif not m['schedule']:tip='시험일정을 확인하고 저장하세요.'
    elif not m['ctx'].teachers:tip='교사 명단을 등록하세요.'
    elif d['errors']:tip=f"배정 검증 오류 {d['errors']}건을 확인하세요."
    elif not d['assigned']:tip='자동 배정을 계산하고 결과를 검토하세요.'
    else:tip='배정이 검증되었습니다. 공정성 지표를 확인하세요.'
    p.info('다음에 할 일 · '+tip)
    with p.expander('자세한 배정 검증 오류'):
        if d['errors']:
            for line in m['ctx'].validate(m['draft'])['errors'][:40]:p.warning(line)
        else:p.success('현재 입력 기준 필수 배정 제약 위반이 없습니다.' if d['verified'] else '검증할 배정이 아직 없습니다.')

def page_teacher(p,s,m):
    if s.admin or (s.repo.configuration or {}).get('teacherAll'):
        q=p.text_input('교사 이름 검색',key='exam_teacher_search');teachers=[t for t in m['ctx'].teachers if q in t['name']]
        tid=p.selectbox('교사 선택',[t['id'] for t in teachers],format_func=lambda v:m['ctx'].by_id[v]['name']+' ('+v+')',key='exam_teacher_id')
        if not tid:p.info('검색 결과가 없습니다.');return
    else:tid=''
    try:d=s.handle('getTeacher',dict(teacherId=tid))
    except Exception as exc:p.error(str(exc));return
    screen_header(p,d['teacher']['name']+' 감독 일정','조회 전용 · 최근 저장: '+(d.get('modifiedAt') or '기록 없음'))
    display(p,d['assignments'],['date','period','classId','subject','role']);export(p,d['assignments'],d['teacher']['name']+'_감독일정')

def assignments_table(s,m):
    data=s.handle('getConfirmed');names={t['id']:t['name'] for t in data['teachers']};rows=[]
    by={}
    for a in data['assignments']:by.setdefault((a['date'],a['period'],a['classId']),[]).append(a)
    for r in data['schedule']:
        assigned=by.get((r['date'],r['period'],r['classId']),[])
        row=dict(날짜=r['date'],교시=r['period'],학급=r['classId'],과목=r['subject'] if r['type']=='EXAM' else '자습',
                 정감독=', '.join(names.get(a['teacherId'],a['teacherId']) for a in assigned if a['role']=='MAIN'),
                 부감독=', '.join(names.get(a['teacherId'],a['teacherId']) for a in assigned if a['role']=='ASSIST'),
                 자습감독=', '.join(names.get(a['teacherId'],a['teacherId']) for a in assigned if a['role'].startswith('STUDY')),
                 상태='고정' if any(a.get('fixed') for a in assigned) else '미배정' if not assigned else '배정됨')
        row['_grade']=r['grade'];rows.append(row)
    return rows

def page_all(p,s,m):
    screen_header(p,'전체 감독 시간표','학년·날짜·교시 필터로 감독 배정을 확인하세요.')
    grade=p.selectbox('학년',['전체']+list(map(str,sorted({c['grade'] for c in m['classes']}))),key='exam_filter_grade')
    date=p.selectbox('날짜',['전체']+sorted({r['date'] for r in m['schedule']}),key='exam_filter_date')
    period=p.selectbox('교시',['전체']+list(map(str,sorted({r['period'] for r in m['schedule']}))),key='exam_filter_period')
    clazz=p.selectbox('학급',['전체']+sorted({c['id'] for c in m['classes']}),key='exam_filter_class')
    rows=[{k:v for k,v in row.items() if k!='_grade'} for row in assignments_table(s,m)
          if (grade=='전체' or str(row['_grade'])==grade) and (date=='전체' or row['날짜']==date) and
             (period=='전체' or str(row['교시'])==period) and (clazz=='전체' or row['학급']==clazz)]
    if p.checkbox('카드 보기',key='exam_schedule_cards'):
        for row in rows:
            with p.expander(f"{row['날짜']} · {row['교시']}교시 · {row['학급']}"):
                for k,v in row.items():p.write(f'{k}: {v or "—"}')
    else:display(p,rows)
    export(p,rows,'전체_감독시간표')

def page_schedule(p,s,m,writable):
    from .schedule_view import render_schedule
    return render_schedule(p,s,m,writable)

def roster_rows(m):
    return [dict(originalId=t['id'],id=t['id'],name=t['name'],subjectsText=', '.join(t['subjects']),
                 crossSubjectsText=', '.join(t['crossSubjects']),homeroom=t['homeroom'],
                 **{role:'O' if t['roleEligibility'][role] else 'X' for role in E.ROLES}) for t in m['ctx'].teachers]

def page_roster(p,s,m,writable):
    screen_header(p,'2. 교사 명단','교사 ID와 동명이인을 구분하세요. 명단 삭제는 연관 조건에도 영향을 줄 수 있습니다.')
    if m['roster']['errors']:p.warning('; '.join(m['roster']['errors']))
    fields=['originalId','id','name','subjectsText','crossSubjectsText','homeroom','MAIN','ASSIST','STUDY']
    configs={k:p.column_config.SelectboxColumn(v,options=['O','X']) for k,v in E.ROLES.items()}
    homes=['']+sorted({c['id'] for c in m['classes']} | {t['homeroom'] for t in m['ctx'].teachers if t['homeroom']})
    configs['homeroom']=p.column_config.SelectboxColumn('담임학급 (비담임은 공란)',options=homes)
    epoch=p.session_state.get('_exam_roster_epoch',0)
    rows=grid(p,'roster_'+str(epoch),roster_rows(m),fields,configs,disabled=['originalId'])
    deleted=[t['id'] for t in m['ctx'].teachers if t['id'] not in {E.clean(r.get('originalId')) for r in rows}]
    approve=p.checkbox('삭제 대상과 관련 조건 정리를 확인했습니다',key='exam_roster_delete_ack') if deleted else True
    if deleted:p.warning('삭제 예정 교사: '+', '.join(deleted))
    if p.button('교사 명단 저장',key='exam_save_roster',disabled=not writable or not approve):
        run(p,s,'saveRoster',dict(rows=rows,deletedTeacherIds=deleted))
    if p.button('명단 편집 취소',key='exam_cancel_roster'):
        p.session_state['_exam_roster_epoch']=epoch+1
        p.rerun()
    with p.expander('교사 상세 · 연결된 조건 확인'):
        teachers=m['ctx'].teachers
        if teachers:
            selected=p.selectbox('상세 확인할 교사',[t['id'] for t in teachers],format_func=lambda tid:m['ctx'].by_id[tid]['name']+' ('+tid+')',key='exam_roster_detail')
            person=m['ctx'].by_id[selected]
            display(p,[r for r in m['unavailable'] if r['teacherId']==selected])
            p.caption('수업·겸임·감독규칙은 왼쪽 하위 메뉴에서 수정합니다. ID를 기준으로 배정불가 일정을 연결합니다.')
            p.info(f"교사: {person['name']} · 담당교과: {', '.join(person['subjects'])} · 담임: {person['homeroom'] or '없음'}")

from .original_forms import (
    page_roles as original_page_roles,
    page_unavailable as original_page_unavailable,
    page_teaching as original_page_teaching,
    page_settings as original_page_settings,
)

def page_roles(p,s,m,writable):
    return original_page_roles(p,s,m,writable)

def page_unavailable(p,s,m,writable):
    return original_page_unavailable(p,s,m,writable)

def page_teaching(p,s,m,writable,kind):
    return original_page_teaching(p,s,m,writable,kind)

def page_settings(p,s,m,writable):
    return original_page_settings(p,s,m,writable)

def page_assignment(p,s,m,writable,check):
    screen_header(p,'3. 자동 배정·직접 수정','계산 ≠ 저장. 검증 가능한 계산 결과만 명시적으로 저장할 수 있습니다.')
    seed=p.text_input('랜덤 시드',value='2026',key='exam_seed')
    budget=p.slider('최대 계산 시간 (초)',5,145,60,key='exam_budget')
    cols=p.columns(3)
    for col,(title,action) in zip(cols,[('자동 배정 계산','generate'),('현재 배정 개선','improve'),('학년 우대 비교','compareGradeBonus')]):
        if col.button(title,key='exam_job_'+action,disabled=not writable):
            try:s.start_job(action,{**s.token_payload(),'seed':int(seed),'budgetMs':budget*1000});p.rerun()
            except Exception as exc:p.error(str(exc))
    try:job=s.job_status()
    except Exception as exc:job=None;p.error(str(exc))
    if job:
        if job.get('running'):
            p.info(f"계산 중 · 실제 경과 {job['elapsed']}초. 계산 결과는 저장되지 않았습니다.")
            if p.button('계산 상태 다시 확인',key='exam_job_refresh'):p.rerun()
            if p.button('계산 취소',key='exam_job_cancel'):
                s.job['cancel'].set();s.job['future'].cancel();p.rerun()
        elif job.get('cancelled'):p.info('계산을 취소했습니다. 시트에 저장하지 않았습니다.')
        else:
            result=job['result'];arr=result.get('assignments',result.get('proposal',[]))
            p.info('계산 완료 · 현재 결과는 아직 저장되지 않았습니다.')
            if arr:display(p,arr,['date','period','classId','role','teacherId','fixed'])
            with p.expander('계산 진단 원본 JSON'):p.text_area('결과',value=json.dumps(result,ensure_ascii=False,indent=2),key='exam_job_result')
            if arr and job['action']!='compareGradeBonus' and p.button('검토한 결과 저장',key='exam_job_apply',disabled=not writable):
                try:s.apply_job();s.notice='계산 결과를 검증하고 저장했습니다.';p.rerun()
                except Exception as exc:p.error(str(exc))
    screen_header(p,'현재 배정 결과','필수 배정 자리 수: '+str(check['required'])+' · 현재 배정: '+str(check['assigned']))
    if check['errors']:p.warning('검증 오류 '+str(len(check['errors']))+'건 · '+('; '.join(check['errors'][:4])))
    else:p.success('현재 배정의 필수 제약 검증 통과' if check['required'] else '시험일정이 등록되지 않았습니다.')
    display(p,assignments_table(s,m));export(p,assignments_table(s,m),'현재_배정결과')
    screen_header(p,'직접 변경·교환·고정','기존 서버 검증을 통과한 변경만 저장합니다. 변경된 감독 자리는 고정 처리됩니다.')
    teachers=m['ctx'].by_id;arr=m['draft'];choices=[a['key'] for a in arr]
    if not choices or not teachers:p.info('등록된 감독 자리와 교사 명단이 필요합니다.');return
    first=p.selectbox('첫 번째 감독 자리',choices,key='exam_slot_first')
    tid=p.selectbox('변경할 교사',list(teachers),format_func=lambda k:teachers[k]['name']+' ('+k+')',key='exam_manual_teacher')
    reason=p.text_input('변경 사유',key='exam_change_reason')
    if p.button('감독교사 변경',key='exam_update',disabled=not writable):run(p,s,'update',dict(key=first,teacherId=tid,reason=reason))
    second=p.selectbox('두 번째 감독 자리',choices,key='exam_slot_second')
    if p.button('두 자리 교사 교환',key='exam_swap',disabled=not writable):run(p,s,'swap',dict(key1=first,key2=second,reason=reason))
    if p.button('같은 학급 정·부감독 역할 교환',key='exam_role_swap',disabled=not writable):run(p,s,'roleSwap',dict(key1=first,key2=second,reason=reason))
    with p.expander('고급 도구 · 전체 배정·고정 여부 편집'):
        fields=['key','day','date','period','classId','type','subject','role','teacherId','fixed','start','end']
        edited=grid(p,'assignments',arr,fields,{'fixed':p.column_config.CheckboxColumn('고정')},[k for k in fields if k not in ('teacherId','fixed')])
        if p.button('전체 배정 검증 후 저장',key='exam_save_assignments',disabled=not writable):run(p,s,'saveAssignments',dict(assignments=edited,reason=reason))

def page_fairness(p,s,m):
    screen_header(p,'4. 공정성 검토','횟수·업무강도·연속 근무를 기존 최적화 엔진이 산출한 수치로 표시합니다.')
    try:report=s.handle('optimizationReport')
    except Exception as exc:p.error(str(exc));return
    for k,v in report['metrics'].items():p.caption(f'{k}: {v}')
    display(p,report['teachers']);export(p,report['teachers'],'감독_공정성_분석')
    import pandas as pd
    chart=pd.DataFrame([{k:r[k] for k in ('name','main','assist','study')} for r in report['teachers']])
    if len(chart):p.bar_chart(chart.set_index('name'))
    tids=[t['id'] for t in m['ctx'].teachers]
    if tids:
        tid=p.selectbox('교사별 제약 설명',tids,format_func=lambda k:m['ctx'].by_id[k]['name'],key='exam_fair_teacher')
        if p.button('제약·개선 가능성 분석',key='exam_fairness'):
            try:s.last=('fairness',s.handle('fairness',dict(teacherId=tid)))
            except Exception as exc:p.error(str(exc))
    if s.last and s.last[0]=='fairness':
        p.info('제외 사유는 배정 가능성 제한을 설명하지만 횟수 차이의 인과관계를 단정하지 않습니다.')
        with p.expander('공정성 설명 · 원본 세부 지표'):
            p.text_area('공정성 설명',value=json.dumps(s.last[1],ensure_ascii=False,indent=2),key='exam_fair_report')

def page_save(p,s,m,writable,check):
    screen_header(p,'5. 저장·기록·인쇄','설정은 각 화면에서 따로 저장합니다. 배정 계산은 3단계의 검증 후 저장 버튼에서 반영됩니다.')
    p.info(('필수 조건 검증 통과' if check['valid'] and check['required'] else '검증 확인 필요')+f" · 감독 자리 {check['assigned']}/{check['required']} · 오류 {len(check['errors'])}건")
    p.caption('최근 시험감독 저장 시각: '+(m['state'].get('updatedAt') or '기록 없음'))
    p.subheader('현재 배정과 인쇄');rows=assignments_table(s,m);display(p,rows);export(p,rows,'전체_감독_인쇄')
    p.subheader('배정 변경 이력');history=s.handle('history');display(p,history);export(p,history,'감독_변경이력')
    versions=s.handle('listVersions')['versions'];p.subheader('보존된 과거 버전 · 조회 전용');display(p,versions)
    if versions:
        ver=p.selectbox('과거 버전',[v['version'] for v in versions],key='exam_version')
        if p.button('스냅샷 무결성 검사·조회',key='exam_version_preview'):
            try:s.last=('version',s.handle('getVersionPreview',dict(version=ver)))
            except Exception as exc:p.error(str(exc))
        if s.last and s.last[0]=='version':display(p,s.last[1]['assignments']);export(p,s.last[1]['assignments'],'감독_'+s.last[1]['version'])
    p.caption('원본에서 비활성화된 확정·잠금·복원·버전 생성 기능은 복구하지 않았습니다.')
    if p.button('현재 배정에서 결과·통계·인쇄 시트 재생성',key='exam_repair',disabled=not writable):run(p,s,'repair')

def render(p,s):
    s.authorize('bootstrap')
    if s.notice:p.success(s.notice);s.notice=''
    if s.admin:
        old=p.session_state.get('exam_page')
        if old in LEGACY_PAGES:p.session_state['exam_page']=LEGACY_PAGES[old]
        opts=PAGES
    else:
        cfg=s.repo.configuration if s.repo.configuration is not None else s.repo.load_config()
        opts=TEACHER_PAGES if cfg.get('teacherAll') else TEACHER_PAGES[:1]
    page=p.selectbox('시험감독 화면',opts,key='exam_page')
    # Keep settings reachable even with older React navigation bundles.
    p.session_state['exam_page_picker']=page
    def select_page():
        p.session_state['exam_page']=p.session_state['exam_page_picker']
    p.selectbox('전체 시험감독 메뉴 · 연결/저장 설정 포함',opts,key='exam_page_picker',on_change=select_page)
    meta=p.emit('exam_meta',page=page,pages=opts,admin=s.admin,steps=[],overview={})
    if page in ('연결·조회 권한','저장 주체·연결 진단'):
        if s.admin:render_connection(p,s)
        return
    try:s.ensure_connected()
    except Exception as exc:
        p.warning(str(exc))
        if s.admin:render_connection(p,s)
        return
    meta['sheet']=s.repo.book.title
    if p.button('최신 시험감독 자료 다시 불러오기',key='exam_reload'):
        try:s.reload();s.notice='최신 자료를 불러왔습니다.';p.rerun()
        except Exception as exc:p.error(str(exc))
    if s.repo.uncertain:p.error('이전 저장 결과 확인 필요. 최신 자료 재조회 후 변경 내역을 확인하세요.')
    try:m=model(s.repo.tables)
    except Exception as exc:
        p.error('시트 자료를 해석하지 못했습니다: '+str(exc))
        p.caption('연결·조회 권한에서 열 제목과 원본 데이터를 점검하세요.');return
    if m['draftSource']=='result':p.info('배정결과 시트에서 직접 수정한 내용을 읽었습니다. 다음 저장 시 검증 후 초안에 반영합니다.')
    if s.admin:
        writable,why,check=summary(p,s,m,meta)
        if not writable:p.warning('시험감독 저장 불가 · '+why)
    else:writable,check=False,None
    if page==PAGES[0]:page_overview(p,s,m,meta)
    elif page==PAGES[1]:page_teacher(p,s,m)
    elif page==PAGES[2]:page_all(p,s,m)
    else:
        s.authorize('getAdminData')
        if page==PAGES[3]:page_schedule(p,s,m,writable)
        elif page==PAGES[4]:page_roster(p,s,m,writable)
        elif page==PAGES[5]:page_roles(p,s,m,writable)
        elif page==PAGES[6]:page_unavailable(p,s,m,writable)
        elif page in PAGES[7:10]:page_teaching(p,s,m,writable,page)
        elif page==PAGES[10]:page_settings(p,s,m,writable)
        elif page==PAGES[11]:page_assignment(p,s,m,writable,check)
        elif page==PAGES[12]:page_fairness(p,s,m)
        elif page==PAGES[13]:page_save(p,s,m,writable,check)
        meta['unsavedForm']=any(bool(p.session_state.get('_exam_original_dirty_'+k)) for k in ('unavailable','visiting','rules'))

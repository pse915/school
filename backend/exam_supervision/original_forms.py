"""Original Apps Script-inspired exam forms within the existing ReactPort bridge.

All edits are session-local until the existing authenticated Service.handle actions
persist them. No alternative database, GAS writer or allocation engine is created.
"""
import copy
import json
from datetime import date
from . import engine as E
from .models import cell
from .view import display, grid, run

WEEKDAYS = ['', '월', '화', '수', '목', '금', '토', '일']
PERIODS = list(range(11))


def _teachers(m):
    return m['ctx'].teachers


def _teacher_label(m, tid):
    t = m['ctx'].by_id.get(tid)
    return f"{t['name']} ({tid})" if t else tid


def _teacher_choice(p, m, key, label='교사'):
    teachers = _teachers(m)
    if not teachers:
        p.info('교사명단을 먼저 등록하세요.')
        return None
    ids = [t['id'] for t in teachers]
    return p.selectbox(label, ids, format_func=lambda tid: _teacher_label(m, tid), key=key)


def _date_choice(p, prefix, label='날짜', optional=False):
    if optional and not p.checkbox('특정 날짜 지정', key=prefix+'_has_date'):
        return ''
    chosen = p.date_input(label, key=prefix+'_date')
    return chosen.isoformat() if isinstance(chosen, date) else str(chosen)[:10]


def _period_choice(p, prefix, label='교시', whole_day=False):
    choices = PERIODS if whole_day else PERIODS[1:6]
    return p.selectbox(label, choices, key=prefix+'_period', format_func=lambda x: '종일' if x == 0 else f'{x}교시')


def _draft(p, m, key, original):
    """Protect unsaved rows from rerenders but discard stale drafts after revision change."""
    marker = '_exam_original_revision_'+key
    store = '_exam_original_rows_'+key
    revision = m['state']['revision']
    if p.session_state.get(marker) != revision:
        p.session_state[marker] = revision
        p.session_state[store] = copy.deepcopy(original)
        p.session_state['_exam_original_dirty_'+key] = False
    return p.session_state[store]


def _update(p, key, rows):
    p.session_state['_exam_original_rows_'+key] = rows
    p.session_state['_exam_original_dirty_'+key] = True
    p.rerun()


def _person_name(m, tid, *, unique=False):
    t = m['ctx'].by_id.get(tid)
    E.require(t, '교사 명단에서 교사를 선택하세요.')
    if unique:
        matches = [x for x in _teachers(m) if E.norm(x['name']) == E.norm(t['name'])]
        E.require(len(matches) == 1, '동명이인 교사는 겸임/감독규칙 시트가 이름으로 연결되므로 구분할 수 없습니다. 교사명과 기존 시트 연결을 확인하세요.')
    return t['name']


def _visible_rows(p, m, key, rows, columns, description, allow_edit=True):
    p.caption(f'{len(rows)}건 등록 · {description} · 저장 전에는 Google Sheets에 반영되지 않습니다.')
    display(p, [{k: r.get(k, '') for k in columns} for r in rows], columns)
    if allow_edit and rows:
        indexes = list(range(len(rows)))
        target = p.selectbox('삭제할 항목 선택', indexes, key='exam_form_'+key+'_delete_select',
                             format_func=lambda i: f"{i+1}. " + ' · '.join(str(rows[i].get(k, '')) for k in columns[:3]))
        if p.button('선택 항목 삭제 (저장 전 임시 변경)', key='exam_form_'+key+'_delete'):
            _update(p, key, [r for i,r in enumerate(rows) if i != target])


def page_roles(p, s, m, writable):
    p.subheader('2. 감독 역할 · 강사 제외')
    p.caption('정감독·부감독·자습감독은 O/X로 표시합니다. 역할은 교사 명단에서 편집하며, 강사 제외는 이 화면에서 체크해 저장합니다.')
    t = _teachers(m)
    if not t:
        p.warning('교사 명단을 먼저 저장하세요.')
        return
    excluded = set(m['state']['settings'].get('instructorIds', []))
    selected = []
    for teacher in t:
        flags = teacher['roleEligibility']
        with p.container():
            left, right = p.columns([3, 2])
            left.markdown('**'+teacher['name']+'** ('+teacher['id']+') · 정감독 '+('O' if flags['MAIN'] else 'X')+
                          ' / 부감독 '+('O' if flags['ASSIST'] else 'X')+' / 자습감독 '+('O' if flags['STUDY'] else 'X'))
            if right.checkbox('강사 제외 · '+teacher['id'], value=teacher['id'] in excluded,
                              key='exam_original_instructor_'+teacher['id'], disabled=not writable):
                selected.append(teacher['id'])
    p.caption('강사로 제외된 교사는 모든 감독 역할에서 제외됩니다. 변경 시 기존 배정이 제약을 위반할 수 있으므로 자동 배정을 다시 확인하세요.')
    if set(selected) != excluded:
        p.warning('저장하지 않은 강사 제외 변경사항이 있습니다.')
    if p.button('강사 체크 저장', key='exam_save_instructors', disabled=not writable):
        run(p, s, 'saveInstructorFlags', {'instructorIds': selected})


def page_unavailable(p, s, m, writable):
    p.subheader('2. 배정불가 시간')
    p.caption('교사·날짜·교시를 선택해 일정을 추가한 뒤 목록을 저장하세요. 배정불가 시간에는 감독을 배정하지 않습니다.')
    rows = _draft(p, m, 'unavailable', m['unavailable'])
    tid = _teacher_choice(p, m, 'exam_form_unavailable_teacher')
    if tid:
        a,b,c=p.columns([2,1,3])
        chosen = _date_choice(a, 'exam_form_unavailable', '날짜')
        period = _period_choice(b, 'exam_form_unavailable')
        reason = c.text_input('사유', key='exam_form_unavailable_reason', placeholder='예: 출장, 연가')
        if p.button('＋ 배정불가 시간 추가', key='exam_form_unavailable_add', disabled=not writable):
            candidate = {'teacherId':tid,'date':chosen,'period':period,'reason':reason.strip()}
            key = (tid,chosen,period)
            if key in {(r['teacherId'],r['date'],int(r['period'])) for r in rows}:
                p.error('같은 교사·날짜·교시의 배정불가 시간이 이미 등록되어 있습니다.')
            elif not E.valid_date(chosen):p.error('날짜 형식이 올바르지 않습니다.')
            else:_update(p,'unavailable',rows+[candidate])
    public = [dict(교사=_teacher_label(m,r['teacherId']),날짜=r['date'],교시=r['period'],사유=r.get('reason','')) for r in rows]
    p.caption(f'현재 임시 목록: {len(rows)}건')
    display(p,public)
    if rows:
        ix=p.selectbox('삭제할 배정불가 시간',list(range(len(rows))),key='exam_form_unavailable_delete_select',
                       format_func=lambda i:f"{_teacher_label(m,rows[i]['teacherId'])} · {rows[i]['date']} · {rows[i]['period']}교시")
        if p.button('선택 배정불가 시간 삭제',key='exam_form_unavailable_delete',disabled=not writable):
            _update(p,'unavailable',[r for i,r in enumerate(rows) if i!=ix])
    if rows!=m['unavailable']:p.warning('저장하지 않은 배정불가 변경사항이 있습니다.')
    if p.button('배정불가 시간 저장',key='exam_save_unavailable',disabled=not writable):
        run(p,s,'saveUnavailable',dict(rows=rows))


def page_teaching(p,s,m,writable,kind):
    if kind=='수업시간표':return page_teaching_sheet(p,s,m,writable)
    if kind=='겸임교사 일정':return page_visiting(p,s,m,writable)
    if kind=='교사감독규칙':return page_rules(p,s,m,writable)
    raise ValueError('존재하지 않는 화면입니다.')


def page_teaching_sheet(p,s,m,writable):
    p.subheader('3. 수업시간표 · 감독 후보 진단')
    p.caption('시험을 치르지 않는 학급의 정규수업과 겸임시간을 고려하여 감독 후보를 계산합니다. 원본 시트를 우선 조회합니다.')
    report=s.handle('availabilityReport')
    sources=m['available']['teaching']; source=report['teachingSource']
    for col,(label,value) in zip(p.columns(4),[('수업시간표 행',report['teachingRows']),('명단 연결 교사',f"{report['teachingMatched']} / {report['teacherCount']}"),('겸임 규칙',report['visitingRows']),('시간표 미등록',len(report['missingTeachers']))]):col.metric(label,value)
    p.info(f"현재 읽는 탭: {source} · "+('수업시간표 시트 데이터보다 교사시간표 시트를 우선 읽습니다.' if report.get('ignoredAlias') else '연결된 시트를 기준으로 후보를 계산합니다.'))
    if not sources['enabled']:p.error('수업시간표에 유효한 데이터가 없습니다. 자동 배정 전 입력이 필요합니다.')
    for label,key in [('명단에 없는 교사','unknownTeachers'),('시간표 미등록 교사','missingTeachers'),('시간표 데이터 오류','invalidRows')]:
        vals=report.get(key,[])
        if vals:p.warning(f"{label} ({len(vals)}건): "+', '.join(str(x) for x in vals[:20]))
    if m['available']['visiting']['errors'] or m['available']['rules']['errors']:
        p.error('겸임·감독규칙 시트 오류가 있습니다. 해당 화면에서 확인하세요.')
    p.subheader('시험일·교시별 감독 가능 인원')
    brief=[{'날짜':x['date'],'요일':x['weekday'],'교시':x['period'],'가능 교사':x['possible'],'제외 교사':x['excluded']} for x in report['slots']]
    display(p,brief)
    if report['slots']:
        slot=p.selectbox('제외 사유 상세 조회',list(range(len(report['slots']))),key='exam_original_availability_slot',
                         format_func=lambda i:f"{report['slots'][i]['date']} · {report['slots'][i]['period']}교시")
        details=report['slots'][slot]
        with p.expander('선택한 시간의 제외 교사 및 사유'):
            display(p,[{'교사':x['name'],'제외 사유':', '.join(x['reasons'])} for x in details['excludedTeachers']])
    if p.button('수업시간표·후보 진단 다시 불러오기',key='exam_original_teaching_reload'):
        try:s.reload();p.rerun()
        except Exception as exc:p.error(str(exc))
    with p.expander('고급 · Google Sheets 수업시간표 직접 편집'):
        fields=['teacherName','weekday','period','subject','classId','subjectGroup']
        values=[{k:cell(row,i) for i,k in enumerate(fields)} for row in s.repo.tables.get(source,[])[1:] if any(E.clean(v) for v in row)]
        if source=='수업시간표':p.warning('현재 수업시간표 별칭 탭을 참조 중입니다. 이 화면에서 저장하면 교사시간표 시트에 자료가 저장되므로 기존 참조 우선순위가 달라질 수 있습니다.')
        rows=grid(p,'availability_교사시간표',values,fields)
        if p.button('수업시간표 저장',key='exam_save_availability',disabled=not writable):
            run(p,s,'saveTeaching',dict(rows=rows))


def page_visiting(p,s,m,writable):
    p.subheader('3. 겸임교사 본교·타교 근무 일정')
    p.caption('타교출강 시간은 배정할 수 없으며 본교방문은 지정된 시간에만 후보로 포함됩니다. 날짜별 예외가 주간 반복보다 우선합니다.')
    info=m['available']['visiting']
    if info.get('errors') or info.get('unknown'):
        p.error('원본 근무 데이터 오류: '+'; '.join(info['errors']+info['unknown']))
    rows=_draft(p,m,'visiting',[{k:r.get(k,'') for k in ['teacherName','type','date','weekday','period','location','note']} for r in info['rows']])
    tid=_teacher_choice(p,m,'exam_form_visiting_teacher')
    kind=p.selectbox('구분',['타교출강','본교방문'],key='exam_form_visiting_type')
    a,b,c=p.columns(3)
    d=_date_choice(a,'exam_form_visiting','날짜 (특정일)',optional=True)
    w=b.selectbox('반복 요일',WEEKDAYS,key='exam_form_visiting_weekday',format_func=lambda x:x+'요일' if x else '선택 안 함')
    period=_period_choice(c,'exam_form_visiting',whole_day=True)
    location=p.selectbox('근무 장소',['타교','본교'],key='exam_form_visiting_location',index=0 if kind=='타교출강' else 1)
    note=p.text_input('비고',key='exam_form_visiting_note',placeholder='방문일 / 예외 사항')
    if p.button('＋ 겸임 근무 규칙 추가',key='exam_form_visiting_add',disabled=not writable or not tid):
        try:
            teacher=_person_name(m,tid,unique=True)
            E.require(d or w,'날짜 또는 요일을 입력하세요.')
            E.require(not(d and w) or E.weekday(d)==w,'선택 날짜와 요일이 일치하지 않습니다.')
            new={'teacherName':teacher,'type':kind,'date':d,'weekday':w,'period':period or '', 'location':location,'note':note.strip()}
            ident=lambda r:(r['teacherName'],r['date'],r['weekday'],str(r.get('period') or ''))
            E.require(ident(new) not in {ident(r) for r in rows},'같은 교사·날짜·요일·교시 규칙이 이미 있습니다.')
            _update(p,'visiting',rows+[new])
        except ValueError as exc:p.error(str(exc))
    _visible_rows(p,m,'visiting',rows,['teacherName','type','date','weekday','period','location','note'],'본교·타교 근무',allow_edit=writable)
    if p.button('겸임교사 근무설정 저장',key='exam_save_visiting',disabled=not writable or bool(info['errors'] or info['unknown'])):
        run(p,s,'saveVisiting',dict(rows=rows))


def page_rules(p,s,m,writable):
    p.subheader('3. 교사 감독 포함·제외 규칙')
    p.warning('제외 규칙이 우선합니다. 포함 규칙은 정규수업 충돌·시간표 미등록 제한만 해제할 수 있으며, 교과·담임·강사·부재·겸임·중복 배정 금지는 해제하지 않습니다.')
    info=m['available']['rules']
    if info.get('errors') or info.get('unknown'):
        p.error('원본 감독규칙 데이터 오류: '+'; '.join(info['errors']+info['unknown']))
    fields=['teacherName','mode','startDate','weekday','period','classId','reason','endDate']
    rows=_draft(p,m,'rules',[{k:r.get(k,'') for k in fields} for r in info['rows']])
    tid=_teacher_choice(p,m,'exam_form_rules_teacher')
    mode=p.selectbox('규칙',['제외','포함'],key='exam_form_rules_mode',format_func=lambda v:'감독 제외' if v=='제외' else '감독 포함 (수업 예외)')
    col1,col2=p.columns(2)
    start=_date_choice(col1,'exam_form_rules_start','시작일',optional=True)
    end=_date_choice(col2,'exam_form_rules_end','종료일',optional=True)
    col3,col4=p.columns(2)
    weekday=col3.selectbox('요일',WEEKDAYS,key='exam_form_rules_weekday',format_func=lambda x:x+'요일' if x else '선택 안 함')
    period=_period_choice(col4,'exam_form_rules',whole_day=mode=='제외')
    clazz=''
    if mode=='포함':
        clazz=p.selectbox('수업학급 (포함 시 선택)',['']+[c['id'] for c in m['classes']],key='exam_form_rules_class',format_func=lambda x:x or '전체 수업 충돌')
    reason=p.text_input('사유 (필수)',key='exam_form_rules_reason',placeholder='예: 2학년 수업 대체 교사 배치 확인')
    if p.button('＋ 감독 규칙 추가',key='exam_form_rules_add',disabled=not writable or not tid):
        try:
            teacher=_person_name(m,tid,unique=True)
            E.require(start or weekday,'시작일 또는 반복 요일을 입력하세요.')
            E.require(not end or bool(start) and end>=start,'종료일은 시작일 이후여야 합니다.')
            E.require(not(start and weekday and not end) or E.weekday(start)==weekday,'단일 날짜와 요일이 일치하지 않습니다.')
            E.require(len(reason.strip()) >= (4 if mode=='포함' else 2),'포함 사유는 4자 이상, 제외 사유는 2자 이상입니다.')
            E.require(mode!='포함' or (start and period),'감독 포함 규칙은 특정 시작일과 교시가 필요합니다.')
            item={'teacherName':teacher,'mode':mode,'startDate':start,'endDate':end,'weekday':weekday,
                  'period':period or '', 'classId':clazz if mode=='포함' else '', 'reason':reason.strip()}
            ident=lambda r:tuple(str(r.get(k) or '') for k in ('teacherName','mode','startDate','endDate','weekday','period','classId'))
            E.require(ident(item) not in {ident(x) for x in rows},'이미 등록된 감독 규칙입니다.')
            _update(p,'rules',rows+[item])
        except ValueError as exc:p.error(str(exc))
    _visible_rows(p,m,'rules',rows,fields,'감독 포함·제외',allow_edit=writable)
    if p.button('포함·제외 규칙 저장',key='exam_save_rules',disabled=not writable or bool(info['errors'] or info['unknown'])):
        run(p,s,'saveTeachingRules',dict(rows=rows))


def _alias_rows(settings):
    return [{'alias':k,'canonical':v} for k,v in sorted(settings.get('aliases',{}).items())]


def _aliases(rows):
    out={}
    for r in rows:
        a,b=E.norm(r.get('alias')),E.norm(r.get('canonical'))
        if not a and not b:continue
        E.require(a and b,'교과 동의어의 원래 교과와 표준 교과를 모두 입력하세요.')
        E.require(a not in out,'중복 교과 동의어: '+a)
        out[a]=b
    return out


def page_settings(p,s,m,writable):
    p.subheader('2. 감독 인원 · 최적화 설정')
    p.caption('원본과 동일한 프리셋·가중치·강사/시간표 미등록 교사 선택 방식입니다. 절대 배정 금지 조건은 변경되지 않습니다.')
    base=copy.deepcopy(m['state']['settings']);opt=base['optimization']
    col1,col2=p.columns(2)
    study=col1.selectbox('자습감독 인원',[0,1,2],index=int(base['studyCount']),key='exam_setting_study',format_func=lambda n:f'{n}명')
    maximum=col2.text_input('교사별 최대 감독 횟수 (0=상한 없음)',value=str(base['maxPerTeacher']),key='exam_setting_max')
    p.subheader('교과 동의어')
    p.caption('교과를 동일한 과목군으로 판단할 때 사용할 명칭입니다. JSON을 직접 수정하지 않아도 됩니다.')
    alias_rows=grid(p,'subject_aliases',_alias_rows(base),['alias','canonical'])
    p.subheader('시간표 미등록 교사의 부족 교시 투입')
    p.warning('기본값은 미등록 교사 제외입니다. 선택한 교사만 부족 교시에 한해 투입할 수 있으며 교과·담임·강사·배정불가 등 절대 금지는 유지됩니다.')
    fallback=p.checkbox('부족한 교시에만 시간표 미등록 교사 제한적 투입',value=bool(base.get('missingTimetableFallback',False)),key='exam_setting_fallback')
    enabled=set(base.get('missingFallbackTeacherIds',[]));chosen=[]
    with p.expander('부족 시 투입을 허용할 교사 선택 (교사별 체크박스)'):
        for t in _teachers(m):
            if p.checkbox(t['name']+' ('+t['id']+')',value=t['id'] in enabled,key='exam_setting_fallback_teacher_'+t['id']):chosen.append(t['id'])
    p.caption('교사 목록을 보려면 위 항목을 펼치세요. 투입 허용 설정을 켜면 적어도 한 명을 선택해야 합니다.')
    p.subheader('배정 최적화 설정')
    p.caption('원본 프리셋과 정·부·자습 부담 가중치를 재현합니다. 학년 우대는 0~100%로 입력합니다.')
    profiles=['balanced','fairness','consecutive','grade']; names={'balanced':'종합 균형','fairness':'공정성 우선','consecutive':'연강 방지 우선','grade':'담당 학년 우선'}
    profile=p.selectbox('최적화 우선순위',profiles,index=profiles.index(opt['profile']),format_func=lambda x:names[x],key='exam_setting_profile')
    a,b=p.columns(2)
    grade=a.text_input('담당 학년 우대 (%)',value=str(round(float(opt['gradeStrength'])*100)),key='exam_setting_grade_percent')
    lunch=b.selectbox('점심 긴 휴식 직전 교시',list(range(8)),index=int(opt['lunchBreakAfter']) if int(opt['lunchBreakAfter'])<8 else 0,
                      format_func=lambda x:f'{x}교시 이후 연강 단절' if x else '단절 없음',key='exam_setting_lunch')
    weights={}
    cols=p.columns(3)
    for col,(key,label) in zip(cols,[('mainWeight','정감독 부담 가중치'),('assistWeight','부감독 부담 가중치'),('studyWeight','자습감독 부담 가중치')]):
        weights[key]=col.text_input(label,value=str(opt[key]),key='exam_setting_'+key)
    toggles=[('avoidThree','3연강 억제'),('avoidFour','4~5연강 강력 억제'),('roleFairness','정·부·자습 역할별 균등화'),('burdenFairness','가중 부담 균등화'),('dateBalance','날짜별 감독 분산')]
    bools={key:p.checkbox(label,value=bool(opt[key]),key='exam_setting_'+key) for key,label in toggles}
    if p.button('감독설정·최적화 저장',key='exam_save_settings_form',disabled=not writable):
        try:
            E.require(grade.strip().isdigit() and 0<=int(grade)<=100,'담당 학년 우대는 0~100%의 정수입니다.')
            settings={**base,'studyCount':study,'maxPerTeacher':E.integer(maximum),'aliases':_aliases(alias_rows),
                      'missingTimetableFallback':fallback,'missingFallbackTeacherIds':chosen,
                      'optimization':{**opt,'profile':profile,'gradeStrength':int(grade)/100,
                                      'lunchBreakAfter':lunch,**{k:float(v) for k,v in weights.items()},**bools}}
            E.require(not fallback or bool(chosen),'부족 시 투입할 교사를 적어도 한 명 선택하세요.')
            E.optimization(settings,True)
            run(p,s,'saveSettings',dict(settings=settings))
        except ValueError as exc:p.error(str(exc))

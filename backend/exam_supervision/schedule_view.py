"""Grade-based exam schedule UI rendered by existing Streamlit-to-React bridge.

The original Apps Script's grade/day/period grid is implemented with the
existing DataGrid and Service.handle('saveSchedule'), not a second app/server.
"""

from __future__ import annotations

import pandas as pd
from . import engine as E
from .schedule_editor import PERIODS, build_schedule, grade_day_defaults, matrix_from_schedule, safe_matrix_update
from .view import display, grid, run, export


def _state_matrix(p, key, baseline):
    return p.session_state.get('_editor_' + key, pd.DataFrame(baseline)).copy(deep=True)


def _update_matrix(p, key, baseline, new):
    # ReactPort stores table edits as pandas.DataFrame at this exact key.
    p.session_state['_editor_' + key] = pd.DataFrame(new, columns=list(pd.DataFrame(baseline).columns))
    p.rerun()


def _ensure_registered_classes(p, s, m, writable):
    p.subheader('학년·학급 설정')
    p.caption('학년과 반은 별개의 값입니다. 같은 1반이어도 1학년 1반과 2학년 1반은 서로 다른 학급입니다. 반 번호는 연속되지 않아도 됩니다.')
    current = [dict(grade=c['grade'], classNo=c['classNo']) for c in m['classes']]
    with p.expander('학급 목록 확인·추가·수정 (시험일정 입력 전 먼저 저장)', expanded=not current):
        if current:
            display(p, [dict(학년=c['grade'], 반=c['classNo'], 학급=c['id']) for c in m['classes']])
        fields = ['grade', 'classNo']
        columns = {
            'grade': p.column_config.NumberColumn('학년', min_value=1, max_value=12, step=1),
            'classNo': p.column_config.NumberColumn('반', min_value=1, max_value=100, step=1),
        }
        edited = grid(p, 'classes', current, fields, columns)
        target = {(str(r.get('grade')), str(r.get('classNo'))) for r in edited}
        original = {(str(r['grade']), str(r['classNo'])) for r in current}
        if target != original:
            p.warning('학급 목록을 변경했습니다. 학급 설정 저장 후 최신 학급으로 시험일정을 편집하세요. 기존 시험일정이나 담임교사가 연결된 학급은 삭제할 수 없습니다.')
        if p.button('학급 설정 저장', key='exam_save_classes', disabled=not writable):
            run(p, s, 'saveClasses', dict(rows=edited))
    return current


def render_schedule(p, s, m, writable):
    p.subheader('1. 학년별 시험일정 설정')
    p.caption('원본 Apps Script처럼 학년 → 시험일차·날짜 → 교시 → 학급별 시험과목 순서로 입력합니다. 날짜와 과목은 학년별로 달라도 됩니다.')
    p.info('입력 방법: 표의 빈칸은 미운영, 「자습」은 자습시간, 그 외 텍스트는 시험과목입니다. 시험을 실시하지 않는 학년·날짜·교시를 해제하면 감독 배정에서 제외됩니다.')
    _ensure_registered_classes(p, s, m, writable)
    classes = m['classes']
    if not classes:
        p.warning('등록된 학급이 없습니다. 위 학급 설정에서 학년과 반을 입력하고 저장한 다음 일정을 작성하세요.')
        return

    grades = sorted({c['grade'] for c in classes})
    saved = grade_day_defaults(m['schedule'], m['gradePlan'], grades)
    p.caption('등록 학년: ' + ', '.join(f"{g}학년 ({len([c for c in classes if c['grade']==g])}개 학급)" for g in grades))
    grade_data = {}

    for grade in grades:
        own = [c for c in classes if c['grade'] == grade]
        previous = saved[str(grade)]
        with p.expander(f'{grade}학년 시험일정 · {len(own)}개 학급', expanded=grade == grades[0]):
            enabled = p.checkbox(f'{grade}학년 시험 실시', value=bool(previous['enabled']), key=f'exam_schedule_grade_{grade}_enabled')
            count_values = list(range(1, 6))
            count = p.selectbox(f'{grade}학년 시험일수', count_values,
                                index=min(4, max(0, len(previous['days']) - 1)), key=f'exam_schedule_grade_{grade}_day_count')
            p.caption('대상 학급: ' + ', '.join(c['id'] for c in own))
            if not enabled:
                p.warning(f'{grade}학년은 시험 미실시로 설정되어 있습니다. 저장 시 이 학년의 시험·자습 감독이 배정되지 않습니다.')
            day_data = []
            for day_number in range(1, count + 1):
                initial = next((d for d in previous['days'] if d['day'] == day_number),
                               {'day': day_number, 'enabled': True, 'date': '', 'periods': [1, 2, 3]})
                with p.expander(f'{grade}학년 · {day_number}일차', expanded=day_number == 1 and enabled):
                    day_enabled = p.checkbox('이 날짜 시험 실시', value=bool(initial['enabled']),
                                             key=f'exam_schedule_{grade}_{day_number}_enabled')
                    day_date = p.text_input('시험 날짜 (YYYY-MM-DD)', value=initial['date'],
                                            key=f'exam_schedule_{grade}_{day_number}_date', placeholder='예: 2026-11-23')
                    if E.valid_date(day_date):
                        p.caption('시험일 요일: '+E.weekday(day_date)+'요일')
                    p.caption('운영할 교시를 선택하세요. 체크하지 않은 교시는 저장·배정에서 제외됩니다.')
                    cols = p.columns(5)
                    selected_periods = []
                    for period, col in zip(PERIODS, cols):
                        active = col.checkbox(f'{period}교시', value=period in initial['periods'],
                                              key=f'exam_schedule_{grade}_{day_number}_period_{period}')
                        if active:
                            selected_periods.append(period)
                    matrix_key = f'exam_schedule_matrix_{grade}_{day_number}'
                    baseline = matrix_from_schedule(m['schedule'], grade, day_number, own)
                    p.caption('학급별 과목 시간표 · 「자습」 = 자습 / 빈칸 = 미운영')
                    p.info('시험과목은 표의 해당 학급 칸에 직접 입력하세요. 과목 일괄 적용을 사용할 때는 정확한 대상 교시를 먼저 확인하세요.')
                    bulk_period = p.selectbox('일괄 적용 대상 교시', list(PERIODS),
                                              key=f'exam_schedule_{grade}_{day_number}_bulk_period')
                    bulk_subject = p.text_input('일괄 시험과목', key=f'exam_schedule_{grade}_{day_number}_bulk_subject',
                                                placeholder='예: 국어')
                    buttons = p.columns(3)
                    if buttons[0].button('선택 교시 전체 학급에 과목 적용', key=f'exam_schedule_{grade}_{day_number}_bulk_exam',
                                         disabled=not day_enabled or not enabled or bulk_period not in selected_periods):
                        if not bulk_subject.strip() or bulk_subject.strip() in ('자습','미운영'):
                            p.error('적용할 시험과목을 입력하세요. 「자습」 및 「미운영」은 과목명으로 사용할 수 없습니다.')
                        else:
                            current = _state_matrix(p, matrix_key, baseline).to_dict('records')
                            _update_matrix(p, matrix_key, baseline, safe_matrix_update(current, own, bulk_period, bulk_subject.strip()))
                    if buttons[1].button('선택 교시 전체 자습', key=f'exam_schedule_{grade}_{day_number}_bulk_study',
                                         disabled=not day_enabled or not enabled or bulk_period not in selected_periods):
                        current = _state_matrix(p, matrix_key, baseline).to_dict('records')
                        _update_matrix(p, matrix_key, baseline, safe_matrix_update(current, own, bulk_period, '자습'))
                    if buttons[2].button('선택 교시 전체 미운영', key=f'exam_schedule_{grade}_{day_number}_bulk_off',
                                         disabled=not day_enabled or not enabled or bulk_period not in selected_periods):
                        current = _state_matrix(p, matrix_key, baseline).to_dict('records')
                        _update_matrix(p, matrix_key, baseline, safe_matrix_update(current, own, bulk_period, ''))

                    # Original Apps Script shortcuts: the day-wide actions never
                    # change other grades or other dates, and copying does not
                    # overwrite the destination date itself.
                    shortcuts = p.columns(4)
                    if shortcuts[0].button('이 날짜 전체 과목 적용', key=f'exam_schedule_{grade}_{day_number}_day_exam',
                                           disabled=not day_enabled or not enabled):
                        if not bulk_subject.strip() or bulk_subject.strip() in ('자습', '미운영'):
                            p.error('이 날짜에 적용할 시험과목을 입력하세요.')
                        else:
                            edited = _state_matrix(p, matrix_key, baseline).to_dict('records')
                            for selected in selected_periods:
                                edited = safe_matrix_update(edited, own, selected, bulk_subject.strip())
                            _update_matrix(p, matrix_key, baseline, edited)
                    if shortcuts[1].button('이 날짜 전체 자습', key=f'exam_schedule_{grade}_{day_number}_day_study',
                                           disabled=not day_enabled or not enabled):
                        edited = _state_matrix(p, matrix_key, baseline).to_dict('records')
                        for selected in selected_periods:
                            edited = safe_matrix_update(edited, own, selected, '자습')
                        _update_matrix(p, matrix_key, baseline, edited)
                    if shortcuts[2].button('이전 교시 복사', key=f'exam_schedule_{grade}_{day_number}_prev_period',
                                           disabled=not day_enabled or not enabled or not any(t < bulk_period for t in selected_periods)):
                        previous_period = max(t for t in selected_periods if t < bulk_period)
                        edited = _state_matrix(p, matrix_key, baseline).to_dict('records')
                        from_row = next(r for r in edited if int(r['교시']) == previous_period)
                        for row in edited:
                            if int(row['교시']) == bulk_period:
                                for clazz in own:
                                    row[clazz['id']] = from_row[clazz['id']]
                        _update_matrix(p, matrix_key, baseline, edited)
                    if shortcuts[3].button('이전 일차 복사', key=f'exam_schedule_{grade}_{day_number}_prev_day',
                                           disabled=not day_enabled or not enabled or day_number == 1):
                        old_key = f'exam_schedule_matrix_{grade}_{day_number-1}'
                        from_rows = _state_matrix(p, old_key,
                            matrix_from_schedule(m['schedule'],grade,day_number-1,own)).to_dict('records')
                        for period in PERIODS:
                            old_flag = f'exam_schedule_{grade}_{day_number-1}_period_{period}'
                            p.session_state[f'exam_schedule_{grade}_{day_number}_period_{period}'] = bool(
                                p.session_state.get(old_flag, period in next(
                                (d['periods'] for d in previous['days'] if d['day'] == day_number-1), [1,2,3])))
                        _update_matrix(p, matrix_key, baseline, from_rows)

                    table = p.data_editor(pd.DataFrame(baseline), key=matrix_key, hide_index=True,
                                          use_container_width=True, disabled=['교시'], height=330,
                                          column_config={'교시': p.column_config.NumberColumn('교시',min_value=1,max_value=5,step=1),
                                                         **{c['id']:p.column_config.TextColumn(c['id']+' 학급') for c in own}})
                    matrix_rows = table.fillna('').to_dict('records')
                    if any(int(r['교시']) not in selected_periods and any(str(r.get(c['id'],'')).strip() for c in own) for r in matrix_rows):
                        p.caption('체크하지 않은 교시의 표 내용은 저장 대상이 아닙니다.')
                    p.caption('선택 사항: 교시별 시작·종료 시각 (HH:MM). 같은 교시의 전체 학급에 적용합니다.')
                    times = {}
                    for period in selected_periods:
                        current = next((r for r in m['schedule'] if r['grade'] == grade and r['day'] == day_number and r['period'] == period), {})
                        timecols = p.columns(2)
                        start = timecols[0].text_input(f'{period}교시 시작시각', value=current.get('start',''),
                                                       key=f'exam_schedule_{grade}_{day_number}_{period}_start', placeholder='09:00')
                        end = timecols[1].text_input(f'{period}교시 종료시각', value=current.get('end',''),
                                                     key=f'exam_schedule_{grade}_{day_number}_{period}_end', placeholder='09:45')
                        times[period] = (start.strip(), end.strip())
                    day_data.append(dict(day=day_number, enabled=day_enabled, date=day_date.strip(),
                                         periods=selected_periods, matrix=matrix_rows, times=times))
            grade_data[grade] = {'enabled': enabled, 'days': day_data}

    p.subheader('학년별 시험일정 저장')
    p.caption('각 학년의 시험 날짜·교시·학급 과목을 확인하고 한 번에 저장하세요. 저장 전에는 Google Sheets에 반영되지 않습니다.')
    try:
        payload = build_schedule(m['schedule'], classes, grade_data)
        p.success(f"저장 전 검증 완료 · 시험/자습 학급별 교시 {len(payload['rows'])}건 · 대상 {len(grades)}개 학년")
    except ValueError as exc:
        payload = None
        p.warning('입력 확인 필요 · '+str(exc))
    confirm = p.checkbox('학년별 대상 학급·교시와 기존 일정 교체를 확인했습니다.', key='exam_schedule_save_confirm')
    if p.button('학년별 시험일정 전체 저장', key='exam_save_schedule', type='primary',
                disabled=not writable or not confirm or payload is None):
        run(p, s, 'saveSchedule', payload)
    p.caption('저장 중 오류가 발생하면 기존 시트를 덮어쓰지 않고 원인을 표시합니다. 화면의 미저장 편집을 유지한 상태로 확인하세요.')

    with p.expander('고급 설정 · 원본 행 형식으로 확인/편집'):
        p.warning('고급 편집은 별도 저장입니다. 현재 학년별 편집 중 미저장 데이터가 있으면 먼저 위에서 저장하세요.')
        fields = ['day', 'date', 'period', 'classId', 'type', 'subject', 'start', 'end']
        rows = grid(p, 'schedule_advanced', m['schedule'], fields,
                    {'type':p.column_config.SelectboxColumn('구분',options=['EXAM','STUDY']),
                     'day':p.column_config.NumberColumn('일차',min_value=1,max_value=5,step=1),
                     'period':p.column_config.NumberColumn('교시',min_value=1,max_value=5,step=1)})
        ack = p.checkbox('원본 행 편집 내용을 검토했습니다.',key='exam_schedule_advanced_confirm')
        if p.button('고급 행 형식으로 일정 저장', key='exam_save_schedule_raw', disabled=not writable or not ack):
            run(p, s, 'saveSchedule', dict(rows=rows))
    with p.expander('현재 저장된 일정 확인·다운로드'):
        display(p, m['schedule'])
        export(p, m['schedule'], '시험일정')

"""Admin-only Phase 5B workflow; student accounts cannot access these functions."""
import json
from collections import Counter
from io import BytesIO
import pandas as pd


from diple.enrollment.integration import EnrollmentExportService
from diple.sectioning_export import plan_to_excel
from diple.sectioning import (SectioningError,SectioningPlanService,preflight,generate_plan,
                         validate_plan,move_student,apply_plan_to_project)


def admin_sectioning_page(project):
    school=project['school'];school_id=school['id']
    st.header('🧩 고교학점제 > 자동 이동반 편성 (Phase 5B)')
    st.caption('5A 확정 스냅샷 → 개설 가능성 확인 → 이동반 자동배정 → 검토·버전저장 → 시간표 연결')
    if False:
        st.warning('로컬 SQLite는 Streamlit Community Cloud에서 영구 저장되지 않습니다. 운영 전 검증용으로만 사용하세요.')
    try:
        svc=service();token=_admin_login(svc,school_id)
        if not token:return
        plan_svc=SectioningPlanService(svc)
        campaigns=svc.list_campaigns(token,school_id)
        if not campaigns:st.info('Phase 5A에서 먼저 수강신청을 생성·확정해야 합니다.');return
        campaign=st.selectbox('수강신청 회차',campaigns,format_func=lambda c:f"{c['title']} — {c['state']}",key='section_campaign')
        versions=svc.snapshots(token,school_id,campaign['campaign_id'])
        if not versions:st.info('확정된 수강신청 버전이 없습니다. Phase 5A에서 최종 확정하세요.');return
        chosen=st.selectbox('5A 확정 버전 (변경되지 않는 기준)',versions,
                format_func=lambda s:f"v{s['version']} / {s['created_at']} / {s['snapshot_id'][:8]}",key='section_snapshot')
        snapshot=svc.get_snapshot(token,school_id,chosen['snapshot_id'])
        report=preflight(snapshot)
        st.metric('선택과목 제출 학생',len(snapshot['students']))
        c1,c2=st.columns(2)
        c1.metric('개설 대상 과목',sum(1 for n in report['counts'].values() if n))
        c2.metric('신청 과목 선택 건수',sum(report['counts'].values()))
        if report['warnings']:
            st.warning('\n'.join(report['warnings']))
        if report['errors']:
            st.error('\n'.join(report['errors']));return
        counts=[]
        for o in snapshot['offerings']:
            n=report['counts'].get(o['offering_id'],0)
            counts.append({'과목':o['course_name'],'그룹ID':o['group_id'],'신청':n,
                           '최소개설':o['min_students'],'계획정원':o['planned_capacity'],
                           '분반당 정원':o['section_capacity'],
                           '기본 예상 분반수':(n+int(o['section_capacity'])-1)//int(o['section_capacity'])})
        with st.expander('과목별 신청·개설 가능성',expanded=True):
            st.dataframe(pd.DataFrame(counts),hide_index=True,use_container_width=True)
        cols=st.columns(3)
        seconds=cols[0].number_input('탐색 제한(초)',min_value=2,max_value=180,value=20,key='sec_time')
        seed=cols[1].number_input('재현 가능한 시드',min_value=1,max_value=999999,value=1,key='sec_seed')
        fallback=cols[2].checkbox('간단한 탐색 엔진 (교과목 17개 이하)',value=False,key='sec_fallback')
        if st.button('자동 이동반 편성 실행',type='primary'):
            try:
                plan=generate_plan(snapshot,seconds=seconds,seed=seed,force_fallback=fallback)
                st.session_state.phase5b_plan=plan
                st.success(f"생성됨: {len(plan['sections'])}개 이동반 / {len(plan['assignments'])}건 배정 / {plan['solver']}")
            except SectioningError as e:st.error(str(e))
        saved=plan_svc.list_versions(token,school_id,snapshot['snapshot_id'])
        with st.expander('저장된 이전 편성 버전 조회'):
            if saved:
                selected=st.selectbox('불변 저장 버전',saved,format_func=lambda x:f"v{x['version']} {x['created_at']}",key='section_version')
                if st.button('이전 저장본을 작업본으로 불러오기'):
                    st.session_state.phase5b_plan=plan_svc.get(token,school_id,selected['plan_id'])
                    st.success('이전 버전을 복사하여 작업본으로 불러왔습니다. 원본 버전은 변경되지 않습니다.')
            else:st.info('저장된 편성본이 없습니다.')
        plan=st.session_state.get('phase5b_plan')
        if not plan or plan['source_snapshot_id']!=snapshot['snapshot_id']:
            st.info('편성 실행 후 학생별 이동반 배정과 시간표 연결을 할 수 있습니다.');return
        errors=validate_plan(snapshot,plan)
        if errors:st.error('작업본 오류: '+' / '.join(errors[:12]));return
        tab1,tab2,tab3,tab4=st.tabs(['이동반 현황','학생별 배정','수동 조정·저장','시간표 연결'])
        with tab1:
            st.dataframe(pd.DataFrame(plan['groups']),hide_index=True,use_container_width=True)
            usage=Counter(x['section_id'] for x in plan['assignments'])
            courses={x['offering_id']:x['course_name'] for x in snapshot['offerings']}
            st.dataframe(pd.DataFrame([{'분반ID':x['section_id'],'과목':courses[x['offering_id']],
                '운영그룹':x['group_id'],'구획':x['lane']+1,'구획 내 시작':x['offset']+1,
                '연속 단위':x['units'],'인원':usage[x['section_id']],'최대정원':x['capacity']}
                    for x in plan['sections']]),hide_index=True,use_container_width=True)
        with tab2:
            assignments=[{'학생 내부ID':a['student_id'],'과목':courses[a['offering_id']],
                           '이동반ID':a['section_id']} for a in plan['assignments']]
            st.dataframe(pd.DataFrame(assignments),hide_index=True,use_container_width=True)
            st.download_button('학생별 이동반 CSV',pd.DataFrame(assignments).to_csv(index=False).encode('utf-8-sig'),
                  file_name='diple_phase5b_student_sections.csv',mime='text/csv')
            st.download_button('분반 편성 검토 Excel',plan_to_excel(snapshot,plan),
                  file_name='diple_phase5b_sections.xlsx',
                  mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            st.download_button('분반 편성 JSON',json.dumps(plan,ensure_ascii=False,indent=2).encode('utf-8'),
                  file_name='diple_phase5b_plan.json',mime='application/json')
        with tab3:
            with st.form('phase5b_move'):
                options=[(a['student_id'],a['offering_id']) for a in plan['assignments']]
                pair=st.selectbox('학생·과목',options,format_func=lambda x:f'{x[0]} / {courses[x[1]]}')
                alternatives=[s for s in plan['sections'] if s['offering_id']==pair[1]]
                section=st.selectbox('이동할 분반',alternatives,format_func=lambda x:f"{x['section_id']} (구획 {x['lane']+1})")
                if st.form_submit_button('학생 이동반 변경 미리보기'):
                    try:
                        st.session_state.phase5b_plan=move_student(snapshot,plan,pair[0],pair[1],section['section_id'])
                        st.session_state.phase5b_plan.pop('resources_confirmed',None)
                        st.success('검증된 작업본으로 변경되었습니다. 저장 버튼을 누르기 전에는 영구 저장되지 않습니다.')
                    except SectioningError as e:st.error(str(e))
            reason=st.text_input('새 버전 저장 사유 (4자 이상)',value='편성 결과 검토 완료')
            acknowledged=st.checkbox('개설 기준 미달·초과·공동교육과정 경고를 검토했습니다.')
            if st.button('편성 결과 불변 버전 저장',type='primary'):
                try:
                    st.session_state.phase5b_plan=plan_svc.save(token,school_id,snapshot,{**plan,'resources_confirmed':False},reason,ack_warnings=acknowledged)
                    st.success('저장 완료: 새 버전 ID '+st.session_state.phase5b_plan['plan_id'])
                except SectioningError as e:st.error(str(e))
        with tab4:
            render_resources(snapshot,plan,svc,token,school_id)
    except (SectioningError,ValueError) as e:
        st.error(str(e))
    except Exception:
        st.error('이동반 편성을 처리하지 못했습니다. 저장소 설정 또는 권한을 확인해 주세요.')

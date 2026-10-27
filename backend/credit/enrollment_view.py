"""Streamlit Phase 5A frontend. All domain mutations go through EnrollmentService."""
import json
import os
import secrets
from datetime import datetime,time,timezone
from io import BytesIO
from zoneinfo import ZoneInfo
import pandas as pd

from diple.enrollment.service import EnrollmentService, EnrollmentError, AccessDenied, STATES, utc_parse
from diple.enrollment.integration import EnrollmentExportService

KST=ZoneInfo('Asia/Seoul')


def _clear_student_state():
    # Streamlit session state can outlive an individual login. Never show a
    # previously logged-in student's widget selections to the next account.
    for key in list(st.session_state):
        if key.startswith(('student_choices_','group_','cancel_ok_')) or key=='enrollment_req_key':
            del st.session_state[key]


def _clear_admin_secret_state():
    # One-use codes may only be shown within the admin session that issued them.
    for key in ('enroll_new_codes','last_reset_code','enroll_roster_preview'):
        st.session_state.pop(key,None)


def _secret(section,key,default=None):
    try:
        return st.secrets.get(section,{}).get(key,default)
    except Exception:
        return default



def _safe_date(date,clock):
    return datetime.combine(date,clock,tzinfo=KST).astimezone(timezone.utc).isoformat()


def _guarded(fn):
    try:
        fn()
    except (EnrollmentError,ValueError,KeyError) as exc:
        st.error(str(exc))
    except Exception:
        # no tracebacks/data dumps to public student UI
        st.error('처리를 완료하지 못했습니다. 입력값을 보존했으니 관리자에게 문의하거나 재시도하세요.')


def _show_confirm_receipt(submission,catalog,choices):
    offerings={x['offering_id']:x for x in catalog['offerings']}
    titles=[offerings[x]['course_name'] for x in choices if x in offerings]
    text=('Diple Timetable Maker 수강신청 확인서\n'
          f"수강신청: {catalog['campaign']['title']}\n접수번호: {submission['receipt']}\n"
          f"과목: {', '.join(titles)}\n")
    st.success(f"영구 저장된 접수번호: {submission['receipt']}")
    st.download_button('신청 확인서 다운로드 (TXT)',data=text.encode('utf-8-sig'),
                       file_name=f"enrollment_{submission['receipt']}.txt",mime='text/plain')


def student_page():
    st.title('🎓 Diple 학생 수강신청')
    st.caption('개인별 계정 인증 · 선택조건 서버 검증 · 확정 접수번호 발급')
    if False:
        st.warning('현재는 로컬 개발용 SQLite입니다. Streamlit Community Cloud의 임시 디스크에는 실학생 데이터를 입력하지 마세요.')
    else:
        st.caption('원격 Google Sheets 수강신청 저장소 사용 중 · 대량 동시접속 시 충돌 후 재시도가 필요할 수 있습니다.')
    try:svc=service()
    except EnrollmentError as exc:st.error(str(exc));return
    token=st.session_state.get('student_enrollment_token')
    identity=None
    if token:
        try:
            identity=svc.session_info(token)
            if identity['role']!='student':identity=None
        except AccessDenied:
            _clear_student_state();st.session_state.pop('student_enrollment_token',None);token=None
    if not identity:
        school=st.text_input('학교 내부 ID',value=st.query_params.get('school_id',''),key='student_school')
        choice=st.radio('계정 이용',['로그인','최초 활성화'],horizontal=True)
        with st.form('student_auth'):
            student_id=st.text_input('학생 고유 ID (관리자가 발급)')
            if choice=='로그인':
                password=st.text_input('비밀번호',type='password')
                submit=st.form_submit_button('로그인',type='primary')
                if submit:
                    def do_login():
                        new_token=svc.login(school,student_id,password)
                        _clear_student_state()
                        st.session_state.student_enrollment_token=new_token
                        st.rerun()
                    _guarded(do_login)
            else:
                code=st.text_input('일회용 활성화 코드',type='password')
                password=st.text_input('새 비밀번호 (12자 이상)',type='password')
                submit=st.form_submit_button('비밀번호 설정 및 활성화')
                if submit:
                    def do_activate():
                        svc.activate(school,student_id,code,password)
                        st.success('활성화되었습니다. 로그인 메뉴에서 접속하세요.')
                    _guarded(do_activate)
        return
    school=identity['school_id']
    st.write(f"**내 계정:** {identity['student_id']} · 학교 {school}")
    profiles=svc.my_profile(token,school)
    if profiles:
        p=profiles[0]
        st.caption(f"본인 학적 확인: {p['name']} / {p['academic_year']}학년도 {p['semester']}학기 / {p['grade']}학년 / {p['class_id']} / {p['number']}번")
    if st.button('로그아웃',key='student_logout'):
        svc.logout(token);_clear_student_state();st.session_state.pop('student_enrollment_token',None);st.rerun()
    campaigns=svc.list_campaigns(token,school,student_only=True)
    if not campaigns:
        st.info('본인 학년도·학기·학급에 게시된 수강신청이 없습니다.');return
    selected=st.selectbox('수강신청 회차',campaigns,format_func=lambda x:f"{x['title']} — {x['state']}")
    def student_workflow():
        catalog=svc.catalog(token,school,selected['campaign_id']);c=catalog['campaign']
        st.info(c['notice'] or '안내문이 등록되지 않았습니다.')
        st.caption(f"신청: {utc_parse(c['starts_at']).astimezone(KST):%Y-%m-%d %H:%M} ~ "
                   f"{utc_parse(c['ends_at']).astimezone(KST):%Y-%m-%d %H:%M} / 수정 마감: "
                   f"{utc_parse(c['edits_until']).astimezone(KST):%Y-%m-%d %H:%M}")
        sub=svc.my_submission(token,school,c['campaign_id'])
        existing=(sub['draft'] or sub['current'] or {}).get('choices',[])
        key=f"student_choices_{c['campaign_id']}"
        if key not in st.session_state:
            st.session_state[key]=existing
        offerings={o['offering_id']:o for o in catalog['offerings']}
        allchoices=[]
        for group in catalog['groups']:
            entries=[o for o in catalog['offerings'] if o['group_id']==group['group_id']]
            opts=[x['offering_id'] for x in entries if x['availability']!='폐강']
            def label(oid):
                x=offerings[oid]
                return f"{x['course_name']} · {x['credits']}학점 · 구획 {x['units']}단위 ({x['availability']})"
            chosen=[x for x in st.session_state[key] if x in opts]
            picked=st.multiselect(f"{group['name']} — {group['min_count']}~{group['max_count']}개 선택",
                                   options=opts,default=chosen,format_func=label,key=f"group_{c['campaign_id']}_{group['group_id']}")
            st.caption(f"현재 {len(picked)}개 선택 / 그룹 요구 {group['min_count']}~{group['max_count']}개 / "
                       f"{max(0,group['min_count']-len(picked))}개 추가 필요")
            allchoices+=picked
        st.session_state[key]=allchoices
        total=sum(offerings[x]['credits'] for x in allchoices)
        st.metric('선택 학점 합계',f"{total}학점",f"요구 {c['min_total_credits']}~{c['max_total_credits']}학점",delta_color='off')
        st.write('**신청 미리보기**')
        st.dataframe(pd.DataFrame([{'그룹':next(g['name'] for g in catalog['groups'] if g['group_id']==offerings[x]['group_id']),
                                    '과목':offerings[x]['course_name'],'학점':offerings[x]['credits']} for x in allchoices]),
                     hide_index=True,use_container_width=True)
        if sub['current']:
            _show_confirm_receipt(sub['current'],catalog,sub['current']['choices'])
            st.caption(f"현재 유효 신청 버전: {sub['version']} — 재제출 시 버전이 증가합니다.")
        col1,col2=st.columns(2)
        if col1.button('임시 저장',use_container_width=True):
            _guarded(lambda: (svc.save_draft(token,school,c['campaign_id'],allchoices),st.success('임시저장이 완료되었습니다.')))
        if col2.button('검증 후 최종 제출/재제출',type='primary',use_container_width=True):
            # Key remains stable if the request fails; duplicates cannot create new submissions.
            st.session_state.setdefault('enrollment_req_key',secrets.token_urlsafe(24))
            def submit_now():
                outcome=svc.submit(token,school,c['campaign_id'],allchoices,
                                   st.session_state.enrollment_req_key,expected_version=sub['version'])
                st.session_state.enrollment_req_key=secrets.token_urlsafe(24)
                st.success(f"신청 완료! 접수번호 {outcome['receipt']}")
                st.rerun()
            _guarded(submit_now)
        if sub['current']:
            with st.expander('신청 취소 (제출 이력은 보존)'):
                checked=st.checkbox('현재 신청을 취소할 것을 확인합니다.',key=f"cancel_ok_{c['campaign_id']}")
                if st.button('현재 유효 신청 취소',disabled=not checked):
                    def cancel_now():
                        svc.cancel(token,school,c['campaign_id'])
                        st.session_state.pop(key,None)
                        st.success('취소되었습니다.')
                        st.rerun()
                    _guarded(cancel_now)
        with st.expander('과거 제출 이력'):
            history=svc.history(token,school,c['campaign_id'])
            st.dataframe(pd.DataFrame([{'접수번호':x['receipt'],'제출 시각 (UTC)':x['submitted_at']} for x in history]),hide_index=True)
    _guarded(student_workflow)



def _roster_template(project):
    rows=[]
    for student in project.get('students',[]):
        c=next((x for x in project.get('classes',[]) if x['id']==student['class_id']),None)
        rows.append({'student_id':student['id'],'academic_year':project['school']['academic_year'],
                     'semester':project['school']['semester'],'grade':c['grade'] if c else '',
                     'class_id':student['class_id'],'number':'','name':student['name'],'status':'재학',
                     'eligible':True,'prior_courses':''})
    if not rows:rows=[{'student_id':'S-EXAMPLE-001','academic_year':project['school']['academic_year'],
                      'semester':project['school']['semester'],'grade':1,'class_id':project['classes'][0]['id'] if project['classes'] else '',
                      'number':1,'name':'예시학생','status':'재학','eligible':True,'prior_courses':''}]
    io=BytesIO();pd.DataFrame(rows).to_excel(io,index=False);return io.getvalue()


def admin_page(project):
    school=project['school'];sid=school['id']
    st.header('🎓 고교학점제 > 수강신청 관리')
    st.caption('기존 시간표 엔진과 분리 저장 · 명시적 스냅샷 확정 · 학생 신청내역 무단 변경 방지')
    if False:
        st.warning('SQLite 로컬 개발판: Streamlit Community Cloud 재시작 시 데이터가 유실될 수 있습니다. 학생 실데이터 운영 금지.')
    else:
        st.warning('Google Sheets 원격 저장은 구현되었지만 실서비스 부하/권한/복구 검증 전입니다. 학교 운영자가 검증을 완료해야 합니다.')
    try:svc=service()
    except EnrollmentError as exc:st.error(str(exc));return
    token=_admin_login(svc,sid)
    if not token:return
    if False:
        svc.logout(token);_clear_admin_secret_state();st.session_state.pop('admin_enrollment_token',None);st.rerun()
    pages=['수강신청 생성','선택과목 그룹','학생명렬','신청 게시·상태','신청 현황','미신청자',
           '개설 가능성 분석','결과 검토','최종 확정','데이터 내보내기','감사 로그']
    page=st.selectbox('작업 메뉴',pages)
    campaigns=svc.list_campaigns(token,sid)
    selected=None
    if campaigns:
        selected=st.selectbox('작업 대상 수강신청',campaigns,format_func=lambda x:f"{x['title']} ({x['grade']}학년/{x['state']})")
    cid=selected['campaign_id'] if selected else None
    if page=='수강신청 생성':
        st.subheader('새 수강신청')
        with st.form('create_enroll_campaign'):
            title=st.text_input('수강신청명',value=f"{school['academic_year']}학년도 선택과목 수강신청")
            grade=st.selectbox('대상 학년',[1,2,3]);manager=st.text_input('담당 관리자')
            class_choices=[x['id'] for x in project['classes'] if int(x['grade'])==grade]
            classes=st.multiselect('대상 학급 (비워두면 해당 학년 전체)',class_choices)
            start=st.date_input('시작 날짜',value=datetime.now(KST).date());starttime=st.time_input('시작 시각',value=time(9,0))
            end=st.date_input('신청 종료 날짜',value=datetime.now(KST).date());endtime=st.time_input('종료 시각',value=time(18,0))
            edit_date=st.date_input('수정 허용 종료 날짜',value=datetime.now(KST).date());edit_time=st.time_input('수정 마감 시각',value=time(19,0))
            ctype=st.text_input('수강신청 유형',value='본신청');confirm=st.text_input('확정 방식',value='관리자 검증 후 확정')
            notice=st.text_area('안내문');contact=st.text_input('문의 연락처')
            a,b=st.columns(2);minimum=a.number_input('전체 최소 학점',min_value=0,value=0)
            maximum=b.number_input('전체 최대 학점',min_value=0,value=999)
            submit=st.form_submit_button('수강신청 생성',type='primary')
        if submit:
            def create():
                new_id=svc.create_campaign(token,sid,{'academic_year':school['academic_year'],'semester':school['semester'],
                    'title':title,'grade':grade,'class_ids':classes,'manager':manager,'starts_at':_safe_date(start,starttime),
                    'ends_at':_safe_date(end,endtime),'edits_until':_safe_date(edit_date,edit_time),
                    'campaign_type':ctype,'confirm_method':confirm,'notice':notice,'contact':contact,
                    'min_total_credits':minimum,'max_total_credits':maximum})
                st.success(f'생성 완료: {new_id}')
            _guarded(create)
    elif not cid:
        st.info('먼저 수강신청을 생성해 주세요.')
    elif page=='선택과목 그룹':
        catalog=svc.catalog(token,sid,cid)
        st.dataframe(pd.DataFrame(catalog['groups']),hide_index=True)
        st.dataframe(pd.DataFrame(catalog['offerings']),hide_index=True)
        if selected['state']!='작성 중':
            st.info('게시 후 제출자 보호를 위해 그룹과 과목의 직접 변경은 잠겼습니다.')
        else:
            with st.form('group_add'):
                name=st.text_input('그룹 표시명')
                a,b=st.columns(2);minimum=a.number_input('최소 선택 과목 수',min_value=0,value=1)
                maximum=b.number_input('최대 선택 과목 수',min_value=0,value=1)
                a,b=st.columns(2);minc=a.number_input('그룹 최소 학점',min_value=0,value=0)
                maxc=b.number_input('그룹 최대 학점',min_value=0,value=999)
                units=st.number_input('요구 운영구획 단위 (0=미적용)',min_value=0,value=0)
                required=st.checkbox('필수 선택그룹',value=True)
                if st.form_submit_button('그룹 추가'):
                    _guarded(lambda: (svc.add_group(token,sid,cid,name,minimum,maximum,required=required,
                           min_credits=minc,max_credits=maxc,target_units=units or None),st.success('그룹 추가 완료')))
            if catalog['groups']:
                with st.form('offering_add'):
                    group=st.selectbox('추가할 그룹',catalog['groups'],format_func=lambda x:x['name'])
                    subjects=project.get('subjects',[])
                    course=st.selectbox('시간표 과목(연동 ID)',subjects,format_func=lambda x:f"{x['id']} — {x['name']}") if subjects else None
                    a,b=st.columns(2)
                    credits=a.number_input('과목 학점',min_value=1,value=int(course.get('credits') or 3) if course else 3)
                    units=b.number_input('운영 구획 단위',min_value=1,value=credits)
                    a,b,c=st.columns(3)
                    minstudents=a.number_input('최소 개설 인원',min_value=0,value=0)
                    capacity=b.number_input('계획 정원 (신청 차단 아님)',min_value=1,value=32)
                    section=c.number_input('분반 최대 수용인원',min_value=1,value=32)
                    prereqs=st.text_input('선이수 과목 ID (쉼표 구분)')
                    exclusions=st.text_input('상호배제 과목 ID (쉼표 구분)')
                    avail=st.selectbox('개설 상태',['개설 예정','미확정','폐강']);joint=st.checkbox('공동교육과정')
                    if st.form_submit_button('과목 추가') and course:
                        def add():
                            svc.add_offering(token,sid,cid,group['group_id'],course_id=course['id'],course_name=course['name'],
                                credits=credits,units=units,min_students=minstudents,planned_capacity=capacity,
                                section_capacity=section,prerequisites=[x.strip() for x in prereqs.split(',') if x.strip()],
                                exclusions=[x.strip() for x in exclusions.split(',') if x.strip()],availability=avail,
                                joint_education=joint)
                            st.success('선택과목이 추가되었습니다.')
                        _guarded(add)
    elif page=='학생명렬':
        st.download_button('기존 프로젝트 기반 Excel 학생명렬 양식',data=_roster_template(project),
                           file_name='diple_student_roster.xlsx',mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        upload=st.file_uploader('학생명렬 Excel/CSV',type=['xlsx','csv'])
        if upload:
            def parse_and_preview():
                df=pd.read_excel(upload,dtype=object) if upload.name.lower().endswith('.xlsx') else pd.read_csv(upload,dtype=object)
                mandatory={'student_id','grade','class_id','number','name'}
                if mandatory-set(df.columns):raise EnrollmentError('누락된 열: '+', '.join(sorted(mandatory-set(df.columns))))
                items=df.where(pd.notna(df),None).to_dict('records')
                for r in items:
                    r['prior_courses']=[v.strip() for v in str(r.get('prior_courses') or '').split(',') if v.strip()]
                    if r.get('eligible') is None:r['eligible']=True
                    else:r['eligible']=str(r['eligible']).strip().lower() not in ('false','0','n','아니오')
                    if r.get('status') is None:r['status']='재학'
                report=svc.roster_report(token,sid,int(school['academic_year']),int(school['semester']),items,
                                         {x['id']:int(x['grade']) for x in project['classes']})
                st.session_state.enroll_roster_preview=(items,report)
            _guarded(parse_and_preview)
        preview=st.session_state.get('enroll_roster_preview')
        if preview:
            items,report=preview
            st.write(f"검증: {len(items)}행 / 오류 {len(report['errors'])}건")
            if report['errors']:st.dataframe(pd.DataFrame(report['errors']),hide_index=True)
            else:st.dataframe(pd.DataFrame(report['rows']),hide_index=True)
            if st.button('전체 검증 통과 명렬을 원자적으로 병합',disabled=not report['valid']):
                def importing():
                    codes=svc.import_roster(token,sid,int(school['academic_year']),int(school['semester']),items,
                                             {x['id']:int(x['grade']) for x in project['classes']})
                    st.session_state.enroll_new_codes=codes
                    st.session_state.pop('enroll_roster_preview',None)
                    st.success('병합 완료. 기존 신청 내역은 유지됩니다.')
                _guarded(importing)
        codes=st.session_state.get('enroll_new_codes')
        if codes:
            st.warning('활성화 코드는 최초 발급 시 한 번만 표시됩니다. 안전하게 전달하고 즉시 다운로드 자료를 폐기하세요.')
            st.download_button('초기 활성화 코드 CSV',pd.DataFrame(codes).to_csv(index=False).encode('utf-8-sig'),
                               file_name='one_time_activation_codes.csv',mime='text/csv')
            if st.button('코드 표시 지우기'):
                st.session_state.pop('enroll_new_codes',None);st.rerun()
        with st.expander('학생 계정 복구'):
            who=st.text_input('학생 내부 ID',key='reset_student')
            reason=st.text_input('초기화 사유 (4자 이상)',key='reset_reason')
            if st.button('기존 로그인 세션 폐기 후 새 코드 발급'):
                def do_reset():
                    st.session_state.last_reset_code=svc.reset_activation(token,sid,who,reason)
                _guarded(do_reset)
            if st.session_state.get('last_reset_code'):
                st.code(st.session_state.last_reset_code)
                if st.button('발급 코드 화면에서 지우기'):
                    st.session_state.pop('last_reset_code',None);st.rerun()
    elif page=='신청 게시·상태':
        st.write('현재 상태:',selected['state'])
        st.caption('학생은 같은 앱의 로그인 화면에서 학생 온라인 수강신청 버튼을 선택합니다. 학교 내부 ID: '+sid)
        if selected['state']=='작성 중' and st.button('수강신청 게시',type='primary'):
            _guarded(lambda: (svc.publish(token,sid,cid),st.success('게시됨')))
        elif selected['state'] in ('게시됨','신청 진행','신청 마감','최종 확정'):
            nxt={'게시됨':'신청 진행','신청 진행':'신청 마감','신청 마감':'검토 중','최종 확정':'분반 전달'}[selected['state']]
            if st.button(f'상태 변경: {nxt}'):
                _guarded(lambda: (svc.advance(token,sid,cid,nxt),st.success('상태 변경 완료')))
    elif page in ('신청 현황','미신청자','개설 가능성 분석','결과 검토','최종 확정'):
        dash=svc.dashboard(token,sid,cid)
        a,b,c,d=st.columns(4)
        a.metric('대상 학생',dash['eligible']);b.metric('제출 완료',dash['submitted'])
        c.metric('미신청',len(dash['missing']));d.metric('신청률',f"{dash['submission_rate']}%")
        if page in ('신청 현황','개설 가능성 분석','결과 검토'):
            st.dataframe(pd.DataFrame(dash['courses']),hide_index=True,use_container_width=True)
        if page in ('미신청자','결과 검토'):
            st.dataframe(pd.DataFrame(dash['missing']),hide_index=True)
        if dash['problems']:
            st.error(f"학생별 오류 {len(dash['problems'])}건");st.dataframe(pd.DataFrame(dash['problems']),hide_index=True)
        if page=='결과 검토':
            st.caption('마감 후 예외 변경은 신청 이력과 감사로그를 남깁니다.')
            who=st.text_input('예외 수정 학생 ID')
            newchoices=st.multiselect('관리자 지정 과목',dash['courses'],format_func=lambda x:x['course_name'])
            reason=st.text_input('예외 수정 사유')
            if st.button('검증 및 예외 수정'):
                _guarded(lambda: (svc.admin_override(token,sid,cid,who,[x['offering_id'] for x in newchoices],reason),
                                  st.success('감사로그를 남기고 수정했습니다.')))
        if page=='최종 확정':
            versions=svc.snapshots(token,sid,cid)
            st.write('기존 스냅샷',versions)
            if selected['state']=='검토 중':
                acknowledge=st.checkbox('미신청 학생이 있으면 제외됨을 확인했습니다.')
                if st.button('전체 조건 재검증 후 불변 확정 버전 생성',type='primary'):
                    _guarded(lambda: (svc.finalize(token,sid,cid,ack_missing=acknowledge),st.success('확정 스냅샷 저장 완료')))
            if selected['state'] in ('최종 확정','분반 전달'):
                reason=st.text_input('재검토 사유 (8자 이상)')
                if st.button('원본 확정본 보존 후 재검토 열기'):
                    _guarded(lambda: (svc.reopen(token,sid,cid,reason),st.success('재검토 상태로 변경')))
    elif page=='데이터 내보내기':
        versions=svc.snapshots(token,sid,cid)
        if not versions:st.info('아직 확정 버전이 없습니다.')
        else:
            version=st.selectbox('확정 버전',versions,format_func=lambda x:f"v{x['version']} / {x['created_at']}")
            snap=svc.get_snapshot(token,sid,version['snapshot_id'])
            exporter=EnrollmentExportService
            a,b,c=st.columns(3)
            a.download_button('Excel',exporter.to_excel(snap),'enrollment_snapshot.xlsx')
            b.download_button('CSV',exporter.to_csv(snap),'enrollment_snapshot.csv')
            c.download_button('JSON',exporter.to_json(snap),'enrollment_snapshot.json')
            if st.button('확정본을 현재 시간표의 기존 선택반 수업에 연결 (복사본 검증)'):
                def apply():
                    updated,notes=exporter.apply_to_project(project,snap)
                    st.session_state.project=updated
                    st.session_state.dirty=True;st.session_state.result=None
                    st.success('검증을 통과해 세션의 시간표 프로젝트에 연결했습니다. JSON 또는 기존 저장소에 별도 저장하세요.')
                    for note in notes:st.warning(note)
                _guarded(apply)
            up=st.file_uploader('이전 Excel 다시 가져오기 구조검증 (기존 확정본 변경 없음)',type=['xlsx'])
            if up and st.button('외부 편성자료 입력검증'):
                problems=exporter.import_validate_xlsx(snap,up.getvalue())
                if problems:st.dataframe(pd.DataFrame(problems),hide_index=True)
                else:st.success('입력 형식 및 참조 무결성 검증 통과 (실제 분반 결과 적용 기능은 미구현)')
    elif page=='감사 로그':
        st.dataframe(pd.DataFrame(svc.audit_logs(token,sid,cid)),hide_index=True)

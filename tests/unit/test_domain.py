from datetime import date
import pandas as pd
import pytest
from tests.fixtures import make_application,login

@pytest.fixture
def app():
    app,_=make_application();login(app);return app

@pytest.mark.parametrize('start,end,include,expected',[
    ('2022-03-01','2023-02-28',True,360),
    ('2024-02-01','2024-02-29',True,30),
    ('2026-01-01','2026-01-01',False,0),
    ('2026-01-01','2026-01-01',True,1),
    # Baseline borrows real February length before 360/30 conversion.
    ('2026-01-31','2026-02-28',True,28),
    ('invalid','2026-01-01',True,0),
])
def test_salary_original_calendar_formula(app,start,end,include,expected):
    assert app.program.call('_salary_duration_days',start,end,include)==expected

def test_salary_total_floor_rates_and_cap(app):
    ns=app.program.namespace
    career=pd.DataFrame([{'경력 종류':'회사','세부 근무처/직위':'테스트','시작일':'2022-03-01','종료일':'2023-02-28','종료일 산입':True,'환산율 (%)':40}])
    result=ns['_salary_calculate']('테스트',date(2026,10,14),'테스트학교','기간제','담당','교사',8,'정교사(2급)',0,'4년제',True,ns['_salary_default_degree_df'](),career)
    assert (result['total_y'],result['total_m'],result['total_d'],result['final_step'])==(0,4,24,9)
    assert ns['_salary_ymd_from_360'](731)==(2,0,11)
    assert '&lt;script&gt;' in ns['_salary_report_html']({**result,'name':'<script>'})

@pytest.mark.parametrize('klass,day,period,allowed',[('1-1','목',7,False),('2-8','목',7,False),('3-1','목',7,True),('1-1','수',7,True),('1-1','목',6,True)])
def test_grade_restriction(app,klass,day,period,allowed):
    assert app.program.call('slot_allowed_for_class',klass,day,period)==allowed

def test_neis_group_holiday_and_empty_slots(app):
    ns=app.program.namespace
    df=ns['_neis_schedule_rows_to_df']([{'AA_YMD':'20261012','EVENT_NM':'체육대회'},{'AA_YMD':'20261012','EVENT_NM':'재량휴업일'}])
    assert len(df)==2 and df['비수업일'].all()
    app.port.session_state['_neis_week_schedule']={'start_date':'2026-10-12','end_date':'2026-10-16','data':df}
    ns['get_effective_timetable_for_date'].clear()
    assert ns['get_effective_timetable_for_date']('2026-10-12').empty

def test_recommendation_rank_and_score(app):
    df=app.program.call('recommend_substitutes','월',1,'국어','1-1','테스트가','2026-10-12')
    assert df.iloc[0]['보강교사']=='테스트다'
    assert df.iloc[0]['추천점수']==106.0
    assert df.iloc[0]['누적보강']==0

def test_swap_same_class_candidate_and_conflict(app):
    ns=app.program.namespace
    df=ns['get_single_lesson_1to1_candidates']('테스트가','2026-10-12',1,'1-1','국어',7)
    assert not df.empty and set(df['상대학급'])=={'1-1'}
    a={'교사명':'테스트가','요일':'월','교시':1,'학급':'1-1','과목':'국어'}
    b={'교사명':'테스트나','요일':'화','교시':2,'학급':'1-1','과목':'수학'}
    assert ns['validate_swap'](a,b,'2026-10-12','2026-10-13')[0]
    app.port.session_state.duties=pd.DataFrame([{'교사명':'테스트가','일자':'2026-10-12','교시':0}])
    ns['_duty_slot_index'].clear()
    assert not ns['validate_swap'](a,b,'2026-10-12','2026-10-13')[0]

def test_availability_parse(app):
    assert app.program.call('_parse_teacher_availability_text','월 1,2 / 화 4~6')=={('월',1),('월',2),('화',4),('화',5),('화',6)}

def test_formula_injection_format(app):
    for text in ('=SUM(A1:A3)','+cmd','@a','-hello'):
        assert app.program.call('_safe_sheet_text',text)=="'"+text
    assert app.program.call('_safe_sheet_text','-2')=='-2'

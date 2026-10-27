import pytest
from backend.school_profile import school_name,neis_codes
from backend.services.application import Application

def test_default_and_custom_names_are_per_session():
    assert school_name({})=='학교'
    from streamlit.errors import StreamlitSecretNotFoundError
    class MissingSecrets:
        def get(self,*a):raise StreamlitSecretNotFoundError('synthetic missing secrets file')
    assert school_name(MissingSecrets())=='학교' and neis_codes(MissingSecrets())=={}
    a=Application(secrets={'school':{'name':'  예시중학교  '}})
    b=Application(secrets={'school':{'name':'가상고등학교'}})
    assert a.program.namespace['SCHOOL_NAME']=='예시중학교'
    assert b.program.namespace['SCHOOL_NAME']=='가상고등학교'
    assert Application().program.namespace['SCHOOL_NAME']=='학교'
    assert not a.program.namespace['NEIS_SCHOOL_CODE_FALLBACKS']

def test_name_only_search_ignores_old_manual_codes():
    app=Application(secrets={'school':{'name':'예시중학교','neis_school_code':'학교코드','neis_api_key':'synthetic-key'}})
    calls=[]
    def api(endpoint,params):
        calls.append(params)
        return {'schoolInfo':[{'head':[{'list_total_count':1}]},{'row':[{'SCHUL_NM':'예시중학교','ATPT_OFCDC_SC_CODE':'B10','SD_SCHUL_CODE':'0000001','ATPT_OFCDC_SC_NM':'예시교육청'}]}]}
    app.program.namespace['_neis_api_get']=api
    info=app.program.call('neis_find_school',app.program.call('_neis_secret_key'),'예시중학교')
    assert info['SD_SCHUL_CODE']=='0000001' and calls[0]['SCHUL_NM']=='예시중학교'
    assert 'ATPT_OFCDC_SC_CODE' not in calls[0] and not app.program.namespace['NEIS_SCHOOL_CODE_FALLBACKS']
    empty=Application();empty.program.namespace['_neis_api_get']=lambda *a,**k:pytest.fail('Unconfigured school must not search')
    assert empty.program.call('neis_find_school','synthetic-key','학교') is None

def test_profile_validation_and_legacy_alias():
    assert school_name({'SCHOOL_NAME':'예시학교'})=='예시학교'
    assert school_name({'school':{'name':''}})=='학교'
    with pytest.raises(ValueError):school_name({'school':{'name':'<script>'}})
    assert neis_codes({'school':{'neis_school_code':'123'}})=={}

def test_react_snapshot_and_exports_use_configured_school():
    import io
    from datetime import date
    from openpyxl import load_workbook
    from tests.fixtures import make_application,login
    app,_=make_application(school_name='배포예시중학교');login(app)
    assert app.snapshot()['school']=='배포예시중학교'
    html=app.program.call('build_report_html','2026-10-12')
    assert '배포예시중학교' in html
    raw=app.program.call('build_weekly_schedule_excel_bytes',date(2026,10,12))
    wb=load_workbook(io.BytesIO(raw))
    assert any(cell.value=='배포예시중학교' for sheet in wb for row in sheet for cell in row)

def test_new_semester_uses_school_display_name_not_term_name(tmp_path):
    from tests.operations.fixtures import integrated_app
    from backend.semester.install import get_service
    app,*_=integrated_app(tmp_path/'school.sqlite3')
    app.program.namespace['SCHOOL_NAME']='배포예시중학교'
    svc=get_service(app);tid=svc.create(2026,2,'2학기','2026-08-01','2026-12-31')
    assert svc.get(tid)['project']['school']['name']=='배포예시중학교'
    assert svc.get(tid)['project']['term']['name']=='2학기'

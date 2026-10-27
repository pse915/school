import pytest
from backend.school_profile import neis_api_key,find_neis_school
from backend.services.application import Application

@pytest.mark.parametrize('secrets',[
 {'NEIS_API_KEY':'secret-test'}, {'school':{'neis_api_key':'secret-test'}},
 {'school':{'NEIS_API_KEY':'secret-test'}}, {'neis':{'api_key':'secret-test'}},
 {'school_sheets':{'NEIS_API_KEY':'secret-test'}}, {'api_keys':{'NEIS_API_KEY':'secret-test'}}])
def test_existing_and_nested_key_placement(secrets):
    app=Application(secrets=secrets)
    assert app.program.call('_neis_secret_key')=='secret-test'
    assert app._redact('request secret-test failed')=='request [비공개] failed'

def test_duplicate_names_require_address_not_manual_code():
    rows=[{'SCHUL_NM':'예시중학교','ATPT_OFCDC_SC_CODE':'B10','SD_SCHUL_CODE':'1','ORG_RDNMA':'서울 예시로'},
          {'SCHUL_NM':'예시중학교','ATPT_OFCDC_SC_CODE':'C10','SD_SCHUL_CODE':'2','ORG_RDNMA':'부산 예시로'}]
    api=lambda *a:{'schoolInfo':[{'row':rows}]}
    with pytest.raises(ValueError,match='address'):find_neis_school(api,'endpoint','fake','예시중학교',{})
    assert find_neis_school(api,'endpoint','fake','예시중학교',{'school':{'address':'부산'}})['SD_SCHUL_CODE']=='2'

def test_no_match_and_failed_lookup_do_not_leak_key():
    assert find_neis_school(lambda *a:{'RESULT':{'CODE':'INFO-200'}},'endpoint','fake','예시중학교',{}) is None
    def no_school(*a):raise RuntimeError('NEIS API INFO-200: no results')
    assert find_neis_school(no_school,'endpoint','fake','예시중학교',{}) is None
    def api(*a):raise RuntimeError('URL contains PRIVATE-KEY')
    with pytest.raises(RuntimeError) as err:find_neis_school(api,'endpoint','PRIVATE-KEY','예시중학교',{})
    assert 'PRIVATE-KEY' not in str(err.value)

def test_school_code_is_discovered_for_schedule_api():
    app=Application(secrets={'school':{'name':'예시중학교','neis_api_key':'test-key'}})
    calls=[]
    def api(endpoint,params):
        calls.append((endpoint,params))
        if endpoint.endswith('schoolInfo'):return {'schoolInfo':[{'row':[{'SCHUL_NM':'예시중학교','ATPT_OFCDC_SC_CODE':'B10','SD_SCHUL_CODE':'123'}]}]}
        return {'SchoolSchedule':[{'row':[{'AA_YMD':'20261027','EVENT_NM':'학사행사','SBTR_DD_SC_NM':'공휴일','EVENT_CNTNT':'예시'}]}]}
    app.program.namespace['_neis_api_get']=api
    app.program.call('neis_fetch_schedule',app.program.call('_neis_secret_key'),'예시중학교','2026-10-26','2026-10-30')
    assert any(p.get('SD_SCHUL_CODE')=='123' and p.get('ATPT_OFCDC_SC_CODE')=='B10' for _,p in calls)


def test_unrelated_generic_api_credentials_are_not_sent_to_neis():
    assert neis_api_key({'api':{'api_key':'OTHER-SERVICE-KEY'},'api_keys':{'api_key':'OTHER-KEY'}})==''
    assert neis_api_key({'api':{'api_key':'OTHER-SERVICE-KEY'},'NEIS_API_KEY':'NEIS-ONLY'})=='NEIS-ONLY'

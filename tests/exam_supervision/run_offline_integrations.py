"""Execute fixture-backed app tests without installed Google client packages.

TEST-ONLY shims: gspread / Credentials are deliberately NOT used for production.
Real authentication, Streamlit startup and live Google Sheets writes are untested.
"""
import sys
import types


def add_shims():
    gp=types.ModuleType('gspread')
    exc=types.ModuleType('gspread.exceptions')
    exc.WorksheetNotFound=type('WorksheetNotFound',(Exception,),{})
    gp.exceptions=exc
    sys.modules['gspread']=gp
    sys.modules['gspread.exceptions']=exc
    google=types.ModuleType('google');google.__path__=[]
    oauth=types.ModuleType('google.oauth2');oauth.__path__=[]
    account=types.ModuleType('google.oauth2.service_account')
    account.Credentials=type('Credentials',(),{})
    google.oauth2=oauth;oauth.service_account=account
    for mod in (google,oauth,account):sys.modules[mod.__name__]=mod


if __name__=='__main__':
    add_shims()
    import pytest
    sys.exit(pytest.main(['-q','tests/exam_supervision','--disable-warnings','-k','not persistent_connection_configuration_roundtrip','--maxfail=1']))

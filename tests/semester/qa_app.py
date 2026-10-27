"""Synthetic actual Streamlit v2 target. All production adapters remain disabled."""
import sys,tempfile,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT))
import streamlit as st
from tests.operations.fixtures import integrated_app
from tests.semester.direct_fixture import Spreadsheet,Client
from unittest.mock import patch
from backend.credit.install import get_service as credit_service
from backend.operations.service import IntegratedOperations
st.set_page_config(page_title='Semester synthetic QA',layout='wide')
@st.cache_resource
def folder():return tempfile.mkdtemp(prefix='semester-e2e-')
@st.cache_resource
def direct_sheet(case):return Spreadsheet()
@st.cache_resource
def component():return st.components.v2.component('semester_qa',html='<div id="timetable-root"></div>',css=(ROOT/'frontend/dist/style.css').read_text(),js=(ROOT/'frontend/dist/timetable.js').read_text())
def receive():
    req=st.session_state.get('_semester_component',{}).get('request')
    if req:st.session_state['_semester_runtime'].dispatch(req)
if '_semester_runtime' not in st.session_state:
    case=hashlib.sha256(st.query_params.get('case','default').encode()).hexdigest()[:20]
    app,_,_,source,_=integrated_app(Path(folder())/(case+'.sqlite3'))
    app.port.secrets.pop('credit',None)
    app.port.secrets['school_sheets']={'School_id':'qa-school','Academic_year':2026,'Semester':1,'Semester_sheet':'direct-copy'}
    app._credit_service=None
    with patch.dict(app.program.namespace,{'get_gspread_client':lambda:Client(direct_sheet(case))}):credit=credit_service(app)
    app._operations_service=IntegratedOperations(app,credit.repo,source)
    app.port.session_state.logged_in=False;app._render();st.session_state['_semester_runtime']=app
component()(key='_semester_component',data=st.session_state['_semester_runtime'].snapshot(),default={'request':None},on_request_change=receive)

"""Actual Streamlit v2 E2E target. Synthetic data and local test-only SQL storage."""
import sys,tempfile,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT))
import streamlit as st
from tests.operations.fixtures import integrated_app,seed_credit_campaign
st.set_page_config(page_title='Phase 6 synthetic QA',layout='wide')
@st.cache_resource
def fixture_folder():return tempfile.mkdtemp(prefix='srb-phase2-e2e-')
@st.cache_resource
def component():
    return st.components.v2.component('operations_qa',html='<div id="timetable-root"></div>',css=(ROOT/'frontend/dist/style.css').read_text(),js=(ROOT/'frontend/dist/timetable.js').read_text())
def receive():
    req=st.session_state.get('_ops_component',{}).get('request')
    if req:st.session_state['_ops_runtime'].dispatch(req)
if '_ops_runtime' not in st.session_state:
    case=hashlib.sha256(st.query_params.get('case','default').encode()).hexdigest()[:20]
    app,svc,project,source,sheets=integrated_app(Path(fixture_folder())/(case+'.sqlite3'))
    seed_credit_campaign(app)
    app.port.session_state.logged_in=False
    app._render();st.session_state['_ops_runtime']=app
component()(key='_ops_component',data=st.session_state['_ops_runtime'].snapshot(),default={'request':None},on_request_change=receive)

"""Local E2E target. Synthetic fixtures, zero external API/Sheets calls."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import streamlit as st
from tests.fixtures import make_application

st.set_page_config(page_title='Timetable QA · 가상 테스트 자료',layout='wide')
ROOT=Path(__file__).resolve().parents[1]
@st.cache_resource
def component():
    return st.components.v2.component('timetable_qa',html='<div id="timetable-root"></div>',css=(ROOT/'frontend/dist/style.css').read_text(encoding='utf-8'),js=(ROOT/'frontend/dist/timetable.js').read_text(encoding='utf-8'))

def receive():
    request=st.session_state.get('_qa_component',{}).get('request')
    if request:
        st.session_state['_qa_runtime'].dispatch(request)

if '_qa_runtime' not in st.session_state:
    app,sheets=make_application()
    st.session_state['_qa_runtime']=app
    st.session_state['_qa_sheets']=sheets

component()(key='_qa_component',data=st.session_state['_qa_runtime'].snapshot(),default={'request':None},on_request_change=receive)

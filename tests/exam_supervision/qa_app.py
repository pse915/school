"""Opt-in exam browser target: synthetic in-memory Sheets, no external writes."""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT))
import streamlit as st
from tests.fixtures import make_application
from tests.exam_supervision.test_service import Book
from backend.exam_supervision.service import Service
st.set_page_config(page_title='시험감독 합성 QA',layout='wide')
@st.cache_resource
def component():
    return st.components.v2.component('exam_qa',html='<div id="timetable-root"></div>',css=(ROOT/'frontend/dist/style.css').read_text(),js=(ROOT/'frontend/dist/timetable.js').read_text())
def receive():
    request=st.session_state.get('_exam_qa_component',{}).get('request')
    if request:st.session_state['_exam_qa_runtime'].dispatch(request)
if '_exam_qa_runtime' not in st.session_state:st.session_state['_exam_qa_runtime']=make_application()[0]
a=st.session_state['_exam_qa_runtime']
if a.port.session_state.get('logged_in') and a._exam_service is None:
    s=Service(a);s.repo.book=Book();s.repo.configuration=dict(teacherView=True,teacherAll=False);s.repo.reload();a._exam_service=s
component()(key='_exam_qa_component',data=a.snapshot(),default={'request':None},on_request_change=receive)

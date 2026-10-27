"""Streamlit entrypoint; the application uses one React v2 component."""
from pathlib import Path
import logging
import streamlit as st

st.set_page_config(page_title='시간표 · 학교 업무',page_icon='📘',layout='wide',initial_sidebar_state='collapsed')
ROOT=Path(__file__).resolve().parent
DIST=ROOT/'frontend/dist'
LOGGER=logging.getLogger(__name__)

def startup_error(exc):
    LOGGER.exception('Timetable startup failed')
    st.error('시간표 화면을 시작하지 못했습니다. 배포 파일과 실행 환경을 확인하세요.')
    if type(exc).__name__=='StartupAssetsError':
        st.warning(str(exc))
    elif isinstance(exc,ModuleNotFoundError):
        st.warning('필수 모듈을 찾을 수 없습니다. backend·legacy·frontend 폴더 전체와 requirements.txt가 같은 프로젝트에 있어야 합니다.')
        st.code('누락 모듈: '+str(exc.name))
    else:
        st.caption('오류 유형: '+type(exc).__name__+'. Streamlit의 Manage app → Logs에서 초기 실행 오류를 확인하세요. Secrets 값은 공유하지 마세요.')
    st.caption('진입점: timetable_app2.py · 권장 검증 환경: Python 3.12 · Streamlit 1.56.0')
    st.stop()

@st.cache_resource
def component(css,js):
    # Assets are cache inputs, so a deployed build cannot reuse a stale renderer.
    return st.components.v2.component('timetable_react',html='<div id="timetable-root"><p role="status">시간표 화면을 준비하고 있습니다…</p></div>',css=css,js=js,isolate_styles=True)

def receive():
    request=st.session_state.get('_timetable_component',{}).get('request')
    if request:
        runtime=st.session_state['_timetable_runtime']
        try:
            runtime.dispatch(request)
        except Exception as exc:
            LOGGER.exception('Timetable request failed')
            runtime.response={'requestId':request.get('requestId'),'success':False,'error':{'code':type(exc).__name__,'message':runtime._redact(str(exc))}}

def ready():
    pass

try:
    from backend.bridge.startup import load_frontend,create_runtime
    if not hasattr(st.components,'v2'):
        raise RuntimeError('Streamlit components v2 is unavailable')
    css,js,release=load_frontend(DIST)
    if '_timetable_runtime' not in st.session_state:
        try:settings=dict(st.secrets.get('migration',{}))
        except Exception:settings={}
        runtime=create_runtime(st.secrets,st.context,settings)
        st.session_state['_timetable_runtime']=runtime
    loading=st.empty()
    bridge_state=st.session_state.get('_timetable_component',{})
    if bridge_state.get('ready')!=release:
        loading.info('React 화면을 불러오는 중입니다. 이 안내가 계속 보이면 화면 파일 또는 브라우저 실행 오류를 확인하세요.')
    snapshot={**st.session_state['_timetable_runtime'].snapshot(),'frontendRelease':release}
    component(css,js)(key='_timetable_component',data=snapshot,on_request_change=receive,on_ready_change=ready,default={'request':None,'ready':None},width='stretch')
except Exception as exc:
    startup_error(exc)

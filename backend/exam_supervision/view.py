"""Exam pages rendered with the existing ReactPort/NodeRenderer/DataGrid.

No HTML app embedding and no second Streamlit component. All field/control
validation and callbacks stay in the existing server-driven React bridge.
"""
import csv
import io
import json
import html
import pandas as pd
from . import engine as E
from .models import model,SH,HEADERS,cell
PAGES=['시험감독 준비 현황','교사별 감독 조회','전체 감독 시간표','시험일정 설정',
       '교사 명단','감독 역할·강사 제외','배정불가 시간','수업시간표','겸임교사 일정',
       '교사감독규칙','최적화 설정','자동 배정·직접 수정','공정성 분석','배정 기록·인쇄',
       '연결·조회 권한','저장 주체·연결 진단']
# Old session tabs are deliberately retained as aliases; no stored sheet schemas change.
LEGACY_PAGES={'교사 명단·감독 조건':'교사 명단','수업·겸임교사 일정':'수업시간표','연결·권한 설정':'연결·조회 권한'}

LABELS={'id':'교사ID','originalId':'기존ID','name':'교사명','subjectsText':'담당교과','crossSubjectsText':'상치교과','homeroom':'담임학급','MAIN':'정감독','ASSIST':'부감독','STUDY':'자습감독','day':'일차','date':'날짜','period':'교시','classId':'학급','type':'구분','subject':'과목','start':'시작시각','end':'종료시각','teacherId':'교사ID','teacherName':'교사명','weekday':'요일','location':'근무장소','note':'비고','mode':'규칙','startDate':'시작일','endDate':'종료일','reason':'사유','subjectGroup':'과목군','grade':'학년','classNo':'반','key':'감독 자리','role':'역할','fixed':'고정','main':'정감독','assist':'부감독','study':'자습감독','total':'전체감독','delta':'평균대비'}
def display(p,rows,columns=None,key=None):
    df=pd.DataFrame(rows,columns=columns)
    if not len(df):p.info('표시할 자료가 없습니다.');return
    p.dataframe(df.rename(columns=LABELS),key=key,use_container_width=True,hide_index=True)
def printable(rows,title):
    df=pd.DataFrame(rows).rename(columns=LABELS)
    return '<!doctype html><html lang="ko"><meta charset="utf-8"><title>'+html.escape(title)+'</title><style>body{font-family:system-ui,sans-serif;padding:20px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #bbb;padding:6px;text-align:left}th{background:#eef2ed}tr{break-inside:avoid}thead{display:table-header-group}@page{size:A4 landscape;margin:10mm}@media print{button{display:none}}</style><h1>'+html.escape(title)+'</h1><button onclick="window.print()">인쇄 / PDF 저장</button>'+df.to_html(index=False,escape=True)+'</html>'
def export(p,rows,title,columns=None):
    if not rows:return
    df=pd.DataFrame(rows,columns=columns);safe=df.map(lambda v:"'"+v if isinstance(v,str) and v.startswith(('=','+','-','@','\t','\r')) else v)
    p.download_button('CSV 내려받기',safe.to_csv(index=False).encode('utf-8-sig'),file_name=title+'.csv',mime='text/csv',key='exam_csv_'+title)
    p.download_button('인쇄·PDF용 문서 내려받기',printable(rows,title),file_name=title+'.html',mime='text/html',key='exam_print_'+title)
    p.caption('인쇄용 문서를 열어 인쇄 버튼 또는 Ctrl+P를 누르면 개별·전체 인쇄와 PDF 저장이 가능합니다.')
def grid(p,key,rows,columns,config=None,disabled=None):
    p.caption('표에서 수정·행 추가·행 삭제 후 저장하세요. 저장이 실패하면 입력값이 유지됩니다.')
    with p.expander('고급 도구 · 엑셀/TSV/CSV 붙여넣기'):
        pasted=p.text_area('여러 행 붙여넣기 (탭 또는 CSV, 첫 행은 필드명)',key='exam_paste_'+key)
        p.caption('원본 필드명: '+', '.join(columns))
        if p.button('붙여넣기 적용',key='exam_paste_apply_'+key):
            try:
                reader=csv.DictReader(io.StringIO(pasted),delimiter='\t' if '\t' in pasted.split('\n')[0] else ',')
                E.require(reader.fieldnames and set(reader.fieldnames)==set(columns),'필드명이 일치하지 않습니다.')
                items=list(reader);E.require(len(items)<=10000,'최대 10,000행입니다.')
                p.session_state['_editor_exam_grid_'+key]=pd.DataFrame(items,columns=columns)
            except (ValueError,csv.Error) as exc:p.error(str(exc))
    base={c:p.column_config.TextColumn(LABELS.get(c,c)) for c in columns};base.update(config or {})
    edited=p.data_editor(pd.DataFrame(rows,columns=columns),key='exam_grid_'+key,num_rows='dynamic',hide_index=True,use_container_width=True,column_config=base,disabled=disabled or []).fillna('').to_dict('records')
    canonical=lambda values:[[str(r.get(c,'')) for c in columns] for r in values]
    if canonical(edited)!=canonical(pd.DataFrame(rows,columns=columns).fillna('').to_dict('records')):p.warning('저장하지 않은 변경사항이 있습니다.')
    return edited
def run(p,s,action,payload=None):
    try:
        result=s.handle(action,{**s.token_payload(),**(payload or {})})
        if isinstance(result,dict) and result.get('ok') is False:p.error(json.dumps(result,ensure_ascii=False));return result
        s.notice='저장했습니다. 최신 시트 자료로 화면을 갱신했습니다.';p.rerun()
    except (ValueError,PermissionError,RuntimeError) as exc:p.error(str(exc))
def render_connection(p,s):
    p.subheader('시험감독 시트 연결·조회 권한');p.caption('기존 시간표·업무 시트와 별도의 시험감독 스프레드시트를 사용합니다. 기존 서비스 계정에 공유한 주소를 입력하세요.')
    if not s.app.repo.writable:
        p.error('앱 저장이 비활성화되어 있습니다. Streamlit 앱 설정 → Secrets의 [migration] 항목에 allow_writes = true를 설정하고 앱을 재부팅하세요. 기존 Secrets는 유지하세요.')
    if s.repo.configuration is None:
        try:s.repo.load_config()
        except Exception as exc:p.error('연결 설정을 불러오지 못했습니다: '+str(exc));return
    cfg=s.repo.configuration or {};url=p.text_input('시험감독 Google Sheets 주소',value=cfg.get('spreadsheetId',''),key='exam_connection_url')
    own=p.checkbox('메뉴 권한을 받은 일반교사의 본인 감독 조회 허용',value=cfg.get('teacherView',False),key='exam_teacher_view');all_view=p.checkbox('허용된 일반교사의 전체 감독 시간표 조회 허용',value=cfg.get('teacherAll',False),key='exam_teacher_all')
    p.caption('일반교사는 기존 아이디·권한 관리에서 시험감독 관리 탭을 허용해야 합니다. 본인 조회는 로그인 이름을 명단에 유일하게 대응시킵니다.')
    for label,persist in [('연결 검사',False),('연결·조회 권한 저장',True)]:
        if p.button(label,key='exam_connect_'+str(persist),disabled=persist and not s.app.repo.writable):
            try:s.connect(url,persist,own,all_view);s.notice='연결 정보를 확인했습니다.';p.rerun()
            except Exception as exc:p.error(str(exc))
    if s.repo.book is None:return
    status=s.repo.status();p.info(f"연결: {status['name']} / 저장 주체: {status['writer']}");p.caption(status['url'])
    if status['writer']=='PAUSED':p.warning('Apps Script 쓰기를 중지했습니다. 전환 시작 후 6분 30초가 지나면 저장 주체 전환 적용을 다시 누르세요.')
    if status['missing']:p.warning('준비가 필요한 시트: '+', '.join(status['missing']))
    if status['errors']:p.error('; '.join(status['errors']))
    if p.button('누락 시트·필수 열 준비 및 이전 기록 확인',key='exam_prepare',disabled=not s.app.repo.writable):
        try:s.initialize();s.notice='필수 시트를 확인하고 기존 자료를 보존했습니다.';p.rerun()
        except Exception as exc:p.error(str(exc))
    p.subheader('저장 주체 전환');p.caption('같은 시트에는 한 앱만 저장합니다. 제공한 Code.gs를 적용하고 installIntegrationProtocol을 실행한 뒤 전환하세요. 수동 시트 편집도 저장 도중에는 멈추세요.')
    exclusive=p.checkbox('이 시트를 Apps Script에서 편집하지 않고 통합본에서만 사용합니다',key='exam_exclusive');writer=p.selectbox('저장을 담당할 앱',['STREAMLIT','GAS'],format_func=lambda x:'기존 Apps Script' if x=='GAS' else '현재 Streamlit 통합본',key='exam_writer')
    if p.button('저장 주체 전환 적용',key='exam_handoff',disabled=not s.app.repo.writable):
        try:s.handoff(writer,exclusive);s.notice='저장 주체 전환 상태를 갱신했습니다.';p.rerun()
        except Exception as exc:p.error(str(exc))

def render(p,s):
    """Actual implementation moved to the UI-only presenter, preserving stable imports."""
    from .view_improved import render as improved
    return improved(p,s)

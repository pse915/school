"""Exam UX contracts with synthetic worksheets, no network or production writes."""
from backend.exam_supervision.view import PAGES,LEGACY_PAGES
from backend.exam_supervision.service import TAB
from tests.exam_supervision.test_service import setup


def _nodes(app):
    return {node['id']:node for node in app.port.nodes}


def test_admin_menu_options_and_summary_are_grounded():
    app,s,b=setup()
    app.port.session_state.update(active_tab=TAB,exam_page='시험감독 준비 현황')
    app._render()
    nodes=_nodes(app)
    assert [v['label'] for v in nodes['exam_page']['options']]==PAGES
    d=nodes[next(k for k in nodes if nodes[k]['kind']=='exam_meta')]['overview']
    assert d['sheet']==b.title
    assert (d['teachers'],d['classes'],d['dates'])==(8,2,1)
    assert d['required']==6 and d['assigned']==0 and d['errors']==6
    assert d['verified'] is False and not b.batches


def test_non_admin_scoped_pages_are_only_read_only():
    app,s,b=setup(role='일반교사',all_view=False)
    app.port.session_state.update(active_tab=TAB,exam_page='교사별 감독 조회')
    app._render()
    pages=[v['label'] for v in _nodes(app)['exam_page']['options']]
    assert pages==['교사별 감독 조회']
    assert not b.batches


def test_readonly_reason_and_disabled_save():
    app,s,b=setup(readonly=True)
    app.port.session_state.update(active_tab=TAB,exam_page='교사 명단')
    app._render()
    nodes=_nodes(app)
    d=next(v['overview'] for v in nodes.values() if v['kind']=='exam_meta')
    assert not d['writable']
    assert '쓰기 설정' in d['readOnlyReason']
    assert nodes['exam_save_roster']['disabled'] is True
    assert not b.batches


def test_old_page_alias_and_source_save_ids_remain_recognized():
    assert LEGACY_PAGES['수업·겸임교사 일정']=='수업시간표'
    app,s,b=setup()
    app.port.session_state.update(active_tab=TAB,exam_page='수업·겸임교사 일정')
    app._render()
    assert app.port.session_state['exam_page']=='수업시간표'
    assert _nodes(app)['exam_page']['options'][7]['label']=='수업시간표'


def test_exam_navigation_warns_about_staged_unsaved_form_rows():
    """React meta marks staged server-side form rows as unsaved before navigation."""
    app,s,b=setup()
    app.port.session_state.update(active_tab=TAB,exam_page='배정불가 시간')
    app._render()
    app.port.session_state['_exam_original_dirty_unavailable']=True
    app._render()
    meta=next(v for v in app.port.nodes if v['kind']=='exam_meta')
    assert meta['unsavedForm'] is True

"""Isolated regression checks for Streamlit modal state without touching Sheets."""
import ast
from pathlib import Path
from types import SimpleNamespace

import pytest

SOURCE=Path(__file__).resolve().parents[2]/'native-optimization/timetable_app2.py'
TREE=ast.parse(SOURCE.read_text(encoding='utf-8'))


def function(name):
    node=next(n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name==name)
    return ast.FunctionDef(name=node.name,args=node.args,body=node.body,decorator_list=[],returns=node.returns,type_comment=node.type_comment)


def extracted(*names, **bindings):
    module=ast.fix_missing_locations(ast.Module(body=[function(name) for name in names],type_ignores=[]))
    namespace=dict(bindings)
    exec(compile(module,str(SOURCE),'exec'),namespace)
    return namespace


class Session(dict):
    def __getattr__(self,key):return self[key]
    def __setattr__(self,key,value):self[key]=value


class RerunTriggered(Exception):pass


def fake_streamlit(state):
    def rerun(*args,**kwargs):
        assert not args and not kwargs, 'close should trigger a full rerun'
        raise RerunTriggered
    return SimpleNamespace(session_state=state,rerun=rerun)


@pytest.mark.parametrize('has_result',[True,False])
def test_outside_or_escape_clears_transient_dialog_state_without_touching_login(has_result):
    state=Session(logged_in=True,user_id='tester',weekly_matrix_epoch=2,weekly_selected_lesson={'교시':1},weekly_dialog_open=True,
                  weekly_swap_source={'teacher':'A'},weekly_dialog_action_mode='swap')
    if has_result:state.weekly_dialog_result='맞교환을 저장했습니다.'
    st=fake_streamlit(state)
    ns=extracted('_clear_weekly_selection','_dismiss_weekly_action_dialog',st=st)
    ns['_dismiss_weekly_action_dialog']()
    assert 'weekly_selected_lesson' not in state
    assert 'weekly_dialog_open' not in state
    assert 'weekly_dialog_result' not in state
    assert 'weekly_swap_source' not in state
    assert state['weekly_matrix_epoch']==3
    assert state['logged_in'] and state['user_id']=='tester'
    # Callback can be invoked more than once without an exception.
    ns['_dismiss_weekly_action_dialog']()


def test_button_close_and_outside_use_same_cleanup_with_full_rerun():
    state=Session(weekly_matrix_epoch=0,weekly_selected_lesson={'교시':2},weekly_dialog_open=True,weekly_dialog_result='저장 완료')
    st=fake_streamlit(state)
    ns=extracted('_clear_weekly_selection','_dismiss_weekly_action_dialog','_close_weekly_action_dialog',st=st)
    with pytest.raises(RerunTriggered):ns['_close_weekly_action_dialog']()
    assert state['weekly_matrix_epoch']==1
    assert 'weekly_dialog_result' not in state
    assert 'weekly_selected_lesson' not in state


def test_dialog_uses_callback_and_shows_success_before_invalid_source_check():
    dialog=next(n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name=='_weekly_action_dialog')
    decorator=dialog.decorator_list[0]
    assert any(k.arg=='on_dismiss' and isinstance(k.value,ast.Name) and k.value.id=='_dismiss_weekly_action_dialog' for k in decorator.keywords)
    # Once a swap is saved, the old source lesson is no longer valid. A success
    # message must remain available until dismissed instead of rerun-looping.
    state=Session(weekly_selected_lesson={'일자':'2026-10-14','요일':'수','교사명':'A','교시':1,'학급':'1-1','과목':'국어'},weekly_dialog_result='맞교환 성공')
    calls=[]
    def called(name):return lambda *args,**kwargs:calls.append(name)
    st=SimpleNamespace(session_state=state,markdown=called('markdown'),info=called('info'),success=called('success'),caption=called('caption'),button=lambda *args,**kwargs:False)
    ns=extracted('_weekly_action_dialog',st=st,_validate_current_weekly_selection=lambda *a,**kw:pytest.fail('must skip validation after successful save'))
    ns['_weekly_action_dialog']()
    assert 'success' in calls
    assert state.weekly_dialog_result=='맞교환 성공'


def test_react_backend_close_clears_previous_completion():
    source=(SOURCE.parents[1]/'backend/services/application.py').read_text(encoding='utf-8')
    tree=ast.parse(source)
    dispatch=next(node for cls in tree.body if isinstance(cls,ast.ClassDef) and cls.name=='Application'
                  for node in cls.body if isinstance(node,ast.FunctionDef) and node.name=='dispatch')
    branch=next(node for node in ast.walk(dispatch) if isinstance(node,ast.Compare)
                and isinstance(node.left,ast.Name) and node.left.id=='operation'
                and any(isinstance(v,ast.Constant) and v.value=='close_dialog' for v in node.comparators))
    assert branch is not None
    # A static source check is sufficient here; backend integration tests also
    # run in CI with gspread/Streamlit installed.
    start=source.index("elif operation=='close_dialog':")
    end=source.index("elif operation=='control':",start)
    assert "self.port.session_state.pop('weekly_dialog_result',None)" in source[start:end]
    assert "self.program.call('_clear_weekly_selection')" in source[start:end]

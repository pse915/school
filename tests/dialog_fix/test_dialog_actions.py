"""Offline tests of every source dialog mutation path. Never accesses Sheets."""
import ast
from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace
import pandas as pd
import pytest

SRC=Path(__file__).resolve().parents[2]/'native-optimization/timetable_app2.py'
TREE=ast.parse(SRC.read_text(encoding='utf-8'))

class Session(dict):
    __getattr__=dict.__getitem__
    __setattr__=dict.__setitem__


def extracted(*names, **bindings):
    nodes=[]
    for name in names:
        f=next(f for f in TREE.body if isinstance(f,ast.FunctionDef) and f.name==name)
        # Remove the dialog decorator so it is testable without a Streamlit server.
        f=ast.FunctionDef(name=f.name,args=f.args,body=f.body,decorator_list=[],returns=f.returns,type_comment=f.type_comment)
        nodes.append(f)
    ns=dict(bindings)
    exec(compile(ast.fix_missing_locations(ast.Module(body=nodes,type_ignores=[])),str(SRC),'exec'),ns)
    return ns


class FakeSt:
    def __init__(self, use_test):
        self.reruns=0
        self.writes=[]
        self.buttons=[]
        self.state=Session(
            weekly_selected_lesson={'교사명':'A','일자':'2026-10-14','요일':'수','교시':2,'학급':'1-1','과목':'국어'},
            weekly_dialog_use_test=use_test,weekly_dialog_title='주간표 작업',
            weekly_dialog_action_mode='swap',weekly_matrix_epoch=0,_data_version=1,
            weekly_dialog_instance=1,weekly_dialog_extra_days=7
        )
        self.session_state=self.state
        self.column_config=SimpleNamespace(TextColumn=lambda *args,**kwargs:None)
    def columns(self, spec):return [self for _ in range(spec if isinstance(spec,int) else len(spec))]
    def __enter__(self):return self
    def __exit__(self,*args):return None
    def markdown(self,*args,**kwargs):pass
    def info(self,*args,**kwargs):pass
    def success(self,*args,**kwargs):self.writes.append(('success',args[0]))
    def warning(self,*args,**kwargs):self.writes.append(('warning',args[0]))
    def error(self,*args,**kwargs):self.writes.append(('error',args[0]))
    def caption(self,*args,**kwargs):pass
    def button(self,*args,**kwargs):
        key=kwargs.get('key')
        self.buttons.append(key)
        return key=='dlg_direct_swap'
    def slider(self,_,min_value,max_value,value,**kwargs):return value
    def dataframe(self,*args,**kwargs):
        return SimpleNamespace(selection=SimpleNamespace(rows=[0]))
    def rerun(self,*args,**kwargs):
        self.reruns+=1
        raise AssertionError('Must not rerun inside a successful swap dialog')


@pytest.mark.parametrize('use_test',[True,False])
def test_swap_button_success_renders_without_manual_rerun(use_test):
    st=FakeSt(use_test)
    lesson=st.session_state.weekly_selected_lesson
    candidates=pd.DataFrame([{
        '이동희망일':'2026-10-15','이동요일':'목','이동희망교시':1,'원본교시':1,
        '상대교사':'B','상대학급':'1-1','상대과목':'수학','동일학급':'🏆',
        '교환가능사유':'검증 통과'}])
    calls=[]
    @contextmanager
    def loading(_):yield
    def swap(a,b,da,db,is_test=False):
        calls.append((a.copy(),b.copy(),da,db,is_test))
        return True
    ns=extracted('_weekly_action_dialog','_weekly_dialog_finish',
        st=st, pd=pd, safe_int=int, _weekly_dialog_loading=loading,
        _validate_current_weekly_selection=lambda *a,**kw:True,
        get_single_lesson_1to1_candidates=lambda *args,**kw:candidates,
        _filter_current_swap_candidates=lambda frame,*a,**kw:frame,
        do_swap=swap, _close_weekly_action_dialog=lambda:None,
        _weekly_set_action_mode=lambda *a:None,
        _weekly_extra_days_changed=lambda:None
    )
    ns['_weekly_action_dialog']()
    assert len(calls)==1
    assert calls[0][-1] is use_test
    assert st.reruns==0
    assert st.session_state.weekly_dialog_result
    assert 'dlg_result_close' in st.buttons
    assert any(kind=='success' for kind,_ in st.writes)
    assert not any(kind=='error' for kind,_ in st.writes)
    # A later fragment rerun shows the result rather than re-running the swap.
    st.buttons.clear()
    ns['_weekly_action_dialog']()
    assert len(calls)==1
    assert st.reruns==0
    assert st.buttons==['dlg_result_close']


def test_change_action_mode_and_slider_are_callback_only():
    st=FakeSt(False)
    ns=extracted('_weekly_set_action_mode','_weekly_extra_days_changed',st=st)
    ns['_weekly_set_action_mode']('substitute')
    assert st.session_state.weekly_dialog_action_mode=='substitute'
    ns['_weekly_set_action_mode']('unexpected')
    assert st.session_state.weekly_dialog_action_mode=='substitute'
    st.session_state.weekly_dialog_extra_days_input=15
    st.session_state.weekly_swap_candidates_key=('old',)
    st.session_state.weekly_cycle_candidates_key=('old',)
    ns['_weekly_extra_days_changed']()
    assert st.session_state.weekly_dialog_extra_days==15
    assert 'weekly_swap_candidates_key' not in st.session_state
    assert 'weekly_cycle_candidates_key' not in st.session_state
    assert st.reruns==0


def test_all_weekly_success_paths_use_shared_helper_not_fragment_rerun():
    f=next(n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name=='_weekly_action_dialog')
    names=[n.id for n in ast.walk(f) if isinstance(n,ast.Name)]
    assert names.count('_weekly_dialog_finish')==5
    assert '_weekly_fragment_rerun' not in names
    assert not any(isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute)
        and isinstance(n.func.value,ast.Name) and n.func.value.id=='st' and n.func.attr=='rerun'
        for n in ast.walk(f))


def test_dialog_inventory_and_no_unexpected_explicit_fragment_reruns():
    dialogs=[]
    for f in TREE.body:
        if isinstance(f,ast.FunctionDef) and any(
                isinstance(d,ast.Call) and isinstance(d.func,ast.Attribute)
                and isinstance(d.func.value,ast.Name) and d.func.value.id=='st'
                and d.func.attr=='dialog' for d in f.decorator_list):
            dialogs.append(f.name)
    assert set(dialogs)=={'_weekly_action_dialog','render_tools_dialog'}
    assert 'st.rerun(scope="fragment")' not in SRC.read_text(encoding='utf-8')


def test_clear_weekly_state_resets_candidates_without_touching_auth():
    state=Session(logged_in=True,user_id='teacher',weekly_matrix_epoch=1,
        weekly_target_candidates_key=('old',),weekly_dialog_result='success',
        weekly_target_search_requested=True,weekly_selected_lesson={'교사명':'A'})
    ns=extracted('_clear_weekly_selection',st=SimpleNamespace(session_state=state))
    ns['_clear_weekly_selection']()
    assert state.weekly_matrix_epoch==2
    assert state.logged_in and state.user_id=='teacher'
    assert 'weekly_dialog_result' not in state
    assert 'weekly_selected_lesson' not in state
    assert 'weekly_target_candidates_key' not in state
    assert 'weekly_target_search_requested' not in state


def test_tools_dialog_outside_dismiss_preserves_preferences():
    state=Session(logged_in=True,ui_font='학교안심',ui_theme='black',top_output_mode='personal_plan')
    ns=extracted('_dismiss_tools_dialog',st=SimpleNamespace(session_state=state))
    ns['_dismiss_tools_dialog']()
    assert 'top_output_mode' not in state
    assert state.ui_font=='학교안심' and state.ui_theme=='black' and state.logged_in
    tools=next(n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name=='render_tools_dialog')
    assert any(isinstance(k,ast.keyword) and k.arg=='on_dismiss'
        and isinstance(k.value,ast.Name) and k.value.id=='_dismiss_tools_dialog'
        for d in tools.decorator_list if isinstance(d,ast.Call) for k in d.keywords)


@pytest.mark.parametrize('use_test,save_success,expected_result',[
    (True,True,True),(False,True,True),(False,False,False),
])
def test_swap_write_is_test_only_or_single_live_write_with_rollback(use_test,save_success,expected_result):
    """Swap engine exercised with in-memory frames; no network or credentials."""
    from datetime import datetime
    s=Session(swaps=pd.DataFrame(),test_swaps=pd.DataFrame(),_data_version=1)
    st=SimpleNamespace(session_state=s, warning=lambda *a,**k:None,error=lambda *a,**k:None)
    ea=pd.DataFrame([{'교사명':'A','교시':1,'학급':'1-1','과목':'국어'}])
    eb=pd.DataFrame([{'교사명':'B','교시':2,'학급':'1-1','과목':'수학'}])
    a={'교사명':'A','일자':'2026-10-14','요일':'수','교시':1,'학급':'1-1','과목':'국어'}
    b={'교사명':'B','일자':'2026-10-15','요일':'목','교시':2,'학급':'1-1','과목':'수학'}
    saves=[];hist=[]
    def cache_get(d,*args,**kw):return ea if d==a['일자'] else eb
    cache_get.clear=lambda:None
    def make_cache():
        f=lambda *args,**kwargs:None
        f.clear=lambda:None
        return f
    def save(*args):saves.append(args);return save_success
    funcs=['get_single_lesson_1to1_candidates','get_single_lesson_linked_cycles',
        'get_test_affected_slots','find_cycle_linked_swaps','get_target_time_recommendations']
    ns=extracted('do_swap',st=st,pd=pd,safe_int=int,validate_swap=lambda *a,**kw:(True,'OK'),
        get_effective_timetable_for_date=cache_get,
        normalize_date_str=lambda x:x,
        _new_change_id=lambda kind:'unit-test-'+kind,
        _now_text=lambda fmt:'2026-10-14 11:00',current_user=lambda:'tester',
        save_work_data_to_gsheet=save,
        push_history=lambda text:hist.append(text),
        _invalidate_all_caches=lambda:None,
        **{name:make_cache() for name in funcs})
    assert ns['do_swap'](a,b,a['일자'],b['일자'],is_test=use_test) is expected_result
    if use_test:
        assert len(s.test_swaps)==1 and len(s.swaps)==0
        assert saves==[] and hist==[]
    elif save_success:
        assert len(s.swaps)==1 and saves==[(['맞교환'],)]
        assert len(hist)==1
    else:
        assert len(s.swaps)==0 and saves==[(['맞교환'],)]
        assert hist==[]

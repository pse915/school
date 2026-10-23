"""Runs without live school data, Streamlit or gspread. New planner isolation checks."""
import copy
from types import SimpleNamespace
import pytest
from backend.planning.service import PlanningService
from backend.planning.repository import key_for


class StubApp:
    def __init__(self, logged=True, role='마스터', writable=False):
        self.port=SimpleNamespace(session_state={'logged_in':logged,'_auth_stale':False})
        self.repo=SimpleNamespace(writable=writable,settings={})
        self._role=role
        self.program=SimpleNamespace(call=self.call)
    def call(self, name):
        if name=='current_role':return self._role
        if name=='can_manage_ids':return self._role=='마스터'
        raise AssertionError('Unexpected legacy call: '+name)


def test_guest_cannot_open_planning_even_if_operation_is_forged():
    for app in [StubApp(logged=False),StubApp(role='일반교사')]:
        planning=PlanningService(app)
        assert not planning.snapshot()['available']
        with pytest.raises(PermissionError):planning.handle('navigate',{})
        with pytest.raises(PermissionError):planning.handle('sample',{'sample':'middle'})


def test_phase7_sample_validate_solve_publish_preserves_operating_data():
    app=StubApp()
    planning=PlanningService(app)
    assert planning.handle('navigate',{})
    assert planning.snapshot()['active']
    planning.handle('sample',{'sample':'middle'})
    assert not planning.handle('validate',{})['errors']
    result=planning.handle('solve',{'seconds':3})
    assert result['status']=='FEASIBLE'
    assert result['count']==9
    before=copy.deepcopy(planning.project)
    save=planning.handle('candidate',{'label':'기본 후보'})
    assert save['candidateId']=='v1'
    assert before['lessons']==planning.project['lessons']
    publication=planning.handle('publish',{'candidate_id':'v1'})
    assert publication['published']=='v1'
    assert planning.project['published']['placements']
    # Explicit operating deployment is intentionally not exposed.
    with pytest.raises(ValueError):planning.handle('activate_in_legacy',{})
    with pytest.raises(PermissionError):planning.handle('save_sheet',{'confirm':True})
    assert planning.handle('close',{})
    assert not planning.snapshot()['active']


def test_bad_project_does_not_replace_existing_draft():
    planning=PlanningService(StubApp())
    planning.handle('sample',{'sample':'high'})
    original=copy.deepcopy(planning.project)
    with pytest.raises(ValueError):planning.handle('update',{'project':{'school':{'id':'','academic_year':2026,'semester':1}}})
    assert planning.project==original
    error=planning.handle('validate',{})
    assert error['valid']
    result=planning.handle('solve',{'seconds':3})
    assert result['status']=='FEASIBLE'
    # a collision-producing move cannot mutate previous placements
    old=copy.deepcopy(planning.result['placements'])
    wrong=planning.handle
    with pytest.raises(ValueError):wrong('move',{'session_id':'absent','start':'월1'})
    assert old==planning.result['placements']


def test_phase7_storage_key_scope():
    from diple.samples import middle_school
    demo=middle_school()
    assert key_for(demo)=='demo-middle:2026:1'
    demo['school']['semester']=5
    with pytest.raises(ValueError):key_for(demo)

class WorksheetNotFound(Exception):pass
class FakeWorksheet:
    def __init__(self):self.values=[]
    def get_all_values(self):return copy.deepcopy(self.values)
    def update(self,range_name,values):
        assert range_name=='A1:E1';self.values=copy.deepcopy(values)
    def append_row(self,values,value_input_option):
        assert value_input_option=='RAW';self.values.append(copy.deepcopy(values))
class FakeSpreadsheet:
    def __init__(self):self.ws=None
    def worksheet(self,name):
        assert name=='Diple_Planning'
        if self.ws is None:raise WorksheetNotFound()
        return self.ws
    def add_worksheet(self,title,rows,cols):
        assert title=='Diple_Planning';self.ws=FakeWorksheet();return self.ws


def test_separate_sheet_append_revision_and_conflict():
    from backend.planning.repository import PlanningSheetRepository
    app=StubApp(writable=True)
    sheet=FakeSpreadsheet()
    app.repo.settings['planning_sheet_id']='test-sheet-only'
    app.program.namespace={'get_gspread_client':lambda:SimpleNamespace(open_by_key=lambda key:sheet),'WORK_SHEET_ID':'operating'}
    p=PlanningService(app)
    p.handle('sample',{'sample':'middle'})
    store=PlanningSheetRepository(app)
    assert store.save(p.project,0)==1
    recovered,revision=store.read(key_for(p.project))
    assert revision==1 and recovered==p.project
    with pytest.raises(ValueError):store.save(p.project,0)
    assert store.save(p.project,1)==2
    assert len(sheet.ws.values)==3

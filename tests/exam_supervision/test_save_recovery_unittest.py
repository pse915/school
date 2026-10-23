"""Offline regression checks; run with python -m unittest discover ... ."""
import copy
import json
import unittest
from types import SimpleNamespace
from backend.exam_supervision import engine as E
from backend.exam_supervision.models import HEADERS, SH, normalize_rows, read_state
from backend.exam_supervision.repository import PROTOCOL, Conflict, SaveUncertain, DEFAULT_EXAM_SPREADSHEET_ID
from backend.exam_supervision.service import Service, TAB


class Book:
    id='synthetic-exam-spreadsheet-2026'
    title='Offline exam fixture'
    url='https://docs.google.com/spreadsheets/d/'+id

    def __init__(self):
        self.tables={n:[copy.deepcopy(h)] for n,h in HEADERS.items()}
        self.ids={n:i+1 for i,n in enumerate(self.tables)}
        state=E.default_state();state['editableMigration']=1
        self.tables[SH['settings']]+=[['state',json.dumps(state)],['_integration_protocol',PROTOCOL],['_integration_writer','STREAMLIT']]
        self.batches=[];self.fail_after=False

    def fetch_sheet_metadata(self):
        return {'sheets':[{'properties':dict(title=n,sheetId=i,gridProperties=dict(rowCount=2000,columnCount=40))} for n,i in self.ids.items()]}

    def values_batch_get(self,ranges,params=None):
        return {'valueRanges':[{'values':normalize_rows(self.tables[r.strip("'")])} for r in ranges]}

    def values_get(self,ran):
        return {'values':normalize_rows(self.tables[ran.split('!')[0].strip("'")])}

    def batch_update(self,body):
        stage=copy.deepcopy(self.tables)
        for request in body['requests']:
            if 'addSheet' in request:
                p=request['addSheet']['properties'];self.ids[p['title']]=p['sheetId'];stage[p['title']]=[]
            if 'updateCells' not in request:continue
            update=request['updateCells'];rg=update['range']
            name=next(n for n,i in self.ids.items() if i==rg['sheetId'])
            for row_index,row in enumerate(update['rows'],rg['startRowIndex']):
                while len(stage[name])<=row_index:stage[name].append([])
                for col_index,value in enumerate(row['values'],rg['startColumnIndex']):
                    while len(stage[name][row_index])<=col_index:stage[name][row_index].append('')
                    stage[name][row_index][col_index]=next(iter(value.get('userEnteredValue',{}).values()),'')
        self.tables=stage;self.batches.append(body)
        if self.fail_after:raise OSError('response lost after commit')


def setup(writable=True):
    book=Book();state=dict(logged_in=True,user_id='tester',user_name='Fixture',user_role='마스터')
    program=SimpleNamespace(namespace={
        'get_gspread_client':lambda:SimpleNamespace(open_by_key=lambda sid:book),
        'WORK_SHEET_ID':'synthetic-work-spreadsheet', 'TIMETABLE_SHEET_ID':'synthetic-timetable-spreadsheet'},
        call=lambda name:True if name=='can_manage_ids' else [TAB])
    app=SimpleNamespace(program=program,port=SimpleNamespace(session_state=state),repo=SimpleNamespace(writable=writable,settings={},write_count=0))
    service=Service(app);service.repo.book=book;service.repo.configuration={};service.repo.reload()
    return service,book


class SaveRecoveryTests(unittest.TestCase):
    def test_visible_menu_changes_page_with_old_frontend(self):
        from backend.bridge.port import ReactPort, State
        from backend.exam_supervision.view_improved import render
        s,b=setup();port=ReactPort(State(s.app.port.session_state));s.app.port=port
        render(port,s)
        control=port.controls['exam_page_picker']
        options=control['node']['options']
        index=next(o['value'] for o in options if o['label']=='연결·조회 권한')
        port.session_state[control['state_key']]=control['decoder'](index)
        control['callback']();port.reset();render(port,s)
        self.assertEqual(port.session_state['exam_page'],'연결·조회 권한')
        self.assertIn('exam_connect_True',port.controls)
        self.assertIn('exam_handoff',port.controls)
        self.assertEqual(b.batches,[])

    def test_readonly_connection_buttons_disabled(self):
        from backend.bridge.port import ReactPort, State
        from backend.exam_supervision.view_improved import render
        s,b=setup(False);port=ReactPort(State({**s.app.port.session_state,'exam_page':'연결·조회 권한'}));s.app.port=port
        render(port,s)
        self.assertTrue(port.controls['exam_connect_True']['node']['disabled'])
        self.assertTrue(port.controls['exam_handoff']['node']['disabled'])
        self.assertFalse(port.controls['exam_connect_False']['node']['disabled'])

    def test_empty_connection_uses_supplied_sheet_without_write(self):
        s,b=setup();s.repo.configuration=None
        self.assertEqual(s.repo.load_config()['spreadsheetId'],DEFAULT_EXAM_SPREADSHEET_ID)
        self.assertEqual(b.batches,[])

    def test_saved_connection_has_priority(self):
        from backend.exam_supervision.repository import CONFIG_SHEET, CONFIG_HEADERS
        s,b=setup();b.ids[CONFIG_SHEET]=999
        b.tables[CONFIG_SHEET]=[CONFIG_HEADERS,['connection',json.dumps({'spreadsheetId':'another-existing-sheet-id'})]]
        self.assertEqual(s.repo.load_config()['spreadsheetId'],'another-existing-sheet-id')

    def test_missing_connection_can_be_persisted_and_reloaded(self):
        s,b=setup();s.repo.load_config();s.repo.save_config({'spreadsheetId':b.id})
        self.assertEqual(s.repo.load_config()['spreadsheetId'],b.id)

    def test_settings_override_default_sheet(self):
        s,b=setup();s.app.repo.settings['exam_spreadsheet_id']='explicit-other-sheet-id'
        self.assertEqual(s.repo.load_config()['spreadsheetId'],'explicit-other-sheet-id')

    def test_classes_save_publishes_audit_and_revision(self):
        s,b=setup();s.handle('saveClasses',{**s.token_payload(),'rows':[{'grade':1,'classNo':1}]})
        self.assertEqual(b.tables[SH['classes']][1],[1,1])
        self.assertEqual(read_state(s.repo.tables)['revision'],1)
        self.assertEqual(len(b.batches),1)
        self.assertGreater(len(b.tables[SH['history']]),1)

    def test_external_edit_preserved(self):
        s,b=setup();b.tables[SH['classes']].append([2,1])
        with self.assertRaises(Conflict):s.handle('saveClasses',{**s.token_payload(),'rows':[{'grade':1,'classNo':1}]})
        self.assertEqual(b.batches,[])

    def test_readonly_stays_blocked(self):
        s,b=setup(False)
        with self.assertRaises(ValueError):s.handoff('STREAMLIT',True) if s.repo.status()['writer']!='STREAMLIT' else s.repo.commit({SH['classes']:[HEADERS[SH['classes']]]})
        self.assertEqual(b.batches,[])

    def test_handoff_before_unrelated_headers_repair(self):
        s,b=setup();b.tables[SH['roster']]=[['번호','이름','과목'],['1','Fixture','국어']]
        b.tables[SH['settings']]=[HEADERS[SH['settings']]];s.repo.reload()
        s.handoff('STREAMLIT',True)
        self.assertEqual(s.repo.status()['writer'],'STREAMLIT')
        s.initialize()
        self.assertEqual(s.repo.status()['errors'],[])
        self.assertEqual(b.tables[SH['roster']][1][:3],['1','Fixture','국어'])

    def test_handoff_cannot_write_other_tables(self):
        s,b=setup()
        with self.assertRaises(ValueError):s.repo.commit({SH['classes']:[HEADERS[SH['classes']]]},allow_handoff=True)
        self.assertEqual(b.batches,[])

    def test_gas_transition_retains_wait_barrier(self):
        s,b=setup();b.tables[SH['settings']][-1][1]='GAS';s.repo.reload();s.handoff('STREAMLIT')
        self.assertEqual(s.repo.status()['writer'],'PAUSED')
        with self.assertRaises(ValueError):s.handoff('STREAMLIT')

    def test_lost_response_requires_reload(self):
        s,b=setup();b.fail_after=True
        with self.assertRaises(SaveUncertain):s.handle('saveClasses',{**s.token_payload(),'rows':[{'grade':1,'classNo':1}]})
        self.assertTrue(s.repo.uncertain)
        with self.assertRaises(ValueError):s.repo.commit({SH['classes']:[HEADERS[SH['classes']]]})
        b.fail_after=False;s.repo.reload();self.assertFalse(s.repo.uncertain)
        self.assertEqual(b.tables[SH['classes']][1],[1,1])


if __name__=='__main__':unittest.main()

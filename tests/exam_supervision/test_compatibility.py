import json,subprocess
import pytest
from tests.exam_supervision.test_engine import original

def test_companion_retains_original_engine_self_tests():
    r=original(op='selfTests',source='compatibility/Code.gs');assert r['passed']==63 and r['failed']==0

@pytest.mark.parametrize('writer,allowed',[('GAS',True),('STREAMLIT',False),('PAUSED',False)])
def test_companion_live_writer_gate(writer,allowed):
    code="""const vm=require('vm'),fs=require('fs');const s={};vm.createContext(s);vm.runInContext(fs.readFileSync('compatibility/Code.gs','utf8'),s);s.rows=[['設定','value'],['_integration_protocol','single-writer-v1'],['_integration_writer',process.argv[1]]];vm.runInContext('spreadsheet_=()=>({getSheetByName:()=>({getLastRow:()=>rows.length,getRange:()=>({getDisplayValues:()=>rows})})});',s);let allowed=true;try{vm.runInContext('assertIntegrationWrite_()',s)}catch(e){allowed=false};process.stdout.write(JSON.stringify(allowed));"""
    r=subprocess.run(['node','-e',code,writer],text=True,capture_output=True,check=True);assert json.loads(r.stdout)==allowed

def test_header_preparation_requires_writer_ownership():
    from tests.exam_supervision.test_service import setup
    _,s,b=setup();b.tables['감독설정'][-1][1]='GAS';s.repo.reload()
    with pytest.raises(ValueError,match='저장 주체'):s.initialize()
    assert not b.batches

def test_protocol_installer_does_not_duplicate_header():
    code="""const vm=require('vm'),fs=require('fs'),s={};vm.createContext(s);vm.runInContext(fs.readFileSync('compatibility/Code.gs','utf8'),s);vm.runInContext(`activeEditorSpreadsheet_=()=>({});registerCurrentSpreadsheet_=()=>{};assertIntegrationWrite_=()=>{};ensureInitialized_=()=>{};originalSsLock_=fn=>fn();values_=()=>[['설정키','JSON 또는 값'],['state','{}']];replaceRows_=(name,rows)=>globalThis.saved=rows;installIntegrationProtocol();`,s);process.stdout.write(JSON.stringify(s.saved));"""
    r=subprocess.run(['node','-e',code],text=True,capture_output=True,check=True);rows=json.loads(r.stdout)
    assert rows==[['state','{}'],['_integration_protocol','single-writer-v1'],['_integration_writer','GAS']]

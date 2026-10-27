"""Opt-in live clone test. No credential or clone supplied means UNVERIFIED, never PASS."""
import os,sys,uuid
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from diple.enrollment.google_gateway import GoogleSheetsGatewayRepository
keys=('SRB_TEST_GATEWAY_URL','SRB_TEST_GATEWAY_KEY','SRB_TEST_SPREADSHEET_ID')
if not all(os.environ.get(k) for k in keys):
    print('UNVERIFIED: clone gateway URL/key/spreadsheet ID not supplied');sys.exit(2)
clone=os.environ[keys[2]]
from backend.exam_supervision.repository import DEFAULT_EXAM_SPREADSHEET_ID
if clone==DEFAULT_EXAM_SPREADSHEET_ID:raise SystemExit('Refusing known production exam spreadsheet')
namespace='verify_'+uuid.uuid4().hex[:24]
repo=GoogleSheetsGatewayRepository(os.environ[keys[0]],os.environ[keys[1]],namespace,expected_spreadsheet_id=clone)
marker=uuid.uuid4().hex
with repo.tx(True) as db:db.execute('INSERT INTO enrollment_meta VALUES (?,?)',('clone_verification',marker))
other=GoogleSheetsGatewayRepository(os.environ[keys[0]],os.environ[keys[1]],namespace,expected_spreadsheet_id=clone)
with other.tx() as db:assert db.execute("SELECT value FROM enrollment_meta WHERE name='clone_verification'").fetchone()[0]==marker
print('PASS: signed clone write and independent reload; test namespace '+namespace)

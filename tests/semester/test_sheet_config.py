from types import SimpleNamespace
from unittest.mock import patch
import pytest
from backend.sheet_config import resolve,enabled
from backend.credit.install import get_service
from diple.enrollment.service import EnrollmentError

URL='https://docs.google.com/spreadsheets/d/copy-sheet-123/edit#gid=0'
GW='https://script.google.com/macros/s/testing/exec'

def test_legacy_exact_compatibility():
    old={'school_id':'old','gateway_url':GW,'gateway_shared_key':'x'*32,'expected_spreadsheet_id':'copy-sheet-123'}
    assert resolve({'credit':old})==old
    assert enabled({'credit':old})

def test_all_named_sheets_same_store_and_url_normalization():
    c={'School_id':'school','Gogyohak_sheet':URL,'Semester_sheet':'copy-sheet-123','Operations_sheet':URL,'Idongban_sheet':'','Gateway_url':GW,'Gateway_shared_key':'k'*32}
    r=resolve({'school_sheets':c});assert r['expected_spreadsheet_id']=='copy-sheet-123';assert r['school_id']=='school'
    app=SimpleNamespace(port=SimpleNamespace(secrets={'school_sheets':c}))
    with patch('backend.credit.install.GoogleSheetsGatewayRepository') as repo,patch('backend.credit.install.IntegratedEnrollment') as svc:
        get_service(app);repo.assert_called_once();assert repo.call_args.kwargs['expected_spreadsheet_id']=='copy-sheet-123'
        assert repo.call_args.args[:2]==(GW,'k'*32)

def test_different_feature_sheets_or_old_target_rejected_before_io():
    for secrets in [ {'school_sheets':{'Gogyohak_sheet':'a','Semester_sheet':'b'}}, {'credit':{'expected_spreadsheet_id':'old'},'school_sheets':{'Gogyohak_sheet':URL}}, {'credit':{'school_id':'old'},'school_sheets':{'School_id':'new'}} ]:
        with pytest.raises(EnrollmentError):resolve(secrets)

def test_invalid_or_missing_document_and_no_secret_leak():
    for value in ['https://evil.test/spreadsheets/d/a','https://docs.google.com/not-a-sheet','invalid id']:
        with pytest.raises(EnrollmentError) as err:resolve({'school_sheets':{'Semester_sheet':value,'Gateway_shared_key':'SECRET'}})
        assert 'SECRET' not in str(err.value)
    with pytest.raises(EnrollmentError):resolve({'school_sheets':{'Gateway_url':GW}})
    assert not enabled({})

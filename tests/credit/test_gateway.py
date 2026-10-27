"""Isolated mock of Apps Script CAS behavior, not a live Google API test."""
import base64
import hashlib
import hmac
import json
import sqlite3
import pytest
from diple.enrollment.google_gateway import GoogleSheetsGatewayRepository
from diple.enrollment.service import VersionConflict


class FakeResponse:
    def __init__(self,value):self.value=value
    def raise_for_status(self):pass
    def json(self):return self.value


class FakeSignedGateway:
    def __init__(self,key):self.key=key;self.revision=0;self.payload=''
    def post(self,url,json,timeout):
        r=json
        assert r['namespace']=='testns'
        signature='\n'.join([r['action'],r['namespace'],str(r['timestamp']),r['nonce'],
                             str(r['expected_revision']),hashlib.sha256(r['payload'].encode()).hexdigest()])
        assert hmac.compare_digest(hmac.new(self.key.encode(),signature.encode(),hashlib.sha256).hexdigest(),r['signature'])
        if r['action']=='read':return FakeResponse({'ok':True,'revision':self.revision,
                                      'payload':self.payload,'payload_sha256':hashlib.sha256(self.payload.encode()).hexdigest()})
        if r['expected_revision']!=self.revision:return FakeResponse({'ok':False,'code':'revision_conflict'})
        db=sqlite3.connect(':memory:')
        db.deserialize(base64.b64decode(r['payload']))
        assert db.execute("SELECT name FROM sqlite_master WHERE name='students'").fetchone()
        db.close()
        self.payload=r['payload'];self.revision+=1
        return FakeResponse({'ok':True,'revision':self.revision})


def test_remote_gateway_serialization_and_cas(monkeypatch):
    fake=FakeSignedGateway('a'*48)
    monkeypatch.setattr('diple.enrollment.google_gateway.requests.post',fake.post)
    repo=GoogleSheetsGatewayRepository('https://script.google.com/macros/s/fake/exec','a'*48,'testns')
    assert fake.revision>=1
    with repo.tx(True) as db:
        db.execute("INSERT INTO enrollment_meta VALUES('hello','world')")
    with repo.tx() as db:
        assert db.execute("SELECT value FROM enrollment_meta WHERE name='hello'").fetchone()['value']=='world'
    assert fake.revision>=2


def test_remote_gateway_rejects_revision_conflict(monkeypatch):
    fake=FakeSignedGateway('a'*48)
    monkeypatch.setattr('diple.enrollment.google_gateway.requests.post',fake.post)
    repo=GoogleSheetsGatewayRepository('https://script.google.com/macros/s/fake/exec','a'*48,'testns')
    with pytest.raises(VersionConflict):
        with repo.tx(True) as db:
            db.execute("INSERT INTO enrollment_meta VALUES('conflict','data')")
            fake.revision+=1 # simulate another administrator/student committing first

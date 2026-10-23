import base64
from tests.fixtures import make_application, login, command, request
from backend.services.application import CHUNK_BYTES


def test_navigation_renders_once_after_fresh_authorization(monkeypatch):
    app, _ = make_application()
    login(app)
    calls = []
    original = app._render
    monkeypatch.setattr(app, '_render', lambda *a, **kw: (calls.append(1), original(*a, **kw))[1])
    result = command(app, 'navigate', {'tab': '교무호봉획정'})
    assert result['response']['success']
    assert len(calls) == 1


def test_changed_teacher_identity_refreshes_registry(monkeypatch):
    app, sheets = make_application()
    login(app)
    sheets['아이디저장함'].values[1][1] = '테스트나'
    calls=[]
    original=app._render
    monkeypatch.setattr(app,'_render',lambda *a,**kw:(calls.append(1),original(*a,**kw))[1])
    result=command(app,'navigate',{'tab':'교무호봉획정'})
    assert result['response']['success']
    assert result['user']['name']=='테스트나'
    assert len(calls)==2


def test_permission_change_rebuilds_controls_before_execution():
    app, sheets = make_application()
    login(app)
    command(app, 'navigate', {'tab': '🔑 아이디·권한 관리'})
    sheets['아이디저장함'].values[1][2:] = ['일반교사', '시간표 조회']
    result = command(app, 'navigate', {'tab': '🔑 아이디·권한 관리'})
    assert not result['response']['success']
    assert result['user']['role'] == '일반교사'
    assert sheets['아이디저장함'].writes == 0


def test_download_ledger_keeps_shared_bytes_and_exact_duplicate_response():
    app, _ = make_application()
    login(app)
    source = b'%PDF-test' + b'x' * (CHUNK_BYTES * 3)
    app.port.controls['test-download'] = {'binary':source}
    req = request(app, 'download_chunk', {'control':'test-download', 'offset':CHUNK_BYTES})
    first = app.dispatch(req)['response']
    entry = app.responses[req['requestId']]
    assert 'data' not in entry['response']['result']
    assert entry['download_source'][0] is source
    assert base64.b64decode(first['result']['data']) == source[CHUNK_BYTES:CHUNK_BYTES*2]
    # A subsequent page may replace the control; retry must return original bytes.
    app.port.controls.pop('test-download')
    second = app.dispatch(req)['response']
    assert first == second


def test_old_admin_control_is_denied_after_revocation():
    app, sheets = make_application()
    login(app)
    command(app, 'navigate', {'tab': '🔑 아이디·권한 관리'})
    admin_control = next(k for k, v in app.port.controls.items() if v['node']['kind'] == 'button' and '저장' in v['node']['label'] and k != 'top_quick_save')
    sheets['아이디저장함'].values[1][2:] = ['일반교사', '시간표 조회']
    result = command(app, 'control', {'control': admin_control, 'values': {}})
    assert not result['response']['success']
    assert sheets['아이디저장함'].writes == 0

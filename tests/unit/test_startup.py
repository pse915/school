from pathlib import Path
import pytest
from backend.bridge.startup import load_frontend,StartupAssetsError,create_runtime

def test_missing_build_stops_with_specific_file_names(tmp_path):
    with pytest.raises(StartupAssetsError,match='frontend/dist/style.css.*frontend/dist/timetable.js'):load_frontend(tmp_path)

def test_empty_or_invalid_build_is_rejected(tmp_path):
    (tmp_path/'style.css').write_text('x{}');(tmp_path/'timetable.js').write_text('')
    with pytest.raises(StartupAssetsError,match='비어'):load_frontend(tmp_path)
    (tmp_path/'timetable.js').write_text('<html>not javascript</html>')
    with pytest.raises(StartupAssetsError,match='React 모듈'):load_frontend(tmp_path)

def test_release_changes_with_assets_and_accepts_bom(tmp_path):
    (tmp_path/'style.css').write_text('x{}',encoding='utf-8-sig');(tmp_path/'timetable.js').write_text('export default ()=>{}',encoding='utf-8-sig')
    css,js,first=load_frontend(tmp_path);assert not css.startswith('\ufeff') and not js.startswith('\ufeff')
    (tmp_path/'style.css').write_text('y{}');assert load_frontend(tmp_path)[2]!=first

def test_actual_entrypoint_runs_without_secrets():
    from streamlit.testing.v1 import AppTest
    app=AppTest.from_file(str(Path(__file__).resolve().parents[2]/'timetable_app2.py')).run(timeout=20)
    assert not list(app.exception)
    assert any(e.type=='bidi_component' for e in app)

def test_entrypoint_shows_recoverable_error_when_bundle_is_missing(monkeypatch):
    from streamlit.testing.v1 import AppTest
    def missing(_):raise StartupAssetsError('필수 화면 파일이 없습니다: frontend/dist/timetable.js')
    monkeypatch.setattr('backend.bridge.startup.load_frontend',missing)
    app=AppTest.from_file(str(Path(__file__).resolve().parents[2]/'timetable_app2.py')).run(timeout=20)
    assert not list(app.exception)
    assert any('시작하지 못했습니다' in x.value for x in app.error)
    assert any('frontend/dist/timetable.js' in x.value for x in app.warning)

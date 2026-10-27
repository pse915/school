"""Startup checks shared by the real Streamlit entrypoint and regression tests."""
from pathlib import Path
import hashlib

class StartupAssetsError(RuntimeError):
    pass

def load_frontend(directory):
    directory=Path(directory)
    required=('style.css','timetable.js')
    missing=[str(Path('frontend/dist')/name) for name in required if not (directory/name).is_file()]
    if missing:
        raise StartupAssetsError('필수 화면 파일이 없습니다: '+', '.join(missing)+'. 전체 프로젝트의 폴더 구조를 유지하여 업로드하세요.')
    css=(directory/'style.css').read_text(encoding='utf-8-sig')
    js=(directory/'timetable.js').read_text(encoding='utf-8-sig')
    if not css.strip() or not js.strip():
        raise StartupAssetsError('frontend/dist의 화면 파일이 비어 있습니다. npm run build 후 생성된 두 파일을 업로드하세요.')
    if 'export' not in js or 'default' not in js:
        raise StartupAssetsError('frontend/dist/timetable.js가 React 모듈 빌드 결과가 아닙니다. npm run build로 다시 생성하세요.')
    release=hashlib.sha256((css+'\n'+js).encode()).hexdigest()[:16]
    return css,js,release

def create_runtime(secrets,context,settings):
    # Do not cache a half-initialized runtime in Streamlit session_state.
    from backend.services.application import Application
    runtime=Application(secrets,context,settings)
    runtime.initialize()
    return runtime

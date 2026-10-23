"""Package the reviewed working tree; exclude credentials and build caches."""
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT.parent/'deliverables'
OUT.mkdir(parents=True,exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT).decode().splitlines()
files=sorted(set(git('ls-files','--cached','--others','--exclude-standard')))
files=[s for s in files if (ROOT/s).is_file() and not any(p in s.split('/') for p in ('node_modules','__pycache__','.pytest_cache','.git','screenshots','browser-artifacts')) and not s.endswith(('.pyc','.log','secrets.toml')) and s not in ('tests/browser-results.json',)]
modified=git('diff','--name-only');untracked=git('ls-files','--others','--exclude-standard');deleted=git('ls-files','--deleted')
reason=lambda p: '기존 Application에 인증된 메뉴·exam API·로그아웃 정리 연결' if p=='backend/services/application.py' else '실제 진입점 초기화·화면 파일·로딩 오류 진단 보완' if p in ('timetable_app2.py','backend/bridge/startup.py') else 'React 준비 신호·초기화 오류 안내·회귀 테스트' if p.startswith('frontend/src/') else '기존 React 소스를 현재 잠금파일로 재빌드' if p.startswith('frontend/dist/') else '시험감독 서비스·배정·시트·React 화면 구현' if p.startswith('backend/exam_supervision/') else '기존 GAS와 저장 주체 전환 호환' if p.startswith('compatibility/') else '사용자 첨부 기준 원본 보존' if p.startswith('reference/') else '회귀·원본 동등성·권한·저장·브라우저 테스트' if p.startswith('tests/') or p.startswith('frontend/tests/') or p=='pytest.ini' else '소스 전수 조사·재현 가능한 패키징' if p.startswith('tools/') else '적용·기능 대응·검증 결과 문서'
# Generate one exact list for the reviewer.
changefile='docs/exam-supervision/CHANGED_FILES.md';manifest='docs/exam-supervision/EXAM_MANIFEST.json'
files=sorted(set(files+[changefile,manifest]));changed=sorted(set(modified+untracked+[changefile,manifest])&set(files))
lines=['# 변경 파일 목록','','삭제 파일: '+('없음' if not deleted else ', '.join(deleted)),'','| 상태 | 파일 | 변경 이유 |','|---|---|---|']
for p in changed:lines.append('| '+('수정' if p in modified else '신규')+' | `'+p+'` | '+reason(p)+' |')
(ROOT/changefile).write_text('\n'.join(lines)+'\n')
preserved=['legacy/timetable_app2_original.py','requirements.txt','requirements-dev.txt','frontend/package.json','frontend/package-lock.json']
checks={p:subprocess.check_output(['git','show','HEAD:'+p],cwd=ROOT)==(ROOT/p).read_bytes() for p in preserved}
assert all(checks.values()),checks
metadata={'baseCommit':git('rev-parse','HEAD')[0],'entrypoint':'timetable_app2.py','preservedByteIdentical':checks,'deletedFiles':deleted,'files':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in files if p!=manifest}}
(ROOT/manifest).write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
patch=OUT/'changed-files.zip'
with zipfile.ZipFile(patch,'w',zipfile.ZIP_DEFLATED) as z:
 for p in changed:z.write(ROOT/p,p)
start='''# 시험감독 코드 통합 전달본\n\n- srbtimetable2026/: 실행 가능한 전체 프로젝트 소스\n- changed-files.zip: 기존 저장소에 경로를 유지해 적용할 변경 파일\n- srbtimetable2026/docs/exam-supervision/INTEGRATION.md: 연결·권한·저장 전환·배포 안내\n- FEATURE_PARITY.csv / API_MAP.csv / SOURCE_INVENTORY.json: 원본 기능 대응 및 분석\n- TEST_RESULTS.md / PYTHON_TEST_OUTPUT.txt: 실행한 테스트 및 미검증 항목\n\nPython 152개, React 8개 테스트와 로컬 브라우저 검증을 완료했습니다. 최신 결과는 docs/exam-supervision/STARTUP_DEBUG.md를 먼저 확인하세요. 실제 Google Sheets·GAS 배포·운영 반영은 수행하지 않았습니다. 운영 오류의 원인은 실제 Cloud 로그 확인이 필요합니다.\n\n기존 운영 진입점 timetable_app2.py와 Secrets를 그대로 유지합니다. 먼저 STARTUP_DEBUG.md와 INTEGRATION.md를 읽고 별도 브랜치/복제 시트로 검증하세요. 이 ZIP에는 자격증명이나 node_modules가 포함되지 않습니다.\n'''
final=OUT/'srbtimetable2026-exam-integration.zip'
with zipfile.ZipFile(final,'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('START_HERE.md',start)
 z.write(patch,'changed-files.zip')
 for p in files:z.write(ROOT/p,'srbtimetable2026/'+p)
with zipfile.ZipFile(final) as z:assert z.testzip() is None
print(json.dumps({'path':str(final),'bytes':final.stat().st_size,'projectFiles':len(files),'changedFiles':len(changed),'preserved':checks},ensure_ascii=False))

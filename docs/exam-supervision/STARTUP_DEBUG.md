# 화면 미표시 점검·수정 결과 (2026-10-22 KST)

## 확인한 사실

사용자가 설정한 진입점 `timetable_app2.py`는 올바릅니다. 전달본의 실제 진입점을 Streamlit 1.56.0 / Python 3.12에서 직접 실행했으며, Chromium에서 로그인 입력란·로그인 버튼이 표시됐습니다. 빈 화면 자체는 로컬에서 재현되지 않았습니다. 사용자 운영 사이트의 브라우저 접근은 허용되지 않았으므로 실제 Cloud 오류 원인은 확정하지 않았습니다. 현재 공개 저장소 main의 HEAD는 기준 커밋 b4dc029와 같았습니다. 다른 배포 브랜치를 사용하는지, 통합본을 실제 배포한 상태인지는 이 정보만으로 판단할 수 없습니다.

이전 진입점은 빌드 파일을 직접 읽고 컴포넌트를 호출했으며, 초기화 완료 신호가 없었습니다. 파일 누락·빈 파일·잘못된 빌드·모듈 누락·React 초기화 실패를 구분해 안내하는 처리가 부족했습니다. 이번 수정은 이 경로를 보완한 것이며, 확인하지 못한 운영 오류 원인을 특정했다고 주장하지 않습니다.

## 수정한 내용

- `timetable_app2.py`: 기존 진입점 이름·로그인·Secrets·React v2 구조 유지. 필수 화면 파일 확인 후 실행하고 실패 시 화면에 안내합니다. 부분 초기화된 Application을 세션에 먼저 저장하지 않습니다.
- `backend/bridge/startup.py`: style.css/timetable.js의 누락·빈 내용·모듈 형태를 검사하고 BOM을 제거합니다. 빌드 내용에 따른 식별자를 생성합니다.
- Python 컴포넌트 캐시는 CSS/JS 내용을 키로 사용합니다. 배포 파일이 바뀌었을 때 이전 캐시를 재사용하지 않습니다.
- React 실제 마운트 후 ready 신호를 보내고 Python의 로딩 안내를 지웁니다. JS가 실행되지 않으면 흰 화면 대신 로딩 안내가 남아 구분할 수 있습니다.
- React 진입 함수의 초기화 오류는 사용자에게 안전한 오류 유형과 복구 안내를 표시합니다. 기존 AppErrorBoundary도 유지합니다.
- callback에서 예상하지 못한 오류가 발생하면 기존 비공개 값 제거 처리를 거쳐 응답합니다.
- 기존 모달 E2E 테스트 한 곳은 맞교환 후 수업이 떠난 공강 셀을 클릭하고 모달을 기대하고 있었습니다. 실제 수업이 이동한 교사·교시 셀을 선택하도록 테스트를 바로잡았습니다. 공강 클릭에 억지로 수업 모달을 열도록 앱 동작을 변경하지 않았습니다.

## 실제 실행 결과

| 검증 | 결과 |
|---|---|
| Python 전체 회귀·신규 진입점·누락 파일 테스트 | 152개 통과 |
| React 컴포넌트·초기화·ready 신호·오류 안내 테스트 | 8개 통과 |
| TypeScript 타입 검사·ESLint·Vite 빌드 | 통과 |
| 실제 진입점 브라우저 실행 | 로그인 화면 표시, ready 수신 후 로딩 안내 해제 확인 |
| 로컬 브라우저 E2E | 9개 통과 (32.8초), STARTUP_E2E_OUTPUT.txt 참조 |
| 운영 Cloud·실제 Google Sheets | 미검증·미변경 |

브라우저 검증은 합성 자료 QA 서버와 실제 진입점의 미로그인 화면을 사용했습니다. Chromium 153으로 확인했으며 운영 데이터에 로그인·쓰기하지 않았습니다. 이번 E2E에서는 기존 50MB 업로드 스트레스 테스트를 제외했습니다. 원본 자가진단과 시험감독 비교 테스트는 기존 전체 Python 테스트에 포함됩니다.

## GitHub 적용 시 꼭 확인할 구조

압축 파일 바깥의 폴더 이름을 저장소에 한 겹 더 추가하지 마세요. **전체 프로젝트 ZIP의 `srbtimetable2026/` 안에 있는 파일과 폴더를 기존 GitHub 저장소 루트에 같은 경로로 적용**해야 합니다. 또는 `changed-files.zip`을 저장소 루트에 경로를 유지해서 적용합니다. py 파일만 바꾸면 새 보조 모듈이 없어 실행되지 않습니다.

```text
timetable_app2.py
requirements.txt
backend/bridge/startup.py
backend/services/application.py
backend/exam_supervision/...
frontend/src/...
frontend/dist/style.css
frontend/dist/timetable.js
legacy/timetable_app2_original.py
.streamlit/config.toml
```

Streamlit의 Main file path는 계속 `timetable_app2.py`입니다. 검증 환경은 Python 3.12입니다. 기존 Secrets는 유지하고, 전체 파일 반영 후 Streamlit의 Reboot app으로 새 프로세스에서 확인하세요. Node 설치는 Cloud 운영 실행에 필요하지 않으며, 제공한 빌드 산출물 두 파일이 필요합니다.

여전히 화면이 안 나오면 **Manage app → Logs의 첫 오류 블록**과 앱 화면에 나타나는 오류 유형을 확인해야 실제 원인을 확정할 수 있습니다. 토큰·서비스 계정 private_key 등 Secrets 내용은 보내지 마세요. 빌드 의존성 설치 단계에서 실패한 경우 Python 진입점이 실행되기 전이므로 Logs 확인이 필요합니다.

## 재현 명령

```bash
python -m pytest tests
cd frontend
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

브라우저 서버는 프로젝트 루트에서 각각 실행합니다.

```bash
python -m streamlit run tests/qa_app.py --server.port 8502
python -m streamlit run tests/exam_supervision/qa_app.py --server.port 8503
python -m streamlit run timetable_app2.py --server.port 8504
```

frontend에서 환경변수 `EXAM_TEST_URL=http://127.0.0.1:8503`, `TIMETABLE_STARTUP_URL=http://127.0.0.1:8504`를 설정한 뒤 `npm run test:e2e -- --grep-invert 50MB`를 실행합니다. Playwright Chromium 또는 TIMETABLE_BROWSER_PATH로 지정한 호환 Chromium 실행 파일이 필요합니다.

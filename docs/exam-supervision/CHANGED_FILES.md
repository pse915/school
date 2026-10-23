# 변경 파일 목록

삭제 파일: 없음

| 상태 | 파일 | 변경 이유 |
|---|---|---|
| 신규 | `backend/bridge/startup.py` | 실제 진입점 초기화·화면 파일·로딩 오류 진단 보완 |
| 신규 | `backend/exam_supervision/__init__.py` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 신규 | `backend/exam_supervision/engine.py` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 신규 | `backend/exam_supervision/install.py` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 신규 | `backend/exam_supervision/models.py` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 신규 | `backend/exam_supervision/repository.py` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 신규 | `backend/exam_supervision/schema.json` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 신규 | `backend/exam_supervision/service.py` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 신규 | `backend/exam_supervision/view.py` | 시험감독 서비스·배정·시트·React 화면 구현 |
| 수정 | `backend/services/application.py` | 기존 Application에 인증된 메뉴·exam API·로그아웃 정리 연결 |
| 신규 | `compatibility/Code.gs` | 기존 GAS와 저장 주체 전환 호환 |
| 신규 | `compatibility/Index.html` | 기존 GAS와 저장 주체 전환 호환 |
| 신규 | `docs/exam-supervision/API_MAP.csv` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/CHANGED_FILES.md` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/DIALOG_TEST_OUTPUT.txt` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/EXAM_MANIFEST.json` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/FEATURE_PARITY.csv` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/INTEGRATION.md` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/PYTHON_TEST_OUTPUT.txt` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/SOURCE_INVENTORY.json` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/STARTUP_DEBUG.md` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/STARTUP_E2E_OUTPUT.txt` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/STARTUP_PYTHON_OUTPUT.txt` | 적용·기능 대응·검증 결과 문서 |
| 신규 | `docs/exam-supervision/TEST_RESULTS.md` | 적용·기능 대응·검증 결과 문서 |
| 수정 | `frontend/dist/style.css` | 기존 React 소스를 현재 잠금파일로 재빌드 |
| 수정 | `frontend/dist/timetable.js` | 기존 React 소스를 현재 잠금파일로 재빌드 |
| 수정 | `frontend/src/App.tsx` | React 준비 신호·초기화 오류 안내·회귀 테스트 |
| 수정 | `frontend/src/component.tsx` | React 준비 신호·초기화 오류 안내·회귀 테스트 |
| 신규 | `frontend/src/components/Startup.test.tsx` | React 준비 신호·초기화 오류 안내·회귀 테스트 |
| 수정 | `frontend/src/types.ts` | React 준비 신호·초기화 오류 안내·회귀 테스트 |
| 수정 | `frontend/tests/e2e/app.spec.ts` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `frontend/tests/e2e/exam.spec.ts` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `frontend/tests/e2e/startup.spec.ts` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 수정 | `pytest.ini` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `reference/exam-original/Code.gs` | 사용자 첨부 기준 원본 보존 |
| 신규 | `reference/exam-original/Index.html` | 사용자 첨부 기준 원본 보존 |
| 신규 | `reference/exam-original/REQUIREMENTS.md` | 사용자 첨부 기준 원본 보존 |
| 신규 | `tests/exam_supervision/original_runner.cjs` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `tests/exam_supervision/qa_app.py` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `tests/exam_supervision/test_compatibility.py` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `tests/exam_supervision/test_engine.py` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `tests/exam_supervision/test_service.py` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 수정 | `tests/fixtures.py` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 신규 | `tests/unit/test_startup.py` | 회귀·원본 동등성·권한·저장·브라우저 테스트 |
| 수정 | `timetable_app2.py` | 실제 진입점 초기화·화면 파일·로딩 오류 진단 보완 |
| 신규 | `tools/exam_source_inventory.cjs` | 소스 전수 조사·재현 가능한 패키징 |
| 신규 | `tools/package_exam_integration.py` | 소스 전수 조사·재현 가능한 패키징 |

# 변경 파일 목록

비교 기준: Phase2 통합본 ZIP(SHA256 db1ebffdad27f5f7e7a3a35d0aaede571aa152063a04b1af0adbe075b4b2c7f6), Git 952d3f8. 최초 srbmaster가 기준이 아니다.

| 구분 | 파일 |
|---|---|
| A | `SEMESTER_README.md` |
| M | `backend/operations/exam_adapter.py` |
| M | `backend/operations/install.py` |
| M | `backend/operations/service.py` |
| M | `backend/operations/source.py` |
| A | `backend/semester/__init__.py` |
| A | `backend/semester/install.py` |
| A | `backend/semester/integration.py` |
| A | `backend/semester/io.py` |
| A | `backend/semester/jobs.py` |
| A | `backend/semester/model.py` |
| A | `backend/semester/service.py` |
| A | `backend/semester/solver.py` |
| M | `backend/services/application.py` |
| A | `docs/SEMESTER_DATA_MODEL.md` |
| A | `docs/SEMESTER_DEPLOYMENT_GUIDE.md` |
| A | `docs/SEMESTER_FEATURE_MATRIX.md` |
| A | `docs/SEMESTER_KNOWN_LIMITATIONS.md` |
| A | `docs/SEMESTER_PLAYWRIGHT_RESULTS.md` |
| A | `docs/SEMESTER_ROLLBACK_GUIDE.md` |
| A | `docs/SEMESTER_TEST_RESULTS.md` |
| A | `docs/SEMESTER_TIMETABLE_HANDOFF.md` |
| A | `docs/semester-evidence/benchmark.json` |
| A | `docs/semester-evidence/browser-results.json` |
| A | `docs/semester-evidence/build.log` |
| A | `docs/semester-evidence/google-copy.log` |
| A | `docs/semester-evidence/lint.log` |
| A | `docs/semester-evidence/npm-ci.log` |
| A | `docs/semester-evidence/playwright.log` |
| A | `docs/semester-evidence/preservation.json` |
| A | `docs/semester-evidence/python.log` |
| A | `docs/semester-evidence/python.xml` |
| A | `docs/semester-evidence/react.log` |
| M | `frontend/dist/timetable.js` |
| M | `frontend/src/App.tsx` |
| M | `frontend/src/components/NodeRenderer.tsx` |
| M | `frontend/src/components/OperationsEditor.tsx` |
| A | `frontend/src/components/SemesterEditor.test.tsx` |
| A | `frontend/src/components/SemesterEditor.tsx` |
| M | `frontend/src/store.ts` |
| A | `frontend/tests/e2e/semester.spec.ts` |
| M | `pytest.ini` |
| A | `scripts/benchmark_semester.py` |
| M | `scripts/run_e2e.py` |
| A | `tests/semester/__init__.py` |
| A | `tests/semester/data/synthetic-input.xlsx` |
| A | `tests/semester/qa_app.py` |
| A | `tests/semester/test_service.py` |
| A | `docs/SEMESTER_CHANGED_FILES.md` |

ZIP 추가 보조 파일: 갱신 `CHECKPOINT.txt`, 신규 `docs/semester-checkpoint.bundle`, 신규 `docs/SEMESTER_ARCHIVE_MANIFEST.json`. 이 파일들은 최종 소스 commit 이후 생성된다. 기존 Phase2 bundle은 Full에서 유지하며 변경 ZIP에 중복 포함하지 않는다.

Full = 기준 ZIP의 정규화된 모든 파일 + 최종 Git 추적 소스 + checkpoint/manifest. Changed = 기준 ZIP과 바이트가 다른 파일만. 삭제 파일 없음. 두 ZIP을 생성 후 기준본+Changed로 Full 전체 파일 바이트가 재구성되는지 검증한다. 캐시, node_modules, Secrets, .git 작업 디렉터리는 포함하지 않는다. Git 이력은 bundle로 제공한다.

보존 비교는 semester-evidence/preservation.json 참조. 시험감독/진입점/원본 인증 및 Sheets 파일 23개가 동일하다.

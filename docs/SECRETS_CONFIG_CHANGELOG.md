# Secrets 시트 설정 통합 변경

후속 직접 연결 변경: docs/DIRECT_SHEETS_GUIDE.md 및 DIRECT_TEST_RESULTS.md 참조. 아래는 이전 게이트웨이 설정 호환 작업의 이력이다.

기준: 학기 시간표 통합본 `8bf6c4d4b3beb80dfe18ab1276a07373ee032f8b`. 기존 기능과 저장 schema는 유지한다. 운영 데이터/사이트를 수정하지 않았다.

## 변경
- backend/sheet_config.py: 기능명별 시트 URL/ID → 기존 credit config 정규화. 기존 학교ID/문서ID와 불일치, 기능별 서로 다른 문서ID를 원격 연결 전에 차단.
- backend/credit/install.py: 새 config 해석기 사용, 기존 설정 fallback 유지.
- backend/semester/{install,integration}.py 및 backend/operations/{install,exam_adapter}.py: 새 설정만 있을 때도 기능 활성화와 실제 학년도/학기 설정 인식. 원본 시험감독 엔진은 수정하지 않음.
- examples/secrets-school-sheets.toml: 실제 Secrets에 추가할 복사 가능한 예제.
- docs/SECRETS_SHEETS_GUIDE.md: 설치 위치, 설정명, 기존 데이터 유지, 공유 문서 구조, 게이트웨이 배포 설명.
- tests/semester/test_sheet_config.py: 기존 설정 호환, URL 정규화·repository 인자, 오연결 차단, 오류 메시지 비밀키 비노출.
- tests/semester/qa_app.py: 실제 Streamlit fixture에서 새 설정만 사용하도록 변경.

## 보존/제한
기본 시간표/관리자/시험감독 Secrets 및 원본 파일, 기존 인증/배정/수업교환 기능은 그대로다. 새로 시트를 초기화하거나 자동 마이그레이션하지 않는다. 기존 확장 데이터가 있으면 기존 school_id와 문서ID를 그대로 유지해야 한다.
기능별 이름은 하나의 통합 확장 문서를 가리키는 alias다. 네 개의 독립 문서로 분할 저장하는 기능이 아니다. 주소 외에 기존 게이트웨이 URL과 공유 키가 필요하다. 실 Google 연결은 자격정보가 없어 미검증.
최종 체크포인트는 CHECKPOINT.txt, 최신 테스트 증거는 docs/secrets-evidence와 SECRETS_TEST_RESULTS.md를 참조한다. 이전 SEMESTER_* 문서의 원본 증거는 보존한다.

## ZIP 기준
새 Changed ZIP은 이번 수정 직전 학기 시간표 Full ZIP(SHA256 704347c87a4e8fd0653ea09837f598580d39001edb8bc91963248e52b0fbecee)을 기준으로 추가/수정 파일만 담는다. 과거 Phase2 기준 Changed와 혼동하지 않는다. 새 Full은 이전 전체 파일+이번 수정이며 캐시/Secrets/node_modules는 제외한다. 기존 checkpoint bundle은 보존하고 새 secrets-checkpoint.bundle을 추가한다.

# 학교명 설정 변경·검증 결과

현재 나이스 설정은 `docs/NEIS_NAME_ONLY_GUIDE.md` 참조. 학교명+API 키로 자동 검색하며 수동 코드 필드는 사용하지 않는다.

기준 커밋 9989f3f6529e400857614407c7cc97550b582520. 개발 브랜치 school-branding. 2026-10-27 실행. 운영 사이트/문서에 직접 배포·쓰기를 하지 않았다.

## 변경 범위
- backend/school_profile.py: school.name 설정, 기본값 학교, 기존 최상위 SCHOOL_NAME 호환, 선택 NEIS 코드, 설정 미존재 처리. 계정/문서/학교ID 설정은 변경하지 않는다.
- legacy 원본 및 세 개의 보조 Python 실행 소스: 학교명·학교별 고정 NEIS fallback/교육청명 제거. 명시한 학교 정보로 조회한다.
- 새 학기 생성: 학교 표시명과 학기명을 구분해 저장한다. 기존 확정본은 변경하지 않는다.
- tests/parity: byte hash만으로 원본을 비교하던 검사는 승인된 표시명/NEIS 설정 변경을 제외하고 함수·상수 AST를 비교한다. 204개 함수 선언(중복 이름 포함) 중 NEIS 조회 1개만 설정 처리에 맞게 변경했고 나머지 203개와 기타 79개 대입문은 원본과 동일하다. 원본 inventory는 과거 기준의 이력으로 보존한다.
- 시험감독 엔진, 기존 진입점·Sheets 저장·브리지·React package-lock 등 보호 파일 22개는 byte 동일하다. legacy 파일 전체 byte 동일 보존을 주장하지 않는다.

## 실제 결과
| 검사 | 결과 | 상태 |
|---|---|---|
| python -m pytest -q | 345 수집, 344 통과, 1 skip, 실패/오류 0; 19.656초 | 완료 |
| 강화 AST parity 별도 실행 | 4 통과 | 완료 |
| React test | 5 files / 14 통과 | 완료 |
| React build / lint | exit 0 / exit 0 | 완료 |
| 실제 Streamlit 관련 E2E | 학교명 표시·학기 흐름·모바일·실제 진입점 4 통과, 28.6초 | 완료 |
| 새 학교명 Excel/인쇄·신규 학기 데이터 | Python 테스트 통과 | 완료 |
| 실제 Google/NEIS 원격 연동 | 인증정보 미제공, 기존 연결 코드 유지 | 미검증 |

초기 실행에서 Secrets 파일 자체가 없으면 시작 단계에서 오류가 발생했다. StreamlitSecretNotFoundError를 설정 해석기에 처리하여 기본 이름으로 로그인 화면을 열도록 수정한 뒤 전체 Python과 관련 E2E를 다시 통과했다. 초기 실패 로그도 포함한다.
이번 수정에서 이전의 전체 25개 브라우저 suite를 재실행한 것은 아니며, 변경에 관련된 4개를 실행했다. 기존 기능은 전체 Python 회귀로 확인했다. 전체 과거 브라우저 결과는 이전 버전의 증거이며 현재 전수검증으로 보고하지 않는다.
실행 소스(.py/.ts/.tsx/.html)에서 기존 고유 학교명의 리터럴이 남지 않았는지 검사했다. Git bundle의 과거 원본/이력까지 삭제한 것은 아니다.

시작법: timetable_app2.py. 설정법: SCHOOL_BRANDING_GUIDE.md. 비교/ZIP 기준: SCHOOL_BRANDING_CHANGED_FILES.md.

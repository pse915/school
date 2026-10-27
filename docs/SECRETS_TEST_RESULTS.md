# Secrets 연결 변경 검증 결과

후속 직접 연결 변경: docs/DIRECT_SHEETS_GUIDE.md 및 DIRECT_TEST_RESULTS.md 참조. 아래는 이전 게이트웨이 설정 호환 작업의 이력이다.

2026-10-26 실행. 기존 학기 통합본 8bf6c4d 기준. 실 Google 인증정보/운영 데이터는 사용하지 않았다.

| 검사 | 결과 | 상태 |
|---|---|---|
| 전체 Python pytest | 331 수집, 330 통과, 1 skip, 실패/오류 0; 94.931초 | 완료 |
| 신규 설정 테스트 재실행 | 4 통과 | 완료 |
| 예제 TOML parse | 9개 설정 키 정상 | 완료 |
| React Vitest | 5 files, 14 tests 통과 | 완료 |
| React build | exit 0, dist 변경 없음 | 완료 |
| React lint | exit 0 | 완료 |
| 원본 보호 파일 비교 | 진입점/원본인증/Sheets/시험감독/브리지 등 21개 동일 | 완료 |
| 실제 Google 복제본 저장 | 자격정보 미제공 | 미검증 |

Python skip은 기존 donor fixture 날짜에 수업 3개 미만인 조건이다. 신규 설정 테스트는 기존 credit 호환, 새 school_sheets 연결 인자, 기능별 문서 불일치/기존 학교·문서 변경 차단, URL 검증과 비밀키 비노출을 확인한다.
실제 Streamlit 연결 Playwright 25/25 통과(7.4분). 기존 23개와 새 school_sheets만 사용하는 학기 편성 2개를 포함한다. 학기 입력/편성/편집/확정/적용/Phase6 및 기존 조회, 모바일 터치·팝업·모든 메뉴·새로고침을 확인했다. 실제 진입점은 로그인 렌더까지, 로그인 후 전체 경로는 동일 브리지를 사용하는 합성 fixture다. 실제 Google 쓰기나 실 운영 계정 인증 검증을 의미하지 않는다. 기존 로그 원본은 docs/secrets-evidence에 포함한다.

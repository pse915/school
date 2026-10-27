# 최종 실제 테스트 결과

검증일: 2026-10-23. 최종 근거는 `docs/phase2-evidence/` 원시 로그/XML/JSON이며 모든 데이터는 합성 자료다.

| 검증 | 실제 결과 | 판정 |
| --- | --- | --- |
| `python -m pytest -q` | 총 305건: **302 통과, 3 조건부 skip, 실패/오류 0** | 완료 / skip 명시 |
| `npm ci` | 기존 package-lock으로 설치 성공 | 완료 |
| `npm run build` | TypeScript + Vite 성공, dist 재생성 | 완료 |
| `npm run test` | **12 통과**, 4 test files | 완료 |
| `npm run lint` | 성공 | 완료 |
| 실제 Streamlit 연결 `npm run test:e2e` | **23 통과**, 실패/skip/flaky 0 | 완료 |
| 원본 핵심 파일 보존 | 원본 추적파일 23개 byte/SHA 동일 | 완료 |
| 신규 원격 저장 서명·직렬화·CAS | 모의 gateway 재조회·경합·읽기 무쓰기·패배 트랜잭션 거부 | 완료 (모의) |
| 실 Google Sheets 복제본 | URL·공유키·문서ID 미제공으로 UNVERIFIED | 미검증 |
| 실제 운영 계정·운영 배포·실기기 | 변경/접속 미실행 | 미검증 |

## 조건부 skip 3건

이식본의 CP-SAT 표본 결과에 따라 다음 구형 사례가 skip되었다.

- test_timetable_collision_by_teacher: 해당 표본 날짜에 동시 교시 없음.
- test_room_conflict_rejected: 같은 시간 타 수업 없음.
- test_chain_swap_preview_and_atomic_reject: 표본 날짜 수업 3개 미만.

이 세 기능 자체를 검증하지 않았다는 의미는 아니다. `tests/operations/test_deterministic_conflicts.py`의 고정 교실·실학생 충돌 사례, `test_valid_three_way_swap_atomic`의 고정 3개 수업 연쇄교환 성공, 신규 통합·대강 중복·실제 브라우저 드래그 검사가 별도로 통과했다. skip된 테스트를 통과 건수에 포함하지 않았다.

## 실행 범위

- 기존 인증/권한, 시간표·결보강·맞교환/팝업, 시험감독 엔진/규칙/공정성/저장/출력 회귀.
- Phase 5A 학생 활성화/로그인, 임시저장/제출/재제출/학점/선택수/기간/확정/권한 격리.
- Phase 5B 자동분반/복합시수/누락/중복/정원/수동이동/실제 자원 확정/학생별 시간표, 기존 기본 시간표와 실학생 결합 충돌.
- Phase 6 결강/후보 없음/담당교과/시간강사 기간·교시/학교 상한/보강/수업 이동/직접·연쇄·날짜간 교환/교실·학생 충돌/행사/승인·반려·확정/다중 날짜 원자적 배포/이력/동시 수정.
- 기존 시험감독 조회 어댑터의 무쓰기 및 운영 실제 일정에 따른 기존 시험감독 저장 전 충돌 거부.
- 실제 v2 브리지 드래그·모바일 tap·팝업 종료·지연·offline timeout·중복 클릭·재로그인 후 저장본 재조회.

## 발견 후 수정

- 학기 중 승인/반려 후 컨트롤 갱신 누락 → 성공 후 서버 재렌더.
- 취소된 수업에서 보강 생성 시 취소 상태 상속 → 보강 수업 scheduled로 복원.
- 다중 날짜 변경의 날짜별 개별 배포 위험 → 관련 확정 요청의 날짜 집합을 한 트랜잭션으로 배포.
- 모의/원격 SQL 어댑터에 기존 SQLite BEGIN이 중첩됨 → auto 트랜잭션 경로를 분리하고 변경 없는 읽기의 원격 쓰기를 제거.
- 모바일 사이드바가 후속 화면을 가림 → 메뉴 선택 시 소형 화면 자동 접기.
- 기존 모바일 브라우저 테스트의 로그인·메뉴 준비 경쟁 및 숨겨진 메뉴 제목 검사 → 실제 사용 경로와 보이는 콘텐츠로 수정.
- 학생 로그인 모드 버튼과 로그인 제출 버튼의 같은 이름 → E2E에서 로그인 form 안의 제출 버튼으로 범위를 한정. 기존 인증 동작은 변경하지 않음.

## 환경

Python 3.12, Streamlit 1.56.0, pandas 2.2.3, OR-Tools 9.15.6755, Argon2 25.1.0. React/Vite/TypeScript/Playwright는 기존 package-lock 사용. 브라우저는 대체 Chromium 153이며 CI는 Playwright 제공 Chromium을 설치한다. pandas의 기존 fillna FutureWarning 13건은 실패가 아니다.

원본 ZIP의 초기 회귀 2건은 1단계에서 테스트 모형/기대값 보완으로 수정했으며, 시험감독 엔진 소스는 바뀌지 않았다. 실 운영/Google 복제본 검증과 서로 다른 저장소의 경합 보증은 KNOWN_LIMITATIONS.md를 따른다.

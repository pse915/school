# 1단계 실제 실행 결과

검증일: 2026-10-23. 합성 데이터만 사용. 실행 로그는 `phase1-evidence/` 참조.

| 검증 | 결과 | 범위 |
| --- | --- | --- |
| 수정 전 원본 Python | 197 통과 / 2 실패 | 별도 detached baseline worktree에서 재현 |
| 최종 Python 전체 | **246 통과**, 13 FutureWarning | 기존 시간표/교환, 시험감독, Phase 5A/5B, 새 브리지·권한·시간표 검사 |
| React TypeScript + Vite build | **통과** | 실제 배포용 dist 재생성 |
| React Vitest | **10 통과**, 3 files | 기존 startup/node renderer + 고교학점제 메뉴/추가 입력 종류 jsdom 스모크 |
| React ESLint | **통과** | 기존 CI 명령 |
| Streamlit 1.56.0 health / entry HTTP | **200 / 200** | 실제 진입점 서버. 브라우저 실행 증거와는 다름 |
| 원본 핵심 파일 SHA/byte | **동일** | 진입점·legacy 인증·Sheets·bridge·시험감독 전체·store·component·package |
| Google 저장소 서명/CAS/재조회 | **모의 어댑터 통과** | FakeSignedGateway. 실 Google 테스트 아님 |
| 실 Google Sheets 복제본 | **미실행** | 별도 복제본과 게이트웨이 인증 설정 미제공 |
| Chromium 브라우저 E2E | **미실행** | 브라우저 설치가 손상된 다운로드로 실패. 관련 로그 보관 |
| 운영 pse915 로그인 / 운영 저장 | **미실행** | 운영 시스템 변경 금지 준수 |

원본 2개 실패의 원인은 시험감독 엔진 오류가 아니라 다음 테스트 정의의 불일치였다.

1. `MemorySpreadsheet` 모형에 기존 화면이 참조하는 `title`이 없었음. 테스트 모형에 title/id/url을 추가.
2. `load_config()`가 원래 기본 spreadsheetId를 반환하는데 테스트가 빈 dict를 기대함. 기존 구현 계약에 맞게 기대값 수정.

`backend/exam_supervision/`는 수정하지 않았다. 시험감독 저장 규칙·엔진을 바꾸어 테스트를 통과시킨 것이 아니다.

Phase 5A/5B 테스트: `tests/credit/test_enrollment.py`, `test_sectioning.py`, `test_gateway.py`, `test_integrated_credit.py`. 학생 격리, 계정 잠금/활성화, 제출·수정·학점·기간·버전 충돌, 스냅샷, 자동분반, 복합시수, 정원·중복·누락·수동이동, 실제 자원 충돌, 기존 관리자 권한, React v2 학생 로그인 및 본인 시간표 조회를 검사한다.

남은 운영 검증과 기존 시간표 통합 한계는 PHASE1_HANDOFF.md의 미완료 목록을 따른다.

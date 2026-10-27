# 시험감독 기능 대응표 (2026-10-22)

기준: `srbtimetable2026-exam-integration.zip`. 표에 적힌 API 명칭은 `backend/exam_supervision/service.py`의 기존 Service.handle 작업명이며, 직접 함수를 호출하는 기능은 별도 표시한다. 원본 `Code.gs`와 `Index.html`은 `compatibility/`에 보존했고, 운영 GAS 웹사이트 내부 동작은 로그인 없이 확인하지 못했다.

| 현재 기능/기존 위치 | 개선 후 화면 | 연결 API/서버 함수 | 검증 |
|---|---|---|---|
| 시험감독 준비 현황: `view.py`/model, repo.status | 준비 현황 | `bootstrap`, `ctx.validate`, `repo.status` (조회) | 합성 상태·쓰기 방지 신규 pytest |
| 내 감독 조회: `view.py`, `service.py` | 교사별 감독 조회 | `getTeacher` | 기존 service 테스트, 관리자/교사 범위 테스트 |
| 전체 배정 조회: `view.py` | 전체 감독 시간표 | `getConfirmed` | 기존 service 테스트, 로컬 브라우저 조회 이동 |
| 학급 설정: `view.py` | ① 시험일정 > 학년별 반 수 및 개별 학급 표 | `saveClasses` | 기존 `saveClasses` 계약 테스트, 미리보기 UI 시험 |
| 시험·자습 날짜 교시: `view.py` | ① 시험일정 > 날짜·교시 표/일괄 적용/복사 | `saveSchedule` | 엔진 날짜·교시 검증 테스트, 로컬 화면 렌더 |
| 교사 명단, 담임, 상치교과: `view.py` | ② 교사 명단 | `saveRoster` | 기존 service·engine 테스트 |
| 강사 제외와 역할별 가능 여부: `view.py` | ② 감독 역할·강사 제외 | `saveInstructorFlags`, `saveRoster` | 기존 API 계약 테스트 |
| 교사별 배정불가: `view.py` | ② 배정불가 시간 | `saveUnavailable` | 기존 제약 테스트 |
| 수업 시간표: `view.py` | ② 수업시간표 | `saveTeaching`, `availabilityReport` | 기존 제약·service 테스트 |
| 겸임교사 일정: `view.py` | ② 겸임교사 일정 | `saveVisiting`, `availabilityReport` | 기존 수업/겸임 서비스 테스트 |
| 교사감독규칙: `view.py` | ② 교사감독규칙 | `saveTeachingRules`, `availabilityReport` | 기존 규칙 엔진 테스트 |
| 자습인원/감독상한/최적화: `view.py` | ② 최적화 설정 | `saveSettings`, `engine.optimization` | 기존 validator 테스트, 폼 구문 검사 |
| 자동 배정/개선/비교/취소: `view.py` | ③ 자동 배정·직접 수정 | `Service.start_job`, `job_status`, `apply_job` | 기존 engine/service 테스트, 브라우저 화면 이동 |
| 직접 수정/교환/역할교환: `view.py` | ③ 자동 배정·직접 수정 | `update`, `swap`, `roleSwap`, `saveAssignments` | 기존 engine 제약 테스트 |
| 공정성/제외 사유: `view.py` | ④ 공정성 검토 | `optimizationReport`, `fairness` | 기존 engine/service 테스트, 브라우저 화면 이동 |
| 변경 이력/버전 확인/인쇄/시트 재생성 | ⑤ 저장·기록·인쇄 | `history`, `listVersions`, `getVersionPreview`, `repair`, `getConfirmed` | 기존 버전·service 테스트, 브라우저 화면 이동 |
| 교사 조회 허용·시트 연결 | 연결·조회 권한 | `Service.connect`, `repo.status` | 기존 권한 테스트; 운영 권한 직접 검증 불가 |
| GAS↔Streamlit 저장 주체 | 저장 주체·연결 진단 | `Service.handoff`, `repo.status`, `Service.initialize` | 저장자 보호·revision/dataToken 서비스 회귀 테스트 |
| 상위 시간표/결보강/맞교환/모달 | 기존 최상위 메뉴 유지 | `backend/services/application.py`, 기존 `App.tsx` transport | 전체 합성 회귀 158건 통과; 실제 운영 미검증 |

- 메뉴 진입과 필드 편집은 기존 서버 구동 ReactPort 이벤트 계약을 유지한다. 새 `exam_meta` 노드는 **읽기 전용 화면 메타데이터**이며 저장 API가 아니다.
- 일반교사에게는 기존 설정으로 허용된 감독 조회만 렌더링한다. 모든 관리자 API는 서버에서 원래 권한 검사를 유지한다.
- 상태 표시 `설정됨`은 저장/설정 데이터가 있다는 의미다. 별도의 검토 수행 증거가 없으면 `공정성 검토`는 확인 필요로 표시한다.
- 기존 확정·잠금·복원/버전 생성은 UI에서 활성화하지 않았다.
- 본 표의 각 행이 자동화된 E2E 테스트를 따로 통과했다는 의미는 아니다. 검증 범위는 `EXAM_UI_TEST_RESULTS.md`에 구분했다.

# 최초 통합본 검증 결과

후속 화면 미표시 디버깅 결과는 **STARTUP_DEBUG.md**를 먼저 확인하세요. 아래는 최초 통합 시점의 기록이며, 후속 검증에서는 브라우저 실행을 완료했습니다.

실행일: 2026-10-21 UTC. Python 3.12 / Node.js 24 / Linux.
기준 커밋: b4dc02990d3996f158508cf2f6bb9b1f5ca20008.
운영 계정·Sheets·GitHub main에는 쓰기를 수행하지 않았습니다.

| 실행 항목 | 결과 | 범위 |
|---|---|---|
| `python -m pytest -o addopts='' --tb=short -W ignore::FutureWarning` | **132 통과** (약 7초) | 기존 49 + 시험감독 83 |
| `python -m pytest tests/dialog_fix -o addopts='' --tb=short -W ignore::FutureWarning` | **15 통과** | 기존 기본 testpaths에서 제외된 모달 회귀 테스트도 별도로 실행 |
| 원본 Code.gs `runSelfTests_()` | **63/63 통과** | 위 시험감독 pytest에서 Node vm으로 원본 실행; Google Utilities의 날짜 포맷만 대체 |
| 동반 compatibility/Code.gs `runSelfTests_()` | **63/63 통과** | 같은 엔진 자가진단 유지 |
| Python 앱 내 `exam.selfTests` | **12/12 통과** | 별도 합성 진단; pytest 1개에서 검증 |
| `npm ci --ignore-scripts --no-audit --no-fund` | 성공 | 잠금파일 기준 의존성 설치 |
| `npm run typecheck` | 성공 | 기존 및 추가 브라우저 테스트 TypeScript 포함 |
| `npm run lint` | 성공 | 기존 React 소스 |
| `npm test` | **5/5 통과** | NodeRenderer 컴포넌트 테스트 |
| `npm run build` | 성공 | tsc + Vite, 1990 모듈; dist/style.css 및 dist/timetable.js 재생성 |
| `npm run test:e2e -- --grep 'React v2 login'` | **브라우저 시작 실패** | Chromium 실행 파일 없음. 설치 시도도 다운로드 응답이 잘못된 ZIP으로 반복 실패. 앱 조작 단계에 도달하지 못함 |
| 신규 `frontend/tests/e2e/exam.spec.ts` | 작성·타입 검사 완료, 실행 미완료 | 아래 합성 QA 서버와 EXAM_TEST_URL 사용; Chromium 문제로 브라우저 검증하지 못함 |
| 실제 서비스 계정·복제 Google Sheets | **미실행** | 인증 정보·검증용 실제 시트 미제공 |
| GAS/Streamlit 실서비스 저장 주체 전환 | **미실행** | 합성 게이트·대기·저장 충돌 테스트만 통과 |
| 실제 운영 전후 동등성 / Cloud 배포 | **미실행** | 원격 push·병합·배포 안 함 |
| 실제 브라우저 인쇄/PDF·모바일 레이아웃 | **미검증** | 반응형 기존 컴포넌트 재사용, 카드·필터·출력 구현; 시각 QA 필요 |

총 Python 테스트는 **147개 통과**입니다. 원본 자가진단 63개와 동반 GAS 자가진단 63개는 pytest 내부 실행 항목이므로 Python 테스트 수에 다시 합산하지 않았습니다. 브라우저 실행 실패를 성공으로 계산하지 않았습니다. 기능 100% 운영 검증 완료로 판정하지 않습니다.

## 시험감독 테스트 내용

- 원본/Python 12개 합성 입력: 자리 생성·교사별 제외 사유·유효성 검사·역할별 통계·목적함수 벡터 비교.
- 8개 시드의 매칭 결과 일치, 6개 PRNG 시드의 난수열 일치.
- 4개 최적화 프리셋에서 필수 조건 유지, 모든 교사 대체 trial의 증분 목적함수와 전체 재계산 일치, rollback 및 고정 자리 유지.
- 수업 미등록 부족 인원 투입, 겸임 특정 날짜 우선순위, 포함·제외 규칙, 실제 시각 중복에 대한 원본 후보 비교.
- 해 없음·취소·점심 단절, 하드 제약 위반 수동 변경 차단.
- 단일 batchUpdate로 초안·결과·통계·인쇄·이력 저장, 기존 버전 시트 보존.
- 외부 수정 충돌, 저장 성공 후 응답 유실, 불명 저장 재시도 차단 및 최신 조회 복구.
- 읽기 전용 초기화·저장 차단, 사용자 변경 세션 폐기, 일반교사 API 거절·본인 조회 제한, 오래된 revision 거절.
- 동일 요청 ID 재전송 시 저장 1회, 백그라운드 계산의 명시적 저장 및 외부 변경 거절.
- 조건표 저장, 지속 연결 설정 왕복, 명단 사용자 열 보존, 삭제 대상 명시.
- 배정결과 직접 편집 감지, 조회 무저장, 다음 저장에서 초안 반영.
- GAS/PAUSED/STREAMLIT 실시간 게이트, 전환 대기, 프로토콜 설치 시 헤더 중복 방지.
- 9개 하위 화면이 기존 React 노드 트리로 렌더되고 오류 노드·iframe을 추가하지 않는지 검사. 실제 브라우저 렌더 검사와는 구별합니다.

## 원본 분석

SOURCE_INVENTORY.json은 TypeScript AST로 조사한 원본 최상위 함수 **187개**와 호출 목록·API 28개를 기록합니다. 원본은 현재 EDITABLE 흐름이며 verifyRoster/revokeRoster/resetWorkspace/confirm/unlockConfirmed/discardUnlocked/createVersion/restore 계열은 명시적으로 오류를 던지는 비활성 코드입니다. 삭제하지 않고 원본 보존 디렉터리에 유지했습니다.

Index.html의 readActions에는 `getResetPlan`, `getAuditData`, `getVersionLibrary`, `getVersionPreview`, `versions` 등 원본 api switch에 없는 이름도 선언되어 있습니다. 이는 허용 목록 선언이며 모두 실제 활성 호출이라는 뜻은 아닙니다. literalFrontendCalls와 declaredReadActionsNotExposed를 구분하여 기록했습니다. 과거 버전 조회만 이번 통합에서 읽기 전용으로 명시적으로 연결했습니다.

원본 validateSchedule_의 학년·일차 조합 5개 제한과 역할/교과/상치/수업 예외 우선순위를 유지했습니다. 브라우저 입력 보조 UI는 기존 React 표·붙여넣기·설정 편집기로 재구성했으며 원본 HTML 픽셀 단위 복제는 아닙니다.

## 재실행

```bash
python -m pip install -r requirements-dev.txt jinja2
python -m pytest
python -m pytest tests/dialog_fix
cd frontend
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
```

기존 브라우저 테스트: 별도 터미널에서 `python -m streamlit run tests/qa_app.py --server.port 8502`를 실행한 후 frontend에서 `npm run test:e2e -- --grep-invert 'exam pages'`.

시험감독 브라우저 테스트: 별도 터미널에서 `python -m streamlit run tests/exam_supervision/qa_app.py --server.port 8503`를 실행한 후 frontend에서 `EXAM_TEST_URL=http://127.0.0.1:8503 npm run test:e2e -- exam.spec.ts`.

Windows PowerShell에서는 `$env:EXAM_TEST_URL='http://127.0.0.1:8503'` 설정 후 npm 명령을 실행합니다. QA 진입점은 합성 자료 전용이며 운영 진입점으로 사용하지 않습니다.

## 운영 전 남은 검증

복제한 두 스프레드시트와 실제 서비스 계정으로 연결/재시작 지속성/원자 배치/서식·수식/정상 및 불명 응답 복구를 확인해야 합니다. 패치한 GAS 배포에서 PAUSED 대기와 양쪽 저장 거절·전환을 확인해야 합니다. 기존 전체 E2E, 신규 시험감독 E2E, 개인/전체 인쇄와 390·768·1366px 화면, 최대 학교 규모와 장시간 취소를 확인해야 합니다. 이 검증 후 관리자 승인으로 main에 반영하세요.

# 실제 실행 시험 결과 (2026-10-22, 격리된 로컬 환경)

| 검사 | 결과 | 실행 조건·증거 |
|---|---|---|
| Python 시험감독 회귀 테스트 | **94 통과** | `python /mnt/data/work/run_synthetic.py -q -o addopts='' tests/exam_supervision` (모의 Sheets) |
| Python 전체 회귀 (Streamlit AppTest 제외) | **158 통과** | `... tests --ignore=tests/unit/test_startup.py`, 약 6초, 13건 FutureWarning |
| Python 원본 전체 회귀 | **158 통과 / 2 실패** | `streamlit.testing.v1` 패키지가 환경에 없어 `tests/unit/test_startup.py` 2건 실행 불가 |
| 컴파일 번들 JavaScript 문법 | **통과** | `node --check frontend/dist/timetable.js` |
| React TypeScript/TSX 트랜스파일 구문 | **14개 파일, 0 구문 오류** | 시스템 전역 TypeScript 5.8.3 `transpileModule`; 타입 검사 아님 |
| 브라우저 렌더 (기존 dist 수정본) | **통과** | 로컬 Chromium/Playwright, 모의 API 스냅샷 연결, 16개 메뉴 표시·10개 실제 클릭, JS 오류 0건 |
| 데스크톱/태블릿/휴대폰 | **통과(로컬 시각 렌더)** | 1366·768·390px 브라우저, 768·390px에서 본문 가로 overflow 없음 |
| 신규 E2E 테스트 파일 | **작성됨, 실행 안 됨** | `frontend/tests/e2e/exam.spec.ts` |
| `npm ci`, 공식 `npm run build` | **환경 때문에 실행 불가** | npm 레지스트리 다운로드 실패; 오프라인 캐시에 `zustand@5.0.15` 없음. Node 22.16.0은 해당 종속성 일부의 Node 요구 버전보다 낮음 |
| React 완전 타입 검사/ESLint/Vitest | **미검증** | `node_modules` 설치 불가 |
| Streamlit 서비스 프로세스/실제 권한/Google Sheets | **미검증** | 운영 데이터 보호를 위해 접속·쓰기 테스트 미수행 |
| 배정 시드별 수치 정확성, 실계정 E2E 전 경로 | **전수검증 완료 아님** | 엔진 파일 변경 없고 기존 합성 엔진/서비스 테스트는 통과했으나 완전한 실운영 비교는 별도 필요 |

## 재현 환경

테스트 컨테이너에 `gspread` 및 `streamlit` 배포 의존성이 제공되지 않아 pip registry 접속/설치에 실패했다. 설치를 가장하지 않고, 로컬 테스트에서 **import 용 `gspread`/Google service-account 모듈만 임시 대체**한 뒤 기존 시험 모의 Book 객체를 사용했다. 이는 운영용 모듈을 대체하거나 운영 코드에 대체 구현을 넣었다는 의미가 아니다.

브라우저 검사는 실제 `frontend/dist` 번들을 로컬 Chromium에 로드한 뒤 Python에서 생성한 합성 화면 스냅샷과 정적으로 연결했다. 로컬 `about:blank` 환경에 필요한 UUID 지원을 테스트 페이지에만 주입했다. 따라서 **브라우저 UI가 보였고 메뉴가 클릭된 것**은 검증되었으나, Streamlit 서버와 실제 Google Sheets까지 관통하는 E2E 검증은 아니다.

## 꼭 확인할 운영 전 검증

복제한 스프레드시트로 관리자/일반교사 권한 및 메뉴 노출, 일차·학급·교사 조건별 수정 후 재조회, 시드 고정 배정 결과의 원본 대조, 계산 취소·개선·검토 후 명시적 저장, 변경 교환과 고정, 동시 저장 revision 충돌과 응답 유실, GAS 소유권 전환(실운영 아닌 복제 사본), 인쇄, X/ESC/바깥 클릭 모달 반복, 390·768·1366 반응형, 결보강/맞교환/전체 시간표 회귀를 검증할 것.

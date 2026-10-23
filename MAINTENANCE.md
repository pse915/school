# 유지보수

## 코드 원칙

`legacy/timetable_app2_original.py`는 기준선입니다. 수정하지 마세요. `domain/program.py`가 해당 파일의 함수·상수를 세션별 네임스페이스에 로드하고 UI 포트를 주입합니다. 전역 streamlit 모듈을 monkey-patch하지 않습니다.

사업무 로직 변경이 필요하면 원본과 새 서비스의 입력/출력 비교 테스트를 먼저 추가합니다. 원본이 잘못된 결과를 생성하는 경우 원본 상태와 수정의 범위를 명시합니다. 새로운 추천 점수·호봉 환산 규칙을 UI 개선이라는 이유로 추가하지 마세요.

장기적인 다음 단계는 원본 메뉴 본문에 남아 있는 업무 처리 코드를 명시적인 Domain/Service 요청으로 분리하는 것입니다. 현재는 업무 조건문 보존을 위해 원본 실행을 사용하는 호환 계층입니다. 함수 본문 재사용 자체로 전체 동등성이 입증되지는 않습니다.

## UI 수정

- 메뉴/헤더/테마: `frontend/src/App.tsx`
- 공통 버튼: `frontend/src/components/ui.tsx`, shadcn 방식의 소스 소유 primitive와 CVA
- Radix 모달: `NodeRenderer.tsx`, `App.tsx`
- TanStack 표/편집/셀 선택/검색/드래그: `DataGrid.tsx`
- 평일 달력/주간 이동: `Calendar.tsx`, 서버 기준은 `services/calendar.py`
- 파일 청크/진행/다운로드: `NodeRenderer.tsx`와 `services/application.py`
- 디자인 토큰/반응형/포커스/상태: `styles.css`

입력 컨트롤 타입을 추가할 때 Python decoder와 TypeScript 렌더러를 함께 구현합니다. 알 수 없는 타입을 조용히 숨기지 않습니다. 서버 콜백/함수 이름을 요청 본문으로 받아 임의 실행하지 않습니다.

React 검색/모달/달력 월 이동/표 검색은 서버를 호출하지 않습니다. 원본 업무 조건이 바뀌는 선택과 실행만 브리지로 전달합니다. 텍스트 입력은 로컬 draft에 보관하고 실행 버튼에서 묶어 보냅니다. 오류 시 draft를 유지합니다. 현재 전체 화면 모델의 전송은 남아 있어 완전한 delta/pagination 프로토콜이 필요합니다.

## 검증과 배포

1. 기능 목록의 원본 함수/줄 번호를 확인합니다.
2. Python 테스트에 계산·저장 형식·권한·실패 경로를 추가합니다.
3. React 입력/선택 테스트와 필요한 브라우저 업무 테스트를 추가합니다.
4. `npm ci`, typecheck/lint/test/build, pytest, Playwright를 실행합니다.
5. 소스와 dist를 함께 커밋합니다. `.streamlit/secrets.toml`은 커밋하지 않습니다.
6. 복제된 시트의 Cloud 테스트 앱에서 대조합니다. 운영 적용은 완료 게이트 통과 후 수행합니다.

`tools/analyze_source.py`는 기준본의 전체 AST 목록을 다시 생성합니다. `tests/qa_app.py`는 외부 연동 없는 테스트 앱입니다. production 진입점에서 테스트 fixture를 import하면 안 됩니다.

## 장애 대응

- 로그인 목록을 읽지 못하면 기존 인증/공유 권한/시트 ID를 확인합니다. 임의 마스터 ID를 새로 생성하지 않습니다.
- NEIS 실패는 휴일이 없다는 의미가 아닙니다. 주간 표시를 중단하는 원본 방어를 유지합니다.
- 저장 충돌 시 작성값을 확보하고 최신 자료를 불러옵니다. 충돌 안내 후 재시도가 실패하면 실제 시트를 먼저 확인합니다.
- 타임아웃 뒤 새 requestId로 무작정 반복하지 않습니다. 서버 요청 원장은 모든 네트워크 중복을 해결하지 않습니다.
- 여러 시트 중 일부만 저장되었다면 원본 데이터 백업과 실제 예산/보강/교환 내역을 대조합니다.
- 코드 롤백 방법은 `DEPLOYMENT.md`에 있습니다.

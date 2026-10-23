# 시험감독 UI 개선 — 변경 내용 및 한계

## 수정 기준

- 사용자 지정 실제 운영 도메인: https://srbmaster.streamlit.app/
- 적용 대상 GitHub: https://github.com/pse915/master
- 진입점: `timetable_app2.py` (경로와 실행 계약 유지)
- 기준 소스: 최근 Library ZIP `srbtimetable2026-exam-integration.zip` (보존된 GAS `compatibility/Code.gs`, `compatibility/Index.html` 포함)

## 변경 파일과 이유

| 파일 | 내용 |
|---|---|
| `backend/exam_supervision/view.py` | 종전 메뉴를 16개 항목으로 재구성하고 보기 전용 `exam_meta` 노드를 도입. 기존 CSV·JSON 붙여넣기 도구와 API 호출 헬퍼 보존 |
| `backend/exam_supervision/view_improved.py` (신규) | 대시보드, 5단계 관리자 화면, 한국어 라벨/폼, 학급·일정 변경 미리보기, 직접 배정·공정성·인쇄 메뉴 구현 |
| `backend/services/application.py` | 기존 시간표 공통 저장의 의미를 분명히 하도록 버튼 문구만 변경 (저장 동작 불변) |
| `frontend/src/App.tsx` | 숨겨진 시험감독 selectbox 대신 전용 내비게이션 삽입; 시험감독 화면 전환 시 미저장 draft 값 보존 |
| `frontend/src/components/ExamNavigation.tsx` (신규) | 상시 보이는 관리자 메뉴, 진행 바, 이전/다음 이동, 미저장 입력 확인, 태블릿 접기 |
| `frontend/src/components/NodeRenderer.tsx` | 숨겨야 할 시험감독 selectbox 및 메타 UI 출력 방지, 기존 renderer 나머지 경로 유지 |
| `frontend/src/styles.css` | 시험감독 영역의 글꼴, 버튼 크기, 표 및 모바일 레이아웃 개선; 일반 시간표 화면에 CSS 범위 한정 |
| `frontend/dist/timetable.js`, `frontend/dist/style.css` | Streamlit에서 사용되는 기존 컴파일 번들에 동등한 신규 메뉴·스타일을 반영. npm 빌드가 아니므로 아래 한계 참고 |
| `frontend/tests/e2e/exam.spec.ts` | 상시 메뉴/단계 표시, 휴대폰 경로 검사 시나리오로 수정 (이 환경에서는 runner 실행 불가) |
| `tests/exam_supervision/test_ui_workflow.py` (신규) | 관리자/교사 메뉴 범위, 실제 집계값, 읽기전용 상태, 구 메뉴 호환 테스트 |
| `EXAM_UI_FUNCTION_MATRIX.md`, `EXAM_UI_CHANGELOG.md`, `EXAM_UI_TEST_RESULTS.md`, `EXAM_UI_DEPLOYMENT.md` (신규) | 기능 대응표, 변경 내역, 검증 증거·한계, GitHub 적용·복구 방법 |

**의도적으로 수정하지 않은 파일:** `timetable_app2.py`, `backend/exam_supervision/engine.py`, `repository.py`, `service.py`, 기존 `compatibility/Code.gs`/`Index.html`, Google Sheets 스키마, Secrets, 사용자/권한 관리 로직. 배정 알고리즘이나 소유권 전환 프로토콜을 바꾸지 않았다.

## 동작 및 미구현 세부 요구

- 관리자에게는 준비 현황, 조회, 1~5단계 작업과 7개 조건 하위 메뉴, 연결/진단 메뉴가 노출된다. 일반교사는 허용된 조회 화면만 본다.
- 시험감독 계산·개선은 **자동 저장되지 않고** 검토 후 원래 서버 API로 저장한다.
- 학급별 반 수 변경은 추가 위주의 미리보기 방식이고, 기존 학급 제거가 포함되면 일괄 삭제를 막는다.
- 시험일정 시간·학년 운영 값 중 복잡한 항목은 한국어 열 제목의 편집 표와 고급 원본 JSON 편집 기능을 병행한다. 모든 세부 설정을 완전한 개별 위젯으로 변환한 것은 아니다.
- 감독 가능 역할은 교사 명단 표에서 O/X 선택으로, 일부 조건은 표 편집으로 제공한다. 교사 상세는 관계 데이터 미리보기이며 7개 조건 편집 메뉴와 연결된다.
- 자동 배정 상태는 서버 job의 실제 결과만 사용하며 가짜 진행률 %를 넣지 않았다.
- 미저장 수정에 대해서는 **입력을 유지한 채 이동/취소** 확인을 제공한다. 모든 화면을 동시에 시트에 저장하는 기능은 추가하지 않았다.
- 공정성 그래프는 기존 지표에 기반하고 제외 이유가 횟수 차이의 인과관계를 증명한다고 말하지 않는다.
- 원본에서 비활성화된 확정·잠금·버전 복원 기능은 여전히 비활성이다.

## 유의사항

1. 이 수정은 실제 운영 Google Sheets에 쓰지 않았다. 운영 계정으로 교사/관리자 로그인 테스트도 하지 않았다.
2. Python/브라우저 일부 검증은 모의 시트 및 모의 API 응답을 사용하므로, 배포 전 복제 시트에서 저장·충돌·복구·모달 실동작을 다시 확인해야 한다.
3. 현재 배포용 `frontend/dist`는 **Vite 새 빌드 산출물이 아닌 기존 번들 패치본**이다. 의존성 다운로드가 가능한 환경에서 반드시 `npm ci && npm run build`를 다시 실행하고, src 소스 기반 빌드 결과를 함께 확인하는 것을 권장한다.
4. 100% 기능 동등성·모든 실제 계정 권한·실서비스 무중단 배포는 확인되지 않았다. 자세한 미검증 항목은 테스트 보고서를 따른다.

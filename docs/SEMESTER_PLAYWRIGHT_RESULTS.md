# 실제 Streamlit Playwright 결과

`TIMETABLE_BROWSER_PATH=/workspace/scratch/264c2dbee139/browser-runtime/chromium python scripts/run_e2e.py` 실행, Chromium 153, 총 25/25 통과(2.5분). 지정 경로는 본 개발 환경의 실행 바이너리다. CI에서는 기존 Playwright Chromium 설치 절차를 사용한다.
스크립트는 legacy/exam/operations/semester 합성 자료용 앱 및 실제 `timetable_app2.py`를 실행한다. 별도 서비스로 제품을 분리한 것이 아니라 테스트 fixture 서버다. 실제 진입점은 시작·로그인 화면까지만 확인하고, 전체 authenticated flow는 동일 application/bridge를 사용하는 fixture 앱에서 합성 계정으로 검사한다. 실제 운영 계정 로그인을 했다고 보고하지 않는다.

신규 semester.spec.ts 2개가 실제 Streamlit 브리지를 통과했다.
- 원본 로그인 → 5종 Excel 업로드/열 매핑 → 자동편성 → PC drag → preview/save → undo/redo → 확정/적용 → Excel → Phase6 조회 → 기존 교사 주간 조회에서 실제 새 과목 확인.
- 390px hasTouch 모바일 터치 → 모달 X/ESC/외부/취소 → 전체 10메뉴 → refresh/root 유지.

기존 23개에는 원본 모달/편집, 시험감독, Phase6의 오류/지연/중복 클릭/메뉴 전환/refresh/승인 흐름이 포함된다. 신규 React 단위 테스트 2개는 네트워크 오류 후 편집 루트 유지 및 지연 응답 중 중복 저장 방지를 별도로 검증한다.
모든 오류·닫기 경로를 새 학기 메뉴의 모든 모달에 대해 조합 폭발 방식으로 검사한 것은 아니다. 물리 iOS/Safari/Android는 미검증. 테스트 동안 흰 화면 assertion 실패는 없었다.
증거: semester-evidence/playwright.log, browser-results.json 및 frontend/tests/e2e/semester.spec.ts. 외부 폰트 네트워크는 테스트에서 차단해 결정성을 확보했다.

# 실제 Streamlit 연결 Playwright 결과

최종 결과: **23개 통과, 실패 0, 건너뜀 0**. `phase2-evidence/playwright.log`, `playwright-results.json` 참조.

실행은 실제 Streamlit 1.56.0 서버 4개와 기존 Components v2 브리지를 사용했다. 독립 HTML 모형 테스트가 아니다.

| 대상 | 확인 |
| --- | --- |
| 원본 timetable_app2.py | 실제 로그인 화면 부팅, React ready 이후 로딩 안내 종료 |
| 기존 합성 시간표 앱 | 관리자 로그인, 기존 메뉴, 결강·대강 저장/취소, 맞교환, 드래그 검증·저장, 조서 출력, 50MB 청크 업로드 |
| 기존 합성 시험감독 앱 | 원본 시험감독 메뉴 전체, 모바일 메뉴·시험일정 화면 |
| 통합 합성 운영 앱 | 12개 운영 메뉴, 학생 신청→신청 확정→자동분반→시간표, 드래그→승인→확정→배포→재로그인 재조회 |
| 팝업 | 신규 X·ESC·바깥 클릭·취소, 기존 수업·교환·설정 팝업 반복 종료, 확인/제출, 중복 클릭 |
| 장애 | 실제 WebSocket 응답 지연, 실제 offline 및 전송 timeout, React 루트 유지 및 새로고침 복구 |
| 단말 | desktop 1366×900/1920×1080, tablet 768×1024/1024×768, mobile 390×844. 신규 모바일 선택은 hasTouch+tap |

발견·수정:

1. 모바일 업무 메뉴 선택 후 사이드바가 본문을 덮음 → 소형 화면에서 메뉴 선택 시 자동 접기.
2. 승인 상태 변경 후 이전 컨트롤이 남아 확정 버튼이 갱신되지 않음 → 성공 후 서버 재렌더링.
3. 일부 기존 브라우저 테스트가 로그인 응답 이전에 메뉴를 누르거나, 자동 접힌 메뉴의 숨겨진 제목을 검사함 → 실제 화면 준비와 보이는 콘텐츠 기준으로 대기/검사.

기본 Playwright CDN 다운로드가 손상되어, 이번 실행은 별도 설치한 Chromium 153 실행 파일을 TIMETABLE_BROWSER_PATH로 지정했다. 프로젝트 package-lock은 바꾸지 않았다. CI/일반 환경에서는 `npx playwright install --with-deps chromium`을 사용한다. 브라우저 바이너리는 ZIP에 포함하지 않는다.

합성 데이터만 사용했고 외부 폰트 요청은 차단해 기본 글꼴로 검사했다. 실 iPad/Safari/Android 기기 또는 모든 색상·폰트 조합의 수동 시각검수까지 의미하지 않는다. 새로고침 후 재로그인을 요구하는 기존 인증 정책은 유지했다.

재실행:

```bash
pip install -r requirements-dev.txt
cd frontend
npm ci
npm run build
npx playwright install --with-deps chromium
cd ..
python scripts/run_e2e.py
```

별도 Chromium 사용 시 환경변수 TIMETABLE_BROWSER_PATH를 설정한다. 이 스크립트는 합성 서버만 시작하며 운영 사이트를 대상으로 하지 않는다.

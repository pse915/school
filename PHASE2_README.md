# Diple School Master — Phase 5A · 5B · 6 통합본

실행 진입점은 기존 **timetable_app2.py**입니다. 기존 시간표·관리자 인증·시험감독 엔진을 유지하고 React 앱에 고교학점제와 학기 중 운영을 추가했습니다.

먼저 읽을 파일:

- docs/DEPLOYMENT_GUIDE.md
- docs/GOOGLE_SHEETS_MIGRATION.md
- docs/FEATURE_PARITY_MATRIX.md
- docs/TEST_RESULTS.md / docs/PLAYWRIGHT_RESULTS.md
- docs/KNOWN_LIMITATIONS.md
- docs/ROLLBACK_GUIDE.md
- docs/CHANGED_FILES.md

로컬 Python 302개 통과(표본 조건부 skip 3개), React 12개 통과, 실제 Streamlit Playwright 23개 통과. **실 Google Sheets 복제본 검증과 운영 배포는 미실행**입니다. 분리된 기존 저장소 전체의 분산 트랜잭션을 보증하는 결과물이 아닙니다.

전체 ZIP과 변경 ZIP은 동일한 소스 체크포인트에서 제작했습니다. 변경 ZIP은 최초 첨부 srbmaster 원본 기준의 추가·수정 파일만 포함합니다. 기존 운영 데이터·시험감독 확정본 초기화는 하지 않습니다.

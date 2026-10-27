# Diple School Master — Semester Timetable

현재 나이스 설정은 `docs/NEIS_NAME_ONLY_GUIDE.md` 참조. 학교명+API 키로 자동 검색하며 수동 코드 필드는 사용하지 않는다.

학교 표시명 설정은 `docs/SCHOOL_BRANDING_GUIDE.md` 참조. 기존 데이터 학교 ID와 별개이며 `[school] name`으로 설정한다.

현재 직접 연결: `docs/DIRECT_SHEETS_GUIDE.md` 참조. 기존 서비스 계정과 확장 시트 주소만으로 연결하며 게이트웨이는 선택 사항이다. 아래 gateway 설명은 기존 방식의 계약으로 보존한다.

새 기능별 Secrets 설정: `docs/SECRETS_SHEETS_GUIDE.md` 및 `examples/secrets-school-sheets.toml` 참조. 기존 credit 설정도 계속 지원한다.

Start: `streamlit run timetable_app2.py`. 기존 Phase2 통합본에 React 학기 편성 메뉴를 추가했다.
먼저 docs/SEMESTER_TIMETABLE_HANDOFF.md, FEATURE_MATRIX, TEST_RESULTS, KNOWN_LIMITATIONS를 읽는다.
운영 직접 배포/Google 실제 쓰기 검증은 수행하지 않았다. 보호 원본 SHA는 docs/semester-evidence/preservation.json에 있다.

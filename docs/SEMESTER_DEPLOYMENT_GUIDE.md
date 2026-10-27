# 배포 준비 절차 (운영 직접 배포 안 함)

현재 직접 연결: `docs/DIRECT_SHEETS_GUIDE.md` 참조. 기존 서비스 계정과 확장 시트 주소만으로 연결하며 게이트웨이는 선택 사항이다. 아래 gateway 설명은 기존 방식의 계약으로 보존한다.

새 기능별 Secrets 설정: `docs/SECRETS_SHEETS_GUIDE.md` 및 `examples/secrets-school-sheets.toml` 참조. 기존 credit 설정도 계속 지원한다.

1. Full ZIP을 새 개발 checkout에 풀고 CHECKPOINT 및 보호 SHA manifest를 확인한다. 진입점 timetable_app2.py, 기존 requirements/package-lock/build 구조를 유지한다. root app.py 교체 금지.
2. 기존 Secrets를 보존한다. 기존 credit.school_id, gateway_url, gateway_shared_key, expected_spreadsheet_id를 **복제 Google 문서/게이트웨이**로 먼저 설정한다. 신규 영구 로컬 DB 설정은 없다. 복제본 확인 없이 운영 게이트웨이를 사용하지 않는다.
3. 필요 시 기존 계정 ID에 대해 `[semester] scheduler_ids = ["..."]`, `confirm_ids = ["..."]`를 추가한다. 기존 admin 판정은 그대로다. 비밀번호 변경 불필요.
4. python -m pytest -q; cd frontend; npm ci; npm run build; npm run test; npm run lint; cd ..; python scripts/run_e2e.py. CI workflow는 기존 Python·React·Playwright 검사를 재사용하며 새 tests도 자동 수집한다.
5. streamlit run timetable_app2.py. 기초자료 class.size/room.capacity, 실제 전체 학생과 이동반 매핑, 시간강사 근무시간, 기존 이름/ID 매핑을 검토한다. 월~금 지원 범위를 확인한다.
6. 작업본/후보를 작성한다. 확정은 독립검증 후 immutable snapshot만 저장하며 적용과 다르다. 실제 Google 복제본 CAS·재시도·재조회와 교사/학생 개인정보 권한을 검증한 뒤 적용 검토한다.
7. 적용일은 현재/미래 및 학기 범위 안으로 선택한다. 미래 Phase6 변경/요청/legacy overlay가 있으면 차단된다. 검토·조정 없이 우회하지 않는다. 성공하면 구 Sheets를 재업로드할 필요 없이 기존 조회/Phase6이 새 기본본을 읽는다.
8. 운영 배포는 별도 승인/릴리스로 진행한다. 본 결과물은 운영/Google 실제 검증 완료본으로 간주하지 않는다.

새 저장 DDL은 기존 확장 snapshot에 추가되는 테이블이며 구 worksheet/시험감독 schema를 바꾸지 않는다. 확장 DB 초기화/namespace 변경 금지. gateway 문서 LockService+revision CAS 계약은 기존 GOOGLE_SHEETS_MIGRATION.md를 따른다. copy 검증 도구는 scripts/verify_google_copy.py이며 필요한 값이 없으면 UNVERIFIED다.

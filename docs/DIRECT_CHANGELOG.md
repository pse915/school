# 직접 Google Sheets 연결 변경 인계

기준: Secrets 설정 통합본 6628837bf695bd16393e4b265109569fe78492a9. 개발 브랜치 direct-sheets. 운영 사이트/데이터에 쓰지 않았다.

- backend/direct_sheets.py: 기존 gspread 서비스 계정으로 확장 snapshot을 직접 읽기/쓰기. 문서별 프로세스 lock, 2초 읽기 캐시, 쓰기 전 원격 revision 재확인, 단일 batchUpdate, 체크섬, 저장 ID 및 응답 유실 재조회. 확인되지 않은 요청은 문서의 모든 세션에서 추가 쓰기를 차단하며, 이전 요청의 저장 ID/내용이 확인된 경우에만 자동 해제한다. 단순 이전 revision 읽기로 차단을 해제하지 않는다. 전용 탭 외에는 변경하지 않는다. 다중 호스트 CAS는 제공하지 않는다.
- backend/sheet_config.py: 시트 주소만 있을 때 direct 자동 선택, 학교 ID 기본값 안정 생성. 기존 gateway 설정 호환. 다른 기능 문서 분리/기존 학교·문서 불일치 차단 유지.
- backend/credit/install.py: direct/gateway 저장 어댑터 선택. 기존 get_gspread_client 및 인증 재사용.
- backend/semester/install.py: preview 닫기는 저장소 조회와 분리, 통신 실패 중에도 불필요한 DB 접근 없음.
- SemesterEditor.tsx: 닫힌 preview token은 클라이언트에서 숨겨 통신 실패 시 모달이 다시 열리지 않게 한다. 검증/확정은 서버 계약 유지.
- 테스트: 직접 전송 fixture, 저장/재조회/동시 세션/오류/학생 제출/학기 확정·적용; 실제 Streamlit 학기 fixture도 direct 어댑터로 전환. UI stage 요청 완료 전에 ESC를 보내던 테스트는 busy 해제 후 검사하도록 수정.
- 기존 donor 운영 테스트의 sparse Monday 가정을 실제 수업이 많은 날짜 선택으로 수정했다. 운영 엔진 로직은 변경하지 않았다.

진입점/인증 원본/기본 Sheets 저장/시험감독 엔진/React 브리지/requirements/lock 구조를 유지한다. 기존 gateway 데이터가 발견되면 직접 저장소를 빈 상태로 초기화하지 않고 연결을 거부한다. 데이터 이전 기능을 구현했다고 주장하지 않는다.

코드 롤백은 이전 branch/bundle로 가능하지만 이전 코드는 새 직접 저장 탭을 읽지 못한다. 직접 저장본은 보존하고 쓰기를 중지한 뒤 계획된 이전을 검증해야 한다. 무단 게이트웨이 초기화/새 namespace 생성으로 복구하지 않는다.

현재 설정 사용법은 DIRECT_SHEETS_GUIDE.md, 실제 검증은 DIRECT_TEST_RESULTS.md, 전체 변경 목록은 DIRECT_CHANGED_FILES.md를 따른다.

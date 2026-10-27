# 기존 Google Sheets 보존 및 확장 저장소

현재 직접 연결: `docs/DIRECT_SHEETS_GUIDE.md` 참조. 기존 서비스 계정과 확장 시트 주소만으로 연결하며 게이트웨이는 선택 사항이다. 아래 gateway 설명은 기존 방식의 계약으로 보존한다.

새 기능별 Secrets 설정: `docs/SECRETS_SHEETS_GUIDE.md` 및 `examples/secrets-school-sheets.toml` 참조. 기존 credit 설정도 계속 지원한다.

운영 데이터 마이그레이션은 **실행하지 않았다**. 기존 시간표·시험감독 워크시트/저장 규칙은 그대로 유지한다. Phase 5A/5B/6만 1단계 확장 저장소를 사용한다.

## 복제본부터 검증

1. 별도 비공개 테스트 스프레드시트를 만들거나 운영 문서를 복제한다. 기존 시험감독 Apps Script를 수정하지 않는다.
2. 테스트 문서에 바인딩한 별도 Apps Script에 `integrations/enrollment/Code.gs`를 적용한다. ScriptProperties `DIPLE_SHARED_KEY`에 32자 이상 난수를 설정한다.
3. 소유자 실행 웹앱으로 배포하고 그 테스트 URL과 키를 테스트 Streamlit Secrets에 추가한다. 기존 Secrets를 삭제/교체하지 않는다.

```toml
[credit]
school_id = "school-test-001"
academic_year = 2026
semester = 1
gateway_url = "https://script.google.com/macros/s/검증용_배포_ID/exec"
gateway_shared_key = "동일한_32자_이상_난수"
expected_spreadsheet_id = "검증용_복제_스프레드시트_ID"

[operations]
max_periods = 7
allow_cross_subject_substitute = false
# 선택: Phase 5B에서 입력한 교사 ID를 기존 교사명과 연결
[operations.teacher_map]
T001 = "교사명"
# 선택: 학교별 대강 제한
[operations.teacher_rules."교사명"]
substitute_subject_ids = ["과학"]
working_weekdays = ["월", "수", "금"]
max_daily_substitutes = 2
```

`expected_spreadsheet_id`를 설정하면 게이트웨이의 실제 바인딩 문서 ID와 다를 때 초기 쓰기부터 차단한다. 이를 사용하려면 이번 Code.gs 버전이 필요하다. 기존 게이트웨이와의 하위 호환을 위해 설정하지 않은 경우 기존 방식으로 동작한다.

4. 테스트 환경에서 아래 변수를 설정한 뒤 실행한다. 키를 GitHub나 로그에 저장하지 않는다.

```bash
# SRB_TEST_GATEWAY_URL, SRB_TEST_GATEWAY_KEY, SRB_TEST_SPREADSHEET_ID를 안전하게 주입
python scripts/verify_google_copy.py
```

이 실행에서 환경변수가 제공되지 않아 `UNVERIFIED`로 종료되었다. 성공으로 기록하지 않았다.

## 데이터·동시성

- namespace는 학교ID의 해시로 분리되며, 각 테이블에 학교·학년도·학기 범위를 기록한다.
- Phase 6: base_versions, daily_states, change_requests, teacher_absences, academic_events, change_audit, notifications, daily_history, operation_drafts, source_day_versions.
- 불변 기본본과 날짜별 저장본/배포본은 별도다. 신규 변경으로 원본 시간표 시트를 덮어쓰지 않는다.
- 메모리 SQLite를 계산 트랜잭션 형식으로 사용하고 영구 payload는 Google Sheets 확장 영역에 저장한다. Streamlit Cloud 디스크 SQLite를 운영 저장소로 사용하지 않는다.
- Apps Script LockService + revision CAS + 비활성 slot 기록 후 활성 포인터 교체. 읽기만 한 운영 트랜잭션은 원격 쓰기를 하지 않는다.
- 다중 날짜 변경 및 관련 날짜 배포는 한 원격 CAS 커밋으로 저장한다. 충돌 시 전체 변경을 거부한다.
- 기존 시간표/시험감독 별도 저장소까지 단일 분산 커밋으로 묶는 것은 아니다. 실부하·장애·동시운영 검증이 필요하다.

## 복제 및 백업 주의

문서 파일 복제만으로 Apps Script ScriptProperties의 활성 slot/revision/checksum 포인터까지 복제되지는 않는다. 운영 전 **payload와 활성 포인터를 함께 보관·복원**하는 백업 절차를 확정해야 한다. 빈 포인터로 기존 데이터를 덮어쓰는 초기화를 실행하지 말고, 원본 문서/스크립트 설정을 보존한다. 전체 payload 제한과 쿼터는 KNOWN_LIMITATIONS.md 참조.

# 데이터 모델·저장·권한

현재 직접 연결: `docs/DIRECT_SHEETS_GUIDE.md` 참조. 기존 서비스 계정과 확장 시트 주소만으로 연결하며 게이트웨이는 선택 사항이다. 아래 gateway 설명은 기존 방식의 계약으로 보존한다.

기존 `credit` 확장 저장소 및 `GoogleSheetsGatewayRepository`를 그대로 재사용한다. namespace는 기존 학교별 `srb_credit_v1_<school SHA256 prefix>`다. 게이트웨이가 없는 운영 환경에서는 임시 SQLite로 대체하지 않고 기능을 차단한다. SQLite 메모리/파일은 테스트 및 게이트웨이 snapshot transaction 내부 표현에만 사용한다.

| 테이블 | 역할 |
|---|---|
| semester_meta | 확장 schema version 1 |
| semester_terms | 학교·학년도·학기·revision·입력 JSON |
| semester_term_history | revision별 원본 입력, 사용자, 시간 |
| semester_candidates | 입력 hash/revision, compiled project, 결과, parent, actor |
| semester_finals | 불변 프로젝트/배치, checksum, 작성자, 사유, 시각 |
| semester_pointers | 학교·학년도·학기·적용일별 확정 ID와 CAS revision |
| semester_audit | 생성/편집/확정/적용 사용자·시각·변경 상세 |
| semester_receipts | 학교+request_key별 확정 signature와 응답 재조회 |
| semester_job_locks | 학기별 실행 lease, job ID, 만료 |

작업본 JSON은 school, term, periods_by_day, bell_schedules, teachers/classes/rooms/subjects/students, curriculum, weights, legacy_mapping, credit_links를 갖는다.
ID는 이름과 분리한다. curriculum은 credits와 weekly_periods를 별도로 관리하고 split [2,1] 등을 실제 duration 세션으로 변환한다. parts로 교사 분담, teacher_ids 배열로 공동수업을 표현한다. class size와 room capacity는 추측하지 않고 양수를 요구한다. 학급 학생 수가 명시되어야 일반학급과 이동반 사이 실제 학생 충돌 검증을 보장할 수 있다. 실학생 연결 누락은 사전검증에서 검토해야 한다.

신청/분반 확정 JSON snapshot과 버전을 직접 참조한다. import는 명시 class/teacher/room 매핑, 유지/재편성 선택, 명시 replace_ids만 사용한다. 이름만으로 수업 삭제하지 않는다. 원본 신청/분반은 변경하지 않는다.
학기 복사는 마스터 자원·조건과 출처만 복사하며 학기 ID를 새로 만든다. 학교 내 자원 ID는 유지한다. 학생 신청·배정·교육과정·확정은 자동 복사하지 않는다.

## 권한
기존 로그인/관리자 판정 can_manage_ids를 재사용한다. admin 또는 semester.scheduler_ids는 편성; admin 또는 semester.confirm_ids는 확정·적용. confirm 전용 사용자는 비교/확정/출력 접근, 일반교사는 본인 적용 시간표만 조회한다. 학생은 기존 Phase5/Phase6의 본인 배포본 조회 경로를 사용한다. 새 학생 인증/비밀번호 저장을 만들지 않았다.

## 일관성과 실패 경계
작업본은 expected_revision, 후보는 source_revision+hash, 포인터는 expected_pointer CAS를 검사한다. finalize request_key 재시도는 기존 receipt 결과를 반환하며 같은 키 다른 요청은 거부한다. apply 동일 버전 재시도는 현재 포인터를 반환한다.
최종본과 포인터는 별도 단계다. apply의 포인터 변경과 Phase6 base_versions 등록은 **같은 확장 repo transaction**에서 수행되며 실패 시 둘 다 rollback한다. untouched future daily rows만 갱신하고 기존 변경/요청은 삭제하지 않는다. 분산 트랜잭션으로 구 Sheets/시험감독 저장까지 묶었다고 주장하지 않는다.

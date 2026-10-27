# 학기 시간표 편성 인계서

학교 표시명 설정은 `docs/SCHOOL_BRANDING_GUIDE.md` 참조. 기존 데이터 학교 ID와 별개이며 `[school] name`으로 설정한다.

현재 저장 방식의 후속 변경은 `DIRECT_CHANGELOG.md`와 `DIRECT_SHEETS_GUIDE.md`를 따른다. 시트 주소만으로 직접 연결하며 기존 게이트웨이도 선택적으로 보존한다.

## 기준본과 작업 범위
기준: Phase 2 통합본 커밋 `952d3f8a8d7448e3d7602e9c4eb47a55472ecf97`, 개발 브랜치 `semester-timetable`.
동일 이름 중 Library의 2026-10-23 12:57Z `Diple-School-Master-React-Integrated-Full(1).zip`과 일치하는 로컬 Phase 2 ZIP을 선택했다. 이전 Full.zip(Phase 1)을 기준으로 삼지 않았다.
기준 ZIP SHA256: `db1ebffdad27f5f7e7a3a35d0aaede571aa152063a04b1af0adbe075b4b2c7f6`.
필수 Phase1/2 인계서·기능표·제약·Google migration 문서를 확인했다. 운영 사이트/브랜치/데이터에는 쓰지 않았다.

## 모듈과 데이터 흐름
- `backend/semester/model.py`: 입력 전처리, 안정 ID, 실제 시정표 구간, 독립 완전 검증.
- `solver.py`: 기존 diple의 세션/배치 후보/자원 모델을 재사용하는 CP-SAT 확장. 원본 `diple/engine.py`는 보존.
- `service.py`: 작업본 revision, 불변 후보, 확정 checksum, 적용 포인터, 감사·입력 이력, 멱등 확정.
- `jobs.py`: 세션 소유자/입력 hash와 원격 실행 lease, 제한시간/취소/늦은 결과 폐기.
- `install.py`: 기존 ReactPort와 CreditPort를 이용한 10개 화면 및 권한 검사.
- `integration.py`: 기존 시간표 읽기·맞교환에 대한 호환 어댑터. 실제 적용 데이터는 Phase6 published day를 읽는다.
- `io.py`: Excel 열 매핑·미리보기, 출력/인쇄 HTML.
- `frontend/src/components/SemesterEditor.tsx`: Zustand/Radix 드래그·터치·검증 미리보기 및 실행 상태.

작업본 → compile/독립 사전검증 → CP-SAT → 불변 후보 → 서버 편집으로 새 후보 → 독립 전체검증 → 불변 확정 → 적용 포인터+Phase6 base_versions 동시 commit → 일별 배포 조회.
확정만으로 기존 시간표는 바뀌지 않는다. 적용일과 학기 종료일로 조회본을 결정한다.

## 브리지 계약
기존 control 이벤트와 응답 envelope를 유지하며 `sem.*` allowlist만 추가했다.
- `sem.preview`: candidate_id, session_id, start, optional target_id. 서버가 이동/교환 재구성·검증 후 소유자별 preview token 생성.
- `sem.apply_preview`: token. 서버의 pending 변경만 사용해 새 후보 생성. 이전 revision/학기/소유자 거부.
- `sem.close_preview`: 임시안 폐기.
- `sem.poll`: 실행 상태/후보 ID 목록. 입력 revision/hash 변경 시 결과 저장 거부.
- `sem.cancel_job`: 담당자 권한, 실행 취소 및 lease 해제.
다른 CRUD·확정·적용·Excel은 기존 control ID(semester_*), Python 서비스에서 처리한다. 학생 roster는 편집 노드로 전송하지 않는다.

## 운영 연결과 후속 개발
원본 엔진·화면을 교체하지 않았다. 적용본의 실제 시간표는 operations base_versions와 날짜별 published_lessons를 사용한다. 기존 원본 Sheets는 덮어쓰지 않는다.
미래 운영 변경/요청이나 구 Sheets 날짜별 변경이 있으면 새 적용을 차단하고 목록을 표시한다. 자동 병합은 구현하지 않았다.
원격 저장/권한/복제본 검증과 지원 범위는 SEMESTER_KNOWN_LIMITATIONS 및 DEPLOYMENT_GUIDE를 반드시 확인한다.
구현 및 테스트 상태는 각각 FEATURE_MATRIX와 TEST_RESULTS에 기록했다. 검증되지 않은 운영 배포 승인을 의미하지 않는다.

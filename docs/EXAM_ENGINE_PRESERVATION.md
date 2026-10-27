# 기존 시험감독 엔진 보존

`backend/exam_supervision/`의 모든 원본 추적 파일(엔진, 서비스, 저장소, 화면, 스키마 포함)은 최초 srbmaster ZIP 기준으로 바이트가 동일하다. `docs/phase2-evidence/preservation.json`에 SHA-256을 기록했다.

- donor `diple/exam/`는 최종 프로젝트에 포함하지 않으며 import하지 않는다.
- 기존 확정본/버전/설정/저장 주체/워크시트를 초기화하거나 변경하는 마이그레이션을 실행하지 않았다.
- 기존 자동배정·최적화·공정성·수동수정·기록·출력 Python 회귀검사를 유지했다.
- 새 어댑터 `backend/operations/source.py::LegacyReadAdapter.exam`은 기존 서비스의 getConfirmed 및 활성 version_preview만 읽는다. initialize/handoff/repair를 호출하지 않는다.
- 기존 앱의 getConfirmed는 현재 저장된 EDITABLE 자료를 반환하므로 이를 확정본으로 잘못 표시하지 않는다. 활성 확정버전이 있으면 별도 출처로 함께 읽어 충돌을 보수적으로 검사한다.
- `backend/operations/exam_adapter.py`는 기존 서비스 **인스턴스**의 apply_assignments에 저장 전 실제 운영 일정 검사만 덧붙인다. 기존 알고리즘·요청·응답·스키마는 유지한다. 자동계산 결과·수동변경·job 적용은 같은 기존 저장 경로를 통과한다.
- 운영 모듈 설정/기준본이 없으면 기존 시험감독 동작이 그대로 유지된다. 운영 기준이 있는 기간은 기존 수업 및 신규 운영 저장/배포 일정과 감독 배정이 겹치면 저장을 거부한다.
- 모의 시험감독 문서에 대해 어댑터 조회 전후 표와 쓰기 건수가 동일함을 테스트했다.

분리된 저장소 간 동시 커밋을 하나의 원자적 분산 트랜잭션으로 묶지는 않는다. 이 제한과 운영 시 단일 쓰기 경로 조건은 KNOWN_LIMITATIONS.md를 따른다.

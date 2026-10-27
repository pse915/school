# 2단계 개발 인계

기준 브랜치: phase2-term-operations. 1단계 handoff는 당시 기록으로 보존하며, 최신 상태는 이 문서와 TEST_RESULTS/KNOWN_LIMITATIONS를 따른다.

## 경로

- `diple/operations/service.py`: donor 날짜별 운영 엔진. `repo` 주입 및 컨텍스트 관리, 제출 시 expected_versions 비교, 취소수업 보강 상태, reviewing 승인 지원을 추가.
- `backend/operations/source.py`: 기존 timetable/teachers/part_time/근무·복무와 Phase 5B 실제 학생·slots 결합. 기존 시험감독 저장·활성 확정본 읽기.
- `backend/operations/service.py`: 기존 로그인 actor 재사용, source fingerprint, 외부 충돌, 임시저장, 검토, 원격 CAS, 연관 날짜 원자적 배포.
- `backend/operations/install.py`: 메뉴·12개 페이지·학생 본인 배포 조회·미리보기 RPC.
- `backend/operations/exam_adapter.py`: 기존 시험감독 서비스 인스턴스에 apply_assignments 전 검증만 추가. 원본 엔진 파일은 무변경.
- `frontend/src/components/OperationsEditor.tsx`: 기존 React/Radix UI 기반 드래그·터치·미리보기.
- `scripts/run_e2e.py`: 합성 Streamlit 4개를 시작하고 기존 npm run test:e2e 실행.
- `scripts/verify_google_copy.py`: opt-in 실 복제본 검증. 미설정은 exit 2 / UNVERIFIED.

## 브리지 계약

기존 UUID requestId/dataVersion/response envelope를 유지한다.

```json
{"operation":"ops.preview","requestId":"UUID","dataVersion":"현재값","payload":{"day":"2026-10-12","revision":0,"occurrence_id":"조회된 수업ID","to_period":4,"reason":"이동 요청"}}
```

- 선택적 `target_id`: 같은 날짜의 직접 교환. to_date로 날짜간 단일 이동 요청 가능.
- `ops.submit_preview`: payload.token은 서버가 보관한 검증된 미리보기와 계정/학교/학년도/학기가 일치해야 함. 다시 날짜 revision 검사 후 submitted 요청만 생성.
- `ops.close_preview`: 미리보기만 폐기. 메뉴 이동도 서버 미리보기를 폐기.
- 나머지 화면은 기존 control/navigate 및 allowlist, upload/download 계약을 사용.
- student_ids는 서버의 충돌 검사에만 사용하고 편집기 노드에서 제거한다.

## 모델

`daily_states`: (school,year,semester,day), revision, base_id, draft_json, published_revision, published_json.
`change_requests`: actor/role/kind/status/reason/changes/expected/before/after/decision actor/reason/timestamps.
상태: draft 테이블 → submitted → reviewing → approved/rejected → confirmed → 날짜별 published revision.
`operation_drafts`는 저장 버전 및 작성자로 격리한다. `source_day_versions`는 기존 dated source가 이후 바뀐 경우 조정 없는 덮어쓰기를 제한한다.
새 저장소는 1단계 enrollment gateway 문서와 같은 SQL payload 안의 확장 테이블이다. 기존 업무 시트 또는 시험감독 DB를 수정/초기화하지 않는다.

## 다음 확인

실 복제본/실부하/실장애 복구, 별도 저장소 경합, 기존 구버전 앱 동시운영 방지, 실제 학교 교사ID/교실/시정표 매핑을 검증한다. 관련 제한을 삭제하거나 모든 운영 검증이 완료됐다고 표시하지 않는다.

# Phase7 기능별 대응표

| 원본 | 신규 위치 | 현재 상태 | 미구현/주의 |
|---|---|---|---|
| `diple/model.py` | `diple/model.py`, `backend/planning/service.py` | 기초 자료/제약 검증 연결 | UI는 JSON 배열 편집 기반 |
| `diple/engine.py` | `backend/planning/service.py`, `PlanningWorkspace.tsx` | 자동편성 연결, 소형 샘플 검증 | 실 OR-Tools CP-SAT 환경 검증 필요 |
| `diple/editing.py` | `backend/planning/service.py` | 이동·맞교환·후보·초안 확정 연결 | 드래그 & 드롭 미구현 |
| `diple/sectioning.py` | `backend/planning/service.py` | 확정 스냅샷 검증·분반·선택 수업 병합 연결 | 학교 데이터 E2E 검증 필요 |
| `diple/enrollment/` | 순수 서비스 소스 포함, snapshot 연동 | 별도 확정 스냅샷 가져오기 | 학생 로그인·신청 개설·제출 UI, 영구 동시 접수 미구현 |
| `diple/export.py` | 계획 Excel 출력 | 결과 생성 코드 연결 | 학교별 맞춤 양식 미구현 |
| `diple/storage.py` | `backend/planning/repository.py` | 별도 시트 버전 저장 어댑터 | 다중 관리자 트랜잭션 미보장; 운영 E2E 미검증 |
| `diple/operations/` | Master 기존 `backend/services/swaps.py` 등 | 원본 Master 유지 | Phase7 별도 엔진 미이전 |
| `diple/exam/` | Master 기존 `backend/exam_supervision/` | 원본 Master 유지 | Phase7 별도 시험감독 엔진 미이전 |
| `diple/sectioning_ui.py` | React 계획 UI | 기본 JSON 기반 기능 연결 | 원본 Streamlit 폼 동등성 미달 |

코드 존재와 운영 준비를 혼동하지 않는다.

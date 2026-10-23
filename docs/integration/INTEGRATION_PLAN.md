# Master + Phase7 React 수업계획 통합 — 실행 계획

## 원본 및 방침
- 기준 원본: `master-main (2)(5).zip`, `Diple-Timetable-Maker-Phase7-Full(5).zip`
- 실행점: `timetable_app2.py`; 서버/배포 URL 변경 없음
- 기존 Master의 업무 및 시험감독 엔진(`backend/exam_supervision`)을 그대로 유지
- `diple/`은 계획용 순수 도메인 엔진만 통합; Phase7 독립 `app.py`, `diple/exam`, `diple/operations` UI/서비스는 이식하지 않음
- 수업계획 초안은 기존 운영 시트를 자동 업데이트하지 않음

## 단계별 구현 현황
1. 원본 코드 분석 및 보존 경계 설정: 수행
2. React 사이드바 `수업계획` 신규 그룹: TSX 소스 완료, React 배포 빌드는 미완료
3. Master `planning.*` API 브리지와 관리자 권한 검사: 소스 및 단위 테스트 완료
4. Phase7 중·고교 예시, 기초자료 JSON 편집, 제약 검증: 소스 완료
5. Phase7 소형 자동편성/후보/이동/맞교환/초안 확정: 단위 테스트 완료
6. Phase7 확정 수강신청 스냅샷 → 이동반 계산/매핑: 핵심 모듈 테스트 완료; 실제 학생 포털 연동 미구현
7. 별도 `Diple_Planning` 워크시트 버전 저장: 로컬 모의 저장 테스트 완료; 실제 Google Sheets 연결 미검증
8. React 프로덕션 빌드/브라우저 E2E/전체 Master 회귀 테스트: 환경상 미완료

## 남은 필수 작업
- 인터넷/모듈 설치 가능한 환경에서 `npm ci && npm run build`를 실행하여 `frontend/dist` 갱신
- 마스터 앱 전체 Python/React E2E 및 Google Sheets 복제본 저장 검증
- 학생 온라인 수강신청 로그인·접수·기록·동시성·개인정보 보호 구현
- 대규모 학교 시간표 CP-SAT 성능 및 메모리 사용 검증
- 새 계획 결과와 실제 운영 시간표 연결의 마이그레이션 계약과 승인·롤백 절차 별도 구현

## 운영 보호
현재 결과는 **1차 소스 통합본**이지 운영 배포 승인 버전이 아니다. Master 기존 `frontend/dist`를 유지해 기존 화면은 보존하지만, **다시 빌드하기 전에는 신규 React 메뉴가 보이지 않는다.** 실제 학교 운영 시트에서 시험하지 말 것.

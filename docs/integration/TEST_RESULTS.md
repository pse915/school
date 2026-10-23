# 1차 통합 실행 검증 결과

- Python 구문: `python -m compileall -q backend diple timetable_app2.py` 성공
- Phase7 소형 데모: `python -m diple.demo` 중학교 9회차 / 고등학교 6회차, 충돌 오류 0
- Phase7 코어 테스트: `tests/test_core.py`, `tests/test_sectioning.py` → 36 passed
- Master 신규 계획 단위 테스트: `tests/unit/test_planning.py` → 별도 합성 데이터 검사 통과, 운영 시트 접근 없음
- TypeScript TSX 파싱: 글로벌 `typescript.transpileModule`로 주요 변경 파일 구문 진단 0건

## 실패/미검증 (중요)
- Master 전체 pytest: 로컬 개발 환경에 `gspread` 미설치로 실행 중 `ModuleNotFoundError` 발생; 코드 결함으로 단정할 수 없음
- `npm ci`: 네트워크 DNS 조회 실패로 `zustand` 등 NPM 패키지를 설치하지 못함
- `npm run build`: Vite/Vitest 타입 파일 부재로 실패. `frontend/dist/`는 **기존 Master 빌드 그대로**임
- Playwright 통합 E2E: npm 의존성·실행 앱 부족으로 미실행
- 실제 Google Sheets 저장: 실제 서비스 계정/테스트 시트 연결로 검증하지 못함
- Phase7 OR-Tools CP-SAT: `ortools` 패키지 미설치로 실 엔진 실행 미검증, 소형 백트래킹 사용
- 로그인 `pse915` 실운영 인증: 수행하지 않음(비밀번호·운영 환경 불필요 노출 방지)

운영 사이트는 수정·접속·배포하지 않았다. 전 항목 검증 통과로 보고하면 안 된다.

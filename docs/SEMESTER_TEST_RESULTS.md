# 실제 테스트 결과

실행일 2026-10-26 UTC. Python 3.12 / Streamlit 1.56 / OR-Tools 9.15, Node/npm은 기존 lock 사용. 실행 로그·JUnit·benchmark 원본은 docs/semester-evidence/에 포함한다.

| 명령 | 결과 | 상태 |
|---|---|---|
| python -m pytest -q --junitxml=… | 327 수집, 326 통과, 1 skip, 실패/오류 0, 27.935초 | 완료 |
| frontend: npm ci | lock 기반 설치 exit 0 | 완료 |
| npm run build | dist 갱신 exit 0 | 완료 |
| npm run test | 5 files / 14 tests 통과 | 완료 |
| npm run lint | exit 0 | 완료 |
| python scripts/run_e2e.py | 실제 Streamlit 5서버 / 25 통과, 2.5분 | 완료 |
| python scripts/verify_google_copy.py | clone URL/key/ID 미제공, exit 2 UNVERIFIED | 미검증 |

기존 Python 테스트와 신규 22개를 같은 전체 실행에서 확인했다. 1개 skip은 기존 donor 테스트의 해당 날짜 수업이 3개 미만인 fixture 조건이다. 신규 연쇄교환 검증은 별도 통과했다. pandas 등의 기존 FutureWarning은 로그에 보존했다.
신규 테스트: 학교/학기 격리·복사, 입력 CAS/이력, Excel, 공동/분담교사와 2+1, 실학생·교실·학급·교사 충돌, 학년별 실제 시정표, 강사 제약, 불가능/UNKNOWN/취소, 오래된 결과/lease, 부분 고정·변경최소화, 수동 편집/연쇄·부모후보, 확정 멱등, apply 재조회/expiry/rollback/실패 원자성, 미래운영차단, Phase5B snapshot, 권한, stale Phase6 base, 미지정 정원 거부.
기존 시험감독 엔진·규칙·편집·저장·출력과 Phase5/6 회귀도 기존 suite에 포함된다. 운영 pse915 실제 비밀번호·원격 감독 확정본·Google 쓰기는 검증하지 않았다.

## 합성 규모 사례
| 학급 | 교사 | 학생 | 수업회차 | 탐색 제한 | 실제 wall | 상태 | 배치/오류 |
|---|---|---|---|---|---|---|---|
| 6 | 12 | 150 | 150 | 10초 | 11.214초 | FEASIBLE | 150 / 0 |
| 18 | 36 | 450 | 450 | 10초 | 13.470초 | FEASIBLE | 450 / 0 |

실행: python scripts/benchmark_semester.py. wall에는 모델 생성/독립 검증 등이 포함된다. 두 결과는 실행 가능해이며 최적해 보증이 아니다. 합성 입력 구조에 대한 관측값으로 실제 학교·다른 제약의 성능 보증이 아니다.

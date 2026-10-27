# 직접 시트 연결 검증

2026-10-26 실행. 실제 Google 인증정보가 없어 remote Google 저장은 미검증. 아래 직접 API 테스트는 Google Sheets 전송 fixture를 이용하며 실 Google 성공으로 보고하지 않는다.

| 검사 | 결과 | 상태 |
|---|---|---|
| 전체 Python | 340 수집, 340 통과, skip/실패/오류 0; 95.222초 | 완료 |
| 신규 직접 저장/통합 | 9개 포함 통과 | 완료 |
| React unit | 5 files, 14 tests 통과 | 완료 |
| React build / lint | 둘 다 exit 0 | 완료 |
| 원본 보호 파일 | 23개 byte 동일 | 완료 |
| 알려진 다중 worker 차단 | I/O 전 거부 확인 | 완료 |
| 실제 Google 복제본 | 인증정보 미제공 | 미검증 |

직접 테스트: 주소 하나로 학교ID 기본 생성, schema 초기화·불변 재조회·rollback, 24개 동시 세션 작업 직렬화, 외부 revision 변경 차단, 응답 유실 후 저장 ID 재조회, 불확실한 저장의 재전송 제한, 손상/기존 게이트웨이 데이터 초기화 금지, 학생 임시저장/최종제출/중복요청, 학기 확정·적용·Phase6 기본본 재조회, 저장소 offline 상태에서 preview 닫기.

초기 Python 전체 실행에서 기존 운영 fixture가 월요일의 수업 수/교사를 가정해 실패했다. 실제 수업이 많은 날짜를 선택하도록 fixture를 수정한 뒤 전체 회귀 통과. 초기 모바일 E2E에서 preview 응답 완료 전에 ESC를 보내는 경로가 실패했다. 준비 완료 후 검사하도록 테스트를 수정하고, 닫기 자체도 저장소 조회에서 분리·로컬 token 숨김으로 보완했다. 초기 실패 로그도 보존한다.

전체 Streamlit Playwright 25/25 통과(6.0분). 마지막 문서별 응답유실 차단 보완 후 직접 어댑터의 학기 편성 E2E 2개를 재실행해 2/2 통과(1.3분)했다. 전체 25개 증거는 playwright-full.log, 마지막 2개 증거는 playwright-related.log와 browser-related-results.json이다. 마지막 재실행 JSON이 전체 25개 JSON을 대체했다고 주장하지 않는다. 실제 진입점은 로그인 렌더, 전체 로그인 후 흐름은 동일 application/bridge와 직접 어댑터를 사용하는 합성 fixture다. 실 서비스 계정/운영 계정/물리 모바일 검증이 아니다.

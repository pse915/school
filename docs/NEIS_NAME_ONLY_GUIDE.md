# 나이스 API 키 + 학교명으로 자동 연결

## 권장 Secrets
기존 Google 시트·서비스 계정·관리자 설정은 유지하세요. `[school]`이 이미 있으면 그 안을 수정하고 중복 섹션을 만들지 않습니다.

```toml
[school]
name = "우리학교의 정확한 학교명"
neis_api_key = "기존 나이스 API 키"
```

교육청코드·학교코드·교육청명은 입력하지 않습니다. 예전에 넣은 neis_office_code/neis_school_code/neis_office_name은 사용하지 않으므로 삭제해도 됩니다. 새 코드에서는 남아 있어도 조회에 영향을 주지 않습니다.

기존 최상위 키를 유지해도 됩니다.

```toml
NEIS_API_KEY = "기존 나이스 API 키"

[school]
name = "우리학교의 정확한 학교명"
```

최상위 키는 TOML의 첫 번째 `[섹션]`보다 위에 있어야 합니다. `[school]` 아래에 적은 `NEIS_API_KEY`는 최상위가 아니라 school.NEIS_API_KEY입니다. 수정본은 이 위치도 지원합니다. 혼동을 피하려면 첫 번째 권장 형식처럼 이름과 키를 함께 넣으세요.

## 키 인식 경로
우선순위는 school.neis_api_key → school.NEIS_API_KEY → 최상위 NEIS_API_KEY → neis 섹션의 api_key·NEIS_API_KEY·neis_api_key → school_sheets / api_keys / api 섹션의 NEIS_API_KEY·neis_api_key 순서입니다. 다른 서비스의 일반 api_key는 나이스로 전송하지 않습니다. Google 서비스 계정의 private_key를 나이스 키로 사용하지 않습니다. 키가 중복되어 있으면 유효한 키 하나만 남기는 편이 좋습니다.
실제 키를 GitHub나 질문/스크린샷에 공개하지 마세요. 화면 오류에는 설정한 나이스 키가 노출되지 않도록 마스킹합니다.

## 동작
학교기본정보 API의 SCHUL_NM으로 전국 검색 → 공백을 제외한 정확한 학교명 매칭 → 응답의 교육청/학교코드 자동 획득 → 기존 학사일정 API 호출 순서입니다. 17개 교육청을 순차 입력/조회할 필요가 없습니다. 학교정보 결과는 기존 캐시 계약을 따릅니다. 학교명 미설정 상태에서는 포괄적인 '학교' 검색을 하지 않습니다.
같은 이름의 학교가 여러 곳이면 첫 학교를 임의 선택하지 않습니다. 그 경우에만 코드 대신 주소 일부를 추가하세요.

```toml
[school]
name = "우리학교의 정확한 학교명"
neis_api_key = "기존 나이스 API 키"
address = "시·군·구 또는 도로명주소 일부"
```

Secrets 저장과 수정 코드 업로드 후 앱을 재시작하세요. 이미 앱이 실행 중이면 예전 세션/캐시가 유지될 수 있습니다.

## 검증 범위
기존 계정·Sheets 저장·시험감독·편성 엔진은 유지합니다. 실제 키가 제공되지 않아 실 NEIS 호출은 미검증이며, 이름으로 코드 자동 조회와 학사일정 전달은 모의 API 및 실제 Streamlit 브리지 테스트로 검증합니다.
API 명세 참고: https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN17020190531110010104913&infSeq=2
학교기본정보의 교육청/학교코드는 선택 검색 조건이며, 학사일정 조회에 필요한 코드는 검색 응답에서 가져옵니다.

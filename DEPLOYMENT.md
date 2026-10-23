# 배포 및 복구

## 현재 상태

별도 로컬 브랜치 `react-migration`에서 개발했습니다. 원격 main과 운영 앱 `https://srbmstimetable.streamlit.app/`은 수정하지 않았습니다. 해당 URL의 로그인 화면 표시만 확인했습니다. 운영 앱의 Secrets에 접근하지 않았으며, 실제 시트 읽기·쓰기 검증을 이 앱에서 수행하지 않았습니다.

전체 동등성 게이트가 미완료이므로 지금 기존 배포의 main을 교체하지 마세요.

## 유지되는 항목

- 기존 GitHub 저장소와 Streamlit Community Cloud
- 진입점 `timetable_app2.py`
- Secrets: `gcp_service_account`, `NEIS_API_KEY`, `GEMINI_API_KEY`, 선택값 `GEMINI_MODEL`
- 기존 서비스 계정과 시트 공유 권한
- 기존 2개 스프레드시트 ID 및 워크시트·열 이름
- 기존 사용자 ID, 역할 문자열, 허용탭 저장 형식

API 키를 프론트엔드나 GitHub에 저장하지 마세요. 기존 키 재발급이나 GCP 프로젝트 신설이 필요하지 않습니다.

## 테스트 앱 준비

1. 기존 두 스프레드시트를 복제한 테스트 자료에 기존 서비스 계정의 접근을 허용합니다. 빈 시트를 추측해서 만드는 기능은 새 앱에서 사용하지 않습니다. 원본의 모든 워크시트와 헤더를 복제하세요.
2. `react-migration` 브랜치로 별도 Community Cloud 테스트 앱을 만듭니다. Python 3.12를 선택하고 진입점은 `timetable_app2.py`로 설정합니다.
3. 기존 인증 Secrets를 테스트 앱에 설정합니다. 인증키는 그대로 유지합니다. 다음 추가 항목은 테스트 앱의 대상 시트와 쓰기 여부만 지정합니다.

```toml
[migration]
allow_writes = false
timetable_sheet_id = "복제한 시간표 스프레드시트 ID"
work_sheet_id = "복제한 업무 스프레드시트 ID"
```

4. 읽기 동작과 사용자별 권한을 확인한 뒤 **복제 시트에만** `allow_writes = true`로 설정합니다.
5. `backend/schemas/source_inventory.json`에 기록된 UI 경로마다 원본과 새 앱을 같은 복제 자료로 실행하고 결과·추천순서·시트 값·파일을 대조합니다. 미검증 항목을 전부 해소합니다.
6. NEIS/Gemini의 실제 응답, Cloud에서 50MB 파일 업로드와 다운로드, 동시 사용자 수정, 부분 저장 실패를 확인합니다.

## 배포 파일

`requirements.txt`의 직접 의존성을 고정했습니다. 전이 의존성은 완전 잠금하지 않았으며 Cloud 실행 결과가 아직 없습니다. `frontend/package-lock.json`으로 Node 의존성을 고정했습니다. 소스 변경 후 `npm ci && npm run build`를 수행하고 **dist를 함께 커밋**하세요. CI가 소스와 커밋된 빌드의 차이를 검사합니다. Cloud에서 Node 서버를 열지 않습니다.

기존 `.devcontainer`의 CORS/XSRF 비활성 옵션은 제거했습니다. 기본 보안 설정을 사용합니다.

파일 감시 기능은 끕니다. Cloud의 Git 기반 재배포는 그대로 사용하며 로컬 코드/번들 수정 후에는 Streamlit 프로세스를 재시작합니다. 최종 브라우저 테스트는 파일 감시 없는 서버에서 실행했습니다.

## 운영 반영 조건

검증 완료 후에만 변경 브랜치를 기존 배포 브랜치에 병합합니다. 운영 앱의 인증 Secrets는 그대로 두고, 운영 시트 ID는 원본 기본값을 사용합니다. 쓰기 활성화가 필요하면 다음 설정을 추가합니다.

```toml
[migration]
allow_writes = true
```

마지막 복제 시트 검증과 데이터 백업을 마친 뒤 운영 반영하세요. 기능 게이트가 미완료인 현재 산출물은 읽기 전용 평가에 사용합니다.

## 복구

- 운영 반영 전에 기존 main 커밋 `c00647f2f49c09ff03469b83f8f4c0e6baf08d0d`와 앱 Secrets를 보존합니다.
- 배포 실패 시 GitHub에서 새 변경을 revert하여 기존 커밋의 파일을 복구합니다. Cloud에서 앱을 재시작합니다.
- 대안으로 `legacy/timetable_app2_original.py`를 루트 `timetable_app2.py`로 복사하고 원본 requirements를 기준 커밋에서 복원합니다.
- 코드 롤백은 Sheets 데이터를 과거로 되돌리지 않습니다. 데이터 변경이 있었다면 별도 스프레드시트 백업을 검토합니다. 전체 시트를 무조건 덮어쓰지 마세요.
- 원본에는 이력 생성 버그가 있으므로 코드 롤백 시 이 버그도 복원된다는 점을 유의합니다.
- 네트워크 타임아웃 후에는 저장이 실패했다고 단정하지 마세요. 늦게 완료될 수 있습니다. 최신 시트 값과 작업 이력을 확인한 후 재시도합니다.

## 공식 인터페이스

공식 Custom Components v2의 `component`, `data`, `setStateValue`, `on_request_change`를 사용합니다. 빌드된 ES 모듈과 CSS를 Python에서 로드합니다. 대용량 바이너리 스트리밍을 공식 v2가 보장한다고 가정하지 않으며, 제한된 청크를 JSON 통신으로 보내 ACK와 SHA-256을 확인합니다. 전체 파일을 한 JSON에 넣지 않습니다.

참조: [등록](https://docs.streamlit.io/develop/concepts/custom-components/components-v2/register), [양방향 통신](https://docs.streamlit.io/develop/concepts/custom-components/components-v2/communicate).

# 학교 시간표·업무 앱

이번 시험감독 UI 개선 배포 대상: https://srbmaster.streamlit.app/ (운영 주소 및 대상 저장소는 배포 설정에서 확인)

저장소에는 React UI와 Streamlit을 연결한 진입점, 기존 Streamlit 실행 파일이 함께 있습니다. 운영 앱의 실제 진입점은 Streamlit Cloud 배포 설정을 기준으로 합니다. 이번 정리에서는 실행 코드·빌드·설정·의존성을 변경하지 않았습니다.

## 실행

Python 3.12 권장:

```bash
pip install -r requirements.txt
streamlit run timetable_app2.py
```

루트 `timetable_app2.py`는 React 전환 후보입니다. 기존 운영 앱을 이 진입점으로 전환하기 전에는 복제한 Google Sheets로 기능과 저장 동작을 확인해야 합니다. 기본 읽기 전용이며 실제 Google Sheets/Cloud 기능 동등성 검증은 완료되지 않았습니다.

## 파일 구성

| 위치 | 용도 |
|---|---|
| `timetable_app2.py` | React UI를 연결하는 Streamlit 진입점 |
| `backend/` | 업무 처리, 권한, 시트 연동, UI 연결 |
| `frontend/src/`, `frontend/dist/` | UI 소스와 Cloud 실행에 필요한 빌드 |
| `legacy/timetable_app2_original.py` | 백엔드가 실행 중 읽는 원본 코드. 삭제 금지 |
| `native-optimization/` | 기존 Streamlit 개선 구현과 해당 의존성·테스트 대상 |
| 나머지 루트 Python 실행 파일 | 별도 실행 구현. Cloud 진입점 확인 전 보존 |
| `tests/`, `tools/` | 회귀 검증, 소스 목록 생성, 릴리스 도구 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 배포·Secrets·복구 절차 |
| [MAINTENANCE.md](MAINTENANCE.md) | 유지보수 안내 |

과거 보고서, 캡처, 측정 결과, 패치, 중복 백업은 삭제했습니다. 이전 내용은 Git 이력에서 복원할 수 있습니다. 테스트가 생성하는 캡처와 측정 결과는 Git에서 제외합니다.

## 개발·검증

```bash
pip install -r requirements-dev.txt
python -m pytest
python -m pytest tests/dialog_fix -q
```

프론트엔드는 Node 24 환경에서 실행합니다.

```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

`frontend/dist/`는 Cloud 실행에 필요하므로 소스 수정 시 빌드 결과도 함께 커밋합니다. 브라우저 테스트는 `tests/qa_app.py`를 포트 8502에서 실행한 뒤 `frontend`에서 `npm run test:e2e`로 수행합니다. QA는 모의 시트를 사용합니다.

API 키와 서비스 계정은 Streamlit Secrets에만 설정합니다. 구글 시트 값은 저장소 정리 대상이 아닙니다.

## 시험감독 UI 개선 참고

- [기능 대응표](EXAM_UI_FUNCTION_MATRIX.md) · [수정 내역·제약](EXAM_UI_CHANGELOG.md) · [테스트 결과](EXAM_UI_TEST_RESULTS.md) · [GitHub 적용/복구](EXAM_UI_DEPLOYMENT.md)
- 기존 엔진/저장·권한 코드는 변경하지 않았으며, 빌드·테스트 미검증 범위가 있으므로 복제 시트에서 검증 후 운영 적용하세요.

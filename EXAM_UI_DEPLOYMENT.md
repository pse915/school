# srbmaster.streamlit.app 적용 및 복구 지침

대상: https://github.com/pse915/master, Streamlit Cloud URL `https://srbmaster.streamlit.app/`.

## 1. 백업과 분기

1. 먼저 GitHub의 현재 운영 브랜치/커밋을 **태그 또는 새 백업 브랜치**로 보존한다. 운영 중인 브랜치의 `timetable_app2.py`가 실제 진입점인지 Streamlit 앱 Settings에서 확인한다.
2. 전체 ZIP을 새 로컬 폴더에 압축 해제하고 `srbtimetable2026/` 안 파일을 비교한다. 기존 레포 최신 파일과 상충하면 변경 파일 ZIP만 별도 브랜치에서 적용한다. **사용자 기준 최신 ZIP과 실제 GitHub HEAD가 항상 같다고 가정하지 않는다.**
3. `.streamlit/secrets.toml` 값, Google 서비스 계정, 스프레드시트 및 GAS 원본을 백업한다. ZIP에 새 비밀키를 추가하지 않는다.

## 2. 소스 업데이트

1. 변경 파일 ZIP의 **상대 경로 그대로** 해당 GitHub 저장소 루트에 적용한다. 새 `view_improved.py`와 `ExamNavigation.tsx`도 누락하지 않는다.
2. `timetable_app2.py`와 기존 `backend/exam_supervision/engine.py`, `service.py`, `repository.py`, Google Sheets 계정/권한/Secrets는 **그대로 유지**한다.
3. `frontend/src` 및 `frontend/dist` **둘 다 커밋**한다. 기존 `dist`는 테스트된 임시 패치본이며, 다음의 공식 빌드를 통과하면 새 빌드로 교체하는 것이 권장된다.
4. Node 24.15+ 환경에서 `cd frontend && npm ci && npm run typecheck && npm run lint && npm run test && npm run build`를 순서대로 실행한다. 소스 수정으로 새 빌드가 깨지면 배포하지 않고 수정한다. `npm run test:e2e`는 테스트 서버/모의 자격증명이 준비됐을 때 수행한다.
5. Python 의존성 설치 후 `python -m pytest tests/exam_supervision -q` 및 `python -m pytest -q`를 실행한다. Streamlit 테스트 등 일부 실환경 요구 테스트는 해당 패키지가 설치되어야 한다.

## 3. Streamlit Community Cloud

1. 기존 앱 [srbmaster.streamlit.app](https://srbmaster.streamlit.app/)의 **Deploy source repository/path는 변경하지 않는다.** `https://github.com/pse915/master`, main file `timetable_app2.py`가 실제 현재 설정인지는 앱 대시보드에서 확인한다.
2. GitHub 운영 브랜치에 검증된 변경을 push하면 Streamlit Cloud가 코드를 다시 로드한다. 필요하면 앱 대시보드에서 **Reboot app** 또는 **Clear cache/Rerun**(해당 제공 항목)을 사용한다.
3. 관리자 `pse915` 계정의 비밀번호를 본 자료에 넣거나 새로운 우회 로그인을 만들지 않는다. 기존 권한 관리와 비밀값을 계속 사용한다.
4. 로그인 후 먼저 기존 시간표/결보강/맞교환 화면이 정상인지 **조회만 확인**한다. 시험감독에는 `준비 현황 → ① 시험일정 → ② 교사 조건 → ③ 배정 → ④ 공정성 → ⑤ 저장·인쇄` 메뉴가 표시되는지 확인한다.
5. **운영 시트에 시험 데이터를 입력하지 않는다.** 변경/저장/전환 테스트가 필요하면 복제한 Sheets 및 독립된 인증/설정에서 수행하고, 운영 시트는 전환하지 않는다.
6. 배포 검증을 마치기 전까지 원래 GAS 앱의 저장 주체 설정을 임의 변경하거나 확인되지 않은 확정·잠금 기능을 활성화하지 않는다.

## 4. 문제가 생기면

- GitHub에 남겨 둔 이전 안정 커밋/태그로 되돌린 뒤 Streamlit 앱 재부팅으로 화면을 복구한다.
- Secrets/시트 데이터는 변경하지 않았으므로 롤백 과정에서 기존 시트를 재생성하거나 삭제하지 않는다.
- 문제 증거: Cloud 로그, 브라우저 콘솔 오류, `dataVersion`/저장 충돌 코드, 이전 저장 결과의 불확실 상태(uncertain) 및 변경 이력을 기록한다. 응답 유실이 의심되면 **자동 재시도 저장 금지**, 최신 읽기와 이력 확인 후 판단한다.

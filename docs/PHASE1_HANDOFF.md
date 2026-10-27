# Diple School Master — 1단계 인계서

작성일: 2026-10-23 (한국). **로컬 통합·검증본. 운영 배포 및 실 Google Sheets 복제본 검증 미완료.**

## 1. 기준과 보존

- 기준: 첨부 `master-main (2)(7).zip` (ZIP 주석 원본 커밋 `3f2bbc4e2f3c74fae4c32f9db96c2d10592f708e`). 이 주석은 원격 GitHub에서 재검증하지 않았음.
- 이식: 첨부 `Diple-Timetable-Maker-Phase7-Full(7).zip`의 Phase 5A/5B.
- 진입점 **`timetable_app2.py` 그대로**. 루트 `app.py` 그대로.
- 관리자 계정/로그인/권한, Secrets 기존 키, 기존 시간표·교환, `backend/exam_supervision/` 전체와 기존 Sheets 저장 계약은 교체하지 않음.
- `diple/exam/`, Phase 6 operations, Phase 7 시험감독 저장소는 포함하거나 연결하지 않음.
- 운영 사이트, 원격 브랜치, 실데이터에 접근·쓰기·배포하지 않았음.
- 원본 파일 보존 SHA-256: `PHASE1_PRESERVATION.json` 참조.

## 2. 신규 모듈

| 경로 | 역할 |
| --- | --- |
| `backend/credit/install.py` | 기존 관리자 권한 재사용, 메뉴 등록, 학생 포털, 학교 범위, 학생별 시간표 |
| `backend/credit/adapter.py` | 추가 입력 종류를 기존 ReactPort v2 노드로 직렬화 |
| `backend/credit/enrollment_view.py` | Phase 5A 화면. `st` 이름은 실제 Streamlit이 아닌 세션별 CreditPort 객체 |
| `backend/credit/sectioning_view.py` | 분반 생성·수동 이동·버전·출력 화면 |
| `backend/credit/planning.py` | 실제 요일·교시/학생·교사·교실 검증 후 확정 |
| `diple/enrollment/service.py` | 그룹/학점 검증, 신청·수정·임시저장·학생 인증·확정·감사로그 |
| `diple/enrollment/google_gateway.py` | Google Sheets HMAC + revision CAS 영구 저장 어댑터 |
| `diple/enrollment/repository.py` | SQL 스키마, 로컬 테스트 저장소. 운영 기본값으로 사용하지 않음 |
| `diple/enrollment/integration.py` | 확정 신청 정규화/Excel/CSV/JSON |
| `diple/sectioning.py` | CP-SAT/제한적 fallback, 자동 분반·정원·누락 검증·버전 |
| `diple/resources.py` | 실제 요일·교시 충돌 검사 |
| `diple/sectioning_export.py` | 분반/학생배정/실제 시간표 Excel |
| `diple/model.py`, `engine.py`, `samples.py` | 이식 로직의 데이터 검증·기존 donor 호환 테스트. srbmaster 시간표 엔진 대체 아님 |
| `integrations/enrollment/Code.gs` | 확장 저장소 전용 게이트웨이. 기존 시험감독 Apps Script와 별개 |

뷰 모듈은 각 Application마다 새 ModuleType namespace에서 실행된다. 전역 st 교체나 세션 간 공유 화면 객체를 만들지 않는다. 실제 Streamlit widget/iframe를 추가하지 않고 기존 `frontend/src/components/NodeRenderer.tsx`가 모든 화면을 렌더링한다.

## 3. API 계약

신규 외부 operation을 만들지 않았다. 기존 허용목록 기반 `control`, `navigate`, 업로드/다운로드 요청 계약을 재사용한다.

```json
{"operation":"navigate","requestId":"UUID","dataVersion":"현재값","payload":{"tab":"고교학점제"}}
```

```json
{"operation":"control","requestId":"UUID","dataVersion":"현재값","payload":{"control":"credit_page","values":{"credit_page":3}}}
```

- 페이지 인덱스 0..5: 수강신청 관리 / 학생명렬·선택과목 / 신청 현황 / 자동 이동반 편성 / 학생별 시간표 / 편성 확정·출력.
- 학생 진입: 미로그인 화면의 `credit_portal_open`, 복귀 `credit_portal_close`.
- 학생 로그인은 기존 교직원 logged_in을 만들지 않음. 학생은 기존 관리 메뉴에 접근할 수 없음.
- 기존 render registry에 존재하는 컨트롤만 실행. 임의 student_id/role 값을 요청에 삽입할 수 없음.
- 신규 React 노드: `number_input`, `time_input`, `multiselect`. 서버 디코더가 범위/정수/목록 인덱스를 검증.
- 브리지 응답 재사용 소유자에 학생 세션 토큰의 SHA-256을 추가하여 학생 세션 사이의 응답 재사용을 차단.

서버 호출 예:

```python
svc = get_service(app)
# 관리자용 opaque 토큰은 서버 객체에만 존재. 기존 can_manage_ids와 세션을 매번 검증.
campaign_id = svc.create_campaign(svc.admin_token, school_id, campaign_data)
snapshot = svc.finalize(svc.admin_token, school_id, campaign_id)
plan = generate_plan(snapshot)
# 각 section의 teacher_id, room_id, slots를 지정한 뒤:
saved = save_confirmed(svc, svc.admin_token, school_id, snapshot, plan)
```

학생 신청은 `save_draft` / `submit(token, school, campaign, choices, request_key, expected_version)`을 사용한다. 동일 요청키의 재시도는 제출 중복을 방지한다.

## 4. 데이터 모델·권한

- 학교/학년도/학기: students 및 campaigns의 scope 열. campaign→group→offering, 학생별 draft/current_submission/submission 이력.
- 학생 최초 명렬 등록 시 1회 활성화 코드 발급, 활성화 후 Argon2id 비밀번호 해시. DB에 비밀번호 원문 미저장.
- 로그인 토큰은 DB에 SHA-256으로 저장하며 만료 및 학생 재학/신청 자격 검증. 관리자 비밀번호·계정은 새로 만들지 않음.
- 확정 신청: snapshots.snapshot_json, 불변 version. 누락 신청은 관리자 명시 확인 필요.
- 분반: sectioning_plans에 source_snapshot_id/version, 학교/회차 범위, sections, assignments, version, actor, reason.
- section 필드: section_id, offering_id, course_id, group_id, capacity, units, lane, offset. 확정 시 teacher_id / room_id / slots 추가.
- `slots`: `['월1','월2','수1']`처럼 실제 요일·교시. 3시간을 2+1로 나눌 수 있음.
- `resources_confirmed=false`: 편성 작업 버전. `true`: 신청 누락/정원/가상 구획과 실제 학생·교사·교실 충돌 검사 통과 버전.
- 수동 이동 및 자원 수정은 확정 표시를 해제한다. 최종 저장·Excel 출력에서도 확정본의 자원 충돌을 재검증한다.
- 학생 화면은 인증된 본인 신청과 본인 확정 시간표만 반환. 전체 명렬/타학생 시간표/활성화 코드 출력은 관리자 전용.

## 5. 영구 저장 설정

`PHASE1_STORAGE.md`의 **복제본 검증** 절차부터 진행한다. 기존 Secrets를 삭제하거나 덮어쓰지 않는다.

별도 서명 게이트웨이가 필요한 이유: gspread의 조회→비교→쓰기만으로는 여러 Streamlit worker 사이의 원자적 compare-and-swap을 보장할 수 없기 때문. 제공된 Apps Script는 LockService 아래 revision을 확인하고 비활성 시트에 기록한 뒤 ScriptProperties 포인터로 커밋한다. 기존 시간표/시험감독의 저장 주체는 변경하지 않는다.

임시 SQLite 파일을 운영 저장소로 사용하지 않는다. 원격 저장 시 SQLite는 요청 중 메모리 안의 SQL 작업 형식일 뿐이며 영구 payload는 Sheets에 저장한다. 게이트웨이 미설정 시 새 기능은 안내만 보이고 쓰기 불가. 기존 기능은 계속 사용 가능.

## 6. 구현·검증 상태

완료:

- 기존 React 메뉴에 고교학점제 그룹 및 6개 화면 연결.
- 회차 생성, 학년도/학기/학년, 그룹·선택수·학점, 기간, 게시/마감, 명렬 Excel/CSV 미리보기·일괄 검증·병합.
- 학생 활성화/로그인, 신청 선택·학점 검증, 임시저장·제출·기간 내 재제출·결과 조회.
- 신청 현황/미신청/인원 집계/예외 변경 감사로그/확정 스냅샷 및 출력.
- 확정 신청 직접 자동분반, 3단위 및 2+1 과목 조합, 정원/중복/누락 검사, 수동 이동·버전 저장.
- 교사·교실과 실제 요일·교시 수동 지정 후 충돌 검증·확정, 본인 및 관리자 학생별 시간표, Excel StudentTimetable 시트.
- 실제 실행 테스트와 기존 핵심 파일 SHA 보존 검사.

미완료 또는 검증 범위 밖:

1. **실 Google Sheets 복제본 저장·재조회 미실행**: 복제본 주소와 게이트웨이 배포/서명 키가 제공되지 않음. 서명·직렬화·CAS는 FakeSignedGateway로 검증. 실 Google 검증으로 표시하지 말 것.
2. **실 Chromium PC/태블릿/모바일 시각 QA 미실행**: Playwright 브라우저 다운로드가 손상된 아카이브로 실패. React jsdom 스모크 10건은 실행됨. 기존 반응형 CSS를 재사용했으나 실기기 확인 필요.
3. **운영 배포 미실행**. 관리자 pse915 실계정 로그인은 검증하지 않았으며 기존 합성 관리자/교사 권한을 검사함.
4. 자동분반은 가상 운영구획을 계산함. 실제 요일·교시는 현재 수동 입력. 기존 시간표 수업과의 자동 병합 및 기존 수업/출장/교실 불가시간까지 합친 전교 충돌 검증은 미연결. 새 편성 내부 충돌만 검사한다. 기존 시간표 엔진은 교체하지 않았음.
5. 교사/교실은 현재 ID 텍스트 지정. 기존 교사정보와 교실 마스터 등록 검증·자동 연결은 후속 필요.
6. 학급/과목 범위 입력은 현재 세션에서 지정하고 회차/명렬/개설과목 생성 때 영구 데이터에 반영. 별도 학교 프로필 마스터 편집기는 없음.
7. 학생 시간표 화면은 가장 최근에 확정된 본인 포함 버전을 표시. 학생용 과거 회차별 시간표 선택기는 없음.
8. 게이트웨이는 전체 SQL 스냅샷을 전송하는 소규모 저장 방식. 12MiB base64 제한, Apps Script/Sheets 쿼터, 동시접속 부하·장애복구 검증 필요. 응답 유실 시 확인 없이 재확정하지 말 것.

**학교 공개 운영 전 위 1~5 검증·연결이 필요하다. 이 결과물을 전수 운영 검증 완료본으로 표현하지 않는다.**

## 7. 실제 테스트

- Python: `python -m pytest --junitxml=...` → 최종 로그 `phase1-evidence/python-final.log`.
- 원본 초기: 197 통과/2 실패. 같은 실패가 수정 전 detached worktree에서도 재현됨.
- 시험감독 소스 무변경. 테스트 문서 모형에 title/id/url을 보완하고, load_config의 이미 존재하던 기본 spreadsheetId 기대값을 수정.
- React: build/typecheck, lint, vitest 3 files/10 tests 통과.
- Streamlit 1.56.0 실 진입점 서버의 health 및 HTTP entry 200. 이는 브라우저 렌더링/운영 로그인 검증을 뜻하지 않음.
- Playwright 설치 실패 로그와 원본 실패 로그를 함께 보관.
- 테스트는 합성 자료만 사용. 실학생 개인정보/운영 인증정보 없음.

실행:

```bash
pip install -r requirements-dev.txt
python -m pytest
cd frontend
npm ci
npm run build
npm run lint
npm test
cd ..
streamlit run timetable_app2.py
```

## 8. 개발 브랜치·2단계 시작

로컬 브랜치: `phase1-credit-enrollment`. 원격 push 없음. ZIP의 `docs/phase1-checkpoint.bundle`로 커밋/브랜치를 복원할 수 있다. `CHECKPOINT.txt`의 SHA 확인 후:

```bash
git clone -b phase1-credit-enrollment docs/phase1-checkpoint.bundle restored-phase1
```

2단계 개발 전 저장 복제본과 실브라우저 검증을 먼저 수행하고, 기존 시간표 데이터와 신규 실제 시간표의 결합 검증 계약을 명시하라. 기존 `backend/exam_supervision/`를 유지한다. 이 단계에서 Phase 6 또는 donor 시험감독 엔진 교체를 시작하지 않았다.

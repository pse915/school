# 배포 준비 안내

운영 사이트에 배포하지 않은 검증본이다. 먼저 테스트 Streamlit 배포와 복제 시트에서 검증한다.

1. 전체 ZIP은 새 개발 브랜치/테스트 저장소에 푼다. 변경 ZIP은 **최초 첨부 srbmaster 원본**에 적용하는 추가·수정 파일만 포함한다. 1단계 변경도 모두 포함되어 있다.
2. 진입점은 기존 `timetable_app2.py`. 기존 GitHub→Streamlit 배포 구조와 URL 설정을 유지한다. 루트 app.py를 대체 진입점으로 사용하지 않는다.
3. 기존 관리자 pse915/사용자 시트/Secrets/시험감독 저장 주체는 그대로 둔다.
4. GOOGLE_SHEETS_MIGRATION.md의 테스트 확장 저장소 설정을 추가한다. 미설정 시 새 업무는 안내만 표시하고 임시 SQL 파일에 저장하지 않는다.
5. Python 3.12, requirements-dev.txt와 기존 frontend/package-lock.json을 사용한다.

```bash
pip install -r requirements-dev.txt
python -m pytest -q
cd frontend
npm ci
npm run build
npm run test
npm run lint
npx playwright install --with-deps chromium
cd ..
python scripts/run_e2e.py
streamlit run timetable_app2.py
```

`python scripts/run_e2e.py` 내부에서 실제 `npm run test:e2e`가 실행된다. 기존 GitHub Actions도 같은 합성 Streamlit 연결 검사를 실행하도록 갱신했다.

6. 고교학점제에서 신청·확정·실제 시간표 자원을 검증한다. Phase 5B 교사ID는 기존 교사명과 정확히 매핑해야 한다. 임의로 미등록 교사를 생성하거나 겹친 기본 수업을 누락시키지 않으며 충돌 시 기준 등록을 거부한다.
7. 학기 중 운영에서 학년도·학기·적용 시작일을 확인하고 기존 기본 시간표+확정 이동반을 기준으로 등록한다. 날짜별 변경은 임시저장→제출→검토→승인/반려→확정→배포 순서로 처리한다.
8. 복제본에서 재시작 재조회·동시 관리자·시험감독 충돌·시간강사·학사행사·복구를 확인한다. 실 Sheets 복제본 및 분리 저장소 경합이 아직 미검증이므로 이 절차를 완료하기 전 공개 운영 완료로 취급하지 않는다.
9. 승인된 변경 커밋과 frontend/dist를 함께 배포한다. 시험감독 시트 초기화/저장주체 전환/기존 확정본 덮어쓰기는 하지 않는다.

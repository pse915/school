# 소스 통합본 빌드 및 운영 이전 안내

이 ZIP은 *바로 운영에 적용할 최종본이 아님*. 기존 `frontend/dist`는 보호를 위해 원본 그대로 포함되어 있다. 신규 메뉴를 표시하려면 다음 과정을 **테스트용 브랜치**에서 먼저 수행한다.

```bash
python -m pip install -r requirements-dev.txt
python -m pytest -q
cd frontend
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

- Node.js **24** 권장 (원본 CI workflow의 Node 버전 기준).
- 빌드 후 `frontend/dist/timetable.js`, `frontend/dist/style.css`가 변경되었는지 확인한다.
- 복제 Google Sheets와 합성 사용자로 새 `Diple_Planning` 워크시트의 생성·읽기·저장·충돌·중복·재조회 동작을 확인한다.
- 기존 앱의 `allow_writes` 설정이 거짓이면 신규 계획 저장은 거부된다. 쓰기 권한을 무단 확대하지 않는다.
- 별도 시트 `Diple_Planning`이 없을 때 첫 승인 저장 시 새 워크시트를 생성한다. 프론트에서 별도 확인을 받도록 구현했지만, **관리자 2명 이상 동시 저장 안전성은 보장되지 않는다.**
- 운영 브랜치 변경 전 기존 Master의 모든 테스트와 브라우저 E2E를 통과시켜야 한다.
- 실 학생 개인정보는 저장 보안·접근제어·보존/파기 정책 검증 전에 사용하지 않는다.
- 배포 실패 시 원본 Git 커밋 및 원본 frontend/dist로 코드 롤백한다. Google Sheets 원본 전체를 자동으로 덮어쓰지 않는다.

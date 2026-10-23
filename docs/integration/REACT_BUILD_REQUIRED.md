# 변경된 React 소스의 빌드 필요

새 `frontend/src/planning/PlanningWorkspace.tsx`, `frontend/src/App.tsx`, `frontend/src/types.ts` 와 CSS 소스는 ZIP에 포함되어 있다. 그러나 번들 빌드에 필요한 NPM 패키지를 이 실행 환경에서 다운로드할 수 없어 기존 `frontend/dist`는 갱신하지 못했다. 운영 배포 전 온라인 Node 24 빌드 환경에서 `cd frontend && npm ci && npm run build`를 성공시킨 뒤 생성된 dist를 함께 커밋해야 한다. 이 단계가 없으면 신규 메뉴가 화면에 나타나지 않는다.

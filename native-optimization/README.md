# 기존 Streamlit 개선 구현

`timetable_app2.py`는 Streamlit UI를 사용하는 구현이며, 루트의 React 진입점과 다릅니다. 수업 작업 팝업 종료 시 상태 정리와 전체 rerun, 추천 계산의 미사용 필터 제거가 포함되어 있습니다.

`requirements.txt`는 이 구현의 의존성입니다. `tests/dialog_fix/`가 이 소스를 대상으로 회귀 검증합니다.

복구용 중복 원본, 적용 전 패치와 중복 안내는 삭제했습니다. 이전 파일은 Git 이력에서 확인할 수 있습니다. 운영 적용 전 Cloud의 실제 진입점을 확인하고 복제 시트로 검증하세요.
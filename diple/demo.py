"""Minimal self-check without Streamlit, Google Sheets or OR-Tools.
Usage: python -m diple.demo
"""
from .samples import middle_school, high_school
from .model import validate_placements
from .engine import solve_offline_small


def main():
    for label, create in [('중학교', middle_school), ('고등학교', high_school)]:
        project = create()
        result = solve_offline_small(project)
        errors = validate_placements(project, result['placements']) if result['placements'] else result['errors']
        print(f"{label}: {result['status']} | {len(result['placements'])}회차 | errors={len(errors)}")
        if errors:
            raise SystemExit('\n'.join(errors))
    print('소형 예제 2종 정상 종료 (실학교 규모 CP-SAT 검증과는 별개)')


if __name__ == '__main__':
    main()

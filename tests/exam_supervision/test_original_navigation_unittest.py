"""Checks for source and shipped runtime navigation parity; no external deps."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SOURCE=(ROOT/'frontend/src/components/ExamNavigation.tsx').read_text(encoding='utf-8')
BUNDLE=(ROOT/'frontend/dist/timetable.js').read_text(encoding='utf-8')


def test_original_five_step_navigation_present_in_source_and_bundle():
    names=('시험일정','교사 명단·조건','수업·겸임 일정','자동 배정·직접 수정','공정성 분석')
    for name in names:
        assert name in SOURCE and name in BUNDLE, name
    assert '시험감독 5단계 작업 순서' in SOURCE
    assert '시험감독 5단계 작업 순서' in BUNDLE


def test_each_original_condition_is_reachable():
    fields=('시험일정 설정','교사 명단','감독 역할·강사 제외','배정불가 시간',
            '수업시간표','겸임교사 일정','교사감독규칙','최적화 설정')
    for field in fields:
        assert field in SOURCE and field in BUNDLE


def test_sheets_writer_api_action_names_preserved():
    code=(ROOT/'backend/exam_supervision/view_improved.py').read_text(encoding='utf-8')
    forms=(ROOT/'backend/exam_supervision/original_forms.py').read_text(encoding='utf-8')
    for method in ('saveInstructorFlags','saveUnavailable','saveVisiting','saveTeachingRules','saveSettings'):
        assert method in forms
    assert 'saveRoster' in code
    assert 'saveSchedule' in (ROOT/'backend/exam_supervision/schedule_view.py').read_text(encoding='utf-8')

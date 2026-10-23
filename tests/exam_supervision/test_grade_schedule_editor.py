"""Dependency-free grade matrix regression tests; no production Google Sheets writes."""
import copy

import pandas as pd
import pytest

from backend.bridge.port import ReactPort, Rerender, State
from backend.exam_supervision import engine as E
from backend.exam_supervision.schedule_editor import (
    build_schedule, class_deletion_dependencies, grade_day_defaults,
    matrix_from_schedule, safe_matrix_update,
)
from backend.exam_supervision.schedule_view import render_schedule


@pytest.fixture
def classes():
    return [dict(grade=g, classNo=n, id=f'{g}-{n}')
            for g, numbers in ((1,(1,2,3)),(2,(1,3,6)),(3,(1,))) for n in numbers]


def day(grade, classes, number=1, date='2026-11-23', enabled=True, periods=(1,2), subject='국어'):
    matrix = []
    for period in range(1,6):
        row = {'교시':period}
        row.update({c['id']: ('자습' if period==2 else subject) if period in periods else ''
                    for c in classes if c['grade']==grade})
        matrix.append(row)
    return dict(day=number, enabled=enabled, date=date, periods=list(periods),
                matrix=matrix, times={period:('09:00','09:45') for period in periods})


def test_per_grade_days_are_not_limited_by_total_grade_day_pairs(classes):
    values = {g:dict(enabled=True,days=[day(g,classes,number=n,date=f'2026-11-{22+n}')
                                          for n in range(1,6)]) for g in (1,2,3)}
    result = build_schedule([],classes,values)
    assert len(result['rows']) == len(classes)*2*5
    assert set(result['gradePlan']) == {'1','2','3'}
    assert all(len(v['days'])==5 for v in result['gradePlan'].values())


def test_different_classes_for_same_class_number_and_sparse_numbering(classes):
    values = {g:dict(enabled=True,days=[day(g,classes,subject=str(g)+'학년과목')]) for g in (1,2,3)}
    result = build_schedule([],classes,values)
    by = {(r['classId'],r['period']):r for r in result['rows']}
    assert by['1-1',1]['subject']=='1학년과목'
    assert by['2-1',1]['subject']=='2학년과목'
    assert '2-6' in {r['classId'] for r in result['rows']}
    assert by['3-1',2]['type']=='STUDY'


def test_disabled_grade_and_period_are_excluded_and_plan_kept(classes):
    values = {g:dict(enabled=g==1,days=[day(g,classes,periods=(1,2))]) for g in (1,2,3)}
    values[1]['days'][0]['periods']=[1]
    result = build_schedule([],classes,values)
    assert {r['classId'] for r in result['rows']} == {'1-1','1-2','1-3'}
    assert {r['period'] for r in result['rows']} == {1}
    assert result['gradePlan']['2']['enabled'] is False


def test_blank_cell_excludes_one_class_and_no_blank_period_accepted(classes):
    values = {g:dict(enabled=g==1,days=[day(g,classes)]) for g in (1,2,3)}
    values[1]['days'][0]['matrix'][0]['1-1']=''
    result = build_schedule([],classes,values)
    assert not any(r['classId']=='1-1' and r['period']==1 for r in result['rows'])
    values[1]['days'][0]['matrix'][0].update({'1-2':'','1-3':''})
    with pytest.raises(ValueError,match='운영 학급이 없습니다'):
        build_schedule([],classes,values)


def test_bulk_edit_modifies_only_chosen_period(classes):
    base = day(1,classes)['matrix']
    patched = safe_matrix_update(base,[c for c in classes if c['grade']==1],2,'과학')
    assert all(patched[1][c['id']]=='과학' for c in classes if c['grade']==1)
    assert patched[0] == base[0]
    assert base[1]['1-1']=='자습'


def test_preserves_per_class_start_and_end_times(classes):
    own = [c for c in classes if c['grade']==1]
    old = [dict(day=1,date='2026-11-23',period=1,grade=1,classNo=c['classNo'],
                classId=c['id'],type='EXAM',subject='국어',start=f'09:0{i}',end='09:45')
           for i,c in enumerate(own)]
    values={g:dict(enabled=g==1,days=[day(g,classes,periods=(1,))]) for g in (1,2,3)}
    # The first class's original start time is 09:00, untouched in the UI.
    result=build_schedule(old,classes,values)
    assert {r['classId']:r['start'] for r in result['rows']} == {c['id']:f'09:0{i}' for i,c in enumerate(own)}


def test_removal_of_used_class_reports_schedule_and_homeroom(classes):
    schedule=[dict(classId='2-3')]
    teachers=[dict(homeroom='2-3'),dict(homeroom='1-1')]
    remaining=[c for c in classes if c['id']!='2-3']
    assert class_deletion_dependencies(classes,remaining,schedule,teachers)==(['2-3'],['2-3'])


def test_grade_ui_emits_grades_days_matrix_and_requires_ack(classes):
    existing=[]
    for g in (1,2,3):
        existing.extend(dict(day=1,date='2026-11-23',period=1,grade=g,classNo=c['classNo'],
                             classId=c['id'],type='EXAM',subject='수학',start='',end='')
                        for c in classes if c['grade']==g)
    plan=E.grade_plan(existing,classes)
    m=dict(classes=classes,schedule=existing,gradePlan=plan)
    p=ReactPort(State())
    class S:
        notice=''
        def token_payload(self): return dict(revision=0,dataToken='test')
        def handle(self, action, payload):
            self.saved=(action,payload)
            return dict(ok=True)
    s=S()
    render_schedule(p,s,m,True)
    assert set(f'exam_schedule_grade_{g}_enabled' for g in (1,2,3)) <= set(p.controls)
    assert set(f'exam_schedule_matrix_{g}_1' for g in (1,2,3)) <= set(p.controls)
    assert p.controls['exam_save_schedule']['node']['disabled'] is True
    p.session_state['exam_schedule_save_confirm']=True
    p.reset(event={'control':'exam_save_schedule'})
    with pytest.raises(Rerender): render_schedule(p,s,m,True)
    assert s.saved[0]=='saveSchedule'
    assert len(s.saved[1]['rows'])==len(classes)


def test_ui_readonly_always_disables_save(classes):
    schedule=[dict(day=1,date='2026-11-23',period=1,grade=1,classNo=1,
                   classId='1-1',type='EXAM',subject='국어',start='',end='')]
    plan=E.grade_plan(schedule,classes)
    p=ReactPort(State())
    render_schedule(p, object(), dict(classes=classes,schedule=schedule,gradePlan=plan), False)
    assert p.controls['exam_save_schedule']['node']['disabled'] is True
    assert p.controls['exam_save_classes']['node']['disabled'] is True

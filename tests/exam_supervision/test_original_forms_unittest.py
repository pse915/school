"""Self-contained tests for original-compatible exam controls without live Sheets."""
import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import Mock
from backend.bridge.port import ReactPort, Rerender
from backend.exam_supervision import engine as E
from backend.exam_supervision.original_forms import (
    _aliases, _draft, _person_name, page_roles, page_unavailable,
    page_visiting, page_rules, page_settings, page_teaching_sheet,
)


def fixture():
    teachers = [
        dict(id='t1', name='김교사', subjects=['국어'], homeroom='1-1',
             crossSubjects=[], roleEligibility=dict(MAIN=True, ASSIST=True, STUDY=False)),
        dict(id='t2', name='이교사', subjects=['영어'], homeroom='',
             crossSubjects=[], roleEligibility=dict(MAIN=True, ASSIST=False, STUDY=True)),
    ]
    p=ReactPort()
    m=dict(
        state=dict(revision=3,settings=E.default_state()['settings']),
        ctx=SimpleNamespace(teachers=teachers,by_id={x['id']:x for x in teachers}),
        unavailable=[],
        classes=[dict(id='1-1',grade=1,classNo=1),dict(id='2-1',grade=2,classNo=1)],
        available=dict(visiting=dict(rows=[],errors=[],unknown=[]),
                       rules=dict(rows=[],errors=[],unknown=[]))
    )
    service=SimpleNamespace(handle=Mock(return_value={'ok':True}),
                            token_payload=lambda : {'revision':3, 'dataToken':'test'}, notice='')
    return p,m,service


class OriginalFormsTests(unittest.TestCase):
    def test_aliases_without_json(self):
        self.assertEqual(_aliases([dict(alias='기술 · 가정',canonical='기술가정')]),{'기술·가정':'기술가정'})
        with self.assertRaisesRegex(ValueError,'중복'):
            _aliases([dict(alias='영어',canonical='영어'),dict(alias=' 영어 ',canonical='수학')])
        with self.assertRaisesRegex(ValueError,'모두 입력'):
            _aliases([dict(alias='기술',canonical='')])

    def test_draft_revision_and_no_mutation(self):
        p,m,_=fixture()
        source=[dict(id=1)]
        initial=_draft(p,m,'rules',source)
        initial[0]['id']=99
        self.assertEqual(source[0]['id'],1)
        self.assertEqual(_draft(p,m,'rules',source)[0]['id'],99)
        m['state']['revision']=4
        self.assertEqual(_draft(p,m,'rules',source)[0]['id'],1)

    def test_instructors_are_checkbox_not_id_string(self):
        p,m,_=fixture()
        page_roles(p,None,m,True)
        self.assertIn('exam_original_instructor_t1',p.controls)
        self.assertIn('exam_original_instructor_t2',p.controls)
        self.assertIn('exam_save_instructors',p.controls)
        self.assertNotIn('exam_instructors',p.controls)

    def test_unavailable_add_staged_without_google_write(self):
        p,m,s=fixture()
        p.session_state.update(exam_form_unavailable_teacher='t1',
            exam_form_unavailable_date=date(2026,11,11),exam_form_unavailable_period=2,
            exam_form_unavailable_reason='출장')
        p.reset(event=dict(control='exam_form_unavailable_add'))
        with self.assertRaises(Rerender):page_unavailable(p,s,m,True)
        self.assertEqual(p.session_state['_exam_original_rows_unavailable'],
                         [dict(teacherId='t1',date='2026-11-11',period=2,reason='출장')])
        s.handle.assert_not_called()
        p.reset(event=None)
        page_unavailable(p,s,m,True)
        self.assertIn('exam_save_unavailable',p.controls)

    def test_unavailable_duplicate_is_rejected(self):
        p,m,s=fixture()
        m['unavailable']=[dict(teacherId='t1',date='2026-11-11',period=2,reason='기존')]
        p.session_state.update(exam_form_unavailable_teacher='t1',exam_form_unavailable_date=date(2026,11,11),
                               exam_form_unavailable_period=2,exam_form_unavailable_reason='출장')
        p.reset(event=dict(control='exam_form_unavailable_add'))
        page_unavailable(p,s,m,True)
        self.assertEqual(len(p.session_state['_exam_original_rows_unavailable']),1)
        self.assertTrue(any(n['kind']=='error' and '이미' in n['label'] for n in p.nodes))

    def test_visiting_add_with_weekday_only(self):
        p,m,s=fixture()
        p.session_state.update(exam_form_visiting_teacher='t1',exam_form_visiting_type='타교출강',
                               exam_form_visiting_has_date=False,exam_form_visiting_weekday='월',
                               exam_form_visiting_period=0,exam_form_visiting_location='타교',
                               exam_form_visiting_note='월요일 종일')
        p.reset(event=dict(control='exam_form_visiting_add'))
        with self.assertRaises(Rerender):page_visiting(p,s,m,True)
        self.assertEqual(p.session_state['_exam_original_rows_visiting'][0]['teacherName'],'김교사')
        self.assertEqual(p.session_state['_exam_original_rows_visiting'][0]['period'],'')
        s.handle.assert_not_called()

    def test_include_rule_strict_reason(self):
        p,m,s=fixture()
        p.session_state.update(exam_form_rules_teacher='t1',exam_form_rules_mode='포함',
                               exam_form_rules_start_has_date=True,exam_form_rules_start_date=date(2026,11,11),
                               exam_form_rules_end_has_date=False,exam_form_rules_weekday='',
                               exam_form_rules_period=2,exam_form_rules_class='1-1',
                               exam_form_rules_reason='수업대체 완료')
        p.reset(event=dict(control='exam_form_rules_add'))
        with self.assertRaises(Rerender):page_rules(p,s,m,True)
        self.assertEqual(p.session_state['_exam_original_rows_rules'][0]['startDate'],'2026-11-11')
        self.assertEqual(p.session_state['_exam_original_rows_rules'][0]['classId'],'1-1')

    def test_duplicate_teacher_name_is_not_silently_mapped(self):
        p,m,s=fixture()
        m['ctx'].teachers[1]['name']='김교사'
        with self.assertRaisesRegex(ValueError,'동명이인'):_person_name(m,'t1',unique=True)

    def test_settings_controls_original_labels(self):
        p,m,s=fixture()
        page_settings(p,s,m,False)
        def flatten(items):
            for n in items:
                yield n
                yield from flatten(n.get('children', []))
        all_nodes=list(flatten(p.nodes))
        labels={n['label'] for n in all_nodes if n['kind'] in ('selectbox','text_input','checkbox')}
        self.assertIn('담당 학년 우대 (%)',labels)
        self.assertIn('최적화 우선순위',labels)
        self.assertIn('시간표 미등록 교사의 부족 교시 투입', {n['label'] for n in all_nodes if n['kind']=='subheader'})
        self.assertIn('exam_setting_fallback_teacher_t1',p.controls)
        self.assertTrue(p.controls['exam_save_settings_form']['node']['disabled'])


    def test_roles_save_uses_existing_writer_action(self):
        p,m,s=fixture()
        p.session_state.update(exam_original_instructor_t1=True,exam_original_instructor_t2=False)
        p.reset(event=dict(control='exam_save_instructors'))
        with self.assertRaises(Rerender):page_roles(p,s,m,True)
        action,payload=s.handle.call_args.args
        self.assertEqual(action,'saveInstructorFlags')
        self.assertEqual(payload['instructorIds'],['t1'])
        self.assertEqual(payload['revision'],3)

    def test_unavailable_save_uses_existing_writer_action(self):
        p,m,s=fixture()
        rows=[dict(teacherId='t1',date='2026-11-11',period=1,reason='출장')]
        m['unavailable']=rows
        p.reset(event=dict(control='exam_save_unavailable'))
        with self.assertRaises(Rerender):page_unavailable(p,s,m,True)
        action,payload=s.handle.call_args.args
        self.assertEqual((action,payload['rows']),('saveUnavailable',rows))
        self.assertEqual(payload['dataToken'],'test')

    def test_visiting_and_rules_use_existing_actions(self):
        p,m,s=fixture()
        p.reset(event=dict(control='exam_save_visiting'))
        with self.assertRaises(Rerender):page_visiting(p,s,m,True)
        self.assertEqual(s.handle.call_args.args[0],'saveVisiting')
        s.handle.reset_mock()
        p.reset(event=dict(control='exam_save_rules'))
        with self.assertRaises(Rerender):page_rules(p,s,m,True)
        self.assertEqual(s.handle.call_args.args[0],'saveTeachingRules')

    def test_settings_save_normalizes_percentage_and_preserves_schema(self):
        p,m,s=fixture()
        p.session_state.update(exam_setting_grade_percent='70')
        p.reset(event=dict(control='exam_save_settings_form'))
        with self.assertRaises(Rerender):page_settings(p,s,m,True)
        action,payload=s.handle.call_args.args
        self.assertEqual(action,'saveSettings')
        self.assertEqual(payload['settings']['optimization']['gradeStrength'],0.7)
        self.assertNotIn('instructorIds',payload['settings']['missingFallbackTeacherIds'])

    def test_teaching_status_uses_original_diagnostics(self):
        p,m,s=fixture()
        m['available']['teaching']=dict(enabled=True,source='교사시간표')
        s.repo=SimpleNamespace(tables={'교사시간표':[['교사명','요일','교시','과목','학급','과목군']]})
        report=dict(teachingSource='교사시간표',teachingRows=0,teachingMatched=0,teacherCount=2,
                    visitingRows=0,missingTeachers=['김교사'],unknownTeachers=[],invalidRows=[],slots=[])
        s.handle.return_value=report
        page_teaching_sheet(p,s,m,False)
        s.handle.assert_called_with('availabilityReport')
        self.assertIn('exam_original_teaching_reload',p.controls)
        self.assertIn('exam_save_availability',p.controls)
        self.assertTrue(p.controls['exam_save_availability']['node']['disabled'])


if __name__=='__main__':unittest.main()

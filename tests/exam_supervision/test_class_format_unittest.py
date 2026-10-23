import copy
import unittest
from backend.exam_supervision.models import HEADERS,SH,read_classes,read_schedule,grade_class

class ClassFormatTests(unittest.TestCase):
    def test_numeric_unchanged(self):
        self.assertEqual(grade_class('1','2','1-2'),(1,2))

    def test_combined_class_in_class_column(self):
        self.assertEqual(grade_class('1','1-2','1-2'),(1,2))

    def test_combined_class_without_grade(self):
        self.assertEqual(grade_class('','1-2'),(1,2))

    def test_class_id_only(self):
        self.assertEqual(grade_class('','','1-2'),(1,2))

    def test_conflicting_grade_rejected(self):
        with self.assertRaises(ValueError):grade_class('2','1-2')

    def test_conflicting_class_rejected(self):
        with self.assertRaises(ValueError):grade_class('1','2','1-3')

    def test_invalid_numeric_rejected(self):
        with self.assertRaises(ValueError):grade_class('1','2.5')

    def test_class_reader_does_not_change_sheet(self):
        tables={SH['classes']:[HEADERS[SH['classes']],['1','1-2']]};before=copy.deepcopy(tables)
        self.assertEqual(read_classes(tables),[dict(grade=1,classNo=2,id='1-2')])
        self.assertEqual(tables,before)

    def test_schedule_reader_does_not_change_sheet(self):
        tables={SH['schedule']:[HEADERS[SH['schedule']],[1,'2026-11-12',1,1,'1-2','1-2','EXAM','국어','','']]};before=copy.deepcopy(tables)
        row=read_schedule(tables)[0]
        self.assertEqual((row['grade'],row['classNo'],row['classId']),(1,2,'1-2'))
        self.assertEqual(tables,before)

    def test_period_is_not_interpreted_as_class(self):
        tables={SH['schedule']:[HEADERS[SH['schedule']],[1,'2026-11-12','1-2',1,2,'1-2','EXAM','국어','','']]}
        with self.assertRaisesRegex(ValueError,'2행 교시'):read_schedule(tables)

    def test_date_formatted_class_id_keeps_existing_support(self):
        self.assertEqual(grade_class('1','2','2026-01-02'),(1,2))

if __name__=='__main__':unittest.main()

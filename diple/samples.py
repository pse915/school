"""Synthetic sample datasets (no real school names or student details)."""
from .model import DAYS


def middle_school():
    return {
        'schema_version': 1, 'school': {'id':'demo-middle','name':'예시중학교','level':'중학교','academic_year':2026,'semester':1},
        'periods_by_day': {'월':4,'화':4,'수':4,'목':0,'금':0},
        'teachers': [
            {'id':'T1','name':'국어교사','subject':'국어','blocked':['월1'],'max_weekly':8},
            {'id':'T2','name':'수학교사A','subject':'수학','blocked':[],'max_weekly':8},
            {'id':'T3','name':'수학교사B','subject':'수학','blocked':[],'max_weekly':8},
            {'id':'T4','name':'과학교사','subject':'과학','blocked':['화4'],'max_weekly':8},
        ],
        'classes':[{'id':'C1','name':'1-1','grade':1,'size':26,'blocked':[]}, {'id':'C2','name':'1-3','grade':1,'size':27,'blocked':[]}],
        'rooms':[{'id':'R1','name':'과학실','capacity':32,'blocked':['수4']}],
        'subjects':[{'id':'K','name':'국어','credits':0}, {'id':'M','name':'수학','credits':0}, {'id':'S','name':'과학','credits':0}],
        'students':[],
        'lessons':[
            {'id':'LK1','subject_id':'K','teacher_ids':['T1'],'class_ids':['C1'],'student_ids':[],'room_ids':[], 'weekly_periods':2,'duration':2, 'simultaneous_group':'','fixed_slots':[],'forbidden_slots':[]},
            {'id':'LK2','subject_id':'K','teacher_ids':['T1'],'class_ids':['C2'],'student_ids':[],'room_ids':[], 'weekly_periods':2,'duration':1, 'simultaneous_group':'','fixed_slots':[],'forbidden_slots':[]},
            {'id':'LM1','subject_id':'M','teacher_ids':['T2'],'class_ids':['C1'],'student_ids':[],'room_ids':[], 'weekly_periods':2,'duration':1, 'simultaneous_group':'MATH','fixed_slots':[],'forbidden_slots':[]},
            {'id':'LM2','subject_id':'M','teacher_ids':['T3'],'class_ids':['C2'],'student_ids':[],'room_ids':[], 'weekly_periods':2,'duration':1, 'simultaneous_group':'MATH','fixed_slots':[],'forbidden_slots':[]},
            {'id':'LS1','subject_id':'S','teacher_ids':['T4'],'class_ids':['C1'],'student_ids':[],'room_ids':['R1'], 'weekly_periods':1,'duration':1, 'simultaneous_group':'','fixed_slots':[],'forbidden_slots':[]},
            {'id':'LS2','subject_id':'S','teacher_ids':['T4'],'class_ids':['C2'],'student_ids':[],'room_ids':['R1'], 'weekly_periods':1,'duration':1, 'simultaneous_group':'','fixed_slots':[],'forbidden_slots':[]}
        ],
        'candidates':[], 'published':None, 'audit_logs':[]
    }


def high_school():
    return {
        'schema_version':1,'school':{'id':'demo-high','name':'예시고등학교','level':'고등학교','academic_year':2026,'semester':2},
        'periods_by_day':{'월':4,'화':4,'수':4,'목':0,'금':0},
        'teachers':[{'id':'HK','name':'국어교사','subject':'국어','blocked':[], 'max_weekly':8},
                    {'id':'HP','name':'물리교사','subject':'물리','blocked':[], 'max_weekly':8},
                    {'id':'HC','name':'화학교사','subject':'화학','blocked':[], 'max_weekly':8}],
        'classes':[{'id':'H1','name':'2-1','grade':2,'size':4,'blocked':[]}],
        'rooms':[{'id':'PHYS','name':'과학실1','capacity':4,'blocked':[]}, {'id':'CHEM','name':'과학실2','capacity':4,'blocked':[]}],
        'subjects':[{'id':'KO','name':'공통국어','credits':3,'weekly_periods':2},
                    {'id':'PH','name':'물리학','credits':3,'weekly_periods':2}, {'id':'CH','name':'화학','credits':3,'weekly_periods':2}],
        'students':[{'id':'S1','name':'학생01','class_id':'H1'},{'id':'S2','name':'학생02','class_id':'H1'},
                    {'id':'S3','name':'학생03','class_id':'H1'},{'id':'S4','name':'학생04','class_id':'H1'}],
        'lessons':[
            {'id':'HK1','subject_id':'KO','teacher_ids':['HK'],'class_ids':['H1'],'student_ids':[],'room_ids':[], 'weekly_periods':2,'duration':1,'simultaneous_group':'','fixed_slots':[],'forbidden_slots':[]},
            {'id':'HP1','subject_id':'PH','teacher_ids':['HP'],'class_ids':[],'student_ids':['S1','S2'],'room_ids':['PHYS'], 'weekly_periods':2,'duration':1,'simultaneous_group':'ELECTIVE_A','fixed_slots':[],'forbidden_slots':[]},
            {'id':'HC1','subject_id':'CH','teacher_ids':['HC'],'class_ids':[],'student_ids':['S3','S4'],'room_ids':['CHEM'], 'weekly_periods':2,'duration':1,'simultaneous_group':'ELECTIVE_A','fixed_slots':[],'forbidden_slots':[]}
        ],'candidates':[],'published':None,'audit_logs':[]
    }

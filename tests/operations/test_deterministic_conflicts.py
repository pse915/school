from copy import deepcopy
import pytest
from diple.operations.service import OperationsService,Conflict

def fixture(tmp_path):
    p={'school':{'id':'deterministic','academic_year':2026,'semester':1,'name':'합성학교'},
       'periods_by_day':{'월':5,'화':5,'수':5,'목':5,'금':5},
       'teachers':[{'id':'T1','name':'교사1','subject':'과학','blocked':[]},{'id':'T2','name':'교사2','subject':'과학','blocked':[]}],
       'classes':[{'id':'1-1','name':'1-1','grade':1,'size':2,'blocked':[]},{'id':'1-2','name':'1-2','grade':1,'size':2,'blocked':[]}],
       'rooms':[{'id':'R1','name':'실1','capacity':4,'blocked':[]},{'id':'R2','name':'실2','capacity':4,'blocked':[]}],
       'students':[{'id':'S1','class_id':'1-1'},{'id':'S2','class_id':'1-2'}],
       'subjects':[{'id':'과학','name':'과학'}],
       'lessons':[{'id':'L1','subject_id':'과학','teacher_ids':['T1'],'class_ids':[],'student_ids':['S1'],'room_ids':['R1','R2'],'weekly_periods':1,'duration':1,'fixed_slots':[],'forbidden_slots':[],'simultaneous_group':''},
                  {'id':'L2','subject_id':'과학','teacher_ids':['T2'],'class_ids':[],'student_ids':['S2'],'room_ids':['R1','R2'],'weekly_periods':1,'duration':1,'fixed_slots':[],'forbidden_slots':[],'simultaneous_group':''}],
       'published':{'placements':[{'session_id':'L1#1','start':'월1','room_id':'R1'},{'session_id':'L2#1','start':'월1','room_id':'R2'}]}}
    svc=OperationsService(tmp_path/'deterministic.sqlite3');actor={'school_id':'deterministic','user_id':'admin','role':'admin'}
    svc.register_base(p,'2026-10-12',actor);return p,svc,actor

def test_room_collision_always_exercised(tmp_path):
    p,s,a=fixture(tmp_path);target=s.day(p,'2026-10-12',a)['lessons'][1]
    with pytest.raises(Conflict,match='room'):
        s.submit(p,a,'room',[{'action':'room','date':'2026-10-12','occurrence_id':target['id'],'room_id':'R1'}],'교실 충돌 확인')
    assert not s.requests(p,a)

def test_elective_real_student_overlap_always_exercised(tmp_path):
    p,s,a=fixture(tmp_path);current=s.day(p,'2026-10-12',a)['lessons'];current[1]['student_ids']=['S1']
    assert any('student' in error for error in s.conflicts(p,{'2026-10-12':current}))

def test_cancelled_lesson_can_makeup_and_is_scheduled(tmp_path):
    p,s,a=fixture(tmp_path);day='2026-10-12';target=s.day(p,day,a)['lessons'][0]
    req=s.submit(p,a,'cancel',[{'action':'cancel','date':day,'occurrence_id':target['id']}],'결강 수업 취소')
    s.review(p,a,req,True,'검토 승인');s.confirm(p,a,req)
    req=s.submit(p,a,'makeup',[{'action':'makeup','date':day,'occurrence_id':target['id'],'to_date':'2026-10-13','to_period':3}],'취소 수업 보강')
    s.review(p,a,req,True,'검토 승인');s.confirm(p,a,req)
    assert any(l['kind']=='makeup' and l['status']=='scheduled' for l in s.day(p,'2026-10-13',a)['lessons'])

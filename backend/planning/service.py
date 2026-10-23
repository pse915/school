"""Admin-only React planning workbench, integrating Phase7 pure domain services.

Drafts live in this Streamlit session until the admin opts into separate Sheet
persistence. No action publishes to the operating timetable or exam engine.
"""
from copy import deepcopy
import base64
import json

from diple.model import validate_project,validate_placements
from diple.samples import middle_school,high_school
from diple.engine import solve
from diple.editing import move_session,swap_sessions,save_candidate,publish
from diple.sectioning import preflight,generate_plan,validate_plan,apply_plan_to_project
from diple.export import export_xlsx
from .repository import PlanningSheetRepository,key_for


class PlanningService:
    def __init__(self, app):
        self.app=app
        self.project=None
        self.enrollment_snapshot=None
        self.section_plan=None
        self.result=None
        self.messages=[]
        self.saved_revision=0
        self.dirty=False
        self.active=False
        self.last_engine=None

    def permitted(self):
        state=self.app.port.session_state
        if not state.get('logged_in') or state.get('_auth_stale'):return False
        role=self.app.program.call('current_role')
        return role=='마스터' and self.app.program.call('can_manage_ids')

    def guard(self):
        if not self.permitted():raise PermissionError('수업계획은 검증된 마스터 관리자만 사용할 수 있습니다.')

    def snapshot(self):
        if not self.permitted():return {'available':False,'active':False}
        return {'available':True,'active':self.active,'project':self.project,
                'enrollmentSnapshot':self.enrollment_snapshot,'sectionPlan':self.section_plan,
                'result':self.result,'dirty':self.dirty,'savedRevision':self.saved_revision,
                'writable':self.app.repo.writable,
                'warning':'수업계획은 별도 초안입니다. 기존 운영 시간표·시험감독을 변경하지 않습니다. Google Sheets 동시 다중 관리자 저장은 지원하지 않습니다.',
                'lastEngine':self.last_engine}

    def _touch(self):
        self.dirty=True

    def handle(self,operation,payload):
        self.guard()
        if not isinstance(payload,dict):raise ValueError('입력 본문 오류')
        if operation=='navigate':
            self.active=True
            return {'message':'수업계획으로 이동했습니다.'}
        if operation=='close':
            self.active=False
            return {'message':'기존 업무 화면으로 돌아갑니다.'}
        if operation=='sample':
            if payload.get('sample') not in ('middle','high'):raise ValueError('지원하지 않는 예시')
            self.project=middle_school() if payload['sample']=='middle' else high_school()
            self.result=None;self.enrollment_snapshot=None;self.section_plan=None
            self.saved_revision=0;self._touch();return {'message':'합성 예시 데이터를 불러왔습니다. 실제 학교 데이터가 아닙니다.'}
        if operation=='update':
            project=payload.get('project')
            if not isinstance(project,dict):raise ValueError('프로젝트 JSON 객체가 필요합니다.')
            if len(json.dumps(project,ensure_ascii=False))>1500000:raise ValueError('프로젝트가 허용 용량을 초과했습니다.')
            new_key=key_for(project)
            if self.project is not None and self.saved_revision and key_for(self.project)!=new_key:
                raise PermissionError('저장된 학교·학기 식별자는 변경할 수 없습니다. 새 프로젝트를 불러오세요.')
            # Every saved candidate/published snapshot remains immutable, and edits must be explicit.
            if project.get('published') and self.project and project.get('published')!=self.project.get('published'):
                raise PermissionError('확정본을 JSON 직접 편집으로 변경할 수 없습니다.')
            self.project=deepcopy(project);self.result=None;self.section_plan=None
            self._touch();return {'message':'초안을 갱신했습니다. 실제 Google Sheets 저장은 별도로 진행해야 합니다.'}
        if operation=='validate':
            project=self._project()
            problems=validate_project(project)
            return {'errors':problems,'valid':not problems,'message':'검증 완료' if not problems else '기초 입력을 수정하세요.'}
        if operation=='solve':
            project=self._project()
            seconds=min(max(int(payload.get('seconds',10)),1),30)
            self.result=solve(project,seconds=seconds,offline_fallback=True)
            self.last_engine=self.result.get('engine')
            return {'status':self.result['status'],'engine':self.last_engine,'errors':self.result.get('errors',[]),
                    'count':len(self.result.get('placements',[])), 'message':'계산 결과는 초안이며 운영 시간표를 변경하지 않았습니다.'}
        if operation=='candidate':
            p=self._project()
            if not self.result:raise ValueError('먼저 자동 시간표 편성을 실행하세요.')
            label=str(payload.get('label','') or '자동편성 후보')[:80]
            candidate_id=save_candidate(p,self.result,label)
            self._touch();return {'candidateId':candidate_id,'message':'검증된 후보를 초안에 저장했습니다.'}
        if operation in ('move','swap'):
            p=self._project()
            if not self.result or self.result.get('status') not in ('OPTIMAL','FEASIBLE'):
                raise ValueError('검증된 편성 결과를 먼저 생성하세요.')
            current=self.result['placements']
            if operation=='move':
                new,errors=move_session(p,current,str(payload.get('session_id','')),
                    str(payload.get('start','')),payload.get('room_id',None))
            else:
                new,errors=swap_sessions(p,current,str(payload.get('first','')),str(payload.get('second','')))
            if errors:raise ValueError(' / '.join(errors[:12]))
            self.result={**self.result,'placements':new,'status':'FEASIBLE','engine':'수동 변경 검증'}
            self.last_engine=self.result['engine']
            return {'message':'검증된 수동 변경 결과입니다. 후보 저장을 눌러 별도 버전을 생성하세요.'}
        if operation=='publish':
            p=self._project()
            # Publish ONLY to draft. Operating timetable must never be overwritten implicitly.
            candidate_id=str(payload.get('candidate_id',''))
            result=publish(p,candidate_id)
            self._touch();return {'message':f'초안에 확정본 {candidate_id}을 기록했습니다. 운영 시간표에는 미반영입니다.', 'published':result['candidate_id']}
        if operation=='section_snapshot':
            snap=payload.get('snapshot')
            if not isinstance(snap,dict):raise ValueError('확정된 수강신청 스냅샷 JSON이 필요합니다.')
            if len(json.dumps(snap,ensure_ascii=False))>1500000:raise ValueError('스냅샷 용량을 초과했습니다.')
            report=preflight(snap)
            if report['errors']:raise ValueError(' / '.join(report['errors'][:12]))
            if self.project:
                s=self.project['school']
                if (s['id'],int(s['academic_year']),int(s['semester']))!=(snap.get('school_id'),snap.get('academic_year'),snap.get('semester')):
                    raise ValueError('학교·학년도·학기가 시간표 프로젝트와 다릅니다.')
            self.enrollment_snapshot=deepcopy(snap);self.section_plan=None
            return {'message':'확정 수강신청 스냅샷을 검증했습니다. 학생 개인정보 취급에 유의하세요.', 'warnings':report['warnings']}
        if operation=='section_generate':
            if self.enrollment_snapshot is None:raise ValueError('먼저 확정 스냅샷을 불러오세요.')
            self.section_plan=generate_plan(self.enrollment_snapshot,seconds=min(30,max(1,int(payload.get('seconds',15)))))
            return {'message':'분반 구획을 계산했습니다. 실제 요일·교시는 아직 배정되지 않았습니다.',
                    'sections':len(self.section_plan['sections']),'warnings':self.section_plan.get('warnings',[])}
        if operation=='section_apply':
            p=self._project()
            if not self.section_plan or not self.enrollment_snapshot:raise ValueError('먼저 이동반을 편성하세요.')
            if p.get('published') or p.get('candidates'):
                raise PermissionError('기존 후보·확정본이 있는 프로젝트에는 직접 병합할 수 없습니다. 새 초안을 사용하세요.')
            teacher_map=payload.get('teacher_map')
            room_map=payload.get('room_map') or {}
            if not isinstance(teacher_map,dict) or not isinstance(room_map,dict):raise ValueError('교사·교실 매핑 형식 오류')
            p=apply_plan_to_project(p,self.enrollment_snapshot,self.section_plan,teacher_map,room_map)
            self.project=p;self.result=None;self._touch()
            return {'message':'이동반 수업을 새 초안에 병합했습니다. 자동 시간표 계산과 검증이 추가로 필요합니다.'}
        if operation=='save_sheet':
            project=self._project()
            if payload.get('confirm') is not True:raise PermissionError('Google Sheets 별도 저장에 대한 명시적 승인이 필요합니다.')
            revision=PlanningSheetRepository(self.app).save(project,self.saved_revision)
            self.saved_revision=revision;self.dirty=False
            return {'revision':revision,'message':'별도 Diple_Planning 워크시트에 저장하고 재조회 검증했습니다.'}
        if operation=='load_sheet':
            p=self._project()
            if self.dirty and payload.get('discard') is not True:raise PermissionError('저장되지 않은 초안이 있습니다. 덮어쓰기를 확인하세요.')
            loaded,revision=PlanningSheetRepository(self.app).read(key_for(p))
            if loaded is None:raise ValueError('해당 학교·학기 저장본이 없습니다.')
            self.project=loaded;self.saved_revision=revision;self.result=None
            self.section_plan=None;self.enrollment_snapshot=None;self.dirty=False
            return {'revision':revision,'message':'별도 저장본을 불러왔습니다.'}
        if operation=='excel':
            p=self._project()
            if not self.result or self.result['status'] not in ('FEASIBLE','OPTIMAL'):
                raise ValueError('검증된 편성 결과가 필요합니다.')
            contents=export_xlsx(p,self.result['placements'])
            if len(contents)>3_000_000:raise ValueError('출력 파일 크기가 제한을 초과했습니다.')
            return {'filename':'Diple-Planning-Timetable.xlsx','mime':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'base64':base64.b64encode(contents).decode('ascii')}
        raise ValueError('지원하지 않는 수업계획 작업입니다.')

    def _project(self):
        if self.project is None:raise ValueError('예시를 선택하거나 프로젝트 JSON을 불러오세요.')
        return self.project

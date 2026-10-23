import base64
import hashlib
import io
import json
import time
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from backend.bridge.port import ReactPort, Halt, Rerender
from backend.bridge.serialization import wire
from backend.domain.program import LegacyProgram
from backend.repositories.sheets import SheetRepository
from backend.services.history import install_history
from backend.services.calendar import install_calendar
from backend.services.swaps import preview_swap,apply_preview

CHUNK_BYTES = 192 * 1024
MAX_FILE = 50 * 1024 * 1024

class UploadedFile(io.BytesIO):
    def __init__(self,raw,name,mime):
        super().__init__(raw)
        self.name,self.type,self.size=name,mime,len(raw)

class Application:
    def __init__(self,secrets=None,context=None,settings=None):
        self.port=ReactPort(secrets=secrets,context=context)
        self.program=LegacyProgram(self.port)
        self.repo=SheetRepository(self.program,settings)
        install_history(self.program)
        install_calendar(self.program)
        self.responses={}
        self.uploads={}
        self.version=0
        self.response=None
        self.swap_preview=None
        self._install_shell()
        from backend.exam_supervision.install import install
        install(self)
        from backend.planning.service import PlanningService
        self.planning=PlanningService(self)

    def _install_shell(self):
        p=self.port; ns=self.program.namespace
        def toolbar(visible_tabs):
            state=p.session_state
            p.emit('navigation',tabs=visible_tabs,active=state.get('active_tab'))
            with p._region('toolbar'):
                if p.button('새로고침',key='top_quick_refresh'):
                    ns['_clear_gsheet_runtime_cache'](); ns['_invalidate_all_caches']()
                if p.button('최신 자료 불러오기',key='top_quick_load'):
                    if state.get('active_tab')=='시험감독 관리':
                        from backend.exam_supervision.install import get_service
                        get_service(self).reload()
                    else:
                        state.pop('_react_worksheets',None)
                        self.repo.baselines.clear(); self.repo.uncertain.clear()
                        ns['_load_all_runtime_data_from_gsheet']()
                exam=state.get('active_tab')=='시험감독 관리'
                if p.button('시험감독 저장 안내' if exam else '시간표 작업 저장',key='top_quick_save',type='primary'):
                    if exam:p.info('시험감독은 각 화면의 저장 버튼으로 저장합니다. 자동 배정은 계산 완료 후 검토한 결과 저장을 누르세요.')
                    elif ns['save_work_data_to_gsheet'](): p.success('현재 작업을 저장했습니다.')
                if p.button('도구',key='top_tools_open'): ns['render_tools_dialog']()
                if p.button('로그아웃',key='top_logout'):
                    from backend.exam_supervision.install import clear
                    clear(self)
                    state.clear(); p.active_dialog=None; self.uploads.clear(); p.cache.clear()
                    p.widget_defaults.clear();p.editor_defaults.clear()
                    self.responses.clear();self.response=None;self.swap_preview=None
                    from backend.planning.service import PlanningService
                    self.planning=PlanningService(self)
                    self.repo.baselines.clear();self.repo.uncertain.clear()
                    raise Rerender()
        ns['render_top_toolbar']=toolbar
        original_clear=ns['_clear_gsheet_runtime_cache']
        def clear():
            p.session_state.pop('_react_worksheets',None)
            original_clear()
        ns['_clear_gsheet_runtime_cache']=clear

    def _render(self,event=None):
        self.port.reset(event)
        for attempt in range(12):
            try:
                self.program.run()
                if self.port.active_dialog and self.port.active_dialog[0]=='_weekly_action_dialog' and not self.port.session_state.get('weekly_dialog_open'):
                    self.port.active_dialog=None
                if self.port.active_dialog and not self.port.dialog_called:
                    name,args,kw,_=self.port.active_dialog
                    self.program.call(name,*args,**kw)
                break
            except Halt:
                break
            except Rerender:
                self.port.reset()
            except Exception as exc:
                # No traceback/namespace/secrets are sent to the frontend.
                self.port.error(f'작업을 실행하지 못했습니다: {self._redact(str(exc))}')
                break
        else:
            self.port.error('화면 상태가 반복 변경되었습니다. 새로고침 후 다시 시도하세요.')
        self.port.event=None
        if self.port.session_state.get('logged_in') and self.program.call('current_role')!='게스트' and not any(n['kind']=='navigation' for n in self.port.nodes):
            allowed=self.program.call('get_user_allowed_tabs')
            tabs=[t for t in self.program.namespace['ALL_APP_TABS'] if t in allowed]
            if '교무호봉획정' not in tabs:tabs.append('교무호봉획정')
            if self.program.call('can_manage_ids'):
                for tab in ['🔑 아이디·권한 관리','📑 회원별 탭 권한 관리','🛠️ 다중 출장·전체 조정 추천']:
                    if tab not in tabs:tabs.append(tab)
            self.port.emit('navigation',tabs=tabs,active=self.port.session_state.get('active_tab'))

    def _redact(self,text):
        for key in ('NEIS_API_KEY','GEMINI_API_KEY'):
            try:value=self.port.secrets.get(key,'')
            except Exception:value=''
            if value: text=text.replace(str(value),'[비공개]')
        return text

    def snapshot(self):
        ns=self.program.namespace; state=self.port.session_state
        return {'nodes':self.port.nodes,'dataVersion':str(self.version),'response':self.response,
                'user':{'id':state.get('user_id'),'name':state.get('user_name',''),'role':state.get('user_role','게스트')},
                'loggedIn':state.get('logged_in',False),'school':ns['SCHOOL_NAME'],'date':datetime.now(ZoneInfo('Asia/Seoul')).strftime('%Y-%m-%d'),
                'theme':state.get('ui_theme','light'),'font':state.get('ui_font',ns['UI_FONT_DEFAULT']),
                'fontOptions':ns['UI_FONT_OPTIONS'],'writable':self.repo.writable,'activeTab':state.get('active_tab'),
                'swapPreview':{k:wire(v) for k,v in self.swap_preview.items() if k in ('token','a','b','test')} if self.swap_preview else None,
                'planning':self.planning.snapshot()}

    def initialize(self):
        self._render()
        return self.snapshot()

    def _revalidate(self,force=True):
        state=self.port.session_state
        if not state.get('logged_in') or state.get('user_role')=='게스트': return
        if not self.program.call('_revalidate_authenticated_user',force=force):
            self.port.active_dialog=None
            raise PermissionError('계정이 삭제되거나 세션이 만료되었습니다.')
        if state.get('_auth_stale'):
            raise PermissionError('현재 계정 권한을 확인하지 못했습니다. 저장 작업을 중단했습니다.')

    def dispatch(self,request):
        rid=request.get('requestId') if isinstance(request,dict) else None
        if not isinstance(rid,str) or len(rid)>80:
            raise ValueError('요청 ID가 필요합니다.')
        try: uuid.UUID(rid)
        except ValueError as exc: raise ValueError('요청 ID 형식 오류') from exc
        signature=hashlib.sha256(json.dumps(request,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        if rid in self.responses:
            previous=self.responses[rid]
            if previous['signature']!=signature:
                raise ValueError('같은 요청 ID에 다른 내용을 사용할 수 없습니다.')
            try:
                self._revalidate()
                if previous['owner']!=self._owner():raise PermissionError('이전 계정의 요청입니다.')
            except Exception as exc:
                self._render()
                self.response={'operation':request.get('operation'),'requestId':rid,'result':None,'success':False,'error':{'code':type(exc).__name__,'message':self._redact(str(exc))},'dataVersion':str(self.version)}
                return self.snapshot()
            self.response=previous['response']
            if 'download_source' in previous:
                source, offset = previous['download_source']
                self.response={**self.response, 'result':{
                    **self.response['result'],
                    'data':base64.b64encode(source[offset:offset+CHUNK_BYTES]).decode(),
                }}
            return self.snapshot()
        result=None; error=None
        before_writes=self.repo.write_count
        operation=request.get('operation')
        try:
            if request.get('dataVersion')!=str(self.version):
                raise ValueError('이전 화면에서 보낸 요청입니다. 최신 화면을 확인하세요.')
            owner_before = self._owner()
            self._revalidate(force=operation not in ('upload_chunk','download_chunk','upload_cancel'))
            # Refresh the allowlist when permissions change. Keep transient
            # downloads generated by a button alive during chunk transfer.
            state=self.port.session_state
            permitted=self.program.call('get_user_allowed_tabs')
            if state.get('active_tab') and state.get('active_tab') not in permitted and state.get('active_tab')!='교무호봉획정':
                self.port.active_dialog=None
                self.swap_preview=None
                self._render()
            elif owner_before != self._owner():
                # The existing registry was produced by the last successful
                # render. Rebuild only when fresh server-side authorization
                # changes its scope; every request still revalidates above.
                self._render()
            payload=request.get('payload')
            if not isinstance(payload,dict): raise ValueError('요청 본문 오류')
            if operation=='navigate':
                tabs=next((n['tabs'] for n in self.port.nodes if n['kind']=='navigation'),[])
                tab=payload.get('tab')
                if tab not in tabs: raise PermissionError('접근할 수 없는 메뉴입니다.')
                self.port.session_state.active_tab=tab
                self.planning.active=False
                self.program.call('_clear_weekly_selection')
                self.port.active_dialog=None
            elif operation=='preferences':
                if payload.get('theme') not in ('light','black'): raise ValueError('테마 오류')
                if payload.get('font') not in self.program.namespace['UI_FONT_OPTIONS']: raise ValueError('글꼴 오류')
                self.port.session_state.ui_theme=payload['theme']; self.port.session_state.ui_font=payload['font']
            elif operation=='close_dialog':
                self.port.active_dialog=None
                # Keep React outside-click / ESC / X equivalent to the native
                # dismiss callback. Otherwise the next lesson opens with the
                # previous successful swap's stale completion message.
                self.port.session_state.pop('weekly_dialog_result',None)
                self.program.call('_clear_weekly_selection')
            elif operation=='control':
                self._controls(payload)
            elif operation=='preview_swap':
                result=preview_swap(self,payload)
            elif operation=='apply_swap_preview':
                result=apply_preview(self,payload)
            elif operation=='cancel_swap_preview':
                self.swap_preview=None
            elif isinstance(operation,str) and operation.startswith('planning.'):
                result=self.planning.handle(operation[9:],payload)
            elif isinstance(operation,str) and operation.startswith('exam.'):
                from backend.exam_supervision.install import get_service
                result=get_service(self).handle(operation[5:],payload)
            elif operation in ('upload_start','upload_chunk','upload_finish','upload_cancel'):
                result=self._upload(operation,payload)
            elif operation=='download_chunk':
                result=self._download(payload)
            else:
                raise ValueError('지원하지 않는 operation입니다.')
        except (Exception,Halt,Rerender) as exc:
            if not isinstance(exc,(Halt,Rerender)):
                error={'code':type(exc).__name__,'message':self._redact(str(exc))}
            else:
                self._render()
        self.version+=1
        if operation not in ('control','upload_chunk','download_chunk','upload_start','upload_cancel'):
            self._render()
        if error is None and operation=='control':
            failure=next((n for n in self._walk(self.port.nodes) if n['kind']=='error'),None)
            if failure: error={'code':'BusinessError','message':self._redact(failure.get('label','작업 실패'))}
        if self.repo.write_count>before_writes:
            result={**(result or {}),'saved':True,'sheetsWritten':self.repo.write_count-before_writes}
        self.response={'operation':operation,'requestId':rid,'result':result,'success':error is None,'error':error,'dataVersion':str(self.version)}
        entry={'signature':signature,'response':self.response,'owner':self._owner()}
        if operation=='download_chunk' and error is None:
            # Keep one immutable file reference, rather than a second base64
            # copy of every chunk in the 256-request idempotency ledger.
            entry['download_source']=(self.port.controls[payload['control']]['binary'],payload.get('offset',0))
            entry['response']={**self.response,'result':{k:v for k,v in result.items() if k!='data'}}
        self.responses[rid]=entry
        # Bounded response cache; stale requests remain blocked by dataVersion.
        if len(self.responses)>256: self.responses.pop(next(iter(self.responses)))
        return self.snapshot()

    def _owner(self):
        state=self.port.session_state
        return (state.get('user_id'),state.get('user_name'),state.get('user_role'),state.get('user_allowed_tabs'))

    @staticmethod
    def _walk(nodes):
        for node in nodes:
            yield node
            yield from Application._walk(node.get('children',[]))

    def _controls(self,payload):
        control=payload.get('control'); updates=payload.get('values',{})
        if not isinstance(updates,dict) or len(updates)>400: raise ValueError('입력값 오류')
        registry=self.port.controls
        if control not in registry: raise PermissionError('현재 화면에서 실행할 수 없는 작업입니다.')
        target=registry[control]
        if target['node'].get('disabled'): raise PermissionError('사용할 수 없는 작업입니다.')
        decoded=[]
        for key,value in updates.items():
            spec=registry.get(key)
            if not spec or 'decoder' not in spec or spec['node'].get('disabled'):
                raise PermissionError('허용되지 않는 입력값입니다.')
            decoded.append((spec,spec['decoder'](value)))
        for spec,value in decoded: self.port.session_state[spec['state_key']]=value
        callback=target.get('callback')
        if callback:
            callback(*target.get('args',()),**target.get('kwargs',{}))
            self._render()
        else:
            self._render({'control':control})

    def _upload(self,operation,payload):
        control=payload.get('control'); spec=self.port.controls.get(control)
        if not spec or spec['node']['kind']!='upload': raise PermissionError('업로드 권한이 없습니다.')
        token=payload.get('uploadId')
        for key,item in list(self.uploads.items()):
            if time.monotonic()-item['created']>900: self.uploads.pop(key,None)
        if operation=='upload_start':
            if len(self.uploads)>=2: raise ValueError('동시 업로드 수를 초과했습니다.')
            size=payload.get('size'); name=payload.get('name','')
            if type(size) is not int or not 0<size<=MAX_FILE: raise ValueError('파일은 50MB 이하이어야 합니다.')
            if name.rsplit('.',1)[-1].lower() not in spec['node']['types']: raise ValueError('지원하지 않는 형식입니다.')
            token=uuid.uuid4().hex
            self.uploads[token]={'raw':io.BytesIO(),'size':size,'name':str(name)[:200],'mime':payload.get('mime',''),'next':0,'created':time.monotonic(),'control':control}
            return {'uploadId':token,'chunkBytes':CHUNK_BYTES}
        item=self.uploads.get(token)
        if not item or item['control']!=control: raise ValueError('업로드 세션이 없습니다.')
        if operation=='upload_cancel':
            self.uploads.pop(token,None); return None
        if operation=='upload_chunk':
            if payload.get('index')!=item['next']: raise ValueError('청크 순서 오류')
            encoded=payload.get('data','')
            if not isinstance(encoded,str) or len(encoded)>4*((CHUNK_BYTES+2)//3): raise ValueError('청크 크기 오류')
            raw=base64.b64decode(encoded,validate=True)
            if not raw or len(raw)>CHUNK_BYTES or item['raw'].tell()+len(raw)>item['size']: raise ValueError('파일 크기 초과')
            item['raw'].write(raw); item['next']+=1
            return {'next':item['next'],'received':item['raw'].tell()}
        if item['raw'].tell()!=item['size']: raise ValueError('파일 전송이 완료되지 않았습니다.')
        raw=item['raw'].getvalue()
        if hashlib.sha256(raw).hexdigest()!=payload.get('sha256'): raise ValueError('파일 무결성 검증 실패')
        self.port.session_state[spec['state_key']]=UploadedFile(raw,item['name'],item['mime'])
        self.uploads.pop(token,None)
        return {'name':item['name'],'size':len(raw)}

    def _download(self,payload):
        spec=self.port.controls.get(payload.get('control'))
        if not spec or 'binary' not in spec: raise PermissionError('다운로드 권한이 없습니다.')
        offset=payload.get('offset',0)
        if type(offset) is not int or offset<0 or offset>len(spec['binary']): raise ValueError('파일 범위 오류')
        raw=spec['binary'][offset:offset+CHUNK_BYTES]
        return {'data':base64.b64encode(raw).decode(),'next':offset+len(raw),'size':len(spec['binary']),'done':offset+len(raw)>=len(spec['binary'])}

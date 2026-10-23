import {useEffect,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import {CalendarDays,ArrowLeftRight,Users,BarChart3,ClipboardCheck,Settings2,GraduationCap,ShieldCheck,BookOpenText,Menu,Sun,Moon,ChevronRight,PanelLeftClose,Search,CheckCircle2,AlertCircle} from 'lucide-react';
import {flatten,type Send,type Snapshot} from './types';
import {useDrafts,useShell,useTransfers} from './store';
import {NodeRenderer} from './components/NodeRenderer';
import {ExamNavigation} from './components/ExamNavigation';
import {PlanningWorkspace} from './planning/PlanningWorkspace';
import {Button} from './components/ui';

export function App({data,transport,onReady}:{data:Snapshot;transport:Send;onReady?:()=>void}) {
  useEffect(()=>{onReady?.();},[onReady]);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  // A ref rejects rapid repeated dismiss/confirm events before React renders busy=true.
  const pendingOperation=useRef(false);
  const {collapsed,search,settings,update}=useShell();
  const setCollapsed=(value:boolean)=>update({collapsed:value});
  const setSearch=(value:string)=>update({search:value});
  const setSettings=(value:boolean)=>update({settings:value});
  const drafts=useDrafts(s=>s.values),clear=useDrafts(s=>s.clear);
  const nav=flatten(data.nodes).find(n=>n.kind==='navigation');
  const tabs:string[]=nav?.tabs??[];
  const nodes=flatten(data.nodes);
  const examPage=nodes.find(n=>n.id==='exam_page'&&n.kind==='selectbox');
  const examMeta=nodes.find(n=>n.kind==='exam_meta');
  const hasUnsavedExam=nodes.some(n=>n.id in drafts && (n.id.startsWith('exam_')||n.id.startsWith('exam_grid_')) && JSON.stringify(drafts[n.id])!==JSON.stringify(n.kind==='editor'?n.table?.rows:n.value));
  const fieldKinds=['text_input','text_area','selectbox','radio','checkbox','slider','date_input','editor'];
  const values=()=>Object.fromEntries(nodes.filter(n=>fieldKinds.includes(n.kind)&&n.disabled!==true&&n.id in drafts).map(n=>[n.id,drafts[n.id]]));
  const send:Send=async(operation,payload)=>{
    if(pendingOperation.current && !operation.endsWith('chunk')){
      setError('이전 작업이 처리 중입니다.');
      return {operation,requestId:'',success:false,result:null,error:{code:'Busy',message:'이전 작업이 처리 중입니다.'},dataVersion:data.dataVersion};
    }
    pendingOperation.current=true;
    setBusy(true);setError('');
    try {const response=await transport(operation,payload);if(!response.success){setError(response.error?.message??'작업을 완료하지 못했습니다.');}else if(!operation.startsWith('upload_')&&!operation.startsWith('planning.')&&operation!=='download_chunk'){const examControl=operation==='control'&&Boolean(examPage);const control=String(payload.control??'');const savedExam=/^(exam_save_|exam_bulk_(classes|schedule)_save|exam_copy_save|exam_job_apply|exam_update|exam_swap|exam_role_swap|exam_repair|exam_handoff)/.test(control);if(!examControl||savedExam)clear();}return response;}
    catch(e){
      const message=e instanceof Error?e.message:String(e);
      setError(message);
      // UI event handlers need a settled result; an uncaught rejection can
      // otherwise leave a dialog overlay or render tree in a broken state.
      return {operation,requestId:'',success:false,result:null,error:{code:'TransportError',message},dataVersion:data.dataVersion};
    }
    finally{pendingOperation.current=false;setBusy(false);}
  };
  useEffect(()=>{if(!data.loggedIn){clear();useTransfers.getState().clear();}},[data.loggedIn,clear]);
  useEffect(()=>{const media=window.matchMedia('(max-width:1024px)');const resize=()=>useShell.getState().update({collapsed:media.matches});media.addEventListener('change',resize);return()=>media.removeEventListener('change',resize);},[]);
  function icon(tab:string){return tab.includes('호봉')?GraduationCap:tab.includes('권한')?ShieldCheck:tab.includes('맞교환')||tab.includes('테스트')?ArrowLeftRight:tab.includes('통계')?BarChart3:tab.includes('강사')?Users:tab.includes('복무')||tab.includes('출장')?ClipboardCheck:CalendarDays;}
  const theme=data.theme==='black'?'dark':'light';
  const title=data.planning?.active?'수업계획':String(data.activeTab??'로그인').replace(/^[^가-힣A-Za-z]+/,'');
  const displayed=data.nodes.filter(n=>n.kind!=='navigation'&&n.kind!=='exam_meta'&&n.id!=='exam_page');
  const changeExamPage=(index:number)=>void send('control',{control:'exam_page',values:{exam_page:index}});
  const prefs=(t:'light'|'black',font=data.font)=>void send('preferences',{theme:t,font});
  return <Tooltip.Provider><div className={`timetable-app ${theme} ${collapsed?'sidebar-closed':''} ${!data.loggedIn?'login-app':''}`} style={{fontFamily:data.fontOptions[data.font]}}>
    {data.loggedIn&&<aside className="sidebar"><div className="brand"><span className="brand-mark"><CalendarDays size={22}/></span><div><strong>Timetable</strong><small>{data.school}</small></div><Button aria-label="사이드바 접기" variant="ghost" onClick={()=>setCollapsed(true)}><PanelLeftClose size={17}/></Button></div><div className="nav-search"><Search size={15}/><input aria-label="메뉴 검색" placeholder="업무 찾기" value={search} onChange={e=>setSearch(e.target.value)}/></div><nav aria-label="업무 메뉴">{['수업 운영','수업계획','교무 행정','관리'].map(group=>{if(group==='수업계획')return data.planning?.available?<div className="nav-group" key={group}><p>수업계획</p>{(!search||'수업계획 자동편성 수강신청 이동반'.includes(search))&&<button disabled={busy} aria-current={data.planning.active?'page':undefined} className={data.planning.active?'nav-item active':'nav-item'} onClick={()=>void send('planning.navigate',{})}><BookOpenText size={17}/><span>수업계획 · Phase 7</span>{data.planning.active&&<ChevronRight size={14}/>}</button>}</div>:null;const items=tabs.filter(t=>group==='관리'?t.includes('권한'):group==='교무 행정'?t.includes('호봉')||t.includes('복무')||t.includes('출장'):!t.includes('권한')&&!t.includes('호봉')&&!t.includes('복무')&&!t.includes('출장')).filter(t=>t.includes(search));return items.length?<div className="nav-group" key={group}><p>{group}</p>{items.map(t=>{const Icon=icon(t);return <button key={t} disabled={busy} aria-current={t===data.activeTab?'page':undefined} className={t===data.activeTab?'nav-item active':'nav-item'} onClick={()=>void send('navigate',{tab:t})}><Icon size={17}/><span>{t.replace(/^[^가-힣A-Za-z]+/,'')}</span>{t===data.activeTab&&<ChevronRight size={14}/>}</button>;})}</div>:null;})}</nav><div className="sidebar-footer"><span className="avatar">{data.user.name.slice(0,1)||'교'}</span><div><strong>{data.user.name}</strong><small>{data.user.role}</small></div></div></aside>}
    <div className="main-shell"><header className="top-header"><div className="header-left">{data.loggedIn&&<Button variant="ghost" aria-label="메뉴 열기" onClick={()=>setCollapsed(!collapsed)}><Menu size={20}/></Button>}<span className="breadcrumb">{data.school}<ChevronRight size={13}/><strong>{title}</strong></span></div><div className="header-actions"><span className={`sync-label ${busy?'pending':''}`}>{busy?<><span className="loading-dot"/>처리 중</>:<><CheckCircle2 size={14}/>{data.writable?'연결됨':'읽기 전용'}</>}</span><Tooltip.Root><Tooltip.Trigger asChild><Button variant="ghost" aria-label={theme==='dark'?'라이트 테마':'다크 테마'} disabled={busy} onClick={()=>prefs(theme==='dark'?'light':'black')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</Button></Tooltip.Trigger><Tooltip.Content className="tooltip">화면 테마</Tooltip.Content></Tooltip.Root><Button variant="ghost" aria-label="설정" onClick={()=>setSettings(true)}><Settings2 size={18}/></Button></div></header>
      <main aria-busy={busy}><div className="page-heading"><div><span className="eyebrow">SCHOOL OPERATIONS · {data.date}</span><h1>{data.loggedIn?title:'학교 업무의 새로운 흐름'}</h1><p>{data.loggedIn?'시간표와 교무 업무를 한 곳에서 관리하세요.':'기존 아이디로 로그인하여 업무를 시작하세요.'}</p></div>{data.loggedIn&&<span className="date-chip"><CalendarDays size={15}/>{data.date}</span>}</div>
      {error&&<div role="alert" className="notice error"><AlertCircle size={18}/>{error}<Button variant="ghost" onClick={()=>setError('')}>닫기</Button></div>}
      <div className={data.loggedIn?'workspace':'login-workspace'}>{data.planning?.active?<PlanningWorkspace data={data.planning} send={send} busy={busy}/>:examPage?<div className="exam-shell"><ExamNavigation pageNode={examPage} meta={examMeta} navigate={changeExamPage} busy={busy} dirty={hasUnsavedExam||Boolean(examMeta?.unsavedForm)}><div className="exam-content">{displayed.map(node=><NodeRenderer key={node.id} node={node} send={send} busy={busy} values={values}/>)}</div></ExamNavigation></div>:displayed.map(node=><NodeRenderer key={node.id} node={node} send={send} busy={busy} values={values}/>)}</div>
      </main><footer className="app-footer">{data.school} · 시간표 및 교무행정</footer>
    </div>
    <Dialog.Root open={Boolean(data.swapPreview)} onOpenChange={open=>{if(!open&&!pendingOperation.current)void send('cancel_swap_preview',{});}}><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal settings-modal" onPointerDownOutside={event=>{if(busy)event.preventDefault();}} onEscapeKeyDown={event=>{if(busy)event.preventDefault();}}><Dialog.Title className="modal-title">{data.swapPreview?.test?'테스트 교환 미리보기':'맞교환 적용 전 확인'}</Dialog.Title><Dialog.Description>Python 검증을 통과한 동일 학급 1:1 맞교환입니다. 적용할 내용을 확인하세요.</Dialog.Description>{data.swapPreview&&<><div className="card"><strong>{data.swapPreview.a['교사명']} ↔ {data.swapPreview.b['교사명']}</strong><span>{data.swapPreview.a['일자']} {data.swapPreview.a['교시']}교시 · {data.swapPreview.a['학급']} {data.swapPreview.a['과목']}</span><span>{data.swapPreview.b['일자']} {data.swapPreview.b['교시']}교시 · {data.swapPreview.b['학급']} {data.swapPreview.b['과목']}</span></div><Button disabled={busy} variant="default" onClick={()=>void send('apply_swap_preview',{token:data.swapPreview!.token})}>{data.swapPreview.test?'테스트에 적용':'확인 후 저장'}</Button><Button disabled={busy} onClick={()=>void send('cancel_swap_preview',{})}>취소</Button></>}</Dialog.Content></Dialog.Root>
    <Dialog.Root open={settings} onOpenChange={setSettings}><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal settings-modal"><Dialog.Title className="modal-title">화면 설정</Dialog.Title><Dialog.Description>테마와 글꼴은 화면을 이동해도 유지됩니다.</Dialog.Description><div className="segments"><Button onClick={()=>prefs('light')}>Light</Button><Button onClick={()=>prefs('black')}>Dark</Button></div><label className="field"><span>글꼴</span><select value={data.font} onChange={e=>prefs(data.theme,e.target.value)}>{Object.keys(data.fontOptions).map(font=><option key={font}>{font}</option>)}</select></label><Dialog.Close asChild><Button>닫기</Button></Dialog.Close></Dialog.Content></Dialog.Root>
  </div></Tooltip.Provider>;
}

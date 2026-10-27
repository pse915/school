import {createRoot,type Root} from 'react-dom/client';
import type {FrontendRendererArgs} from '@streamlit/component-v2-lib';
import {App} from './App';
import {AppErrorBoundary} from './components/AppErrorBoundary';
import type {Snapshot,RequestEnvelope,ResponseEnvelope} from './types';
import './styles.css';

type ComponentArgs = FrontendRendererArgs<any,Snapshot>;
type Waiter = {resolve:(response:ResponseEnvelope)=>void; reject:(error:Error)=>void; timer:ReturnType<typeof setTimeout>};
type Mount = {root:Root;current:Snapshot;setStateValue:ComponentArgs['setStateValue'];pending:Map<string,Waiter>;readySent?:string};
// Streamlit v2 calls render on every data update. A React root must outlive
// those updates; creating a new root each time can destroy the entire UI.
const mounts = new WeakMap<ComponentArgs['parentElement'],Mount>();

export default function render(component:ComponentArgs) {
  try {return mountComponent(component);}
  catch(error) {
    console.error('Timetable bootstrap failed',error);
    const container=component.parentElement?.querySelector('#timetable-root');
    if(!container)throw error;
    const alert=document.createElement('section');alert.setAttribute('role','alert');
    alert.style.cssText='padding:24px;font-family:system-ui,sans-serif;color:#991b1b;background:#fff';
    const title=document.createElement('h1');title.textContent='시간표 화면 초기화에 실패했습니다.';
    const detail=document.createElement('p');detail.textContent='페이지를 새로고침하고 frontend/dist 빌드 파일을 확인하세요. 오류 유형: '+(error instanceof Error?error.name:'Error');
    alert.append(title,detail);container.replaceChildren(alert);
    return ()=>{};
  }
}

function mountComponent(component:ComponentArgs) {
  if(!component.data||!Array.isArray(component.data.nodes)||!component.data.fontOptions)throw new Error('Invalid startup snapshot');
  if(!document.getElementById('timetable-host-layout')) {
    const style=document.createElement('style');style.id='timetable-host-layout';
    style.textContent='[data-testid="stHeader"]{display:none!important}[data-testid="stMainBlockContainer"]{padding:0!important;max-width:none!important}.block-container{padding:0!important;max-width:none!important}';
    document.head.appendChild(style);
  }
  const fontLinks:Record<string,string>={
    'Pretendard':'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css',
    'Noto Sans KR':'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap',
    'Inter':'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  };
  const fontUrl=fontLinks[component.data.font];
  if(fontUrl&&!document.querySelector(`link[href="${fontUrl}"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=fontUrl;document.head.appendChild(link);}
  if(!document.getElementById('timetable-github-fonts')){const style=document.createElement('style');style.id='timetable-github-fonts';style.textContent='@font-face{font-family:"Pse Noto Sans KR";font-weight:300 600;src:url("https://cdn.jsdelivr.net/gh/pse915/Timetable@main/NotoSansKR-Light.ttf") format("truetype");font-display:swap}@font-face{font-family:"Pse Noto Sans KR";font-weight:700;src:url("https://cdn.jsdelivr.net/gh/pse915/Timetable@main/NotoSansKR-Bold.ttf") format("truetype");font-display:swap}@font-face{font-family:"Hakgyoansim Wooju R";src:url("https://cdn.jsdelivr.net/gh/pse915/Timetable@main/HakgyoansimWoojuR.ttf") format("truetype");font-display:swap}';document.head.appendChild(style);}

  const host=component.parentElement;
  const container=host.querySelector('#timetable-root');
  if(!container)throw new Error('Timetable mount point is missing');
  let mount=mounts.get(host);
  if(!mount){
    mount={root:createRoot(container),current:component.data,setStateValue:component.setStateValue,pending:new Map()};
    mounts.set(host,mount);
  }else{
    mount.current=component.data;
    mount.setStateValue=component.setStateValue;
  }
  const active=mount;
  const response=active.current.response;
  if(response){
    const waiter=active.pending.get(response.requestId);
    if(waiter){clearTimeout(waiter.timer);active.pending.delete(response.requestId);waiter.resolve(response);}
  }
  const send=(operation:string,payload:Record<string,any>)=>new Promise<ResponseEnvelope>((resolve,reject)=>{
    if(mounts.get(host)!==active){reject(new Error('시간표 화면이 종료되었습니다.'));return;}
    const requestId=crypto.randomUUID();
    const request:RequestEnvelope={operation,requestId,payload,dataVersion:active.current.dataVersion};
    const timer=setTimeout(()=>{active.pending.delete(requestId);reject(new Error('서버 응답을 확인하지 못했습니다. 저장 작업은 다시 누르기 전에 최신 자료를 확인하세요.'));},120000);
    active.pending.set(requestId,{resolve,reject,timer});
    try{active.setStateValue('request',request);}catch(error){
      clearTimeout(timer);active.pending.delete(requestId);
      reject(error instanceof Error?error:new Error(String(error)));
    }
  });
  const onReady=()=>{
    const release=active.current.frontendRelease;
    if(release&&active.readySent!==release){
      active.setStateValue('ready',release);
      active.readySent=release;
    }
  };
  active.root.render(<AppErrorBoundary><App data={active.current} transport={send} onReady={onReady}/></AppErrorBoundary>);
  return ()=>{
    if(mounts.get(host)!==active)return;
    for(const waiter of active.pending.values()){
      clearTimeout(waiter.timer);
      waiter.reject(new Error('화면 연결이 종료되었습니다. 저장 결과를 확인하세요.'));
    }
    active.pending.clear();
    active.root.unmount();
    mounts.delete(host);
  };
}

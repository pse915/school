import {useState,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,CalendarDays,CheckCircle2,ChevronDown,ClipboardCheck,FileClock,LockKeyhole,Settings2,ShieldCheck,Users} from 'lucide-react';
import type {ViewNode} from '../types';
import {Button} from './ui';

const steps=[
  {title:'시험일정',target:'시험일정 설정'},
  {title:'교사 명단·조건',target:'교사 명단'},
  {title:'수업·겸임 일정',target:'수업시간표'},
  {title:'자동 배정·직접 수정',target:'자동 배정·직접 수정'},
  {title:'공정성 분석',target:'공정성 분석'}
];
const conditions=['교사 명단','감독 역할·강사 제외','배정불가 시간','수업시간표','겸임교사 일정','교사감독규칙','최적화 설정'];
const groups=[
  {title:'준비 현황',items:['시험감독 준비 현황']},
  {title:'조회',items:['교사별 감독 조회','전체 감독 시간표']},
  {title:'1. 시험일정',items:['시험일정 설정']},
  {title:'2. 교사 명단·조건',items:['교사 명단','감독 역할·강사 제외','배정불가 시간','최적화 설정']},
  {title:'3. 수업·겸임 일정',items:['수업시간표','겸임교사 일정','교사감독규칙']},
  {title:'4. 자동 배정·직접 수정',items:['자동 배정·직접 수정']},
  {title:'5. 공정성 분석·기록',items:['공정성 분석','배정 기록·인쇄']},
  {title:'설정 · 진단',items:['연결·조회 권한','저장 주체·연결 진단']}
];
function stepOf(page:string) {
  if(page==='시험일정 설정')return 0;
  if(['교사 명단','감독 역할·강사 제외','배정불가 시간','최적화 설정'].includes(page))return 1;
  if(['수업시간표','겸임교사 일정','교사감독규칙'].includes(page))return 2;
  if(page==='자동 배정·직접 수정')return 3;
  if(['공정성 분석','배정 기록·인쇄'].includes(page))return 4;
  return -1;
}
export function ExamNavigation({pageNode,meta,navigate,busy,dirty,children}:{pageNode:ViewNode;meta?:ViewNode;navigate:(index:number)=>void;busy:boolean;dirty:boolean;children:ReactNode}){
  const [expanded,setExpanded]=useState(false);
  const [pending,setPending]=useState<number|null>(null);
  const pages=(pageNode.options??[]).map(x=>x.label);
  const current=pages[Number(pageNode.value)]??pages[0]??'';
  const currentStep=stepOf(current);
  const canManage=Boolean(meta?.admin);
  function move(name:string){
    const next=pages.indexOf(name);
    if(next<0 || busy || next===Number(pageNode.value))return;
    if(dirty)setPending(next);
    else navigate(next);
    setExpanded(false);
  }
  const stages=(meta?.steps??[]) as Array<{label:string;state:string}>;
  const shownGroups=groups.map(g=>({...g,items:g.items.filter(x=>pages.includes(x))})).filter(g=>g.items.length>0);
  return <>
    <div className="exam-navigation">
      <div className="exam-side-head"><strong><ClipboardCheck size={20}/> 시험감독 업무</strong><Button className="exam-menu-toggle" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><ChevronDown size={16}/>메뉴 {expanded?'접기':'열기'}</Button></div>
      <nav aria-label="시험감독 메뉴" className={`exam-menu ${expanded?'is-open':''}`}>
        {shownGroups.map(group=><div className="exam-nav-section" key={group.title}><p>{group.title}</p>{group.items.map(page=>{
          const child=conditions.includes(page);
          const Icon=page==='시험감독 준비 현황'?BookOpen:page.includes('교사')?Users:page.includes('시간표')?CalendarDays:page.includes('공정성')?ShieldCheck:page.includes('연결')?Settings2:page.includes('기록')?FileClock:ClipboardCheck;
          return <button key={page} className={`exam-nav-link ${child?'subitem':''} ${current===page?'active':''}`} aria-current={current===page?'page':undefined} disabled={busy} onClick={()=>move(page)}><Icon size={16}/><span>{page}</span></button>;
        })}</div>)}
      </nav>
    </div>
    <div className="exam-stage-main">
      {canManage&&<div className="exam-progress" aria-label="시험감독 5단계 작업 순서">
        {steps.map((step,index)=>{
          const state=stages[index]?.state??'확인 필요';
          return <button key={step.target} className={`exam-progress-step ${currentStep===index?'current':''}`} aria-current={currentStep===index?'step':undefined} onClick={()=>move(step.target)} disabled={busy}>
            <span className="exam-progress-number">{index+1}</span><span><strong>{step.title}</strong><small>{currentStep===index?'현재 단계 · ':''}{state}</small></span>{state==='검증 통과'&&<CheckCircle2 size={15}/>}
          </button>;
        })}
      </div>}
      {meta?.overview?.sheet&&<div className="exam-context"><span><CheckCircle2 size={16}/>연결 시트: {String(meta.overview.sheet)}</span><span><LockKeyhole size={16}/>{meta.overview.writable?'시험감독 저장 가능':`읽기 전용 · ${String(meta.overview.readOnlyReason)}`}</span></div>}
      {children}
      {canManage&&currentStep>=0&&<div className="exam-page-steps"><Button disabled={busy||currentStep===0} onClick={()=>move(steps[Math.max(0,currentStep-1)].target)}><ArrowLeft size={17}/> 이전 단계</Button><span>설정은 각 화면의 저장 버튼으로 반영됩니다.</span><Button disabled={busy||currentStep===4} onClick={()=>move(steps[Math.min(4,currentStep+1)].target)}>다음 단계 <ArrowRight size={17}/></Button></div>}
    </div>
    {pending!==null&&<div className="exam-confirm-overlay" role="presentation"><section role="alertdialog" aria-modal="true" aria-labelledby="exam-dirty-title" className="exam-confirm"><h3 id="exam-dirty-title">저장하지 않은 변경사항</h3><p>현재 화면의 미저장 입력값을 유지한 상태로 다른 메뉴로 이동할 수 있습니다. 시트에 저장되는 것은 아닙니다. 나중에 원래 화면으로 돌아와 저장하세요.</p><div className="exam-confirm-buttons"><Button onClick={()=>setPending(null)}>취소하고 저장 작업 계속</Button><Button variant="default" onClick={()=>{navigate(pending);setPending(null);}}>입력 유지하고 이동</Button></div></section></div>}
  </>;
}

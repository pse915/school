import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {useSemesterEditor} from '../store';
import type {ViewNode,Send} from '../types';
import {Button} from './ui';
interface Lesson {id:string;start:string;duration:number;label:string;teachers:string;room:string;locked:boolean}
export function SemesterEditor({node,send,busy}:{node:ViewNode;send:Send;busy:boolean}){
 const {candidate,selected,choose}=useSemesterEditor();
 const [dismissedToken,setDismissedToken]=useState<string|null>(null);
 useEffect(()=>{if(candidate!==node.candidate_id)choose(node.candidate_id,null);},[candidate,node.candidate_id,choose]);
 useEffect(()=>()=>choose('',null),[choose]);
 const source=candidate===node.candidate_id?selected:null;const lessons=(node.lessons??[]) as Lesson[];
 const propose=(id:string,start:string,target?:string)=>void send('sem.preview',{candidate_id:node.candidate_id,session_id:id,start,target_id:target});
 const close=()=>{if(!busy){setDismissedToken(node.preview?.token??null);void send('sem.close_preview',{});}};
 return <section className="semester-editor" aria-label="학기 시간표 편집기"><p role="status">{source?'목적지 또는 맞교환할 수업을 선택하세요.':'수업을 드래그하거나 터치로 선택하세요. 변경은 새 후보로 저장됩니다.'}</p>
 <div className="operations-scroll"><table className="operations-grid"><thead><tr><th>교시</th>{Object.keys(node.grid).map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{Array.from({length:Math.max(...Object.values(node.grid) as number[])},(_,i)=>i+1).map(n=><tr key={n}><th>{n}교시</th>{Object.entries(node.grid).map(([day,count])=>{
 const start=day+n;const items=lessons.filter(l=>l.start===start);
 return <td key={day} data-testid={`semester-slot-${start}`} onDragOver={e=>{if(n<=Number(count)&&!busy)e.preventDefault();}} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-semester-lesson');if(id&&!busy)propose(id,start,items[0]?.id);}}>
 {items.map(l=><button key={l.id} aria-label={`${l.start} ${l.label} ${l.teachers}`} type="button" className={`ops-lesson ${source===l.id?'selected':''}`} disabled={busy} aria-pressed={source===l.id} draggable={!busy} onDragStart={e=>e.dataTransfer.setData('application/x-semester-lesson',l.id)} onClick={()=>{if(source&&source!==l.id){propose(source,l.start,l.id);choose(node.candidate_id,null);}else choose(node.candidate_id,source===l.id?null:l.id);}}><strong>{l.label} {l.locked?'🔒':''}</strong><span>{l.teachers}</span><small>{l.duration}시간 · {l.room}</small></button>)}
 {!items.length&&n<=Number(count)&&<button className="ops-empty" disabled={busy||!source} aria-label={`${start}로 이동`} onClick={()=>{if(source){propose(source,start);choose(node.candidate_id,null);}}}>+</button>}
 </td>;
 })}</tr>)}</tbody></table></div>
 <Dialog.Root open={Boolean(node.preview)&&node.preview.token!==dismissedToken} onOpenChange={open=>{if(!open)close();}}><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal settings-modal" onPointerDownOutside={e=>{if(busy)e.preventDefault();}} onEscapeKeyDown={e=>{if(busy)e.preventDefault();}}>
 <Dialog.Title className="modal-title">학기 시간표 변경 미리보기</Dialog.Title><Dialog.Description>전체 자원 검증을 통과한 변경안입니다. 기존 확정본은 변경하지 않습니다.</Dialog.Description>
 <Button aria-label="학기 변경안 닫기" disabled={busy} onClick={close}><X size={18}/></Button>
 {node.preview&&<><div className="ops-preview-summary">{node.preview.before.map((p:{session_id:string;start:string},i:number)=><p key={p.session_id}>{p.session_id}: {p.start} → {node.preview.after[i]?.start}</p>)}</div><Button disabled={busy} variant="default" onClick={()=>void send('sem.apply_preview',{token:node.preview.token})}>검증된 편집을 새 후보로 저장</Button></>}
 <Button disabled={busy} onClick={close}>학기 편집 취소</Button></Dialog.Content></Dialog.Root></section>;
}
export function SemesterJob({node,send,busy}:{node:ViewNode;send:Send;busy:boolean}){
 const status=String(node.state?.status??'');
 useEffect(()=>{if(status!=='RUNNING'||busy)return;const timer=setInterval(()=>{void send('sem.poll',{});},1200);return()=>clearInterval(timer);},[status,busy,send]);
 const labels:Record<string,string>={RUNNING:'자동편성 실행 중',FEASIBLE:'실행 가능한 해 발견',OPTIMAL:'현재 목적함수의 최적해 확인',UNKNOWN:'시간 내 해를 찾지 못함',INFEASIBLE:'현재 필수조건에서 불가능 판정',INVALID:'입력 오류',MODEL_INVALID:'모델 오류',CANCELLED:'계산 취소',ERROR:'실행 오류'};
 return <section className="card" aria-label="자동편성 상태"><strong role="status">{labels[status]??status}</strong>{node.state?.message&&<p>{node.state.message}</p>}{status==='RUNNING'?<Button disabled={busy} onClick={()=>void send('sem.cancel_job',{})}>자동편성 취소</Button>:<p>저장된 후보 {node.state?.candidate_ids?.length??0}개</p>}{node.state?.results?.map((r:{status:string;elapsed:number;errors:string[]},i:number)=><p key={i}>후보 {i+1}: {r.status} · {r.elapsed?.toFixed(2)}초 {r.errors?.join(' / ')}</p>)}</section>;
}

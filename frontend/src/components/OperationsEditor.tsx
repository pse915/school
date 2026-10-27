import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {X,ArrowLeftRight} from 'lucide-react';
import type {ViewNode,Send} from '../types';
import {useOperationsEditor} from '../store';
import {Button} from './ui';

interface Lesson {id:string;period:number;duration:number;label:string;teacher_ids:string[];class_ids:string[];status:string;room_id:string;unassigned?:boolean}
export function OperationsEditor({node,send,busy}:{node:ViewNode;send:Send;busy:boolean}) {
  const {selected,day,choose}=useOperationsEditor();
  const [reason,setReason]=useState('수업 운영 변경 요청');
  useEffect(()=>{if(day!==node.day)choose(node.day,null);},[day,node.day,choose]);
  useEffect(()=>()=>choose('',null),[choose]);
  const lessons=(node.lessons??[]) as Lesson[];
  const source=day===node.day?selected:null;
  const preview=node.preview as {token:string;reason:string;kind:string;before:Record<string,Lesson[]>;after:Record<string,Lesson[]>}|null;
  const columns=[...(node.classes??[]),...(lessons.some(l=>!l.class_ids.length)?[{id:'__elective__',name:'이동반·선택수업'}]:[])];
  const propose=(id:string,period:number,target?:string)=>void send('ops.preview',{day:node.day,revision:node.revision,base_id:node.base_id,occurrence_id:id,to_period:period,target_id:target,reason});
  const select=(lesson:Lesson)=>{
    if(source&&source!==lesson.id){propose(source,lesson.period,lesson.id);choose(node.day,null);}
    else choose(node.day,source===lesson.id?null:lesson.id);
  };
  const close=()=>{if(!busy)void send('ops.close_preview',{});};
  return <section className="operations-editor" aria-label="학기 중 시간표 편집기">
    <p role="status">{source?'이동할 빈 칸이나 맞교환할 수업을 선택하세요.':'수업을 드래그하거나 터치로 선택한 뒤 목적지를 선택하세요.'}</p>
    <label className="field"><span>편집기 변경 사유</span><input value={reason} disabled={busy} onChange={e=>setReason(e.target.value)}/></label>
    <div className="operations-scroll"><table className="operations-grid"><thead><tr><th>교시</th>{columns.map(c=><th key={c.id}>{c.name??c.id}</th>)}</tr></thead>
      <tbody>{Array.from({length:node.max_period},(_,i)=>i+1).map(period=><tr key={period}><th>{period}교시</th>{columns.map(c=>{
        const items=lessons.filter(l=>l.period===period&&(c.id==='__elective__'?!l.class_ids.length:l.class_ids.includes(c.id)));
        return <td key={c.id} data-testid={`ops-slot-${c.id}-${period}`} onDragOver={e=>{if(!busy)e.preventDefault();}} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-ops-lesson');if(id&&!busy)propose(id,period,items[0]?.id);}}>
          {items.map(l=><button key={l.id} type="button" draggable={!busy&&l.status!=='cancelled'} disabled={busy||l.status==='cancelled'} className={`ops-lesson ${source===l.id?'selected':''}`} aria-pressed={source===l.id} aria-label={`${period}교시 ${l.label} ${l.teacher_ids.join(',')}`} onDragStart={e=>e.dataTransfer.setData('application/x-ops-lesson',l.id)} onClick={()=>select(l)}><strong>{l.label}</strong><span>{l.teacher_ids.join(', ')}</span><small>{l.room_id} {l.unassigned?'대강 미배정':l.status==='cancelled'?'취소':''}</small></button>)}
          {!items.length&&<button className="ops-empty" disabled={busy||!source} aria-label={`${c.name??c.id} ${period}교시로 이동`} onClick={()=>{if(source){propose(source,period);choose(node.day,null);}}}>+</button>}
        </td>;
      })}</tr>)}</tbody></table></div>
    <Dialog.Root open={Boolean(preview)} onOpenChange={open=>{if(!open)close();}}><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal settings-modal" onPointerDownOutside={e=>{if(busy)e.preventDefault();}} onEscapeKeyDown={e=>{if(busy)e.preventDefault();}}>
      <Dialog.Title className="modal-title"><ArrowLeftRight size={18}/> 학기 중 변경안 미리보기</Dialog.Title>
      <Dialog.Description>서버 충돌 검증을 통과했습니다. 제출 후 관리자 승인·확정·배포가 필요합니다.</Dialog.Description>
      <Button aria-label="변경안 닫기" disabled={busy} onClick={close}><X size={18}/></Button>
      {preview&&<><p>{preview.reason}</p><div className="ops-preview-summary">{Object.entries(preview.after).map(([d,rows])=><div key={d}><strong>{d}</strong>{rows.filter(l=>JSON.stringify(l)!==JSON.stringify(preview.before[d]?.find(b=>b.id===l.id))).map(l=><p key={l.id}>{l.label} · {l.period}교시 · {l.teacher_ids.join(', ')} · {l.room_id}</p>)}</div>)}</div>
        <Button disabled={busy} variant="default" onClick={()=>void send('ops.submit_preview',{token:preview.token})}>확인 후 승인요청 제출</Button></>}
      <Button disabled={busy} onClick={close}>미리보기 취소</Button>
    </Dialog.Content></Dialog.Root>
  </section>;
}

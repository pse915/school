import {useState} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight} from 'lucide-react';
import type {Send,ViewNode} from '../types';
import {Button} from './ui';

const iso=(d:Date)=>d.toISOString().slice(0,10);
export function Calendar({node,send,busy,values}:{node:ViewNode;send:Send;busy:boolean;values:()=>Record<string,any>}) {
  const selected=new Date(node.value+'T00:00:00Z');
  const [month,setMonth]=useState(new Date(selected.getUTCFullYear(),selected.getUTCMonth(),1));
  const [open,setOpen]=useState(false);
  const pick=(day:Date)=>{setOpen(false);void send('control',{control:node.id,values:{...values(),[node.id]:iso(day)}});};
  const shift=(delta:number)=>{const day=new Date(selected);day.setUTCDate(day.getUTCDate()+delta);if(!node.week){if(day.getUTCDay()===6)day.setUTCDate(day.getUTCDate()+(delta>0?2:-1));if(day.getUTCDay()===0)day.setUTCDate(day.getUTCDate()+(delta>0?1:-2));}pick(day);};
  const first=new Date(Date.UTC(month.getFullYear(),month.getMonth(),1));const leading=(first.getUTCDay()+6)%7;const days=new Date(Date.UTC(month.getFullYear(),month.getMonth()+1,0)).getUTCDate();
  const cells=[];for(let w=0;w<Math.ceil((leading+days)/7);w++)for(let wd=0;wd<5;wd++){const day=w*7+wd-leading+1;cells.push(day>0&&day<=days?day:null);}
  const end=new Date(selected);end.setUTCDate(end.getUTCDate()+(node.include_saturday?5:4));
  return <div className="calendar-control"><span className="calendar-label">{node.label}</span><div className="date-controls"><Button aria-label={`${node.label} 이전 ${node.week?'주':'평일'}`} disabled={busy} onClick={()=>shift(node.week?-7:-1)}><ChevronLeft size={15}/></Button><Button disabled={busy} aria-expanded={open} onClick={()=>setOpen(!open)}><CalendarDays size={16}/>{node.value}{node.week?` ~ ${iso(end)}`:''}</Button><Button aria-label={`${node.label} 다음 ${node.week?'주':'평일'}`} disabled={busy} onClick={()=>shift(node.week?7:1)}><ChevronRight size={15}/></Button></div>{open&&<div className="calendar-popup card"><div className="calendar-heading"><Button aria-label="이전 달" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={15}/></Button><strong>{month.getFullYear()}년 {month.getMonth()+1}월</strong><Button aria-label="다음 달" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={15}/></Button></div><div className="calendar-days">{['월','화','수','목','금'].map(day=><span key={day}>{day}</span>)}{cells.map((day,i)=>day?<Button key={i} aria-label={`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`} variant={node.value===iso(new Date(Date.UTC(month.getFullYear(),month.getMonth(),day)))?'default':'ghost'} onClick={()=>pick(new Date(Date.UTC(month.getFullYear(),month.getMonth(),day)))}>{day}</Button>:<span key={i}/>)}</div><small>월~금 기준{node.week?' · 선택한 주의 월요일부터 조회':''}</small></div>}{node.help&&<small>{node.help}</small>}</div>;
}

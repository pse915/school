import {useId,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import DOMPurify from 'dompurify';
import {marked} from 'marked';
import {Download,Upload,CheckCircle2,AlertCircle,Info,X,FileText,LoaderCircle} from 'lucide-react';
import {useDrafts,useTransfers} from '../store';
import type {Send,ViewNode} from '../types';
import {Button} from './ui';
import {DataGrid} from './DataGrid';
import {Calendar} from './Calendar';
import {OperationsEditor} from './OperationsEditor';
import {SemesterEditor,SemesterJob} from './SemesterEditor';

const icons={info:Info,success:CheckCircle2,error:AlertCircle,warning:AlertCircle,toast:CheckCircle2};
export function NodeRenderer({node,send,busy,values}:{node:ViewNode;send:Send;busy:boolean;values:()=>Record<string,any>}) {
  const draft=useDrafts(s=>s.values[node.id]);const set=useDrafts(s=>s.set); const id=useId();
  const transfer=useTransfers(s=>s.items[node.id]);const epoch=useTransfers(s=>s.epoch);
  const progress=transfer?.progress??null,fileError=transfer?.message??'';
  const setProgress=(value:number|null)=>useTransfers.getState().set(node.id,{progress:value},epoch);
  const setFileError=(value:string)=>useTransfers.getState().set(node.id,{message:value},epoch);
  const [optionQuery,setOptionQuery]=useState('');
  const value=draft??node.value??'';
  const kids=(node.children??[]).map(n=><NodeRenderer key={n.id} node={n} send={send} busy={busy} values={values}/>);
  const update=(v:any,immediate=false)=>{set(node.id,v);if(immediate)void send('control',{control:node.id,values:{...values(),[node.id]:v}});};
  const disabled=busy||node.disabled;
  async function download() {
    const chunks:Uint8Array[]= [];let offset=0;setProgress(0);
    try {while(true){const r=await send('download_chunk',{control:node.id,offset});if(!r.success)throw new Error(r.error?.message);const part=Uint8Array.from(atob(r.result.data),c=>c.charCodeAt(0));chunks.push(part);offset=r.result.next;setProgress(Math.round(offset/node.size*100));if(r.result.done)break;}
      const blob=new Blob(chunks as BlobPart[],{type:node.mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=node.file_name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){setFileError(String(e));}finally{setProgress(null);}
  }
  async function upload(file?:File) {
    if(!file)return;setFileError('');if(file.size>node.maxBytes){setFileError('50MB 이하 파일을 선택하세요.');return;}setProgress(0);
    try {const start=await send('upload_start',{control:node.id,size:file.size,name:file.name,mime:file.type});if(!start.success)throw new Error(start.error?.message);const token=start.result.uploadId,chunkBytes=start.result.chunkBytes;
      for(let offset=0,index=0;offset<file.size;offset+=chunkBytes,index++) {const bytes=new Uint8Array(await file.slice(offset,offset+chunkBytes).arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);const r=await send('upload_chunk',{control:node.id,uploadId:token,index,data:btoa(binary)});if(!r.success)throw new Error(r.error?.message);setProgress(Math.round(r.result.received/file.size*100));}
      const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());const sha256=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');const end=await send('upload_finish',{control:node.id,uploadId:token,sha256});if(!end.success)throw new Error(end.error?.message);
      setFileError(`${file.name} · 업로드 완료`);
    }catch(e){setFileError(String(e));}finally{setProgress(null);}
  }
  switch(node.kind){
    case 'navigation':case 'exam_meta':return null;
    case 'semester_editor':return <SemesterEditor node={node} send={send} busy={busy}/>;
    case 'semester_job':return <SemesterJob node={node} send={send} busy={busy}/>;
    case 'operations_editor':return <OperationsEditor node={node} send={send} busy={busy}/>;
    case 'columns':return <div className={`columns ${node.children?.length===5||node.children?.length===7?'compact-grid':''}`} style={{gridTemplateColumns:(node.weights??[]).map((w:number)=>`${w}fr`).join(' ')}}>{kids}</div>;
    case 'column':return <div className="column">{kids}</div>;
    case 'toolbar':return <div className="work-toolbar">{kids}</div>;
    case 'form':return <div className="form card">{kids}</div>;
    case 'container':return <div className={node.border?'card':'region'}>{kids}</div>;
    case 'tabs':return <div>{kids}</div>;
    case 'tab':return <section><h3>{node.label}</h3>{kids}</section>;
    case 'expander':return <details className="card" open={node.expanded}><summary>{node.label}</summary><div className="expander-body">{kids}</div></details>;
    case 'dialog':return <Dialog.Root open onOpenChange={open=>{if(!open&&!busy)void send('close_dialog',{});}}><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal" onPointerDownOutside={event=>{if(busy)event.preventDefault();}} onEscapeKeyDown={event=>{if(busy)event.preventDefault();}}><Dialog.Title className="modal-title">{node.label}</Dialog.Title><Dialog.Description className="sr-only">선택 수업의 정보를 확인하고 작업하세요.</Dialog.Description><Dialog.Close asChild><Button className="modal-close" variant="ghost" aria-label="닫기"><X size={19}/></Button></Dialog.Close><div className="modal-body">{kids}</div></Dialog.Content></Dialog.Root>;
    case 'title':case 'header':return <h2>{node.label}</h2>;
    case 'subheader':return <h3>{node.label}</h3>;
    case 'caption':return <p className="caption">{node.label}</p>;
    case 'divider':return <hr/>;
    case 'metric':return <div className="metric"><span>{node.label}</span><strong>{String(node.value??'')}</strong>{node.delta&&<small>{String(node.delta)}</small>}</div>;
    case 'html':case 'markdown':return <div className="prose" dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(node.kind==='html'?node.label??'':marked.parse(node.label??'',{async:false}),{FORBID_TAGS:['style','script','iframe','link'],FORBID_ATTR:['style']})}}/>;
    case 'info':case 'warning':case 'error':case 'success':case 'toast': {const Icon=icons[node.kind];return <div className={`notice ${node.kind}`} role={node.kind==='error'?'alert':'status'}><Icon size={17}/><span>{node.label}</span></div>;}
    case 'button':return <Button title={node.help} disabled={disabled} variant={node.type==='primary'?'default':'outline'} className={node.width==='stretch'?'stretch':''} onClick={()=>void send('control',{control:node.id,values:values()})}>{busy&&node.type==='primary'?<LoaderCircle size={15} className="spin"/>:null}{node.label}</Button>;
    case 'text_input':case 'text_area':return <label className="field" htmlFor={id}><span>{node.label}</span>{node.kind==='text_area'?<textarea id={id} value={String(value)} disabled={disabled} onChange={e=>update(e.target.value)}/>:<input id={id} value={String(value)} disabled={disabled} placeholder={node.placeholder} onChange={e=>update(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void send('control',{control:node.id,values:values()});}}/>}{node.help&&<small>{node.help}</small>}</label>;
    case 'checkbox':return <label className="check"><input type="checkbox" disabled={disabled} checked={Boolean(value)} onChange={e=>update(e.target.checked,true)}/><span>{node.label}</span></label>;
    case 'radio':return <fieldset className="field"><legend>{node.label_visibility==='collapsed'?'':node.label}</legend><div className="segments">{node.options?.map(o=><Button key={o.value} disabled={disabled} aria-pressed={value===o.value} variant={value===o.value?'default':'outline'} onClick={()=>update(o.value,true)}>{o.label}</Button>)}</div></fieldset>;
    case 'selectbox':if(node.id==='exam_page')return null;return <div className="field"><label htmlFor={id}>{node.label}</label>{(node.options?.length??0)>8&&<input aria-label={`${node.label} 검색`} placeholder="검색하여 선택" value={optionQuery} onChange={e=>setOptionQuery(e.target.value)}/>}<select id={id} value={value??''} disabled={disabled} onChange={e=>update(Number(e.target.value),true)}>{node.options?.filter(o=>o.label.includes(optionQuery)||o.value===value).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>{node.help&&<small>{node.help}</small>}</div>;
    case 'number_input':return <label className="field"><span>{node.label}</span><input type="number" min={node.min_value} max={node.max_value} step={node.step??1} value={value} disabled={disabled} onChange={e=>update(Number(e.target.value))}/></label>;
    case 'time_input':return <label className="field"><span>{node.label}</span><input type="time" value={String(value)} disabled={disabled} onChange={e=>update(e.target.value)}/></label>;
    case 'multiselect':return <fieldset className="field"><legend>{node.label}</legend>{node.options?.map(o=><label key={o.value}><input type="checkbox" disabled={disabled} checked={(value as number[]).includes(o.value)} onChange={e=>update(e.target.checked?[...(value as number[]),o.value]:(value as number[]).filter(v=>v!==o.value))}/>{o.label}</label>)}</fieldset>;
    case 'date_input':return <label className="field"><span>{node.label}</span><input type="date" value={String(value)} disabled={disabled} onChange={e=>update(e.target.value,true)}/></label>;
    case 'calendar':return <Calendar node={node} send={send} busy={busy} values={values}/>;
    case 'slider':return <label className="field"><span>{node.label} <strong>{String(value)}</strong></span><input type="range" min={node.min_value} max={node.max_value} step={node.step} disabled={disabled} value={Number(value)} onChange={e=>update(Number(e.target.value))} onPointerUp={()=>void send('control',{control:node.id,values:values()})} onKeyUp={()=>void send('control',{control:node.id,values:values()})}/></label>;
    case 'table':case 'editor':return <DataGrid node={node} send={send} busy={busy}/>;
    case 'download':return <div><Button disabled={busy||progress!==null} onClick={()=>void download()}><Download size={16}/>{node.label}{progress!==null?` ${progress}%`:''}</Button>{fileError&&<p role="status">{fileError}</p>}</div>;
    case 'upload':return <label className="upload-zone"><Upload size={25}/><strong>{node.label}</strong><span>PDF · PNG · JPG · WEBP / 최대 50MB</span><input aria-label={node.label} type="file" accept={node.types.map((t:string)=>'.'+t).join(',')} disabled={busy||progress!==null} onChange={e=>void upload(e.target.files?.[0])}/>{progress!==null&&<progress value={progress} max={100}/>}<small role="status">{fileError||(node.file_name?`${node.file_name} · 업로드 완료`:'파일을 선택하여 업로드하세요.')}</small></label>;
    case 'chart':return <div className="card chart">{node.table?.rows.map((row:any,i:number)=>{const [label,count]=Object.values(row);const max=Math.max(1,...node.table!.rows.map((r:any)=>Number(Object.values(r)[1])));return <div className="bar-row" key={i}><span>{String(label)}</span><div><i style={{width:`${Number(count)/max*100}%`}}/></div><strong>{String(count)}</strong></div>;})}</div>;
    default:return <div role="alert" className="notice error"><FileText size={16}/>지원되지 않는 화면 요소: {node.kind}</div>;
  }
}

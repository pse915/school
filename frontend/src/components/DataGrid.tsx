import {useMemo,useState} from 'react';
import {getCoreRowModel,useReactTable,flexRender,type ColumnDef} from '@tanstack/react-table';
import {Search,Plus,Trash2} from 'lucide-react';
import type {Send,ViewNode} from '../types';
import {useDrafts} from '../store';
import {Button} from './ui';

export function DataGrid({node,send,busy}:{node:ViewNode;send:Send;busy:boolean}) {
  const saved=useDrafts(s=>s.values[node.id]); const set=useDrafts(s=>s.set);
  const [query,setQuery]=useState('');
  const editable=node.kind==='editor';
  const draggable=node.selection_mode==='single-cell' && /^(exchange_weekly_matrix|test_week_preview)__/.test(node.id);
  const rows:Record<string,any>[]=editable?(saved??node.table?.rows??[]):node.table?.rows??[];
  const columns=node.table?.columns??[];
  const data=useMemo(()=>rows.map((row,index)=>({...row,__index:index})).filter(row=>!query||Object.values(row).some(v=>String(v??'').includes(query))),[rows,query]);
  function change(row:number,column:string,value:any) {
    const next=rows.map((item,index)=>index===row?{...item,[column]:value}:item);set(node.id,next);
  }
  async function select(row:number,col:string) {
    if(busy||node.on_select!=='rerun')return;
    const old=node.selection??{rows:[],cells:[]};
    const isRow=String(node.selection_mode).includes('row');
    let cells:[number,string][]=[[row,col]];
    if(node.selection_mode==='multi-cell')cells=old.cells.some((c:[number,string])=>c[0]===row&&c[1]===col)?old.cells.filter((c:[number,string])=>c[0]!==row||c[1]!==col):[...old.cells,[row,col]];
    await send('control',{control:node.id,values:{[node.id]:{rows:isRow?[row]:[],cells:isRow?[]:cells}}});
  }
  const defs:ColumnDef<Record<string,any>>[]=columns.map(column=>({id:column,accessorKey:column,header:node.column_config?.[column]?.label??column,
    cell:({row,getValue})=>{
      const index=row.original.__index as number;const value=getValue();const cc=node.column_config?.[column]??{};
      if(editable && node.disabled!==true && !node.disabled?.includes?.(column)){
        const label=`${index+1}행 ${column}`;
        if(cc.kind==='CheckboxColumn'||typeof value==='boolean')return <input aria-label={label} type="checkbox" checked={Boolean(value)} onChange={e=>change(index,column,e.target.checked)}/>;
        if(cc.kind==='SelectboxColumn')return <select aria-label={label} value={String(value??'')} onChange={e=>change(index,column,e.target.value)}><option value="">선택</option>{cc.options?.map((v:string)=><option key={v}>{v}</option>)}</select>;
        return <input aria-label={label} type={cc.kind==='DateColumn'?'date':cc.kind==='NumberColumn'?'number':'text'} value={value==null?'':String(value)} min={cc.min_value} max={cc.max_value} step={cc.step} onChange={e=>change(index,column,cc.kind==='NumberColumn'?e.target.value===''?null:Number(e.target.value):e.target.value)}/>;
      }
      const text=String(value??'');const selected=(node.selection?.cells??[]).some((c:[number,string])=>c[0]===index&&c[1]===column)||(node.selection?.rows??[]).includes(index);
      const status=text.includes('🧪')?'test':text.includes('🔄')?'swap':text.includes('🟢')?'sub':text.includes('🟡')?'part':text.includes('[결강]')?'absence':'';
      return node.on_select==='rerun'?<button className={`cell ${status} ${selected?'selected':''}`} disabled={busy} draggable={draggable&&Boolean(text)&&column!==columns[0]} onDragStart={e=>e.dataTransfer.setData('application/timetable-cell',JSON.stringify([index,column]))} onDragOver={e=>{if(draggable)e.preventDefault();}} onDrop={e=>{if(!draggable)return;e.preventDefault();const raw=e.dataTransfer.getData('application/timetable-cell');if(raw)void send('preview_swap',{control:node.id,source:JSON.parse(raw),target:[index,column]});}} aria-pressed={selected} aria-label={`${row.original[columns[0]]??index+1} ${column}: ${text||'공강'}`} onClick={()=>void select(index,column)}>{text||<span className="empty-cell">—</span>}</button>:<span className={`cell-read ${status}`}>{text||'—'}</span>;
    }
  }));
  const table=useReactTable({data,columns:defs,getCoreRowModel:getCoreRowModel()});
  return <section className={`grid-card ${editable?'editable':''}`}>
    <div className="grid-top"><span>{rows.length}개 항목</span><label className="table-search"><Search size={14}/><input aria-label="표 검색" placeholder="표에서 찾기" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <div className="table-scroll" style={{maxHeight:node.height??680}}><table><thead>{table.getHeaderGroups().map(group=><tr key={group.id}>{group.headers.map(header=><th key={header.id}>{flexRender(header.column.columnDef.header,header.getContext())}</th>)}{editable&&node.num_rows==='dynamic'&&<th>삭제</th>}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row=><tr key={row.id}>{row.getVisibleCells().map(cell=><td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>)}{editable&&node.num_rows==='dynamic'&&<td><Button variant="ghost" aria-label={`${Number(row.original.__index)+1}행 삭제`} onClick={()=>set(node.id,rows.filter((_,i)=>i!==row.original.__index))}><Trash2 size={14}/></Button></td>}</tr>)}</tbody></table>{!data.length&&<p className="empty-state">{query?'검색 결과가 없습니다.':'표시할 자료가 없습니다.'}</p>}</div>
    {editable&&node.num_rows==='dynamic'&&<Button onClick={()=>{const row=Object.fromEntries(columns.map(c=>{const cc=node.column_config?.[c]??{};return [c,cc.default??(cc.kind==='CheckboxColumn'?false:cc.kind==='NumberColumn'?0:'')]}));set(node.id,[...rows,row]);}}><Plus size={15}/>행 추가</Button>}
    {editable&&<div className="grid-note">수정 후 해당 화면의 저장 또는 계산 버튼을 눌러 반영하세요.</div>}
  </section>;
}

// @vitest-environment jsdom
import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {App} from '../App';
import type {Snapshot,Send} from '../types';
const lesson={id:'one',period:1,duration:1,label:'물리',teacher_ids:['T1'],class_ids:['1-1'],room_id:'R1',status:'scheduled'};
const node={id:'ops',kind:'operations_editor',day:'2026-10-12',revision:0,max_period:4,classes:[{id:'1-1',name:'1-1'}],lessons:[lesson],preview:{token:'verified',reason:'합성 변경',kind:'move',before:{'2026-10-12':[lesson]},after:{'2026-10-12':[{...lesson,period:4}]}}};
const data:Snapshot={nodes:[node],dataVersion:'1',response:null,user:{id:'test',name:'합성',role:'마스터'},loggedIn:true,school:'QA',date:'2026-10-23',theme:'light',font:'Inter',fontOptions:{Inter:'sans-serif'},writable:false,activeTab:'학기 중 운영'};
afterEach(cleanup);
function mount(send:Send){vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));render(<App data={data} transport={send}/>);}
test('network rejection settles pending state and preserves root and modal',async()=>{
 const send=vi.fn().mockRejectedValue(new Error('network failure'));mount(send);
 fireEvent.click(screen.getByRole('button',{name:'확인 후 승인요청 제출'}));
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('network failure'));
 expect(screen.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toBeTruthy();
 expect(screen.getByRole('region',{name:'학기 중 시간표 편집기'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'미리보기 취소'}));
 await waitFor(()=>expect(send).toHaveBeenCalledTimes(2));
});
test('delayed confirmation suppresses rapid duplicate clicks',async()=>{
 let finish:(v:unknown)=>void=()=>{};
 const send=vi.fn().mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));mount(send);
 const button=screen.getByRole('button',{name:'확인 후 승인요청 제출'});
 fireEvent.click(button);fireEvent.click(button);expect(send).toHaveBeenCalledTimes(1);
 finish({success:true,result:{},requestId:'r',dataVersion:'2'});
 await waitFor(()=>expect(button.hasAttribute('disabled')).toBe(false));
});

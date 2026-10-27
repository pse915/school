// @vitest-environment jsdom
import {afterEach,expect,test,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {App} from '../App';
import type {Snapshot} from '../types';
const node={id:'semester',kind:'semester_editor',candidate_id:'candidate',grid:{월:3,화:3},lessons:[{id:'L1',label:'과학',start:'월1',duration:1,teachers:'교사',room:'실1',locked:false}],preview:{token:'verified',before:[{session_id:'L1',start:'월1'}],after:[{session_id:'L1',start:'화1'}]}};
const data:Snapshot={nodes:[node],dataVersion:'1',response:null,user:{id:'admin',name:'합성교사',role:'마스터'},loggedIn:true,school:'합성학교',date:'2026-10-26',theme:'light',font:'Inter',fontOptions:{Inter:'sans-serif'},writable:false,activeTab:'학기 시간표 편성'};
afterEach(cleanup);
test('semester network failure leaves the editor and close controls mounted',async()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
 const transport=vi.fn().mockRejectedValue(new Error('offline'));render(<App data={data} transport={transport}/>);
 fireEvent.click(screen.getByRole('button',{name:'검증된 편집을 새 후보로 저장'}));await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('offline'));
 expect(screen.getByRole('region',{name:'학기 시간표 편집기'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'학기 편집 취소'}));await waitFor(()=>expect(transport).toHaveBeenCalledTimes(2));
 expect(screen.queryByRole('heading',{name:'학기 시간표 변경 미리보기'})).toBeNull();
 expect(screen.getByRole('region',{name:'학기 시간표 편집기'})).toBeTruthy();
});
test('semester pending edit does not submit duplicate clicks',async()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
 let finish:(v:unknown)=>void=()=>{};const transport=vi.fn().mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));render(<App data={data} transport={transport}/>);
 const button=screen.getByRole('button',{name:'검증된 편집을 새 후보로 저장'});fireEvent.click(button);fireEvent.click(button);expect(transport).toHaveBeenCalledTimes(1);
 finish({success:true,result:{},requestId:'r',dataVersion:'2'});await waitFor(()=>expect(button.hasAttribute('disabled')).toBe(false));
});

// @vitest-environment jsdom
import {afterEach,expect,test,vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import renderComponent from '../component';
import type {Snapshot} from '../types';
const snapshot:Snapshot={nodes:[{id:'login',kind:'text_input',label:'아이디',value:''}],dataVersion:'0',response:null,user:{id:null,name:'',role:'게스트'},loggedIn:false,school:'합성학교',date:'2026-10-22',theme:'light',font:'Inter',fontOptions:{Inter:'sans-serif'},writable:false,activeTab:undefined,swapPreview:null};
const disposers:Array<()=>void>=[];
afterEach(()=>{disposers.splice(0).forEach(fn=>fn());document.body.innerHTML='';});
test('real entry renderer mounts login in a Streamlit shadow root',async()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
  const host=document.createElement('div');document.body.appendChild(host);const shadow=host.attachShadow({mode:'open'});shadow.innerHTML='<div id="timetable-root"></div>';
  const dispose=renderComponent({parentElement:shadow,data:snapshot,setStateValue:vi.fn(),setTriggerValue:vi.fn(),key:'startup',name:'startup'});disposers.push(dispose);
  await waitFor(()=>expect(shadow.querySelector('input')).not.toBeNull());
});

test('bootstrap failures leave an actionable alert instead of an empty root',()=>{
  const log=vi.spyOn(console,'error').mockImplementation(()=>{});
  const host=document.createElement('div');document.body.appendChild(host);host.innerHTML='<div id="timetable-root"></div>';
  const dispose=renderComponent({parentElement:host,data:{} as Snapshot,setStateValue:vi.fn(),setTriggerValue:vi.fn(),key:'bad',name:'bad'});disposers.push(dispose);
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('초기화에 실패');log.mockRestore();
});
test('ready acknowledgment is sent after React mounts and only once per release',async()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
  const host=document.createElement('div');document.body.appendChild(host);host.innerHTML='<div id="timetable-root"></div>';const send=vi.fn();
  const args={parentElement:host,data:{...snapshot,frontendRelease:'release-a'},setStateValue:send,setTriggerValue:vi.fn(),key:'ready',name:'ready'};
  disposers.push(renderComponent(args));await waitFor(()=>expect(send).toHaveBeenCalledWith('ready','release-a'));
  renderComponent({...args,data:{...args.data,dataVersion:'1'}});await waitFor(()=>expect(host.querySelector('input')).not.toBeNull());expect(send).toHaveBeenCalledTimes(1);
});

// @vitest-environment jsdom
import {afterEach,expect,test,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {App} from '../App';
import {NodeRenderer} from './NodeRenderer';
import {useDrafts} from '../store';
import type {Snapshot,Send} from '../types';
afterEach(()=>{cleanup();useDrafts.getState().clear();});
const snapshot:Snapshot={nodes:[{id:'navigation',kind:'navigation',tabs:['시간표 조회','시험감독 관리','고교학점제']},
{id:'credit_page',kind:'selectbox',label:'고교학점제 업무',value:0,options:['수강신청 관리','학생명렬·선택과목','신청 현황','자동 이동반 편성','학생별 시간표','편성 확정·출력'].map((label,value)=>({label,value}))}],dataVersion:'1',response:null,user:{id:'tester',name:'합성교사',role:'마스터'},loggedIn:true,school:'합성학교',date:'2026-10-23',theme:'light',font:'Inter',fontOptions:{Inter:'sans-serif'},writable:false,activeTab:'고교학점제'};
test('credit menu keeps existing timetable and exam menus and all six pages',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
  render(<App data={snapshot} transport={vi.fn()}/>);
  expect(screen.getByRole('button',{name:'시간표 조회'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'시험감독 관리'})).toBeTruthy();
  expect(screen.getAllByRole('option')).toHaveLength(6);
  expect(screen.getByRole('button',{name:'고교학점제'})).toBeTruthy();
});
test('new numeric/time/multiple choice controls use the existing draft store',()=>{
  const send=vi.fn() as Send;
  for(const node of [
    {id:'n',kind:'number_input',label:'정원',value:32,min_value:1},
    {id:'t',kind:'time_input',label:'시각',value:'09:00'},
    {id:'m',kind:'multiselect',label:'과목',value:[],options:[{value:0,label:'물리'}]}
  ])render(<NodeRenderer node={node} send={send} busy={false} values={()=>({})}/>);
  fireEvent.change(screen.getByRole('spinbutton'),{target:{value:'30'}});
  fireEvent.click(screen.getByRole('checkbox'));
  expect(useDrafts.getState().values.n).toBe(30);
  expect(useDrafts.getState().values.m).toEqual([0]);
  expect(screen.queryByText(/지원되지 않는 화면 요소/)).toBeNull();
});

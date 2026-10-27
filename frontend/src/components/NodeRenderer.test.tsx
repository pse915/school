// @vitest-environment jsdom
import {render,fireEvent,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {NodeRenderer} from './NodeRenderer';
import {useDrafts,useTransfers} from '../store';
afterEach(()=>{cleanup();useDrafts.getState().clear();useTransfers.getState().clear();});
test('text draft survives rerender and is included in the action',()=>{
  const send=vi.fn().mockResolvedValue({success:true});const values=()=>useDrafts.getState().values;
  render(<NodeRenderer node={{id:'name',kind:'text_input',label:'이름',value:''}} send={send} busy={false} values={values}/>);
  fireEvent.change(screen.getByLabelText('이름'),{target:{value:'교사'}});
  render(<NodeRenderer node={{id:'save',kind:'button',label:'저장'}} send={send} busy={false} values={values}/>);
  fireEvent.click(screen.getByText('저장'));
  expect(send).toHaveBeenCalledWith('control',{control:'save',values:{name:'교사'}});
});
test('table cell selection sends original row and column',()=>{
  const send=vi.fn().mockResolvedValue({success:true});
  render(<NodeRenderer node={{id:'table',kind:'table',table:{columns:['교사명','월1'],rows:[{'교사명':'교사','월1':'1-1 국어'}]},on_select:'rerun',selection_mode:'single-cell'}} send={send} busy={false} values={()=>({})}/>);
  fireEvent.click(screen.getByRole('button',{name:'교사 월1: 1-1 국어'}));
  expect(send).toHaveBeenCalledWith('control',{control:'table',values:{table:{rows:[],cells:[[0,'월1']]}}});
});
test('external HTML is sanitized before rendering',()=>{
  const {container}=render(<NodeRenderer node={{id:'html',kind:'html',label:'<img src=x onerror="alert(1)"><script>alert(2)</script>'}} send={vi.fn()} busy={false} values={()=>({})}/>);
  expect(container.querySelector('script')).toBeNull();expect(container.querySelector('img')?.getAttribute('onerror')).toBeNull();
});
test('busy state prevents duplicate action clicks',()=>{
  const send=vi.fn();render(<NodeRenderer node={{id:'save',kind:'button',label:'저장'}} send={send} busy values={()=>({})}/>);
  fireEvent.click(screen.getByText('저장'));expect(send).not.toHaveBeenCalled();
});
test('late transfer callbacks cannot restore private file labels after logout',()=>{
  const epoch=useTransfers.getState().epoch;
  useTransfers.getState().set('upload',{message:'private.pdf',progress:30},epoch);
  useTransfers.getState().clear();
  useTransfers.getState().set('upload',{message:'private.pdf',progress:100},epoch);
  expect(useTransfers.getState().items).toEqual({});
});

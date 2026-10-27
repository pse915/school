import {create} from 'zustand';
interface Drafts {values: Record<string,any>; set:(key:string,value:any)=>void; clear:()=>void}
export const useDrafts=create<Drafts>(set=>({values:{},set:(key,value)=>set(s=>({values:{...s.values,[key]:value}})),clear:()=>set({values:{}})}));
interface Shell {collapsed:boolean;search:string;settings:boolean;update:(value:Partial<Omit<Shell,'update'>>)=>void}
export const useShell=create<Shell>(set=>({collapsed:typeof window!=='undefined'&&window.innerWidth<=1024,search:'',settings:false,update:value=>set(value)}));
interface Transfers {epoch:number;items:Record<string,{progress?:number|null;message?:string}>;set:(id:string,patch:{progress?:number|null;message?:string},epoch:number)=>void;clear:()=>void}
export const useTransfers=create<Transfers>(set=>({epoch:0,items:{},set:(id,patch,epoch)=>set(s=>s.epoch===epoch?{items:{...s.items,[id]:{...s.items[id],...patch}}}:s),clear:()=>set(s=>({items:{},epoch:s.epoch+1}))}));
interface OperationsEditorState {selected:string|null;day:string;choose:(day:string,selected:string|null)=>void}
export const useOperationsEditor=create<OperationsEditorState>(set=>({selected:null,day:'',choose:(day,selected)=>set({day,selected})}));
interface SemesterEditorState {candidate:string;selected:string|null;choose:(candidate:string,selected:string|null)=>void}
export const useSemesterEditor=create<SemesterEditorState>(set=>({candidate:'',selected:null,choose:(candidate,selected)=>set({candidate,selected})}));

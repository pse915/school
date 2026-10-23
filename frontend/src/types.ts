export interface ViewNode {
  id: string; kind: string; label?: string; children?: ViewNode[];
  value?: any; options?: {label: string; value: number}[];
  table?: {columns: string[]; rows: Record<string, any>[]};
  selection?: {rows: number[]; cells: [number,string][]};
  [key: string]: any;
}
export interface ResponseEnvelope {
  operation: string; requestId: string; success: boolean;
  result: any; error?: {code:string;message:string}; dataVersion: string;
}
export interface Snapshot {
  frontendRelease?:string;
  nodes: ViewNode[]; dataVersion: string; response: ResponseEnvelope | null;
  user: {id: string | null; name: string; role: string};
  loggedIn: boolean; school: string; date: string; theme: 'light'|'black';
  font: string; fontOptions: Record<string,string>; writable: boolean; activeTab?: string;
  planning?: {
    available: boolean; active: boolean; project?: Record<string,any> | null;
    enrollmentSnapshot?: Record<string,any>|null; sectionPlan?: Record<string,any>|null;
    result?: Record<string,any>|null; dirty?:boolean; savedRevision?:number;
    writable?:boolean; warning?:string; lastEngine?:string|null;
  };
  swapPreview?: {token:string;a:Record<string,any>;b:Record<string,any>;test:boolean}|null;
}
export interface RequestEnvelope {
  operation: string; requestId: string; payload: Record<string,any>; dataVersion: string;
}
export type Send = (operation: string, payload: Record<string,any>) => Promise<ResponseEnvelope>;
export function flatten(nodes: ViewNode[]): ViewNode[] {
  return nodes.flatMap(node => [node,...flatten(node.children ?? [])]);
}

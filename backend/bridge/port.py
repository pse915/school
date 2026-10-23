"""Server-driven React view port for every UI primitive used by the source.

Only allowlisted, currently rendered controls accept input. Callbacks never
cross the wire. Unknown UI primitives fail loudly instead of silently vanishing.
"""
import copy
import hashlib
import inspect
import io
import re
import threading
import time
from contextlib import contextmanager
from datetime import date
from functools import wraps
from types import SimpleNamespace

import pandas as pd
from backend.bridge.serialization import wire

class Halt(BaseException):
    pass

class Rerender(BaseException):
    pass

class State(dict):
    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError as exc:
            raise AttributeError(key) from exc
    def __setattr__(self, key, value):
        self[key] = value

class Region:
    def __init__(self, port, node):
        self.port, self.node = port, node
    def __enter__(self):
        self.port.stack.append(self.node['children'])
        return self
    def __exit__(self, *args):
        self.port.stack.pop()
    def __getattr__(self, name):
        def scoped(*args, **kwargs):
            with self:
                return getattr(self.port, name)(*args, **kwargs)
        return scoped

class Columns:
    def __getattr__(self, kind):
        return lambda label=None, **kwargs: {'kind': kind, 'label': label, **wire(kwargs)}

_failure_store = {'lock': threading.Lock(), 'failures': {}}

class ReactPort:
    def __init__(self, state=None, secrets=None, context=None):
        self.session_state = state if state is not None else State()
        self.secrets = secrets if secrets is not None else {}
        self.context = context or SimpleNamespace(headers={})
        self.column_config = Columns()
        self.cache = {}
        self.widget_defaults = {}
        self.editor_defaults = {}
        self.active_dialog = None
        self.dialog_called = False
        self.reset()

    def reset(self, event=None):
        self.nodes, self.controls, self.counts = [], {}, {}
        self.stack = [self.nodes]
        self.event = event
        self.dialog_called = False

    def _id(self, kind, label='', key=None):
        frame = inspect.currentframe().f_back
        while frame and 'timetable_app2_original.py' not in frame.f_code.co_filename:
            frame = frame.f_back
        line = frame.f_lineno if frame else 0
        base = str(key) if key is not None else f'{kind}:{line}:{label}'
        count = self.counts.get(base, 0)
        self.counts[base] = count + 1
        return base if count == 0 else f'{base}:{count}'

    def emit(self, kind, label='', **props):
        node = {'id': self._id(kind, label, props.get('key')), 'kind': kind, 'label': str(label), **wire(props)}
        self.stack[-1].append(node)
        return node

    def set_page_config(self, **kwargs):
        pass

    def stop(self):
        raise Halt()

    def rerun(self, **kwargs):
        raise Rerender()

    def cache_data(self, func=None, **kwargs):
        def decorate(fn):
            name = fn.__name__
            @wraps(fn)
            def cached(*args, **kw):
                cache = self.cache.setdefault(name, {})
                digest = hashlib.sha256(repr((args, kw)).encode()).hexdigest()
                now = time.monotonic()
                if digest in cache and now-cache[digest][0] < kwargs.get('ttl', 300):
                    return copy.deepcopy(cache[digest][1])
                result = fn(*args, **kw)
                cache[digest] = (now, copy.deepcopy(result))
                if len(cache) > 128:
                    cache.pop(next(iter(cache)))
                return result
            cached.clear = lambda: self.cache.pop(name, None)
            return cached
        return decorate(func) if func else decorate

    def cache_resource(self, func=None, **kwargs):
        def decorate(fn):
            @wraps(fn)
            def cached(*args, **kw):
                if fn.__name__ == '_login_failure_store':
                    return _failure_store
                bucket = self.cache.setdefault('resource:'+fn.__name__, {})
                key = repr((args,kw))
                if key not in bucket:
                    bucket[key] = fn(*args,**kw)
                return bucket[key]
            cached.clear = lambda: self.cache.pop('resource:'+fn.__name__, None)
            return cached
        return decorate(func) if func else decorate

    def fragment(self, func=None, **kwargs):
        return func if func else lambda f: f

    def dialog(self, label, **kwargs):
        def decorate(fn):
            @wraps(fn)
            def show(*args, **kw):
                self.active_dialog = (fn.__name__, args, kw, label)
                self.dialog_called = True
                with self._region('dialog', label):
                    return fn(*args, **kw)
            return show
        return decorate

    def _region(self, kind, label='', **kwargs):
        node = self.emit(kind, label, children=[], **kwargs)
        return Region(self, node)

    def container(self, **kwargs):
        return self._region('container', **kwargs)
    def form(self, key, **kwargs):
        return self._region('form', key, key=key, **kwargs)
    def expander(self, label, **kwargs):
        return self._region('expander', label, **kwargs)
    def popover(self, label, **kwargs):
        return self._region('expander', label, **kwargs)
    def empty(self):
        return self._region('container')
    def columns(self, spec, **kwargs):
        weights = [1]*spec if isinstance(spec,int) else list(spec)
        node = self.emit('columns', children=[], weights=weights)
        result=[]
        for weight in weights:
            child={'id': self._id('column'), 'kind':'column', 'children':[], 'weight':weight}
            node['children'].append(child)
            result.append(Region(self, child))
        return result
    def tabs(self, labels):
        node = self.emit('tabs', children=[])
        result=[]
        for label in labels:
            child={'id':self._id('tab',label), 'kind':'tab','label':label,'children':[]}
            node['children'].append(child)
            result.append(Region(self,child))
        return result
    @contextmanager
    def spinner(self, label, **kwargs):
        yield

    def markdown(self, body, unsafe_allow_html=False, **kwargs):
        text=str(body)
        # Discard old Streamlit CSS, but retain meaningful text/markup for React.
        text=re.sub(r'<style\b[^>]*>.*?</style>', '', text, flags=re.S|re.I)
        text=re.sub(r'<link\b[^>]*>', '', text, flags=re.I)
        if text.strip() and not re.fullmatch(r'\s*</?div[^>]*>\s*',text):
            self.emit('html' if unsafe_allow_html else 'markdown',text)

    def title(self, text, **kw): self.emit('title',text)
    def header(self, text, **kw): self.emit('header',text)
    def subheader(self, text, **kw): self.emit('subheader',text)
    def caption(self, text, **kw): self.emit('caption',text)
    def write(self, *args, **kw):
        for arg in args:
            self.dataframe(arg) if isinstance(arg,pd.DataFrame) else self.emit('markdown',str(arg))
    def info(self, text, **kw): self.emit('info',text)
    def error(self, text, **kw): self.emit('error',text)
    def warning(self, text, **kw): self.emit('warning',text)
    def success(self, text, **kw): self.emit('success',text)
    def toast(self, text, **kw): self.emit('toast',text)
    def divider(self, **kw): self.emit('divider')
    def metric(self, label, value, delta=None, **kw): self.emit('metric',label,value=value,delta=delta)

    def _widget(self, kind, label, value, key=None, decoder=None, **kwargs):
        wid=self._id(kind,label,key)
        state_key=key if key is not None else '_control_'+wid
        default=wire(value)
        if state_key not in self.session_state or wid in self.widget_defaults and self.widget_defaults[wid]!=default:
            self.session_state[state_key]=value
        self.widget_defaults[wid]=default
        value=self.session_state[state_key]
        node={'id':wid,'kind':kind,'label':str(label),'value':wire(value),**wire({k:v for k,v in kwargs.items() if k not in ('on_change','on_click','args','kwargs','format_func')})}
        self.stack[-1].append(node)
        self.controls[wid]={'node':node,'state_key':state_key,'decoder':decoder or (lambda x:x),'callback':kwargs.get('on_change'),'args':kwargs.get('args',()),'kwargs':kwargs.get('kwargs',{})}
        return value

    def text_input(self,label,value='',**kw):
        return self._widget('text_input',label,value,decoder=lambda x:str(x)[:kw.get('max_chars',10000)],**kw)
    def text_area(self,label,value='',**kw):
        return self._widget('text_area',label,value,decoder=lambda x:str(x)[:100000],**kw)
    def checkbox(self,label,value=False,**kw):
        def decode(x):
            if not isinstance(x,bool): raise ValueError('체크 값이 올바르지 않습니다.')
            return x
        return self._widget('checkbox',label,value,decoder=decode,**kw)
    def selectbox(self,label,options,index=0,format_func=str,**kw):
        choices=list(options)
        initial=choices[index] if choices and index is not None and 0<=index<len(choices) else None
        def decode(x):
            if type(x) is not int or not 0<=x<len(choices): raise ValueError('목록에 없는 값입니다.')
            return choices[x]
        value=self._widget('selectbox',label,initial,decoder=decode,options=[{'label':str(format_func(v)), 'value':i} for i,v in enumerate(choices)],**kw)
        if choices and value not in choices:
            value=initial
            self.session_state[self.controls[next(reversed(self.controls))]['state_key']]=value
        node=self.controls[next(reversed(self.controls))]['node']
        node['value']=choices.index(value) if value in choices else None
        return value
    def radio(self,label,options,index=0,**kw):
        result=self.selectbox(label,options,index=index,**kw)
        self.controls[next(reversed(self.controls))]['node']['kind']='radio'
        return result
    def date_input(self,label,value=None,**kw):
        return self._widget('date_input',label,value or date.today(),decoder=lambda x:date.fromisoformat(str(x)),**kw)
    def slider(self,label,min_value=0,max_value=100,value=None,step=1,**kw):
        def decode(x):
            if not isinstance(x,(int,float)) or isinstance(x,bool) or not min_value<=x<=max_value: raise ValueError('범위를 벗어난 값입니다.')
            return int(x) if isinstance(min_value,int) else float(x)
        return self._widget('slider',label,value if value is not None else min_value,decoder=decode,min_value=min_value,max_value=max_value,step=step,**kw)
    def button(self,label,key=None,on_click=None,args=(),kwargs=None,**kw):
        wid=self._id('button',label,key)
        node={'id':wid,'kind':'button','label':str(label),**wire(kw)}
        self.stack[-1].append(node)
        self.controls[wid]={'node':node,'callback':on_click,'args':args,'kwargs':kwargs or {}}
        return bool(self.event and self.event.get('control')==wid and not kw.get('disabled',False))
    def form_submit_button(self,label,**kw):
        return self.button(label,**kw)

    def dataframe(self,data,**kw):
        df=data.data if hasattr(data,'data') and isinstance(data.data,pd.DataFrame) else data
        if not isinstance(df,pd.DataFrame): df=pd.DataFrame(df)
        wid=self._id('table','',kw.get('key'))
        selection=self.session_state.get('_selection_'+wid,{'rows':[],'cells':[],'columns':[]})
        node={'id':wid,'kind':'table', 'table':wire(df),'selection':wire(selection),**wire(kw)}
        self.stack[-1].append(node)
        def decode(s):
            if not isinstance(s,dict): raise ValueError('잘못된 선택입니다.')
            rows=s.get('rows',[]); cells=s.get('cells',[])
            if any(type(i) is not int or not 0<=i<len(df) for i in rows): raise ValueError('행 범위 오류')
            if any(not isinstance(c,list) or len(c)!=2 or type(c[0]) is not int or not 0<=c[0]<len(df) or c[1] not in df.columns for c in cells): raise ValueError('셀 범위 오류')
            mode=kw.get('selection_mode','')
            if mode=='single-cell' and len(cells)>1: raise ValueError('한 셀만 선택하세요.')
            if mode=='single-row' and len(rows)>1: raise ValueError('한 행만 선택하세요.')
            return {'rows':rows,'cells':cells,'columns':[]}
        if kw.get('on_select')=='rerun':
            self.controls[wid]={'node':node,'state_key':'_selection_'+wid,'decoder':decode}
        return SimpleNamespace(selection=SimpleNamespace(**selection))

    def data_editor(self,data,**kw):
        df=data.copy(deep=True)
        wid=self._id('editor','',kw.get('key'))
        current_default=wire(data)
        if wid in self.editor_defaults and self.editor_defaults[wid]!=current_default:
            self.session_state.pop('_editor_'+wid,None)
        self.editor_defaults[wid]=current_default
        saved=self.session_state.get('_editor_'+wid)
        if saved is not None:
            df=saved.copy(deep=True)
        config=kw.get('column_config',{})
        def decode(rows):
            if not isinstance(rows,list) or len(rows)>10000: raise ValueError('잘못된 표입니다.')
            result=pd.DataFrame(rows,columns=data.columns)
            if kw.get('num_rows')!='dynamic' and len(result)!=len(data): raise ValueError('행 개수 변경 불가')
            disabled=kw.get('disabled',False)
            for c in result:
                cc=config.get(c,{}) or {}
                kind=cc.get('kind','')
                if kind=='DateColumn': result[c]=result[c].map(lambda x:date.fromisoformat(x) if x else None)
                if kind=='NumberColumn':
                    result[c]=pd.to_numeric(result[c],errors='raise')
                    if ((result[c]<cc.get('min_value',float('-inf'))) | (result[c]>cc.get('max_value',float('inf')))).any(): raise ValueError('숫자 범위 오류')
                if kind=='CheckboxColumn' and any(type(v) is not bool for v in result[c]): raise ValueError('체크 값 오류')
                if kind=='SelectboxColumn' and any(v not in cc.get('options',[]) for v in result[c] if v not in ('',None)): raise ValueError('목록에 없는 표 값')
                if disabled is True or isinstance(disabled,list) and c in disabled:
                    if len(result)!=len(data) or wire(result[c].tolist())!=wire(data[c].tolist()): raise PermissionError('수정 금지 열입니다.')
            return result
        node={'id':wid,'kind':'editor','table':wire(df),**wire(kw)}
        self.stack[-1].append(node)
        self.controls[wid]={'node':node,'state_key':'_editor_'+wid,'decoder':decode}
        return df

    def download_button(self,label,data,file_name=None,mime=None,**kw):
        # Downloads are binary data transported lazily in acknowledged chunks.
        wid=self._id('download',label,kw.get('key'))
        raw=data.getvalue() if hasattr(data,'getvalue') else data.encode() if isinstance(data,str) else bytes(data)
        node={'id':wid,'kind':'download','label':label,'file_name':file_name or 'download','mime':mime or 'application/octet-stream','size':len(raw)}
        self.stack[-1].append(node)
        self.controls[wid]={'node':node,'binary':raw}
        return False
    def file_uploader(self,label,type=None,**kw):
        wid=self._id('upload',label,kw.get('key'))
        existing=self.session_state.get(kw.get('key') or '_file_'+wid)
        node={'id':wid,'kind':'upload','label':label,'types':type or [],'maxBytes':50*1024*1024,'file_name':getattr(existing,'name',None),'size':getattr(existing,'size',None)}
        self.stack[-1].append(node)
        self.controls[wid]={'node':node,'state_key':kw.get('key') or '_file_'+wid}
        return self.session_state.get(self.controls[wid]['state_key'])
    def bar_chart(self,data,**kw):
        df=data.to_frame() if isinstance(data,pd.Series) else data
        self.emit('chart',table=wire(df.reset_index()))

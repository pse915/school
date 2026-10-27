"""Emit only existing v2 React view nodes; never instantiate Streamlit widgets."""
from datetime import time
import math
from backend.bridge.port import Region

class CreditPort:
    def __init__(self,port):
        self.port=port
        self.query_params={}
        self.pages=None
    def __getattr__(self,key):
        return getattr(self.port,key)
    def columns(self,spec,**kw):
        # Region delegates calls to this adapter, including number/time controls.
        return [Region(self,x.node) for x in self.port.columns(spec,**kw)]
    def selectbox(self,label,options,**kw):
        if label=='작업 메뉴' and self.pages is not None:options=self.pages
        return self.port.selectbox(label,options,**kw)
    def number_input(self,label,min_value=0,max_value=None,value=0,step=1,**kw):
        def decode(x):
            if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):raise ValueError('숫자가 필요합니다.')
            if x<min_value or max_value is not None and x>max_value:raise ValueError('숫자 범위 오류')
            if isinstance(value,int) and int(x)!=x:raise ValueError('정수가 필요합니다.')
            return int(x) if isinstance(value,int) else float(x)
        return self.port._widget('number_input',label,value,decoder=decode,min_value=min_value,max_value=max_value,step=step,**kw)
    def time_input(self,label,value=time(9),**kw):
        return self.port._widget('time_input',label,value,decoder=lambda x:time.fromisoformat(x),**kw)
    def multiselect(self,label,options,default=None,format_func=str,**kw):
        options=list(options)
        initial=[options.index(x) for x in (default or []) if x in options]
        def decode(v):
            if not isinstance(v,list) or len(v)!=len(set(v)) or any(type(i)!=int or not 0<=i<len(options) for i in v):raise ValueError('선택 목록 오류')
            return v
        indices=self.port._widget('multiselect',label,initial,decoder=decode,options=[{'value':i,'label':str(format_func(o))} for i,o in enumerate(options)],**kw)
        if any(i>=len(options) for i in indices):indices=[]
        return [options[i] for i in indices]
    def code(self,text,**kw):self.port.text_area('발급 코드',str(text),disabled=True)

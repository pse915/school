"""React date inputs preserving original weekday and Monday anchors."""
from datetime import date,timedelta

def install_calendar(program):
    ns=program.namespace;port=program.port;state=port.session_state
    def calendar_picker(label,value=None,key='calendar',help_text=None,rerun_scope=None):
        value=value or ns['_today_kst']()
        if value.weekday()>=5: value-=timedelta(days=value.weekday()-4)
        selected_key=f'_{key}_selected'
        if selected_key not in state: state[selected_key]=value
        selected=state[selected_key]
        if selected.weekday()>=5:state[selected_key]=selected-timedelta(days=selected.weekday()-4)
        def decode(raw):
            picked=date.fromisoformat(raw)
            if picked.weekday()>=5:raise ValueError('시간표 날짜는 월요일부터 금요일까지 선택하세요.')
            state[f'_{key}_month']=picked.replace(day=1)
            return picked
        return port._widget('calendar',label,value,key=selected_key,decoder=decode,week=False,help=help_text)
    def week_picker(label,value=None,key='week_picker',help_text=None,include_saturday=True):
        value=value or ns['_today_kst']()
        if value.weekday()>=5:value-=timedelta(days=value.weekday()-4)
        monday=value-timedelta(days=value.weekday())
        selected_key=f'_{key}_monday'
        def decode(raw):
            picked=date.fromisoformat(raw)
            picked-=timedelta(days=picked.weekday())
            state[f'_{key}_month']=picked.replace(day=1)
            return picked
        return port._widget('calendar',label,monday,key=selected_key,decoder=decode,week=True,help=help_text,include_saturday=include_saturday)
    ns['calendar_picker']=calendar_picker
    ns['week_picker']=week_picker

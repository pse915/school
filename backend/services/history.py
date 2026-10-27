"""Repair the baseline's invalid DataFrame.tolist fingerprint, preserving cap 5."""
import pandas as pd

def install_history(program):
    ns=program.namespace
    state=program.port.session_state
    def fingerprint(snapshot):
        return tuple((key,tuple(map(str,df.columns)),tuple(tuple(row) for row in df.fillna('').astype(str).to_numpy().tolist()))
                     for key,df in sorted(snapshot.items()) if isinstance(df,pd.DataFrame))
    def push_history(action_name='작업'):
        if 'history' not in state:
            state.history=[];state.history_index=-1
        snapshot={'action':action_name,'time':ns['_now_text'](),
                  **{key:state.get(key,pd.DataFrame()).copy(deep=True) for key in ['absences','subs','swaps','part_time','duties']},
                  'budget_df':ns['load_budget_df']().copy(deep=True) if state.get('logged_in',False) else pd.DataFrame()}
        if state.history:
            previous=state.history[state.history_index]
            if fingerprint(previous)==fingerprint(snapshot):
                previous['action']=action_name;previous['time']=snapshot['time'];return
        state.history=state.history[:state.history_index+1]
        state.history.append(snapshot);state.history_index=len(state.history)-1
        if len(state.history)>ns['MAX_HISTORY']:
            state.history.pop(0);state.history_index-=1
    ns['push_history']=push_history

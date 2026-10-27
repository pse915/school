"""In-memory Google Sheets API fixture. NOT live Google verification."""
from copy import deepcopy
import threading
class Worksheet:
    def __init__(self,title,ident,rows):self.title=title;self.id=ident;self.row_count=rows;self.values=[]
    def get_all_values(self):return deepcopy(self.values)
class Spreadsheet:
    id='direct-copy';title='Synthetic direct copy'
    def __init__(self):self.tabs=[];self.writes=0;self.fail='';self.guard=threading.Lock()
    def worksheets(self):return self.tabs[:]
    def add_worksheet(self,title,rows,cols):
        w=Worksheet(title,len(self.tabs)+1,rows);self.tabs.append(w);return w
    def batch_update(self,body):
        with self.guard:
            self.last_request=deepcopy(body)
            if self.fail=='before':self.fail='';raise OSError('synthetic before write')
            u=body['requests'][0]['updateCells'];w=next(w for w in self.tabs if w.id==u['range']['sheetId'])
            assert u['fields']=='userEnteredValue'
            w.values=[[r['values'][0]['userEnteredValue']['stringValue']] for r in u['rows']];self.writes+=1
            if self.fail=='after':self.fail='';raise OSError('synthetic lost response')
class Client:
    def __init__(self,sheet):self.sheet=sheet
    def open_by_key(self,key):assert key==self.sheet.id;return self.sheet

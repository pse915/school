"""Reproducible AST inventory. Does not execute or contact the original app."""
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'legacy/timetable_app2_original.py').read_text(encoding='utf-8-sig')
tree = ast.parse(source)
parents = {child: parent for parent in ast.walk(tree) for child in ast.iter_child_nodes(parent)}
functions = {n.name: n for n in tree.body if isinstance(n, ast.FunctionDef)}

def context(node):
    fn, menu, conditions = 'module', '공통', []
    while node in parents:
        node = parents[node]
        if isinstance(node, ast.FunctionDef) and fn == 'module':
            fn = node.name
        if isinstance(node, ast.If):
            condition = ast.unparse(node.test)
            conditions.append(condition)
            if 'tab_map' in condition:
                menu = next((x.value for x in ast.walk(node.test) if isinstance(x, ast.Constant) and isinstance(x.value, str)), menu)
    return fn, menu, conditions

def display(node):
    return ast.unparse(node).replace('|', '\\|').replace('\n', ' ')[:240]

records = []
ui = {'button','form_submit_button','text_input','text_area','selectbox','radio','checkbox','slider','date_input','dataframe','data_editor','download_button','file_uploader','bar_chart','dialog','form','metric','toast','warning','error','success','info'}
for node in ast.walk(tree):
    if not isinstance(node, ast.Call):
        continue
    name = ast.unparse(node.func)
    if name.split('.')[-1] not in ui or (not name.startswith('st.') and name.split('.')[-1] != 'button'):
        continue
    fn, menu, conditions = context(node)
    # Transitive static dependencies; these are candidates, not runtime evidence.
    dependencies, todo = set(), [fn]
    while todo:
        target = todo.pop()
        if target not in functions or target in dependencies:
            continue
        dependencies.add(target)
        todo += [n.func.id for n in ast.walk(functions[target]) if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in functions]
    sheets = set()
    for dep in dependencies:
        for call in ast.walk(functions[dep]):
            if isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id == 'get_worksheet' and len(call.args)>1 and isinstance(call.args[1], ast.Constant):
                sheets.add(str(call.args[1].value))
    records.append(dict(id=f'UI-L{node.lineno}',line=node.lineno,menu=menu,function=fn,kind=name.split('.')[-1],label=display(node.args[0]) if node.args else '',conditions=conditions,dependencies=sorted(dependencies),sheets=sorted(sheets),status='미검증'))
records.sort(key=lambda x:x['line'])
metadata = dict(commit='c00647f2f49c09ff03469b83f8f4c0e6baf08d0d',sha256=hashlib.sha256((ROOT/'legacy/timetable_app2_original.py').read_bytes()).hexdigest(),lines=len(source.splitlines()),functions=[dict(name=n.name,line=n.lineno,end=n.end_lineno,body_hash=hashlib.sha256(ast.dump(n,include_attributes=False).encode()).hexdigest()) for n in tree.body if isinstance(n,ast.FunctionDef)],ui=records)
(ROOT/'backend/schemas/source_inventory.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'functions':len(metadata['functions']),'ui_sites':len(records),'sha256':metadata['sha256']}))

import ast
import hashlib
import json
from pathlib import Path
from backend.domain.program import SOURCE,compile_program

def test_engine_ast_preserved_except_deployment_branding():
    baseline=json.loads(Path(__file__).with_name('pre_branding_ast.json').read_text())
    tree=ast.parse(SOURCE.read_text(encoding='utf-8-sig'))
    digest=lambda n:hashlib.sha256(ast.dump(n,include_attributes=False).encode()).hexdigest()
    funcs=[{'name':n.name,'hash':digest(n)} for n in tree.body if isinstance(n,(ast.FunctionDef,ast.ClassDef))]
    assert [f['name'] for f in funcs]==[f['name'] for f in baseline['functions']]
    for current,original in zip(funcs,baseline['functions']):
        if current['name'] not in ('neis_find_school','_neis_secret_key','ensure_neis_week_loaded'):assert current==original,current['name']
    assignments=[digest(n) for n in tree.body if isinstance(n,ast.Assign) and not any(isinstance(t,ast.Name) and t.id in ('SCHOOL_NAME','NEIS_SCHOOL_CODE_FALLBACKS') for t in n.targets)]
    assert assignments==baseline['assignments']

def test_inventory_includes_every_function_and_ui_call():
    metadata=json.loads((SOURCE.parents[1]/'backend/schemas/source_inventory.json').read_text(encoding='utf-8'))
    tree=ast.parse(SOURCE.read_text(encoding='utf-8-sig'))
    functions=[n for n in tree.body if isinstance(n,ast.FunctionDef)]
    assert len(functions)==len(metadata['functions'])==204
    assert len(metadata['ui'])==282
    assert compile_program()

def test_production_entrypoint_has_no_fixture_or_native_widget():
    text=(SOURCE.parents[1]/'timetable_app2.py').read_text(encoding='utf-8')
    for prohibited in ('tests.fixtures','st.button(','st.text_input(','st.data_editor(','st.file_uploader('):assert prohibited not in text

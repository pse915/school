import ast
import hashlib
import json
from pathlib import Path
from backend.domain.program import SOURCE,compile_program

def test_frozen_source_matches_github_baseline():
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()=='81ac74ecec9f893fb0027c9113f440af4f51effbf3c26185ba9599d942b36099'
    normalized=SOURCE.read_text(encoding='utf-8-sig')
    assert hashlib.sha256(normalized.encode()).hexdigest()=='babc332c92ad0376d791aedd2657bdfb94ea046f95700bbeef8314583cc77b00'

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

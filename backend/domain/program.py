"""Compile the frozen source without importing its native Streamlit UI.

Function bodies and constants retain their original AST. Each session receives
its own namespace and an explicit state/UI port. No global monkey patching.
"""
import ast
from functools import lru_cache
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / 'legacy/timetable_app2_original.py'

@lru_cache(maxsize=1)
def compile_program():
    tree = ast.parse(SOURCE.read_text(encoding='utf-8-sig'), filename=str(SOURCE))
    definitions, execution = [], []
    for node in tree.body:
        if isinstance(node, ast.Import) and any(a.name == 'streamlit' for a in node.names):
            continue
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef, ast.ClassDef)):
            definitions.append(node)
        elif isinstance(node, ast.Assign) and node.lineno < 5800 and not any(isinstance(n, ast.Attribute) and n.attr == 'session_state' for n in ast.walk(node)):
            definitions.append(node)
        else:
            execution.append(node)
    return tuple(compile(ast.Module(body=items, type_ignores=[]), str(SOURCE), 'exec') for items in (definitions, execution))

class LegacyProgram:
    def __init__(self, port):
        self.port = port
        self.namespace = {'st': port, '__name__': 'timetable_domain', '__file__': str(SOURCE)}
        definitions, self.execution = compile_program()
        exec(definitions, self.namespace)

    def run(self):
        exec(self.execution, self.namespace)

    def call(self, name, *args, **kwargs):
        return self.namespace[name](*args, **kwargs)

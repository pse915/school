"""Package user-facing source/build/docs without environments or credentials."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT=Path(__file__).resolve().parents[1]
EXCLUDE={'.git','node_modules','__pycache__','.pytest_cache','browser-artifacts','playwright-report','test-results'}
def selected():
    for file in sorted(ROOT.rglob('*')):
        if not file.is_file():continue
        rel=file.relative_to(ROOT)
        if any(part in EXCLUDE for part in rel.parts):continue
        if file.name=='secrets.toml' or file.suffix in {'.log','.pyc'}:continue
        yield file,rel

files=list(selected())
manifest={str(rel).replace('\\','/'):hashlib.sha256(file.read_bytes()).hexdigest() for file,rel in files if file.name!='SHA256SUMS.json'}
(ROOT/'SHA256SUMS.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
archive=ROOT.parent/'Timetable-react-migration.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as output:
    for file,rel in selected():output.write(file,str(Path('Timetable')/rel))
with zipfile.ZipFile(archive) as result:
    assert result.testzip() is None
    assert not any('/node_modules/' in n or '/.git/' in n or n.endswith('secrets.toml') for n in result.namelist())
    assert 'Timetable/frontend/dist/timetable.js' in result.namelist()
    assert 'Timetable/legacy/timetable_app2_original.py' in result.namelist()
print(json.dumps({'archive':str(archive),'files':len(manifest),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}))

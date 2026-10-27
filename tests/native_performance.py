"""Generate/test minimal patch for the currently published native source."""
import ast
import difflib
import json
import statistics
import time
from pathlib import Path
import pandas as pd
from tests.fixtures import make_application, login

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'legacy/timetable_app2_original.py'
UNUSED='        dmask = (duties_df["교사명"].astype(str).str.strip() == str(absent_teacher).strip()) & (duties_df["일자"].astype(str).map(normalize_date_str) == norm)\n'


def optimized_source():
    original=SOURCE.read_text(encoding='utf-8-sig')
    assert original.count(UNUSED)==1
    return original, original.replace(UNUSED,'')


def install(app, text):
    fn=next(n for n in ast.parse(text).body if isinstance(n,ast.FunctionDef) and n.name=='recommend_substitutes')
    exec(compile(ast.Module(body=[fn],type_ignores=[]),'native_source.py','exec'),app.program.namespace)


def test_native_recommendation_parity():
    original, optimized=optimized_source()
    app,_=make_application();login(app)
    ns=app.program.namespace;state=app.port.session_state
    state.duties=pd.DataFrame([
        {'교사명':'테스트다','일자':'2026-10-12','교시':2},
        {'교사명':'테스트라','일자':'2026-10-13','교시':1},
        {'교사명':'테스트나','일자':'2026-10-12','교시':0},
    ])
    state.part_time=pd.DataFrame([{'시간강사명':'강사테스트','담당과목':'국어','가능시간':'월1,월2','시작일':'2026-10-01','종료일':'2026-10-31','대체교사':'테스트가'}])
    for period in (1,2,7):
        for include in (False,True):
            install(app,original)
            before=ns['recommend_substitutes']('월',period,'국어','1-1','테스트가','2026-10-12',include_part_time=include)
            install(app,optimized)
            after=ns['recommend_substitutes']('월',period,'국어','1-1','테스트가','2026-10-12',include_part_time=include)
            pd.testing.assert_frame_equal(before,after)


if __name__=='__main__':
    original,optimized=optimized_source()
    target=ROOT/'native-optimization'
    (target/'timetable_app2.py').write_bytes(optimized.replace('\n','\r\n').encode('utf-8'))
    (target/'performance.patch').write_text(''.join(difflib.unified_diff(original.splitlines(True),optimized.splitlines(True),fromfile='a/timetable_app2.py',tofile='b/timetable_app2.py')),encoding='utf-8')
    app,_=make_application();login(app)
    app.port.session_state.duties=pd.DataFrame([{'교사명':f'복무교사{i%100}','일자':'2026-10-12' if i%2 else '2026-10-13','교시':i%7+1} for i in range(5000)])
    results={}; outputs=[]
    for label,text in [('before',original),('after',optimized)]:
        install(app,text)
        fn=app.program.namespace['recommend_substitutes']
        fn('월',1,'국어','1-1','테스트가','2026-10-12')
        cpu=[];wall=[]
        for _ in range(9):
            c,t=time.process_time(),time.perf_counter()
            for batch_item in range(20):
                out=fn('월',1,'국어','1-1','테스트가','2026-10-12')
            cpu.append((time.process_time()-c)*1000/20);wall.append((time.perf_counter()-t)*1000/20)
        results[label]={'samples':9,'calls_per_sample':20,'cpu_ms_median':statistics.median(cpu),'elapsed_ms_median':statistics.median(wall)}
        outputs.append(out)
    pd.testing.assert_frame_equal(*outputs)
    results['scope']='offline original recommend_substitutes, 5000 synthetic duty rows, four teachers; uncached inner function'
    results['identical_candidates_scores_order']=True
    (ROOT/'native-performance-results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
    print(json.dumps(results,indent=2))

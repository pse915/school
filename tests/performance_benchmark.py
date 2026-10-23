"""Offline benchmark against the frozen migration commit; no live Sheets/API."""
import collections
import json
import statistics
import subprocess
import time
import tracemalloc
from pathlib import Path
from types import ModuleType

from tests import fixtures
from backend.services.application import Application

BASELINE = '1bb6a60c5b9da4306b0eafc838847ccaaa4e3995'


def measure(cls):
    fixtures.Application = cls
    # Warm library imports symmetrically; memory peaks otherwise mostly
    # measure one-time imports in the first implementation only.
    warm, _ = fixtures.make_application()
    fixtures.login(warm)
    del warm
    cpu, elapsed, renders, reads, payload = [], [], [], [], []
    comparison = None
    tracemalloc.start()
    for _ in range(7):
        app, sheets = fixtures.make_application()
        fixtures.login(app)
        counts = collections.Counter()
        original = app._render
        def render(*args, **kwargs):
            counts['render'] += 1
            return original(*args, **kwargs)
        app._render = render
        for sheet in sheets.values():
            read = sheet.get_all_values
            def counted_read(read=read):
                counts['reads'] += 1
                return read()
            sheet.get_all_values = counted_read
        t_cpu, t_wall = time.process_time(), time.perf_counter()
        snapshots = []
        for tab in app.program.namespace['ALL_APP_TABS']:
            snapshot = fixtures.command(app, 'navigate', {'tab': tab})
            assert snapshot['response']['success'], snapshot['response']
            # Request IDs are random; business/UI model is deterministic.
            snapshot['response'] = {k:v for k,v in snapshot['response'].items() if k != 'requestId'}
            snapshots.append(snapshot)
        cpu.append((time.process_time() - t_cpu) * 1000)
        elapsed.append((time.perf_counter() - t_wall) * 1000)
        renders.append(counts['render'])
        reads.append(counts['reads'])
        payload.append(len(json.dumps(snapshots, ensure_ascii=False).encode()))
        comparison = snapshots
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return {'samples':7, 'cpu_ms_median':statistics.median(cpu),
            'elapsed_ms_median':statistics.median(elapsed), 'renders':renders,
            'sheet_reads':reads, 'snapshot_bytes':payload,
            'tracemalloc_peak_bytes':peak}, comparison


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    source = subprocess.check_output(['git','show',f'{BASELINE}:backend/services/application.py'],cwd=root).decode('utf-8-sig')
    module = ModuleType('baseline_application')
    exec(compile(source, 'baseline_application.py', 'exec'), module.__dict__)
    before, old = measure(module.Application)
    after, new = measure(Application)
    assert old == new, 'Baseline and optimized models differ'
    fixtures.Application = Application
    report = {'scope':'synthetic local React migration candidate; 12-menu navigation, warm imports, tracemalloc enabled',
              'baseline_commit':BASELINE,'before':before,'after':after,'identical_models':True}
    (root/'performance-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))

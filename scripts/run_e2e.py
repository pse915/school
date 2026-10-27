"""Run actual Streamlit-linked Playwright tests without production credentials."""
from pathlib import Path
import os,subprocess,sys,time,requests
ROOT=Path(__file__).resolve().parents[1]
SERVERS=[('tests/qa_app.py',8502),('tests/exam_supervision/qa_app.py',8506),('tests/operations/qa_app.py',8507),('timetable_app2.py',8508),('tests/semester/qa_app.py',8509)]
processes=[];logs=[]
try:
    s=requests.Session();s.trust_env=False
    for source,port in SERVERS:
        log=open(ROOT/f'tests/server-{port}.log','w');logs.append(log)
        p=subprocess.Popen([sys.executable,'-m','streamlit','run',source,'--server.headless','true','--server.address','127.0.0.1','--server.port',str(port)],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT);processes.append(p)
        for attempt in range(80):
            try:
                if s.get(f'http://127.0.0.1:{port}/_stcore/health',timeout=1).status_code==200:break
            except requests.RequestException:pass
            time.sleep(.2)
        else:raise RuntimeError(f'Streamlit health check failed: {port}')
    env={**os.environ,'TIMETABLE_TEST_URL':'http://127.0.0.1:8502','EXAM_TEST_URL':'http://127.0.0.1:8506','OPERATIONS_TEST_URL':'http://127.0.0.1:8507','TIMETABLE_STARTUP_URL':'http://127.0.0.1:8508','SEMESTER_TEST_URL':'http://127.0.0.1:8509'}
    result=subprocess.run(['npm','run','test:e2e',*sys.argv[1:]],cwd=ROOT/'frontend',env=env)
    sys.exit(result.returncode)
finally:
    for p in processes:p.terminate()
    for p in processes:
        try:p.wait(timeout=10)
        except subprocess.TimeoutExpired:p.kill()
    for log in logs:log.close()

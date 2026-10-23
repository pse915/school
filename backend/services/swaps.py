from datetime import datetime
import time
import uuid
import re
import pandas as pd

def preview_swap(app,payload):
    control=payload.get('control')
    spec=app.port.controls.get(control)
    if not spec or spec['node']['kind']!='table' or spec['node'].get('selection_mode')!='single-cell':
        raise PermissionError('현재 시간표에서만 드래그 교환할 수 있습니다.')
    if not str(control).startswith(('exchange_weekly_matrix__','test_week_preview__')):
        raise PermissionError('조회 전용 시간표입니다.')
    match=re.search(r'__(\d{8})__교사명__(test|live)__',control)
    if not match:raise ValueError('주간표 정보가 없습니다.')
    ref=datetime.strptime(match.group(1),'%Y%m%d').date()
    test=match.group(2)=='test'
    decoder=spec['decoder']
    source=decoder({'cells':[payload.get('source')],'rows':[]})['cells']
    target=decoder({'cells':[payload.get('target')],'rows':[]})['cells']
    matrix=pd.DataFrame(spec['node']['table']['rows'],columns=spec['node']['table']['columns'])
    ns=app.program.namespace
    a=ns['_resolve_matrix_cell_selection'](matrix,ref,'교사명',source,use_test=test)
    b=ns['_resolve_matrix_cell_selection'](matrix,ref,'교사명',target,use_test=test)
    if not a or not b:raise ValueError('수업이 있는 두 셀을 선택하세요.')
    if a['학급']!=b['학급']:raise ValueError('1:1 맞교환은 동일 학급 수업끼리만 가능합니다.')
    ok,message=ns['validate_swap'](a,b,a['일자'],b['일자'],is_test=test)
    if not ok:raise ValueError(message)
    token=uuid.uuid4().hex
    preview={'token':token,'a':a,'b':b,'test':test,'created':time.monotonic(),
             'tab':app.port.session_state.active_tab,'domainVersion':app.port.session_state.get('_data_version',0)}
    app.swap_preview=preview
    return {'token':token,'a':a,'b':b,'test':test}

def apply_preview(app,payload):
    preview=app.swap_preview
    if not preview or preview['token']!=payload.get('token'):raise ValueError('교환 미리보기가 만료되었습니다.')
    if time.monotonic()-preview['created']>300 or preview['domainVersion']!=app.port.session_state.get('_data_version',0) or preview['tab']!=app.port.session_state.active_tab:
        app.swap_preview=None
        raise ValueError('시간표 상태가 변경되었습니다. 다시 미리보기 하세요.')
    a,b=preview['a'],preview['b']
    # Consume approval before attempting I/O; uncertain saves cannot be retried
    # using the same preview. The request ledger handles exact duplicate IDs.
    app.swap_preview=None
    if not app.program.call('do_swap',a,b,a['일자'],b['일자'],is_test=preview['test']):
        raise ValueError('현재 시간표에서 교환을 적용하지 못했습니다. 저장 상태를 확인하세요.')
    return {'message':'테스트 맞교환이 적용되었습니다.' if preview['test'] else '맞교환을 저장했습니다.'}

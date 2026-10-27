"""Readable Secrets aliases for the existing shared extension store.

Never changes legacy timetable/exam sheet configuration or migrates data.
"""
import re,hashlib
from urllib.parse import urlparse
from diple.enrollment.service import EnrollmentError

SHEET_KEYS=('Gogyohak_sheet','Idongban_sheet','Operations_sheet','Semester_sheet')

def spreadsheet_id(value):
    value=str(value).strip()
    if value.startswith('https://'):
        parsed=urlparse(value)
        if parsed.hostname!='docs.google.com':raise EnrollmentError('확장 시트는 docs.google.com 스프레드시트 주소 또는 문서 ID를 입력하세요.')
        match=re.match(r'^/spreadsheets/d/([A-Za-z0-9_-]+)(?:/|$)',parsed.path)
        if not match:raise EnrollmentError('확장 스프레드시트 주소 형식이 올바르지 않습니다.')
        return match.group(1)
    if not re.fullmatch(r'[A-Za-z0-9_-]+',value):raise EnrollmentError('확장 스프레드시트 ID 형식이 올바르지 않습니다.')
    return value

def enabled(secrets):
    """Presence check only: screen error boundaries perform full validation."""
    new=secrets.get('school_sheets',{})
    return bool(new.get('Gateway_url') or secrets.get('credit',{}).get('gateway_url') or any(new.get(k) for k in SHEET_KEYS))

def resolve(secrets):
    old=dict(secrets.get('credit',{}));new=dict(secrets.get('school_sheets',{}));result=dict(old)
    aliases={'School_id':'school_id','Academic_year':'academic_year','Semester':'semester','Gateway_url':'gateway_url','Gateway_shared_key':'gateway_shared_key','Storage_mode':'storage_mode'}
    for source,target in aliases.items():
        if new.get(source) not in (None,''):result[target]=new[source]
    if old.get('school_id') and new.get('School_id') and old['school_id']!=new['School_id']:
        raise EnrollmentError('기존 학교 ID와 School_id가 다릅니다. 기존 학교 ID를 유지해야 이전 데이터를 조회할 수 있습니다.')
    ids={key:spreadsheet_id(new[key]) for key in SHEET_KEYS if str(new.get(key,'')).strip()}
    if len(set(ids.values()))>1:
        raise EnrollmentError('현재 통합 저장 계약상 Gogyohak_sheet·Idongban_sheet·Operations_sheet·Semester_sheet는 같은 확장 문서여야 합니다. 서로 다른 문서로 분리하면 확정·적용 원자성을 보장할 수 없어 연결을 차단했습니다.')
    if ids:
        chosen=next(iter(ids.values()))
        previous=old.get('expected_spreadsheet_id')
        if previous and spreadsheet_id(previous)!=chosen:
            raise EnrollmentError('기존 credit.expected_spreadsheet_id와 school_sheets 문서가 다릅니다. 자동 이전하지 않습니다. 기존 데이터 문서를 확인하세요.')
        result['expected_spreadsheet_id']=chosen
    elif new.get('Gateway_url'):
        raise EnrollmentError('school_sheets 게이트웨이를 사용하려면 Gogyohak_sheet 또는 Semester_sheet 등 확장 문서 주소를 하나 이상 지정하세요.')
    mode=result.get('storage_mode') or ('gateway' if result.get('gateway_url') else 'direct' if ids else '')
    if mode not in ('','direct','gateway'):raise EnrollmentError('Storage_mode는 direct 또는 gateway만 지원합니다.')
    if mode=='direct':
        if not ids:raise EnrollmentError('직접 연결할 확장 시트 주소를 입력하세요.')
        result['school_id']=result.get('school_id') or 'school-'+hashlib.sha256(chosen.encode()).hexdigest()[:16]
    if mode and (new or 'storage_mode' in old):result['storage_mode']=mode
    return result

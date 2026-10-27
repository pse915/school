"""Deployment branding only; never changes account IDs or data namespaces."""
from streamlit.errors import StreamlitSecretNotFoundError

def _get(secrets,key,default=None):
    try:return secrets.get(key,default)
    except StreamlitSecretNotFoundError:return default


def school_name(secrets):
    value=_get(secrets,'school',{}).get('name',_get(secrets,'SCHOOL_NAME',''))
    name=str(value or '').strip()
    if not name:return '학교'
    if len(name)>100 or any(c in name for c in '<>\r\n\x00'):
        raise ValueError('school.name은 100자 이하의 일반 학교명으로 입력하세요.')
    return name

def neis_codes(secrets):
    """Legacy compatibility: school codes are always discovered by school name."""
    return {}

def neis_api_key(secrets):
    school=_get(secrets,'school',{})
    candidates=[school.get('neis_api_key'),school.get('NEIS_API_KEY'),_get(secrets,'NEIS_API_KEY')]
    for section in ('neis','school_sheets','api_keys','api'):
        values=_get(secrets,section,{})
        if hasattr(values,'get'):
            keys=('api_key','NEIS_API_KEY','neis_api_key') if section=='neis' else ('NEIS_API_KEY','neis_api_key')
            candidates.extend(values.get(k) for k in keys)
    return next((str(v).strip() for v in candidates if v and str(v).strip()),'')

def find_neis_school(api_get,endpoint,api_key,name,secrets):
    import re
    norm=lambda value:re.sub(r'\s+','',str(value or ''))
    name=str(name or '').strip();api_key=str(api_key or '').strip()
    if not api_key or not name or name=='학교':return None
    found={}
    for page in range(1,11):
        try:
            data=api_get(endpoint,{'KEY':api_key,'Type':'json','pIndex':page,'pSize':1000,'SCHUL_NM':name})
        except Exception as exc:
            if isinstance(exc,RuntimeError) and str(exc).startswith('NEIS API INFO-200:'):return None
            raise RuntimeError('나이스 학교정보 조회에 실패했습니다. API 키의 유효성과 네트워크 연결을 확인하세요.') from None
        blocks=data.get('schoolInfo',[]) if isinstance(data,dict) else []
        rows=[row for block in blocks if isinstance(block,dict) for row in block.get('row',[])]
        for row in rows:
            if norm(row.get('SCHUL_NM'))!=norm(name):continue
            ident=(str(row.get('ATPT_OFCDC_SC_CODE','')).strip(),str(row.get('SD_SCHUL_CODE','')).strip())
            if all(ident):found[ident]=row
        total=next((h.get('list_total_count') for b in blocks if isinstance(b,dict) for h in b.get('head',[]) if 'list_total_count' in h),None)
        if total is not None and page*1000>=int(total) or len(rows)<1000:break
    else:raise RuntimeError('학교명 검색 결과가 너무 많습니다. 정확한 학교명을 입력하세요.')
    address=str(_get(secrets,'school',{}).get('address','')).strip()
    matches=list(found.values())
    if address:matches=[r for r in matches if norm(address) in norm(str(r.get('ORG_RDNMA',''))+' '+str(r.get('ORG_RDNDA',''))+' '+str(r.get('LCTN_SC_NM','')))]
    if not matches:return None
    if len(matches)>1:raise ValueError('같은 이름의 학교가 여러 곳입니다. [school] address에 지역이나 도로명주소 일부를 입력하세요. 교육청·학교코드는 필요하지 않습니다.')
    row=matches[0]
    return {key:str(row.get(key,'')).strip() for key in ('ATPT_OFCDC_SC_CODE','SD_SCHUL_CODE','SCHUL_NM','ATPT_OFCDC_SC_NM')}

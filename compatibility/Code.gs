let WRITE_JOURNAL_=null;
/**
 * 학교 시험감독 배정 시스템 v2.4 — 고속 요청·증분 평가·학년 우대·연강 방지·역할별 공정성
 * 원본 '배정인원' / '학급입력' / '관리자ID' 보존. 관리자ID A열 이름, B열 이메일.
 * Web app calls api / apiBootstrap + loginAdmin. Helper functions end in _.
 */
const APP = Object.freeze({
  VERSION: '3.1-auto-container',
  MAX_VERSION_PREVIEW_CHARS: 1100000,
  ADMIN_SHEET: '관리자ID',
  SESSION_TTL_SECONDS: 14400,
  TZ: 'Asia/Seoul',
  MAX_DAYS: 5,
  MAX_PERIODS: 5,
  MAX_SNAPSHOT_CELL: 30000,
  MAX_RESTARTS: 12,
  MAX_OPTIMIZE_MS: 145000
});
const SH = Object.freeze({
  roster:'배정인원', classes:'학급입력', schedule:'시험일정', settings:'감독설정',
  unavailable:'배정불가', draft:'배정초안', result:'배정결과', print:'배정결과_시간표',
  stats:'감독통계', history:'배정수정이력', versions:'배정버전', admins:'관리자설정',
  teaching:'교사시간표', visiting:'겸임교사설정', rules:'교사감독규칙'
});
const HEADERS = Object.freeze({
  '배정인원':['번호','이름','과목','담임학급','상치교과','정감독','부감독','자습감독'],
  '학급입력':['학년','반'],
  '교사시간표':['교사명','요일','교시','과목','학급','과목군'],
  '겸임교사설정':['교사명','구분','날짜','요일','교시','근무장소','비고'],
  '교사감독규칙':['교사명','규칙','시작일','요일','교시','수업학급','사유','종료일'],
  '시험일정':['일차','날짜','교시','학년','반','학급','구분','과목','시작시각','종료시각'],
  '감독설정':['설정키','JSON 또는 값'],
  '배정불가':['교사ID','날짜','교시','사유'],
  '배정초안':['일차','날짜','교시','학급','구분','과목','역할','교사ID','고정','변경시각'],
  '배정결과':['배정버전','일차','시험날짜','교시','학년','반','학급','시험/자습','시험과목','정감독','부감독','자습감독','배정상태','마지막수정일시','비고'],
  '배정결과_시간표':['날짜 / 일차 / 교시','학급별 감독 배정'],
  '감독통계':['교사ID','교사명','정감독','부감독','자습감독','전체감독','평균대비','일자별횟수'],
  '배정수정이력':['변경ID','변경일시','변경자','행위','버전전','버전후','위치','변경전','변경후','변경사유'],
  '배정버전':['버전','상태','확정일시','확정자','사유','청크번호','총청크','스냅샷JSON','SHA256'],
  '관리자설정':['설정','값','안내']
});
function doGet() {
  beginRequest_(); // Resolve and prepare the current container in apiBootstrap.
  const template=HtmlService.createTemplateFromFile('Index');
  template.authStorageKey='examAdminToken_copy_'+hexDigest_(ScriptApp.getScriptId());
  return template.evaluate()
    .setTitle('학교 시험감독 자동 배정')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
// Never allow initialization without a server-side roster-matched login session.
function initializeSystem(authToken) { beginRequest_(); requireAdmin_(authToken); init_(); return {ok:true}; }
function apiBootstrap(authToken){
 beginRequest_(); if(!integrationReadOnly_()){ensureInitialized_(); migrateEditable_(); syncDirectResultEdits_();} const data=getAdminData_(), current=getConfirmed_();
 return {appVersion:APP.VERSION,connection:connectionInfo_(),ready:true,admin:true,email:'',auth:{code:'EDITABLE',message:'바로 편집 가능',configured:true},state:'EDITABLE',version:'',confirmed:current,adminData:data,teachers:current.teachers,summary:basicSummary_(current.assignments,roster_().teachers,current.schedule,data.settings)};
}
function api(action, payload) {
  beginRequest_(); VERIFIED_ADMIN_EMAIL_='';
  action = String(action || ''); payload = payload || {};
  const publicActions = ['getConfirmed','getTeacher','getStatus'];
  requireAdmin_(payload.authToken); if(integrationReadOnly_()){assertIntegrationReadAction_(action);}else{ensureInitialized_(); migrateEditable_();}
  if (action === 'getStatus') return apiBootstrap(payload.authToken);
  if (action === 'getConfirmed') return getConfirmed_();
  if (action === 'getTeacher') return getTeacher_(payload);
  if(!integrationReadOnly_())ensureInitialized_();
  switch(action) {
    case 'diagnose': return diagnose_();
    case 'saveClasses': return saveClasses_(payload);
    case 'saveAssignments': return saveAssignments_(payload);
    case 'getAdminData': return timedServer_('getAdminData',getAdminData_);
    case 'getTeachingData': return timedServer_('getTeachingData',getTeachingData_);
    case 'saveVisiting': return saveVisiting_(payload);
    case 'saveTeachingRules': return saveTeachingRules_(payload);
    case 'availabilityReport': return availabilityReport_();
    case 'saveRoster': return saveRoster_(payload);
    case 'saveInstructorFlags': return saveInstructorFlags_(payload);
    case 'saveSchedule': return saveSchedule_(payload);
    case 'saveSettings': return saveSettings_(payload);
    case 'saveUnavailable': return saveUnavailable_(payload);
    case 'generate': return timedServer_('generate',()=>generate_(payload));
    case 'improve': return timedServer_('improve',()=>improve_(payload));
    case 'update': return update_(payload);
    case 'swap': return swap_(payload);
    case 'roleSwap': return roleSwap_(payload);
    case 'fairness': return fairness_(payload);
    case 'optimizationReport': return timedServer_('optimizationReport',optimizationReport_);
    case 'compareGradeBonus': return timedServer_('compareGradeBonus',()=>compareGradeBonus_(payload));
    case 'history': return readHistory_();
    case 'selfTests': return runSelfTests_();
    case 'repair': return repairSheets_(payload);
    default: throw new Error('알 수 없는 요청입니다: ' + action);
  }
}
// NOTE: A matching name/email is not identity authentication. Use only in a
// restricted-access deployment. Never confuse this with Google sign-in proof.
// Server-issued tokens still guard every privileged API; token issuance is
// intentionally based on administrator roster matching at the user's request.
let VERIFIED_ADMIN_EMAIL_ = '';
function getGoogleEmail_() {
  try { return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(); }
  catch (e) { return ''; }
}
function currentEmail_() { return VERIFIED_ADMIN_EMAIL_ || getGoogleEmail_(); }
function normalizeAdminEmail_(v) { return String(v == null ? '' : v).trim().toLowerCase(); }
function adminList_() {
  const sh = spreadsheet_().getSheetByName(APP.ADMIN_SHEET);
  assert_(sh, '관리자ID 시트가 없습니다. A1=이름, B1=이메일 형식으로 생성하세요.');
  const values = sh.getRange(1,1,Math.max(1,sh.getLastRow()),2).getDisplayValues();
  assert_(String(values[0][0]).trim()==='이름' && String(values[0][1]).trim()==='이메일',
    '관리자ID 시트 A1은 이름, B1은 이메일이어야 합니다.');
  const list=[], seen={};
  values.slice(1).forEach((r,i)=>{
    const name=String(r[0]||'').trim(), email=normalizeAdminEmail_(r[1]);
    if(!name&&!email)return;
    assert_(name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      '관리자ID '+(i+2)+'행의 이름 또는 이메일이 유효하지 않습니다.');
    assert_(!seen[email], '관리자ID 시트에 중복 이메일이 있습니다: '+(i+2)+'행');
    seen[email]=1;list.push({name,email});
  });
  return list;
}
function matchAdminEmail_(email){
  if (!email) return null;
  return adminList_().find(x=>x.email===normalizeAdminEmail_(email)) || null;
}
function hexDigest_(value){
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
}
// New prefix invalidates any existing v1.2 OTP-derived sessions after upgrade.
function authKey_(kind,value){return 'examadmin_copy_'+hexDigest_(ScriptApp.getScriptId()+'|'+spreadsheet_().getId())+'_'+kind+'_'+hexDigest_(value);}
function authCache_(){return CacheService.getScriptCache();}
function temporaryUserKey_(){
  try { return String(Session.getTemporaryActiveUserKey() || ''); } catch(e) {return '';}
}
function authDiagnostic_(token){
  let admins;
  try { admins=adminList_(); }
  catch(err) {return {code:'SHEET_INVALID',configured:false,admin:false,email:'',name:'',message:String(err.message)};}
  if (!admins.length) return {code:'NOT_CONFIGURED',configured:false,admin:false,email:'',name:'',
    message:'관리자ID 시트에 이름과 이메일을 등록하세요.'};
  if (!token) return {code:'LOGIN_REQUIRED',configured:true,admin:false,email:'',name:'',
    message:'관리자ID 시트의 이름과 이메일을 입력해 로그인하세요.'};
  if(typeof token!=='string' || token.length<64 || token.length>256)
    return {code:'SESSION_EXPIRED',configured:true,admin:false,email:'',name:'',message:'관리자 로그인 세션이 유효하지 않습니다. 다시 로그인하세요.'};
  const raw=authCache_().get(authKey_('session',token));
  if(!raw) return {code:'SESSION_EXPIRED',configured:true,admin:false,email:'',name:'',message:'관리자 로그인 세션이 만료되었습니다. 다시 로그인하세요.'};
  const session=parseJSON_(raw,null);
  const matched=session && admins.find(x=>x.email===session.email && x.name===session.name);
  if (!matched) return {code:'NOT_ALLOWED',configured:true,admin:false,email:'',name:'',
    message:'관리자ID 시트의 관리자 정보가 변경되어 다시 로그인해야 합니다.'};
  const activeEmail=getGoogleEmail_();
  // If Google exposes a real signed-in account, always enforce equality.
  if(activeEmail && activeEmail!==matched.email)
    return {code:'GOOGLE_ACCOUNT_MISMATCH',configured:true,admin:false,email:'',name:'',
      message:'로그인한 Google 계정과 입력한 관리자 이메일이 다릅니다.'};
  const key=temporaryUserKey_();
  // Prevent use of a stolen token in another Apps Script active-user context.
  if(session.userKey && key && session.userKey!==key)
    return {code:'SESSION_EXPIRED',configured:true,admin:false,email:'',name:'',
      message:'관리자 로그인 세션을 생성한 사용자와 현재 사용자가 다릅니다.'};
  return {code:'OK',configured:true,admin:true,email:matched.email,name:matched.name,
    message:'관리자ID 시트와 일치합니다. (이름·이메일 확인 방식, 본인 인증 아님)'};
}
function isAdmin_() { return !!VERIFIED_ADMIN_EMAIL_; }
function requireAdmin_(token){ VERIFIED_ADMIN_EMAIL_=getGoogleEmail_()||'webapp-editor'; return true; }
function checkAdminAccess(){
  const a=authDiagnostic_();
  const e=getGoogleEmail_();
  const admin=a.configured?matchAdminEmail_(e):null;
  const result={code:a.code,configured:a.configured,editorIdentityRecognized:!!admin,
    email:e,message:a.message,appVersion:APP.VERSION};
  console.log(JSON.stringify(result)); return result;
}
// The request explicitly removes email OTP. This method does NOT establish
// ownership of the entered mailbox: restrict web-app accessibility to staff.
function loginAdmin(payload) {
  payload=payload||{};
  const name=String(payload.name||'').trim(), email=normalizeAdminEmail_(payload.email);
  assert_(name.length>0 && name.length<=70 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    '이름과 이메일을 정확히 입력하세요.');
  const cache=authCache_(), failKey=authKey_('failed',email);
  const lock=LockService.getScriptLock();
  assert_(lock.tryLock(10000),'다른 로그인 요청이 처리 중입니다. 다시 시도하세요.');
  try {
    const count=Number(cache.get(failKey)||0);
    assert_(count<10,'로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도하세요.');
    const matching=adminList_().find(x=>x.email===email && x.name===name);
    if(!matching){cache.put(failKey,String(count+1),900);
      throw new Error('관리자ID 시트의 이름과 이메일이 일치하지 않습니다.');}
    const activeEmail=getGoogleEmail_();
    if(activeEmail && activeEmail!==matching.email)
      throw new Error('현재 Google 로그인 계정과 관리자ID의 이메일이 다릅니다. 해당 Google 계정으로 접속하세요.');
    const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
    const session={email:matching.email,name:matching.name,userKey:temporaryUserKey_()};
    cache.put(authKey_('session',token),JSON.stringify(session),APP.SESSION_TTL_SECONDS);
    cache.remove(failKey);
    return {ok:true,token,email:matching.email,name:matching.name,expiresIn:APP.SESSION_TTL_SECONDS};
  } finally {lock.releaseLock();}
}
function logoutAdminSession(token) {
  if(typeof token==='string' && token.length>=64 && token.length<=256)
    authCache_().remove(authKey_('session',token));
  return {ok:true};
}
// Request-lifetime memoization only: never keep Sheets values across separate executions.
let REQUEST_SCHEDULE_ = null;
let REQUEST_SHEET_ = null;
let REQUEST_VALUES_ = new Map();
let REQUEST_TABS_ = new Map();
function beginRequest_(){ REQUEST_SCHEDULE_=null; REQUEST_SHEET_=null; REQUEST_VALUES_=new Map(); REQUEST_TABS_=new Map(); }
/** Copy-safe binding: only a spreadsheet editor/menu can register its own container.
 * No spreadsheet ID from client payload, querystring or legacy constants is accepted.
 * The key contains Script ID, so copied properties cannot authorize the old container.
 */
function bindingPropertyKey_(){return 'EXAM_CONTAINER_V1_'+ScriptApp.getScriptId();}
function onOpen(e){
 // A normal sheet open registers its own container; no setup button or dialog.
 autoBindCurrentSpreadsheet_(e);
}
function activeEditorSpreadsheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  assert_(ss,'이 기능은 웹앱에서 실행할 수 없습니다. 사용할 시트의 확장 프로그램 → Apps Script에서 실행하거나 시트 메뉴를 사용하세요.');
  return ss;
}
function registerCurrentSpreadsheet_(ss){
  const props=PropertiesService.getScriptProperties(),key=bindingPropertyKey_();
  props.setProperty(key,JSON.stringify({spreadsheetId:ss.getId(),scriptId:ScriptApp.getScriptId(),registeredAt:new Date().toISOString()}));
  beginRequest_();return ss;
}
function setupCurrentSpreadsheet(){const ss=activeEditorSpreadsheet_();registerCurrentSpreadsheet_(ss);ensureInitialized_();return {ok:true};}
function prepareCurrentSpreadsheetSystem(){registerCurrentSpreadsheet_(activeEditorSpreadsheet_());ensureInitialized_();return {ok:true};}
function showCurrentSpreadsheetConnection(){return connectionInfo_();}
function spreadsheet_(){
  if(REQUEST_SHEET_)return REQUEST_SHEET_;
  const own=autoBindCurrentSpreadsheet_();
  if(own)return REQUEST_SHEET_=own;
  const raw=PropertiesService.getScriptProperties().getProperty(bindingPropertyKey_());
  const binding=parseJSON_(raw,null);
  assert_(binding&&binding.scriptId===ScriptApp.getScriptId()&&/^[A-Za-z0-9_-]+$/.test(binding.spreadsheetId||''),
    '현재 시트를 한 번 새로고침하면 자동 연결됩니다. 연결 등록·시트 준비 버튼은 누르지 않아도 됩니다. 이후 이 사본에서 배포한 웹앱을 다시 여세요.');
  const active=SpreadsheetApp.getActiveSpreadsheet();
  assert_(!active||active.getId()===binding.spreadsheetId,'현재 시트를 새로고침한 다음 이 사본에서 배포한 웹앱을 다시 여세요.');
  return REQUEST_SHEET_=SpreadsheetApp.openById(binding.spreadsheetId);
}
function connectionInfo_(){
  const ss=spreadsheet_();
  return {name:ss.getName(),spreadsheetId:ss.getId(),url:ss.getUrl(),appVersion:APP.VERSION};
}
function timedServer_(label,fn){ const started=Date.now(); try{return fn();} finally {
  const elapsed=Date.now()-started;
  if(elapsed>=200) console.log('[PERF] '+label+': '+elapsed+'ms');
}}
function ensureInitialized_(){if(integrationReadOnly_())return;ensureBaseHeaders_();if([SH.roster,SH.classes,...Object.keys(HEADERS)].some(n=>!sheet_(n)||!sheet_(n).getLastRow()))init_();}

function now_() { return Utilities.formatDate(new Date(), APP.TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function clean_(s) { return String(s == null ? '' : s).trim(); }
function norm_(s) { return clean_(s).normalize('NFKC').replace(/\s+/g,'').toLowerCase(); }
function parseJSON_(v, fallback) {try{return JSON.parse(v);}catch(e){return fallback;}}
function safe_(name){return String(name).replace(/^[=+\-@\t\r]/,'\'$&');}
function clone_(v){return JSON.parse(JSON.stringify(v));}
function assert_(test,msg){if(!test)throw new Error(msg);}
function originalSsLock_(fn){const lock=LockService.getScriptLock();assert_(lock.tryLock(25000),'다른 저장이 진행 중입니다. 잠시 후 다시 저장하세요.');beginRequest_();WRITE_JOURNAL_=new Map();try{return fn();}catch(e){const failures=[];const entries=[...WRITE_JOURNAL_.values()].reverse();WRITE_JOURNAL_=null;entries.forEach(x=>{try{restoreSheetBackup_(x);}catch(err){failures.push(x.name);}});if(failures.length)throw new Error(e.message+' / 복구 확인 필요: '+failures.join(', '));throw e;}finally{WRITE_JOURNAL_=null;lock.releaseLock();}}
function sheet_(name){
  if(REQUEST_TABS_.has(name))return REQUEST_TABS_.get(name);
  const sh=spreadsheet_().getSheetByName(name); REQUEST_TABS_.set(name,sh);return sh;
}
function values_(name) {
  if(REQUEST_VALUES_.has(name))return REQUEST_VALUES_.get(name);
  const s=sheet_(name), out=(!s || !s.getLastRow())?[]:
    s.getRange(1,1,s.getLastRow(),Math.max(1,s.getLastColumn())).getValues();
  REQUEST_VALUES_.set(name,out); return out;
}
function replaceRows_(name, rows) {
  assertIntegrationWrite_();
  journalSheet_(name);if(name===SH.schedule)REQUEST_SCHEDULE_=null;
  if(name===SH.schedule)REQUEST_SCHEDULE_=null;
  const s=sheet_(name); assert_(s,'시트를 찾을 수 없습니다: '+name);
  REQUEST_VALUES_.delete(name);
  const headers=HEADERS[name]; assert_(headers,'앱 관리 시트가 아닙니다: '+name);
  const existing=s.getRange(1,1,1,headers.length).getDisplayValues()[0];
  assert_(headers.every((h,i)=>existing[i]===h),name+' 열 제목이 변경되었습니다. 자동 덮어쓰기를 중단했습니다.');
  const old=Math.max(0,s.getLastRow()-1), count=Math.max(old,rows.length);
  if(count){
    if(s.getMaxRows()<count+1)s.insertRowsAfter(s.getMaxRows(),count+1-s.getMaxRows());
    if(s.getMaxColumns()<headers.length)s.insertColumnsAfter(s.getMaxColumns(),headers.length-s.getMaxColumns());
    // Write replacement first; clear only obsolete trailing rows afterwards.
    // A classroom ID such as 3-1 must never be converted by Sheets into March 1.
    const classCol = name===SH.schedule?6:name===SH.draft?4:name===SH.rules?6:0;
    if(classCol)s.getRange(2,classCol,count,1).setNumberFormat('@');
    if(rows.length)s.getRange(2,1,rows.length,headers.length).setValues(rows.map(r=>r.map(x=>x==null?'':x)));
    if(old>rows.length)s.getRange(rows.length+2,1,old-rows.length,headers.length).clearContent();
  }
}
function appendRows_(name, rows) {
  assertIntegrationWrite_();
  if(!rows.length)return;
  REQUEST_VALUES_.delete(name);
  const s=sheet_(name), headers=HEADERS[name];
  assert_(s && headers,'앱 관리 시트를 찾을 수 없습니다: '+name);
  const existing=s.getRange(1,1,1,headers.length).getDisplayValues()[0];
  assert_(headers.every((h,i)=>existing[i]===h),name+' 열 제목이 변경되었습니다. 저장을 중단했습니다.');
  const row=s.getLastRow()+1;
  if(s.getMaxRows()<row+rows.length-1)s.insertRowsAfter(s.getMaxRows(),row+rows.length-1-s.getMaxRows());
  s.getRange(row,1,rows.length,headers.length).setValues(rows);
}
function init_() {
  assertIntegrationWrite_();
  REQUEST_VALUES_.clear(); REQUEST_TABS_.clear();
  const ss=spreadsheet_();
  if(!ss.getSheetByName(SH.roster))ss.insertSheet(SH.roster).getRange(1,1,1,8).setValues([['번호','이름','과목','담임학급','상치교과','정감독','부감독','자습감독']]);
  if(!ss.getSheetByName(SH.classes))ss.insertSheet(SH.classes).getRange(1,1,1,2).setValues([['학년','반']]);
  ensureBaseHeaders_();
  migrateTeachingRuleHeaders_(ss);
  Object.keys(HEADERS).filter(name=>![SH.roster,SH.classes].includes(name)).forEach(name=>{
    let s=ss.getSheetByName(name); const head=HEADERS[name];
    if(!s){
      s=ss.insertSheet(name);
      if(s.getMaxColumns()<head.length)s.insertColumnsAfter(s.getMaxColumns(),head.length-s.getMaxColumns());
      s.getRange(1,1,1,head.length).setValues([head]);
      s.getRange(1,1,1,head.length).setBackground('#dbeafe').setFontWeight('bold');
      s.setFrozenRows(1);
    }else if(!s.getLastRow()){
      if(s.getMaxColumns()<head.length)s.insertColumnsAfter(s.getMaxColumns(),head.length-s.getMaxColumns());
      s.getRange(1,1,1,head.length).setValues([head]); s.setFrozenRows(1);
    }else {
      const found=s.getRange(1,1,1,head.length).getDisplayValues()[0];
      // Empty original '배정결과' is safe; otherwise never overwrite unknown content.
      assert_(head.every((h,i)=>found[i]===h),name+' 시트에 기존 데이터/다른 서식이 있습니다. 백업 후 이름을 변경하거나 수동 검토하세요.');
    }
  });
  if(!settingsMap_().hasOwnProperty('state')) writeState_(defaultState_());
}
/** Existing 7-column 교사감독규칙 rows remain in place. Only header C and new H are updated. */
function migrateTeachingRuleHeaders_(ss){
  const sh=ss.getSheetByName(SH.rules);
  if(!sh||!sh.getLastRow())return;
  const old=['교사명','규칙','날짜','요일','교시','수업학급','사유'];
  const head=sh.getRange(1,1,1,7).getDisplayValues()[0];
  if(!old.every((x,i)=>head[i]===x))return;
  const h=sh.getRange(1,8).getDisplayValue();
  assert_(!h||h==='종료일','교사감독규칙 H열에 이미 다른 데이터가 있습니다. 백업 후 수동 확인하세요.');
  sh.getRange(1,3).setValue('시작일');
  sh.getRange(1,8).setValue('종료일');
  sh.getRange(1,8).setBackground('#dbeafe').setFontWeight('bold');
}
/** Soft constraints only. No option may override eligible_ / fullValidate_. */
function defaultOptimization_(){return {profile:'balanced',gradeStrength:0.5,mainWeight:3,assistWeight:2,studyWeight:1,
  avoidThree:true,avoidFour:true,roleFairness:true,burdenFairness:true,dateBalance:true,lunchBreakAfter:0};}
function optimizationConfig_(settings,strict){
  const d=defaultOptimization_(),raw=(settings||{}).optimization||{},o=Object.assign({},d,raw);
  assert_(['balanced','fairness','consecutive','grade'].includes(o.profile),'최적화 프리셋 오류');
  for(const key of ['gradeStrength','mainWeight','assistWeight','studyWeight']){
    o[key]=Number(o[key]);assert_(Number.isFinite(o[key]),'최적화 숫자 설정 오류: '+key);
  }
  assert_(o.gradeStrength>=0&&o.gradeStrength<=1,'학년 우대 범위는 0~100%입니다.');
  assert_(o.mainWeight>o.assistWeight&&o.assistWeight>o.studyWeight&&o.studyWeight>0&&o.mainWeight<=10,
    '업무강도는 정감독 > 부감독 > 자습감독 > 0, 10 이하로 설정하세요.');
  for(const key of ['avoidThree','avoidFour','roleFairness','burdenFairness','dateBalance']){
    if(strict)assert_(typeof o[key]==='boolean','최적화 사용 여부 설정 오류: '+key);
    o[key]=!!o[key];
  }
  o.lunchBreakAfter=Number(o.lunchBreakAfter);
  assert_(Number.isInteger(o.lunchBreakAfter)&&o.lunchBreakAfter>=0&&o.lunchBreakAfter<=10,'점심 휴식 교시 설정 오류');
  return o;
}
function defaultState_(){return {state:'DRAFT',revision:0,activeVersion:'',editingBaseVersion:'',editingReason:'',editingPriorState:'',confirmedAt:'',updatedAt:'',rosterVerified:false,rosterFingerprint:'',settings:{studyCount:1,aliases:{},maxPerTeacher:0,instructorIds:[],missingTimetableFallback:false,missingFallbackTeacherIds:[],optimization:defaultOptimization_()},gradePlan:null,lastError:''};}
function settingsMap_(){
  const m={};values_(SH.settings).slice(1).forEach(r=>{if(r[0])m[String(r[0])]=String(r[1]);});return m;
}
function readState_(){
  const x=settingsMap_();if(x.state==null||x.state==='')return defaultState_();
  const parsed=parseJSON_(x.state,null);
  assert_(parsed && typeof parsed==='object' && !Array.isArray(parsed),'감독설정 state JSON이 손상되었습니다. 원본을 백업하고 상태를 확인하세요. 자동 초기화하지 않았습니다.');
  assert_(parsed.revision==null || (Number.isInteger(parsed.revision)&&parsed.revision>=0),'감독설정 revision이 올바르지 않습니다. 저장을 중단했습니다.');

  assert_(parsed.settings==null || (typeof parsed.settings==='object'&&!Array.isArray(parsed.settings)),'감독설정 settings 형식이 올바르지 않습니다.');
  return Object.assign(defaultState_(),parsed);
}
function writeState_(state){
  const x=settingsMap_();x.state=JSON.stringify(state);
  replaceRows_(SH.settings,Object.keys(x).map(k=>[k,x[k]]));
}
function ensureRev_(state,payload){assert_(Number(payload.revision)===Number(state.revision),'다른 창에서 변경되었습니다. 입력을 보존했으니 최신 데이터를 다시 불러와 확인하세요.');assert_(payload.dataToken===liveDataToken_(),'시트 또는 다른 창에서 데이터가 변경되었습니다. 입력은 보존됩니다. 다시 불러온 후 확인하세요.');}
function bump_(s){s.state='EDITABLE';s.activeVersion='';s.editingBaseVersion='';s.revision=(Number(s.revision)||0)+1;s.updatedAt=now_();writeState_(s);publishEditable_();s.resultFingerprint=hash_(JSON.stringify(values_(SH.result)));writeState_(s);SpreadsheetApp.flush();}
// The published activeVersion remains immutable while the administrator edits a private draft.
// An unlocked session is identified by the currently published base version, not a UI flag.
function isUnlocked_(s){return false;}
function mayEditDraft_(s){return true;}
function ensureDraft_(s){}
function headerMap_(row){const x={};row.forEach((k,i)=>x[norm_(k)]=i);return x;}
function col_(map,names){for(const n of names){const k=norm_(n);if(Object.prototype.hasOwnProperty.call(map,k))return map[k];}return -1;}
// Commas, semicolons, slashes, and line breaks are supported in either subject column.
// Canonical equivalences still come exclusively from 감독설정.aliases.
function parseTeacherSubjects_(value) {
  return [...new Set(clean_(value).split(/[,;\/、，\n\r]+/).map(clean_).filter(Boolean))];
}
function roleName_(role){return {MAIN:'정감독',ASSIST:'부감독',STUDY:'자습감독'}[role]||role;}
function roster_(){
  const v=values_(SH.roster);
  const m=headerMap_(v[0]);
  const ii=col_(m,['번호','교사ID','ID','식별번호']), nn=col_(m,['이름','교사명','성명']),
    cc=col_(m,['과목','담당교과','교과']), hh=col_(m,['담임학급','담임','담임반']),
    cross=col_(m,['상치교과','상치교과목']);
  const roleColumns={MAIN:col_(m,['정감독']),ASSIST:col_(m,['부감독']),STUDY:col_(m,['자습감독'])};
  assert_(ii>=0 && nn>=0 && cc>=0 && hh>=0,'배정인원 시트의 번호·이름·과목·담임학급 열을 확인하세요.');
  const teachers=[], errors=[], ids={};
  // Fail closed for new allocations, but keep the UI readable so the missing
  // header can be corrected without resetting the roster or other sheets.
  if(cross<0)errors.push('배정인원 E1에 "상치교과" 열 제목을 추가하세요. 상치교과 누락 상태에서는 새 감독 배정을 승인할 수 없습니다.');
  Object.entries(roleColumns).forEach(([role,column])=>{
    if(column<0)errors.push('배정인원에 '+roleName_(role)+' 열이 없습니다. O 또는 X를 입력하세요.');
  });
  v.slice(1).forEach((r,i)=>{
    if(!r.some(x=>clean_(x)))return;
    const id=clean_(r[ii]),name=clean_(r[nn]),subjects=parseTeacherSubjects_(r[cc]),
      crossSubjects=cross>=0?parseTeacherSubjects_(r[cross]):[];
    const homeroom=classId_(r[hh]);
    if(!id||!name||!subjects.length) errors.push((i+2)+'행의 번호, 이름 또는 과목 누락');
    if(ids[id])errors.push('교사 번호 중복: '+id);
    if(clean_(r[hh]) && !homeroom) errors.push((i+2)+'행 담임학급 형식 오류: '+r[hh]);
    ids[id]=true;
    const roleEligibility={};
    Object.entries(roleColumns).forEach(([role,column])=>{
      const value=column<0?'':clean_(r[column]).normalize('NFKC').toUpperCase();
      roleEligibility[role]=value==='O';
      if(column>=0&&!['O','X'].includes(value))errors.push((i+2)+'행 '+roleName_(role)+'은 O 또는 X로 입력하세요.');
    });
    teachers.push({id,name,subjects,crossSubjects,homeroom,roleEligibility,rosterRow:i+2});
  });
  return {teachers,errors,columns:{id:ii+1,name:nn+1,subjects:cc+1,homeroom:hh+1,crossSubjects:cross>=0?cross+1:null},fingerprint:hash_(JSON.stringify(v))};
}
function classId_(v){
  // getValues() returns a Date when a manually-entered '3-1' was autoformatted.
  // Only this class-identifier parser interprets month/day as grade/class.
  if(v instanceof Date && !isNaN(v.getTime()))return Utilities.formatDate(v,APP.TZ,'M-d');
  let x=clean_(v);if(!x)return '';
  x=x.replace(/학년|반/g,'').replace(/\s+/g,'');
  const m=x.match(/^(\d+)[-–_/](\d+)$/);
  return m?Number(m[1])+'-'+Number(m[2]):'';
}
function classes_(){
  const v=values_(SH.classes);assert_(v.length>=1,'학급입력 시트에 학년·반 열 제목이 필요합니다.');
  const hm=headerMap_(v[0]);const gi=col_(hm,['학년']),ci=col_(hm,['반']);
  assert_(gi>=0&&ci>=0,'학급입력 시트의 학년, 반 열이 필요합니다.');
  const list=[],ids={};
  v.slice(1).forEach((r,i)=>{
    if(!clean_(r[gi])&&!clean_(r[ci]))return;
    const g=Number(r[gi]),c=Number(r[ci]);
    assert_(Number.isInteger(g)&&g>0&&Number.isInteger(c)&&c>0,'학급입력 '+(i+2)+'행의 학년/반 오류');
    const id=g+'-'+c;assert_(!ids[id],'중복 학급: '+id);ids[id]=1;list.push({grade:g,classNo:c,id});
  });
  return list.sort((a,b)=>a.grade-b.grade||a.classNo-b.classNo);
}
function readSchedule_(){
  if(REQUEST_SCHEDULE_)return REQUEST_SCHEDULE_;
  // Read clock columns as DISPLAY text: legacy time cells can be Date objects
  // anchored in 1899 with ambiguous historical timezone offsets.
  const sheet=sheet_(SH.schedule);
  const displayed=sheet&&sheet.getLastRow()>1?sheet.getRange(2,9,sheet.getLastRow()-1,2).getDisplayValues():[];
  return REQUEST_SCHEDULE_=values_(SH.schedule).slice(1).map((r,i)=>{
    if(r[0]===''||r[0]==null)return null;
    const grade=Number(r[3]),classNo=Number(r[4]), expected=grade+'-'+classNo;
    const observed=classId_(r[5]);
    assert_(Number.isInteger(grade)&&grade>0&&Number.isInteger(classNo)&&classNo>0,
      '시험일정 '+(i+2)+'행의 학년/반이 올바르지 않습니다.');
    // Existing dates in F are recovered from the separate numeric grade/class columns.
    assert_(!clean_(r[5])||observed===expected,
      '시험일정 '+(i+2)+'행 학급값 불일치: '+clean_(r[5])+' / 학년·반 '+expected);
    return {day:Number(r[0]),date:dateStr_(r[1]),period:Number(r[2]),grade,classNo,
      classId:expected,type:r[6],subject:String(r[7]||''),start:clockStr_(displayed[i]?.[0]||r[8]),end:clockStr_(displayed[i]?.[1]||r[9])};
  }).filter(Boolean);
}
function dateStr_(x){if(x instanceof Date)return Utilities.formatDate(x,APP.TZ,'yyyy-MM-dd');return clean_(x).slice(0,10);}
function clockStr_(x){
  if(x==null||x==='')return '';
  if(x instanceof Date)return Utilities.formatDate(x,APP.TZ,'HH:mm');
  if(typeof x==='number'&&x>=0&&x<1){const m=Math.round(x*1440);return ('0'+Math.floor(m/60)).slice(-2)+':'+('0'+m%60).slice(-2);}
  const m=clean_(x).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return m?('0'+Number(m[1])).slice(-2)+':'+m[2]:clean_(x);
}
function timestampStr_(x){if(x instanceof Date)return Utilities.formatDate(x,APP.TZ,"yyyy-MM-dd'T'HH:mm:ss");return clean_(x);}
function validDate_(x){return /^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(new Date(x+'T12:00:00').getTime())&&new Date(x+'T12:00:00').toISOString().slice(0,10)===x;}
function validateSchedule_(rows, classList){
  assert_(rows.length>0,'시험일정을 먼저 입력하세요.');
  const classSet=new Set(classList.map(c=>c.id)),classById=new Map(classList.map(c=>[c.id,c])), seen=new Set(), dates={},daysByGrade={};
  rows.forEach((r,i)=>{
    assert_(Number.isInteger(r.day)&&r.day>=1&&r.day<=APP.MAX_DAYS,'시험일차는 1~5일차여야 합니다.');
    assert_(validDate_(r.date),'유효하지 않은 시험 날짜: '+r.date);
    assert_(Number.isInteger(r.period)&&r.period>=1&&r.period<=APP.MAX_PERIODS,'교시는 1~5교시여야 합니다.');
    assert_(classSet.has(r.classId),'등록되지 않은 학급: '+r.classId);
    assert_(classById.get(r.classId).grade===r.grade&&classById.get(r.classId).classNo===r.classNo,'학년/반과 학급 ID가 일치하지 않습니다: '+r.classId);
    assert_(r.type==='EXAM'||r.type==='STUDY','시험/자습 구분 오류');
    if(r.type==='EXAM')assert_(clean_(r.subject),'시험과목이 비어 있습니다: '+r.date+' '+r.period+'교시 '+r.classId);
    const key=r.date+'|'+r.period+'|'+r.classId;assert_(!seen.has(key),'중복 시험일정: '+key);seen.add(key);
    const gradeDay=r.grade+'|'+r.day;
    if(dates[gradeDay])assert_(dates[gradeDay]===r.date,'같은 학년·일차에 다른 날짜를 입력할 수 없습니다: '+r.grade+'학년 '+r.day+'일차');
    dates[gradeDay]=r.date;
    const gradeDate=r.grade+'|'+r.date;
    if(daysByGrade[gradeDate])assert_(daysByGrade[gradeDate]===r.day,'같은 학년이 같은 날짜에 서로 다른 일차를 지정했습니다: '+gradeDate);
    daysByGrade[gradeDate]=r.day;
    const validClock=x=>!x||/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
    assert_(validClock(r.start)&&validClock(r.end),'시작/종료 시각 형식 오류');
    if(r.start&&r.end)assert_(r.start<r.end,'시험 종료시각이 시작시각보다 늦어야 합니다.');
  });
  assert_(Object.keys(dates).length<=APP.MAX_DAYS,'시험기간 5일 제한');
}
/** 학년별 계획은 앱 설정 상태(JSON)에 따로 보존한다. '시험일정'의 기존 10개 열은 변경하지 않는다. */
function derivedGradePlan_(rows, classList){
  const grades=[...new Set(classList.map(c=>c.grade))].sort((a,b)=>a-b), any=rows.length>0;
  const result={};
  grades.forEach(grade=>{
    const own=rows.filter(r=>r.grade===grade), maxDay=Math.max(1,...own.map(r=>r.day));
    result[grade]={enabled:!any||own.length>0,days:Array.from({length:maxDay},(_,i)=>{
      const day=i+1, dayRows=own.filter(r=>r.day===day), periods=[...new Set(dayRows.map(r=>r.period))].sort((a,b)=>a-b);
      return {day,enabled:!any||dayRows.length>0,date:dayRows[0]?.date||'',periods:periods.length?periods:[1,2,3]};
    })};
  });
  return result;
}
function normalizeGradePlan_(input, rows, classList){
  if(input==null)return derivedGradePlan_(rows,classList); // Older API callers remain compatible.
  assert_(input&&typeof input==='object'&&!Array.isArray(input),'학년별 시험 운영 설정 형식 오류');
  const grades=[...new Set(classList.map(c=>c.grade))].sort((a,b)=>a-b);
  assert_(Object.keys(input).length===grades.length,'등록된 모든 학년의 운영 여부를 전달하세요.');
  const result={};
  grades.forEach(grade=>{
    const src=input[String(grade)];
    assert_(src&&typeof src==='object'&&typeof src.enabled==='boolean'&&Array.isArray(src.days),'학년별 운영 설정이 없습니다: '+grade+'학년');
    assert_(src.days.length>=1&&src.days.length<=APP.MAX_DAYS,grade+'학년 시험일수는 1~5일입니다.');
    const usedDays=new Set();
    const days=src.days.map(item=>{
      const day=Number(item.day), enabled=item.enabled, date=clean_(item.date), periods=(item.periods||[]).map(Number);
      assert_(Number.isInteger(day)&&day>=1&&day<=APP.MAX_DAYS&&!usedDays.has(day),grade+'학년 시험일차 설정 오류');
      usedDays.add(day);
      assert_(typeof enabled==='boolean'&&Array.isArray(item.periods),'시험 실시 여부·교시 설정 오류: '+grade+'학년 '+day+'일차');
      assert_(periods.every(p=>Number.isInteger(p)&&p>=1&&p<=APP.MAX_PERIODS)&&new Set(periods).size===periods.length,
        grade+'학년 '+day+'일차의 교시 목록이 올바르지 않습니다.');
      if(src.enabled&&enabled){
        assert_(validDate_(date),grade+'학년 '+day+'일차 시험 날짜를 입력하세요.');
        assert_(periods.length>0,grade+'학년 '+day+'일차 활성 교시가 없습니다.');
        periods.forEach(period=>{
          assert_(rows.some(r=>r.grade===grade&&r.day===day&&r.period===period),
            grade+'학년 '+day+'일차 '+period+'교시에 시험·자습을 실시하는 학급이 없습니다.');
        });
      }
      return {day,enabled,date,periods:periods.sort((a,b)=>a-b)};
    });
    days.sort((a,b)=>a.day-b.day);
    assert_(days.every((d,i)=>d.day===i+1),grade+'학년 시험일차는 1일차부터 연속 번호여야 합니다.');
    result[grade]={enabled:src.enabled,days};
  });
  rows.forEach(r=>{
    const grade=result[r.grade], d=grade&&grade.days.find(x=>x.day===r.day);
    assert_(grade&&grade.enabled&&d&&d.enabled&&d.date===r.date&&d.periods.includes(r.period),
      '시험 미실시 학년·날짜·교시가 배정 요청에 포함되어 있습니다: '+r.grade+'학년 '+r.date+' '+r.period+'교시');
  });
  assert_(rows.length>0,'시험을 실시하는 학년·학급·교시가 하나 이상 필요합니다.');
  return result;
}

/** School-provided weekly timetable: paste columns as provided, no separate imports or permissions. */
function dayIndex_(date){
  if(!validDate_(date)) throw new Error('요일 판정에 사용할 날짜가 잘못되었습니다: '+date);
  return ['일','월','화','수','목','금','토'][new Date(date+'T12:00:00Z').getUTCDay()];
}
function normWeekday_(value){
  const d=clean_(value).replace(/요일$/,'');
  if(!d)return '';
  assert_(['월','화','수','목','금','토','일'].includes(d),'요일은 월~일 또는 빈칸이어야 합니다: '+value);
  return d;
}
function teacherIndex_(teachers){
  const m={};teachers.forEach(t=>{const k=norm_(t.name);(m[k]||(m[k]=[])).push(t);});return m;
}
function resolveName_(name,byName,rowLabel,unknown){
  const found=byName[norm_(name)]||[];
  if(found.length>1)throw new Error(rowLabel+': '+name+' 동명이인이 있어 자동 매핑할 수 없습니다. 교사명을 별도로 구분해야 합니다.');
  if(!found.length){unknown.add(name);return '';}
  return found[0].id;
}
function readTeaching_(teachers){
  const canonical=values_(SH.teaching),alias=values_('수업시간표');
  const hasData=v=>v.slice(1).some(row=>row.some(x=>clean_(x)));
  // Schools often already use a tab named '수업시간표'; do not silently ignore it.
  const useAlias=!hasData(canonical)&&hasData(alias);
  const v=useAlias?alias:canonical,source=useAlias?'수업시간표':SH.teaching;
  const by=teacherIndex_(teachers),unknown=new Set(),arr=[], errors=[], known=new Set(), exemptions=new Set();
  if(v.length<2)return {rows:[],unknown:[],errors:[],known:[],exemptions:[],enabled:false,total:0,source};
  const expected=HEADERS[SH.teaching];
  assert_(expected.every((x,i)=>clean_(v[0][i])===x),'교사시간표 1행은 교사명·요일·교시·과목·학급·과목군 순서여야 합니다.');
  v.slice(1).forEach((r,i)=>{
    const name=clean_(r[0]),weekdayRaw=clean_(r[1]),periodRaw=clean_(r[2]),subject=clean_(r[3]),classRaw=clean_(r[4]);
    if(!r.some(x=>clean_(x)))return;
    const label='교사시간표 '+(i+2)+'행';
    try{
      assert_(name,label+': 교사명이 없습니다.');
      const id=resolveName_(name,by,label,unknown);
      if(weekdayRaw==='수업없음'){
        assert_(!periodRaw&&!subject&&!classRaw,label+': 수업없음 행은 교사명·요일 외 나머지를 비우세요.');
        if(id){known.add(id);exemptions.add(id);}return;
      }
      const weekday=normWeekday_(weekdayRaw),period=Number(periodRaw);
      assert_(weekday&&Number.isInteger(period)&&period>=1&&period<=10,label+': 요일·교시 형식 오류');
      assert_(subject||classRaw,label+': 과목과 학급이 모두 비어 있습니다. 수업 없음을 표시하려면 요일 칸에 수업없음을 넣으세요.');
      const classId=classId_(r[4]);
      if(classRaw&&!classId)errors.push(label+': 학급 형식 확인 필요 ('+classRaw+'). 이 시간은 수업 중으로 처리합니다.');
      if(id){known.add(id);arr.push({teacherId:id,teacherName:name,weekday,period,classId,subject,subjectGroup:clean_(r[5]),row:i+2});}
    }catch(e){errors.push(String(e.message));}
  });
  exemptions.forEach(id=>{if(arr.some(x=>x.teacherId===id))errors.push('교사시간표: 수업없음 표시와 실제 수업이 동시에 존재하는 교사 '+id);});
  return {rows:arr,unknown:[...unknown].sort(),errors,known:[...known],exemptions:[...exemptions],enabled:true,total:v.slice(1).filter(r=>r.some(x=>clean_(x))).length,source,ignoredAlias:!useAlias&&hasData(alias)};
}
function readVisiting_(teachers){
  const v=values_(SH.visiting), by=teacherIndex_(teachers),unknown=new Set(),arr=[],errors=[];
  if(v.length<2)return {rows:[],unknown:[],errors:[]};
  const expected=HEADERS[SH.visiting];assert_(expected.every((x,i)=>clean_(v[0][i])===x),'겸임교사설정 열 제목을 확인하세요.');
  v.slice(1).forEach((r,i)=>{
    if(!r.some(x=>clean_(x)))return;
    const name=clean_(r[0]), type=clean_(r[1]),date=dateStr_(r[2]),wd=clean_(r[3]),per=clean_(r[4]);
    const label='겸임교사설정 '+(i+2)+'행';
    try{
      assert_(name&&['타교출강','본교방문'].includes(type),label+': 교사명/구분 오류 (타교출강 또는 본교방문)');
      assert_((date&&validDate_(date))||(!date&&wd),label+': 날짜 또는 요일 중 하나는 필요합니다.');
      const weekday=wd?normWeekday_(wd):'';
      if(date&&weekday)assert_(dayIndex_(date)===weekday,label+': 날짜와 요일이 일치하지 않습니다.');
      const period=per===''?0:Number(per);
      assert_(Number.isInteger(period)&&period>=0&&period<=10,label+': 교시는 빈칸(종일) 또는 1~10 사이여야 합니다.');
      const location=clean_(r[5]);assert_(['본교','타교'].includes(location),label+': 근무장소는 본교 또는 타교를 입력하세요.');
      const id=resolveName_(name,by,label,unknown);
      if(id)arr.push({teacherId:id,teacherName:name,type,date:date||'',weekday,period,location,note:clean_(r[6]),row:i+2});
    }catch(e){errors.push(String(e.message));}
  });
  return {rows:arr,unknown:[...unknown].sort(),errors};
}
function constraintIndex_(ctx){
  const old=ctx._constraintIndex;
  if(old && old.sources.teaching===ctx.teaching && old.sources.visiting===ctx.visiting &&
     old.sources.rules===ctx.teachingRules && old.sources.unavailable===ctx.unavailable &&
     old.sources.settings===ctx.settings && old.sources.schedule===ctx.schedule)return old;
  const byTeacher=new Map(),visits=new Map(),rules=new Map(),released=new Map(),unavailable=new Set();
  (ctx.teaching?.rows||[]).forEach(row=>{
    const k=row.teacherId+'|'+row.weekday+'|'+row.period;
    if(!byTeacher.has(k))byTeacher.set(k,[]);byTeacher.get(k).push(row);
  });
  (ctx.visiting||[]).forEach(x=>{if(!visits.has(x.teacherId))visits.set(x.teacherId,[]);visits.get(x.teacherId).push(x);});
  (ctx.teachingRules||[]).forEach(x=>{if(!rules.has(x.teacherId))rules.set(x.teacherId,[]);rules.get(x.teacherId).push(x);});
  (ctx.schedule||[]).forEach(x=>{
    const k=x.date+'|'+x.period;
    if(!released.has(k))released.set(k,new Set());released.get(k).add(x.classId);
  });
  (ctx.unavailable||[]).forEach(x=>unavailable.add(x.teacherId+'|'+x.date+'|'+x.period));
  const index={byTeacher,visits,rules,released,unavailable,
    sources:{teaching:ctx.teaching,visiting:ctx.visiting,rules:ctx.teachingRules,
      unavailable:ctx.unavailable,settings:ctx.settings,schedule:ctx.schedule},
    instructorIds:new Set((ctx.settings?.instructorIds||[]).map(String)),
    known:new Set(ctx.teaching?.known||[])};
  // Non-enumerable: Object.assign({},ctx,changedConstraints) must never reuse stale indexes.
  Object.defineProperty(ctx,'_constraintIndex',{value:index,configurable:true,enumerable:false});
  return index;
}
function visitingAvailability_(teacher,job,visits,ctx){
  const rows=ctx?constraintIndex_(ctx).visits.get(teacher.id)||[]:(visits||[]).filter(x=>x.teacherId===teacher.id), hasIncoming=rows.some(x=>x.type==='본교방문');
  // Incoming itinerant teachers are absent by default; only explicit presence is usable.
  const matches=rows.filter(x=>(!x.date||x.date===job.date)&&(!x.weekday||x.weekday===dayIndex_(job.date))&&(!x.period||x.period===job.period));
  // Date-specific records override weekly rules. Period-specific overrides full-day rules.
  matches.sort((a,b)=>Number(!!b.date)-Number(!!a.date)||Number(!!b.period)-Number(!!a.period));
  if(matches.length){
    const top=matches[0],equivalent=matches.filter(x=>!!x.date===!!top.date&&!!x.period===!!top.period);
    if(equivalent.some(x=>x.location!==top.location))return ['겸임근무설정충돌'];
    return top.location==='타교'?['타교근무']:[];
  }
  if(hasIncoming)return ['겸임본교방문미확인'];
  return [];
}
/** Explicit supervision overrides. INCLUDE waives ONLY the regular timetable exclusion.
 * It cannot waive subject, homeroom, absence, school visit, or double-booking rules.
 * A dated/period-specific INCLUDE requires a written reason for lesson coverage.
 */
function validTeachingRuleRange_(startDate,endDate,weekday,label){
  assert_(startDate||weekday,label+': 시작일 또는 반복 요일을 입력하세요.');
  assert_(!endDate||startDate,label+': 종료일을 입력하려면 시작일도 필요합니다.');
  if(startDate)assert_(validDate_(startDate),label+': 시작일은 yyyy-MM-dd 형식이어야 합니다.');
  if(endDate)assert_(validDate_(endDate)&&endDate>=startDate,label+': 종료일은 시작일 이후여야 합니다.');
  // A weekday with a date range filters the range to matching weekdays.
  if(startDate&&!endDate&&weekday)assert_(dayIndex_(startDate)===weekday,label+': 시작일과 요일 불일치');
}
function teachingRuleApplies_(rule,date,period){
  const start=rule.startDate||rule.date||'',end=rule.endDate||start;
  return (!start||(start<=date&&date<=end))&&
    (!rule.weekday||rule.weekday===dayIndex_(date))&&(!rule.period||rule.period===period);
}
function readTeachingRules_(teachers){
  const v=values_(SH.rules),by=teacherIndex_(teachers),unknown=new Set(),errors=[],rows=[];
  if(v.length<=1)return {rows,errors,unknown:[]};
  assert_(HEADERS[SH.rules].every((h,i)=>clean_(v[0][i])===h),'교사감독규칙 열 제목이 올바르지 않습니다.');
  const allClasses=new Set(classes_().map(x=>x.id));
  v.slice(1).forEach((r,i)=>{
    if(!r.some(x=>clean_(x)))return;
    const label='교사감독규칙 '+(i+2)+'행';
    try {
      const name=clean_(r[0]),mode=clean_(r[1]),date=dateStr_(r[2]),endDate=dateStr_(r[7]),weekdayText=clean_(r[3]);
      const weekday=weekdayText?normWeekday_(weekdayText):'',period=clean_(r[4])===''?0:Number(r[4]);
      const classId=classId_(r[5]),reason=clean_(r[6]);
      assert_(name&&['제외','포함'].includes(mode),label+': 교사명/규칙은 필수이며 규칙은 제외 또는 포함입니다.');
      if(weekdayText)assert_(weekday,label+': 요일은 월~일로 입력하세요.');
      validTeachingRuleRange_(date,endDate,weekday,label);
      assert_(Number.isInteger(period)&&period>=0&&period<=10,label+': 교시는 공란 또는 1~10입니다.');
      assert_(!clean_(r[5])||classId&&allClasses.has(classId),label+': 수업학급은 1-1 형태의 등록된 학급이어야 합니다.');
      assert_(reason.length>=2,label+': 사유를 2자 이상 입력하세요.');
      if(mode==='포함'){
        assert_(date&&period>0,label+': 포함 규칙은 특정 날짜와 교시가 필요합니다.');
        assert_(reason.length>=4,label+': 포함 시 정규수업을 비우는 방법 등 확인 사유를 4자 이상 입력하세요.');
      }else assert_(!classId,label+': 제외 규칙에는 수업학급을 지정하지 마세요.');
      const id=resolveName_(name,by,label,unknown);
      if(id)rows.push({teacherId:id,teacherName:name,mode,date,startDate:date,endDate,weekday,period,classId,reason,row:i+2});
    } catch(e){errors.push(String(e.message));}
  });
  return {rows,errors,unknown:[...unknown].sort()};
}
function matchingTeachingRules_(teacher,job,ctx){
  return (constraintIndex_(ctx).rules.get(teacher.id)||[]).filter(x=>teachingRuleApplies_(x,job.date,job.period));
}
function teachingRuleRestrictions_(teacher,job,ctx){
  return matchingTeachingRules_(teacher,job,ctx).some(x=>x.mode==='제외')?['교사감독규칙제외']:[];
}
function missingTimetableRestricted_(teacher,job,ctx){
  if(!ctx.teaching?.enabled)return false;
  const idx=constraintIndex_(ctx);
  return !idx.known.has(teacher.id)&&!(idx.visits.get(teacher.id)||[]).some(row=>row.type==='본교방문')&&
    !matchingTeachingRules_(teacher,job,ctx).some(row=>row.mode==='포함'&&!row.classId);
}
function missingFallbackPlan_(ctx){
  const index=constraintIndex_(ctx);if(index.missingFallbackPlan)return index.missingFallbackPlan;
  const regular=Object.assign({},ctx,{settings:Object.assign({},ctx.settings,{missingTimetableFallback:false})});
  const groups=new Map();
  makeJobs_(ctx.schedule,ctx.settings).forEach(job=>{const key=job.date+'|'+job.period;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(job);});
  const plan=new Map();
  groups.forEach((jobs,key)=>{
    const candidates=new Map(jobs.map(job=>[job.key,ctx.teachers.filter(teacher=>!eligible_(teacher,job,regular,[]).length)]));
    const owner=new Map(),byKey=new Map(jobs.map(job=>[job.key,job]));
    function match(job,seen){
      for(const teacher of candidates.get(job.key)){
        if(seen.has(teacher.id))continue;seen.add(teacher.id);
        if(!owner.has(teacher.id)||match(byKey.get(owner.get(teacher.id)),seen)){owner.set(teacher.id,job.key);return true;}
      }
      return false;
    }
    let matched=0;jobs.forEach(job=>{if(match(job,new Set()))matched++;});
    plan.set(key,{date:jobs[0].date,period:jobs[0].period,required:jobs.length,regularMatched:matched,shortage:jobs.length-matched});
  });
  index.missingFallbackPlan=plan;return plan;
}
function missingFallbackAllowed_(teacher,job,ctx){
  return ctx.settings.missingTimetableFallback===true&&(ctx.settings.missingFallbackTeacherIds||[]).includes(teacher.id)&&
    (missingFallbackPlan_(ctx).get(job.date+'|'+job.period)?.shortage||0)>0;
}
function fallbackAssignment_(assignment,ctx){
  if(ctx.settings.missingTimetableFallback!==true)return false;
  const teacher=workloadIndex_(ctx).teacherById.get(assignment.teacherId);
  return !!teacher&&missingTimetableRestricted_(teacher,assignment,ctx);
}
function fallbackUsage_(assignments,ctx){
  if(ctx.settings.missingTimetableFallback!==true)return [];
  return assignments.filter(assignment=>fallbackAssignment_(assignment,ctx)).map(assignment=>({teacherId:assignment.teacherId,name:workloadIndex_(ctx).teacherById.get(assignment.teacherId).name,date:assignment.date,period:assignment.period,classId:assignment.classId,role:assignment.role}));
}
function teachAvailability_(teacher,job,ctx){
  const teaching=ctx.teaching;
  const inclusions=matchingTeachingRules_(teacher,job,ctx).filter(x=>x.mode==='포함');
  const fullOverride=inclusions.some(x=>!x.classId);
  if(!teaching||!teaching.enabled)return [];
  const idx=constraintIndex_(ctx);
  if(missingTimetableRestricted_(teacher,job,ctx)&&!missingFallbackAllowed_(teacher,job,ctx))
    return ['교사시간표미등록'];
  const weekday=dayIndex_(job.date),released=idx.released.get(job.date+'|'+job.period)||new Set();
  const conflict=(idx.byTeacher.get(teacher.id+'|'+weekday+'|'+job.period)||[]).filter(x=>(!x.classId||!released.has(x.classId))&&
    !fullOverride&&!inclusions.some(rule=>rule.classId&&rule.classId===x.classId));
  if(conflict.length)return ['정규수업('+[...new Set(conflict.map(x=>x.classId||x.subject||'학급미확인'))].join(',')+')'];
  return [];
}
function availabilityData_(teachers){
  const teaching=readTeaching_(teachers),visiting=readVisiting_(teachers),rules=readTeachingRules_(teachers);
  return {teaching,visiting,rules};
}
function availabilityReportFrom_(ctx){
  const teaching=ctx.teaching||{rows:[],unknown:[],errors:[],known:[],exemptions:[],enabled:false,total:0},visiting=ctx.visiting||[];
  const jobs=[...new Map(makeJobs_(ctx.schedule,ctx.settings).map(x=>[x.date+'|'+x.period,x])).values()];
  const slots=jobs.map(j=>{
    const reasons={},excludedTeachers=[];let possible=0;
    ctx.teachers.forEach(t=>{
      const why=eligible_(t,j,ctx,[]);
      if(!why.length){possible++;return;}
      excludedTeachers.push({id:t.id,name:t.name,reasons:why});
      why.forEach(w=>reasons[w]=(reasons[w]||0)+1);
    });
    return {date:j.date,weekday:dayIndex_(j.date),period:j.period,possible,
      excluded:excludedTeachers.length,reasons,excludedTeachers};
  });
  return {teachingRows:teaching.total||0,teachingSource:teaching.source||SH.teaching,ignoredAlias:teaching.ignoredAlias||false,teachingMatched:teaching.known?.length||0,teacherCount:ctx.teachers.length,
    teachingRuleCount:(ctx.teachingRules||[]).length,
    missingTimetableFallback:ctx.settings.missingTimetableFallback===true,
    fallbackSlots:ctx.settings.missingTimetableFallback===true?[...missingFallbackPlan_(ctx).values()].filter(slot=>slot.shortage>0):[],
    missingTeachers:ctx.teachers.filter(t=>teaching.enabled&&!teaching.known.includes(t.id)&&!visiting.some(v=>v.teacherId===t.id&&v.type==='본교방문')).map(t=>t.name),
    unknownTeachers:teaching.unknown||[],invalidRows:teaching.errors||[],visitingRows:visiting.length,slots};
}
function availabilityReport_(){
  const r=roster_(),state=readState_(),availability=availabilityData_(r.teachers);
  return availabilityReportFrom_({teachers:r.teachers,settings:state.settings,schedule:readSchedule_(),
    unavailable:readUnavailable_(),teaching:availability.teaching,visiting:availability.visiting.rows,teachingRules:availability.rules.rows});
}
function saveVisiting_(payload){
  return ssLock_(()=>{
    const s=readState_();ensureRev_(s,payload);

    const teachers=roster_().teachers,known=new Set(teachers.map(t=>t.name)),seen=new Set();
    const existing=readVisiting_(teachers);
    assert_(!existing.unknown.length&&!existing.errors.length,'현재 겸임교사설정 시트에 매핑되지 않거나 잘못된 행이 있습니다. 시트에서 수정한 뒤 저장하세요.');
    const rows=(payload.rows||[]).map((x,i)=>{
      const name=clean_(x.teacherName),type=clean_(x.type),date=clean_(x.date),weekday=clean_(x.weekday),period=x.period==null?'':String(x.period),location=clean_(x.location);
      assert_(known.has(name),'겸임교사설정 '+(i+1)+'번째: 배정인원에 없는 교사명 '+name);
      assert_(['타교출강','본교방문'].includes(type),'겸임교사 구분 오류');
      assert_(date||weekday,'날짜 또는 요일을 입력하세요.');
      if(date)assert_(validDate_(date),'날짜 형식 오류: '+date);
      const wd=weekday?normWeekday_(weekday):'';
      if(date&&wd)assert_(dayIndex_(date)===wd,'날짜·요일 불일치: '+name);
      assert_(!period||Number.isInteger(Number(period))&&Number(period)>=1&&Number(period)<=10,'겸임교사 교시 오류');
      assert_(['본교','타교'].includes(location),'근무장소는 본교 또는 타교여야 합니다.');
      const key=[name,date,wd,period].join('|');assert_(!seen.has(key),'겸임교사설정 중복 시간: '+key);seen.add(key);
      return [safe_(name),type,date,wd,period?Number(period):'',location,safe_(clean_(x.note))];
    });
    replaceRows_(SH.visiting,rows);
    s.state='DRAFT';s.draftConstraintFingerprint='';bump_(s);return {revision:s.revision};
  });
}
function saveTeachingRules_(payload){
  return ssLock_(()=>{
    const s=readState_();ensureRev_(s,payload);

    const teachers=roster_().teachers,by=teacherIndex_(teachers);
    const allClasses=new Set(classes_().map(x=>x.id));
    const data=(payload.rows||[]).map((x,i)=>{
      const label='감독 규칙 '+(i+1)+'번째';
      const name=clean_(x.teacherName),mode=clean_(x.mode),date=clean_(x.startDate||x.date),endDate=clean_(x.endDate),weekdayRaw=clean_(x.weekday),
        weekday=weekdayRaw?normWeekday_(weekdayRaw):'',period=clean_(x.period)===''?0:Number(x.period),
        classId=clean_(x.classId)?classId_(x.classId):'',reason=clean_(x.reason)||'규칙 설정';
      assert_(by[norm_(name)]?.length===1,label+': 배정인원에 없는 교사 또는 동명이인입니다: '+name);
      assert_(['제외','포함'].includes(mode),label+': 제외 또는 포함을 선택하세요.');
      if(weekdayRaw)assert_(weekday,label+': 요일 형식 오류');
      validTeachingRuleRange_(date,endDate,weekday,label);
      assert_(Number.isInteger(period)&&period>=0&&period<=10,label+': 교시 오류');
      assert_(!clean_(x.classId)||allClasses.has(classId),label+': 수업학급이 등록되지 않았습니다.');
      assert_(reason.length>=2,label+': 사유를 2자 이상 작성하세요.');
      if(mode==='포함'){
        assert_(date&&period>0,label+': 포함 규칙은 날짜·교시를 모두 지정하세요.');
        assert_(reason.length>=4,label+': 포함 사유는 4자 이상 입력하세요.');
      }else assert_(!classId,label+': 제외 규칙에는 수업학급을 입력하지 마세요.');
      return [safe_(name),mode,date,weekday,period||'',classId,safe_(reason),endDate];
    });
    // Validate the current state before overwriting; malformed existing rows require manual repair.
    const previous=readTeachingRules_(teachers);
    assert_(!previous.errors.length&&!previous.unknown.length,'기존 교사감독규칙 시트 오류를 먼저 해결하세요: '+previous.errors.concat(previous.unknown).join('; '));
    replaceRows_(SH.rules,data);
    s.state='DRAFT';s.draftConstraintFingerprint='';bump_(s);
    return {revision:s.revision,count:data.length};
  });
}
function constraintFingerprint_(ctx){
  return hash_(JSON.stringify({schedule:ctx.schedule,teachers:ctx.teachers,unavailable:ctx.unavailable,
    teaching:ctx.teaching,visiting:ctx.visiting,teachingRules:ctx.teachingRules,settings:ctx.settings}));
}
function ensureConstraintsUnchanged_(state,ctx){}
function readUnavailable_(){return values_(SH.unavailable).slice(1).filter(r=>clean_(r[0])).map(r=>({teacherId:clean_(r[0]),date:dateStr_(r[1]),period:Number(r[2]),reason:clean_(r[3])}));}
function getAdminData_(){
 const r=roster_(),state=readState_(),schedule=readSchedule_(),classes=classes_(),draft=readDraft_();
 let validation;try{validation=fullValidate_(draft,context_());}catch(e){validation={valid:false,errors:[e.message]};}
 return {dataToken:liveDataToken_(),revision:state.revision,state:'EDITABLE',activeVersion:'',editingBaseVersion:'',rosterVerified:!r.errors.length,
 roster:{teachers:r.teachers.map(t=>Object.assign({},t,{isInstructor:isInstructor_(t,state.settings)})),errors:r.errors,columns:r.columns,fingerprint:r.fingerprint},
 classes,settings:state.settings,schedule,gradePlan:state.gradePlan||derivedGradePlan_(schedule,classes),unavailable:readUnavailable_(),draft,fallbackUsage:[],validation,diagnostic:validation.valid?'':validation.errors.join(' / '),stats:buildStats_(draft,r.teachers,schedule,state.settings)};
}
function getTeachingData_(){
  const r=roster_(),state=readState_(),schedule=readSchedule_(),availability=availabilityData_(r.teachers);
  const report=availabilityReportFrom_({teachers:r.teachers,schedule,settings:state.settings,
    unavailable:readUnavailable_(),teaching:availability.teaching,
    visiting:availability.visiting.rows,teachingRules:availability.rules.rows});
  return {availabilityReport:report,visiting:availability.visiting.rows,teachingRules:availability.rules.rows,
    visitingErrors:availability.visiting.errors.concat(availability.visiting.unknown.map(n=>'배정인원에 없는 겸임교사: '+n)),
    teachingRuleErrors:availability.rules.errors.concat(availability.rules.unknown.map(n=>'배정인원에 없는 감독규칙 교사: '+n))};
}
function diagnose_(){
  const r=roster_();return {spreadsheet:spreadsheet_().getName(),rosterCount:r.teachers.length,
    classCount:classes_().length,errors:r.errors,columns:r.columns,requiresRosterConfirmation:true,
    currentUser:currentEmail_(),admin:isAdmin_(),state:readState_().state,
    availability:availabilityReport_()};
}
function sheetBackup_(name){
  const tab=sheet_(name);assert_(tab,'시트를 찾을 수 없습니다: '+name);
  const rows=values_(name).map(row=>row.slice());
  if(rows.length){
    const formulas=tab.getRange(1,1,rows.length,rows[0].length).getFormulas();
    formulas.forEach((row,rowIndex)=>row.forEach((formula,columnIndex)=>{if(formula)rows[rowIndex][columnIndex]=formula;}));
  }
  return {name,rows};
}
function restoreSheetBackup_(backup){
 if(backup.name===SH.settings)backup={...backup,rows:preserveIntegrationRows_(backup.rows)};
  const tab=sheet_(backup.name),rows=backup.rows,width=Math.max(1,...rows.map(row=>row.length));
  if(rows.length)tab.getRange(1,1,rows.length,width).setValues(rows.map(row=>row.concat(Array(width-row.length).fill(''))));
  if(tab.getLastRow()>rows.length)tab.getRange(rows.length+1,1,tab.getLastRow()-rows.length,Math.max(width,tab.getLastColumn())).clearContent();
  REQUEST_VALUES_.delete(backup.name);REQUEST_SCHEDULE_=null;
}
function saveRoster_(payload){
  return ssLock_(()=>{
    const state=readState_();ensureRev_(state,payload);
    const original=roster_(),values=values_(SH.roster),headers=headerMap_(values[0]);
    assert_(payload.fingerprint===original.fingerprint,'배정인원 시트가 다른 창에서 변경되었습니다. 새로고침 후 다시 저장하세요.');
    const columns={id:col_(headers,['번호','교사ID','ID','식별번호']),name:col_(headers,['이름','교사명','성명']),subjectsText:col_(headers,['과목','담당교과','교과']),crossSubjectsText:col_(headers,['상치교과','상치교과목']),homeroom:col_(headers,['담임학급','담임','담임반']),MAIN:col_(headers,['정감독']),ASSIST:col_(headers,['부감독']),STUDY:col_(headers,['자습감독'])};
    assert_(Object.values(columns).every(column=>column>=0),'배정인원의 필수 열 제목을 확인하세요.');
    assert_(Array.isArray(payload.rows)&&payload.rows.length>=0&&payload.rows.length<=500,'교사 명단은 0~500명까지 저장할 수 있습니다.');
    const known=new Map(original.teachers.map(teacher=>[teacher.id,teacher])),seen=new Set(),existing=new Set();
    const deletedIds=payload.deletedTeacherIds||[];
    assert_(Array.isArray(deletedIds)&&deletedIds.every(id=>typeof id==='string'&&known.has(id))&&new Set(deletedIds).size===deletedIds.length,'삭제할 교사 번호가 잘못되었거나 중복되었습니다.');
    const deleted=new Set(deletedIds),removed=original.teachers.filter(teacher=>deleted.has(teacher.id));
    const rows=payload.rows.map((row,index)=>{
      const id=clean_(row.id),originalId=clean_(row.originalId),name=clean_(row.name),subjectsText=clean_(row.subjectsText),crossSubjectsText=clean_(row.crossSubjectsText),rawHomeroom=clean_(row.homeroom),homeroom=classId_(rawHomeroom);
      assert_(id&&id.length<=80&&name&&name.length<=100&&subjectsText&&subjectsText.length<=300&&crossSubjectsText.length<=300,(index+1)+'번째 교사의 번호·이름·과목을 확인하세요.');
      assert_(!seen.has(id),'교사 번호 중복: '+id);seen.add(id);
      assert_(!deleted.has(id),'삭제 대상 교사는 저장 명단에서 제외하세요: '+id);
      if(originalId){assert_(originalId===id&&known.has(id),'기존 교사 번호는 변경할 수 없습니다: '+originalId);existing.add(id);}
      else assert_(!known.has(id),'이미 등록된 교사 번호입니다: '+id);
      assert_(!rawHomeroom||homeroom,'담임학급은 1-1 형식으로 입력하세요: '+name);
      assert_(parseTeacherSubjects_(subjectsText).length,'담당교과가 비어 있습니다: '+name);
      const result={id,name,subjectsText,crossSubjectsText,homeroom};
      for(const role of ['MAIN','ASSIST','STUDY']){
        const flag=clean_(row[role]).normalize('NFKC').toUpperCase();
        assert_(['O','X'].includes(flag),name+' '+roleName_(role)+'은 O 또는 X여야 합니다.');result[role]=flag;
      }
      return {teacher:known.get(originalId),data:result};
    });
    assert_(original.teachers.every(teacher=>existing.has(teacher.id)||deleted.has(teacher.id)),'누락된 교사를 삭제 대상으로 명시하세요.');
    const backups=[SH.roster,SH.draft,SH.settings,SH.history].concat(removed.length?[SH.unavailable,SH.visiting,SH.rules]:[]).map(sheetBackup_);
    try {
      const tab=sheet_(SH.roster);let added=0;
      rows.forEach(({teacher,data})=>{
        if(teacher){
          Object.entries(columns).forEach(([field,column])=>{
            if(clean_(values[teacher.rosterRow-1][column])!==data[field]){
              const cell=tab.getRange(teacher.rosterRow,column+1,1,1);if(field==='homeroom')cell.setNumberFormat('@');cell.setValues([[safe_(data[field])]]);
            }
          });
        }else{
          const row=Array(values[0].length).fill('');Object.entries(columns).forEach(([field,column])=>row[column]=safe_(data[field]));
          const rowNumber=tab.getLastRow()+1;
          if(tab.getMaxRows()<rowNumber)tab.insertRowsAfter(tab.getMaxRows(),rowNumber-tab.getMaxRows());
          tab.getRange(rowNumber,columns.homeroom+1,1,1).setNumberFormat('@');
          tab.getRange(rowNumber,1,1,row.length).setValues([row]);added++;
        }
      });
      removed.forEach(teacher=>tab.getRange(teacher.rosterRow,1,1,values[0].length).clearContent());
      if(removed.length){
        const remainingNames=new Set(rows.map(row=>norm_(row.data.name)));
        const removedNames=new Set(removed.map(teacher=>norm_(teacher.name)).filter(name=>!remainingNames.has(name)));
        replaceRows_(SH.unavailable,values_(SH.unavailable).slice(1).filter(row=>!deleted.has(clean_(row[0]))));
        for(const name of [SH.visiting,SH.rules])replaceRows_(name,values_(name).slice(1).filter(row=>!removedNames.has(norm_(row[0]))));
        state.settings.instructorIds=(state.settings.instructorIds||[]).filter(id=>!deleted.has(String(id)));
        state.settings.missingFallbackTeacherIds=(state.settings.missingFallbackTeacherIds||[]).filter(id=>!deleted.has(String(id)));
      }
      REQUEST_VALUES_.delete(SH.roster);
      const saved=roster_();assert_(!saved.errors.length,saved.errors.join('; '));
      state.rosterVerified=false;state.rosterFingerprint='';state.draftConstraintFingerprint='';state.lastError='';
      if(!state.activeVersion)state.state='DRAFT';else if(isUnlocked_(state))state.state='EDITING';
      log_(state.activeVersion,state.activeVersion,'SAVE_ROSTER',[],[],'명단 저장 '+rows.length+'명 · 추가 '+added+'명 · 삭제 '+removed.length+'명'+(removed.length?' ('+removed.map(teacher=>teacher.id+' '+teacher.name).join(', ')+')':''));bump_(state);
      return {ok:true,revision:state.revision,count:rows.length,added,deleted:removed.length};
    }catch(error){
      const failures=[];backups.forEach(backup=>{try{restoreSheetBackup_(backup);}catch(failure){failures.push(backup.name);}});
      throw new Error('명단 저장 실패: '+error.message+(failures.length?' / 복구 실패: '+failures.join(', '):' / 기존 데이터 복구 완료'));
    }
  });
}
function verifyRoster_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function revokeRoster_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function resetPlan_(payload,state){
const options={assignments:{label:'감독 배정·출력·공개 상태',sheets:[SH.draft,SH.result,SH.print,SH.stats]},schedule:{label:'시험일정',sheets:[SH.schedule]},classes:{label:'학급입력',sheets:[SH.classes]},settings:{label:'감독 인원·교과 동의어·최적화·강사 설정',sheets:[]},unavailable:{label:'배정불가 시간',sheets:[SH.unavailable]},visiting:{label:'겸임교사 설정',sheets:[SH.visiting]},rules:{label:'교사 감독규칙',sheets:[SH.rules]},approval:{label:'명단 승인 상태·미확정 초안',sheets:[SH.draft]}};
  assert_(Array.isArray(payload.groups)&&payload.groups.length>0,'초기화할 항목을 하나 이상 선택하세요.');
  const selected=new Set(payload.groups);selected.forEach(group=>assert_(Object.prototype.hasOwnProperty.call(options,group),'허용되지 않은 초기화 항목: '+group));
  if(selected.has('classes'))selected.add('schedule');
  if([...selected].some(group=>group!=='assignments'&&group!=='approval'))selected.add('assignments');
  if(selected.has('settings'))selected.add('approval');
  const groups=Object.keys(options).filter(group=>selected.has(group)),sheets=[...new Set(groups.flatMap(group=>options[group].sheets))];
  return {groups,labels:groups.map(group=>options[group].label),sheets:sheets.map(name=>({name,rows:Math.max(0,values_(name).length-1)})),revision:state.revision,activeVersion:state.activeVersion||'',unpublish:groups.includes('assignments')&&!!state.activeVersion};
}
function getResetPlan_(payload){
  const state=readState_();ensureRev_(state,payload);return resetPlan_(payload,state);
}
function resetWorkspace_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function saveSchedule_(payload){
  return ssLock_(()=>{const s=readState_();ensureRev_(s,payload);
    const classes=classes_(), rows=(payload.rows||[]).map(x=>{
      const id=clean_(x.classId), cl=classes.find(c=>c.id===id);
      return {day:Number(x.day),date:clean_(x.date),period:Number(x.period),grade:cl?cl.grade:0,classNo:cl?cl.classNo:0,
        classId:id,type:x.type,subject:clean_(x.subject),start:clean_(x.start),end:clean_(x.end)};
    });
    validateSchedule_(rows,classes);
    const gradePlan=normalizeGradePlan_(payload.gradePlan,rows,classes);
    replaceRows_(SH.schedule,rows.map(r=>[r.day,r.date,r.period,r.grade,r.classNo,r.classId,r.type,safe_(r.subject),r.start,r.end]));
    s.gradePlan=gradePlan;s.state='DRAFT';s.draftConstraintFingerprint='';s.lastError='';bump_(s);return {revision:s.revision};
  });
}
function saveInstructorFlags_(payload){
  return ssLock_(()=>{
    const s=readState_();ensureRev_(s,payload);

    const roster=roster_();assert_(!roster.errors.length,'배정인원 시트를 먼저 확인하세요: '+roster.errors.join('; '));
    assert_(Array.isArray(payload.instructorIds),'강사 목록 형식 오류');
    const ids=payload.instructorIds.map(v=>clean_(v));
    assert_(new Set(ids).size===ids.length,'강사 교사ID가 중복되어 있습니다.');
    const known=new Set(roster.teachers.map(t=>t.id));
    ids.forEach(id=>assert_(known.has(id),'배정인원에 없는 강사 교사ID: '+id));
    s.settings=Object.assign({},s.settings,{instructorIds:ids.sort()});
    s.rosterVerified=false;
    s.rosterFingerprint='';
    s.draftConstraintFingerprint='';
    s.state='DRAFT';
    
    bump_(s);
    return {revision:s.revision,instructorCount:ids.length};
  });
}
function saveSettings_(payload){
  return ssLock_(()=>{const s=readState_();ensureRev_(s,payload);
    const p=payload.settings||{},study=Number(p.studyCount),max=Number(p.maxPerTeacher||0);
    assert_([0,1,2].indexOf(study)>=0,'자습감독 인원은 0·1·2명 중 선택하세요.');
    assert_(Number.isInteger(max)&&max>=0&&max<=100,'최대 감독 횟수 설정 오류');
    const aliases={};Object.keys(p.aliases||{}).forEach(k=>{
      const nk=norm_(k),v=norm_(p.aliases[k]);assert_(nk&&v,'교과 동의어 설정 오류');aliases[nk]=v;
    });
    const fallback=p.missingTimetableFallback==null?s.settings.missingTimetableFallback===true:p.missingTimetableFallback;
    assert_(typeof fallback==='boolean','시간표 미등록 교사 투입 설정 오류');
    const fallbackIds=p.missingFallbackTeacherIds==null?(s.settings.missingFallbackTeacherIds||[]):p.missingFallbackTeacherIds;
    assert_(Array.isArray(fallbackIds)&&fallbackIds.every(id=>typeof id==='string')&&new Set(fallbackIds).size===fallbackIds.length,'부족 시 투입 교사 목록 오류');
    const teacherIds=new Set(roster_().teachers.map(teacher=>teacher.id));fallbackIds.forEach(id=>assert_(teacherIds.has(id),'명단에 없는 부족 시 투입 교사: '+id));
    assert_(!fallback||fallbackIds.length>0,'부족 시 투입을 허용할 교사를 하나 이상 선택하세요.');
    s.settings={studyCount:study,maxPerTeacher:max,aliases,instructorIds:Array.isArray(s.settings.instructorIds)?s.settings.instructorIds:[],missingTimetableFallback:fallback,missingFallbackTeacherIds:fallbackIds.slice().sort(),optimization:optimizationConfig_({optimization:p.optimization||s.settings.optimization},true)};s.state='DRAFT';s.draftConstraintFingerprint='';bump_(s);return {revision:s.revision};
  });
}
function saveUnavailable_(payload){
  return ssLock_(()=>{const s=readState_();ensureRev_(s,payload);
    const ids=new Set(roster_().teachers.map(t=>t.id)),unique=new Set();
    const rows=(payload.rows||[]).map(r=>{
      const id=clean_(r.teacherId),date=clean_(r.date),period=Number(r.period),reason=clean_(r.reason);
      assert_(ids.has(id)&&validDate_(date)&&period>=1&&period<=5,'배정불가 데이터가 잘못되었습니다.');
      const key=id+'|'+date+'|'+period;assert_(!unique.has(key),'배정불가 항목 중복: '+key);unique.add(key);
      return [id,date,period,safe_(reason)];
    });replaceRows_(SH.unavailable,rows);s.state='DRAFT';s.draftConstraintFingerprint='';bump_(s);return {revision:s.revision};
  });
}
function readDraft_(){
  const schedule=readSchedule_();
  const scheduleByKey=new Map(schedule.map(x=>[x.date+'|'+x.period+'|'+x.classId,x]));
  return values_(SH.draft).slice(1).filter(r=>r[0]!==''&&r[0]!=null).map(r=>{
    const date=dateStr_(r[1]),period=Number(r[2]),classId=classId_(r[3])||clean_(r[3]),role=String(r[6]);
    const cell=scheduleByKey.get(date+'|'+period+'|'+classId)||{};
    return {key:date+'|'+period+'|'+classId+'|'+role,day:Number(r[0]),date,period,classId,
      type:String(r[4]),subject:String(r[5]),role,teacherId:clean_(r[7]),fixed:String(r[8]).toUpperCase()==='TRUE',
      start:cell.start||'',end:cell.end||''};
  });
}
function writeDraft_(arr){replaceRows_(SH.draft,arr.map(a=>[a.day,a.date,a.period,a.classId,a.type,a.subject,a.role,a.teacherId,!!a.fixed,now_()]));}
function makeJobs_(schedule, settings){
  const jobs=[];schedule.forEach(r=>{
    const roles=r.type==='EXAM'?['MAIN','ASSIST']:Array.from({length:settings.studyCount},(_,i)=>'STUDY'+(i+1));
    roles.forEach(role=>jobs.push({key:r.date+'|'+r.period+'|'+r.classId+'|'+role,
      day:r.day,date:r.date,period:r.period,classId:r.classId,type:r.type,subject:r.subject,role,start:r.start||'',end:r.end||''}));
  });return jobs;
}
function canonicalSubject_(s,settings){const x=norm_(s);return settings.aliases[x]||x;}
function conflictTime_(a,b){
  if(a.date!==b.date)return false;
  if(a.period===b.period)return true;
  if(a.start&&a.end&&b.start&&b.end)return a.start<b.end&&b.start<a.end;
  return false;
}
function isInstructor_(teacher,settings){
  return Array.isArray(settings&&settings.instructorIds) && settings.instructorIds.some(id=>String(id)===String(teacher.id));
}
function eligible_(teacher,job,ctx,excludeUsed){
  const why=[];
  const role=job.role.startsWith('STUDY')?'STUDY':job.role;
  if(teacher.roleEligibility&&teacher.roleEligibility[role]!==true)why.push(roleName_(role)+'불가(X)');
  // Instructor exclusion is absolute, including 수업 예외, manual swaps, and confirmation.
  const idx=constraintIndex_(ctx);
  if(idx.instructorIds.has(String(teacher.id)))why.push('강사감독자동제외');
  if(teacher.homeroom&&teacher.homeroom===job.classId)why.push('담임학급');
  if(job.type==='EXAM') {
    const examSubject=canonicalSubject_(job.subject,ctx.settings);
    if((teacher.subjects||[]).some(sub=>canonicalSubject_(sub,ctx.settings)===examSubject))why.push('동일교과');
    // 상치교과 is a hard constraint, never relaxed by 수업 감독 포함 or 수동 배정.
    if((teacher.crossSubjects||[]).some(sub=>canonicalSubject_(sub,ctx.settings)===examSubject))why.push('상치교과');
  }
  if(idx.unavailable.has(teacher.id+'|'+job.date+'|'+job.period))why.push('배정불가');
  teachingRuleRestrictions_(teacher,job,ctx).forEach(reason=>why.push(reason));
  teachAvailability_(teacher,job,ctx).forEach(reason=>why.push(reason));
  visitingAvailability_(teacher,job,ctx.visiting,ctx).forEach(reason=>why.push(reason));
  if(excludeUsed&&excludeUsed.some(a=>a.teacherId===teacher.id&&a.key!==job.key&&conflictTime_(a,job)))why.push('동일시간중복');
  return why;
}
function context_(validate=true){const r=roster_(),s=readState_(),schedule=readSchedule_();
  assert_(!r.errors.length,'교사 명단 오류: '+r.errors.join('; '));

  if(validate)validateSchedule_(schedule,classes_());
  const a=availabilityData_(r.teachers);
  assert_(a.teaching.enabled,'교사시간표/수업시간표에 수업 데이터를 입력하거나, 수업이 없는 교사는 교사명·수업없음 행으로 확인하세요. 시간표가 모두 비어 있으면 배정하지 않습니다.');
  assert_(!a.teaching.errors.length,'교사시간표 오류: '+a.teaching.errors.slice(0,5).join('; '));
  assert_(!a.visiting.errors.length,'겸임교사설정 오류: '+a.visiting.errors.slice(0,5).join('; '));
  assert_(!a.visiting.unknown.length,'겸임교사설정의 교사를 배정인원에서 찾을 수 없습니다: '+a.visiting.unknown.join(', '));
  assert_(!a.rules.errors.length&&!a.rules.unknown.length,'교사감독규칙 오류: '+a.rules.errors.concat(a.rules.unknown).slice(0,5).join('; '));
  return {teachers:r.teachers,settings:s.settings,schedule,unavailable:readUnavailable_(),teaching:a.teaching,visiting:a.visiting.rows,teachingRules:a.rules.rows};
}
function fullValidate_(assignments,ctx){
  const jobs=makeJobs_(ctx.schedule,ctx.settings),by=new Map(),errors=[];
  jobs.forEach(j=>by.set(j.key,j));
  const names=new Map(ctx.teachers.map(t=>[t.id,t]));
  const seen=new Set();
  assignments.forEach(a=>{
    const job=by.get(a.key);if(!job){errors.push('존재하지 않는 감독 자리: '+a.key);return;}
    const t=names.get(a.teacherId);if(!t){errors.push('알 수 없는 교사: '+a.teacherId);return;}
    if(a.day!==job.day || a.date!==job.date || a.period!==job.period || a.classId!==job.classId || a.role!==job.role || a.type!==job.type || a.subject!==job.subject)errors.push('원본 시험일정과 다른 배정 레코드: '+a.key);
    if(seen.has(a.key))errors.push('자리 중복: '+a.key);seen.add(a.key);
    const why=eligible_(t,job,ctx,null);if(why.length)errors.push(a.key+': '+why.join(','));
  });
  jobs.forEach(j=>{if(!seen.has(j.key))errors.push('감독자 미배정: '+j.key);});
  const byTeacherDay=new Map();
  assignments.forEach(a=>{const k=a.teacherId+'|'+a.date;
    if(!byTeacherDay.has(k))byTeacherDay.set(k,[]);byTeacherDay.get(k).push(a);
  });
  byTeacherDay.forEach(items=>{for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j];
    if(conflictTime_(a,b))errors.push('같은 시간 중복 배정: '+a.teacherId+' '+a.key+' / '+b.key);
  }});
  const counts={};assignments.forEach(a=>counts[a.teacherId]=(counts[a.teacherId]||0)+1);
  const max=ctx.settings.maxPerTeacher||0;
  if(max)Object.keys(counts).forEach(id=>{if(counts[id]>max)errors.push('개인별 감독 상한 초과: '+id);});
  return {valid:!errors.length,errors,required:jobs.length,assigned:assignments.length};
}
function statsMap_(assignments,teachers){
  const m={};teachers.forEach(t=>m[t.id]={total:0,MAIN:0,ASSIST:0,STUDY:0,days:{},periods:[]});
  assignments.forEach(a=>{const s=m[a.teacherId];if(!s)return;s.total++;s[a.role.startsWith('STUDY')?'STUDY':a.role]++;
    s.days[a.date]=(s.days[a.date]||0)+1;s.periods.push(a);
  });return m;
}
function buildStats_(a,t,schedule,settings){
  const m=statsMap_(a,t),eligibleCount=t.filter(x=>!isInstructor_(x,settings)).length;
  const avg=eligibleCount?a.length/eligibleCount:0;
  return t.map(x=>({id:x.id,name:x.name,subjects:(x.subjects||[]).join(', '),crossSubjects:(x.crossSubjects||[]).join(', '),homeroom:x.homeroom,
    isInstructor:isInstructor_(x,settings),main:m[x.id].MAIN,assist:m[x.id].ASSIST,study:m[x.id].STUDY,total:m[x.id].total,
    delta:isInstructor_(x,settings)?0:Number((m[x.id].total-avg).toFixed(2)),days:m[x.id].days}));
}
function basicSummary_(a,t,s,settings){const stats=buildStats_(a,t,s,settings).filter(x=>!x.isInstructor), vals=stats.map(x=>x.total);
  return {teachers:stats.length,required:a.length,assigned:a.length,average:stats.length?Number((a.length/stats.length).toFixed(2)):0,
    min:Math.min.apply(null,vals.length?vals:[0]),max:Math.max.apply(null,vals.length?vals:[0]),days:new Set(s.map(x=>x.date)).size};
}
/** Build the week-level teaching ratios AND the actual teaching still held on exam dates.
 * Date/period/classId all come from validated schedules; cancelled classes are
 * removed only in their own exact slot, never for an entire grade/day. */
function workloadIndex_(ctx){
  const old=ctx._workloadIndex;
  if(old&&old.teaching===ctx.teaching&&old.schedule===ctx.schedule&&old.settings===ctx.settings)return old;
  const gradeHours=new Map(),teachingByTime=new Map(),released=new Map(),teacherById=new Map((ctx.teachers||[]).map(t=>[t.id,t])),dates=[...new Set((ctx.schedule||[]).map(r=>r.date))];
  (ctx.schedule||[]).forEach(r=>{const k=r.date+'|'+r.period;
    if(!released.has(k))released.set(k,new Set());released.get(k).add(r.classId);
  });
  (ctx.teaching?.rows||[]).forEach(r=>{
    const grade=Number(String(r.classId||'').split('-')[0]);
    if(grade>=1&&grade<=12){if(!gradeHours.has(r.teacherId))gradeHours.set(r.teacherId,{});
      const tally=gradeHours.get(r.teacherId);tally[grade]=(tally[grade]||0)+1;
    }
    const key=r.teacherId+'|'+r.weekday+'|'+r.period;
    if(!teachingByTime.has(key))teachingByTime.set(key,[]);teachingByTime.get(key).push(r);
  });
  const baseline=new Map(),allDays=[];
  for(const date of dates){const weekday=dayIndex_(date);
    for(const t of (ctx.teachers||[])){
      const periods=new Set();
      for(let p=1;p<=10;p++){
        const teaching=teachingByTime.get(t.id+'|'+weekday+'|'+p)||[];
        if(teaching.some(row=>!row.classId||!(released.get(date+'|'+p)||new Set()).has(row.classId)))periods.add(p);
      }
      const key=t.id+'|'+date;baseline.set(key,periods);allDays.push(key);
    }
  }
  const result={teaching:ctx.teaching,schedule:ctx.schedule,settings:ctx.settings,baseline,gradeHours,teacherById,dates,allDays};
  Object.defineProperty(ctx,'_workloadIndex',{value:result,configurable:true,enumerable:false});
  return result;
}
function gradeAffinity_(teacher,grade,ctx){
  const hours=workloadIndex_(ctx).gradeHours.get(teacher.id)||{},sum=Object.values(hours).reduce((x,y)=>x+y,0);
  return sum? (hours[grade]||0)/sum : 0;
}
/** Each continuous teaching/supervision period is counted once, with optional school lunch break. */
function runSummary_(periods,breakAfter){
  const list=[...periods].map(Number).sort((a,b)=>a-b),segments=[];
  if(!list.length)return {maxRun:0,three:0,four:0,five:0,segments:[]};
  let len=1;for(let i=1;i<list.length;i++){
    if(list[i]===list[i-1]+1&&(!breakAfter||list[i-1]!==breakAfter))len++;
    else {segments.push(len);len=1;}
  }
  segments.push(len);
  return {maxRun:Math.max(...segments),three:segments.filter(n=>n>=3).length,
    four:segments.filter(n=>n>=4).length,five:segments.filter(n=>n>=5).length,segments};
}
function workloadAnalysis_(arr,ctx){
  const idx=workloadIndex_(ctx),o=optimizationConfig_(ctx.settings),periods=new Map(),teachers={};
  (arr||[]).forEach(a=>{const k=a.teacherId+'|'+a.date;
    if(!periods.has(k))periods.set(k,new Set());periods.get(k).add(Number(a.period));
  });
  let extraThree=0,extraFour=0,extraFive=0,totalThree=0,totalFour=0,totalFive=0;
  for(const key of idx.allDays){
    const original=idx.baseline.get(key)||new Set(),after=new Set(original);
    (periods.get(key)||new Set()).forEach(p=>after.add(p));
    const before=runSummary_(original,o.lunchBreakAfter),now=runSummary_(after,o.lunchBreakAfter);
    const added3=Math.max(0,now.three-before.three),added4=Math.max(0,now.four-before.four),added5=Math.max(0,now.five-before.five);
    extraThree+=added3;extraFour+=added4;extraFive+=added5;
    totalThree+=now.three;totalFour+=now.four;totalFive+=now.five;
    const id=key.slice(0,key.lastIndexOf('|'));
    if(!teachers[id])teachers[id]={maxBefore:0,maxAfter:0,addedThree:0,addedFour:0,addedFive:0,byDate:{}};
    const item=teachers[id];item.maxBefore=Math.max(item.maxBefore,before.maxRun);item.maxAfter=Math.max(item.maxAfter,now.maxRun);
    item.addedThree+=added3;item.addedFour+=added4;item.addedFive+=added5;
    const date=key.slice(key.lastIndexOf('|')+1);item.byDate[date]={before:before.maxRun,after:now.maxRun,addedThree:added3,addedFour:added4,addedFive:added5};
  }
  return {teachers,extraThree,extraFour,extraFive,totalThree,totalFour,totalFive};
}
/** Distinct role counts + weighted burden + actual added consecutive runs. */
function objectiveParts_(arr,ctx){
  const o=optimizationConfig_(ctx.settings),by=statsMap_(arr,ctx.teachers),active=(ctx.teachers||[]).filter(t=>!isInstructor_(t,ctx.settings));
  const vals=key=>active.map(t=>by[t.id][key]);
  const range=x=>x.length?Math.max(...x)-Math.min(...x):0;
  const variance=x=>{if(!x.length)return 0;const m=x.reduce((a,b)=>a+b,0)/x.length;return x.reduce((a,b)=>a+(b-m)*(b-m),0)/x.length;};
  const main=vals('MAIN'),assist=vals('ASSIST'),study=vals('STUDY'),total=vals('total');
  const burdens=active.map(t=>{
    const c=by[t.id];return o.mainWeight*c.MAIN+o.assistWeight*c.ASSIST+o.studyWeight*c.STUDY;
  });
  const work=workloadAnalysis_(arr,ctx);let affinity=0,days=0;
  arr.forEach(a=>{const t=workloadIndex_(ctx).teacherById.get(a.teacherId);if(t)affinity+=gradeAffinity_(t,Number(a.classId.split('-')[0]),ctx);});
  active.forEach(t=>{days+=Object.values(by[t.id].days).reduce((n,c)=>n+c*c,0);});
  const fairness=range(main)*120+range(assist)*120+range(study)*85+range(total)*100+
    variance(main)*6+variance(assist)*6+variance(study)*4+variance(total)*8;
  const burden=range(burdens)*15+variance(burdens)*2;
  const gradeBonus=o.gradeStrength*affinity;
  // Included for diagnostics; not an unbounded claim about actual probability.
  return {fairness,burden,gradePenalty:o.gradeStrength*(arr.length-affinity),gradeBonus,
    mainSpread:range(main),assistSpread:range(assist),studySpread:range(study),totalSpread:range(total),
    burdenSpread:range(burdens),daily:days,work,gradeAffinityTotal:affinity,settings:o};
}
function objectiveVector_(arr,ctx){
  const v=objectiveParts_(arr,ctx),o=v.settings;
  const severe=[...(ctx.settings.missingTimetableFallback===true?[arr.filter(assignment=>fallbackAssignment_(assignment,ctx)).length]:[]),...(o.avoidFour?[v.work.extraFive,v.work.extraFour]:[0,0])];
  const fairness=o.roleFairness?v.fairness:0,burden=o.burdenFairness?v.burden:0,
    three=o.avoidThree?v.work.extraThree:0, grade=v.gradePenalty,
    dates=o.dateBalance?v.daily:0;
  // Lexicographic soft policy. First valid full assignments only; no objective can soften hard constraints.
  if(o.profile==='fairness')return [...severe,fairness,burden,three,grade,dates];
  if(o.profile==='consecutive')return [...severe,three,fairness,burden,grade,dates];
  if(o.profile==='grade')return [...severe,fairness,grade,burden,three,dates];
  return [...severe,fairness,burden,three,grade,dates];
}
function compareObjectives_(a,b){
  if(!b)return -1;
  for(let i=0;i<a.length;i++){if(a[i]<b[i]-0.000001)return -1;if(a[i]>b[i]+0.000001)return 1;}
  return 0;
}
// A monotonic display-only scalar; search and apply decisions use vector comparison.
function score_(arr,ctx){const vector=objectiveVector_(arr,ctx),v=vector.length===8?vector.slice(1):vector;
  return Number(((vector.length===8?vector[0]*1e15:0)+v[0]*1e12+v[1]*1e10+v[2]*1e5+v[3]*1e3+v[4]*20+v[5]*2+v[6]).toFixed(3));
}
function optimizationReportFrom_(arr,ctx){
  const p=objectiveParts_(arr,ctx),by=statsMap_(arr,ctx.teachers),o=p.settings,work=p.work.teachers,
    t=(ctx.teachers||[]).map(x=>{
      const c=by[x.id],hours=workloadIndex_(ctx).gradeHours.get(x.id)||{},totalHours=Object.values(hours).reduce((a,b)=>a+b,0);
      const sorted=Object.entries(hours).sort((a,b)=>b[1]-a[1]);
      return {id:x.id,name:x.name,isInstructor:isInstructor_(x,ctx.settings),main:c.MAIN,assist:c.ASSIST,study:c.STUDY,total:c.total,
        burden:Number((c.MAIN*o.mainWeight+c.ASSIST*o.assistWeight+c.STUDY*o.studyWeight).toFixed(2)),
        gradeHours:hours,primaryGrade:sorted.length?Number(sorted[0][0]):null,gradeShares:Object.fromEntries(Object.entries(hours).map(([g,h])=>[g,totalHours?h/totalHours:0])),
        maxBefore:work[x.id]?.maxBefore||0,maxAfter:work[x.id]?.maxAfter||0,
        addedThree:work[x.id]?.addedThree||0,addedFour:work[x.id]?.addedFour||0,addedFive:work[x.id]?.addedFive||0,
        byDate:work[x.id]?.byDate||{}};
    });
  return {metrics:{required:makeJobs_(ctx.schedule,ctx.settings).length,assigned:arr.length,
     mainSpread:p.mainSpread,assistSpread:p.assistSpread,studySpread:p.studySpread,totalSpread:p.totalSpread,
     burdenSpread:p.burdenSpread,addedThree:p.work.extraThree,addedFour:p.work.extraFour,addedFive:p.work.extraFive,
     totalThree:p.work.totalThree,totalFour:p.work.totalFour,gradeAffinityTotal:p.gradeAffinityTotal,
     score:score_(arr,ctx)},teachers:t,optimization:o,fallbackUsage:fallbackUsage_(arr,ctx)};
}
/** Read-only 0% versus configured grade preference, identical input, seed and time budget. */
function compareGradeBonus_(payload){
  const ctx=context_(),seed=Number(payload&&payload.seed)||2026,budget=3500;
  const opt=optimizationConfig_(ctx.settings);
  const off={...ctx,settings:{...ctx.settings,optimization:{...opt,gradeStrength:0}}};
  const on={...ctx,settings:{...ctx.settings,optimization:{...opt,gradeStrength:opt.gradeStrength}}};
  const r0=solve_(off,seed,budget),r1=solve_(on,seed,budget);
  if(!r0.ok||!r1.ok)return {ok:false,zero:r0.ok,current:r1.ok,explanation:'현재 조건에서 두 배정이 모두 완성되지 않았습니다. 절대 제약은 완화하지 않았습니다.'};
  return {ok:true,seed,gradeStrength:opt.gradeStrength,applied:false,
    zero:optimizationReportFrom_(r0.assignments,off).metrics,
    current:optimizationReportFrom_(r1.assignments,on).metrics,
    elapsedMs:{zero:r0.elapsed,current:r1.elapsed},
    note:'동일 조건과 탐색 예산의 1회 비교입니다. 50% 설정이 실제 확률 50% 상승을 보장하지 않습니다.'};
}
function optimizationReport_(){
  const s=readState_(),snap=null;
  const ctx=snap?snapshotContext_(snap):context_(),arr=snap?snap.assignments:readDraft_();
  return optimizationReportFrom_(arr,ctx);
}
function seeded_(seed){let a=Number(seed)||13579;return ()=>{a=(Math.imul(a^a>>>15,1|a)+0x6D2B79F5)|0;let z=Math.imul(a^a>>>7,61|a)^a;return ((z^z>>>14)>>>0)/4294967296;};}
function makeAttempt_(jobs,ctx,seed,eligibleByJob){
  const rand=seeded_(seed),all=[],stats=statsMap_([],ctx.teachers),opt=optimizationConfig_(ctx.settings),idx=workloadIndex_(ctx);
  // Most constrained simultaneous sessions first.
  const groups={};jobs.forEach(j=>{const k=j.date+'|'+j.period;(groups[k]||(groups[k]=[])).push(j);});
  const gkeys=Object.keys(groups).sort((a,b)=>{
    const tight=k=>groups[k].reduce((n,j)=>n+eligibleByJob.get(j.key).length,0)/groups[k].length;
    return tight(a)-tight(b)||a.localeCompare(b);
  });
  for(const gkey of gkeys){
    const group=groups[gkey],owner={},matched={},locked={};
    const sorted=group.slice().sort((a,b)=>{
      const ca=eligibleByJob.get(a.key).length;
      const cb=eligibleByJob.get(b.key).length;
      return ca-cb||a.key.localeCompare(b.key);
    });
    const jobsByKey=new Map(sorted.map(j=>[j.key,j]));
    const fixed=ctx.fixed||{};
    for(const job of sorted){
      const id=fixed[job.key];if(!id)continue;
      const teacher=ctx.teachers.find(t=>t.id===id);
      if(!teacher||!eligibleByJob.get(job.key).some(t=>t.id===id)||
        all.some(a=>a.teacherId===id&&conflictTime_(a,job))||owner[id])return {ok:false,reason:'고정 배정 충돌',job:job.key};
      owner[id]=job.key;matched[job.key]=id;locked[job.key]=true;
    }
    function dfs(job,seen,allowFallback=true){
      const candidates=eligibleByJob.get(job.key).filter(t=>
        (allowFallback||!fallbackAssignment_(Object.assign({},job,{teacherId:t.id}),ctx))&&
        (!ctx.settings.maxPerTeacher || stats[t.id].total<ctx.settings.maxPerTeacher) &&
        !all.some(a=>a.teacherId===t.id&&conflictTime_(a,job)));
      // Decorate-sort-undecorate: compute each teacher's score once, not O(log N)
      // times in the Array.sort comparator. Initial assignments are only heuristic;
      // the validated multiobjective local search decides final improvements.
      const grade=Number(job.classId.split('-')[0]),r=job.role.startsWith('STUDY')?'STUDY':job.role;
      const weighted=candidates.map(t=>{
        const st=stats[t.id],ratio=gradeAffinity_(t,grade,ctx);
        const adjacent=st.periods.some(z=>z.date===job.date&&Math.abs(z.period-job.period)===1)?1:0;
        const base=idx.baseline.get(t.id+'|'+job.date)||new Set(),occupied=new Set(base);
        st.periods.filter(a=>a.date===job.date).forEach(a=>occupied.add(a.period));
        const prev=runSummary_(occupied,opt.lunchBreakAfter);
        occupied.add(job.period);const next=runSummary_(occupied,opt.lunchBreakAfter);
        const heavy=opt.avoidFour?Math.max(0,next.four-prev.four)*75+Math.max(0,next.five-prev.five)*250:0;
        const medium=opt.avoidThree?Math.max(0,next.three-prev.three)*15:0;
        const roleBurden=(r==='MAIN'?opt.mainWeight:r==='ASSIST'?opt.assistWeight:opt.studyWeight);
        const gradeMultiplier=1+opt.gradeStrength*ratio;
        const affinityCost=opt.gradeStrength?50*Math.log(gradeMultiplier):0;
        const cost=180*st.total+40*st[r]+10*roleBurden*st.total+
          12*Math.abs(st.MAIN-st.ASSIST+(r==='MAIN'?1:r==='ASSIST'?-1:0))+
          8*(st.days[job.date]||0)+9*adjacent+heavy+medium-affinityCost+rand()*15;
        return {t,cost};
      });
      weighted.sort((a,b)=>a.cost-b.cost);
      candidates.splice(0,candidates.length,...weighted.map(x=>x.t));
      for(const t of candidates){
        if(seen.has(t.id))continue;seen.add(t.id);
        const prev=owner[t.id];
        if(!prev||(!locked[prev]&&dfs(jobsByKey.get(prev),seen,allowFallback))){
          matched[job.key]=t.id;owner[t.id]=job.key;return true;
        }
      }
      return false;
    }
    if(ctx.settings.missingTimetableFallback===true)for(const job of sorted){if(!locked[job.key])dfs(job,new Set(),false);}
    for(const job of sorted){if(locked[job.key]||matched[job.key])continue;
      if(!dfs(job,new Set())){
        const free=sorted.filter(x=>!matched[x.key]).map(x=>x.key);
        const explanations=free.map(key=>{const j=jobsByKey.get(key),why={};
          ctx.teachers.forEach(t=>eligible_(t,j,ctx,all).forEach(w=>why[w]=(why[w]||0)+1));
          return {job:key,possible:ctx.teachers.filter(t=>!eligible_(t,j,ctx,all).length).length,reasons:why};
        });
        return {ok:false,reason:'같은 교시의 감독 인원 및 후보 경합으로 완전 배정 불가',unmatched:explanations,
          capacity:group.length,matched:Object.keys(matched).length};
      }
    }
    for(const job of sorted){const teacherId=matched[job.key];
      const a=Object.assign({},job,{teacherId,fixed:!!fixed[job.key]});
      all.push(a); const s=stats[teacherId];s.total++;
      s[job.role.startsWith('STUDY')?'STUDY':job.role]++;
      s.days[job.date]=(s.days[job.date]||0)+1;s.periods.push(a);
    }
  }
  return {ok:true,assignments:all};
}
/** Incremental exact lexicographic evaluator for LOCAL changes only.
 * Static candidate eligibility remains in eligible_ and fullValidate_.
 * This evaluator NEVER decides whether a candidate is lawful.
 * It maintains grade affinity, role counts, date distribution and per-teacher-day
 * run penalties, then rolls trial updates back without changing assignments. */
function incrementalObjective_(assignments,ctx){
  const settings=optimizationConfig_(ctx.settings),index=workloadIndex_(ctx),ids=(ctx.teachers||[]).filter(t=>!isInstructor_(t,ctx.settings)).map(t=>t.id);
  const role=a=>a.role.startsWith('STUDY')?'STUDY':a.role;
  const stats=new Map((ctx.teachers||[]).map(t=>[t.id,{MAIN:0,ASSIST:0,STUDY:0,total:0,days:new Map()}]));
  const dayPeriods=new Map(),dayMetrics=new Map(),baseMetrics=new Map(),affinities=new Map();
  function affinity(id,job){
    const grade=Number(String(job.classId).split('-')[0]),key=id+'|'+grade;
    if(!affinities.has(key)){
      const hours=index.gradeHours.get(id)||{};const total=Object.values(hours).reduce((a,b)=>a+b,0);
      affinities.set(key,total?(hours[grade]||0)/total:0);
    }
    return affinities.get(key);
  }
  function update(a,dir){
    const s=stats.get(a.teacherId);if(!s)throw new Error('알 수 없는 교사: '+a.teacherId);
    const r=role(a);s[r]+=dir;s.total+=dir;
    const old=s.days.get(a.date)||0,now=old+dir;
    if(now)s.days.set(a.date,now);else s.days.delete(a.date);
    const key=a.teacherId+'|'+a.date;
    let counts=dayPeriods.get(key);if(!counts){counts=new Map();dayPeriods.set(key,counts);}
    const n=(counts.get(a.period)||0)+dir;
    if(n)counts.set(a.period,n);else counts.delete(a.period);
    affinityTotal+=dir*affinity(a.teacherId,a);
    if(fallbackAssignment_(a,ctx))fallbackTotal+=dir;
  }
  let affinityTotal=0,fallbackTotal=0;
  for(const a of assignments)update(a,1);
  let extraThree=0,extraFour=0,extraFive=0;
  for(const key of index.allDays){
    baseMetrics.set(key,runSummary_(index.baseline.get(key)||new Set(),settings.lunchBreakAfter));
  }
  function refreshDay(key){
    const before=dayMetrics.get(key);
    if(before){extraThree-=before.three;extraFour-=before.four;extraFive-=before.five;}
    const base=index.baseline.get(key)||new Set(),after=new Set(base);
    (dayPeriods.get(key)||new Map()).forEach((n,p)=>{if(n>0)after.add(Number(p));});
    const prev=baseMetrics.get(key)||runSummary_(base,settings.lunchBreakAfter);
    const now=runSummary_(after,settings.lunchBreakAfter);
    const next={three:Math.max(0,now.three-prev.three),four:Math.max(0,now.four-prev.four),five:Math.max(0,now.five-prev.five)};
    dayMetrics.set(key,next);extraThree+=next.three;extraFour+=next.four;extraFive+=next.five;
  }
  for(const key of index.allDays)refreshDay(key);
  function variance(values){
    if(!values.length)return 0;
    const average=values.reduce((a,b)=>a+b,0)/values.length;
    return values.reduce((a,b)=>a+(b-average)*(b-average),0)/values.length;
  }
  function spread(values){return values.length?Math.max(...values)-Math.min(...values):0;}
  function vector(){
    const main=[],assist=[],study=[],total=[],burdens=[];let daily=0;
    for(const id of ids){const s=stats.get(id);
      main.push(s.MAIN);assist.push(s.ASSIST);study.push(s.STUDY);total.push(s.total);
      burdens.push(s.MAIN*settings.mainWeight+s.ASSIST*settings.assistWeight+s.STUDY*settings.studyWeight);
      s.days.forEach(n=>{daily+=n*n;});
    }
    const fairness=spread(main)*120+spread(assist)*120+spread(study)*85+spread(total)*100+
      variance(main)*6+variance(assist)*6+variance(study)*4+variance(total)*8;
    const burden=spread(burdens)*15+variance(burdens)*2;
    const severe=[...(ctx.settings.missingTimetableFallback===true?[fallbackTotal]:[]),...(settings.avoidFour?[extraFive,extraFour]:[0,0])];
    const fair=settings.roleFairness?fairness:0,b=settings.burdenFairness?burden:0,
      three=settings.avoidThree?extraThree:0,grade=settings.gradeStrength*(assignments.length-affinityTotal),
      dates=settings.dateBalance?daily:0;
    if(settings.profile==='fairness')return [...severe,fair,b,three,grade,dates];
    if(settings.profile==='consecutive')return [...severe,three,fair,b,grade,dates];
    if(settings.profile==='grade')return [...severe,fair,grade,b,three,dates];
    return [...severe,fair,b,three,grade,dates];
  }
  /** changes = [{before: assignment, after: assignment}], no mutation of caller array. */
  function trial(changes){
    const affected=new Set();
    for(const c of changes){update(c.before,-1);update(c.after,1);
      affected.add(c.before.teacherId+'|'+c.before.date);
      affected.add(c.after.teacherId+'|'+c.after.date);
    }
    affected.forEach(refreshDay);
    const v=vector();
    for(let i=changes.length-1;i>=0;i--){const c=changes[i];update(c.after,-1);update(c.before,1);}
    affected.forEach(refreshDay);
    return v;
  }
  return {vector,trial};
}
/** Same optimization policy as v2.1, but objective trials touch only changed
 * teachers and dates. A full authoritative validation still guards commits. */
function optimizeLocal_(assignments,ctx,until){
  let best=assignments.slice(),changes=0;
  const evaluation=incrementalObjective_(best,ctx),teacherIndex=new Map(ctx.teachers.map(t=>[t.id,t]));
  const locked=ctx.fixed||{}, staticCandidates=new Map();
  for(const a of best)staticCandidates.set(a.key,ctx.teachers.filter(t=>eligible_(t,a,ctx,[]).length===0));
  const staticCandidateIds=new Map([...staticCandidates].map(([key,teachers])=>[key,new Set(teachers.map(t=>t.id))]));
  let occupancy=new Map();
  function indexOccupancy(){occupancy=new Map();best.forEach((value,index)=>{if(!occupancy.has(value.teacherId))occupancy.set(value.teacherId,[]);occupancy.get(value.teacherId).push({value,index});});}
  indexOccupancy();
  let bestVector=evaluation.vector(),improved=true;
  const max=Number(ctx.settings.maxPerTeacher)||0;
  function conflict(candidate,teacherId,exceptA,exceptB){
    for(const item of occupancy.get(teacherId)||[]){
      if(item.index===exceptA||item.index===exceptB)continue;
      if(conflictTime_(item.value,candidate))return true;
    }
    return false;
  }
  while(improved&&changes<200&&Date.now()<until){
    improved=false;
    for(let i=0;i<best.length&&!improved&&Date.now()<until;i++){
      const a=best[i];if(locked[a.key])continue;
      for(const t of staticCandidates.get(a.key)){
        if(Date.now()>=until)break;
        if(t.id===a.teacherId||conflict(a,t.id,i,-1))continue;
        if(max && (occupancy.get(t.id)||[]).length>=max)continue;
        const replacement={...a,teacherId:t.id};
        const vector=evaluation.trial([{before:a,after:replacement}]);
        if(compareObjectives_(vector,bestVector)<0){
          const proposal=best.slice();proposal[i]=replacement;
          if(fullValidate_(proposal,ctx).valid){best=proposal;bestVector=vector;improved=true;changes++;break;}
        }
      }
    }
    for(let i=0;i<best.length&&!improved&&Date.now()<until;i++){
      for(let j=i+1;j<best.length&&Date.now()<until;j++){
        const a=best[i],b=best[j];if(locked[a.key]||locked[b.key]||a.teacherId===b.teacherId)continue;
        const teacherA=teacherIndex.get(b.teacherId),teacherB=teacherIndex.get(a.teacherId);
        if(!teacherA||!teacherB||!staticCandidateIds.get(a.key).has(b.teacherId)||
          !staticCandidateIds.get(b.key).has(a.teacherId))continue;
        if(conflict(a,b.teacherId,i,j)||conflict(b,a.teacherId,i,j))continue;
        const changeA={...a,teacherId:b.teacherId},changeB={...b,teacherId:a.teacherId};
        const vector=evaluation.trial([{before:a,after:changeA},{before:b,after:changeB}]);
        if(compareObjectives_(vector,bestVector)<0){
          const proposal=best.slice();proposal[i]=changeA;proposal[j]=changeB;
          if(fullValidate_(proposal,ctx).valid){best=proposal;bestVector=vector;improved=true;changes++;break;}
        }
      }
      if(improved)break;
    }
    // Evaluation base is built from the last accepted assignment, refresh
    // once per accepted move to keep the incremental state exact.
    if(improved){
      // trial() always rolls back; reconstruct only at successful changes.
      indexOccupancy();
      const refreshed=incrementalObjective_(best,ctx);
      evaluation.vector=refreshed.vector;evaluation.trial=refreshed.trial;
      bestVector=evaluation.vector();
    }
  }
  const check=fullValidate_(best,ctx);
  assert_(check.valid,'증분 최적화 결과의 최종 검증에 실패했습니다: '+check.errors.slice(0,4).join('; '));
  return {assignments:best,score:score_(best,ctx),vector:bestVector,changes};
}

function solve_(ctx,seed,ms){
  const jobs=makeJobs_(ctx.schedule,ctx.settings),begin=Date.now(),deadline=begin+Math.min(ms||APP.MAX_OPTIMIZE_MS,APP.MAX_OPTIMIZE_MS);
  if(!jobs.length)return {ok:true,assignments:[],score:0};
  assert_(jobs.length<=1500,'감독 자리 1,500개를 초과합니다. 배정 작업을 여러 시험 운영 단위로 나누세요.');
  let best=null,lastFailure=null;
  const eligibleByJob=new Map(jobs.map(job=>[job.key,ctx.teachers.filter(t=>eligible_(t,job,ctx,[]).length===0)]));
  for(let i=0;i<APP.MAX_RESTARTS&&Date.now()<deadline;i++){
    const r=makeAttempt_(jobs,ctx,(Number(seed)||1009)+i*9973,eligibleByJob);
    if(!r.ok){lastFailure=r;continue;}
    const verify=fullValidate_(r.assignments,ctx);
    if(!verify.valid){lastFailure={reason:verify.errors.slice(0,6).join('; ')};continue;}
    const vector=objectiveVector_(r.assignments,ctx);
    if(!best||compareObjectives_(vector,best.vector)<0)best={assignments:r.assignments,vector,score:score_(r.assignments,ctx)};
  }
  if(!best)return {ok:false,detail:lastFailure||{reason:'제약으로 인한 배정 실패 또는 실행 시간 초과'},elapsed:Date.now()-begin};
  const optimized=optimizeLocal_(best.assignments,ctx,Math.min(deadline,Date.now()+Math.min(10000,deadline-Date.now())));
  if(compareObjectives_(optimized.vector,best.vector)<0)best=optimized;
  return {ok:true,assignments:best.assignments,score:best.score,elapsed:Date.now()-begin,
    validated:fullValidate_(best.assignments,ctx)};
}
function generate_(payload){
  // Long optimization runs outside lock; compare revision before committing.
  const state=readState_();ensureRev_(state,payload);ensureDraft_(state);
  const ctx=context_();ctx.fixed={};readDraft_().filter(a=>a.fixed).forEach(a=>ctx.fixed[a.key]=a.teacherId);
  const draftFingerprint=hash_(JSON.stringify(readDraft_()));
  const result=solve_(ctx,Number(payload.seed)||2026);
  if(!result.ok)return {ok:false,detail:result.detail,elapsed:result.elapsed};
  return ssLock_(()=>{const s=readState_();ensureRev_(s,payload);ensureDraft_(s);
    assert_(constraintFingerprint_(ctx)===constraintFingerprint_(context_()),'시트 제약조건이 배정 중 변경되었습니다. 재시도하세요.');
    assert_(draftFingerprint===hash_(JSON.stringify(readDraft_())),'배정 중 초안이 변경되었습니다. 최신 데이터를 확인하세요.');
    const checked=fullValidate_(result.assignments,context_());assert_(checked.valid,'저장 전 배정 검증 실패: '+checked.errors.slice(0,4).join('; '));
    writeDraft_(result.assignments);s.state='PREVIEW';s.lastError='';s.draftConstraintFingerprint=constraintFingerprint_(ctx);bump_(s);
    return {ok:true,revision:s.revision,stats:buildStats_(result.assignments,ctx.teachers,ctx.schedule,ctx.settings),
      score:result.score,elapsed:result.elapsed,validation:result.validated,optimizationReport:optimizationReportFrom_(result.assignments,ctx),assignments:result.assignments};
  });
}
function improve_(payload){
  const s=readState_();ensureRev_(s,payload);ensureDraft_(s);
  const ctx=context_();ensureConstraintsUnchanged_(s,ctx);const a=readDraft_(),v=fullValidate_(a,ctx);assert_(v.valid,v.errors.slice(0,4).join('; '));
  ctx.fixed={};a.filter(x=>x.fixed).forEach(x=>ctx.fixed[x.key]=x.teacherId);
  const draftFingerprint=hash_(JSON.stringify(a));
  const before=score_(a,ctx),beforeVector=objectiveVector_(a,ctx),o=optimizeLocal_(a,ctx,Date.now()+20000);
  if(payload.apply!==true)return {before,after:o.score,changes:o.changes,proposal:o.assignments,comparison:{before:optimizationReportFrom_(a,ctx).metrics,after:optimizationReportFrom_(o.assignments,ctx).metrics}};
  return ssLock_(()=>{const x=readState_();ensureRev_(x,payload);ensureDraft_(x);
    const latest=context_();ensureConstraintsUnchanged_(x,latest);
    assert_(constraintFingerprint_(ctx)===constraintFingerprint_(latest),'개선 중 시트 제약조건이 변경되었습니다. 다시 실행하세요.');
    assert_(draftFingerprint===hash_(JSON.stringify(readDraft_())),'개선 중 초안이 변경되었습니다. 최신 데이터를 확인하세요.');
    const checked=fullValidate_(o.assignments,latest);assert_(checked.valid,'개선 결과 검증 실패: '+checked.errors.slice(0,4).join('; '));
    assert_(compareObjectives_(o.vector,beforeVector)<=0,'최적화 우선순위에 따른 점수가 악화되었습니다.');writeDraft_(o.assignments);bump_(x);
    return {before,after:o.score,changes:o.changes,revision:x.revision};
  });
}
function transform_(payload,mutator,isAmend){return ssLock_(()=>{
 const s=readState_();ensureRev_(s,payload);const ctx=context_(),arr=readDraft_(),before=fullValidate_(arr,ctx);mutator(arr,ctx);
 const check=fullValidate_(arr,ctx);
 // Allow one-at-a-time correction of pre-existing invalid rows, but never add a violation.
 assert_(check.valid || check.errors.length<before.errors.length && check.errors.every(e=>before.errors.includes(e)), '변경을 저장할 수 없습니다: '+check.errors.join('; '));
 writeDraft_(arr);bump_(s);return {ok:true,revision:s.revision,assignments:arr,validation:check,stats:buildStats_(arr,ctx.teachers,ctx.schedule,ctx.settings)};
});}
function setTeacher_(arr,ctx,key,newId){
  const a=arr.find(x=>x.key===key);assert_(a,'변경할 감독 자리를 찾을 수 없습니다.');
  assert_(ctx.teachers.some(t=>t.id===newId),'교사 ID가 존재하지 않습니다.');
  a.teacherId=newId;a.fixed=true;
}
function update_(p){return transform_(p,(a,c)=>setTeacher_(a,c,clean_(p.key),clean_(p.teacherId)),false);}
function swapLogic_(arr,key1,key2,roleSwap){
  const a=arr.find(x=>x.key===key1),b=arr.find(x=>x.key===key2);
  assert_(a&&b&&a.key!==b.key,'교환할 두 자리를 선택하세요.');
  if(roleSwap)assert_(a.date===b.date&&a.period===b.period&&a.classId===b.classId&&
    ['MAIN','ASSIST'].indexOf(a.role)>=0&&['MAIN','ASSIST'].indexOf(b.role)>=0,'정·부감독 같은 학급의 역할만 교환할 수 있습니다.');
  const temp=a.teacherId;a.teacherId=b.teacherId;b.teacherId=temp;a.fixed=b.fixed=true;
}
function swap_(p){return transform_(p,a=>swapLogic_(a,clean_(p.key1),clean_(p.key2),false),false);}
function roleSwap_(p){return transform_(p,a=>swapLogic_(a,clean_(p.key1),clean_(p.key2),true),false);}
function amend_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function fairness_(p){
  const st=readState_(),snap=null;
  const ctx=snap?snapshotContext_(snap):context_(),arr=snap?snap.assignments:readDraft_();
  const stats=buildStats_(arr,ctx.teachers,ctx.schedule,ctx.settings),teacher=ctx.teachers.find(t=>t.id===clean_(p.teacherId));
  assert_(teacher,'교사를 찾을 수 없습니다.');
  const jobs=makeJobs_(ctx.schedule,ctx.settings),exclusions={동일교과:0,상치교과:0,담임학급:0,배정불가:0};
  const possible=jobs.filter(job=>{
    const w=eligible_(teacher,job,ctx,[]);w.forEach(x=>{exclusions[x]=(exclusions[x]||0)+1;});return !w.length;
  });
  let transfer=null;
  for(const a of arr){
    if(a.teacherId!==teacher.id || a.fixed)continue;
    const candidates=ctx.teachers.filter(t=>t.id!==teacher.id&&
      !eligible_(t,a,ctx,arr.filter(x=>x.key!==a.key)).length);
    const current=score_(arr,ctx);
    for(const t of candidates){const after=arr.map(x=>x.key===a.key?Object.assign({},x,{teacherId:t.id}):x);
      if(fullValidate_(after,ctx).valid&&compareObjectives_(objectiveVector_(after,ctx),objectiveVector_(arr,ctx))<0){transfer={slot:a.key,toId:t.id,toName:t.name};break;}}
    if(transfer)break;
  }
  const workReport=optimizationReportFrom_(arr,ctx).teachers.find(x=>x.id===teacher.id);
  return {teacher:Object.assign({},stats.find(x=>x.id===teacher.id),workReport),totalJobs:jobs.length,eligibleJobs:possible.length,
    exclusions,transfer,explanation:'제약별 제외 수치는 중복 집계될 수 있으며 감독 횟수 편차의 인과관계를 단독으로 증명하지 않습니다.'};
}
function nextVersion_(last){if(!last)return 'v1.0';const m=last.match(/^v(\d+)\.(\d+)$/);return m?'v'+m[1]+'.'+(Number(m[2])+1):'v1.0';}
function versionCompare_(a,b){
  const x=String(a).match(/^v(\d+)\.(\d+)$/),y=String(b).match(/^v(\d+)\.(\d+)$/);
  if(!x||!y)return String(a).localeCompare(String(b),undefined,{numeric:true});
  return Number(x[1])-Number(y[1])||Number(x[2])-Number(y[2]);
}
function nextUnusedVersion_(last){
  // Never reuse a version or move backwards after restoring a historical version.
  const ids=new Set(values_(SH.versions).slice(1).map(r=>String(r[0])).filter(Boolean));
  let highest=last||'';
  ids.forEach(v=>{if(!highest||versionCompare_(v,highest)>0)highest=v;});
  let candidate=nextVersion_(highest);
  while(ids.has(candidate))candidate=nextVersion_(candidate);
  return candidate;
}
function hash_(txt){const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,txt,Utilities.Charset.UTF_8);
  return digest.map(x=>('0'+((x+256)%256).toString(16)).slice(-2)).join('');}
function snapshotRows_(version,status,snapshot,reason){
  const raw=JSON.stringify(snapshot),chunks=[];
  for(let i=0;i<raw.length;i+=APP.MAX_SNAPSHOT_CELL)chunks.push(raw.slice(i,i+APP.MAX_SNAPSHOT_CELL));
  return chunks.map((part,i)=>[version,status,now_(),currentEmail_(),safe_(reason||''),i+1,chunks.length,part,hash_(raw)]);
}
function parseVersionSnapshotRows_(version,rows){
  assert_(rows.length,'배정 버전 스냅샷이 없습니다: '+version);
  const sorted=rows.slice().sort((a,b)=>Number(a[5])-Number(b[5]));
  assert_(sorted.length===Number(sorted[0][6]),version+' 스냅샷 청크가 누락되었습니다.');
  const raw=sorted.map((r,i)=>{
    assert_(String(r[0])===version&&Number(r[5])===i+1&&Number(r[6])===sorted.length,
      version+' 청크 번호 또는 버전 불일치');
    assert_(String(r[8])===String(sorted[0][8]),version+' 청크 체크섬 불일치');
    return String(r[7]);
  }).join('');
  assert_(hash_(raw)===sorted[0][8],version+' 배정 버전 무결성 검증 실패');
  return JSON.parse(raw);
}
function loadSnapshot_(version){
  return parseVersionSnapshotRows_(version,values_(SH.versions).slice(1).filter(r=>String(r[0])===version));
}
// Historical snapshots stay immutable. Older snapshots may lack crossSubjects.
function snapshotContext_(snapshot){return {teachers:snapshot.teachers,schedule:snapshot.schedule,
  settings:snapshot.settings,unavailable:snapshot.unavailable,teaching:snapshot.teaching,visiting:snapshot.visiting,teachingRules:snapshot.teachingRules||[]};}
// A NEW amended/restored version must honor the CURRENT teacher roster.
// Otherwise an old snapshot created before the 상치교과 column existed could
// silently authorize a forbidden assignment. Historical originals stay intact.
function currentRosterSnapshotContext_(snapshot) {
  const ctx=snapshotContext_(snapshot), roster=roster_();
  const currentSettings=readState_().settings;
  ctx.settings=Object.assign({},ctx.settings,{instructorIds:currentSettings.instructorIds||[],missingTimetableFallback:currentSettings.missingTimetableFallback===true,missingFallbackTeacherIds:currentSettings.missingFallbackTeacherIds||[]});
  assert_(!roster.errors.length,'배정인원 오류: '+roster.errors.slice(0,5).join('; '));
  const latest=new Map(roster.teachers.map(t=>[t.id,t]));
  ctx.teachers=ctx.teachers.map(t=>{
    const current=latest.get(t.id);
    assert_(current && current.name===t.name,'확정본 교사 명단과 현재 배정인원이 다릅니다. 교사 ID/이름을 확인하세요: '+t.id);
    return Object.assign({},t,{
      subjects:current.subjects,crossSubjects:current.crossSubjects,homeroom:current.homeroom,roleEligibility:current.roleEligibility
    });
  });
  return ctx;
}
function log_(oldVersion,newVersion,action,before,after,reason){
  const oldMap={};before.forEach(a=>oldMap[a.key]=a.teacherId);
  const diff=after.filter(a=>oldMap[a.key]!==a.teacherId);
  const when=now_(),email=currentEmail_(),id=Utilities.getUuid();
  const rows=(diff.length?diff:[{key:'전체 시간표',teacherId:''}]).map(a=>{
    const position=a.key;return [id,when,email,action,oldVersion||'',newVersion,position,
      oldMap[position]||'',a.teacherId||'',safe_(reason||'최초 확정')];
  });appendRows_(SH.history,rows);
}
function commitSnapshot_(state,snapshot,version,status,reason,history){
  const valid=fullValidate_(snapshot.assignments,snapshotContext_(snapshot));
  assert_(valid.valid,'확정 검증 실패: '+valid.errors.slice(0,8).join('; '));
  assert_(!values_(SH.versions).slice(1).some(r=>String(r[0])===version),'이미 존재하는 버전: '+version);
  // Immutable snapshot saved FIRST. Active pointer changed LAST.
  appendRows_(SH.versions,snapshotRows_(version,status,snapshot,reason));
  const check=loadSnapshot_(version);assert_(check.assignments.length===snapshot.assignments.length,'스냅샷 저장 실패');
  // Materialized sheets are repairable from immutable version history. Rebuild the previous
  // active sheets on failure. Sheets itself has no cross-sheet ACID transactions.
  const previous=state.activeVersion?loadSnapshot_(state.activeVersion):null;
  try {
    materialize_(version,snapshot,status);
    log_(history.oldVersion||'',version,history.action||'CONFIRM',history.before||[],history.after||snapshot.assignments,reason);
    state.activeVersion=version;state.state=status;state.editingBaseVersion='';state.editingReason='';state.editingPriorState='';
    state.draftConstraintFingerprint='';state.confirmedAt=now_();state.lastError='';bump_(state);
  } catch(e) {
    try {
      beginRequest_();const persisted=readState_();
      if(persisted.activeVersion!==version){
        if(previous)materialize_(history.oldVersion||'',previous,isUnlocked_(persisted)?(persisted.editingPriorState||'CONFIRMED'):persisted.state);
        else {replaceRows_(SH.result,[]);replaceRows_(SH.stats,[]);replaceRows_(SH.print,[]);}
      }
    } catch(rollbackError) {throw new Error('확정 실패: '+e.message+' / 출력 시트 복구도 실패: '+rollbackError.message+' (배정버전 스냅샷 검사 필요)');}
    throw new Error('확정 작업이 완료되지 않았습니다: '+e.message+' (이전 확정본 유지, 미완료 스냅샷 존재 가능)');
  }
}
function materialize_(version,snapshot,status){
 journalSheet_(SH.print);
  const lookup={};snapshot.teachers.forEach(t=>lookup[t.id]=t.name);
  const byCell={};snapshot.assignments.forEach(a=>{
    const k=a.date+'|'+a.period+'|'+a.classId;
    if(!byCell[k])byCell[k]=[];byCell[k].push(a);
  });
  const clock=now_();
  const outputSchedule=snapshot.schedule.slice(),outputKeys=new Set(outputSchedule.map(r=>r.date+'|'+r.period+'|'+r.classId));snapshot.assignments.forEach(a=>{const k=a.date+'|'+a.period+'|'+a.classId;if(!outputKeys.has(k)){outputKeys.add(k);const parts=a.classId.split('-').map(Number);outputSchedule.push({...a,grade:parts[0],classNo:parts[1]});}});
  const rows=outputSchedule.map(r=>{
    const assignments=byCell[r.date+'|'+r.period+'|'+r.classId]||[];
    const get=role=>assignments.filter(a=>a.role===role).map(a=>lookup[a.teacherId]||a.teacherId).join(', ');
    return [version,r.day,r.date,r.period,r.grade,r.classNo,r.classId,r.type==='EXAM'?'시험':'자습',
      safe_(r.subject),safe_(get('MAIN')),safe_(get('ASSIST')),
      safe_(assignments.filter(a=>a.role.startsWith('STUDY')).map(a=>lookup[a.teacherId]||a.teacherId).join(', ')),
      status,clock,''];
  });
  replaceRows_(SH.result,rows);
  const stats=buildStats_(snapshot.assignments,snapshot.teachers,snapshot.schedule,snapshot.settings);
  replaceRows_(SH.stats,stats.map(t=>[t.id,safe_(t.name),t.main,t.assist,t.study,t.total,t.delta,JSON.stringify(t.days)]));
  const scheduleIndex=new Map(snapshot.schedule.map(r=>[r.date+'|'+r.period+'|'+r.classId,r]));
  const classes=[...new Set(snapshot.schedule.map(r=>r.classId))].sort();
  const printRows=[];
  const dates=[...new Set(snapshot.schedule.map(r=>r.date))].sort();
  dates.forEach(date=>{
    printRows.push([date+' 감독 배정',''] .concat(Array(Math.max(0,classes.length-1)).fill('')));
    printRows.push(['교시'].concat(classes));
    const ps=[...new Set(snapshot.schedule.filter(x=>x.date===date).map(x=>x.period))].sort((a,b)=>a-b);
    ps.forEach(p=>{const row=[p+'교시'];classes.forEach(cid=>{
      const cell=scheduleIndex.get(date+'|'+p+'|'+cid);
      if(!cell){row.push('');return;}
      const roles=byCell[date+'|'+p+'|'+cid]||[];
      row.push(safe_((cell.type==='EXAM'?cell.subject:'자습')+' / '+roles.map(a=>(a.role==='MAIN'?'정':a.role==='ASSIST'?'부':'자습')+' '+(lookup[a.teacherId]||a.teacherId)).join(' · '))); 
    });printRows.push(row);});printRows.push([''].concat(classes.map(() => '')));
  });
  const ps=sheet_(SH.print),head=HEADERS[SH.print];
  // Dynamic width for print sheet; the header is preserved for later validation.
  if(ps.getMaxColumns()<Math.max(classes.length+1,head.length))ps.insertColumnsAfter(ps.getMaxColumns(),classes.length+1-ps.getMaxColumns());
  const w=Math.max(2,classes.length+1),old=Math.max(0,ps.getLastRow()-1),n=Math.max(old,printRows.length);
  if(n){if(ps.getMaxRows()<n+1)ps.insertRowsAfter(ps.getMaxRows(),n+1-ps.getMaxRows());
    ps.getRange(2,1,n,Math.max(w,ps.getLastColumn())).clearContent();
    if(printRows.length)ps.getRange(2,1,printRows.length,w).setValues(printRows.map(r=>r.concat(Array(w-r.length).fill(''))));
  }
  ps.setFrozenRows(1);ps.getRange(1,1,1,2).setBackground('#dbeafe').setFontWeight('bold');
  ps.setColumnWidth(1,170);if(w>1)ps.setColumnWidths(2,w-1,225);
  if(printRows.length)ps.getRange(2,1,printRows.length,w).setWrap(true).setVerticalAlignment('middle');
}
/** Begin an authorized revision without ever unpublishing the original confirmed snapshot.
 * Only supervisor assignments are unlocked; changes to schedule, eligibility rules, and
 * instructor flags remain protected, so discard requires no cross-sheet rollback.
 */
function unlockConfirmed_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function discardUnlocked_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function confirm_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function listVersions_(){
  const v=values_(SH.versions).slice(1),m={},s=readState_();
  const logged=new Set(values_(SH.history).slice(1).map(r=>String(r[5])));
  v.forEach(r=>{
    const id=String(r[0]);if(!id||m[id])return;
    const incomplete=!logged.has(id)&&id!==s.activeVersion;
    m[id]={version:id,status:incomplete?'저장 미완료':r[1],
      active:id===s.activeVersion,at:timestampStr_(r[2]),by:r[3],reason:r[4],loadable:!incomplete};
  });
  return Object.values(m).sort((a,b)=>versionCompare_(b.version,a.version));
}
/** All historical metadata, plus bounded preview data, in ONE authorized API request.
 * Large histories are deliberately lazy-loaded to avoid Apps Script response limits.
 */
function getVersionLibrary_(payload){
  const versions=listVersions_(),previews={},warnings=[];
  if(payload && payload.metadataOnly===true)return {versions,previews,preloaded:0,
    allLoaded:versions.every(v=>!v.loadable),activeVersion:readState_().activeVersion,warnings};
  const rowsByVersion=new Map();
  values_(SH.versions).slice(1).forEach(row=>{
    const key=String(row[0]);if(!key)return;
    if(!rowsByVersion.has(key))rowsByVersion.set(key,[]);
    rowsByVersion.get(key).push(row);
  });
  let used=0,preloaded=0;
  // Active first, then newest. Stored source snapshots remain immutable.
  const order=versions.slice().sort((a,b)=>Number(b.active)-Number(a.active)||versionCompare_(b.version,a.version));
  for(const item of order){
    if(!item.loadable)continue;
    if(used>=APP.MAX_VERSION_PREVIEW_CHARS)break;
    try{
      const raw=parseVersionSnapshotRows_(item.version,rowsByVersion.get(item.version)||[]);
      const data=presentConfirmed_(raw,{activeVersion:item.version,state:item.status,
        confirmedAt:item.at,updatedAt:item.at});
      const serialized=JSON.stringify(data);
      if(used+serialized.length>APP.MAX_VERSION_PREVIEW_CHARS)continue;
      previews[item.version]=data;used+=serialized.length;preloaded++;
    }catch(err){item.loadable=false;item.error=String(err.message);warnings.push(item.version+' 스냅샷 검사 실패');}
  }
  return {versions,previews,preloaded,allLoaded:versions.filter(v=>v.loadable).length===preloaded,
    activeVersion:readState_().activeVersion,warnings};
}
function getVersionPreview_(payload){
  const version=clean_(payload.version);
  assert_(/^v\d+\.\d+$/.test(version),'잘못된 버전 번호입니다.');
  const item=listVersions_().find(v=>v.version===version);
  assert_(item&&item.loadable,'존재하지 않거나 저장 미완료 상태인 버전입니다.');
  const snap=loadSnapshot_(version);
  return presentConfirmed_(snap,{activeVersion:version,state:item.status,
    confirmedAt:item.at,updatedAt:item.at});
}
function createVersion_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function readHistory_(){return values_(SH.history).slice(1).filter(r=>r[0]).map(r=>({id:r[0],at:timestampStr_(r[1]),actor:r[2],action:r[3],from:r[4],to:r[5],slot:r[6],before:r[7],after:r[8],reason:r[9]})).reverse().slice(0,500);}
function restore_(payload){throw new Error('이전 관리 기능은 제거되었습니다. 명단·일정·배정 화면에서 바로 저장하세요.');}
function getConfirmed_(){const s=readState_(),r=roster_(),schedule=readSchedule_();return presentConfirmed_({teachers:r.teachers,schedule,settings:s.settings,assignments:readDraft_()},{state:'EDITABLE',activeVersion:'',updatedAt:s.updatedAt,confirmedAt:''});}
function presentConfirmed_(x,s){
  return {status:s.state,version:s.activeVersion,confirmedAt:s.confirmedAt,modifiedAt:s.updatedAt,
    schedule:x.schedule,studyCount:x.settings.studyCount,assignments:x.assignments.map(a=>({day:a.day,date:a.date,period:a.period,classId:a.classId,
      type:a.type,subject:a.subject,role:a.role,teacherId:a.teacherId,key:a.key})),
    teachers:x.teachers.map(t=>({id:t.id,name:t.name})),stats:buildStats_(x.assignments,x.teachers,x.schedule,x.settings).map(t=>({id:t.id,name:t.name,main:t.main,assist:t.assist,study:t.study,total:t.total,delta:t.delta,days:t.days,isInstructor:t.isInstructor}))};
}
function getTeacher_(payload){
  const data=getConfirmed_(),id=clean_(payload.teacherId);
  const teacher=data.teachers.find(t=>t.id===id);assert_(teacher,'해당 교사를 찾을 수 없습니다.');
  return {teacher,version:data.version,state:data.status,confirmedAt:data.confirmedAt,modifiedAt:data.modifiedAt,
    assignments:data.assignments.filter(a=>a.teacherId===id),stats:data.stats.find(s=>s.id===id)};
}
function repairSheets_(payload){return ssLock_(()=>{const s=readState_();ensureRev_(s,payload);publishEditable_();return {ok:true};});}
function runSelfTests_(){
  const results=[];
  function test(name,fn){try{fn();results.push({name,status:'통과'});}catch(e){results.push({name,status:'실패',detail:String(e.message)});}}
  const teachers=[{id:'1',name:'국어',subjects:['국어'],homeroom:'1-1'},{id:'2',name:'수학',subjects:['수학'],homeroom:'1-2'},
    {id:'3',name:'과학',subjects:['과학'],homeroom:''},{id:'4',name:'영어',subjects:['영어'],homeroom:''}];
  const schedule=[{day:1,date:'2026-11-23',period:1,grade:1,classNo:1,classId:'1-1',type:'EXAM',subject:'국어',start:'',end:''}];
  const ctx={teachers,schedule,settings:{studyCount:1,aliases:{},maxPerTeacher:0},unavailable:[]};
  test('동일 교과 배정 제한',()=>assert_(eligible_(teachers[0],makeJobs_(schedule,ctx.settings)[0],ctx,[]).includes('동일교과'),'동일교과 필터 실패'));
  test('담임학급 배정 제한',()=>assert_(eligible_(teachers[0],makeJobs_(schedule,ctx.settings)[0],ctx,[]).includes('담임학급'),'담임 필터 실패'));
  test('복수 담당 교과 제한',()=>{const t=Object.assign({},teachers[2],{subjects:['한문','국어']});assert_(eligible_(t,makeJobs_(schedule,ctx.settings)[0],ctx,[]).includes('동일교과'),'복수교과 누락');});
  test('상치교과에 해당하는 시험과목 배정 차단',()=>{
    const t=Object.assign({},teachers[2],{crossSubjects:['국어']});
    const job=makeJobs_(schedule,ctx.settings)[0];
    assert_(eligible_(t,job,ctx,[]).includes('상치교과'),'상치교과 시험 차단 실패');
  });
  test('여러 상치교과 및 공란 읽기',()=>{
    const parsed=parseTeacherSubjects_('국어, 과학 / 수학; 영어\n한문');
    assert_(parsed.length===5 && parsed.includes('수학') && parseTeacherSubjects_('').length===0,'상치교과 목록 구분 실패');
  });
  test('상치교과 과목 외 시험은 후보 허용',()=>{
    const t=Object.assign({},teachers[2],{crossSubjects:['영어','한문']});
    const job=makeJobs_(schedule,ctx.settings)[0];
    assert_(!eligible_(t,job,ctx,[]).includes('상치교과'),'무관한 시험과목이 차단됨');
  });
  test('상치교과 동의어 매핑 적용',()=>{
    const t=Object.assign({},teachers[2],{crossSubjects:['기가']});
    const job=Object.assign({},makeJobs_(schedule,ctx.settings)[0],{subject:'기술가정'});
    const c=Object.assign({},ctx,{settings:{studyCount:1,aliases:{기가:'기술가정'},maxPerTeacher:0}});
    assert_(eligible_(t,job,c,[]).includes('상치교과'),'상치교과 별칭 미적용');
  });
  test('감독 포함으로 상치교과 금지 해제 불가',()=>{
    const t=Object.assign({},teachers[2],{crossSubjects:['국어']});
    const job=makeJobs_(schedule,ctx.settings)[0];
    const c=Object.assign({},ctx,{teachingRules:[{teacherId:t.id,mode:'포함',date:job.date,period:job.period}]});
    assert_(eligible_(t,job,c,[]).includes('상치교과'),'포함 규칙이 상치교과를 우회함');
  });
  test('상치교과 위반 수동배정 및 확정 검증 거부',()=>{
    const c=Object.assign({},ctx,{teachers:teachers.map(t=>t.id==='3'?Object.assign({},t,{crossSubjects:['국어']}):t)});
    const jobs=makeJobs_(schedule,ctx.settings);
    const invalid=jobs.map((job,i)=>Object.assign({},job,{teacherId:i===0?'3':'4'}));
    const report=fullValidate_(invalid,c);
    assert_(!report.valid&&report.errors.some(x=>x.includes('상치교과')),'확정 유효성 검사 우회');
  });
  test('기존 스냅샷 상치교과 필드 없을 때 오류 없음',()=>{
    const job=makeJobs_(schedule,ctx.settings)[0];
    assert_(Array.isArray(eligible_(teachers[2],job,ctx,[])),'기존 스냅샷 호환성 실패');
  });
  test('정·부감독 모두 배정',()=>{const v=solve_(ctx,14,2000);assert_(v.ok&&v.assignments.length===2,'두 명 미배정');assert_(new Set(v.assignments.map(a=>a.teacherId)).size===2,'중복 교사');});
  test('같은 교시 중복 금지',()=>{const j=makeJobs_(schedule,ctx.settings);const arr=j.map(a=>Object.assign({},a,{teacherId:'3'}));assert_(!fullValidate_(arr,ctx).valid,'중복 검출 실패');});
  test('배정불가 교사 차단',()=>{const c=Object.assign({},ctx,{unavailable:[{teacherId:'3',date:'2026-11-23',period:1}]});assert_(eligible_(teachers[2],makeJobs_(schedule,ctx.settings)[0],c,[]).includes('배정불가'),'불가 시간 누락');});
  test('자습 0명·2명 인원 설정',()=>{const r=Object.assign({},schedule[0],{type:'STUDY',subject:''});assert_(makeJobs_([r],{studyCount:0}).length===0&&makeJobs_([r],{studyCount:2}).length===2,'자습 인원 오류');});
  test('후보 부족 시 규칙 완화 금지',()=>{const c=Object.assign({},ctx,{teachers:teachers.slice(0,1)});assert_(!solve_(c,15,2000).ok,'불가능 배정 생성');});
  test('역할 맞교환 검사',()=>{const r=solve_(ctx,17,1000);const a=r.assignments;swapLogic_(a,a[0].key,a[1].key,true);assert_(fullValidate_(a,ctx).valid,'역할 교환 오류');});
  test('통계 합계 일치',()=>{const r=solve_(ctx,12,1000);const st=buildStats_(r.assignments,teachers,schedule);assert_(st.reduce((n,x)=>n+x.total,0)===2,'통계 합계 오류');});
  test('비교시각 중복 감지',()=>{const a={date:'2026-11-23',period:1,start:'09:00',end:'09:50'},b={date:'2026-11-23',period:2,start:'09:45',end:'10:30'};assert_(conflictTime_(a,b),'교차 시간 충돌 미검출');});
  test('학년별 서로 다른 날짜 허용',()=>{
    const classes=[{id:'1-1',grade:1,classNo:1},{id:'2-1',grade:2,classNo:1}];
    const rr=[Object.assign({},schedule[0]),{day:1,date:'2026-11-24',period:1,grade:2,classNo:1,classId:'2-1',type:'EXAM',subject:'수학',start:'',end:''}];
    validateSchedule_(rr,classes);
  });
  test('미실시 학년의 시험 행 차단',()=>{
    const classes=[{id:'1-1',grade:1,classNo:1},{id:'2-1',grade:2,classNo:1}];
    const rr=[Object.assign({},schedule[0])],plan={'1':{enabled:true,days:[{day:1,enabled:true,date:'2026-11-23',periods:[1]}]},
      '2':{enabled:false,days:[{day:1,enabled:false,date:'',periods:[1]}]}};
    const ok=normalizeGradePlan_(plan,rr,classes);assert_(!ok['2'].enabled,'미실시 학년 처리 실패');
    const extra=rr.concat({day:1,date:'2026-11-24',period:1,grade:2,classNo:1,classId:'2-1',type:'EXAM',subject:'수학'});
    let rejected=false;try{normalizeGradePlan_(plan,extra,classes);}catch(e){rejected=true;}
    assert_(rejected,'미실시 학년 배정 행 차단 실패');
  });
  test('학년별 일부 일차 및 교시만 운영',()=>{
    const classes=[{id:'1-1',grade:1,classNo:1},{id:'2-1',grade:2,classNo:1}];
    const rr=[Object.assign({},schedule[0])],plan={'1':{enabled:true,days:[{day:1,enabled:true,date:'2026-11-23',periods:[1]},{day:2,enabled:false,date:'2026-11-24',periods:[1,2]}]},
      '2':{enabled:false,days:[{day:1,enabled:false,date:'',periods:[1]}]}};
    assert_(normalizeGradePlan_(plan,rr,classes)['1'].days[1].enabled===false,'학년별 일차 비활성화 실패');
  });
  test('3학년만 시험, 1학년 수업 중 교사 제외',()=>{
    const job=makeJobs_(schedule,ctx.settings)[0],q=Object.assign({},job,{date:'2026-11-23',period:1});
    const c=Object.assign({},ctx,{teaching:{enabled:true,known:['3'],rows:[{teacherId:'3',weekday:'월',period:1,classId:'2-1'}]},visiting:[]});
    assert_(eligible_(teachers[2],q,c,[]).some(x=>x.startsWith('정규수업(')),'비시험 학년 수업 제외 실패');
  });
  test('시험 실시 학급 수업만 있는 교사 후보 유지',()=>{
    const job=makeJobs_(schedule,ctx.settings)[0];
    const c=Object.assign({},ctx,{teaching:{enabled:true,known:['3'],rows:[{teacherId:'3',weekday:'월',period:1,classId:'1-1'}]},visiting:[]});
    assert_(!eligible_(teachers[2],job,c,[]).some(x=>x.startsWith('정규수업(')),'시험 학급 수업 해제 실패');
  });
  test('겸임 타교출강 금지',()=>{
    const job=makeJobs_(schedule,ctx.settings)[0];
    assert_(visitingAvailability_(teachers[2],job,[{teacherId:'3',type:'타교출강',date:'2026-11-23',period:1,location:'타교'}]).includes('타교근무'),'타교 출강 제외 실패');
  });
  test('겸임 본교방문 명시한 시간만 허용',()=>{
    const a=[{teacherId:'3',type:'본교방문',date:'2026-11-23',period:2,location:'본교'}],job=makeJobs_(schedule,ctx.settings)[0];
    assert_(visitingAvailability_(teachers[2],job,a).includes('겸임본교방문미확인'),'본교 출근 확인 없이 허용됨');
    assert_(!visitingAvailability_(teachers[2],Object.assign({},job,{period:2}),a).length,'방문 시간 허용 실패');
  });
  test('요일 계산과 날짜별 출강 예외 우선',()=>{
    const job=makeJobs_(schedule,ctx.settings)[0];
    assert_(dayIndex_('2026-11-23')==='월','요일 오류');
    const rows=[{teacherId:'3',type:'타교출강',weekday:'월',period:1,location:'타교'},
      {teacherId:'3',type:'타교출강',date:'2026-11-23',period:1,location:'본교'}];
    assert_(!visitingAvailability_(teachers[2],job,rows).length,'날짜별 근무 예외 미적용');
  });
  test('관리자 제외 규칙 우선',()=>{
    const job=makeJobs_(schedule,ctx.settings)[0],t=teachers[2];
    const c=Object.assign({},ctx,{teachingRules:[{teacherId:t.id,mode:'제외',date:job.date,period:job.period}]});
    assert_(eligible_(t,job,c,[]).includes('교사감독규칙제외'),'제외 규칙 누락');
  });
  test('감독 포함은 정규수업만 완화',()=>{
    const job=makeJobs_(schedule,ctx.settings)[0],t=teachers[2];
    const c=Object.assign({},ctx,{teaching:{enabled:true,known:[t.id],rows:[{teacherId:t.id,weekday:'월',period:1,classId:'2-1'}]},visiting:[],teachingRules:[]});
    assert_(eligible_(t,job,c,[]).some(x=>x.startsWith('정규수업')),'정규수업 충돌 미검출');
    c.teachingRules=[{teacherId:t.id,mode:'포함',date:job.date,period:job.period,classId:'2-1'}];
    assert_(!eligible_(t,job,c,[]).some(x=>x.startsWith('정규수업')),'포함 규칙 미적용');
    const subjectTeacher=Object.assign({},t,{subjects:['국어']});
    assert_(eligible_(subjectTeacher,job,c,[]).includes('동일교과'),'포함 규칙이 과목 금지 제약을 우회함');
  });
  test('학급 날짜 객체가 한국 시간 기준으로 복구',()=>{
    assert_(classId_(new Date('2026-02-28T15:00:00Z'))==='3-1','3-1 날짜 자동 변환 복원 실패');
  });
  test('강사는 자동배정·수동변경 모두 금지',()=>{
    const c=Object.assign({},ctx,{settings:{...ctx.settings,instructorIds:['3']}});
    const j=makeJobs_(schedule,c.settings)[0];
    assert_(eligible_(teachers[2],j,c,[]).includes('강사감독자동제외'),'강사 제외 누락');
    const bad=makeJobs_(schedule,c.settings).map((x,i)=>({...x,teacherId:i===0?'3':'4'}));
    assert_(!fullValidate_(bad,c).valid,'강사 배정을 확정할 수 있게 됨');
  });
  test('포함 규칙으로 강사 제외 해제 불가',()=>{
    const c={...ctx,settings:{...ctx.settings,instructorIds:['3']},teachingRules:[{teacherId:'3',mode:'포함',startDate:'2026-11-23',endDate:'2026-11-25',period:1}]};
    assert_(eligible_(teachers[2],makeJobs_(schedule,c.settings)[0],c,[]).includes('강사감독자동제외'),'강사 포함 우회');
  });
  test('날짜 기간 양 끝 날짜 포함',()=>{
    const r={teacherId:'3',mode:'제외',startDate:'2026-11-23',endDate:'2026-11-25',period:2};
    assert_(teachingRuleApplies_(r,'2026-11-23',2)&&teachingRuleApplies_(r,'2026-11-25',2)&&!teachingRuleApplies_(r,'2026-11-26',2),'기간 범위 오류');
  });
  test('기간 + 요일 반복 필터',()=>{
    const r={teacherId:'3',mode:'제외',startDate:'2026-11-23',endDate:'2026-12-20',weekday:'월',period:1};
    assert_(teachingRuleApplies_(r,'2026-11-30',1)&&!teachingRuleApplies_(r,'2026-12-01',1),'요일 필터 오류');
  });
  test('기간 역전/종료일만 입력 오류',()=>{
    let failed=0;for(const [a,b] of [['2026-12-01','2026-11-25'],['','2026-11-25']]){
      try{validTeachingRuleRange_(a,b,'','test');}catch(e){failed++;}}
    assert_(failed===2,'잘못된 기간 허용');
  });
  test('기존 단일 날짜 규칙 호환',()=>{
    assert_(teachingRuleApplies_({teacherId:'3',date:'2026-11-23',mode:'제외',period:1},'2026-11-23',1),'단일 날짜 규칙 적용 실패');
  });
  test('강사 제외 후 자동배정에도 강사 배정 없음',()=>{
    const c={...ctx,settings:{...ctx.settings,instructorIds:['3']}};
    const result=solve_(c,27,1000);
    assert_(result.ok&&result.assignments.every(x=>x.teacherId!=='3'),'자동배정에서 강사에게 감독 배정');
  });
  test('강사 외 감독 가능 인원 부족 시 배정 실패',()=>{
    const c={...ctx,settings:{...ctx.settings,instructorIds:['2','3','4']}};
    assert_(!solve_(c,27,500).ok,'강사 자동제외를 무시하고 배정 성공');
  });
  test('담당 학년 비중 75% 및 50% 상대 가산 계수',()=>{
    const c={...ctx,teaching:{rows:[{teacherId:'3',weekday:'월',period:1,classId:'3-1'},
      {teacherId:'3',weekday:'월',period:2,classId:'3-2'}, {teacherId:'3',weekday:'화',period:1,classId:'3-3'},
      {teacherId:'3',weekday:'수',period:1,classId:'2-1'}]}};
    assert_(Math.abs(gradeAffinity_(teachers[2],3,c)-.75)<1e-8,'비중 75% 오류');
    assert_(1+.5*gradeAffinity_(teachers[2],3,c)===1.375,'50% 상대 계수 오류');
  });
  test('정규수업 1·2·4교시 + 감독 3교시 4연강',()=>{
    const c={...ctx,teaching:{rows:[1,2,4].map(p=>({teacherId:'3',weekday:'월',period:p,classId:'2-1'}))}};
    const analysis=workloadAnalysis_([{teacherId:'3',date:'2026-11-23',period:3}],c);
    assert_(analysis.extraFour===1&&analysis.extraThree===1,'4연강 추가 인식 실패');
  });
  test('시험이 있는 학급의 수업 해제, 비시험 학급 수업 유지',()=>{
    const c={...ctx,teaching:{rows:[{teacherId:'3',weekday:'월',period:1,classId:'1-1'},
      {teacherId:'3',weekday:'월',period:2,classId:'2-1'}]}};
    const base=workloadIndex_(c).baseline.get('3|2026-11-23');
    assert_(!base.has(1)&&base.has(2),'수업 해제 대상 오류');
  });
  test('전 학년 시험이면 해제된 수업으로 연강 계산하지 않음',()=>{
    const c={...ctx,schedule:[...schedule,{...schedule[0],classId:'2-1',grade:2,classNo:1}],
      teaching:{rows:[{teacherId:'3',weekday:'월',period:1,classId:'1-1'},
        {teacherId:'3',weekday:'월',period:1,classId:'2-1'}]}};
    assert_(!workloadIndex_(c).baseline.get('3|2026-11-23').has(1),'전 학년 수업 해제 실패');
  });
  test('점심 휴식 이후 연강 단절',()=>{
    assert_(runSummary_(new Set([2,3,4,5]),4).maxRun===3,'점심시간 경계 실패');
  });
  test('교과 제약 유지한 유효 배정만 최적화',()=>{
    const opt={...ctx,settings:{...ctx.settings,optimization:defaultOptimization_()}};
    const res=solve_(opt,18,1000);
    assert_(res.ok&&fullValidate_(res.assignments,opt).valid,'기존 제약 미준수');
  });
  test('정·부·자습 각각 독립 통계와 3:2:1 점수',()=>{
    const example=[...makeJobs_(schedule,ctx.settings).map((a,i)=>({...a,teacherId:i?'4':'3'})),
      {key:'test1',teacherId:'3',role:'STUDY',date:'2026-11-24',period:2}];
    const m=statsMap_(example,teachers);assert_(m['3'].MAIN===1&&m['3'].STUDY===1&&m['4'].ASSIST===1,'역할별 통계 오류');
    assert_(m['3'].MAIN*3+m['3'].ASSIST*2+m['3'].STUDY===4,'부담 점수 오류');
  });
  test('학년 우대 0%, 50%, 100% 설정',()=>{
    for(const x of [0,.5,1])assert_(optimizationConfig_({optimization:{gradeStrength:x}},true).gradeStrength===x,'우대범위 오류');
  });
  test('정감독 업무점수는 부감독보다 큰 값만 허용',()=>{
    let blocked=false;try{optimizationConfig_({optimization:{mainWeight:1,assistWeight:2,studyWeight:1}},true);}catch(e){blocked=true;}
    assert_(blocked,'업무 강도 역전 허용');
  });
  test('강사 제외는 가중치 설정으로 해제 불가',()=>{
    const c={...ctx,settings:{...ctx.settings,instructorIds:['3'],optimization:{profile:'grade',gradeStrength:1}}};
    assert_(eligible_(teachers[2],makeJobs_(schedule,c.settings)[0],c,[]).includes('강사감독자동제외'),'강사 배정 우회');
  });
  test('학년 우대가 0이면 모든 학년 우대 점수 0',()=>{
    const c={...ctx,settings:{...ctx.settings,optimization:{gradeStrength:0}}};
    const score=objectiveParts_([],c);assert_(score.gradeBonus===0&&score.gradePenalty===0,'0% 우대 미적용 실패');
  });
  test('정감독·부감독·자습 개별 편차 분석',()=>{
    const c={...ctx,settings:{...ctx.settings,optimization:defaultOptimization_()}};
    const jobs=makeJobs_(schedule,c.settings),a=jobs.map((j,i)=>({...j,teacherId:i?'4':'3'}));
    const p=objectiveParts_(a,c);
    assert_(p.mainSpread===1&&p.assistSpread===1&&p.studySpread===0,'유형별 편차 계산 오류');
  });
  test('연속 근무 2연강은 벌점 발생 없음',()=>{
    assert_(runSummary_([1,2],0).three===0&&runSummary_([1,2],0).four===0,'2연강 분류 오류');
  });
  test('3연강과 4연강 중복 계산 피함',()=>{
    const one=runSummary_([1,2,3,4],0);
    assert_(one.three===1&&one.four===1&&one.five===0,'연강 건수 중복 오류');
  });
  test('5연강 강력 억제 순위',()=>{
    const a=[1,0,1,1,1,1,1],b=[0,1,99,99,99,99,99];
    assert_(compareObjectives_(b,a)<0,'5연강 회피 우선순위 오류');
  });
  test('공정성 프리셋은 역할 균등화를 3연강보다 먼저 고려',()=>{
    const c={...ctx,settings:{...ctx.settings,optimization:{profile:'fairness'}}};
    const v=objectiveVector_([],c);assert_(v.length===7,'공정성 벡터 구성 오류');
  });
  test('학년 우선 프리셋도 역할 공정성 무시하지 않음',()=>{
    const c={...ctx,settings:{...ctx.settings,optimization:{profile:'grade'}}};
    const jobs=makeJobs_(schedule,c.settings),x=objectiveVector_(jobs.map((j,i)=>({...j,teacherId:i?'3':'4'})),c);
    assert_(x.length===7&&x[2]>=0&&x[3]>=0,'학년 우선 공정성 필터 오류');
  });
  test('연강 방지 프리셋의 3연강 우선순위',()=>{
    const c={...ctx,settings:{...ctx.settings,optimization:{profile:'consecutive'}}};
    const p=objectiveParts_([],c),v=objectiveVector_([],c);
    assert_(v[2]===p.work.extraThree,'연강 우선 순위 오류');
  });
  test('학년별 원본 시간표 집계가 다른 요일 수업도 반영',()=>{
    const c={...ctx,teaching:{rows:[{teacherId:'3',weekday:'금',period:7,classId:'1-1'},
      {teacherId:'3',weekday:'월',period:7,classId:'3-2'}]}};
    assert_(gradeAffinity_(teachers[2],3,c)===.5,'요일 전체 주간 수업 비중 미반영');
  });
  test('시험일이 다른 수업은 감독 연강에 연결되지 않음',()=>{
    const c={...ctx,teaching:{rows:[{teacherId:'3',weekday:'화',period:1,classId:'2-1'}]}};
    const x=workloadAnalysis_([{teacherId:'3',date:'2026-11-23',period:2}],c);
    assert_(x.extraThree===0&&x.extraFour===0,'다른 요일 수업을 연강으로 처리');
  });
  test('날짜·교시별 같은 교사의 복수 수업은 연속근무로 한 번만 계산',()=>{
    const c={...ctx,teaching:{rows:[{teacherId:'3',weekday:'월',period:2,classId:'2-1'},
      {teacherId:'3',weekday:'월',period:2,classId:'2-2'}]}};
    assert_(workloadIndex_(c).baseline.get('3|2026-11-23').size===1,'중복 시수 잘못 계산');
  });
  test('가중 업무부담과 교사별 주담당학년 보고서',()=>{
    const c={...ctx,teaching:{rows:[{teacherId:'3',weekday:'금',period:1,classId:'3-2'}]}};
    const jobs=makeJobs_(schedule,c.settings),rows=jobs.map((j,i)=>({...j,teacherId:i?'4':'3'}));
    const report=optimizationReportFrom_(rows,c),t=report.teachers.find(t=>t.id==='3');
    assert_(t.burden===3&&t.primaryGrade===3&&report.metrics.mainSpread===1,'보고서 오류');
  });
  test('점심 단절 미지정 시 4교시와 5교시 연속 계산',()=>{
    assert_(runSummary_([3,4,5],0).maxRun===3,'학교 휴식 구간 옵션 오류');
  });
  test('날짜 변경으로 업무 인덱스 무효화',()=>{
    const c={...ctx,schedule:schedule.slice()};const a=workloadIndex_(c);
    c.schedule=schedule.map(x=>({...x,date:'2026-11-24'}));const b=workloadIndex_(c);
    assert_(a!==b&&b.dates[0]==='2026-11-24','시간표 변경 후 캐시 미무효화');
  });
  test('대체 교사가 있으면 감독 때문에 생기는 4연강 회피',()=>{
    const ts=[{id:'a',name:'A',subjects:['역사'],homeroom:''},{id:'b',name:'B',subjects:['역사'],homeroom:''},{id:'c',name:'C',subjects:['역사'],homeroom:''}];
    const sc=[{...schedule[0],date:'2026-11-23',period:3,grade:3,classNo:1,classId:'3-1'}];
    const c={...ctx,teachers:ts,schedule:sc,teaching:{enabled:true,known:['a','b','c'],rows:[1,2,4].map(p=>({teacherId:'a',weekday:'월',period:p,classId:'2-1'}))},
      settings:{studyCount:1,aliases:{},maxPerTeacher:0,instructorIds:[],optimization:defaultOptimization_()}};
    const r=solve_(c,31,800);
    assert_(r.ok&&r.assignments.every(x=>x.teacherId!=='a')&&workloadAnalysis_(r.assignments,c).extraFour===0,'피할 수 있는 4연강 발생');
  });
  test('4연강 회피 불가능해도 절대 조건을 유지하며 필수 감독 충족',()=>{
    const ts=[{id:'a',name:'A',subjects:['역사'],homeroom:''},{id:'b',name:'B',subjects:['역사'],homeroom:''}];
    const sc=[{...schedule[0],date:'2026-11-23',period:3,grade:3,classNo:1,classId:'3-1'}];
    const c={...ctx,teachers:ts,schedule:sc,teaching:{enabled:true,known:['a','b'],rows:[1,2,4].map(p=>({teacherId:'a',weekday:'월',period:p,classId:'2-1'}))},
      settings:{studyCount:1,aliases:{},maxPerTeacher:0,instructorIds:[],optimization:defaultOptimization_()}};
    const r=solve_(c,31,800);
    assert_(r.ok&&r.assignments.length===2&&fullValidate_(r.assignments,c).valid&&workloadAnalysis_(r.assignments,c).extraFour===1,'감독 부족 상황의 연강 처리 실패');
  });
  return {tests:results,passed:results.filter(x=>x.status==='통과').length,failed:results.filter(x=>x.status==='실패').length,
    note:'독립 합성 데이터 기반 엔진 단위 테스트입니다. 실사용 구글 계정·브라우저 배포 테스트를 대체하지 않습니다.'};
}

/** Runs in the bound spreadsheet context; web requests have no active container. */
function autoBindCurrentSpreadsheet_(e){
  const ss=e&&e.source&&typeof e.source.getId==='function'?e.source:SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)return null;
  const scriptId=ScriptApp.getScriptId(),spreadsheetId=ss.getId();
  const props=PropertiesService.getScriptProperties(),key=bindingPropertyKey_();
  const previous=parseJSON_(props.getProperty(key),null);
  if(!previous||previous.scriptId!==scriptId||previous.spreadsheetId!==spreadsheetId){
    props.setProperty(key,JSON.stringify({spreadsheetId,scriptId,registeredAt:new Date().toISOString(),mode:'AUTO_ON_OPEN'}));
  }
  return ss;
}

/** Simple editable flow; historical sheets remain untouched. */
function migrateEditable_(){
 const s=readState_();if(s.editableMigration===1)return;
 ssLock_(()=>{const current=readState_();if(current.editableMigration===1)return;
  if(!values_(SH.draft).slice(1).some(r=>r[0]!==''&&r[0]!=null) && current.activeVersion){
   const rows=values_(SH.versions).slice(1).filter(r=>String(r[0])===current.activeVersion);
   if(rows.length){let snap;try{snap=parseVersionSnapshotRows_(current.activeVersion,rows);}catch(e){current.migrationWarning='이전 기록을 읽지 못했습니다. 기록은 보존되어 있습니다: '+e.message;snap={};}
    if(!readSchedule_().length&&snap.schedule?.length){replaceRows_(SH.schedule,snap.schedule.map(r=>[r.day,r.date,r.period,r.grade,r.classNo,r.classId,r.type,r.subject,r.start||'',r.end||'']));REQUEST_SCHEDULE_=null;}
    if(!roster_().teachers.length&&snap.teachers?.length){journalSheet_(SH.roster);const tab=sheet_(SH.roster),v=values_(SH.roster),map=headerMap_(v[0]),fields=[['번호','id'],['이름','name'],['과목','subjects'],['담임학급','homeroom'],['상치교과','crossSubjects']];const imported=snap.teachers.map(t=>{const row=Array(v[0].length).fill('');fields.forEach(([header,key])=>{const col=col_(map,[header]);if(col>=0)row[col]=Array.isArray(t[key])?t[key].join(', '):(t[key]||'');});['MAIN','ASSIST','STUDY'].forEach((role,i)=>{const col=col_(map,[['정감독','부감독','자습감독'][i]]);if(col>=0)row[col]=t.roleEligibility?.[role]===false?'X':'O';});return row;});if(imported.length)tab.getRange(2,1,imported.length,v[0].length).setValues(imported);REQUEST_VALUES_.delete(SH.roster);}
    if(snap.assignments?.length)writeDraft_(snap.assignments);
   }
  }
  if(!readDraft_().length && values_(SH.result).slice(1).some(r=>r[2]))writeDraft_(readResultAssignments_());
  current.editableMigration=1;current.legacyVersion=current.activeVersion||'';current.activeVersion='';current.editingBaseVersion='';current.state='EDITABLE';current.resultFingerprint=hash_(JSON.stringify(values_(SH.result)));writeState_(current);
 });
}
function publishEditable_(){const s=readState_();materialize_('',{teachers:roster_().teachers,schedule:readSchedule_(),settings:s.settings,assignments:readDraft_()},'저장됨');}
function saveAssignments_(p){return ssLock_(()=>{const s=readState_();ensureRev_(s,p);const ctx=context_(),check=fullValidate_(p.assignments||[],ctx);assert_(check.valid,check.errors.join('; '));writeDraft_(p.assignments);bump_(s);return {ok:true,revision:s.revision};});}
function saveClasses_(p){return ssLock_(()=>{const s=readState_();ensureRev_(s,p);const seen=new Set(),tab=sheet_(SH.classes),v=values_(SH.classes),m=headerMap_(v[0]),gcol=col_(m,['학년']),ccol=col_(m,['반']);assert_(gcol>=0&&ccol>=0,'학급입력의 학년·반 열을 확인하세요.');const rows=(p.rows||[]).map(r=>{const g=Number(r.grade),c=Number(r.classNo);assert_(Number.isInteger(g)&&g>=1&&g<=3&&Number.isInteger(c)&&c>=1&&c<=100,'학년 1~3, 반 1~100을 입력하세요.');const id=g+'-'+c;assert_(!seen.has(id),'중복 학급: '+id);seen.add(id);return [g,c];});journalSheet_(SH.classes);const n=Math.max(rows.length,v.length-1);if(n){if(tab.getMaxRows()<n+1)tab.insertRowsAfter(tab.getMaxRows(),n+1-tab.getMaxRows());tab.getRange(2,gcol+1,n,1).setValues(Array.from({length:n},(_,i)=>[rows[i]?.[0]||'']));tab.getRange(2,ccol+1,n,1).setValues(Array.from({length:n},(_,i)=>[rows[i]?.[1]||'']));}REQUEST_VALUES_.delete(SH.classes);s.gradePlan=null;bump_(s);return {ok:true,revision:s.revision};});}
function journalSheet_(name){if(WRITE_JOURNAL_&&!WRITE_JOURNAL_.has(name))WRITE_JOURNAL_.set(name,sheetBackup_(name));}
function liveDataToken_(){return hash_(JSON.stringify([SH.roster,SH.classes,SH.schedule,SH.unavailable,SH.teaching,'수업시간표',SH.visiting,SH.rules,SH.settings,SH.draft,SH.result].map(n=>[n,values_(n)])));}
function syncDirectResultEdits_(){const state=readState_(),fingerprint=hash_(JSON.stringify(values_(SH.result)));if(!state.resultFingerprint||state.resultFingerprint===fingerprint)return;
 ssLock_(()=>{const s=readState_(),rows=values_(SH.result).slice(1),teachers=roster_().teachers,assignments=[];
 assignments.push(...readResultAssignments_());
 writeDraft_(assignments);s.resultFingerprint=hash_(JSON.stringify(values_(SH.result)));s.revision++;writeState_(s);
 });
}

function readResultAssignments_(){const rows=values_(SH.result).slice(1),teachers=roster_().teachers,assignments=[];
 const old=new Map(readDraft_().map(a=>[a.key,a]));
 rows.filter(r=>r[2]).forEach(r=>{const date=dateStr_(r[2]),period=Number(r[3]),classId=classId_(r[6]),type=r[7]==='시험'?'EXAM':'STUDY';const base={day:Number(r[1]),date,period,classId,type,subject:clean_(r[8]),start:'',end:''};
 const add=(role,name)=>{const text=clean_(name);if(!text)return;const matches=teachers.filter(t=>t.name===text||t.id===text);const key=date+'|'+period+'|'+classId+'|'+role;assignments.push({...base,...(old.get(key)||{}),...base,key,role,teacherId:matches.length===1?matches[0].id:text});};
 add('MAIN',r[9]);add('ASSIST',r[10]);clean_(r[11]).split(/[,，]/).filter(x=>x.trim()).forEach((name,i)=>add('STUDY'+(i+1),name));});
return assignments;}

function ensureBaseHeaders_(){assertIntegrationWrite_();const ss=spreadsheet_();for(const [name,groups] of [[SH.roster,[['번호','교사ID','ID','식별번호'],['이름','교사명','성명'],['과목','담당교과','교과'],['담임학급','담임','담임반'],['상치교과','상치교과목'],['정감독'],['부감독'],['자습감독']]],[SH.classes,[['학년'],['반']]]]){let tab=ss.getSheetByName(name);if(!tab)tab=ss.insertSheet(name);const head=tab.getLastRow()?tab.getRange(1,1,1,tab.getLastColumn()).getValues()[0]:[];const map=headerMap_(head);for(const aliases of groups)if(col_(map,aliases)<0){const column=head.length+1;if(tab.getMaxColumns()<column)tab.insertColumnsAfter(tab.getMaxColumns(),column-tab.getMaxColumns());tab.getRange(1,column).setValue(aliases[0]);head.push(aliases[0]);map[norm_(aliases[0])]=column-1;REQUEST_VALUES_.delete(name);}}}

// Streamlit integration gate. Read the live sheet, never the request cache.
function integrationPairs_(){
 const tab=spreadsheet_().getSheetByName(SH.settings);
 if(!tab||!tab.getLastRow())return {};
 const rows=tab.getRange(1,1,tab.getLastRow(),2).getDisplayValues(),pairs={};
 rows.slice(1).forEach(r=>{if(String(r[0]).startsWith('_integration_'))pairs[String(r[0])]=String(r[1]);});return pairs;
}
function integrationReadOnly_(){const p=integrationPairs_();return p._integration_protocol==='single-writer-v1'&&p._integration_writer!=='GAS';}
function assertIntegrationWrite_(){assert_(!integrationReadOnly_(),'저장 주체가 Streamlit 또는 전환 대기 상태입니다. Streamlit 연결·권한 설정에서 GAS로 전환하세요.');}
function assertIntegrationReadAction_(action){assert_(['getStatus','getConfirmed','getTeacher','diagnose','getAdminData','getTeachingData','availabilityReport','optimizationReport','compareGradeBonus','history','listVersions','getVersionPreview','getVersionLibrary','selfTests'].includes(action),'현재 Apps Script는 조회 전용입니다. 저장 주체를 GAS로 전환하세요.');}
function preserveIntegrationRows_(rows){const live=integrationPairs_();return rows.filter((r,i)=>i===0||!String(r[0]).startsWith('_integration_')).concat(Object.entries(live));}
function ssLock_(fn){return originalSsLock_(()=>{assertIntegrationWrite_();return fn();});}
// Run once from the bound spreadsheet's Apps Script editor before sharing writers.
function installIntegrationProtocol(){
 registerCurrentSpreadsheet_(activeEditorSpreadsheet_());assertIntegrationWrite_();ensureInitialized_();
 return originalSsLock_(()=>{assertIntegrationWrite_();const rows=values_(SH.settings);const kept=rows.slice(1).filter(r=>!String(r[0]).startsWith('_integration_'));kept.push(['_integration_protocol','single-writer-v1'],['_integration_writer','GAS']);replaceRows_(SH.settings,kept);return {ok:true,writer:'GAS'};});
}

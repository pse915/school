/**
 * Diple Phase 5A signed Google Sheets write gateway (not a general public API).
 * Deploy as a Web App with "Execute as me"; invocation access "Anyone" only
 * when the Python backend authenticates EVERY operation using HMAC-SHA256.
 * Do not add student authentication or expose the shared key in Index.html.
 * The spreadsheet must be private to the owner/service administrators.
 *
 * Required Script Properties: DIPLE_SHARED_KEY (random 32+ character secret).
 * The same secret is stored ONLY in Streamlit Secrets (never in GitHub).
 */
const PREFIX = 'DIPLE5A_';
const MAX_SECONDS = 300;
const MAX_CHUNK = 30000;
const MAX_BASE64_LENGTH = 12 * 1024 * 1024; // guardrail, not a capacity guarantee

function hex_(bytes) {
  return bytes.map(function(b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function sha_(value) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
                                     value,Utilities.Charset.UTF_8));
}
function validNamespace_(name) {
  if (!/^[a-zA-Z0-9_-]{1,45}$/.test(name || '')) throw Error('invalid_namespace');
  return name;
}
function sheet_(ss,name) {
  let s=ss.getSheetByName(name);
  if (!s) s=ss.insertSheet(name);
  return s;
}
function current_(props,key) {
  const raw=props.getProperty(key);
  return raw ? JSON.parse(raw) : {revision:0,slot:'',sha256:sha_('')};
}
function result_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return result_({ok:false,code:'POST_only'}); }
function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) throw Error('invalid_request');
    const request=JSON.parse(event.postData.contents);
    const name=validNamespace_(request.namespace);
    if (!['read','write'].includes(request.action)) throw Error('invalid_action');
    if (!Number.isSafeInteger(request.timestamp) ||
        Math.abs(Math.floor(Date.now()/1000)-request.timestamp)>MAX_SECONDS)
      throw Error('stale_timestamp');
    if (!/^[0-9a-f]{32}$/.test(request.nonce||'')) throw Error('invalid_nonce');
    if (!Number.isSafeInteger(request.expected_revision) || request.expected_revision<0)
      throw Error('invalid_revision');
    const payload=request.payload || '';
    if (typeof payload!=='string' || payload.length>MAX_BASE64_LENGTH) throw Error('payload_too_large');
    const key=PropertiesService.getScriptProperties().getProperty('DIPLE_SHARED_KEY');
    if (!key || key.length<32) throw Error('gateway_not_configured');
    const sigInput=[request.action,name,String(request.timestamp),request.nonce,
                    String(request.expected_revision),sha_(payload)].join('\n');
    const expected=hex_(Utilities.computeHmacSha256Signature(sigInput,key,
                                               Utilities.Charset.UTF_8));
    if (!/^[0-9a-f]{64}$/.test(request.signature||'') || request.signature!==expected)
      throw Error('unauthorized');
    // CAS and worksheet-pointer commit are guarded by one global script lock.
    const lock=LockService.getScriptLock();
    if (!lock.tryLock(20000)) throw Error('gateway_busy');
    try {
      const props=PropertiesService.getScriptProperties();
      const metaKey=PREFIX+name+'_ACTIVE';
      const meta=current_(props,metaKey);
      const ss=SpreadsheetApp.getActiveSpreadsheet();
      if (!ss) throw Error('bind_script_to_spreadsheet');
      if (request.action==='read') {
        if (!meta.revision) return result_({ok:true,spreadsheet_id:ss.getId(),revision:0,payload:'',payload_sha256:sha_('')});
        const readSheet=sheet_(ss,PREFIX+name+'_'+meta.slot);
        const count=readSheet.getLastRow();
        const chunks=count ? readSheet.getRange(1,1,count,1).getValues() : [];
        const body=chunks.map(function(x){return String(x[0]||'');}).join('');
        if (sha_(body)!==meta.sha256) throw Error('stored_checksum_failed');
        return result_({ok:true,spreadsheet_id:ss.getId(),revision:meta.revision,payload:body,payload_sha256:meta.sha256});
      }
      if (request.expected_revision!==meta.revision)
        return result_({ok:false,code:'revision_conflict'});
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload) || payload.length%4!==0)
        throw Error('invalid_base64');
      const next=meta.slot==='A' ? 'B' : 'A';
      const s=sheet_(ss,PREFIX+name+'_'+next);
      s.clearContents();
      const chunks=[];
      for (let i=0;i<payload.length;i+=MAX_CHUNK) chunks.push([payload.substring(i,i+MAX_CHUNK)]);
      if (chunks.length) {
        if (s.getMaxRows()<chunks.length) s.insertRowsAfter(s.getMaxRows(),chunks.length-s.getMaxRows());
        s.getRange(1,1,chunks.length,1).setValues(chunks);
      }
      SpreadsheetApp.flush();
      // One ScriptProperty is the commit marker; previous worksheet is untouched.
      props.setProperty(metaKey,JSON.stringify({revision:meta.revision+1,slot:next,sha256:sha_(payload)}));
      return result_({ok:true,spreadsheet_id:ss.getId(),revision:meta.revision+1,payload_sha256:sha_(payload)});
    } finally { lock.releaseLock(); }
  } catch (error) {
    // Avoid returning HTTP exceptions/stack traces or request data to clients.
    const known=['invalid_request','invalid_namespace','invalid_action','stale_timestamp','invalid_nonce',
                 'invalid_revision','payload_too_large','gateway_not_configured','unauthorized',
                 'gateway_busy','bind_script_to_spreadsheet','stored_checksum_failed','invalid_base64'];
    return result_({ok:false,code:known.includes(error.message)?error.message:'gateway_error'});
  }
}

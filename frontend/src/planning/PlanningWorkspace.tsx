import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,BookOpen,CalendarDays,CheckCircle2,ClipboardList,Database,Download,GraduationCap,LayoutDashboard,Save,Users,Workflow} from 'lucide-react';
import type {Send,Snapshot} from '../types';
import {Button} from '../components/ui';

type Planning = NonNullable<Snapshot['planning']>;
type Page = 'dashboard'|'school'|'resources'|'lessons'|'enrollment'|'sectioning'|'solver'|'editor'|'publish'|'storage';
const pages:{id:Page;label:string;icon:typeof BookOpen}[]=[
  {id:'dashboard',label:'진행 대시보드',icon:LayoutDashboard},
  {id:'school',label:'학교·학년도·학기',icon:CalendarDays},
  {id:'resources',label:'교사·학급·교실·과목',icon:Users},
  {id:'lessons',label:'시수배당·수업 조건',icon:ClipboardList},
  {id:'enrollment',label:'수강신청 데이터',icon:GraduationCap},
  {id:'sectioning',label:'이동반 자동편성',icon:Workflow},
  {id:'solver',label:'자동 시간표 편성',icon:CalendarDays},
  {id:'editor',label:'시간표 검토·수정',icon:BookOpen},
  {id:'publish',label:'확정·내보내기',icon:CheckCircle2},
  {id:'storage',label:'저장·복원·이력',icon:Database},
];
const sectionKeys=['teachers','classes','rooms','subjects','students','lessons'] as const;
const examples:Record<string,string>={
  teachers:JSON.stringify([{id:'T1',name:'교사1',subject:'국어',blocked:[],max_weekly:20}],null,2),
  classes:JSON.stringify([{id:'C1',name:'1-1',grade:1,size:25,blocked:[]}],null,2),
  rooms:JSON.stringify([{id:'R1',name:'과학실',capacity:30,blocked:[]}],null,2),
  subjects:JSON.stringify([{id:'K',name:'국어',credits:0}],null,2),
  students:JSON.stringify([{id:'S1',name:'학생1',class_id:'C1'}],null,2),
  lessons:JSON.stringify([{id:'LK1',subject_id:'K',teacher_ids:['T1'],class_ids:['C1'],student_ids:[],room_ids:[],weekly_periods:2,duration:1,simultaneous_group:'',fixed_slots:[],forbidden_slots:[]}],null,2),
};
const labels:Record<string,string>={teachers:'교사',classes:'학급',rooms:'교실',subjects:'과목',students:'학생',lessons:'수업·시수'};
function downloadText(filename:string,contents:string,mime='application/json'){
  const url=URL.createObjectURL(new Blob([contents],{type:mime}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadBase64(filename:string,base64:string,mime:string){
  const binary=atob(base64);const bytes=new Uint8Array(binary.length);
  for(let i=0;i<bytes.length;i++)bytes[i]=binary.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([bytes],{type:mime}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function PlanningWorkspace({data,send,busy}:{data:Planning;send:Send;busy:boolean}){
  const [page,setPage]=useState<Page>('dashboard');
  const [message,setMessage]=useState('');
  const [issues,setIssues]=useState<string[]>([]);
  const [source,setSource]=useState('');
  const [selectedKey,setSelectedKey]=useState<string>('teachers');
  const [sectionText,setSectionText]=useState('');
  const [snapshotText,setSnapshotText]=useState('');
  const [teacherMap,setTeacherMap]=useState('{}');
  const [roomMap,setRoomMap]=useState('{}');
  const [candidateName,setCandidateName]=useState('시간표 후보');
  const [selectedCandidate,setSelectedCandidate]=useState('');
  const [first,setFirst]=useState('');const [second,setSecond]=useState('');
  const [newStart,setNewStart]=useState('월1');const [roomId,setRoomId]=useState('');
  const [seconds,setSeconds]=useState(10);
  const project=data.project;
  const available=Boolean(project);
  const sessionRows=(data.result?.placements??[]) as Array<{session_id:string;start:string;room_id:string}>;
  const candidates=(project?.candidates??[]) as Array<{id:string;label:string;status:string;engine:string;placements:Array<{session_id:string;start:string;room_id:string}>}>;
  const rows=useMemo(()=>project?{
    교사:project.teachers?.length??0, 학급:project.classes?.length??0,
    교실:project.rooms?.length??0, 과목:project.subjects?.length??0,
    학생:project.students?.length??0, 수업:project.lessons?.length??0}:null,[project]);

  useEffect(()=>{setSource(project?JSON.stringify(project,null,2):'');setSectionText(project?JSON.stringify(project[selectedKey]??[],null,2):'');},[project,selectedKey]);
  useEffect(()=>{setSnapshotText(data.enrollmentSnapshot?JSON.stringify(data.enrollmentSnapshot,null,2):'');},[data.enrollmentSnapshot]);
  async function action(operation:string,payload:Record<string,unknown>={}){
    const reply=await send(`planning.${operation}`,payload);
    const result=reply.result as Record<string,any>|null;
    setIssues(result?.errors??[]);
    setMessage(reply.success?(result?.message??`처리 완료 (${operation})`):(reply.error?.message??'작업 실패'));
    return reply.success?result:null;
  }
  function applyProject(next:Record<string,any>){return action('update',{project:next});}
  function sectionSave(){try{const entries=JSON.parse(sectionText);if(!Array.isArray(entries))throw new Error('JSON 배열이어야 합니다.');if(!project)throw new Error('프로젝트가 없습니다.');void applyProject({...project,[selectedKey]:entries});}catch(e){setMessage(String(e));}}
  function parseObject(s:string,label:string){const value=JSON.parse(s);if(!value||Array.isArray(value)||typeof value!=='object')throw new Error(`${label}: JSON 객체가 필요합니다.`);return value as Record<string,any>;}
  async function loadFile(file:File|undefined,kind:'project'|'snapshot'){
    if(!file)return;
    if(file.size>1500000){setMessage('JSON 파일이 너무 큽니다.');return;}
    try{const doc=parseObject(await file.text(),kind);if(kind==='project')await applyProject(doc);else await action('section_snapshot',{snapshot:doc});}
    catch(e){setMessage('파일 오류: '+String(e));}
  }
  return <div className="planning-shell">
    <aside className="planning-navigation" aria-label="수업계획 단계"><strong>수업계획 · Phase 7</strong><small>신규 기초 시간표 작성 영역</small>
      {pages.map((entry,i)=>{const Icon=entry.icon;return <button key={entry.id} className={page===entry.id?'planning-link current':'planning-link'} onClick={()=>{setPage(entry.id);if(entry.id==='lessons')setSelectedKey('lessons');else if(entry.id==='resources')setSelectedKey('teachers');}}><Icon size={16}/><span>{String(i+1).padStart(2,'0')} · {entry.label}</span></button>;})}
      <Button disabled={busy} onClick={()=>void action('close')}>기존 업무로 돌아가기</Button>
    </aside>
    <section className="planning-content">
      <p className="planning-warn"><AlertTriangle size={16}/>{data.warning}</p>
      {message&&<div role="status" className="notice">{message}<button onClick={()=>setMessage('')}>닫기</button></div>}
      {issues.length>0&&<div className="notice error" role="alert"><strong>검증 문제 {issues.length}건</strong><ul>{issues.slice(0,24).map((it,i)=><li key={i}>{it}</li>)}</ul></div>}
      {!available&&<div className="card planning-card"><h2>수업계획 시작</h2><p>기존 운영 데이터를 수정하지 않고 합성 예시로 기능을 검증하거나, 독립적인 Phase 7 프로젝트 JSON을 가져오세요.</p><div className="planning-actions"><Button disabled={busy} onClick={()=>void action('sample',{sample:'middle'})}>중학교 예시</Button><Button disabled={busy} onClick={()=>void action('sample',{sample:'high'})}>고등학교 예시</Button><label className="planning-upload">프로젝트 JSON 가져오기<input type="file" accept=".json,application/json" onChange={e=>void loadFile(e.target.files?.[0],'project')}/></label></div></div>}
      {page==='dashboard'&&available&&<div className="planning-panel"><h2>수업계획 진행 현황</h2><p>{project?.school?.name} · {project?.school?.academic_year}학년도 {project?.school?.semester}학기 · {project?.school?.level}</p><div className="planning-metrics">{Object.entries(rows??{}).map(([name,count])=><div className="planning-metric" key={name}><small>{name}</small><strong>{count}</strong></div>)}<div className="planning-metric"><small>시간표 후보</small><strong>{candidates.length}</strong></div></div><div className="planning-actions"><Button disabled={busy} onClick={()=>void action('validate')}>기초 데이터 검증</Button><Button disabled={busy} onClick={()=>{setPage('solver');}}>자동 시간표로 이동</Button></div><p>신규 편성 초안은 기존 주간 시간표와 독립적입니다. 기존 운영 반영 기능은 안전성 검증 전까지 제공하지 않습니다.</p></div>}
      {page==='school'&&available&&<div className="planning-panel"><h2>학교·학년도·학기</h2><p>학교 ID와 학년도·학기는 저장 데이터의 고유 키입니다. 기존 저장본이 있는 경우 값을 변경하기 전에 JSON으로 백업하세요.</p><div className="planning-fields"><label>학교 ID<input readOnly value={project!.school.id??''}/></label><label>학교명<input readOnly value={project!.school.name??''}/></label></div><p>아래 JSON 편집기에서 실제 값을 수정한 후 [프로젝트 JSON 반영]을 누르세요. 위 정보는 현재 서버 초안의 읽기용 확인값입니다.</p><textarea aria-label="프로젝트 JSON 편집" rows={18} value={source} onChange={e=>setSource(e.target.value)}/><div className="planning-actions"><Button disabled={busy} onClick={()=>{try{void applyProject(parseObject(source,'프로젝트'));}catch(e){setMessage(String(e));}}}>프로젝트 JSON 반영</Button><Button disabled={busy} onClick={()=>void action('validate')}>검증</Button></div></div>}
      {page==='resources'&&available&&<div className="planning-panel"><h2>교사·학급·교실·과목·학생</h2><p>기존 Master ID와 다른 ID를 사용할 경우 매핑 확인 전에는 기존 운영 시간표와 연결하지 않습니다.</p>{renderJsonEditor(false)}</div>}
      {page==='lessons'&&available&&<div className="planning-panel"><h2>시수배당 및 제약조건</h2><p>교사·학급·학생·교실의 ID와 시수·연속교시·고정수업·금지교시를 Phase 7 원본 모델 형식으로 입력합니다.</p>{renderJsonEditor(true)}<Button disabled={busy} onClick={()=>void action('validate')}>모델 제약 검증</Button></div>}
      {page==='enrollment'&&<div className="planning-panel"><h2>수강신청 확정 데이터 연결</h2><p>현 버전은 Phase 7에서 확정된 신청 스냅샷 JSON의 불러오기·검증만 지원합니다. 학생용 온라인 로그인과 실시간 제출·동시성 저장은 미통합이며 운영용으로 제공하지 않습니다.</p><label className="planning-upload">확정 스냅샷 JSON 파일<input type="file" accept=".json,application/json" onChange={e=>void loadFile(e.target.files?.[0],'snapshot')}/></label><textarea aria-label="확정 수강신청 스냅샷 JSON" rows={12} value={snapshotText} placeholder="Phase 7의 확정 snapshot JSON을 붙여 넣으세요" onChange={e=>setSnapshotText(e.target.value)}/><Button disabled={busy} onClick={()=>{try{void action('section_snapshot',{snapshot:parseObject(snapshotText,'스냅샷')});}catch(e){setMessage(String(e));}}}>스냅샷 검증·불러오기</Button></div>}
      {page==='sectioning'&&<div className="planning-panel"><h2>자동 이동반 편성</h2><p>{data.enrollmentSnapshot?`확정 스냅샷: ${data.enrollmentSnapshot.snapshot_id} · 신청 학생 ${data.enrollmentSnapshot.students?.length??0}명`:'먼저 「수강신청 데이터」에서 확정 스냅샷을 불러오세요.'}</p><Button disabled={busy||!data.enrollmentSnapshot} onClick={()=>void action('section_generate',{seconds})}>이동반 자동 편성 실행</Button>{data.sectionPlan&&<><div className="planning-metrics"><div className="planning-metric"><small>분반 수</small><strong>{data.sectionPlan.sections?.length??0}</strong></div><div className="planning-metric"><small>배정 건수</small><strong>{data.sectionPlan.assignments?.length??0}</strong></div></div><p>시간표에 연결하려면 모든 분반에 실제 교사 ID를 매핑해야 합니다. 기존 후보·확정본이 있으면 병합을 차단합니다.</p><textarea aria-label="분반별 교사 ID 매핑" rows={5} value={teacherMap} onChange={e=>setTeacherMap(e.target.value)} placeholder='{"SEC-...":"T1"}'/><textarea aria-label="분반별 교실 ID 매핑" rows={4} value={roomMap} onChange={e=>setRoomMap(e.target.value)} placeholder='{"SEC-...":"R1"}'/><Button disabled={busy} onClick={()=>{try{void action('section_apply',{teacher_map:parseObject(teacherMap,'교사 매핑'),room_map:parseObject(roomMap,'교실 매핑')});}catch(e){setMessage(String(e));}}}>분반 수업을 신규 시간표 초안에 병합</Button><details><summary>분반 결과 JSON 보기</summary><pre>{JSON.stringify(data.sectionPlan,null,2)}</pre></details></>}</div>}
      {page==='solver'&&available&&<div className="planning-panel"><h2>Phase 7 자동 시간표 편성</h2><p>OR-Tools가 설치되어 있지 않으면 작은 예제 전용 백트래킹을 사용합니다. 대체 엔진 결과를 학교 전체 검증으로 간주하지 않습니다.</p><div className="planning-actions"><label>최대 계산 시간(초) <input type="number" min={1} max={30} value={seconds} onChange={e=>setSeconds(Math.max(1,Math.min(30,Number(e.target.value)||1)))}/></label><Button disabled={busy} onClick={()=>void action('validate')}>사전 검증</Button><Button disabled={busy} onClick={()=>void action('solve',{seconds})}>자동 시간표 실행</Button></div>{data.result&&<><p>상태: <strong>{data.result.status}</strong> · 엔진: {data.result.engine} · 배정 회차: {sessionRows.length}</p><ResultTable rows={sessionRows}/><div className="planning-actions"><input aria-label="시간표 후보 이름" value={candidateName} onChange={e=>setCandidateName(e.target.value)}/><Button disabled={busy||!['OPTIMAL','FEASIBLE'].includes(data.result.status)} onClick={()=>void action('candidate',{label:candidateName})}>검증된 후보 저장</Button></div></>}</div>}
      {page==='editor'&&available&&<div className="planning-panel"><h2>시간표 편집·충돌 검사</h2><p>현재 계산 결과를 기준으로 이동 또는 맞교환합니다. 변경 내용은 전체 충돌 검증 후 적용되며 운영 원본은 보존됩니다.</p><ResultTable rows={sessionRows}/><div className="planning-fields"><label>이동할 회차 ID<input value={first} onChange={e=>setFirst(e.target.value)}/></label><label>새 시작교시 (예: 월1)<input value={newStart} onChange={e=>setNewStart(e.target.value)}/></label><label>교실 ID (빈 값은 현재 유지)<input value={roomId} onChange={e=>setRoomId(e.target.value)}/></label><label>교환 상대 회차 ID<input value={second} onChange={e=>setSecond(e.target.value)}/></label></div><div className="planning-actions"><Button disabled={busy||!sessionRows.length} onClick={()=>void action('move',{session_id:first,start:newStart,...(roomId?{room_id:roomId}:{})})}>수업 이동 및 전체 검증</Button><Button disabled={busy||!sessionRows.length} onClick={()=>void action('swap',{first,second})}>회차 맞교환 및 전체 검증</Button><Button disabled={busy||!sessionRows.length} onClick={()=>void action('candidate',{label:'수동 수정 후보'})}>현재 결과를 새 후보로 저장</Button></div></div>}
      {page==='publish'&&available&&<div className="planning-panel"><h2>확정·내보내기</h2><p>아래 확정은 <strong>수업계획 초안 내 확정</strong>이며 기존 운영 시간표·수업교환·시험감독 데이터를 변경하지 않습니다.</p><div className="planning-fields"><label>확정할 후보<select value={selectedCandidate} onChange={e=>setSelectedCandidate(e.target.value)}><option value="">후보 선택</option>{candidates.map(c=><option key={c.id} value={c.id}>{c.id} · {c.label} ({c.status})</option>)}</select></label></div><div className="planning-actions"><Button disabled={busy||!selectedCandidate} onClick={()=>{if(window.confirm('선택한 후보를 수업계획 초안에서 확정할까요? 운영 시간표에는 적용하지 않습니다.'))void action('publish',{candidate_id:selectedCandidate});}}>후보 확정</Button><Button disabled={busy||!sessionRows.length} onClick={async()=>{const res=await action('excel');if(res?.base64)downloadBase64(res.filename,res.base64,res.mime);}}>현재 결과 Excel 내려받기</Button><Button disabled={!project} onClick={()=>downloadText('Diple-Planning-Project.json',JSON.stringify(project,null,2))}>프로젝트 JSON 내려받기</Button></div>{project?.published&&<p>초안 확정본: {project.published.candidate_id} ({project.published.published_at})</p>}</div>}
      {page==='storage'&&<div className="planning-panel"><h2>저장·복원·이력</h2><p>현재 초안: {data.dirty?'저장되지 않은 변경 있음':'변경 없음'} · 별도 Sheets 리비전: {data.savedRevision??0} · 서버 저장 권한: {data.writable?'사용 가능':'읽기 전용'}</p><p>기존 시트는 수정하지 않고 `Diple_Planning` 워크시트에 버전별로 기록합니다. Google Sheets는 다중 관리자 동시 저장에 대한 완전한 트랜잭션을 제공하지 않습니다.</p><div className="planning-actions"><Button disabled={busy||!available||!data.writable} onClick={()=>{if(window.confirm('현재 초안을 별도 Diple_Planning 시트에 저장하시겠습니까? 해당 탭이 없다면 새로 생성합니다.'))void action('save_sheet',{confirm:true});}}><Save size={16}/> Google Sheets에 저장</Button><Button disabled={busy||!available} onClick={()=>{if(!data.dirty||window.confirm('미저장 초안을 버리고 같은 학교·학기의 저장본을 불러옵니다. 계속할까요?'))void action('load_sheet',{discard:true});}}>저장본 불러오기</Button><Button disabled={!available} onClick={()=>downloadText('Diple-Planning-Backup.json',JSON.stringify(project,null,2))}><Download size={16}/> 로컬 JSON 백업</Button></div><p>새로고침과 재배포 전에 반드시 영구 저장하거나 JSON 백업을 받아야 합니다. 배포 후 기존 원본과 동일 기능임을 검증하지 않은 경우 운영 반영을 진행하지 마세요.</p></div>}
    </section>
  </div>;

  function renderJsonEditor(lessonsOnly:boolean){const visible=lessonsOnly?['lessons']:sectionKeys.filter(k=>k!=='lessons');return <><div className="planning-chip-row">{visible.map(k=><button key={k} className={selectedKey===k?'planning-chip selected':'planning-chip'} onClick={()=>setSelectedKey(k)}>{labels[k]} ({project?.[k]?.length??0})</button>)}</div><p>선택 데이터(JSON 배열)를 변경한 뒤 반영하세요. 형식 참고 예시는 아래에 표시됩니다.</p><textarea aria-label={`${labels[selectedKey]} JSON 편집`} rows={15} value={sectionText} onChange={e=>setSectionText(e.target.value)}/><details><summary>JSON 입력 예시</summary><pre>{examples[selectedKey]??'[]'}</pre></details><Button disabled={busy} onClick={sectionSave}>선택 데이터 초안에 반영</Button></>}
}
function ResultTable({rows}:{rows:Array<{session_id:string;start:string;room_id:string}>}){
  if(!rows.length)return <p>계산된 시간표 회차가 없습니다.</p>;
  return <div className="planning-result-scroll"><table><thead><tr><th>회차 ID</th><th>시작교시</th><th>교실 ID</th></tr></thead><tbody>{rows.map(p=><tr key={p.session_id}><td>{p.session_id}</td><td>{p.start}</td><td>{p.room_id||'일반 교실'}</td></tr>)}</tbody></table></div>;
}

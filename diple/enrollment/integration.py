"""Internal, versioned handoff to the existing timetable data model."""
from __future__ import annotations
from collections import Counter, defaultdict
from copy import deepcopy
from io import BytesIO, StringIO
import csv
import json
from openpyxl import Workbook,load_workbook
from openpyxl.styles import Font,PatternFill
from ..model import validate_project
from .service import EnrollmentError


class EnrollmentExportService:
    """No upload needed: call build_rows(snapshot) from sectioning/scheduling code."""

    @staticmethod
    def build_rows(snapshot):
        courses={x['offering_id']:x for x in snapshot['offerings']}
        groups={x['group_id']:x['name'] for x in snapshot['groups']}
        result=[]
        for student in snapshot['students']:
            for ordinal,ident in enumerate(student['choices'],1):
                course=courses[ident]
                result.append({'snapshot_id':snapshot['snapshot_id'],'snapshot_version':snapshot['version'],
                    'school_id':snapshot['school_id'],'academic_year':snapshot['academic_year'],
                    'semester':snapshot['semester'],'campaign_id':snapshot['campaign_id'],
                    'student_id':student['student_id'],'class_id':student['class_id'],
                    'grade':student['grade'],'number':student['number'],'offering_id':ident,
                    'course_id':course['course_id'],'course_name':course['course_name'],
                    'group_id':course['group_id'],'group_name':groups.get(course['group_id'],''),
                    'selection_rank':ordinal,'credits':course['credits'],'units':course['units'],
                    'planned_capacity':course['planned_capacity'],'section_capacity':course['section_capacity'],
                    'min_students':course['min_students'],'joint_education':bool(course['joint_education']),
                    'availability':course['availability']})
        return result

    @staticmethod
    def to_json(snapshot):
        return json.dumps({'snapshot':snapshot,'normalized_choices':EnrollmentExportService.build_rows(snapshot)},
                          ensure_ascii=False,indent=2).encode('utf-8')

    @staticmethod
    def to_csv(snapshot):
        rows=EnrollmentExportService.build_rows(snapshot)
        if not rows:return b'\xef\xbb\xbf'
        io=StringIO();writer=csv.DictWriter(io,fieldnames=list(rows[0]))
        writer.writeheader();writer.writerows(rows)
        return io.getvalue().encode('utf-8-sig')

    @staticmethod
    def to_excel(snapshot):
        rows=EnrollmentExportService.build_rows(snapshot)
        wb=Workbook(); ws=wb.active;ws.title='NormalizedChoices'
        headers=list(rows[0]) if rows else ['snapshot_id','student_id','course_id','group_id','credits']
        ws.append(headers)
        for r in rows:ws.append([r.get(x,'') for x in headers])
        counts=Counter(r['offering_id'] for r in rows)
        sheet=wb.create_sheet('OfferingSummary')
        sheet.append(['snapshot_id','offering_id','course_id','course_name','applicants','min_students','planned_capacity','section_capacity'])
        for off in snapshot['offerings']:
            sheet.append([snapshot['snapshot_id'],off['offering_id'],off['course_id'],off['course_name'],counts[off['offering_id']],
                          off['min_students'],off['planned_capacity'],off['section_capacity']])
        legacy=wb.create_sheet('SelectionMatrix')
        col_course=list(dict.fromkeys(x['course_id'] for x in snapshot['offerings']))
        legacy.append(['student_id','grade','class_id','number',*col_course])
        for st in snapshot['students']:
            selected={next(x for x in snapshot['offerings'] if x['offering_id']==oid)['course_id'] for oid in st['choices']}
            legacy.append([st['student_id'],st['grade'],st['class_id'],st['number'],*[1 if c in selected else 0 for c in col_course]])
        meta=wb.create_sheet('SchemaAndValidation')
        for k in ['snapshot_id','version','school_id','academic_year','semester','campaign_id','campaign_revision','created_at']:
            meta.append([k,str(snapshot.get(k,''))])
        meta.append(['import_rules','NormalizedChoices: stable offering_id,student_id + snapshot_id; duplicates forbidden'])
        meta.append(['compatibility','SelectionMatrix is a reference matrix, not a certified 압핀 import file'])
        for sheet in wb:
            sheet.freeze_panes='A2';sheet.auto_filter.ref=sheet.dimensions
            for cell in sheet[1]:cell.font=Font(color='FFFFFF',bold=True);cell.fill=PatternFill('solid',fgColor='245A75')
            for col in sheet.columns:
                letter=col[0].column_letter
                sheet.column_dimensions[letter].width=min(42,max(13,max(len(str(c.value or '')) for c in list(col)[:30])+3))
        out=BytesIO();wb.save(out);return out.getvalue()

    @staticmethod
    def import_validate_xlsx(snapshot, xlsx_bytes):
        wb=load_workbook(BytesIO(xlsx_bytes),read_only=True,data_only=True)
        if 'NormalizedChoices' not in wb.sheetnames:
            return [{'row':1,'column':'sheet','error':'NormalizedChoices 탭 누락'}]
        ws=wb['NormalizedChoices'];iterator=ws.iter_rows(values_only=True)
        headers=list(next(iterator,[]));required={'snapshot_id','student_id','offering_id'}
        errors=[{'row':1,'column':f,'error':'필수 열 누락'} for f in required-set(headers)]
        if errors:return errors
        known={s['student_id'] for s in snapshot['students']}
        courses={o['offering_id'] for o in snapshot['offerings']}
        seen=set()
        for number,vals in enumerate(iterator,2):
            d=dict(zip(headers,vals))
            if d['snapshot_id']!=snapshot['snapshot_id']:
                errors.append({'row':number,'column':'snapshot_id','error':'스냅샷 버전 불일치'})
            if d['student_id'] not in known:
                errors.append({'row':number,'column':'student_id','error':'알 수 없는 학생 ID'})
            if d['offering_id'] not in courses:
                errors.append({'row':number,'column':'offering_id','error':'알 수 없는 과목 ID'})
            key=(d['student_id'],d['offering_id'])
            if key in seen:errors.append({'row':number,'column':'offering_id','error':'중복 선택'})
            seen.add(key)
        return errors

    @staticmethod
    def apply_to_project(project,snapshot):
        """In-memory direct connector. Does NOT invent timetable sections/teachers.

        Returns a *copy* and explicit diagnostic messages; never silently modifies
        existing lessons or unknown course sections.
        """
        p=deepcopy(project);s=p['school']
        if (s['id'],int(s['academic_year']),int(s['semester']))!=(snapshot['school_id'],snapshot['academic_year'],snapshot['semester']):
            raise EnrollmentError('확정 버전의 학교·학년도·학기와 시간표 프로젝트가 일치하지 않습니다.')
        class_ids={x['id'] for x in p['classes']};by_student={x['id']:x for x in p['students']}
        for row in snapshot['students']:
            if row['class_id'] not in class_ids:
                raise EnrollmentError(f"학생 {row['student_id']} 소속 학급이 시간표에 없습니다: {row['class_id']}")
            if row['student_id'] in by_student and by_student[row['student_id']]['class_id']!=row['class_id']:
                raise EnrollmentError(f"학생 {row['student_id']}의 기존 학급이 신청명렬과 다릅니다.")
            if row['student_id'] not in by_student:
                p['students'].append({'id':row['student_id'],'name':f"학생-{row['student_id']}",'class_id':row['class_id']})
        pairs=defaultdict(set)
        offerings={x['offering_id']:x for x in snapshot['offerings']}
        for row in snapshot['students']:
            for oid in row['choices']:
                pairs[offerings[oid]['course_id']].add(row['student_id'])
        notes=[];mapped=0
        for course_id,student_ids in pairs.items():
            candidates=[x for x in p['lessons'] if x['subject_id']==course_id and not x.get('class_ids')]
            if len(candidates)!=1:
                notes.append(f'{course_id}: 기존 선택반 수업이 {len(candidates)}개이므로 자동 학생배정을 보류했습니다. 분반 모듈 필요')
                continue
            candidates[0]['student_ids']=sorted(student_ids)
            mapped+=1
        errors=validate_project(p)
        if errors:
            raise EnrollmentError('연결된 시간표 검증 실패: '+' / '.join(errors[:10]))
        p.setdefault('enrollment_links',[]).append({'snapshot_id':snapshot['snapshot_id'],
               'campaign_id':snapshot['campaign_id'],'mapped_course_count':mapped,'unmapped_notes':notes})
        return p,notes

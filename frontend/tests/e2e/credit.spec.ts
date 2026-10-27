import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{test.skip(!process.env.OPERATIONS_TEST_URL,'Synthetic app only');await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort());});
test('student enrollment, admin finalization, automatic sections and student timetable',async({page},info)=>{
 await page.goto(process.env.OPERATIONS_TEST_URL!+'?case='+encodeURIComponent(info.title),{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'학생 온라인 수강신청',exact:true}).click();
 await page.getByLabel('학교 내부 ID',{exact:true}).fill('qa-school');
 await page.getByLabel('학생 고유 ID (관리자가 발급)',{exact:true}).fill('S1');
 await page.getByLabel('비밀번호',{exact:true}).fill('synthetic_password_123');
 await page.locator('.form').getByRole('button',{name:'로그인',exact:true}).click();
 await page.getByRole('checkbox',{name:/선택과학 · 3학점/}).check();
 await page.getByRole('button',{name:'임시 저장',exact:true}).click();
 await page.getByRole('button',{name:'검증 후 최종 제출/재제출',exact:true}).click();
 await expect(page.getByText('영구 저장된 접수번호:',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'교직원 로그인으로',exact:true}).click();
 await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
 await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'고교학점제',exact:true}).click();
 await page.getByLabel('작업 메뉴',{exact:true}).selectOption({label:'신청 게시·상태'});
 for(const next of ['신청 진행','신청 마감','검토 중']){
  await page.getByRole('button',{name:'상태 변경: '+next,exact:true}).click();
  // Re-query the same page after a mutation; its controls reflect the saved campaign state.
  await page.getByLabel('작업 메뉴',{exact:true}).selectOption({label:'신청 게시·상태'});
 }
 await page.getByLabel('작업 메뉴',{exact:true}).selectOption({label:'최종 확정'});
 await page.getByRole('button',{name:'전체 조건 재검증 후 불변 확정 버전 생성',exact:true}).click();
 await page.getByLabel('고교학점제 업무',{exact:true}).selectOption({label:'자동 이동반 편성'});
 await page.getByRole('button',{name:'자동 이동반 편성 실행',exact:true}).click();
 await expect(page.getByText('생성됨:',{exact:false})).toBeVisible();
 await page.getByLabel('새 버전 저장 사유 (4자 이상)',{exact:true}).fill('브라우저 편성 검증');
 await page.getByRole('checkbox',{name:'개설 기준 미달·초과·공동교육과정 경고를 검토했습니다.',exact:true}).check();
 await page.getByRole('button',{name:'편성 결과 불변 버전 저장',exact:true}).click();
 await page.getByLabel('고교학점제 업무',{exact:true}).selectOption({label:'학생별 시간표'});
 await expect(page.getByText('S1',{exact:true}).first()).toBeVisible();
 await expect(page.locator('.timetable-app')).toBeVisible();
});

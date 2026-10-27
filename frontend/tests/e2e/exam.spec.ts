import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort());});


// Runs only against the in-memory synthetic app; never write to a live school Sheet.
test('exam navigation keeps all supported workflows inside the existing React root',async({page})=>{
  test.skip(!process.env.EXAM_TEST_URL,'Use tests/exam_supervision/qa_app.py with EXAM_TEST_URL.');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.EXAM_TEST_URL!);
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  await expect(page.locator('.login-app')).toHaveCount(0);
  if(await page.getByRole('navigation',{name:'업무 메뉴'}).isHidden())await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'시험감독 관리',exact:true}).click();
  const adminPages=['시험감독 준비 현황','교사별 감독 조회','전체 감독 시간표','시험일정 설정',
    '교사 명단','감독 역할·강사 제외','배정불가 시간','수업시간표','겸임교사 일정','교사감독규칙',
    '최적화 설정','자동 배정·직접 수정','공정성 분석','배정 기록·인쇄','연결·조회 권한','저장 주체·연결 진단'];
  const menu=page.getByRole('navigation',{name:'시험감독 메뉴'});
  for(const name of adminPages){
    const item=menu.getByRole('button',{name,exact:true});
    await item.click();
    await expect(item).toHaveAttribute('aria-current','page');
    await expect(page.locator('.timetable-app')).toBeVisible();
    await expect(page.getByText('작업을 실행하지 못했습니다:',{exact:false})).toHaveCount(0);
  }
  await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'시간표 조회',exact:true}).click();
  await expect(page.getByRole('heading',{name:'시간표 조회',exact:true}).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('exam workflow fits tablet and phone navigation',async({page})=>{
  test.skip(!process.env.EXAM_TEST_URL,'Use synthetic URL only.');
  await page.setViewportSize({width:390,height:844});
  await page.goto(process.env.EXAM_TEST_URL!);
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  await expect(page.locator('.login-app')).toHaveCount(0);
  if(await page.getByRole('navigation',{name:'업무 메뉴'}).isHidden())await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'시험감독 관리',exact:true}).click();
  const menu=page.getByRole('navigation',{name:'시험감독 메뉴'});
  await page.locator('.exam-menu-toggle').click();
  await menu.getByRole('button',{name:'시험일정 설정'}).click();
  await expect(page.getByRole('button',{name:/^1 시험일정 현재 단계/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

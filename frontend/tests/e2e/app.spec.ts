import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort());});

import fs from 'node:fs';
import path from 'node:path';
const screenshots=path.resolve('../screenshots');
test.beforeAll(()=>fs.mkdirSync(screenshots,{recursive:true}));
test('React v2 login, twelve menus, salary calculate, download and responsive screen',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.getByLabel('아이디',{exact:true})).toBeVisible({timeout:30000});
  await page.screenshot({path:path.join(screenshots,'01-login.png'),fullPage:true});
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'업무 메뉴'})).toBeVisible({timeout:30000});
  const screens=[['시간표 조회','02-timetable'],['결강·보강','03-absence'],['시간표 맞교환 & 변경 추천','04-swaps'],['시간표 변경 테스트용','05-test'],['변경된 교사 주간표','06-changed'],['시간강사 관리','07-part-time'],['통계','08-statistics'],['복무 관리 & 판단','09-duty'],['다중 출장·전체 조정 추천','10-multi'],['아이디·권한 관리','11-admin'],['회원별 탭 권한 관리','12-permissions'],['교무호봉획정','13-salary']];
  for(const [menu,file] of screens){await page.getByRole('navigation').getByRole('button',{name:menu,exact:true}).click();await expect(page.getByRole('heading',{name:menu,exact:true}).first()).toBeVisible();await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');await expect(page.getByText('작업을 실행하지 못했습니다:',{exact:false})).toHaveCount(0);await page.screenshot({path:path.join(screenshots,file+'.png'),fullPage:true});}
  await page.getByRole('button',{name:'📊 호봉 계산 및 조서 생성',exact:true}).click();
  await expect(page.getByText('9호봉',{exact:true})).toBeVisible();
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'📄 A4 인쇄용 HTML / PDF 저장',exact:true}).click();
  const artifact=await download;expect(artifact.suggestedFilename()).toContain('호봉획정조서');
  await page.setViewportSize({width:768,height:1024});await expect(page.getByRole('navigation')).toBeHidden();await page.getByRole('button',{name:'설정',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(screenshots,'14-tablet.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'설정',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'15-mobile.png'),fullPage:true});
  for(const [width,height,file] of [[1920,1080,'17-desktop'],[1024,768,'18-tablet-landscape']] as const){await page.setViewportSize({width,height});await page.getByRole('button',{name:'설정',exact:true}).scrollIntoViewIfNeeded();expect(await page.locator('.timetable-app').evaluate(e=>e.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:path.join(screenshots,file+'.png'),fullPage:true});}
  expect(errors).toEqual([]);
});

test('absence registration, recommendation, assignment and cancellation execute Python writes',async({page})=>{
  await page.goto('/');await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
  await page.getByRole('navigation').getByRole('button',{name:'결강·보강',exact:true}).click();
  await page.getByRole('button',{name:'테스트가 1교시: 1-1 국어',exact:true}).click();
  await page.getByRole('button',{name:'결강 등록',exact:true}).click();
  await page.getByRole('button',{name:'테스트가 1교시: 1-1 국어 ❗',exact:true}).click();
  await page.getByLabel('보강 교사 선택',{exact:true}).selectOption({label:'테스트다'});
  await page.getByRole('button',{name:'배정',exact:true}).click();
  await expect(page.getByText('현재 배정:',{exact:false})).toContainText('테스트다');
  await page.getByRole('button',{name:'배정 취소',exact:true}).click();
  await expect(page.getByLabel('보강 교사 선택',{exact:true})).toBeVisible();
});

test('drag uses Python preview and explicit confirmation',async({page})=>{
  await page.goto('/');await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
  await page.getByRole('navigation').getByRole('button',{name:'시간표 맞교환 & 변경 추천',exact:true}).click();
  const a=page.getByRole('button',{name:/테스트가 월1:.*국어/s});
  const b=page.getByRole('button',{name:/테스트나 화2:.*수학/s});
  await a.dragTo(b);
  await expect(page.getByRole('heading',{name:'맞교환 적용 전 확인'})).toBeVisible();
  await page.getByRole('button',{name:'확인 후 저장',exact:true}).click();
  await expect(page.getByRole('heading',{name:'맞교환 적용 전 확인'})).toHaveCount(0);
  await expect(page.getByText('1:1 맞교환',{exact:true})).toBeVisible();
});

test('50MB PDF transfers through the actual v2 bridge in bounded chunks',async({page},testInfo)=>{
  test.setTimeout(300000);
  await page.goto('/');await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
  await page.getByRole('navigation').getByRole('button',{name:'교무호봉획정',exact:true}).click();
  const buffer=Buffer.alloc(50*1024*1024,32);buffer.write('%PDF-1.7\n% Synthetic upload transport fixture\n');
  const fixture=testInfo.outputPath('limit.pdf');fs.writeFileSync(fixture,buffer);
  try {await page.getByLabel('분석 파일',{exact:true}).setInputFiles(fixture);
    await expect(page.getByText('limit.pdf · 업로드 완료',{exact:true})).toBeVisible({timeout:270000});
  } finally {fs.unlinkSync(fixture);}
  // This is a transport test; do not invoke a billable Gemini API call.
});

// The QA server uses synthetic lessons, so this does not write to production Sheets.
test('lesson dialog outside-click / ESC dismissal leaves a usable timetable after swap',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  await page.getByRole('navigation').getByRole('button',{name:'시간표 맞교환 & 변경 추천',exact:true}).click();
  const a=page.getByRole('button',{name:/테스트가 월1:.*국어/s});
  const b=page.getByRole('button',{name:/테스트나 화2:.*수학/s});
  await a.dragTo(b);
  await expect(page.getByRole('heading',{name:'맞교환 적용 전 확인'})).toBeVisible();
  await page.getByRole('button',{name:'확인 후 저장',exact:true}).click();
  await expect(page.getByRole('heading',{name:'맞교환 적용 전 확인'})).toHaveCount(0);
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');
  // Open the lesson action dialog again on the refreshed timetable.
  await page.getByRole('button',{name:/테스트나 월1:.*국어/s}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('.modal-overlay').last().click({position:{x:4,y:4}});
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.timetable-app')).toBeVisible();
  await page.getByRole('button',{name:/테스트가 화2:.*수학/s}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('navigation',{name:'업무 메뉴'})).toBeVisible();
  await expect(page.locator('.timetable-app')).toBeVisible();
  expect(errors).toEqual([]);
});

test('dialog can be opened and dismissed repeatedly without losing the React root',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  await page.getByRole('navigation').getByRole('button',{name:'시간표 맞교환 & 변경 추천',exact:true}).click();
  for(let i=0;i<20;i++){
    await page.getByRole('button',{name:/테스트가 월1:/s}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    if(i%2===0)await page.keyboard.press('Escape');
    else await page.locator('.modal-overlay').last().click({position:{x:4,y:4}});
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.timetable-app')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

// Preview cancellation must not write a synthetic swap or lose the app root.
test('swap preview cancel, outside click and ESC all keep timetable interactive',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  await page.getByRole('navigation').getByRole('button',{name:'시간표 맞교환 & 변경 추천',exact:true}).click();
  const source=page.getByRole('button',{name:/테스트가 월1:.*국어/s});
  const destination=page.getByRole('button',{name:/테스트나 화2:.*수학/s});
  for(const how of ['button','escape','outside'] as const){
    await source.dragTo(destination);
    await expect(page.getByRole('heading',{name:'맞교환 적용 전 확인'})).toBeVisible();
    if(how==='button')await page.getByRole('button',{name:'취소',exact:true}).click();
    if(how==='escape')await page.keyboard.press('Escape');
    if(how==='outside')await page.locator('.modal-overlay').last().click({position:{x:5,y:5}});
    await expect(page.getByRole('heading',{name:'맞교환 적용 전 확인'})).toHaveCount(0);
    await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');
    await expect(page.locator('.timetable-app')).toBeVisible();
    await expect(page.getByRole('alert').filter({hasText:'시간표 화면을 표시하지 못했습니다.'})).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('settings modal outside click and ESC preserve the React app root',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  for(let i=0;i<10;i++){
    await page.getByRole('button',{name:'설정',exact:true}).click();
    await expect(page.getByRole('heading',{name:'화면 설정'})).toBeVisible();
    if(i%2===0)await page.keyboard.press('Escape');
    else await page.locator('.modal-overlay').last().click({position:{x:4,y:4}});
    await expect(page.getByRole('heading',{name:'화면 설정'})).toHaveCount(0);
    await expect(page.locator('.timetable-app')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

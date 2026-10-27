import {test,expect,type Page} from '@playwright/test';
import path from 'node:path';
test.use({hasTouch:true});
test.beforeEach(async({page})=>{test.skip(!process.env.SEMESTER_TEST_URL,'Use the synthetic semester Streamlit target');await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort());});
async function login(page:Page,title:string){
 await page.goto(process.env.SEMESTER_TEST_URL!+'?case='+encodeURIComponent(title),{waitUntil:'domcontentloaded'});
 await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
 await expect(page.locator('.login-app')).toHaveCount(0);
 if(await page.getByRole('navigation',{name:'업무 메뉴'}).isHidden())await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
 await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'학기 시간표 편성',exact:true}).click();
}
async function createAndSolve(page:Page){
 await page.getByLabel('학기명',{exact:true}).fill('합성 학기');await page.getByRole('button',{name:'학기 생성',exact:true}).click();
 await page.getByLabel('학기 편성 업무',{exact:true}).selectOption('1');
 await page.getByLabel('학기 기초자료 Excel/CSV',{exact:true}).setInputFiles(path.resolve('../tests/semester/data/synthetic-input.xlsx'));
 await expect(page.getByText('synthetic-input.xlsx · 업로드 완료',{exact:true})).toBeVisible();
 for(const category of ['teachers','classes','rooms','subjects','curriculum']){
  if(category==='curriculum')await page.getByLabel('학기 편성 업무',{exact:true}).selectOption('2');
  else await page.getByLabel('입력 자료',{exact:true}).selectOption(category);
  await page.getByRole('button',{name:'업로드 자료 검증·미리보기',exact:true}).click();
  await page.getByRole('button',{name:'검증된 업로드 자료 반영',exact:true}).click();
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');
 }
 await page.getByLabel('학기 편성 업무',{exact:true}).selectOption('5');
 await page.getByRole('button',{name:'자동편성 실행',exact:true}).click();
 await expect(page.getByText('저장된 후보 1개',{exact:true})).toBeVisible({timeout:30000});
 await page.getByLabel('학기 편성 업무',{exact:true}).selectOption('6');
 await expect(page.getByRole('region',{name:'학기 시간표 편집기'})).toBeVisible();
}
async function stage(page:Page,touch=false){
 const region=page.getByRole('region',{name:'학기 시간표 편집기'});let emptyDay='';
 for(const day of ['월','화','수','목','금']){let count=0;for(let n=1;n<=7;n++)count+=await page.getByTestId('semester-slot-'+day+n).locator('.ops-lesson').count();if(!count){emptyDay=day;break;}}
 expect(emptyDay).not.toBe('');const source=region.locator('.ops-lesson').first();
 if(touch){await source.tap();await region.getByRole('button',{name:emptyDay+'1로 이동',exact:true}).tap();}
 else await source.dragTo(page.getByTestId('semester-slot-'+emptyDay+'1'));
 await expect(page.getByRole('heading',{name:'학기 시간표 변경 미리보기',exact:true})).toBeVisible();
 await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');
}
test('full input solve drag edit finalize apply export and Phase6/legacy read',async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await login(page,info.title);await createAndSolve(page);await stage(page);
 await page.getByRole('button',{name:'검증된 편집을 새 후보로 저장',exact:true}).click();
 await expect(page.getByRole('heading',{name:'학기 시간표 변경 미리보기'})).toHaveCount(0);
 await page.getByRole('button',{name:'편집 취소 (이전 후보)',exact:true}).click();
 await page.getByRole('button',{name:'편집 다시 실행',exact:true}).click();
 await page.getByLabel('학기 편성 업무',{exact:true}).selectOption('8');await page.getByRole('button',{name:'전체 재검증 후 학기 확정',exact:true}).click();
 await page.getByRole('button',{name:'확정본 적용·배포',exact:true}).click();
 await expect(page.getByText('현재 적용 버전: 없음',{exact:true})).toHaveCount(0);
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'확정본 시간표 Excel',exact:true}).click();expect((await downloaded).suggestedFilename()).toBe('semester_final.xlsx');
 await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'학기 중 운영',exact:true}).click();
 await expect(page.getByRole('region',{name:'학기 중 시간표 편집기'})).toBeVisible();
 await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'시간표 조회',exact:true}).click();await expect(page.locator('.timetable-app')).toBeVisible();await page.getByRole('button',{name:'교사별 주간',exact:true}).click();await expect(page.getByRole('main').getByText('과학',{exact:false}).first()).toBeVisible();expect(errors).toEqual([]);
});
test('mobile touch, dialog close paths and all ten menus preserve root',async({page},info)=>{
 test.setTimeout(120000);await page.setViewportSize({width:390,height:844});await login(page,info.title);await createAndSolve(page);
 for(const close of ['X','ESC','outside','cancel']){
  await stage(page,true);
  if(close==='X')await page.getByRole('button',{name:'학기 변경안 닫기',exact:true}).click();
  if(close==='ESC')await page.keyboard.press('Escape');
  if(close==='outside')await page.mouse.click(5,5);
  if(close==='cancel')await page.getByRole('button',{name:'학기 편집 취소',exact:true}).click();
  await expect(page.getByRole('heading',{name:'학기 시간표 변경 미리보기'})).toHaveCount(0);await expect(page.locator('.timetable-app')).toBeVisible();
 }
 for(let n=0;n<10;n++){await page.getByLabel('학기 편성 업무',{exact:true}).selectOption(String(n));await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');await expect(page.getByText('작업을 실행하지 못했습니다:',{exact:false})).toHaveCount(0);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('button',{name:'로그인',exact:true})).toBeVisible();
});

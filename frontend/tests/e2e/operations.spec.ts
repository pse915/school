import {test,expect,type Page} from '@playwright/test';
test.use({hasTouch:true});
test.beforeEach(async({page})=>{await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort());});

async function enter(page:Page,name:string){
  console.log('ops: opening synthetic app');
  await page.goto(process.env.OPERATIONS_TEST_URL!+'?case='+encodeURIComponent(name),{waitUntil:'domcontentloaded'});
  console.log('ops: document ready');
  await page.getByLabel('아이디',{exact:true}).fill('tester');
  await page.getByRole('button',{name:'로그인',exact:true}).click();
  await expect(page.locator('.login-app')).toHaveCount(0);
  if(await page.getByRole('navigation',{name:'업무 메뉴'}).isHidden())await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'학기 중 운영',exact:true}).click();
  await expect(page.getByRole('region',{name:'학기 중 시간표 편집기'})).toBeVisible();
}
async function preview(page:Page){
  const editor=page.getByRole('region',{name:'학기 중 시간표 편집기'});
  await editor.getByRole('button',{name:'1교시 국어 테스트가',exact:true}).click();
  await editor.getByRole('button',{name:'1-1 4교시로 이동',exact:true}).click();
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toBeVisible();
}
test.beforeEach(()=>{test.skip(!process.env.OPERATIONS_TEST_URL,'Synthetic operations app required');});
test('all twelve menus and existing shell remain mounted',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page,info.title);
  for(let index=0;index<12;index++){
    await page.getByLabel('학기 중 운영 업무',{exact:true}).selectOption(String(index));
    await expect(page.getByRole('main')).toHaveAttribute('aria-busy','false');
    await expect(page.locator('.timetable-app')).toBeVisible();
    await expect(page.getByText('작업을 실행하지 못했습니다:',{exact:false})).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
test('drag creates only a proposal, then approve confirm and publish',async({page},info)=>{
  await enter(page,info.title);
  await page.getByRole('button',{name:'1교시 국어 테스트가',exact:true}).dragTo(page.getByTestId('ops-slot-1-1-4'));
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toBeVisible();
  await page.getByRole('button',{name:'확인 후 승인요청 제출',exact:true}).click();
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toHaveCount(0);
  await page.getByLabel('학기 중 운영 업무',{exact:true}).selectOption({label:'승인·확정'});
  await page.getByRole('button',{name:'검토 시작',exact:true}).click();
  await page.getByRole('button',{name:'승인',exact:true}).click();
  await page.getByRole('button',{name:'변경 확정',exact:true}).click();
  await page.getByRole('button',{name:'현재 날짜 확정본 배포',exact:true}).click();
  await page.getByLabel('학기 중 운영 업무',{exact:true}).selectOption('0');
  await expect(page.getByRole('button',{name:'4교시 국어 테스트가',exact:true})).toBeVisible();
  await page.reload();await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
  await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'학기 중 운영',exact:true}).click();
  await expect(page.getByRole('button',{name:'4교시 국어 테스트가',exact:true})).toBeVisible();
});
for(const close of ['X','ESC','outside','cancel'])test('proposal close '+close+' keeps React root and timetable',async({page},info)=>{
  await enter(page,info.title);await preview(page);
  if(close==='X')await page.getByRole('button',{name:'변경안 닫기',exact:true}).click();
  if(close==='ESC')await page.keyboard.press('Escape');
  if(close==='outside')await page.mouse.click(5,5);
  if(close==='cancel')await page.getByRole('button',{name:'미리보기 취소',exact:true}).click();
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toHaveCount(0);
  await expect(page.locator('.timetable-app')).toBeVisible();
  await expect(page.getByRole('button',{name:'1교시 국어 테스트가',exact:true})).toBeVisible();
});
test('mobile touch selection and responsive timetable',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await enter(page,info.title);
  await page.getByRole('button',{name:'1교시 국어 테스트가',exact:true}).tap();
  await page.getByRole('button',{name:'1-1 4교시로 이동',exact:true}).tap();
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toBeVisible();
  await page.getByRole('button',{name:'미리보기 취소',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.setViewportSize({width:768,height:1024});await expect(page.locator('.timetable-app')).toBeVisible();
});
test('duplicate confirmation creates one submitted request',async({page},info)=>{
  await enter(page,info.title);await preview(page);
  const button=page.getByRole('button',{name:'확인 후 승인요청 제출',exact:true});
  await button.evaluate(b=>{(b as HTMLButtonElement).click();(b as HTMLButtonElement).click();});
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toHaveCount(0);
  await page.getByLabel('학기 중 운영 업무',{exact:true}).selectOption({label:'변경요청'});
  await expect(page.getByLabel('변경요청 선택',{exact:true}).locator('option')).toHaveCount(1);
});
test('network timeout keeps timetable and allows reload recovery',async({page,context},info)=>{
  await enter(page,info.title);await preview(page);
  await page.clock.install();await context.setOffline(true);
  await page.getByRole('button',{name:'확인 후 승인요청 제출',exact:true}).click();
  await page.clock.fastForward(120001);
  await expect(page.getByText('서버 응답을 확인하지 못했습니다.',{exact:false})).toBeVisible();
  await expect(page.locator('.timetable-app')).toBeVisible();
  await context.setOffline(false);await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'로그인',exact:true})).toBeVisible();
});
test('delayed websocket response disables confirmation until settled',async({page},info)=>{
  let delay=0;
  await page.routeWebSocket('**/_stcore/stream',socket=>{
    const server=socket.connectToServer();socket.onMessage(message=>server.send(message));
    server.onMessage(message=>{setTimeout(()=>socket.send(message),delay);});
  });
  await enter(page,info.title);await preview(page);delay=900;
  const button=page.getByRole('button',{name:'확인 후 승인요청 제출',exact:true});
  await button.click();await expect(button).toBeDisabled();
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toHaveCount(0,{timeout:15000});
  await expect(page.locator('.timetable-app')).toBeVisible();
});
test('menu navigation and refresh clear abandoned proposal without saving',async({page},info)=>{
  await enter(page,info.title);await preview(page);
  await page.getByRole('button',{name:'미리보기 취소',exact:true}).click();
  await page.getByRole('navigation',{name:'업무 메뉴'}).getByRole('button',{name:'시간표 조회',exact:true}).click();
  await expect(page.locator('.timetable-app')).toBeVisible();await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'로그인',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'학기 중 변경안 미리보기'})).toHaveCount(0);
});

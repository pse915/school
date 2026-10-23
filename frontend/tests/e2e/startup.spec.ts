import {test,expect} from '@playwright/test';
test('real timetable_app2 entry displays login and clears startup notice after React is ready',async({page})=>{
  test.skip(!process.env.TIMETABLE_STARTUP_URL,'Set TIMETABLE_STARTUP_URL to the real entrypoint test server.');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TIMETABLE_STARTUP_URL!);
  await expect(page.getByLabel('아이디',{exact:true})).toBeVisible({timeout:30000});
  await expect(page.getByRole('button',{name:'로그인',exact:true})).toBeVisible();
  await expect(page.getByText('React 화면을 불러오는 중입니다.',{exact:false})).toHaveCount(0,{timeout:15000});
  await expect(page.locator('.timetable-app')).toBeVisible();
  expect(errors).toEqual([]);
});

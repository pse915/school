import {test,expect} from '@playwright/test';
test('nested API key plus school name loads the existing weekly timetable',async({page})=>{
 await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 await page.goto('/?school='+encodeURIComponent('배포예시중학교')+'&neis=school-name');
 await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
 await page.getByRole('navigation').getByRole('button',{name:'시간표 조회',exact:true}).click();
 await page.getByRole('button',{name:'교사별 주간',exact:true}).click();
 await expect(page.getByText('학사일정연동확인',{exact:false}).first()).toBeVisible();
 await expect(page.getByText('NEIS 학사일정을 불러오지 못했습니다.',{exact:false})).toHaveCount(0);
 await expect(page.getByRole('main').getByText('국어',{exact:false}).first()).toBeVisible();
 await expect(page.locator('.timetable-app')).toBeVisible();
 expect(await page.content()).not.toContain('SYNTHETIC-NEIS-ONLY');
});

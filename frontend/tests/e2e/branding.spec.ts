import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());});
test('configured school branding appears at login and in the existing shell',async({page})=>{
 await page.goto('/?school='+encodeURIComponent('배포예시중학교'));
 await expect(page.getByText('배포예시중학교',{exact:false}).first()).toBeVisible();
 await page.getByLabel('아이디',{exact:true}).fill('tester');await page.getByRole('button',{name:'로그인',exact:true}).click();
 await expect(page.getByRole('navigation',{name:'업무 메뉴'})).toBeVisible();
 await expect(page.locator('.app-footer')).toContainText('배포예시중학교');
 await page.getByRole('navigation').getByRole('button',{name:'시간표 조회',exact:true}).click();
 await expect(page.locator('.breadcrumb')).toContainText('배포예시중학교');
 await expect(page.locator('.timetable-app')).toBeVisible();
});

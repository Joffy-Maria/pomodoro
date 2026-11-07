import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Capture and print console logs from the browser
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/home');
    await page.waitForTimeout(1000);

    // Navigate straight to a solo session
    await page.locator('text=Pomodoro Session').click();
    await page.waitForTimeout(1000);
    await page.locator('text=Launch Solo').click();
    await page.waitForTimeout(3000);

    console.log("In room. current URL:", page.url());

    // Open Task Manager
    await page.locator('button').nth(3).click(); // the floating action button
    await page.waitForTimeout(1000);

    // Focus input and add task
    await page.locator('input[type="text"]').fill('Design the UI');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    console.log("Check for task completion.");

    await browser.close();
})();

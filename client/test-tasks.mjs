const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Capture and print console logs from the browser
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/home');
    await page.waitForTimeout(1000);

    console.log("Clicking pomodoro session card...");
    await page.locator('text=Pomodoro Session').click();
    await page.waitForTimeout(1000);
    await page.locator('text=Launch Solo').click();
    await page.waitForTimeout(3000);

    console.log("In room. current URL:", page.url());

    // Open Task Manager
    await page.locator('.glass-panel').last().click(); // Find the task floating icon by guessing
    await page.waitForTimeout(1000);

    // Focus input and add task
    await page.locator('input[type="text"]').fill('Design the UI');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    console.log("Done checking task completion.");

    await browser.close();
})();

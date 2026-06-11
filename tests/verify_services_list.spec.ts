import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Verify services list and capture screenshot', async ({ page }) => {
  // 1. Set viewport
  await page.setViewportSize({ width: 1280, height: 800 });

  // 2. Navigate to UI
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1500);

  // 3. Bypass login if present
  const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
  if (await googleLoginButton.count() > 0) {
    await googleLoginButton.click();
    await page.waitForTimeout(1000);
  }

  // 4. Go to Services page
  const servicesNavButton = page.locator('nav button', { hasText: 'Services' });
  await expect(servicesNavButton).toBeVisible();
  await servicesNavButton.click();
  await page.waitForTimeout(2000);

  // 5. Query all table rows
  const rows = page.locator('table tbody tr');
  const rowCount = await rows.count();
  
  console.log(`\n=== SERVICES TABLE ROW VERIFICATION ===`);
  console.log(`Total rows found: ${rowCount}`);
  
  for (let i = 0; i < rowCount; i++) {
    const text = await rows.nth(i).innerText();
    // Normalize newlines for single-line display in log
    const cleanedText = text.replace(/\n+/g, ' | ');
    console.log(`Row [${i}]: ${cleanedText}`);
  }
  console.log(`========================================\n`);

  // 6. Capture proof screenshot
  const screenshotPath = '/Users/perkunas/.gemini/antigravity/brain/459d4423-6d66-41ea-9802-61dbfd20cf72/services_table_proof.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved proof screenshot to: ${screenshotPath}`);
});

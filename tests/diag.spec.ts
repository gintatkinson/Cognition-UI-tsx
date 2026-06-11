import { test, expect } from '@playwright/test';

test('diagnostic test trace grandparents', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/');
  await page.waitForTimeout(1500);

  const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
  if (await googleLoginButton.count() > 0) {
    await googleLoginButton.click();
    await page.waitForTimeout(1000);
  }

  const baseNavButton = page.locator('nav button', { hasText: 'Base Network Topology' });
  await expect(baseNavButton).toBeVisible();
  await baseNavButton.click();
  await page.waitForTimeout(1500);

  const l2NetworkItem = page.locator('div', { hasText: 'L2 Carrier Ethernet Network' }).first();
  await expect(l2NetworkItem).toBeVisible();
  await l2NetworkItem.click();
  await page.waitForTimeout(1000);

  const tokyoNodeRow = page.locator('text=Tokyo L2 Aggregation Switch').first();
  await expect(tokyoNodeRow).toBeVisible();
  await tokyoNodeRow.click();
  await page.waitForTimeout(1500);

  const tpTextElement = page.locator('text=tp-L2-TK-eth0').first();
  const count = await tpTextElement.count();
  console.log(`Number of elements with text 'tp-L2-TK-eth0': ${count}`);
  
  if (count > 0) {
    const el = tpTextElement.first();
    const grandparentHtml = await el.evaluate(node => node.parentElement?.parentElement?.outerHTML.substring(0, 1000));
    console.log(`Grandparent HTML:`, grandparentHtml);
  }
});

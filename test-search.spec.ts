import { test, expect } from '@playwright/test';
test('Search flow validation', async ({ page }) => {
  await page.goto('http://localhost:3000/search');
  await expect(page.locator('h1')).toContainText('Search verified startups');
  await page.fill('input[name="q"]', 'AI SaaS');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/browse?q=AI+SaaS');
  await expect(page.locator('input[placeholder*="SaaS over"]')).toHaveValue('AI SaaS');
});
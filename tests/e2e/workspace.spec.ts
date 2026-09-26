import { test, expect } from '@playwright/test';
test('company onboarding, article generation, persistence and export', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Company name', { exact: true }).fill('Acme');
  await page.getByRole('button', { name: 'Find my company' }).click();
  await expect(page.getByText('No domains have been discovered.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Open my workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Make your next move matter.' })).toBeVisible();
  await expect(page.locator('.opportunity')).toHaveCount(5);
  await expect(page.getByText('Not measured', { exact: true })).toHaveCount(2);
  await page.getByLabel('Article brief').fill('A useful guide to choosing collaboration software');
  await page.getByRole('button', { name: 'Generate article', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources and provenance' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Demo template', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
  await page.getByRole('button', { name: 'Close article' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Make your next move matter.' })).toBeVisible();
  if (test.info().project.name === 'mobile')
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'Article library' }).click();
  await expect(page.locator('.article-card')).toHaveCount(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});
test('provider errors remain actionable and the brief is preserved', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo workspace' }).click();
  await page.route('**/api/ink', async (route) => {
    if (route.request().method() === 'POST')
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Research provider unavailable. Try again.' }),
      });
    else await route.continue();
  });
  await page.getByLabel('Article brief').fill('A guide to async team collaboration');
  await page.getByRole('button', { name: 'Generate article', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Research provider unavailable');
  await expect(page.getByLabel('Article brief')).toHaveValue('A guide to async team collaboration');
});

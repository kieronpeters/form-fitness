import { expect, test } from '@playwright/test';

test('home renders with a usable profile and today plan', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Let’s move');
  await expect(page.getByRole('link', { name: 'Train', exact: true })).toBeVisible();
  await expect(page.getByText('Recent training')).toBeVisible();

  await page.screenshot({ path: 'e2e/artifacts/home.png', fullPage: true });
  expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
});

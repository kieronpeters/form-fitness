import { expect, test } from '@playwright/test';

test('production build boots, splits pages, and registers the service worker', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Let’s move');
  await expect(page.locator('.today-hero')).toBeVisible();
  await page.screenshot({ path: 'e2e/artifacts/production-home.png', fullPage: true });

  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Progress', exact: true }).click();
  await expect(page.getByText('Your training, measured')).toBeVisible();

  const hasWorker = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration);
  });
  expect(hasWorker).toBe(true);

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return response.json() as Promise<{ icons: Array<{ src: string; sizes: string; purpose: string }> }>;
  });
  expect(manifest.icons.some((icon) => icon.src === '/icon-192.png' && icon.sizes === '192x192')).toBe(true);
  expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  const icon = await page.request.get('/icon-192.png');
  expect(icon.ok()).toBe(true);

  expect(errors, `Console/page errors:\n${errors.join('\n')}`).toEqual([]);
});

import { expect, test } from '@playwright/test';

const ROUTES: Array<{ path: string; name: string; ready: string }> = [
  { path: '/', name: 'home', ready: 'Recent training' },
  { path: '/workouts', name: 'workouts', ready: 'Your programmes' },
  { path: '/calendar', name: 'calendar', ready: 'Repeating schedule' },
  { path: '/library', name: 'library', ready: 'exercises' },
  { path: '/progress', name: 'progress', ready: 'Your training, measured' },
  { path: '/progress?tab=reports', name: 'reports', ready: 'Monthly report' },
  { path: '/progress?tab=photos', name: 'photos', ready: 'Photo journal' },
  { path: '/food', name: 'food', ready: 'Food diary' },
  { path: '/diary', name: 'diary', ready: 'Daily check-in' },
  { path: '/goals', name: 'goals', ready: 'Your goals' },
  { path: '/learn', name: 'learn', ready: 'Train smarter' },
  { path: '/learn/progressive-overload-without-guesswork', name: 'article', ready: 'The principle in one sentence' },
  { path: '/profile', name: 'profile', ready: 'Local & private' },
  { path: '/more', name: 'more', ready: 'Everything else' },
  { path: '/circle', name: 'circle', ready: 'Consistency is the flex' },
];

for (const route of ROUTES) {
  test(`mobile renders ${route.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(route.path);
    await expect(page.getByText(route.ready, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Horizontal overflow on ${route.path}`).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `e2e/artifacts/mobile-${route.name}.png`, fullPage: true });
    expect(errors, `Console/page errors on ${route.path}:\n${errors.join('\n')}`).toEqual([]);
  });
}

test('narrow 360px screens do not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/workouts', '/calendar', '/library', '/progress', '/food', '/diary', '/goals', '/learn', '/profile']) {
    await page.goto(path);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Horizontal overflow on ${path} at 360px`).toBeLessThanOrEqual(1);
  }
  expect(errors, `Page errors:\n${errors.join('\n')}`).toEqual([]);
});

test('desktop renders key screens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of [ROUTES[0], ROUTES[1], ROUTES[2], ROUTES[4], ROUTES[7], ROUTES[12], ROUTES[14]]) {
    await page.goto(route.path);
    await expect(page.getByText(route.ready, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `e2e/artifacts/desktop-${route.name}.png`, fullPage: true });
  }
  expect(errors, `Page errors:\n${errors.join('\n')}`).toEqual([]);
});

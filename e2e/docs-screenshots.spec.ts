import { expect, test, type Page } from '@playwright/test';

async function shot(page: Page, name: string) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `docs/screenshots/${name}.png`, animations: 'disabled' });
}

test('capture mobile product screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/profile');
  await page.getByRole('button', { name: /Add sample history/i }).click();
  await page.locator('.sheet').getByRole('button', { name: 'Add sample history' }).click();

  await page.goto('/');
  await expect(page.locator('.recent-list')).toContainText('Day');
  await shot(page, 'home');

  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  await shot(page, 'calendar');

  await page.goto('/progress');
  await expect(page.getByText('Your training, measured')).toBeVisible();
  await shot(page, 'progress');
  await page.getByRole('button', { name: 'Reports' }).click();
  await shot(page, 'report');
  await page.locator('.report-insights').scrollIntoViewIfNeeded();
  await shot(page, 'insights');

  await page.goto('/food');
  await page.locator('.meal-card').first().getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByPlaceholder('Search foods…').fill('banana');
  await page.locator('.food-row').filter({ hasText: 'Banana' }).click();
  await page.getByRole('button', { name: /Add to breakfast/i }).click();
  await expect(page.locator('.meal-entry').filter({ hasText: 'Banana' })).toBeVisible();
  await shot(page, 'food');

  await page.goto('/profile');
  await shot(page, 'profile');
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
  await shot(page, 'light');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();

  await page.goto('/');
  await page.getByRole('button', { name: /Start workout/i }).click();
  const firstExercise = page.locator('.session-exercise').first();
  await firstExercise.getByLabel('Weight for set 1').fill('24');
  await firstExercise.getByLabel('Reps for set 1').fill('12');
  await firstExercise.getByRole('button', { name: 'Complete set 1' }).click();
  await shot(page, 'session');

  await page.getByRole('button', { name: /Finish$/ }).click();
  await page.locator('.sheet').getByRole('button', { name: 'Finish & save' }).click();
  await expect(page.getByText('Work logged. Future you says thanks.')).toBeVisible();
  await shot(page, 'session-finish');
});

test('capture desktop screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: /Add sample history/i }).count();
  await page.goto('/profile');
  await page.getByRole('button', { name: /Add sample history/i }).click();
  await page.locator('.sheet').getByRole('button', { name: 'Add sample history' }).click();
  await page.goto('/');
  await shot(page, 'desktop-home');
  await page.goto('/calendar');
  await shot(page, 'desktop-calendar');
  await page.goto('/progress');
  await shot(page, 'desktop-progress');
});

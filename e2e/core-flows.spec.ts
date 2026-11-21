import { expect, test } from '@playwright/test';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';

function localDateKey(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

test('log a workout from today and keep it after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start workout/i }).click();
  await expect(page).toHaveURL(/\/session\//);
  await expect(page.locator('.session-title')).toContainText('Day 5');

  const firstExercise = page.locator('.session-exercise').first();
  await firstExercise.getByLabel('Weight for set 1').fill('20');
  await firstExercise.getByLabel('Reps for set 1').fill('10');
  await firstExercise.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.locator('.rest-dock')).toBeVisible();
  await page.screenshot({ path: 'e2e/artifacts/session-active.png', fullPage: true });
  await page.getByRole('button', { name: /Finish$/ }).click();
  await expect(page.locator('.sheet').getByRole('heading', { name: 'Finish this workout?' })).toBeVisible();
  await page.locator('.sheet').getByRole('button', { name: 'Finish & save' }).click();
  await expect(page.getByText('Work logged. Future you says thanks.')).toBeVisible();
  await page.screenshot({ path: 'e2e/artifacts/session-finish.png', fullPage: true });
  await expect(page).toHaveURL(/\/history\//);

  await page.reload();
  await expect(page.getByText('Work logged. Future you says thanks.')).toBeVisible();
  await page.getByRole('link', { name: 'Done' }).click();
  await expect(page.getByText('Recent training')).toBeVisible();
  await expect(page.locator('.recent-list')).toContainText('Day 5');
});

test('add food to the diary and persist it', async ({ page }) => {
  await page.goto('/food');
  await page.locator('.meal-card').first().getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByPlaceholder('Search foods…').fill('banana');
  await page.locator('.food-row').filter({ hasText: 'Banana' }).click();
  await page.getByRole('button', { name: /Add to breakfast/i }).click();
  await expect(page.locator('.meal-entry').filter({ hasText: 'Banana' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.meal-entry').filter({ hasText: 'Banana' })).toBeVisible();
});

test('copy the previous day food into today', async ({ page }) => {
  await page.goto('/food');
  await page.locator('.meal-card').first().getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByPlaceholder('Search foods…').fill('banana');
  await page.locator('.food-row').filter({ hasText: 'Banana' }).click();
  await page.getByRole('button', { name: /Add to breakfast/i }).click();
  await page.getByLabel('Next day').click();
  await page.getByRole('button', { name: /Copy previous day/i }).click();
  await expect(page.locator('.meal-entry').filter({ hasText: 'Banana' })).toBeVisible();
  await page.reload();
  await page.getByLabel('Next day').click();
  await expect(page.locator('.meal-entry').filter({ hasText: 'Banana' })).toBeVisible();
});

test('workout tools add warm-up sets and calculate plates', async ({ page }) => {
  await page.goto('/workouts');
  await page.locator('.train-action-card').filter({ hasText: 'Empty workout' }).click();
  await page.getByRole('button', { name: 'Add exercise' }).first().click();
  await page.getByPlaceholder('Search exercises, muscles, equipment').fill('bench');
  await page.locator('.exercise-row').filter({ hasText: 'Barbell Bench Press' }).first().click();

  const exercise = page.locator('.session-exercise').first();
  await exercise.getByLabel('Weight for set 1').fill('100');
  await exercise.getByLabel('Reps for set 1').fill('8');
  await exercise.getByRole('button', { name: /Options for Barbell Bench Press/ }).click();
  await page.getByRole('button', { name: 'Add warm-up sets' }).click();
  await expect(page.locator('.set-row[data-warmup="true"]')).toHaveCount(3);

  await exercise.getByRole('button', { name: /Options for Barbell Bench Press/ }).click();
  await page.getByRole('button', { name: 'Plate calculator' }).click();
  const sheet = page.locator('.sheet');
  await expect(sheet.getByRole('heading', { name: 'Plate calculator' })).toBeVisible();
  await expect(sheet.getByText('per side', { exact: true })).toBeVisible();
  await expect(sheet.locator('.plate-chip')).toContainText(['25', '15']);
  await page.screenshot({ path: 'e2e/artifacts/plate-calculator.png' });
});

test('save a daily check-in with sleep and mood', async ({ page }) => {
  await page.goto('/diary?checkin=1');
  await expect(page.locator('.sheet')).toContainText('Daily check-in');
  await page.getByLabel('Bodyweight', { exact: true }).fill('78.5');
  await page.getByLabel('Sleep', { exact: true }).fill('7.5');
  await page.getByLabel('Energy 4 of 5').click();
  await page.getByLabel('Good').click();
  await page.getByLabel('Notes').fill('Felt sharp after a full night of sleep.');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.locator('.list-item').filter({ hasText: '78.5 kg' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('78.5 kg').first()).toBeVisible();
});

test('create a personal goal', async ({ page }) => {
  await page.goto('/goals');
  await page.getByRole('button', { name: 'New goal' }).click();
  await page.getByRole('button', { name: 'Personal' }).click();
  await page.getByLabel('Title').fill('Complete a full month of training');
  await page.getByLabel('Target').fill('1');
  await page.getByRole('button', { name: 'Create goal' }).click();
  await expect(page.getByText('Complete a full month of training')).toBeVisible();
});

test('schedule a day by tapping on mobile', async ({ page }) => {
  await page.goto('/calendar');
  const future = localDateKey(3);
  await page.locator('.palette-day').first().click();
  await expect(page.getByText('Now tap a date on the calendar.')).toBeVisible();
  await page.locator(`[data-date="${future}"]`).click();
  await expect(page.locator('.sheet').getByText('Schedule this session')).toBeVisible();
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  await expect(page.locator('.repeat-row')).toHaveCount(6);
});

test('drag a programme day onto the calendar on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/calendar');
  const future = localDateKey(4);
  await page.locator('.palette-day').first().dragTo(page.locator(`[data-date="${future}"]`));
  await expect(page.locator('.sheet').getByText('Schedule this session')).toBeVisible();
  await page.getByRole('button', { name: '2 weeks' }).click();
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  await expect(page.locator('.repeat-row')).toHaveCount(6);
});

test('complete a workout with a progress photo', async ({ page }) => {
  await page.goto('/workouts');
  await page.locator('.train-action-card').filter({ hasText: 'Empty workout' }).click();
  await expect(page.getByText('Let’s add the first exercise')).toBeVisible();
  await page.getByRole('button', { name: 'Add exercise' }).first().click();
  await page.getByPlaceholder('Search exercises, muscles, equipment').fill('goblet');
  await page.locator('.exercise-row').filter({ hasText: 'Goblet Squat' }).click();
  await page.getByLabel('Weight for set 1').fill('24');
  await page.getByLabel('Reps for set 1').fill('12');
  await page.getByRole('button', { name: 'Complete set 1' }).click();

  await page.locator('.photo-slot input[type="file"]').first().setInputFiles({
    name: 'front.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  });
  await expect(page.locator('.photo-remove')).toHaveCount(1);
  await expect(page.locator('.photo-strip-card .badge')).toContainText('1/3');

  await page.getByRole('button', { name: /Finish$/ }).click();
  await page.locator('.sheet').getByRole('button', { name: 'Finish & save' }).click();
  await expect(page.locator('.photo-remove')).toHaveCount(1);

  await page.goto('/progress?tab=photos');
  await expect(page.locator('.gallery-item')).toHaveCount(1);
});

test('upload a profile photo and switch to light theme', async ({ page }) => {
  await page.goto('/profile');
  await page.locator('.profile-hero input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  });
  await expect(page.locator('.profile-hero .avatar img')).toBeVisible();
  await page.getByRole('button', { name: 'Save details' }).click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({ path: 'e2e/artifacts/profile-light.png', fullPage: true });
});

test('export a valid backup file', async ({ page }) => {
  await page.goto('/profile');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export backup/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^form-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const bundle = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(bundle.app).toBe('form');
  expect(bundle.state.profile.name).toBe('Alex Rivera');
});

test('load sample history and view a populated report', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: /Add sample history/i }).click();
  await page.locator('.sheet').getByRole('button', { name: 'Add sample history' }).click();
  await page.goto('/');
  await expect(page.locator('.recent-list')).toContainText('Day');
  await page.screenshot({ path: 'e2e/artifacts/home-populated.png', fullPage: true });
  await page.goto('/progress');
  await expect(page.getByText('0 workouts')).toHaveCount(0);
  await page.screenshot({ path: 'e2e/artifacts/progress-populated.png', fullPage: true });
  await page.getByRole('button', { name: 'Reports' }).click();
  await expect(page.getByText('Monthly report')).toBeVisible();
  await expect(page.getByText('Copy summary')).toBeVisible();
  await expect(page.getByText('What the data says')).toBeVisible();
  await page.screenshot({ path: 'e2e/artifacts/report-populated.png', fullPage: true });

  await page.goto('/profile');
  await page.getByRole('button', { name: /Remove \d+ sample sessions/ }).click();
  await page.locator('.sheet').getByRole('button', { name: 'Remove sample data' }).click();
  await page.goto('/history');
  await expect(page.getByText('No workouts logged yet')).toBeVisible();
});

test('re-imports an exported backup', async ({ page }) => {
  await page.goto('/profile');
  await page.getByLabel('Name').fill('Backup Person');
  await page.getByRole('button', { name: 'Save details' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export backup/i }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);

  await page.locator('input[type="file"][accept*="json"]').setInputFiles({
    name: 'form-backup.json',
    mimeType: 'application/json',
    buffer,
  });
  await expect(page.getByText('Import this backup?')).toBeVisible();
  await page.getByRole('button', { name: 'Replace with backup' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/profile');
  await expect(page.getByLabel('Name')).toHaveValue('Backup Person');
});

test('shows progression guidance from the previous session', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: /Add sample history/i }).click();
  await page.locator('.sheet').getByRole('button', { name: 'Add sample history' }).click();
  await page.goto('/');
  await page.getByRole('button', { name: /Start workout/i }).click();
  await expect(page.locator('.progression-hint').first()).toBeVisible();
  await expect(page.locator('.progression-hint').first()).toContainText(/progress|load|rep/i);
});

test('reject finishing an empty workout', async ({ page }) => {
  await page.goto('/workouts');
  await page.locator('.train-action-card').filter({ hasText: 'Empty workout' }).click();
  await page.getByRole('button', { name: /Finish$/ }).click();
  await expect(page.getByText('Complete at least one set before finishing.')).toBeVisible();
});

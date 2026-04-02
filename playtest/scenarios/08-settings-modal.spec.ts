import { test } from '@playwright/test';
import { navigateToGame, takeScreenshot } from '../helpers';

const SCENARIO = '08-settings-modal';

test('settings modal: open, toggle options, close', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await takeScreenshot(page, testInfo, SCENARIO, '1-game-table');

  // Click Settings button — use JS click to bypass any overlap issues on small viewports
  const settingsBtn = page.locator('button', { hasText: 'Settings' }).first();
  await settingsBtn.waitFor({ state: 'visible', timeout: 5000 });
  await settingsBtn.dispatchEvent('click');

  // Wait for modal to animate in
  await page.getByText('Show Hand Totals').waitFor({ state: 'visible', timeout: 10000 });
  await takeScreenshot(page, testInfo, SCENARIO, '2-settings-open');

  // Toggle "Show Hand Totals"
  await page.getByText('Show Hand Totals').click();
  await page.waitForTimeout(200);
  await takeScreenshot(page, testInfo, SCENARIO, '3-toggled-hand-totals');

  // Verify other settings visible
  await page.getByText('Number of Decks').waitFor({ state: 'visible' });
  await takeScreenshot(page, testInfo, SCENARIO, '4-settings-content');

  // Close settings via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await takeScreenshot(page, testInfo, SCENARIO, '5-settings-closed');
});

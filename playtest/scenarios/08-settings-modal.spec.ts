import { test } from '@playwright/test';
import { navigateToGame, takeScreenshot } from '../helpers';

const SCENARIO = '08-settings-modal';

test('settings modal: open, toggle options, close', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await takeScreenshot(page, testInfo, SCENARIO, '1-game-table');

  await page.getByText('Settings').click();
  await page.waitForTimeout(400);
  await takeScreenshot(page, testInfo, SCENARIO, '2-settings-open');

  await page.getByText('Show Hand Totals').click();
  await page.waitForTimeout(200);
  await takeScreenshot(page, testInfo, SCENARIO, '3-toggled-hand-totals');

  await page.getByText('Number of Decks').waitFor({ state: 'visible' });
  await takeScreenshot(page, testInfo, SCENARIO, '4-settings-scrolled');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await takeScreenshot(page, testInfo, SCENARIO, '5-settings-closed');
});

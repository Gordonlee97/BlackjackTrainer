import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '02-double-down';

test('double down: bet, deal, double, result', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');
  await takeScreenshot(page, testInfo, SCENARIO, '1-before-double');

  const doubleBtn = page.getByText('Double', { exact: true });
  const isDisabled = await doubleBtn.isDisabled();

  if (isDisabled) {
    await takeScreenshot(page, testInfo, SCENARIO, '2-double-unavailable');
    return;
  }

  await doubleBtn.click();
  await page.waitForTimeout(500);
  await takeScreenshot(page, testInfo, SCENARIO, '2-after-double');

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result');
});

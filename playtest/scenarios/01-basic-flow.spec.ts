import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '01-basic-flow';

test('basic game flow: bet, deal, hit, stand, result', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await takeScreenshot(page, testInfo, SCENARIO, '1-betting-phase');

  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');
  await takeScreenshot(page, testInfo, SCENARIO, '2-cards-dealt');

  await page.getByText('Hit', { exact: true }).click();
  await page.waitForTimeout(400);
  await takeScreenshot(page, testInfo, SCENARIO, '3-after-hit');

  await page.getByText('Stand', { exact: true }).click();
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '4-result');
});

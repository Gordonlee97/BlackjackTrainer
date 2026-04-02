import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, dismissStrategyModal } from '../helpers';

const SCENARIO = '02-double-down';

test('double down: bet, deal, double, result', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);

  // After dealing, either player_turn or natural (complete)
  await Promise.race([
    page.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    page.getByRole('button', { name: 'Next Hand' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(300);

  // Check if in player_turn
  const hitVisible = await page.getByRole('button', { name: 'Hit' }).isVisible().catch(() => false);
  if (!hitVisible) {
    await takeScreenshot(page, testInfo, SCENARIO, '1-natural-no-player-turn');
    return;
  }

  await takeScreenshot(page, testInfo, SCENARIO, '1-before-double');

  const doubleBtn = page.getByRole('button', { name: 'Double' });
  const isDisabled = await doubleBtn.isDisabled();

  if (isDisabled) {
    await takeScreenshot(page, testInfo, SCENARIO, '2-double-unavailable');
    // Fall back to Stand to complete the hand
    await page.getByRole('button', { name: 'Stand' }).click();
    await page.waitForTimeout(300);
    await dismissStrategyModal(page);
    await waitForPhase(page, 'complete');
    return;
  }

  await doubleBtn.click();
  await page.waitForTimeout(300);
  await dismissStrategyModal(page);
  await page.waitForTimeout(300);
  await takeScreenshot(page, testInfo, SCENARIO, '2-after-double');

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result');
});

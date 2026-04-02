import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, dismissStrategyModal } from '../helpers';

const SCENARIO = '01-basic-flow';

test('basic game flow: bet, deal, hit, stand, result', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await takeScreenshot(page, testInfo, SCENARIO, '1-betting-phase');

  await placeBetAndDeal(page);

  // After dealing, either we're in player_turn or went straight to complete (natural blackjack)
  await Promise.race([
    page.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    page.getByRole('button', { name: 'Next Hand' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(300);
  await takeScreenshot(page, testInfo, SCENARIO, '2-cards-dealt');

  // Check if still in player_turn (not a natural)
  const hitBtn = page.getByRole('button', { name: 'Hit' });
  const inPlayerTurn = await hitBtn.isVisible().catch(() => false);

  if (inPlayerTurn) {
    await hitBtn.click();
    await page.waitForTimeout(400);
    await dismissStrategyModal(page);
    await takeScreenshot(page, testInfo, SCENARIO, '3-after-hit');

    // Try to stand — may need to dismiss modal again if wrong move
    try {
      await page.getByRole('button', { name: 'Stand' }).waitFor({ state: 'visible', timeout: 3000 });
      await page.getByRole('button', { name: 'Stand' }).click();
      await page.waitForTimeout(300);
      await dismissStrategyModal(page);
    } catch { /* already complete */ }
  } else {
    await takeScreenshot(page, testInfo, SCENARIO, '3-natural-blackjack');
  }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '4-result');
});

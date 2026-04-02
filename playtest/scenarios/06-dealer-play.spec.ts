import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, takeSequentialScreenshots } from '../helpers';

const SCENARIO = '06-dealer-play';

test('dealer play: stand immediately, watch dealer draw', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);

  // After dealing, either player_turn or natural (complete)
  await Promise.race([
    page.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    page.getByRole('button', { name: 'Next Hand' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(300);

  const inPlayerTurn = await page.getByRole('button', { name: 'Hit' }).isVisible().catch(() => false);
  if (!inPlayerTurn) {
    await takeScreenshot(page, testInfo, SCENARIO, '1-natural-blackjack');
    await takeScreenshot(page, testInfo, SCENARIO, '3-result');
    return;
  }

  await takeScreenshot(page, testInfo, SCENARIO, '1-before-stand');

  await page.getByRole('button', { name: 'Stand' }).click();
  await page.waitForTimeout(200);

  // Handle strategy modal if stand was wrong move
  try {
    const tryAgain = page.getByRole('button', { name: 'Try Again' });
    await tryAgain.waitFor({ state: 'visible', timeout: 1000 });
    await tryAgain.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('s');
    await page.waitForTimeout(200);
    try {
      const playAnyways = page.getByRole('button', { name: 'Play Anyways' });
      await playAnyways.waitFor({ state: 'visible', timeout: 1000 });
      await playAnyways.click();
    } catch { /* no modal */ }
  } catch { /* no modal */ }

  await takeSequentialScreenshots(page, testInfo, SCENARIO, '2-dealer-playing', 4, 500);
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result');
});

import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, takeSequentialScreenshots } from '../helpers';

const SCENARIO = '06-dealer-play';

test('dealer play: stand immediately, watch dealer draw', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');
  await takeScreenshot(page, testInfo, SCENARIO, '1-before-stand');

  await page.getByText('Stand', { exact: true }).click();
  await page.waitForTimeout(200);

  try {
    const tryAgain = page.getByText('Try Again');
    await tryAgain.waitFor({ state: 'visible', timeout: 1000 });
    await tryAgain.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('s');
    await page.waitForTimeout(200);
    try {
      const playAnyways = page.getByText('Play Anyways');
      await playAnyways.waitFor({ state: 'visible', timeout: 1000 });
      await playAnyways.click();
    } catch { /* no modal */ }
  } catch { /* no modal */ }

  await takeSequentialScreenshots(page, testInfo, SCENARIO, '2-dealer-playing', 4, 500);
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result');
});

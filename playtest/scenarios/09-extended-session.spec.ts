import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '09-extended-session';

test('extended session: play 10+ hands, check stats and balance', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await takeScreenshot(page, testInfo, SCENARIO, '1-initial');

  for (let hand = 1; hand <= 12; hand++) {
    await placeBetAndDeal(page);

    await Promise.race([
      page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      page.getByText('Next Hand', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(300);

    try {
      await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 1000 });

      if (hand % 2 === 0) {
        await page.getByText('Hit', { exact: true }).click();
        await page.waitForTimeout(400);
        try {
          const tryAgain = page.getByText('Try Again');
          await tryAgain.waitFor({ state: 'visible', timeout: 800 });
          await tryAgain.click();
          await page.waitForTimeout(200);
        } catch { /* no modal */ }
      }

      try {
        await page.getByText('Stand', { exact: true }).waitFor({ state: 'visible', timeout: 1000 });
        await page.getByText('Stand', { exact: true }).click();
        await page.waitForTimeout(200);
        try {
          const tryAgain = page.getByText('Try Again');
          await tryAgain.waitFor({ state: 'visible', timeout: 800 });
          await tryAgain.click();
          await page.waitForTimeout(200);
          await page.getByText('Stand', { exact: true }).click();
          await page.waitForTimeout(200);
          try {
            const playAnyways = page.getByText('Play Anyways');
            await playAnyways.waitFor({ state: 'visible', timeout: 800 });
            await playAnyways.click();
          } catch { /* no modal */ }
        } catch { /* no modal */ }
      } catch { /* past player_turn */ }
    } catch { /* already complete */ }

    await waitForPhase(page, 'complete');

    if (hand === 5 || hand === 10 || hand === 12) {
      await takeScreenshot(page, testInfo, SCENARIO, `2-hand-${hand}-result`);
    }

    if (hand < 12) {
      await page.getByText('Next Hand', { exact: true }).click();
      await waitForPhase(page, 'betting');
    }
  }

  await takeScreenshot(page, testInfo, SCENARIO, '3-final-stats');
});

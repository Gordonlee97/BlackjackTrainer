import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, dismissStrategyModal } from '../helpers';

const SCENARIO = '09-extended-session';

test('extended session: play 10+ hands, check stats and balance', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await takeScreenshot(page, testInfo, SCENARIO, '1-initial');

  for (let hand = 1; hand <= 12; hand++) {
    // Use $5 chip to conserve balance over 12 hands
    await placeBetAndDeal(page, '$5');

    await Promise.race([
      page.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      page.getByRole('button', { name: 'Next Hand' }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(300);

    try {
      await page.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 1000 });

      if (hand % 2 === 0) {
        await page.getByRole('button', { name: 'Hit' }).click();
        await page.waitForTimeout(400);
        // Dismiss modal if wrong move blocked (in block mode: Try Again; in execute mode: Got It)
        try {
          const tryAgain = page.getByRole('button', { name: 'Try Again' });
          await tryAgain.waitFor({ state: 'visible', timeout: 800 });
          await tryAgain.click();
          await page.waitForTimeout(200);
        } catch {
          try {
            const gotIt = page.getByRole('button', { name: 'Got It' });
            await gotIt.waitFor({ state: 'visible', timeout: 400 });
            await gotIt.click();
            await page.waitForTimeout(200);
          } catch { /* no modal */ }
        }
      }

      try {
        await page.getByRole('button', { name: 'Stand' }).waitFor({ state: 'visible', timeout: 3000 });
        await page.getByRole('button', { name: 'Stand' }).click();
        await page.waitForTimeout(300);
        await dismissStrategyModal(page);
      } catch { /* past player_turn */ }
    } catch { /* already complete (natural) */ }

    await waitForPhase(page, 'complete');

    if (hand === 5 || hand === 10 || hand === 12) {
      await takeScreenshot(page, testInfo, SCENARIO, `2-hand-${hand}-result`);
    }

    if (hand < 12) {
      await page.getByRole('button', { name: 'Next Hand' }).click();
      // Wait for sweep animation (600ms) before looking for betting phase
      await page.waitForTimeout(800);
      await waitForPhase(page, 'betting');
    }
  }

  await takeScreenshot(page, testInfo, SCENARIO, '3-final-stats');
});

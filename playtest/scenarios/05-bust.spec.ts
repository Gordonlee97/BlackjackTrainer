import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '05-bust';

test('bust: hit repeatedly until bust', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);

  // After dealing, either player_turn or natural (complete)
  await Promise.race([
    page.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    page.getByRole('button', { name: 'Next Hand' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(300);

  let hitCount = 0;

  while (hitCount < 10) {
    const hitBtn = page.getByRole('button', { name: 'Hit' });
    try {
      await hitBtn.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      break;
    }

    const isDisabled = await hitBtn.isDisabled();
    if (isDisabled) {
      // Strategy modal is likely blocking — try to dismiss it
      try {
        const tryAgain = page.getByRole('button', { name: 'Try Again' });
        await tryAgain.waitFor({ state: 'visible', timeout: 1000 });
        await tryAgain.click();
        await page.waitForTimeout(300);
      } catch {
        try {
          const playAnyways = page.getByRole('button', { name: 'Play Anyways' });
          await playAnyways.waitFor({ state: 'visible', timeout: 500 });
          await playAnyways.click();
          await page.waitForTimeout(300);
        } catch {
          try {
            const gotIt = page.getByRole('button', { name: 'Got It' });
            await gotIt.waitFor({ state: 'visible', timeout: 500 });
            await gotIt.click();
            await page.waitForTimeout(300);
          } catch {
            break;
          }
        }
      }
      continue;
    }

    await hitBtn.click();
    hitCount++;
    await page.waitForTimeout(400);

    // Dismiss any strategy modal that appeared after hitting
    try {
      const playAnyways = page.getByRole('button', { name: 'Play Anyways' });
      await playAnyways.waitFor({ state: 'visible', timeout: 600 });
      await playAnyways.click();
      await page.waitForTimeout(300);
    } catch {
      try {
        const gotIt = page.getByRole('button', { name: 'Got It' });
        await gotIt.waitFor({ state: 'visible', timeout: 300 });
        await gotIt.click();
        await page.waitForTimeout(300);
      } catch { /* no modal */ }
    }

    await takeScreenshot(page, testInfo, SCENARIO, `${hitCount}-after-hit-${hitCount}`);
  }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, `${hitCount + 1}-result`);
});

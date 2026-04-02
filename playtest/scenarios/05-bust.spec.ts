import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '05-bust';

test('bust: hit repeatedly until bust', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');

  let hitCount = 0;

  while (hitCount < 10) {
    const hitBtn = page.getByText('Hit', { exact: true });
    try {
      await hitBtn.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      break;
    }

    const isDisabled = await hitBtn.isDisabled();
    if (isDisabled) {
      try {
        const tryAgain = page.getByText('Try Again');
        await tryAgain.waitFor({ state: 'visible', timeout: 1000 });
        await tryAgain.click();
        await page.waitForTimeout(300);
      } catch {
        try {
          const playAnyways = page.getByText('Play Anyways');
          await playAnyways.waitFor({ state: 'visible', timeout: 500 });
          await playAnyways.click();
          await page.waitForTimeout(300);
        } catch {
          try {
            const gotIt = page.getByText('Got It');
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
    await takeScreenshot(page, testInfo, SCENARIO, `${hitCount}-after-hit-${hitCount}`);
  }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, `${hitCount + 1}-result`);
});

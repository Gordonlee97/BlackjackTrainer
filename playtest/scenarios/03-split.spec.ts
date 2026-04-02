import { test } from '@playwright/test';
import { navigateToGame, dealUntilCondition, waitForPhase, takeScreenshot, takeSequentialScreenshots, dismissStrategyModal } from '../helpers';

const SCENARIO = '03-split';

test('split: deal until pair, split, play both hands', async ({ page }, testInfo) => {
  await navigateToGame(page);

  const found = await dealUntilCondition(page, async (p) => {
    try {
      await p.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 2000 });
      const splitBtn = p.getByText('Split', { exact: true });
      return !(await splitBtn.isDisabled());
    } catch {
      return false;
    }
  });

  if (!found) {
    await takeScreenshot(page, testInfo, SCENARIO, '1-no-pair-found');
    return;
  }

  await takeScreenshot(page, testInfo, SCENARIO, '1-pair-before-split');

  // Split — may trigger strategy modal if split isn't correct
  await page.getByText('Split', { exact: true }).click();
  await page.waitForTimeout(300);
  await dismissStrategyModal(page);

  await takeSequentialScreenshots(page, testInfo, SCENARIO, '2-split-animation', 4, 300);
  await page.waitForTimeout(2000);

  // Play each split hand by standing, dismissing any modals
  for (let hand = 0; hand < 2; hand++) {
    try {
      await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
      await takeScreenshot(page, testInfo, SCENARIO, `${3 + hand}-hand-${hand + 1}`);
      await page.getByText('Stand', { exact: true }).click();
      await page.waitForTimeout(500);
      await dismissStrategyModal(page);
      await page.waitForTimeout(500);
    } catch {
      // Hand auto-completed (e.g., split aces with no hit allowed)
    }
  }

  // Wait for completion — use a loop in case we're still in dealer_turn
  for (let i = 0; i < 30; i++) {
    const done = await page.getByText('Next Hand', { exact: true }).isVisible().catch(() => false);
    if (done) break;
    await dismissStrategyModal(page);
    await page.waitForTimeout(500);
  }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '5-result');
});

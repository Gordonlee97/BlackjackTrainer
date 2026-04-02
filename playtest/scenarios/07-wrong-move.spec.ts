import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, dismissStrategyModal } from '../helpers';

const SCENARIO = '07-wrong-move';

test('wrong move: trigger strategy modal with bad play', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);

  // Wait for player turn or complete (natural)
  await Promise.race([
    page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    page.getByText('Next Hand', { exact: true }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(300);

  const inPlayerTurn = await page.getByText('Hit', { exact: true }).isVisible().catch(() => false);
  if (!inPlayerTurn) {
    // Got a natural — just screenshot and return
    await takeScreenshot(page, testInfo, SCENARIO, '1-natural-skip');
    return;
  }

  await takeScreenshot(page, testInfo, SCENARIO, '1-player-turn');

  // Click Stand — often the wrong move on low totals, which triggers the strategy modal
  await page.getByText('Stand', { exact: true }).click();
  await page.waitForTimeout(500);

  // Check if strategy modal appeared
  try {
    const modalTitle = page.getByText('Not Quite Right');
    await modalTitle.waitFor({ state: 'visible', timeout: 3000 });
    await takeScreenshot(page, testInfo, SCENARIO, '2-strategy-modal');

    // Try Play Anyways to dismiss
    try {
      const playAnyways = page.getByText('Play Anyways');
      await playAnyways.waitFor({ state: 'visible', timeout: 1000 });
      await takeScreenshot(page, testInfo, SCENARIO, '3-play-anyways-visible');
      await playAnyways.click();
      await page.waitForTimeout(300);
    } catch {
      // Block mode — click Try Again
      const tryAgain = page.getByText('Try Again');
      await tryAgain.click();
      await page.waitForTimeout(300);
    }
  } catch {
    // No modal — our "wrong" move was actually correct
    await takeScreenshot(page, testInfo, SCENARIO, '2-move-was-correct');
  }

  // Finish the hand — keep trying to stand and dismiss modals
  for (let i = 0; i < 10; i++) {
    const nextHandVisible = await page.getByText('Next Hand', { exact: true }).isVisible().catch(() => false);
    if (nextHandVisible) break;

    // Dismiss any modal
    await dismissStrategyModal(page);

    // Try to stand if still in player turn
    const hitVisible = await page.getByText('Hit', { exact: true }).isVisible().catch(() => false);
    if (hitVisible) {
      const hitDisabled = await page.getByText('Hit', { exact: true }).isDisabled().catch(() => true);
      if (!hitDisabled) {
        await page.getByText('Stand', { exact: true }).click().catch(() => {});
        await page.waitForTimeout(500);
        await dismissStrategyModal(page);
        continue;
      }
    }

    await page.waitForTimeout(500);
  }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '4-result');
});

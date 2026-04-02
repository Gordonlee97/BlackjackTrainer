import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '07-wrong-move';

test('wrong move: trigger strategy modal with bad play', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');
  await takeScreenshot(page, testInfo, SCENARIO, '1-player-turn');

  const surrenderBtn = page.getByText('Surrender', { exact: true });
  const standBtn = page.getByText('Stand', { exact: true });

  let clicked = false;

  if (!(await surrenderBtn.isDisabled())) {
    await surrenderBtn.click();
    clicked = true;
  }

  if (!clicked) {
    await standBtn.click();
  }

  await page.waitForTimeout(500);

  try {
    const modalTitle = page.getByText('Not Quite Right');
    await modalTitle.waitFor({ state: 'visible', timeout: 3000 });
    await takeScreenshot(page, testInfo, SCENARIO, '2-strategy-modal');

    const playAnyways = page.getByText('Play Anyways');
    try {
      await playAnyways.waitFor({ state: 'visible', timeout: 1000 });
      await takeScreenshot(page, testInfo, SCENARIO, '3-play-anyways-visible');
      await playAnyways.click();
    } catch {
      const tryAgain = page.getByText('Try Again');
      await tryAgain.click();
    }
  } catch {
    await takeScreenshot(page, testInfo, SCENARIO, '2-move-was-correct');
  }

  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 2000 });
    await page.getByText('Stand', { exact: true }).click();
    await page.waitForTimeout(300);
    try {
      const tryAgain = page.getByText('Try Again');
      await tryAgain.waitFor({ state: 'visible', timeout: 1000 });
      await tryAgain.click();
      await page.waitForTimeout(200);
      await page.getByText('Stand', { exact: true }).click();
      try {
        const playAnyways = page.getByText('Play Anyways');
        await playAnyways.waitFor({ state: 'visible', timeout: 1000 });
        await playAnyways.click();
      } catch { /* no modal */ }
    } catch { /* no modal */ }
  } catch { /* past player_turn */ }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '4-result');
});

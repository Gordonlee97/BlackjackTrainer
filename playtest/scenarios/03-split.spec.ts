import { test } from '@playwright/test';
import { navigateToGame, dealUntilCondition, waitForPhase, takeScreenshot, takeSequentialScreenshots } from '../helpers';

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
  await page.getByText('Split', { exact: true }).click();
  await takeSequentialScreenshots(page, testInfo, SCENARIO, '2-split-animation', 4, 300);
  await page.waitForTimeout(2000);

  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
    await takeScreenshot(page, testInfo, SCENARIO, '3-first-hand');
    await page.getByText('Stand', { exact: true }).click();
    await page.waitForTimeout(500);
  } catch { /* auto-completed */ }

  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
    await takeScreenshot(page, testInfo, SCENARIO, '4-second-hand');
    await page.getByText('Stand', { exact: true }).click();
  } catch { /* auto-completed */ }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '5-result');
});

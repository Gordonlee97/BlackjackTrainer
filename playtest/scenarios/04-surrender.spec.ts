import { test } from '@playwright/test';
import { placeBetAndDeal, waitForPhase, takeScreenshot, dealUntilCondition, dismissStrategyModal } from '../helpers';

const SCENARIO = '04-surrender';

test('surrender: enable rule, deal, surrender', async ({ page }, testInfo) => {
  await page.goto('/');
  // Clear persisted state so we start fresh
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      localStorage.removeItem(key);
    }
  });
  await page.reload();
  await page.getByText('Surrender Allowed').click();
  await page.waitForTimeout(200);
  await takeScreenshot(page, testInfo, SCENARIO, '1-setup-surrender-enabled');

  await page.getByText('Start Training').click();
  await page.getByRole('button', { name: '$25', exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  // Wait for Framer Motion spring animation to fully settle before interacting
  await page.waitForTimeout(1000);

  const found = await dealUntilCondition(page, async (p) => {
    try {
      await p.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 2000 });
      const surrenderBtn = p.getByRole('button', { name: 'Surrender' });
      return !(await surrenderBtn.isDisabled());
    } catch {
      return false;
    }
  });

  if (!found) {
    await takeScreenshot(page, testInfo, SCENARIO, '2-surrender-unavailable');
    return;
  }

  await takeScreenshot(page, testInfo, SCENARIO, '2-before-surrender');
  await page.getByRole('button', { name: 'Surrender' }).click();
  await page.waitForTimeout(300);
  await dismissStrategyModal(page);
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result-after-surrender');
});

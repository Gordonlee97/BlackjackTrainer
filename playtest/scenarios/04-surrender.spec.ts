import { test } from '@playwright/test';
import { placeBetAndDeal, waitForPhase, takeScreenshot, dealUntilCondition } from '../helpers';

const SCENARIO = '04-surrender';

test('surrender: enable rule, deal, surrender', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByText('Surrender Allowed').click();
  await page.waitForTimeout(200);
  await takeScreenshot(page, testInfo, SCENARIO, '1-setup-surrender-enabled');

  await page.getByText('Start Training').click();
  await page.getByText('$25').waitFor({ state: 'visible', timeout: 5000 });

  const found = await dealUntilCondition(page, async (p) => {
    try {
      await p.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 2000 });
      const surrenderBtn = p.getByText('Surrender', { exact: true });
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
  await page.getByText('Surrender', { exact: true }).click();
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result-after-surrender');
});

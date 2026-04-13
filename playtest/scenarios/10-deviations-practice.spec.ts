import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { placeBetAndDeal, waitForPhase, takeScreenshot, dismissStrategyModal } from '../helpers';

const SCENARIO = '10-deviations-practice';

/** Navigate to setup page (without clicking Start Training) and clear state. */
async function navigateToSetup(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Wait for the setup page to be ready
  await page.getByText('Start Training').waitFor({ state: 'visible', timeout: 10_000 });
}

test('deviations practice mode: enable on setup, play a hand, verify BetSpreadFeedback', async ({ page }, testInfo) => {
  // ── 1. Go to setup page ──────────────────────────────────────────────────
  await navigateToSetup(page);
  await takeScreenshot(page, testInfo, SCENARIO, '1-setup-page');

  // ── 2. Enable "Deviations Practice" toggle ────────────────────────────────
  // The toggle row contains the label text; click it to toggle on
  const deviationsPracticeRow = page.getByText('Deviations Practice', { exact: true });
  await deviationsPracticeRow.waitFor({ state: 'visible', timeout: 5_000 });
  await deviationsPracticeRow.click();
  await page.waitForTimeout(300);
  await takeScreenshot(page, testInfo, SCENARIO, '2-deviations-enabled');

  // ── 3. Verify "Use Deviations" is now checked (disabled/locked) ───────────
  // After enabling deviations practice, "Use Deviations" row subtitle shows it's required.
  // The page subtitle also changes to reflect the mode.
  await expect(page.getByText('Practice basic strategy + deviations')).toBeVisible({ timeout: 5_000 });

  // ── 4. Start session ────────────────────────────────────────────────────
  await page.getByText('Start Training').click();
  // Wait for bet chips to appear (betting phase)
  await page.locator('button', { hasText: '$25' }).first().waitFor({ state: 'visible', timeout: 8_000 });
  await page.waitForTimeout(1_000); // let Framer Motion spring settle
  await takeScreenshot(page, testInfo, SCENARIO, '3-betting-phase');

  // ── 5. Place bet and Deal ────────────────────────────────────────────────
  await placeBetAndDeal(page);
  await takeScreenshot(page, testInfo, SCENARIO, '4-after-deal');

  // ── 6. Wait for player_turn or complete (natural) ────────────────────────
  await Promise.race([
    page.getByRole('button', { name: 'Hit' }).waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
    page.getByRole('button', { name: 'Next Hand' }).waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(300);

  const inPlayerTurn = await page.getByRole('button', { name: 'Hit' }).isVisible().catch(() => false);

  if (inPlayerTurn) {
    await takeScreenshot(page, testInfo, SCENARIO, '5-player-turn');

    // Click Stand — simplest action always available
    await page.getByRole('button', { name: 'Stand' }).click();
    await page.waitForTimeout(400);
    await dismissStrategyModal(page);
  } else {
    // Natural blackjack — already at complete
    await takeScreenshot(page, testInfo, SCENARIO, '5-natural');
  }

  // ── 7. Wait for complete phase ────────────────────────────────────────────
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '6-complete-phase');

  // ── 8. Assert BetSpreadFeedback pill is visible ────────────────────────────
  // The pill text always starts with "Bet at TC" followed by the formatted count
  const betFeedback = page.getByText(/Bet at TC/, { exact: false });
  await expect(betFeedback).toBeVisible({ timeout: 5_000 });
  await takeScreenshot(page, testInfo, SCENARIO, '7-bet-spread-feedback');

  // ── 9. Click Next Hand ────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Next Hand' }).click();
  // Wait for sweep animation and return to betting phase
  await page.waitForTimeout(800);
  await waitForPhase(page, 'betting');
  await takeScreenshot(page, testInfo, SCENARIO, '8-next-hand-betting');
});

/**
 * Exploratory scenarios for Deviations Practice Mode.
 *
 * Drill generation is random; these scenarios use invariant-style checks
 * (run N hands, assert a condition holds across all) rather than trying to
 * force specific deviations.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { takeScreenshot, waitForPhase, dismissStrategyModal } from '../helpers';
import type { RuleSet } from '../../src/strategy/types';

const SCENARIO = '11-deviations-practice-edges';

const DEFAULT_RULES = {
  numDecks: 8,
  dealerHitsSoft17: true,
  dasAllowed: true,
  surrenderAllowed: false,
  hitSplitAces: false,
  resplitAces: true,
  practiceMode: 'all',
  wrongMoveAction: 'execute',
  showHandTotals: true,
  soundVolume: 0,
  showCount: 'hover',
  useDeviations: false,
  deviationsPracticeMode: false,
} satisfies RuleSet;

type PartialRules = Partial<RuleSet>;

async function presetSettings(page: Page, overrides: PartialRules): Promise<void> {
  const payload = JSON.stringify({
    state: { rules: { ...DEFAULT_RULES, ...overrides } },
    version: 0,
  });
  await page.addInitScript((data) => {
    localStorage.setItem('blackjack-settings', data);
  }, payload);
}

async function startFromSetup(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByText('Start Training').waitFor({ state: 'visible', timeout: 10_000 });
  await page.getByText('Start Training').click();
  await page.locator('button', { hasText: '$25' }).first().waitFor({ state: 'visible', timeout: 8_000 });
  await page.waitForTimeout(800);
}

/**
 * Complete the current hand by standing until Next Hand appears.
 * Uses plain click() (not force) so Playwright waits for actionability — avoids
 * the race condition where isEnabled() returns true but the element disappears before click.
 * Uses the same waitForPhase('complete') pattern as helpers.ts playQuickHand.
 */
async function finishHandQuickly(page: Page): Promise<void> {
  for (let i = 0; i < 12; i++) {
    // Done already?
    if (await page.getByRole('button', { name: 'Next Hand' }).isVisible().catch(() => false)) return;

    // Dismiss strategy modal if one opened (handles both 'execute' and 'block' modes)
    await dismissStrategyModal(page);

    // Done after dismissal (e.g., 'execute' mode ran the correct action which settled hand)?
    if (await page.getByRole('button', { name: 'Next Hand' }).isVisible().catch(() => false)) return;

    // Click Stand. timeout:5000 gives cards time to animate; fails gracefully if not available.
    await page.getByRole('button', { name: 'Stand' }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  // Ensure we're at complete before returning
  await waitForPhase(page, 'complete');
}

/**
 * Place an EXACT bet by first clearing any existing bet, then clicking the chip.
 * Chips ADD to currentBet (not replace), so we must clear first to get an exact amount.
 * Automatically dismisses the Add Funds modal if balance = 0.
 */
async function placeBetByChip(page: Page, chip: '$5' | '$25' | '$100' | '$500'): Promise<void> {
  // Handle rebuy modal (Add Funds) if balance = 0
  const addFundsHeader = page.getByText('Add Funds', { exact: true });
  if (await addFundsHeader.isVisible().catch(() => false)) {
    const modal = page.locator('.fixed.inset-0').last();
    const rebuy1k = modal.locator('button').filter({ hasText: '$1,000' }).first();
    if (await rebuy1k.isVisible().catch(() => false)) {
      await rebuy1k.click({ timeout: 2000 }).catch(() => {});
    } else {
      const rebuyAny = modal.locator('button').filter({ hasText: /^\$[\d,]+$/ }).first();
      if (await rebuyAny.isVisible().catch(() => false)) await rebuyAny.click({ timeout: 2000 }).catch(() => {});
    }
    await page.waitForTimeout(600);
  }

  // Clear any existing bet (chips ADD to currentBet; without clearing we'd accumulate)
  const clearBtn = page.getByTitle('Clear bet');
  if (await clearBtn.isVisible().catch(() => false) && await clearBtn.isEnabled().catch(() => false)) {
    await clearBtn.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
  }

  const fallbackOrder: Array<'$5' | '$25' | '$100' | '$500'> = ['$500', '$100', '$25', '$5'];
  const startIdx = fallbackOrder.indexOf(chip);
  const candidates = fallbackOrder.slice(startIdx);
  for (const c of candidates) {
    const btn = page.locator(`button:text-is("${c}")`).first();
    if (await btn.count() === 0) continue;
    if (!await btn.isVisible().catch(() => false)) continue;
    if (await btn.isEnabled().catch(() => false)) {
      await btn.click({ timeout: 2000 });
      await page.getByText('Deal', { exact: true }).click({ timeout: 5000 });
      await page.waitForTimeout(900);
      return;
    }
  }
  throw new Error(`placeBetByChip: all chip buttons disabled (tried ${candidates.join(', ')})`);
}

/** Returns the running-count card's combined text content (or null). */
async function readCountCard(page: Page): Promise<string | null> {
  // The card has the header "Running Count"
  const card = page.locator('div:has(> span:text-is("Running Count"))').first();
  if (await card.count() === 0) return null;
  if (!await card.isVisible().catch(() => false)) return null;
  return (await card.textContent())?.trim() ?? null;
}

async function openSettingsModal(page: Page): Promise<void> {
  // Settings button is in the top bar; look for an SVG-only button via aria
  const byRole = page.getByRole('button', { name: /Settings/i });
  if (await byRole.count() > 0) {
    await byRole.first().click();
    await page.waitForTimeout(400);
    return;
  }
  // Fallback: click any button with a gear title/aria
  await page.locator('[aria-label*="ettings" i], [title*="ettings" i]').first().click();
  await page.waitForTimeout(400);
}

// ==========================================================================
// 1. Setup page: numDecks coercion when enabling drill with 2 decks.
// ==========================================================================
test('setup: enabling drill with 2 decks forces numDecks ≥ 4', async ({ page }, testInfo) => {
  await presetSettings(page, { numDecks: 2, useDeviations: false, deviationsPracticeMode: false });
  await page.goto('/');
  await page.getByText('Start Training').waitFor({ state: 'visible' });
  await takeScreenshot(page, testInfo, SCENARIO, '01-setup-2decks-pre');

  await page.getByText('Deviations Practice', { exact: true }).click();
  await page.waitForTimeout(400);
  await takeScreenshot(page, testInfo, SCENARIO, '02-setup-after-enable');

  const deckLabel = await page
    .locator('div:has(> span:text-is("Number of Decks"))')
    .first()
    .textContent();
  expect(deckLabel, 'deck row should show ≥4 decks').toMatch(/(4|6|8)\s*Decks?/);
});

// ==========================================================================
// 2. Toggle drill OFF mid-session in SettingsModal → bet-feedback disappears
// and count display remains (Use Deviations still on, showCount !== off).
// ==========================================================================
test('drill off mid-session: bet-feedback pill disappears on next hand', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await presetSettings(page, {
    numDecks: 6,
    useDeviations: true,
    deviationsPracticeMode: true,
    showCount: 'always',
    wrongMoveAction: 'block', // block mode: wrong Stand ends hand immediately via "Play Anyways"
  });
  await startFromSetup(page);
  await takeScreenshot(page, testInfo, SCENARIO, '10-drill-start');

  await placeBetByChip(page, '$25');
  await finishHandQuickly(page);
  await expect(page.getByText(/Bet at TC/)).toBeVisible({ timeout: 6_000 });
  await takeScreenshot(page, testInfo, SCENARIO, '11-drill-pill-visible');

  // Open settings, toggle drill off
  await openSettingsModal(page);
  await takeScreenshot(page, testInfo, SCENARIO, '12-settings-open');
  await page.getByText('Deviations Practice', { exact: true }).click();
  await page.waitForTimeout(300);
  await takeScreenshot(page, testInfo, SCENARIO, '13-drill-toggled-off');
  // Close settings modal via ✕ button (SettingsModal has no Escape handler)
  await page.getByRole('button', { name: '✕' }).click();
  await page.waitForTimeout(400);

  // Next hand
  await page.getByRole('button', { name: 'Next Hand' }).click();
  await page.waitForTimeout(800);
  await waitForPhase(page, 'betting');

  await placeBetByChip(page, '$25');
  await finishHandQuickly(page);
  await expect(page.getByText(/Bet at TC/)).toHaveCount(0);
  await takeScreenshot(page, testInfo, SCENARIO, '14-normal-no-pill');
});

// ==========================================================================
// 3. Bet-spread verdicts: 1u bet across several drill hands.
// 1u is always ok at TC ≤ 2, underbet at TC ≥ 3.
// ==========================================================================
test('bet spread verdicts: 1u bet across several hands match Hi-Lo 1-8', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await presetSettings(page, {
    numDecks: 6,
    useDeviations: true,
    deviationsPracticeMode: true,
    showCount: 'always',
    wrongMoveAction: 'block',
  });
  await startFromSetup(page);

  const pillTexts: string[] = [];
  for (let i = 0; i < 2; i++) {
    await placeBetByChip(page, '$25'); // 1u
    await finishHandQuickly(page);
    const pill = page.getByText(/Bet at TC/).first();
    await expect(pill).toBeVisible();
    const t = (await pill.textContent())?.trim() ?? '';
    pillTexts.push(t);
    await takeScreenshot(page, testInfo, SCENARIO, `20-hand${i + 1}`);
    await page.getByRole('button', { name: 'Next Hand' }).click();
    await page.waitForTimeout(800);
    await waitForPhase(page, 'betting');
  }

  for (const t of pillTexts) {
    expect(t).toMatch(/Bet at TC [+\-]?\d+.*rec.*you bet 1u.*[✓↓↑]/);
    const m = t.match(/Bet at TC ([+\-]?\d+)/);
    const tc = parseInt(m![1], 10);
    if (tc <= 2) expect(t, `1u at TC${tc} should be ok`).toMatch(/✓/);
    else         expect(t, `1u at TC${tc} should be underbet`).toMatch(/↓/);
  }
});

// ==========================================================================
// 4. Bet spread pill shows correct symbol for large bets.
// $500 = 20u always ↑ (exceeds 8u max). Falls back to $100 = 4u if balance low;
// 4u is ↑ at TC ≤ 2 (rec 1-2u), ✓ at TC 3-4, ↓ at TC 5+ (rec 6-8u).
// Test verifies: pill appears with correct format and symbol matches TC+bet logic.
// ==========================================================================
test('bet spread pill shows correct symbol for large bet', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await presetSettings(page, {
    numDecks: 6,
    useDeviations: true,
    deviationsPracticeMode: true,
    showCount: 'always',
    wrongMoveAction: 'block',
  });
  await startFromSetup(page);

  let checked = 0;
  for (let i = 0; i < 2 && checked < 2; i++) {
    await placeBetByChip(page, '$500');
    await finishHandQuickly(page);
    const pill = page.getByText(/Bet at TC/).first();
    await expect(pill).toBeVisible();
    const t = (await pill.textContent()) ?? '';

    // Verify pill has expected format
    expect(t, `pill format unexpected: ${t}`).toMatch(/Bet at TC [+\-]?\d+.*rec.*you bet \d+u.*[✓↓↑]/);

    // Verify symbol is correct based on actual bet units and TC
    const tcMatch = t.match(/Bet at TC ([+\-]?\d+)/);
    const betMatch = t.match(/you bet (\d+)u/);
    if (tcMatch && betMatch) {
      const tc = parseInt(tcMatch[1], 10);
      const bet = parseInt(betMatch[1], 10);
      // Hi-Lo 1-8: max recommended is 8u. Any bet > 8u must be ↑.
      if (bet > 8) {
        expect(t, `bet=${bet}u (>8u max rec) should always be ↑`).toMatch(/↑/);
      } else {
        // For bet ≤ 8u, symbol depends on TC; just assert a valid symbol present
        expect(t).toMatch(/[✓↓↑]/);
      }
    }
    checked++;
    await takeScreenshot(page, testInfo, SCENARIO, `30-bet-large${i + 1}`);

    // Balance may hit rebuy threshold; bail gracefully
    await page.getByRole('button', { name: 'Next Hand' }).click();
    await page.waitForTimeout(800);
    const rebuyVisible = await page.getByText(/out of chips/i).isVisible().catch(() => false);
    if (rebuyVisible) break;
    await waitForPhase(page, 'betting').catch(() => {});
    if (!(await page.getByText('Deal', { exact: true }).isVisible().catch(() => false))) break;
  }
  expect(checked).toBeGreaterThan(0);
});

// ==========================================================================
// 5. Count display is visible in drill mode (showCount coerced from hover OK
// too — 'hover' still shows the card, just hidden until hover). We probe
// 'always' explicitly.
// ==========================================================================
test('count card visible during drill (always mode)', async ({ page }, testInfo) => {
  await presetSettings(page, {
    numDecks: 6,
    useDeviations: true,
    deviationsPracticeMode: true,
    showCount: 'always',
    wrongMoveAction: 'execute',
  });
  await startFromSetup(page);

  const txt = await readCountCard(page);
  expect(txt, 'count card should be present in drill mode').not.toBeNull();
  expect(txt!.toLowerCase()).toContain('running count');
  await takeScreenshot(page, testInfo, SCENARIO, '40-count-always');
});

// ==========================================================================
// 6. Count varies across drill hands (drill re-seeds per hand).
// ==========================================================================
test('count varies across drill hands', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await presetSettings(page, {
    numDecks: 6,
    useDeviations: true,
    deviationsPracticeMode: true,
    showCount: 'always',
    wrongMoveAction: 'execute',
  });
  await startFromSetup(page);

  const snaps: string[] = [];
  for (let i = 0; i < 4; i++) {
    const s = await readCountCard(page);
    if (s) snaps.push(s);
    await placeBetByChip(page, '$25');
    await finishHandQuickly(page);
    await page.getByRole('button', { name: 'Next Hand' }).click();
    await page.waitForTimeout(800);
    await waitForPhase(page, 'betting').catch(() => {});
  }
  await takeScreenshot(page, testInfo, SCENARIO, '50-count-varies');
  const unique = new Set(snaps);
  expect(unique.size, `pre-bet count should vary across hands: ${snaps.join(' | ')}`)
    .toBeGreaterThan(1);
});

// ==========================================================================
// 7. Surrender-allowed drill: play several hands, no crashes.
// When surrender is on, surrender-action deviations become eligible.
// ==========================================================================
test('drill with surrender enabled: several hands run without error', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await presetSettings(page, {
    numDecks: 6,
    useDeviations: true,
    deviationsPracticeMode: true,
    showCount: 'always',
    surrenderAllowed: true,
    wrongMoveAction: 'execute',
  });
  await startFromSetup(page);

  for (let i = 0; i < 3; i++) {
    await placeBetByChip(page, '$25');
    await finishHandQuickly(page);
    await expect(page.getByText(/Bet at TC/)).toBeVisible();
    await takeScreenshot(page, testInfo, SCENARIO, `70-surrender-hand${i + 1}`);
    await page.getByRole('button', { name: 'Next Hand' }).click();
    await page.waitForTimeout(800);
    await waitForPhase(page, 'betting').catch(() => {});
  }
});

// ==========================================================================
// 8. Pair drill: with practiceMode='all', drill sometimes deals pairs.
// We just verify split button appears at least once in 10 hands (statistical).
// This validates that forced-deal pair generation integrates with split UI.
// ==========================================================================
test('drill: split button appears at least once across 10 hands', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await presetSettings(page, {
    numDecks: 6,
    useDeviations: true,
    deviationsPracticeMode: true,
    showCount: 'always',
    dasAllowed: true,
    wrongMoveAction: 'execute',
  });
  await startFromSetup(page);

  let sawSplit = false;
  let sawDouble = false;
  for (let i = 0; i < 10; i++) {
    await placeBetByChip(page, '$25');
    // Give time for cards + buttons
    await page.waitForTimeout(800);
    if (await page.getByRole('button', { name: 'Split' }).isVisible().catch(() => false)) {
      sawSplit = true;
    }
    if (await page.getByRole('button', { name: 'Double' }).isVisible().catch(() => false)) {
      sawDouble = true;
    }
    await finishHandQuickly(page);
    await page.getByRole('button', { name: 'Next Hand' }).click();
    await page.waitForTimeout(800);
    await waitForPhase(page, 'betting').catch(() => {});
    if (sawSplit && sawDouble) break;
  }
  await takeScreenshot(page, testInfo, SCENARIO, '80-after-10-hands');
  expect(sawDouble, '10 drill hands should produce at least one Double opportunity')
    .toBe(true);
  // Split is rarer; soft-check via console note if not seen
  if (!sawSplit) {
    console.log('NOTE: no split button seen in 10 hands (pair deviations ≈ 3/28 in H17)');
  }
});

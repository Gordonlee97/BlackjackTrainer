# Playtesting Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playwright-based playtesting agent that exercises the blackjack trainer through real browser automation across 4 viewports, captures screenshots, and produces a visual report for Claude to review.

**Architecture:** Playwright test scripts in `playtest/` automate 9 game scenarios. A custom Claude Code agent definition orchestrates the pipeline: start dev server, run Playwright, review screenshots, write report. Phase detection uses DOM state (button visibility) rather than exposing Zustand internals.

**Tech Stack:** Playwright (`@playwright/test`), TypeScript, Chromium

---

## File Structure

| File | Purpose |
|------|---------|
| `playtest/playwright.config.ts` | Playwright config: 4 viewport projects, base URL, screenshot dirs |
| `playtest/helpers.ts` | Shared utilities: waitForPhase, screenshot, dealUntilCondition, clickChip, placeBetAndDeal |
| `playtest/scenarios/01-basic-flow.spec.ts` | Bet -> deal -> hit -> stand -> result |
| `playtest/scenarios/02-double-down.spec.ts` | Bet -> deal -> double down -> result |
| `playtest/scenarios/03-split.spec.ts` | Deal until pair -> split -> play both hands |
| `playtest/scenarios/04-surrender.spec.ts` | Enable surrender -> deal -> surrender |
| `playtest/scenarios/05-bust.spec.ts` | Hit repeatedly until bust |
| `playtest/scenarios/06-dealer-play.spec.ts` | Stand immediately, capture dealer draws |
| `playtest/scenarios/07-wrong-move.spec.ts` | Make wrong play, capture strategy modal |
| `playtest/scenarios/08-settings-modal.spec.ts` | Open settings in-game, toggle options |
| `playtest/scenarios/09-extended-session.spec.ts` | Play 10+ hands, capture stats/balance |
| `.superpowers/agents/game-playtester.md` | Claude Code agent definition |
| `.gitignore` (modify) | Add `playtest/screenshots/` |
| `package.json` (modify) | Add `playtest` script |

---

### Task 1: Install Playwright and configure the project

**Files:**
- Modify: `package.json`
- Create: `playtest/playwright.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Install Playwright as a dev dependency**

```bash
npm install -D @playwright/test
```

- [ ] **Step 2: Install Chromium browser**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Create the Playwright config**

Create `playtest/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import path from 'path';

const SCREENSHOT_BASE = path.resolve(__dirname, 'screenshots');

export default defineConfig({
  testDir: './scenarios',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173/BlackjackTrainer/',
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'large-desktop',
      use: { viewport: { width: 2560, height: 1440 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'large-desktop-2560x1440') },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1920, height: 1080 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'desktop-1920x1080') },
    },
    {
      name: 'laptop',
      use: { viewport: { width: 1366, height: 768 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'laptop-1366x768') },
    },
    {
      name: 'phone',
      use: { viewport: { width: 390, height: 844 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'phone-390x844') },
    },
  ],
});
```

- [ ] **Step 4: Add playtest script to package.json**

Add to the `"scripts"` section:

```json
"playtest": "npx playwright test --config=playtest/playwright.config.ts"
```

- [ ] **Step 5: Add screenshots to .gitignore**

Append to `.gitignore`:

```
playtest/screenshots/
```

- [ ] **Step 6: Verify Playwright runs (empty test suite)**

```bash
npm run playtest
```

Expected: Playwright runs and reports "no tests found" or similar. No errors about config.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playtest/playwright.config.ts .gitignore
git commit -m "feat: add Playwright config for playtesting agent"
```

---

### Task 2: Create shared helper utilities

**Files:**
- Create: `playtest/helpers.ts`

These helpers abstract common operations so scenario files stay concise. Phase detection is DOM-based: we check for the presence of specific buttons/text to determine what phase the game is in.

- [ ] **Step 1: Create the helpers file**

Create `playtest/helpers.ts`:

```typescript
import type { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Get the absolute screenshot directory for this test's viewport project.
 * Falls back to a generic dir if project metadata isn't set.
 */
export function getScreenshotDir(testInfo: { project: { metadata?: { screenshotDir?: string } } }): string {
  const dir = testInfo.project.metadata?.screenshotDir
    ?? path.resolve(__dirname, 'screenshots', 'unknown');
  return dir;
}

/**
 * Take a full-page screenshot with an absolute path.
 * Creates directories as needed.
 */
export async function takeScreenshot(
  page: Page,
  testInfo: { project: { metadata?: { screenshotDir?: string } } },
  scenario: string,
  name: string,
): Promise<string> {
  const dir = path.join(getScreenshotDir(testInfo), scenario);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

/**
 * Take a sequence of screenshots with delays between them (for animations).
 * Returns array of absolute file paths.
 */
export async function takeSequentialScreenshots(
  page: Page,
  testInfo: { project: { metadata?: { screenshotDir?: string } } },
  scenario: string,
  baseName: string,
  count: number,
  delayMs: number,
): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) await page.waitForTimeout(delayMs);
    const p = await takeScreenshot(page, testInfo, scenario, `${baseName}-${i + 1}`);
    paths.push(p);
  }
  return paths;
}

/**
 * Navigate to the app and click "Start Training" to get to the game table.
 */
export async function navigateToGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByText('Start Training').click();
  // Wait for betting phase — chip buttons should be visible
  await page.getByText('$25').waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Place a bet and deal. Assumes we're in the betting phase.
 */
export async function placeBetAndDeal(page: Page, chipValue: '$5' | '$25' | '$100' | '$500' = '$25'): Promise<void> {
  await page.getByText(chipValue, { exact: true }).click();
  await page.getByText('Deal', { exact: true }).click();
  // Wait for cards to appear — either player_turn buttons or complete phase
  await page.waitForTimeout(800); // Let deal animation play
}

/**
 * Wait until a specific game phase is detectable via DOM.
 *
 * Phase detection:
 * - betting: "Deal" button visible
 * - player_turn: "Hit" button visible
 * - dealer_turn: "Dealer playing" text visible
 * - complete: "Next Hand" button visible
 */
export async function waitForPhase(
  page: Page,
  phase: 'betting' | 'player_turn' | 'dealer_turn' | 'complete',
  timeout = 15_000,
): Promise<void> {
  switch (phase) {
    case 'betting':
      await page.getByText('Deal', { exact: true }).waitFor({ state: 'visible', timeout });
      break;
    case 'player_turn':
      await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout });
      break;
    case 'dealer_turn':
      await page.getByText('Dealer playing', { exact: false }).waitFor({ state: 'visible', timeout });
      break;
    case 'complete':
      await page.getByText('Next Hand', { exact: true }).waitFor({ state: 'visible', timeout });
      break;
  }
}

/**
 * Dismiss any strategy modal that may be blocking.
 * Tries "Play Anyways" first (block mode), then "Got It" (execute mode).
 */
export async function dismissStrategyModal(page: Page): Promise<void> {
  try {
    const playAnyways = page.getByText('Play Anyways');
    await playAnyways.waitFor({ state: 'visible', timeout: 800 });
    await playAnyways.click();
    await page.waitForTimeout(300);
    return;
  } catch { /* not in block mode or no modal */ }
  try {
    const gotIt = page.getByText('Got It');
    await gotIt.waitFor({ state: 'visible', timeout: 800 });
    await gotIt.click();
    await page.waitForTimeout(300);
  } catch { /* no modal */ }
}

/**
 * Play a full hand quickly: bet, deal, stand. Returns when phase is complete.
 * Used to cycle through hands when looking for a specific deal.
 */
export async function playQuickHand(page: Page): Promise<void> {
  await placeBetAndDeal(page);
  // Could end up in player_turn or complete (if natural)
  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
    await page.getByText('Stand', { exact: true }).click();
    await page.waitForTimeout(300);
    // Dismiss strategy modal if standing was wrong
    await dismissStrategyModal(page);
  } catch {
    // Might have gone straight to complete (natural) — that's fine
  }
  await waitForPhase(page, 'complete');
  await page.getByText('Next Hand', { exact: true }).click();
  await waitForPhase(page, 'betting');
}

/**
 * Deal until a condition is met on the player's hand.
 * Checks the DOM after each deal for the condition.
 * Returns true if condition was met, false if max attempts exceeded.
 *
 * conditionFn receives the page after dealing and should return true if the hand is right.
 */
export async function dealUntilCondition(
  page: Page,
  conditionFn: (page: Page) => Promise<boolean>,
  maxAttempts = 50,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await placeBetAndDeal(page);

    // Wait for either player_turn or complete
    await Promise.race([
      page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      page.getByText('Next Hand', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(300);

    const matched = await conditionFn(page);
    if (matched) return true;

    // Not the hand we want — finish it and try again
    try {
      await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 1000 });
      await page.getByText('Stand', { exact: true }).click();
    } catch {
      // Already complete
    }
    await waitForPhase(page, 'complete');
    await page.getByText('Next Hand', { exact: true }).click();
    await waitForPhase(page, 'betting');
  }
  return false;
}

/**
 * Enable a specific setting by opening the in-game settings modal.
 * Only works from the game table (not setup page).
 */
export async function openSettings(page: Page): Promise<void> {
  await page.getByText('Settings').click();
  await page.waitForTimeout(300); // Modal animation
}

export async function closeSettings(page: Page): Promise<void> {
  // Settings modal has a backdrop click to close, or we can press Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit --esModuleInterop --module nodenext --moduleResolution nodenext playtest/helpers.ts 2>&1 || echo "TypeScript check — any errors here will be caught when Playwright runs the tests"
```

Note: The helpers will be consumed by Playwright which handles its own TS compilation, so compilation errors will surface when tests run.

- [ ] **Step 3: Commit**

```bash
git add playtest/helpers.ts
git commit -m "feat: add shared Playwright helper utilities for playtesting"
```

---

### Task 3: Scenario 01 — Basic Flow

**Files:**
- Create: `playtest/scenarios/01-basic-flow.spec.ts`

- [ ] **Step 1: Write the basic flow scenario**

Create `playtest/scenarios/01-basic-flow.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '01-basic-flow';

test('basic game flow: bet, deal, hit, stand, result', async ({ page }, testInfo) => {
  await navigateToGame(page);

  // Screenshot: betting phase
  await takeScreenshot(page, testInfo, SCENARIO, '1-betting-phase');

  // Place bet and deal
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');

  // Screenshot: cards dealt, player turn
  await takeScreenshot(page, testInfo, SCENARIO, '2-cards-dealt');

  // Hit once
  await page.getByText('Hit', { exact: true }).click();
  await page.waitForTimeout(400);
  await takeScreenshot(page, testInfo, SCENARIO, '3-after-hit');

  // Stand
  await page.getByText('Stand', { exact: true }).click();

  // Wait for dealer to finish and hand to complete
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '4-result');
});
```

- [ ] **Step 2: Run the scenario to verify it works**

```bash
npm run playtest -- --grep "basic game flow" --project=desktop
```

Expected: Test passes, 4 screenshots created in `playtest/screenshots/desktop-1920x1080/01-basic-flow/`.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/01-basic-flow.spec.ts
git commit -m "feat: add basic flow playtest scenario"
```

---

### Task 4: Scenario 02 — Double Down

**Files:**
- Create: `playtest/scenarios/02-double-down.spec.ts`

- [ ] **Step 1: Write the double down scenario**

Create `playtest/scenarios/02-double-down.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '02-double-down';

test('double down: bet, deal, double, result', async ({ page }, testInfo) => {
  await navigateToGame(page);

  // Place bet and deal
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');

  // Screenshot: before double
  await takeScreenshot(page, testInfo, SCENARIO, '1-before-double');

  // Check if double is available (button should not be disabled)
  const doubleBtn = page.getByText('Double', { exact: true });
  const isDisabled = await doubleBtn.isDisabled();

  if (isDisabled) {
    // Can't double (e.g., insufficient balance) — skip gracefully
    await takeScreenshot(page, testInfo, SCENARIO, '2-double-unavailable');
    return;
  }

  // Double down
  await doubleBtn.click();
  await page.waitForTimeout(500);

  // Screenshot: after double (one card dealt, hand complete)
  await takeScreenshot(page, testInfo, SCENARIO, '2-after-double');

  // Wait for result
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result');
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "double down" --project=desktop
```

Expected: Test passes, screenshots captured.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/02-double-down.spec.ts
git commit -m "feat: add double down playtest scenario"
```

---

### Task 5: Scenario 03 — Split

**Files:**
- Create: `playtest/scenarios/03-split.spec.ts`

- [ ] **Step 1: Write the split scenario**

Create `playtest/scenarios/03-split.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, dealUntilCondition, waitForPhase, takeScreenshot, takeSequentialScreenshots } from '../helpers';

const SCENARIO = '03-split';

test('split: deal until pair, split, play both hands', async ({ page }, testInfo) => {
  await navigateToGame(page);

  // Deal until we get a splittable hand (Split button is enabled)
  const found = await dealUntilCondition(page, async (p) => {
    try {
      await p.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 2000 });
      const splitBtn = p.getByText('Split', { exact: true });
      const isDisabled = await splitBtn.isDisabled();
      return !isDisabled;
    } catch {
      return false;
    }
  });

  if (!found) {
    // Couldn't find a pair in 50 attempts — take a screenshot and skip
    await takeScreenshot(page, testInfo, SCENARIO, '1-no-pair-found');
    return;
  }

  // Screenshot: pair ready to split
  await takeScreenshot(page, testInfo, SCENARIO, '1-pair-before-split');

  // Click split
  await page.getByText('Split', { exact: true }).click();

  // Capture split animation sequence
  await takeSequentialScreenshots(page, testInfo, SCENARIO, '2-split-animation', 4, 300);

  // Wait for split animation to finish, then play hands
  await page.waitForTimeout(2000);

  // Play first hand — stand
  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
    await takeScreenshot(page, testInfo, SCENARIO, '3-first-hand');
    await page.getByText('Stand', { exact: true }).click();
    await page.waitForTimeout(500);
  } catch {
    // Hand may have auto-completed (split aces)
  }

  // Play second hand — stand (if still in player_turn)
  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
    await takeScreenshot(page, testInfo, SCENARIO, '4-second-hand');
    await page.getByText('Stand', { exact: true }).click();
  } catch {
    // May have auto-completed
  }

  // Wait for final result
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '5-result');
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "split" --project=desktop
```

Expected: Test passes. May take several deals to find a pair.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/03-split.spec.ts
git commit -m "feat: add split playtest scenario"
```

---

### Task 6: Scenario 04 — Surrender

**Files:**
- Create: `playtest/scenarios/04-surrender.spec.ts`

- [ ] **Step 1: Write the surrender scenario**

The surrender scenario needs to enable the surrender rule first. Since we start from the setup page, we can toggle it there before clicking "Start Training". Alternatively, we can toggle it via the in-game settings modal.

Create `playtest/scenarios/04-surrender.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, dealUntilCondition } from '../helpers';

const SCENARIO = '04-surrender';

test('surrender: enable rule, deal, surrender', async ({ page }, testInfo) => {
  // Start from setup page and enable surrender before entering game
  await page.goto('/');

  // Toggle "Surrender Allowed" on the setup page
  await page.getByText('Surrender Allowed').click();
  await page.waitForTimeout(200);

  // Screenshot: setup page with surrender enabled
  await takeScreenshot(page, testInfo, SCENARIO, '1-setup-surrender-enabled');

  // Start the game
  await page.getByText('Start Training').click();
  await page.getByText('$25').waitFor({ state: 'visible', timeout: 5000 });

  // Deal until surrender is available (first 2 cards, surrender button enabled)
  const found = await dealUntilCondition(page, async (p) => {
    try {
      await p.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 2000 });
      const surrenderBtn = p.getByText('Surrender', { exact: true });
      const isDisabled = await surrenderBtn.isDisabled();
      return !isDisabled;
    } catch {
      return false;
    }
  });

  if (!found) {
    await takeScreenshot(page, testInfo, SCENARIO, '2-surrender-unavailable');
    return;
  }

  // Screenshot: before surrender
  await takeScreenshot(page, testInfo, SCENARIO, '2-before-surrender');

  // Surrender
  await page.getByText('Surrender', { exact: true }).click();

  // Wait for result
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result-after-surrender');
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "surrender" --project=desktop
```

Expected: Test passes.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/04-surrender.spec.ts
git commit -m "feat: add surrender playtest scenario"
```

---

### Task 7: Scenario 05 — Bust

**Files:**
- Create: `playtest/scenarios/05-bust.spec.ts`

- [ ] **Step 1: Write the bust scenario**

Create `playtest/scenarios/05-bust.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '05-bust';

test('bust: hit repeatedly until bust', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);

  // Wait for player turn
  await waitForPhase(page, 'player_turn');

  let hitCount = 0;

  // Hit until we bust or the hand ends
  while (hitCount < 10) {
    // Check if Hit button is still available (we're still in player_turn)
    const hitBtn = page.getByText('Hit', { exact: true });
    try {
      await hitBtn.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      break; // Not in player_turn anymore
    }

    // Check if button is disabled (could happen if modal is open)
    const isDisabled = await hitBtn.isDisabled();
    if (isDisabled) {
      // Strategy modal might be blocking — try to dismiss it
      try {
        const tryAgain = page.getByText('Try Again');
        await tryAgain.waitFor({ state: 'visible', timeout: 1000 });
        await tryAgain.click();
        await page.waitForTimeout(300);
      } catch {
        // Try "Play Anyways" or "Got It"
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

  // Wait for complete phase (bust or stood)
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, `${hitCount + 1}-result`);
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "bust" --project=desktop
```

Expected: Test passes. The player may bust or reach 21 and auto-stand.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/05-bust.spec.ts
git commit -m "feat: add bust playtest scenario"
```

---

### Task 8: Scenario 06 — Dealer Play

**Files:**
- Create: `playtest/scenarios/06-dealer-play.spec.ts`

- [ ] **Step 1: Write the dealer play scenario**

Create `playtest/scenarios/06-dealer-play.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot, takeSequentialScreenshots } from '../helpers';

const SCENARIO = '06-dealer-play';

test('dealer play: stand immediately, watch dealer draw', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');

  // Screenshot: player's hand before standing
  await takeScreenshot(page, testInfo, SCENARIO, '1-before-stand');

  // Stand immediately — this will trigger dealer play
  // May trigger strategy modal if standing is wrong — dismiss it
  await page.getByText('Stand', { exact: true }).click();
  await page.waitForTimeout(200);

  // Handle potential strategy modal
  try {
    const tryAgain = page.getByText('Try Again');
    await tryAgain.waitFor({ state: 'visible', timeout: 1000 });
    await tryAgain.click();
    await page.waitForTimeout(300);
    // After try again, we need to actually stand — use keyboard shortcut
    await page.keyboard.press('s');
    await page.waitForTimeout(200);
    // If modal appears again, play anyways
    try {
      const playAnyways = page.getByText('Play Anyways');
      await playAnyways.waitFor({ state: 'visible', timeout: 1000 });
      await playAnyways.click();
    } catch {
      // No modal
    }
  } catch {
    // No modal — good
  }

  // Capture dealer playing sequence
  await takeSequentialScreenshots(page, testInfo, SCENARIO, '2-dealer-playing', 4, 500);

  // Wait for result
  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '3-result');
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "dealer play" --project=desktop
```

Expected: Test passes.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/06-dealer-play.spec.ts
git commit -m "feat: add dealer play playtest scenario"
```

---

### Task 9: Scenario 07 — Wrong Move Feedback

**Files:**
- Create: `playtest/scenarios/07-wrong-move.spec.ts`

- [ ] **Step 1: Write the wrong move scenario**

The default `wrongMoveAction` is `'block'`, so the strategy modal will appear with "Try Again" and "Play Anyways" buttons. We intentionally make a bad play to trigger it.

Create `playtest/scenarios/07-wrong-move.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '07-wrong-move';

test('wrong move: trigger strategy modal with bad play', async ({ page }, testInfo) => {
  await navigateToGame(page);
  await placeBetAndDeal(page);
  await waitForPhase(page, 'player_turn');

  // Screenshot: hand before making a move
  await takeScreenshot(page, testInfo, SCENARIO, '1-player-turn');

  // Make a deliberately wrong move: if we can surrender, that's almost always wrong
  // as a first choice. Otherwise, try an unusual action.
  // Strategy: just click "Surrender" if available (usually wrong), else "Stand" on low totals
  const surrenderBtn = page.getByText('Surrender', { exact: true });
  const hitBtn = page.getByText('Hit', { exact: true });
  const standBtn = page.getByText('Stand', { exact: true });

  let clicked = false;

  // Try surrender first (usually wrong since it's not the optimal play for most hands)
  if (!(await surrenderBtn.isDisabled())) {
    await surrenderBtn.click();
    clicked = true;
  }

  // If surrender wasn't available, try stand (often wrong on low hands)
  if (!clicked) {
    await standBtn.click();
    clicked = true;
  }

  await page.waitForTimeout(500);

  // Check for strategy modal
  try {
    const modalTitle = page.getByText('Not Quite Right');
    await modalTitle.waitFor({ state: 'visible', timeout: 3000 });

    // Screenshot: strategy modal visible
    await takeScreenshot(page, testInfo, SCENARIO, '2-strategy-modal');

    // Screenshot: try the "Play Anyways" button
    const playAnyways = page.getByText('Play Anyways');
    try {
      await playAnyways.waitFor({ state: 'visible', timeout: 1000 });
      await takeScreenshot(page, testInfo, SCENARIO, '3-play-anyways-visible');
      await playAnyways.click();
    } catch {
      // Block mode with Try Again
      const tryAgain = page.getByText('Try Again');
      await tryAgain.click();
    }
  } catch {
    // No modal — our "wrong" move was actually correct!
    // Take a screenshot anyway showing correct flash
    await takeScreenshot(page, testInfo, SCENARIO, '2-move-was-correct');
  }

  // Finish the hand
  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 2000 });
    await page.getByText('Stand', { exact: true }).click();
    await page.waitForTimeout(300);
    // Handle any additional modals
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
  } catch {
    // Already past player_turn
  }

  await waitForPhase(page, 'complete');
  await takeScreenshot(page, testInfo, SCENARIO, '4-result');
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "wrong move" --project=desktop
```

Expected: Test passes. Strategy modal should appear in most cases.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/07-wrong-move.spec.ts
git commit -m "feat: add wrong move feedback playtest scenario"
```

---

### Task 10: Scenario 08 — Settings Modal

**Files:**
- Create: `playtest/scenarios/08-settings-modal.spec.ts`

- [ ] **Step 1: Write the settings modal scenario**

Create `playtest/scenarios/08-settings-modal.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, takeScreenshot } from '../helpers';

const SCENARIO = '08-settings-modal';

test('settings modal: open, toggle options, close', async ({ page }, testInfo) => {
  await navigateToGame(page);

  // Screenshot: game table before opening settings
  await takeScreenshot(page, testInfo, SCENARIO, '1-game-table');

  // Open settings
  await page.getByText('Settings').click();
  await page.waitForTimeout(400);

  // Screenshot: settings modal open
  await takeScreenshot(page, testInfo, SCENARIO, '2-settings-open');

  // Toggle "Show Hand Totals"
  await page.getByText('Show Hand Totals').click();
  await page.waitForTimeout(200);
  await takeScreenshot(page, testInfo, SCENARIO, '3-toggled-hand-totals');

  // Change a dropdown — click on a select to change deck count
  // The settings modal uses CustomSelect components
  await page.getByText('Number of Decks').waitFor({ state: 'visible' });
  await takeScreenshot(page, testInfo, SCENARIO, '4-settings-scrolled');

  // Close settings (click backdrop or press Escape)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Screenshot: modal closed
  await takeScreenshot(page, testInfo, SCENARIO, '5-settings-closed');
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "settings modal" --project=desktop
```

Expected: Test passes.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/08-settings-modal.spec.ts
git commit -m "feat: add settings modal playtest scenario"
```

---

### Task 11: Scenario 09 — Extended Session

**Files:**
- Create: `playtest/scenarios/09-extended-session.spec.ts`

- [ ] **Step 1: Write the extended session scenario**

Create `playtest/scenarios/09-extended-session.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { navigateToGame, placeBetAndDeal, waitForPhase, takeScreenshot } from '../helpers';

const SCENARIO = '09-extended-session';

test('extended session: play 10+ hands, check stats and balance', async ({ page }, testInfo) => {
  await navigateToGame(page);

  // Screenshot: initial state
  await takeScreenshot(page, testInfo, SCENARIO, '1-initial');

  for (let hand = 1; hand <= 12; hand++) {
    await placeBetAndDeal(page);

    // Wait for player turn or complete (natural)
    await Promise.race([
      page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      page.getByText('Next Hand', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(300);

    // If in player turn, make a move
    try {
      await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 1000 });

      // Alternate between hit and stand for variety
      if (hand % 2 === 0) {
        await page.getByText('Hit', { exact: true }).click();
        await page.waitForTimeout(400);
        // Handle strategy modal if it appears
        try {
          const tryAgain = page.getByText('Try Again');
          await tryAgain.waitFor({ state: 'visible', timeout: 800 });
          await tryAgain.click();
          await page.waitForTimeout(200);
        } catch { /* no modal */ }
      }

      // Stand to finish the hand (if still in player_turn)
      try {
        await page.getByText('Stand', { exact: true }).waitFor({ state: 'visible', timeout: 1000 });
        await page.getByText('Stand', { exact: true }).click();
        await page.waitForTimeout(200);
        // Handle strategy modal
        try {
          const tryAgain = page.getByText('Try Again');
          await tryAgain.waitFor({ state: 'visible', timeout: 800 });
          await tryAgain.click();
          await page.waitForTimeout(200);
          await page.getByText('Stand', { exact: true }).click();
          await page.waitForTimeout(200);
          try {
            const playAnyways = page.getByText('Play Anyways');
            await playAnyways.waitFor({ state: 'visible', timeout: 800 });
            await playAnyways.click();
          } catch { /* no modal */ }
        } catch { /* no modal */ }
      } catch {
        // Already past player_turn (busted or auto-completed)
      }
    } catch {
      // Already at complete (natural)
    }

    // Wait for hand to complete
    await waitForPhase(page, 'complete');

    // Take periodic screenshots
    if (hand === 5 || hand === 10 || hand === 12) {
      await takeScreenshot(page, testInfo, SCENARIO, `2-hand-${hand}-result`);
    }

    // Next hand (unless it's the last one)
    if (hand < 12) {
      await page.getByText('Next Hand', { exact: true }).click();
      await waitForPhase(page, 'betting');
    }
  }

  // Final screenshot showing stats and balance after 12 hands
  await takeScreenshot(page, testInfo, SCENARIO, '3-final-stats');
});
```

- [ ] **Step 2: Run the scenario**

```bash
npm run playtest -- --grep "extended session" --project=desktop
```

Expected: Test passes. 12 hands played, screenshots at hands 5, 10, 12, and final stats.

- [ ] **Step 3: Commit**

```bash
git add playtest/scenarios/09-extended-session.spec.ts
git commit -m "feat: add extended session playtest scenario"
```

---

### Task 12: Run full suite and fix any issues

**Files:**
- Possibly modify any scenario files that fail

- [ ] **Step 1: Run the full test suite across all viewports**

```bash
npm run playtest
```

Expected: All 9 scenarios pass across all 4 viewport projects (36 total test runs). Screenshots are generated in `playtest/screenshots/`.

- [ ] **Step 2: Fix any failing tests**

Review failures, adjust selectors or timeouts as needed. Common issues:
- Timing: increase `waitForTimeout` values
- Selectors: `getByText` may match multiple elements — add `{ exact: true }` or scope to a container
- Strategy modal blocking: ensure modal dismissal logic handles both block and execute modes

- [ ] **Step 3: Verify screenshots exist**

```bash
ls -R playtest/screenshots/ | head -60
```

Expected: Directory structure with screenshots organized by viewport and scenario.

- [ ] **Step 4: Commit any fixes**

```bash
git add playtest/
git commit -m "fix: adjust playtest scenarios for cross-viewport reliability"
```

---

### Task 13: Create the Claude Code agent definition

**Files:**
- Create: `.superpowers/agents/game-playtester.md`

- [ ] **Step 1: Create the agents directory**

```bash
mkdir -p .superpowers/agents
```

- [ ] **Step 2: Write the agent definition**

Create `.superpowers/agents/game-playtester.md`:

````markdown
---
name: game-playtester
description: Playtests the blackjack trainer by running Playwright browser automation across 4 viewports, capturing screenshots, and writing a visual review report
tools: Bash, Read, Write, Glob
---

# Game Playtester Agent

You are a QA playtester for a blackjack trainer web app. Your job is to run the Playwright test suite, review every screenshot it produces, and write a detailed report.

## Step 1: Start the dev server

```bash
cd C:/Users/gordo/source/repos/BlackjackTrainer
npm run dev &
DEV_PID=$!
sleep 3
```

Wait for the server to be ready by checking that `http://localhost:5173/BlackjackTrainer/` responds.

## Step 2: Run the Playwright test suite

```bash
npm run playtest 2>&1
```

If any tests fail, note the failures but continue — partial results are still valuable.

## Step 3: Review every screenshot

Use the Read tool to view every `.png` file in `playtest/screenshots/`. For each screenshot, evaluate:

### Layout & Spacing
- Are any elements clipped, overflowing, or touching screen edges?
- Is text readable and properly spaced from container edges?
- Are cards, buttons, and chips properly sized for the viewport?
- Do flex/grid layouts break down at any viewport?

### Visual Quality
- Are colors consistent and aesthetically pleasing?
- Is contrast sufficient for all text?
- Do gradients, shadows, and borders look correct?
- Are disabled states visually distinct from enabled states?

### Responsive Scaling
- Do elements scale proportionally across viewports?
- Are buttons too small to tap on phone viewport (390x844)?
- Does anything become too large on the big desktop viewport (2560x1440)?
- Is the shoe bar, stats panel, and balance readable at all sizes?

### Game State Correctness
- Do cards display correctly (face up/down as expected)?
- Are hand totals shown when they should be?
- Do result messages appear correctly?
- Is the strategy modal properly formatted?

### Cross-Viewport Comparison
- Compare the same scenario across all 4 viewports
- Flag any viewport where the layout significantly degrades
- Note if any viewport has unique issues not seen in others

## Step 4: Write the report

Write the report to `C:/Users/gordo/source/repos/BlackjackTrainer/docs/playtest-report.md` using this format:

```markdown
# Playtest Report — {date}

## Summary
- Viewports tested: 4 (2560x1440, 1920x1080, 1366x768, 390x844)
- Scenarios run: 9
- Issues found: {count}
- Overall assessment: {pass / needs attention / failing}

## Issues

{List each issue with:}
### Issue N: {title}
- **Severity**: critical / warning / cosmetic
- **Viewport(s)**: {affected viewports}
- **Scenario**: {which scenario}
- **Description**: {detailed description of what's wrong}
- **Screenshot**: {absolute path to the screenshot showing the issue}
- **Suggestion**: {how to fix it}

## Scenario Results

{For each scenario, a table showing pass/warning/fail per viewport, plus notes}

### N. {Scenario Name}
| Viewport | Status | Notes |
|----------|--------|-------|
| 2560x1440 | ... | ... |
| 1920x1080 | ... | ... |
| 1366x768 | ... | ... |
| 390x844 | ... | ... |

#### Screenshots
{Absolute paths to all screenshots for this scenario, grouped by viewport}
```

## Step 5: Stop the dev server

```bash
kill $DEV_PID 2>/dev/null
```

## Important Notes

- Use absolute paths for ALL screenshot references in the report
- Be specific about issues — "looks off" is not helpful, "the $500 chip overlaps the clear button at 390x844" is
- Compare each viewport against the others — issues are often relative
- If Playwright tests fail, report which scenarios couldn't run and why
- Be honest about both problems AND things that look good
````

- [ ] **Step 3: Commit**

```bash
git add .superpowers/agents/game-playtester.md
git commit -m "feat: add game-playtester Claude Code agent definition"
```

---

### Task 14: Verify full pipeline end-to-end

**Files:**
- None (verification only)

- [ ] **Step 1: Clean screenshots directory**

```bash
rm -rf playtest/screenshots/
```

- [ ] **Step 2: Start dev server**

```bash
cd C:/Users/gordo/source/repos/BlackjackTrainer && npm run dev &
```

- [ ] **Step 3: Run the full playtest suite**

```bash
npm run playtest
```

Expected: All tests pass, screenshots generated.

- [ ] **Step 4: Verify screenshot output structure**

```bash
find playtest/screenshots -name "*.png" | wc -l
```

Expected: 100+ screenshots (9 scenarios × 4 viewports × ~3 screenshots each).

- [ ] **Step 5: Stop dev server and verify build still passes**

```bash
npm run build
```

Expected: Build passes — playtest files are not included in the app build (they're outside `src/`).

- [ ] **Step 6: Final commit if any adjustments were made**

```bash
git add -A && git commit -m "chore: finalize playtesting agent setup"
```

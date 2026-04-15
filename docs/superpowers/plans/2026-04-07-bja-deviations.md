# BJA Deviation Training Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add true-count-based deviation training so the strategy advisor overrides basic strategy when the count warrants it, controlled by a user setting.

**Architecture:** Deviations are a flat overlay on the existing chart system. A new `deviations.ts` file defines deviation entries per H17/S17 rule set. The advisor checks deviations after basic strategy lookup when a true count is provided. True count is computed from running count and remaining shoe size.

**Tech Stack:** TypeScript, Zustand, React (existing stack — no new dependencies)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/engine/counting.ts` | Modify | Add `computeTrueCount()` function |
| `src/strategy/deviations.ts` | Create | Deviation data model + H17/S17 deviation arrays |
| `src/strategy/types.ts` | Modify | Add `useDeviations` to `RuleSet` |
| `src/strategy/advisor.ts` | Modify | Add TC-aware deviation lookup to `getCorrectAction`, extend `StrategyAdvice` |
| `src/components/game/SettingsModal.tsx` | Modify | Add "Use Deviations" toggle in Training section |
| `src/components/game/GameTable.tsx` | Modify | Pass true count to `getCorrectAction` when deviations enabled |
| `src/components/game/RunningCount.tsx` | Modify | Show true count alongside running count when deviations enabled |
| `src/components/feedback/StrategyModal.tsx` | Modify | Show deviation context in feedback |

---

### Task 1: Add `computeTrueCount` to counting engine

**Files:**
- Modify: `src/engine/counting.ts`

- [ ] **Step 1: Write `computeTrueCount` function**

Add to end of `src/engine/counting.ts`:

```ts
/**
 * True count = running count / decks remaining.
 * Rounded to nearest integer (standard for Hi-Lo index plays).
 */
export function computeTrueCount(runningCount: number, shoeSize: number, cardsDealt: number): number {
  const cardsRemaining = shoeSize - cardsDealt;
  if (cardsRemaining <= 0) return 0;
  const decksRemaining = cardsRemaining / 52;
  return Math.round(runningCount / decksRemaining);
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/counting.ts
git commit -m "feat: add computeTrueCount to counting engine"
```

---

### Task 2: Add `useDeviations` setting to RuleSet

**Files:**
- Modify: `src/strategy/types.ts`

- [ ] **Step 1: Add `useDeviations` to `RuleSet` interface and defaults**

In `src/strategy/types.ts`, add `useDeviations: boolean` to the `RuleSet` interface (after `showCount`):

```ts
export interface RuleSet {
  numDecks: 1 | 2 | 4 | 6 | 8;
  dealerHitsSoft17: boolean;
  dasAllowed: boolean;
  surrenderAllowed: boolean;
  hitSplitAces: boolean;
  practiceMode: 'all' | 'hard' | 'soft' | 'splits';
  wrongMoveAction: 'execute' | 'block';
  showHandTotals: boolean;
  soundVolume: number;
  showCount: 'off' | 'always' | 'hover';
  useDeviations: boolean;
}
```

And in `DEFAULT_RULES`, add:

```ts
useDeviations: false,
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/strategy/types.ts
git commit -m "feat: add useDeviations setting to RuleSet"
```

---

### Task 3: Create deviation data model and placeholder arrays

**Files:**
- Create: `src/strategy/deviations.ts`

- [ ] **Step 1: Create `deviations.ts` with types and placeholder arrays**

Create `src/strategy/deviations.ts`:

```ts
import type { ChartAction, RuleSet } from './types';

export interface Deviation {
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;       // same keys as StrategyChart (e.g., 16 for hard 16, 13 for A+2)
  dealerUp: number;          // 2-11 (11 = Ace)
  threshold: number;         // true count index
  direction: 'gte' | 'lte';  // deviation applies when TC >= or TC <= threshold
  action: ChartAction;       // the deviation play (replaces basic strategy)
}

// ============================================================
// H17 DEVIATIONS (Dealer Hits Soft 17, 4-8 decks)
// Source: BJA H17 chart (src/strategy/BJA_H17.pdf)
// ============================================================
// TODO: Transcribe from BJA_H17.pdf — cell-by-cell verification required
export const H17_DEVIATIONS: Deviation[] = [];

// ============================================================
// S17 DEVIATIONS (Dealer Stands on Soft 17, 4-8 decks)
// Source: BJA S17 chart (src/strategy/BJA_S17.pdf)
// ============================================================
// TODO: Transcribe from BJA_S17.pdf — cell-by-cell verification required
export const S17_DEVIATIONS: Deviation[] = [];

/**
 * Get the applicable deviation list for the current rules.
 * Returns empty array for 1-2 deck games (deviation indices differ).
 */
export function getDeviations(rules: RuleSet): Deviation[] {
  if (rules.numDecks < 4) return [];
  return rules.dealerHitsSoft17 ? H17_DEVIATIONS : S17_DEVIATIONS;
}

/**
 * Find a matching deviation for the given hand situation.
 * Returns the deviation if TC meets the threshold condition, otherwise undefined.
 */
export function findDeviation(
  deviations: Deviation[],
  handType: 'hard' | 'soft' | 'pairs',
  playerTotal: number,
  dealerUp: number,
  trueCount: number,
): Deviation | undefined {
  return deviations.find(d =>
    d.handType === handType &&
    d.playerTotal === playerTotal &&
    d.dealerUp === dealerUp &&
    (d.direction === 'gte' ? trueCount >= d.threshold : trueCount <= d.threshold)
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/strategy/deviations.ts
git commit -m "feat: add deviation data model with lookup functions"
```

---

### Task 4: Integrate deviations into the strategy advisor

**Files:**
- Modify: `src/strategy/advisor.ts`

- [ ] **Step 1: Extend `StrategyAdvice` with deviation fields**

In `src/strategy/advisor.ts`, update the `StrategyAdvice` interface:

```ts
export interface StrategyAdvice {
  correctAction: FinalAction;
  chartAction: ChartAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  isDeviation?: boolean;
  deviationThreshold?: number;
}
```

- [ ] **Step 2: Add deviation lookup to `getCorrectAction`**

Update the function signature and add deviation checking. Add imports at the top:

```ts
import { getDeviations, findDeviation } from './deviations';
```

Update function signature — add `trueCount` param after `strategy`:

```ts
export function getCorrectAction(
  playerCards: Card[],
  dealerUpcard: Card,
  rules: RuleSet,
  canDouble: boolean,
  canSplit: boolean,
  canSurrender: boolean,
  strategy?: FullStrategy,
  trueCount?: number | null,
): StrategyAdvice {
```

After the existing logic determines `chartAction`, `handType`, and `playerTotal` (but before the `resolveAction` call in each branch), add a deviation check. The cleanest way is to extract the common return logic. Replace the function body with:

```ts
export function getCorrectAction(
  playerCards: Card[],
  dealerUpcard: Card,
  rules: RuleSet,
  canDouble: boolean,
  canSplit: boolean,
  canSurrender: boolean,
  strategy?: FullStrategy,
  trueCount?: number | null,
): StrategyAdvice {
  const strat = strategy ?? buildStrategy(rules);
  const dealerUp = dealerUpcard.rank === 'A' ? 11 : Math.min(10, parseInt(dealerUpcard.rank) || 10);
  const hv = handValue(playerCards);

  let chartAction: ChartAction;
  let handType: 'hard' | 'soft' | 'pairs';
  let playerTotal: number;

  // Check pairs first (only on first two cards)
  if (isPair(playerCards) && playerCards.length === 2) {
    const pairValue = playerCards[0].rank === 'A' ? 11 : Math.min(10, parseInt(playerCards[0].rank) || 10);
    const pairAction = strat.pairs[pairValue]?.[dealerUp];
    if (pairAction) {
      chartAction = pairAction;
      handType = 'pairs';
      playerTotal = pairValue;
      return buildAdvice(chartAction, handType, playerTotal, dealerUp, canDouble, canSplit, canSurrender, rules, trueCount);
    }
  }

  // Check soft totals
  if (hv.isSoft && hv.total >= 13 && hv.total <= 20) {
    const softAction = strat.soft[hv.total]?.[dealerUp];
    if (softAction) {
      chartAction = softAction;
      handType = 'soft';
      playerTotal = hv.total;
      return buildAdvice(chartAction, handType, playerTotal, dealerUp, canDouble, canSplit, canSurrender, rules, trueCount);
    }
  }

  // Hard totals
  const lookupTotal = Math.min(hv.total, 21);
  chartAction = strat.hard[lookupTotal]?.[dealerUp] ?? 'H';
  handType = 'hard';
  playerTotal = lookupTotal;
  return buildAdvice(chartAction, handType, playerTotal, dealerUp, canDouble, canSplit, canSurrender, rules, trueCount);
}
```

- [ ] **Step 3: Add `buildAdvice` helper function**

Add this new function in `src/strategy/advisor.ts` (above `getCorrectAction`):

```ts
function buildAdvice(
  chartAction: ChartAction,
  handType: 'hard' | 'soft' | 'pairs',
  playerTotal: number,
  dealerUp: number,
  canDouble: boolean,
  canSplit: boolean,
  canSurrender: boolean,
  rules: RuleSet,
  trueCount?: number | null,
): StrategyAdvice {
  let finalChartAction = chartAction;
  let isDeviation = false;
  let deviationThreshold: number | undefined;

  // Check for deviation override when true count is provided
  if (trueCount != null) {
    const deviations = getDeviations(rules);
    const deviation = findDeviation(deviations, handType, playerTotal, dealerUp, trueCount);
    if (deviation) {
      finalChartAction = deviation.action;
      isDeviation = true;
      deviationThreshold = deviation.threshold;
    }
  }

  const correctAction = resolveAction(finalChartAction, canDouble, canSplit, canSurrender, rules);
  return {
    correctAction,
    chartAction: finalChartAction,
    handType,
    playerTotal,
    dealerUpcard: dealerUp,
    isDeviation,
    deviationThreshold,
  };
}
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/strategy/advisor.ts
git commit -m "feat: integrate deviation lookup into strategy advisor"
```

---

### Task 5: Wire up true count in GameTable

**Files:**
- Modify: `src/components/game/GameTable.tsx`

- [ ] **Step 1: Import `computeTrueCount` and update `checkStrategy`**

Add import at top of `GameTable.tsx`:

```ts
import { computeTrueCount } from '../../engine/counting';
```

Update the `checkStrategy` callback (around line 317-322) to pass true count when deviations are enabled:

```ts
  const checkStrategy = useCallback((): StrategyAdvice | null => {
    const hand = game.getActiveHand();
    const upcard = game.getDealerUpcard();
    if (!hand || !upcard || !strategyRef.current) return null;

    let tc: number | null = null;
    if (rules.useDeviations && rules.showCount !== 'off') {
      const rc = useCountStore.getState().runningCount;
      const cardsDealt = game.shoeSize - game.shoe.length;
      tc = computeTrueCount(rc, game.shoeSize, cardsDealt);
    }

    return getCorrectAction(hand.cards, upcard, rules, game.canDouble(), game.canSplit(), game.canSurrender(), strategyRef.current, tc);
  }, [game, rules]);
```

- [ ] **Step 2: Pass deviation info to StrategyModal**

Update the StrategyModal usage (around line 678-691) to pass deviation props:

```tsx
        <StrategyModal
          isOpen={modalOpen}
          playerAction={modalData.playerAction}
          correctAction={modalData.advice.correctAction}
          handType={modalData.advice.handType}
          playerTotal={modalData.advice.playerTotal}
          dealerUpcard={modalData.advice.dealerUpcard}
          isDeviation={modalData.advice.isDeviation}
          deviationThreshold={modalData.advice.deviationThreshold}
          onClose={handleModalClose}
          onForceCorrect={rules.wrongMoveAction === 'block' ? handleForceCorrect : undefined}
          onPlayAnyways={rules.wrongMoveAction === 'block' ? handlePlayAnyways : undefined}
          blockMode={rules.wrongMoveAction === 'block'}
        />
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: May fail until StrategyModal accepts the new props (Task 7). That's fine — continue to next task.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/GameTable.tsx
git commit -m "feat: pass true count to advisor and deviation info to modal"
```

---

### Task 6: Add "Use Deviations" toggle to Settings Modal

**Files:**
- Modify: `src/components/game/SettingsModal.tsx`

- [ ] **Step 1: Add toggle in the Training section**

In `src/components/game/SettingsModal.tsx`, inside the `{/* Training */}` section (after the "Wrong Move" `SelectRow`, around line 130), add the deviations toggle. Replace `last` on the Wrong Move row and add the new toggle:

Change line ~129 from:
```tsx
                    last
```
to remove `last` from the Wrong Move SelectRow, then add after the closing `/>` of Wrong Move:

```tsx
                  <ToggleRow
                    label="Use Deviations"
                    checked={rules.useDeviations}
                    onChange={v => setRules({ useDeviations: v })}
                    disabled={rules.showCount === 'off' || rules.numDecks < 4}
                    last
                  />
```

- [ ] **Step 2: Add `disabled` prop to `ToggleRow`**

Update the `ToggleRow` function (around line 305) to accept and use a `disabled` prop:

```tsx
function ToggleRow({ label, checked, onChange, last, disabled }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${disabled ? '' : 'cursor-pointer hover:bg-white/[0.02]'} transition-colors`}
      style={{
        padding: 'var(--row-padding)',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
        opacity: disabled ? 0.35 : 1,
      }}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
      <div
        className="relative shrink-0 transition-all duration-200"
        style={{
          width: 'var(--toggle-w)', height: 'var(--toggle-h)',
          marginLeft: 'var(--space-md)',
          borderRadius: 9999,
          background: checked && !disabled ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.1)',
          border: checked && !disabled ? '1.5px solid rgba(245,158,11,0.7)' : '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: checked && !disabled ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
        }}
      >
        <span
          className="absolute transition-transform duration-200"
          style={{
            top: 'var(--toggle-inset)', left: 'var(--toggle-inset)',
            width: 'var(--toggle-knob)', height: 'var(--toggle-knob)',
            borderRadius: 9999,
            background: checked && !disabled ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            transform: checked && !disabled ? 'translateX(calc(var(--toggle-w) - var(--toggle-knob) - var(--toggle-inset) * 2))' : 'translateX(0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/SettingsModal.tsx
git commit -m "feat: add Use Deviations toggle to settings modal"
```

---

### Task 7: Show deviation context in StrategyModal feedback

**Files:**
- Modify: `src/components/feedback/StrategyModal.tsx`

- [ ] **Step 1: Add deviation props to StrategyModal**

Update the `StrategyModalProps` interface and destructuring:

```ts
interface StrategyModalProps {
  isOpen: boolean;
  playerAction: FinalAction;
  correctAction: FinalAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  isDeviation?: boolean;
  deviationThreshold?: number;
  onClose: () => void;
  onForceCorrect?: () => void;
  onPlayAnyways?: () => void;
  blockMode: boolean;
}
```

Update the destructuring in the component function:

```ts
export default function StrategyModal({
  isOpen,
  playerAction,
  correctAction,
  handType,
  playerTotal,
  dealerUpcard,
  isDeviation,
  deviationThreshold,
  onClose,
  onForceCorrect,
  onPlayAnyways,
  blockMode,
}: StrategyModalProps) {
```

- [ ] **Step 2: Show deviation badge in the "Correct play" row**

In the "Correct play" green row (around line 115-127), update to show the deviation context. Replace the correct play `<div>` block:

```tsx
              <div
                className="flex justify-between items-center"
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16,185,129,0.10)',
                  border: '1px solid rgba(16,185,129,0.18)',
                }}
              >
                <span className="text-emerald-300/80 font-medium" style={{ fontSize: 'var(--text-base)' }}>Correct play</span>
                <div className="flex items-center gap-3">
                  {isDeviation && deviationThreshold != null && (
                    <span
                      className="font-bold"
                      style={{
                        fontSize: 'var(--text-sm)',
                        padding: '2px 10px',
                        borderRadius: '8px',
                        background: 'rgba(251,191,36,0.15)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        color: 'rgba(251,191,36,0.9)',
                      }}
                    >
                      TC {deviationThreshold >= 0 ? '+' : ''}{deviationThreshold}
                    </span>
                  )}
                  <span className="text-emerald-400 font-black" style={{ fontSize: 'var(--text-base)' }}>{ACTION_LABELS[correctAction]}</span>
                </div>
              </div>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/feedback/StrategyModal.tsx
git commit -m "feat: show deviation context (TC threshold) in strategy feedback modal"
```

---

### Task 8: Show true count in RunningCount component

**Files:**
- Modify: `src/components/game/RunningCount.tsx`

- [ ] **Step 1: Update RunningCount props and add true count display**

Update the component to accept and display the true count. Update props interface:

```ts
interface RunningCountProps {
  mode: 'always' | 'hover';
  trueCount?: number | null;  // null or undefined = don't show TC
}
```

Update the function signature:

```ts
export default function RunningCount({ mode, trueCount }: RunningCountProps) {
```

After the existing count display `<div>` (after the `AnimatePresence` block, around line 89), and before the "Hover to reveal" text, add the true count display. Insert between the main count display and the hover text:

```tsx
      {trueCount != null && revealed && (
        <div
          className="flex items-center justify-center gap-2"
          style={{ marginTop: 'var(--space-sm)' }}
        >
          <span
            className="uppercase tracking-[0.12em] leading-none"
            style={{ color: 'rgba(255,255,255,0.30)', fontSize: 'var(--text-sm)', fontWeight: 700 }}
          >
            TC
          </span>
          <span
            className={`font-black leading-none ${
              trueCount > 0 ? 'text-emerald-400' : trueCount < 0 ? 'text-rose-400' : 'text-white/70'
            }`}
            style={{ fontSize: 'clamp(18px, min(2.5vw, 2.5vh), 28px)' }}
          >
            {trueCount > 0 ? '+' : trueCount < 0 ? '−' : ''}{Math.abs(trueCount)}
          </span>
        </div>
      )}
```

- [ ] **Step 2: Update RunningCount caller in GameTable**

In `GameTable.tsx`, find where `RunningCount` is rendered and pass the `trueCount` prop. Search for `<RunningCount` and update it:

```tsx
<RunningCount
  mode={rules.showCount as 'always' | 'hover'}
  trueCount={rules.useDeviations ? computeTrueCount(
    useCountStore.getState().runningCount,
    game.shoeSize,
    game.shoeSize - game.shoe.length
  ) : null}
/>
```

Note: Since `RunningCount` already subscribes to `countStore` for the running count, and it re-renders on count changes, the true count will also update. However, `game.shoe.length` and `game.shoeSize` need to come from the game store. Check how `RunningCount` is rendered in `GameTable.tsx` — the game state is already available there. Pass the computed TC directly.

Alternatively, compute TC once in GameTable and pass it down:

In GameTable, add a derived value near the top of the component (after the store hooks):

```ts
  const currentTrueCount = rules.useDeviations && rules.showCount !== 'off'
    ? computeTrueCount(useCountStore.getState().runningCount, game.shoeSize, game.shoeSize - game.shoe.length)
    : null;
```

But this won't reactively update when `runningCount` changes since it uses `getState()`. Instead, subscribe to the running count in GameTable:

```ts
  const runningCount = useCountStore(s => s.runningCount);
  const currentTrueCount = rules.useDeviations && rules.showCount !== 'off'
    ? computeTrueCount(runningCount, game.shoeSize, game.shoeSize - game.shoe.length)
    : null;
```

Then pass to RunningCount:

```tsx
<RunningCount mode={rules.showCount as 'always' | 'hover'} trueCount={currentTrueCount} />
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/RunningCount.tsx src/components/game/GameTable.tsx
git commit -m "feat: display true count in RunningCount when deviations enabled"
```

---

### Task 9: Transcribe BJA deviation data from PDFs

**Files:**
- Modify: `src/strategy/deviations.ts`

This is the critical data integrity task. Follow CLAUDE.md rules strictly.

- [ ] **Step 1: Convert BJA PDFs to PNG for reading**

```bash
POPPLER_BIN="C:/Users/gordo/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin"
"$POPPLER_BIN/pdftoppm.exe" -png -r 200 "src/strategy/BJA_H17.pdf" "/tmp/bja_h17"
"$POPPLER_BIN/pdftoppm.exe" -png -r 200 "src/strategy/BJA_S17.pdf" "/tmp/bja_s17"
```

- [ ] **Step 2: Read and transcribe H17 deviations**

Read the H17 PNG. For each deviation cell in the chart, create a `Deviation` entry. Go row by row, column by column. Verify each entry's `(handType, playerTotal, dealerUp, threshold, direction, action)` against the source image.

Replace the empty `H17_DEVIATIONS` array with the transcribed data.

- [ ] **Step 3: Read and transcribe S17 deviations**

Read the S17 PNG. Same process as H17. Replace the empty `S17_DEVIATIONS` array.

- [ ] **Step 4: Cross-verify at least 10 specific entries**

Pick 10 deviation entries (5 from H17, 5 from S17) and re-check each one against the source PDF image. Verify hand type, player total, dealer upcard, TC threshold, direction, and action are all correct.

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/strategy/deviations.ts
git commit -m "feat: transcribe BJA H17 and S17 deviation data from source PDFs"
```

---

### Task 10: End-to-end verification

- [ ] **Step 1: Build verification**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 2: Manual smoke test checklist**

Run `npm run dev` and verify:

1. Open Settings → Training section shows "Use Deviations" toggle
2. Toggle is disabled when Running Count is "Off"
3. Toggle is disabled when deck count is 1 or 2
4. Enable deviations (set count to "Always Visible" first, 6 decks)
5. RunningCount component now shows "TC" value below the running count
6. Play hands — when basic strategy applies, grading works normally
7. Force a known deviation scenario (if possible via repeated play) and verify the modal shows "TC +N" badge

- [ ] **Step 3: Commit any fixes**

If any issues found during testing, fix and commit.

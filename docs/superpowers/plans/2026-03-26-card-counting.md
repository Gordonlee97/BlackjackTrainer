# Card Counting (Hi-Lo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Hi-Lo running count display to the top-left of the game screen that updates in real-time as cards are dealt and revealed.

**Architecture:** A pure engine module (`engine/counting.ts`) computes Hi-Lo values from cards. A new Zustand store (`store/countStore.ts`) tracks the running count, updating whenever cards are dealt or revealed. A `RunningCount` component renders the count in the GameTable top bar. A toggle in RuleSet and SetupPage lets users enable/disable the feature.

**Tech Stack:** React, TypeScript, Zustand, Framer Motion (for count change animation), Tailwind CSS

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/engine/counting.ts` | Pure Hi-Lo value function: card → +1/0/−1 |
| Create | `src/store/countStore.ts` | Zustand store: running count, reset, batch-update from cards |
| Create | `src/components/game/RunningCount.tsx` | UI badge displaying running count with color + animation |
| Modify | `src/strategy/types.ts:15-25` | Add `showCount: boolean` to `RuleSet` |
| Modify | `src/store/gameStore.ts:89-212` | Call count store on deal, reshuffle |
| Modify | `src/store/gameStore.ts:214-239` | Call count store on hit |
| Modify | `src/store/gameStore.ts:254-279` | Call count store on double |
| Modify | `src/store/gameStore.ts:281-333` | Call count store on split |
| Modify | `src/store/gameStore.ts:417-482` | Call count store on dealer play |
| Modify | `src/components/game/GameTable.tsx:158-220` | Add `RunningCount` to top bar left section |
| Modify | `src/components/setup/SetupPage.tsx:89-92` | Add "Show Running Count" toggle in Display & Audio section |

---

### Task 1: Hi-Lo Engine Module

**Files:**
- Create: `src/engine/counting.ts`

- [ ] **Step 1: Create the Hi-Lo value function**

```typescript
// src/engine/counting.ts
import type { Card } from './types';
import { RANK_VALUES } from './types';

/**
 * Hi-Lo card counting value:
 *   2-6  → +1 (low cards)
 *   7-9  →  0 (neutral)
 *   10-A → −1 (high cards)
 */
export function hiLoValue(card: Card): number {
  const v = RANK_VALUES[card.rank];
  if (v >= 2 && v <= 6) return 1;
  if (v >= 7 && v <= 9) return 0;
  return -1; // 10, J, Q, K, A (value 10 or 11)
}
```

- [ ] **Step 2: Verify the module compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/counting.ts
git commit -m "feat: add Hi-Lo card counting engine module"
```

---

### Task 2: Count Store

**Files:**
- Create: `src/store/countStore.ts`

- [ ] **Step 1: Create the Zustand count store**

```typescript
// src/store/countStore.ts
import { create } from 'zustand';
import type { Card } from '../engine/types';
import { hiLoValue } from '../engine/counting';

interface CountState {
  runningCount: number;
  updateCount: (cards: Card[]) => void;
  resetCount: () => void;
}

export const useCountStore = create<CountState>((set) => ({
  runningCount: 0,

  updateCount: (cards) =>
    set((state) => ({
      runningCount: state.runningCount + cards.reduce((sum, c) => sum + hiLoValue(c), 0),
    })),

  resetCount: () => set({ runningCount: 0 }),
}));
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/store/countStore.ts
git commit -m "feat: add Zustand count store for Hi-Lo running count"
```

---

### Task 3: Add `showCount` to RuleSet

**Files:**
- Modify: `src/strategy/types.ts:15-46`

- [ ] **Step 1: Add `showCount` to the `RuleSet` interface**

In `src/strategy/types.ts`, add `showCount: boolean;` after the `soundVolume` line (line 24):

```typescript
export interface RuleSet {
  numDecks: 1 | 2 | 4 | 6 | 8;
  dealerHitsSoft17: boolean;
  dasAllowed: boolean;
  surrenderAllowed: boolean;
  hitSplitAces: boolean;
  practiceMode: 'all' | 'hard' | 'soft' | 'splits';
  wrongMoveAction: 'execute' | 'block';
  showHandTotals: boolean;
  soundVolume: number; // 0–100
  showCount: boolean;
}
```

- [ ] **Step 2: Add default value in `DEFAULT_RULES`**

Add `showCount: false,` after `soundVolume: 50,`:

```typescript
export const DEFAULT_RULES: RuleSet = {
  numDecks: 6,
  dealerHitsSoft17: false,
  dasAllowed: true,
  surrenderAllowed: true,
  hitSplitAces: false,
  practiceMode: 'all',
  wrongMoveAction: 'execute',
  showHandTotals: true,
  soundVolume: 50,
  showCount: false,
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/strategy/types.ts
git commit -m "feat: add showCount setting to RuleSet"
```

---

### Task 4: Wire Count Updates into Game Store

**Files:**
- Modify: `src/store/gameStore.ts`

The count store must update whenever face-up cards enter play. The key integration points are:

1. **`deal()`** — 3 face-up cards dealt (player card 1, player card 2, dealer upcard). The dealer hole card is face-down, so it should NOT be counted yet.
2. **`hit()`** — 1 face-up card drawn.
3. **`double()`** — 1 face-up card drawn.
4. **`split()`** — 2 face-up cards drawn.
5. **`playDealer()`** — dealer hole card revealed + any dealer draw cards.
6. **Reshuffle** — reset count to 0 when shoe is reshuffled (in `deal()` and `initGame()`).

- [ ] **Step 1: Add count store import to gameStore.ts**

At the top of `src/store/gameStore.ts`, after the existing imports (after line 6), add:

```typescript
import { useCountStore } from './countStore';
```

- [ ] **Step 2: Reset count on `initGame()`**

In the `initGame` action (around line 70), add a count reset after `set({...})`:

```typescript
  initGame: (rules) => {
    const numCards = rules.numDecks * 52;
    const shoe = createShoe(rules.numDecks);
    set({
      rules,
      shoe,
      shoeSize: numCards,
      balance: INITIAL_BALANCE,
      phase: 'betting',
      message: 'Place your bet',
    });
    useCountStore.getState().resetCount();
  },
```

- [ ] **Step 3: Update count in `deal()` — reshuffle reset + initial cards**

In the `deal` action, add count reset when reshuffling (after `shoe = createShoe(rules.numDecks);` around line 100):

```typescript
    if (needsReshuffle(shoe, shoeSize)) {
      shoe = createShoe(rules.numDecks);
      useCountStore.getState().resetCount();
    }
```

At the end of `deal()`, after the `set({...})` calls for both the natural-blackjack path and the standard path, count the face-up cards. For the natural blackjack path (where all cards are revealed), count all 4 cards. For the standard path, count the 3 face-up cards (both player cards + dealer upcard, NOT the dealer hole card).

After the natural blackjack `set({...})` block (after `return;` around line 199), add before the return:

```typescript
      // Count all 4 cards (all revealed on natural)
      useCountStore.getState().updateCount([...playerCards, ...dealerCards]);
      return;
```

After the standard path `set({...})` block (around line 211), add:

```typescript
    // Count 3 face-up cards: both player cards + dealer upcard (index 1)
    useCountStore.getState().updateCount([playerCards[0], playerCards[1], dealerCards[1]]);
```

- [ ] **Step 4: Update count in `hit()`**

After `hand.cards = [...hand.cards, card];` (around line 220), add:

```typescript
    useCountStore.getState().updateCount([card]);
```

- [ ] **Step 5: Update count in `double()`**

After `hand.cards = [...hand.cards, card];` (around line 260), add:

```typescript
    useCountStore.getState().updateCount([card]);
```

- [ ] **Step 6: Update count in `split()`**

After drawing the two new cards (after `shoe = result.shoe;` around line 297), add:

```typescript
    useCountStore.getState().updateCount([newCard1, newCard2]);
```

- [ ] **Step 7: Update count in `playDealer()`**

The `playDealer()` function reveals the hole card and draws additional cards. We need to count:
1. The dealer's hole card (index 0, which was face-down until now)
2. All newly drawn dealer cards

After the dealer draw loop completes (after the `while(true)` loop around line 439), and before settlement, add:

```typescript
  // Count dealer hole card (was face-down) + any drawn cards
  // Original dealer hand had 2 cards; new cards start at index 2
  const holeCard = store.dealerHand.cards[0];
  const drawnCards = dealerHand.cards.slice(2);
  useCountStore.getState().updateCount([holeCard, ...drawnCards]);
```

- [ ] **Step 8: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/store/gameStore.ts
git commit -m "feat: wire Hi-Lo count updates into all game actions"
```

---

### Task 5: RunningCount Component

**Files:**
- Create: `src/components/game/RunningCount.tsx`

- [ ] **Step 1: Create the RunningCount display component**

This component shows the running count as a badge in the top bar. It uses color coding:
- Positive count (deck favors player): emerald/green
- Zero: neutral white
- Negative count (deck favors dealer): rose/red

It animates count changes with a subtle scale pulse via Framer Motion.

```typescript
// src/components/game/RunningCount.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useCountStore } from '../../store/countStore';

export default function RunningCount() {
  const count = useCountStore((s) => s.runningCount);

  const color =
    count > 0
      ? 'text-emerald-400'
      : count < 0
        ? 'text-rose-400'
        : 'text-white/70';

  const bgColor =
    count > 0
      ? 'rgba(16,185,129,0.12)'
      : count < 0
        ? 'rgba(244,63,94,0.12)'
        : 'rgba(255,255,255,0.06)';

  const borderColor =
    count > 0
      ? 'rgba(16,185,129,0.25)'
      : count < 0
        ? 'rgba(244,63,94,0.25)'
        : 'rgba(255,255,255,0.10)';

  const displayCount = count > 0 ? `+${count}` : String(count);

  return (
    <div
      className="flex flex-col items-center rounded-xl"
      style={{
        padding: '8px 18px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        minWidth: '72px',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest leading-none mb-1.5"
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}
      >
        Count
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          className={`text-2xl font-black leading-none ${color}`}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {displayCount}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/game/RunningCount.tsx
git commit -m "feat: add RunningCount display component with color-coded animation"
```

---

### Task 6: Integrate RunningCount into GameTable Top Bar

**Files:**
- Modify: `src/components/game/GameTable.tsx:1-220`

- [ ] **Step 1: Add import for RunningCount**

In `src/components/game/GameTable.tsx`, after the `SettingsModal` import (line 19), add:

```typescript
import RunningCount from './RunningCount';
```

- [ ] **Step 2: Add RunningCount to the top bar left section**

In the top bar left section (around line 164), add the `RunningCount` component after the Charts button, conditionally rendered based on `rules.showCount`. Since this is inside a flex container with `gap-3`, adding/removing it won't shift other flex items problematically (the left section is `shrink-0` and left-aligned, not centered).

Replace the left section `<div>` (lines 164-194):

```tsx
        {/* Left: Settings + Charts + Count */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span className="leading-none" style={{ fontSize: '18px' }}>⚙</span>
            <span>Settings</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setChartOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span className="leading-none" style={{ fontSize: '18px' }}>♠</span>
            <span>Charts</span>
          </motion.button>

          {rules.showCount && <RunningCount />}
        </div>
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/game/GameTable.tsx
git commit -m "feat: integrate RunningCount badge into game table top bar"
```

---

### Task 7: Add Toggle to SetupPage

**Files:**
- Modify: `src/components/setup/SetupPage.tsx:89-92`

- [ ] **Step 1: Add "Show Running Count" toggle to Display & Audio section**

In `src/components/setup/SetupPage.tsx`, in the "Display & Audio" section (around line 89-92), add a new `ToggleRow` between "Show Hand Totals" and "Sound Volume":

Replace lines 89-92:

```tsx
          <Section label="Display & Audio">
            <ToggleRow label="Show Hand Totals" checked={rules.showHandTotals} onChange={(v) => setRules({ showHandTotals: v })} />
            <ToggleRow label="Show Running Count (Hi-Lo)" checked={rules.showCount} onChange={(v) => setRules({ showCount: v })} />
            <SliderRow label="Sound Volume" value={rules.soundVolume} onChange={(v) => setRules({ soundVolume: v })} last />
          </Section>
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/setup/SetupPage.tsx
git commit -m "feat: add Show Running Count toggle to setup page"
```

---

### Task 8: Full Build Verification

**Files:** (none — verification only)

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with zero errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Test the following:

1. Open the app in browser at `http://localhost:5173`
2. On the Setup page, enable "Show Running Count (Hi-Lo)" toggle
3. Click "Start Training"
4. Verify the running count badge appears in the top-left bar area, after the Charts button
5. Place a bet and deal — count should update (3 face-up cards counted)
6. Hit a few times — count should change with each card
7. Let dealer play — count should update when hole card is revealed and dealer draws
8. Start a new hand — count should persist across hands (NOT reset)
9. Wait for shoe reshuffle (play many hands or use 1-deck) — count should reset to 0
10. Go back to setup, disable the toggle — count badge should disappear from the game screen
11. Verify positive counts show green, negative show red, zero shows neutral

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during smoke testing"
```

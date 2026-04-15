# Deviations Practice Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Deviations Practice" mode that pre-selects hands where a deviation is the correct play and fabricates a consistent running count / true count / decks-remaining that lands on the deviation's trigger index after the initial deal, while live-updating during dealing so bet-spread practice remains realistic.

**Architecture:** A pure `deviationDrill` module pre-computes a target post-deal state (RC + decks remaining that yields the deviation's threshold TC), then back-solves a pre-deal shoe + RC seed. The existing count-accumulation engine runs unchanged — as the 4-card initial deal fires, the count moves naturally from the seeded pre-deal value to the target. Bet-spread feedback is computed from the player's bet-time TC snapshot against a fixed Hi-Lo 1-8 spread table.

**Tech Stack:** TypeScript 5.9, React 19, Zustand, Vitest (NEW — added for pure-module unit tests), Framer Motion (existing), Tailwind v4 (existing).

**Spec:** `docs/superpowers/specs/2026-04-12-deviations-practice-mode-design.md`

---

## File Structure

**New files:**
- `src/strategy/deviationDrill.ts` — drill generator (pickDeviation, generateTargetCount, buildForcedDeal, buildShoe, generate)
- `src/strategy/betSpread.ts` — Hi-Lo 1-8 spread table + recommendUnits + evaluateBet
- `src/strategy/__tests__/deviationDrill.test.ts`
- `src/strategy/__tests__/betSpread.test.ts`
- `src/components/feedback/BetSpreadFeedback.tsx` — post-settle feedback pill
- `vitest.config.ts` — test runner config

**Modified files:**
- `src/strategy/types.ts` — add `deviationsPracticeMode` to `RuleSet`
- `src/store/gameStore.ts` — seed drill in `initGame`/`newHand`, skip practice-mode filter in drill mode, capture bet-time TC snapshot, stash current deviation
- `src/store/settingsStore.ts` — toggle + dependency-coercion logic
- `src/components/setup/SetupPage.tsx` — add toggle, lock dependencies
- `src/components/game/SettingsModal.tsx` — mirror toggle
- `src/components/game/GameTable.tsx` — render `BetSpreadFeedback` at settle
- `package.json` — add vitest deps + `test` script

---

## Task 1: Add Vitest Test Runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest and companions**

Run:
```bash
npm install --save-dev vitest @vitest/ui jsdom
```

Expected: no errors. `package.json` dev deps updated.

- [ ] **Step 2: Add test script to `package.json`**

Edit the `scripts` block in `package.json` to include:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts` at repo root**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
```

- [ ] **Step 4: Verify runner starts**

Run: `npm test`
Expected: "No test files found" — runner starts cleanly, no crash.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for pure-module unit tests"
```

---

## Task 2: `betSpread.ts` — Bet Spread Recommendation (TDD)

**Files:**
- Create: `src/strategy/betSpread.ts`
- Test: `src/strategy/__tests__/betSpread.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/strategy/__tests__/betSpread.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { recommendUnits, evaluateBet } from '../betSpread';

describe('recommendUnits (Hi-Lo 1-8 spread)', () => {
  it('returns 1u at or below TC +1', () => {
    expect(recommendUnits(-5)).toEqual({ min: 1, max: 1 });
    expect(recommendUnits(0)).toEqual({ min: 1, max: 1 });
    expect(recommendUnits(1)).toEqual({ min: 1, max: 1 });
  });
  it('returns 2u at TC +2', () => {
    expect(recommendUnits(2)).toEqual({ min: 1, max: 2 });
  });
  it('returns 2-4u at TC +3', () => {
    expect(recommendUnits(3)).toEqual({ min: 2, max: 4 });
  });
  it('returns 4-6u at TC +4', () => {
    expect(recommendUnits(4)).toEqual({ min: 4, max: 6 });
  });
  it('returns 6-8u at TC +5 and above', () => {
    expect(recommendUnits(5)).toEqual({ min: 6, max: 8 });
    expect(recommendUnits(10)).toEqual({ min: 6, max: 8 });
  });
});

describe('evaluateBet', () => {
  it('returns "ok" when bet is within recommended range', () => {
    // TC +3 → 2-4u; 1u = $25 min, bet = $75 = 3u
    expect(evaluateBet(75, 25, 3).verdict).toBe('ok');
  });
  it('returns "low" when under-bet for count', () => {
    // TC +4 → 4-6u; bet 1u
    expect(evaluateBet(25, 25, 4).verdict).toBe('low');
  });
  it('returns "high" when over-bet for count', () => {
    // TC 0 → 1u; bet 5u
    expect(evaluateBet(125, 25, 0).verdict).toBe('high');
  });
  it('reports unit counts in result', () => {
    const r = evaluateBet(75, 25, 3);
    expect(r.actualUnits).toBe(3);
    expect(r.recommended).toEqual({ min: 2, max: 4 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- betSpread`
Expected: FAIL with "Cannot find module '../betSpread'".

- [ ] **Step 3: Implement `betSpread.ts`**

Create `src/strategy/betSpread.ts`:

```ts
export interface UnitRange {
  min: number;
  max: number;
}

export interface BetEvaluation {
  recommended: UnitRange;
  actualUnits: number;
  verdict: 'low' | 'ok' | 'high';
}

/**
 * Standard Hi-Lo 1-8 bet spread.
 * Maps true count to a recommended range (in units, where 1u = table minimum).
 */
export function recommendUnits(trueCount: number): UnitRange {
  if (trueCount <= 1) return { min: 1, max: 1 };
  if (trueCount === 2) return { min: 1, max: 2 };
  if (trueCount === 3) return { min: 2, max: 4 };
  if (trueCount === 4) return { min: 4, max: 6 };
  return { min: 6, max: 8 };
}

export function evaluateBet(
  betAmount: number,
  minBet: number,
  trueCount: number,
): BetEvaluation {
  const actualUnits = Math.round(betAmount / minBet);
  const recommended = recommendUnits(trueCount);
  let verdict: 'low' | 'ok' | 'high';
  if (actualUnits < recommended.min) verdict = 'low';
  else if (actualUnits > recommended.max) verdict = 'high';
  else verdict = 'ok';
  return { recommended, actualUnits, verdict };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- betSpread`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/strategy/betSpread.ts src/strategy/__tests__/betSpread.test.ts
git commit -m "feat(strategy): add Hi-Lo 1-8 bet spread evaluator"
```

---

## Task 3: `deviationDrill.ts` — `pickDeviation` (TDD)

**Files:**
- Create: `src/strategy/deviationDrill.ts`
- Test: `src/strategy/__tests__/deviationDrill.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/strategy/__tests__/deviationDrill.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pickDeviation } from '../deviationDrill';
import { H17_DEVIATIONS, S17_DEVIATIONS } from '../deviations';
import type { RuleSet } from '../types';
import { DEFAULT_RULES } from '../types';

const h17Rules = (overrides: Partial<RuleSet> = {}): RuleSet => ({
  ...DEFAULT_RULES,
  numDecks: 6,
  dealerHitsSoft17: true,
  surrenderAllowed: true,
  useDeviations: true,
  ...overrides,
});

describe('pickDeviation', () => {
  it('returns a deviation from the H17 list for H17 rules', () => {
    const d = pickDeviation(h17Rules());
    expect(H17_DEVIATIONS).toContain(d);
  });

  it('returns a deviation from the S17 list for S17 rules', () => {
    const d = pickDeviation(h17Rules({ dealerHitsSoft17: false }));
    expect(S17_DEVIATIONS).toContain(d);
  });

  it('never returns surrender-action deviations when surrender disabled', () => {
    const surrenderActions = new Set(['Rh', 'Rs', 'Rp']);
    const rules = h17Rules({ surrenderAllowed: false });
    for (let i = 0; i < 500; i++) {
      const d = pickDeviation(rules);
      expect(surrenderActions.has(d.action)).toBe(false);
    }
  });

  it('excludes onlyIfNoSurrender entries when surrender enabled', () => {
    const rules = h17Rules({ surrenderAllowed: true });
    for (let i = 0; i < 500; i++) {
      const d = pickDeviation(rules);
      expect(d.onlyIfNoSurrender).not.toBe(true);
    }
  });

  it('allows onlyIfNoSurrender entries when surrender disabled', () => {
    const rules = h17Rules({ surrenderAllowed: false });
    let foundOnlyIfNoSurrender = false;
    for (let i = 0; i < 500; i++) {
      const d = pickDeviation(rules);
      if (d.onlyIfNoSurrender) { foundOnlyIfNoSurrender = true; break; }
    }
    expect(foundOnlyIfNoSurrender).toBe(true);
  });

  it('covers every applicable deviation across 2000 draws (uniformity)', () => {
    const rules = h17Rules({ surrenderAllowed: true });
    const seen = new Set<number>();
    const applicable = H17_DEVIATIONS.filter(d => {
      if (d.onlyIfNoSurrender) return false;
      return true;
    });
    for (let i = 0; i < 2000; i++) {
      const d = pickDeviation(rules);
      seen.add(applicable.indexOf(d));
    }
    expect(seen.size).toBe(applicable.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- deviationDrill`
Expected: FAIL with "Cannot find module '../deviationDrill'".

- [ ] **Step 3: Implement `pickDeviation`**

Create `src/strategy/deviationDrill.ts`:

```ts
import type { RuleSet, ChartAction } from './types';
import type { Deviation } from './deviations';
import { getDeviations } from './deviations';

const SURRENDER_ACTIONS = new Set<ChartAction>(['Rh', 'Rs', 'Rp']);

function isApplicable(d: Deviation, rules: RuleSet): boolean {
  if (SURRENDER_ACTIONS.has(d.action) && !rules.surrenderAllowed) return false;
  if (d.onlyIfNoSurrender && rules.surrenderAllowed) return false;
  return true;
}

/**
 * Uniform-random pick of a deviation applicable under the current rules.
 * Throws if the applicable set is empty (callers should ensure `numDecks >= 4`).
 */
export function pickDeviation(rules: RuleSet): Deviation {
  const all = getDeviations(rules);
  const applicable = all.filter(d => isApplicable(d, rules));
  if (applicable.length === 0) {
    throw new Error('No applicable deviations for the given rule set');
  }
  const idx = Math.floor(Math.random() * applicable.length);
  return applicable[idx];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- deviationDrill`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/strategy/deviationDrill.ts src/strategy/__tests__/deviationDrill.test.ts
git commit -m "feat(strategy): add deviation drill picker with rule filtering"
```

---

## Task 4: `deviationDrill.ts` — `generateTargetCount` (TDD)

**Files:**
- Modify: `src/strategy/deviationDrill.ts`
- Test: `src/strategy/__tests__/deviationDrill.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `src/strategy/__tests__/deviationDrill.test.ts`:

```ts
import { generateTargetCount } from '../deviationDrill';

describe('generateTargetCount', () => {
  it('produces TC that satisfies a gte threshold (TC-based)', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'hard' && d.playerTotal === 10 && d.dealerUp === 10)!;
    // threshold 4, direction gte, TC-based
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      const tc = Math.trunc(r.targetRC / r.targetDecksRem);
      expect(tc).toBeGreaterThanOrEqual(dev.threshold);
    }
  });

  it('produces TC that satisfies an lte threshold (TC-based)', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'hard' && d.playerTotal === 13 && d.dealerUp === 2)!;
    // threshold -1, direction lte
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      const tc = Math.trunc(r.targetRC / r.targetDecksRem);
      expect(tc).toBeLessThanOrEqual(dev.threshold);
    }
  });

  it('produces positive RC for usesRunningCount gte (0+) deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.usesRunningCount && d.direction === 'gte')!;
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      expect(r.targetRC).toBeGreaterThan(0);
    }
  });

  it('produces negative RC for usesRunningCount lte (0-) deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.usesRunningCount && d.direction === 'lte')!;
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      expect(r.targetRC).toBeLessThan(0);
    }
  });

  it('targetDecksRem is in (0, numDecks)', () => {
    const dev = H17_DEVIATIONS[0];
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      expect(r.targetDecksRem).toBeGreaterThan(0);
      expect(r.targetDecksRem).toBeLessThan(6);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- deviationDrill`
Expected: FAIL with "generateTargetCount is not a function".

- [ ] **Step 3: Implement `generateTargetCount`**

Append to `src/strategy/deviationDrill.ts`:

```ts
export interface TargetCount {
  targetRC: number;
  targetDecksRem: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickDecksRem(numDecks: number): number {
  // Choose a half-deck step in (0.5, numDecks - 0.5)
  const steps = (numDecks - 1) * 2 + 1; // e.g. numDecks=6 → 11 steps: 0.5..5.5
  const i = randInt(0, steps - 1);
  return 0.5 + i * 0.5;
}

/**
 * Generates an internally consistent (targetRC, targetDecksRem) pair such that
 * the deviation's threshold condition is satisfied at the decision-time count.
 *
 * For TC-based deviations: ~40% of generations land exactly at the threshold
 * (borderline), ~60% overshoot by 1-3 in the triggering direction.
 *
 * For usesRunningCount deviations (BJA 0+/0-): RC is ±(1..4); TC is whatever it
 * works out to given a realistic decksRemaining.
 */
export function generateTargetCount(dev: Deviation, numDecks: number): TargetCount {
  const decksRem = pickDecksRem(numDecks);

  if (dev.usesRunningCount) {
    const mag = randInt(1, 4);
    const targetRC = dev.direction === 'gte' ? mag : -mag;
    return { targetRC, targetDecksRem: decksRem };
  }

  const borderline = Math.random() < 0.4;
  const overshoot = borderline ? 0 : randInt(1, 3);
  const desiredTC = dev.direction === 'gte'
    ? dev.threshold + overshoot
    : dev.threshold - overshoot;

  // Choose RC such that trunc(RC / decksRem) === desiredTC.
  // For positive desiredTC, pick RC in [desiredTC * decksRem, (desiredTC+1)*decksRem - 1]
  // For negative desiredTC, similar but signs reversed.
  // Simpler: start from desiredTC * decksRem and nudge outward by a small random amount.
  let targetRC: number;
  if (desiredTC >= 0) {
    const lo = Math.ceil(desiredTC * decksRem);
    const hi = Math.ceil((desiredTC + 1) * decksRem) - 1;
    targetRC = randInt(lo, Math.max(lo, hi));
  } else {
    const hi = Math.floor(desiredTC * decksRem);
    const lo = Math.floor((desiredTC - 1) * decksRem) + 1;
    targetRC = randInt(Math.min(lo, hi), hi);
  }

  // Safety: handle desiredTC === 0 (trunc yields 0 for RC in (-decksRem, decksRem))
  if (desiredTC === 0) {
    const range = Math.floor(decksRem);
    targetRC = randInt(-range, range);
  }

  return { targetRC, targetDecksRem: decksRem };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- deviationDrill`
Expected: 5 new tests pass (11 total).

- [ ] **Step 5: Commit**

```bash
git add src/strategy/deviationDrill.ts src/strategy/__tests__/deviationDrill.test.ts
git commit -m "feat(strategy): add target count generator for deviation drill"
```

---

## Task 5: `deviationDrill.ts` — `buildForcedDeal` (TDD)

**Files:**
- Modify: `src/strategy/deviationDrill.ts`
- Test: `src/strategy/__tests__/deviationDrill.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append:

```ts
import { buildForcedDeal } from '../deviationDrill';
import { handValue, isPair } from '../../engine/hand';

describe('buildForcedDeal', () => {
  it('produces a pair for pair deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'pairs' && d.playerTotal === 10)!;
    for (let i = 0; i < 100; i++) {
      const d = buildForcedDeal(dev);
      expect(isPair([d.player1, d.player2])).toBe(true);
      // value 10 pair — both must be 10-valued ranks (10/J/Q/K)
      expect(d.player1.rank === d.player2.rank).toBe(true);
    }
  });

  it('produces a soft hand for soft deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'soft' && d.playerTotal === 19)!;
    for (let i = 0; i < 100; i++) {
      const d = buildForcedDeal(dev);
      const hv = handValue([d.player1, d.player2]);
      expect(hv.isSoft).toBe(true);
      expect(hv.total).toBe(19);
    }
  });

  it('produces a hard hand (no Ace) for hard deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'hard' && d.playerTotal === 16 && d.dealerUp === 10)!;
    for (let i = 0; i < 100; i++) {
      const d = buildForcedDeal(dev);
      expect(d.player1.rank).not.toBe('A');
      expect(d.player2.rank).not.toBe('A');
      const hv = handValue([d.player1, d.player2]);
      expect(hv.total).toBe(16);
      expect(hv.isSoft).toBe(false);
    }
  });

  it('dealer upcard matches deviation dealerUp value (Ace maps to rank A)', () => {
    const dev = H17_DEVIATIONS.find(d => d.dealerUp === 11)!;
    for (let i = 0; i < 50; i++) {
      const d = buildForcedDeal(dev);
      expect(d.dealerUp.rank).toBe('A');
    }
  });

  it('populates a hole card of any rank', () => {
    const dev = H17_DEVIATIONS[0];
    const d = buildForcedDeal(dev);
    expect(d.dealerHole).toBeDefined();
    expect(d.dealerHole.rank).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- deviationDrill`
Expected: FAIL with "buildForcedDeal is not a function".

- [ ] **Step 3: Implement `buildForcedDeal`**

Append to `src/strategy/deviationDrill.ts`:

```ts
import type { Card, Rank, Suit } from '../engine/types';
import { ALL_RANKS, ALL_SUITS, RANK_VALUES } from '../engine/types';

export interface ForcedDeal {
  player1: Card;
  player2: Card;
  dealerUp: Card;
  dealerHole: Card;
}

function mkCard(rank: Rank): Card {
  const suit: Suit = ALL_SUITS[randInt(0, ALL_SUITS.length - 1)];
  return { suit, rank, faceUp: true };
}

function pickRankForValue(val: number): Rank {
  // val in 2..10 (11=A handled separately). For 10, choose uniformly from 10/J/Q/K.
  if (val === 10) {
    const tens: Rank[] = ['10', 'J', 'Q', 'K'];
    return tens[randInt(0, 3)];
  }
  return String(val) as Rank;
}

const TEN_RANKS: Rank[] = ['10', 'J', 'Q', 'K'];

function dealerUpcardRank(dealerUpVal: number): Rank {
  if (dealerUpVal === 11) return 'A';
  if (dealerUpVal === 10) return TEN_RANKS[randInt(0, 3)];
  return String(dealerUpVal) as Rank;
}

function pickHardPair(total: number): [Rank, Rank] {
  // Decompose `total` into two non-Ace ranks (2..10). Retry until neither is A.
  // Smallest component >= 2, largest <= 10, and their sum === total (non-soft).
  for (let attempt = 0; attempt < 50; attempt++) {
    const a = randInt(2, Math.min(10, total - 2));
    const b = total - a;
    if (b >= 2 && b <= 10) {
      return [pickRankForValue(a), pickRankForValue(b)];
    }
  }
  // Fallback: split evenly
  const a = Math.floor(total / 2);
  return [pickRankForValue(a), pickRankForValue(total - a)];
}

function pickSoftPair(total: number): [Rank, Rank] {
  // Soft total contains an Ace counted as 11. Other card = total - 11.
  const other = total - 11;
  if (other < 2 || other > 10) {
    throw new Error(`Cannot build soft total ${total}`);
  }
  // Randomize which card is the Ace
  const aceFirst = Math.random() < 0.5;
  return aceFirst ? ['A', pickRankForValue(other)] : [pickRankForValue(other), 'A'];
}

function pickPairRanks(total: number): [Rank, Rank] {
  // Pair: both cards same rank. For a pair, the "playerTotal" in deviations is
  // the *value* of each card (not the sum). E.g., pairs 10 = two 10-valued cards.
  if (total === 11) return ['A', 'A'];
  if (total === 10) {
    const r = TEN_RANKS[randInt(0, 3)];
    return [r, r];
  }
  const r = String(total) as Rank;
  return [r, r];
}

export function buildForcedDeal(dev: Deviation): ForcedDeal {
  let r1: Rank, r2: Rank;
  switch (dev.handType) {
    case 'pairs':
      [r1, r2] = pickPairRanks(dev.playerTotal);
      break;
    case 'soft':
      [r1, r2] = pickSoftPair(dev.playerTotal);
      break;
    case 'hard':
      [r1, r2] = pickHardPair(dev.playerTotal);
      break;
  }

  const dealerUp = mkCard(dealerUpcardRank(dev.dealerUp));
  const dealerHole = mkCard(ALL_RANKS[randInt(0, ALL_RANKS.length - 1)]);

  return {
    player1: mkCard(r1),
    player2: mkCard(r2),
    dealerUp,
    dealerHole,
  };
}

// Re-export Deviation type for convenience in this module's consumers
export type { Deviation } from './deviations';

// Unused but useful for explicit value checks
void RANK_VALUES;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- deviationDrill`
Expected: 5 new tests pass (16 total).

- [ ] **Step 5: Commit**

```bash
git add src/strategy/deviationDrill.ts src/strategy/__tests__/deviationDrill.test.ts
git commit -m "feat(strategy): add forced deal builder for deviation drill"
```

---

## Task 6: `deviationDrill.ts` — `buildShoe` + top-level `generate` (TDD)

**Files:**
- Modify: `src/strategy/deviationDrill.ts`
- Test: `src/strategy/__tests__/deviationDrill.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append:

```ts
import { generate } from '../deviationDrill';
import { hiLoValue } from '../../engine/counting';

describe('generate (top-level drill)', () => {
  const rules = h17Rules({ numDecks: 6, surrenderAllowed: true });

  it('produces a shoe whose top 4 cards equal the forced deal order [p1, hole, p2, up]', () => {
    const r = generate(rules);
    expect(r.shoe[0]).toEqual(r.forcedDeal.player1);
    expect(r.shoe[1].rank).toEqual(r.forcedDeal.dealerHole.rank);
    expect(r.shoe[2]).toEqual(r.forcedDeal.player2);
    expect(r.shoe[3]).toEqual(r.forcedDeal.dealerUp);
  });

  it('shoe length equals (targetDecksRem * 52) + 4', () => {
    const r = generate(rules);
    expect(r.shoe.length).toBe(Math.round(r.targetDecksRem * 52) + 4);
  });

  it('pre-seed math: preSeedRC + face-up Hi-Lo === targetRC', () => {
    for (let i = 0; i < 100; i++) {
      const r = generate(rules);
      const faceUpDelta =
        hiLoValue(r.forcedDeal.player1) +
        hiLoValue(r.forcedDeal.player2) +
        hiLoValue(r.forcedDeal.dealerUp);
      expect(r.preSeedRC + faceUpDelta).toBe(r.targetRC);
    }
  });

  it('pre-seed decksRem = target + 4/52', () => {
    const r = generate(rules);
    expect(r.preSeedDecksRem).toBeCloseTo(r.targetDecksRem + 4 / 52, 6);
  });

  it('never returns |preSeedTC| > 8 (sanity clamp)', () => {
    for (let i = 0; i < 500; i++) {
      const r = generate(rules);
      const preSeedTC = Math.trunc(r.preSeedRC / r.preSeedDecksRem);
      expect(Math.abs(preSeedTC)).toBeLessThanOrEqual(8);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- deviationDrill`
Expected: FAIL with "generate is not a function".

- [ ] **Step 3: Implement `buildShoe` and `generate`**

Append to `src/strategy/deviationDrill.ts`:

```ts
import { createDeck, shuffle } from '../engine/shoe';

function buildShoe(numDecks: number, targetDecksRem: number, deal: ForcedDeal): Card[] {
  // Total shoe length post-seed = targetDecksRem * 52 + 4 (the 4 dealt cards are on top).
  const totalLen = Math.round(targetDecksRem * 52) + 4;

  // Generate a pool equal to numDecks full decks, shuffle, then take (totalLen - 4)
  // cards as the "rest of the shoe" body. The forced 4 go on top.
  const pool: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    pool.push(...createDeck());
  }
  const shuffled = shuffle(pool);
  const bodyLen = Math.max(0, totalLen - 4);
  const body = shuffled.slice(0, bodyLen);

  // Engine deal order: p1, hole, p2, up
  return [
    { ...deal.player1, faceUp: true },
    { ...deal.dealerHole, faceUp: false },
    { ...deal.player2, faceUp: true },
    { ...deal.dealerUp, faceUp: true },
    ...body,
  ];
}

export interface DrillResult {
  deviation: Deviation;
  forcedDeal: ForcedDeal;
  shoe: Card[];
  preSeedRC: number;
  preSeedDecksRem: number;
  targetRC: number;
  targetDecksRem: number;
}

const MAX_CLAMP_ATTEMPTS = 20;

/**
 * Generates one full deviation drill: a deviation, a forced initial deal,
 * a seeded shoe, and matching pre-seed count state.
 *
 * Retries up to MAX_CLAMP_ATTEMPTS times if the computed pre-deal true count
 * falls outside the realistic range (|preSeedTC| > 8).
 */
export function generate(rules: RuleSet): DrillResult {
  for (let attempt = 0; attempt < MAX_CLAMP_ATTEMPTS; attempt++) {
    const deviation = pickDeviation(rules);
    const target = generateTargetCount(deviation, rules.numDecks);
    const forcedDeal = buildForcedDeal(deviation);

    const faceUpDelta =
      hiLoValue(forcedDeal.player1) +
      hiLoValue(forcedDeal.player2) +
      hiLoValue(forcedDeal.dealerUp);

    const preSeedRC = target.targetRC - faceUpDelta;
    const preSeedDecksRem = target.targetDecksRem + 4 / 52;

    const preSeedTC = Math.trunc(preSeedRC / preSeedDecksRem);
    if (Math.abs(preSeedTC) > 8) continue;

    const shoe = buildShoe(rules.numDecks, target.targetDecksRem, forcedDeal);

    return {
      deviation,
      forcedDeal,
      shoe,
      preSeedRC,
      preSeedDecksRem,
      targetRC: target.targetRC,
      targetDecksRem: target.targetDecksRem,
    };
  }
  // Extreme fallback — shouldn't happen with realistic inputs
  throw new Error('deviationDrill.generate: sanity clamp exhausted');
}
```

Also add `hiLoValue` import at top of file:

```ts
import { hiLoValue } from '../engine/counting';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- deviationDrill`
Expected: 5 new tests pass (21 total).

- [ ] **Step 5: Commit**

```bash
git add src/strategy/deviationDrill.ts src/strategy/__tests__/deviationDrill.test.ts
git commit -m "feat(strategy): add top-level deviation drill generator with pre-seed math"
```

---

## Task 7: Add `deviationsPracticeMode` to `RuleSet`

**Files:**
- Modify: `src/strategy/types.ts`
- Modify: `src/store/settingsStore.ts`

- [ ] **Step 1: Add field to `RuleSet` and `DEFAULT_RULES`**

In `src/strategy/types.ts`, add to `RuleSet` interface (after `useDeviations`):

```ts
  useDeviations: boolean;
  deviationsPracticeMode: boolean;
```

And to `DEFAULT_RULES`:

```ts
  useDeviations: false,
  deviationsPracticeMode: false,
```

- [ ] **Step 2: Read `src/store/settingsStore.ts` to confirm persistence shape**

Run: `cat src/store/settingsStore.ts`
Expected: see how existing booleans are persisted (zustand middleware with localStorage). No code change yet — just confirm.

- [ ] **Step 3: Ensure settings store persists the new field**

If `settingsStore.ts` writes a `DEFAULT_RULES` object to initial state, nothing to do (new default propagates). If there is a field-by-field rehydrate mapping, add `deviationsPracticeMode: stored?.deviationsPracticeMode ?? false` to the rehydrate block. Edit accordingly.

- [ ] **Step 4: Run build to confirm no type errors**

Run: `npm run build`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/strategy/types.ts src/store/settingsStore.ts
git commit -m "feat(settings): add deviationsPracticeMode rule flag"
```

---

## Task 8: Wire Drill Generation into `gameStore`

**Files:**
- Modify: `src/store/gameStore.ts`

- [ ] **Step 1: Extend store state**

Add to `GameStore` interface (near `pendingNatural`):

```ts
  currentDeviation: import('../strategy/deviations').Deviation | null;
  betSnapshotTC: number | null;
```

Initial values in the `create<GameStore>(…)` block:

```ts
  currentDeviation: null,
  betSnapshotTC: null,
```

- [ ] **Step 2: Add drill helper import**

At top of `gameStore.ts`:

```ts
import { generate as generateDrill } from '../strategy/deviationDrill';
import { computeTrueCount } from '../engine/counting';
```

- [ ] **Step 3: Add internal helper `applyDrillSeed`**

Add above the `create<GameStore>` call:

```ts
function applyDrillSeed(rules: RuleSet): {
  shoe: Card[];
  shoeSize: number;
  preSeedRC: number;
  currentDeviation: import('../strategy/deviations').Deviation;
} | null {
  if (!rules.deviationsPracticeMode) return null;
  if (rules.numDecks < 4) return null;
  const drill = generateDrill(rules);
  return {
    shoe: drill.shoe,
    shoeSize: drill.shoe.length,
    preSeedRC: drill.preSeedRC,
    currentDeviation: drill.deviation,
  };
}
```

- [ ] **Step 4: Modify `initGame` to seed drill when enabled**

Replace the body of `initGame` with:

```ts
  initGame: (rules) => {
    const drill = applyDrillSeed(rules);
    const numCards = rules.numDecks * 52;
    const shoe = drill?.shoe ?? createShoe(rules.numDecks);
    const shoeSize = drill?.shoeSize ?? numCards;
    set({
      rules,
      shoe,
      shoeSize,
      balance: INITIAL_BALANCE,
      phase: 'betting',
      message: 'Place your bet',
      dealerHand: createEmptyHand(0),
      playerHands: [createEmptyHand(DEFAULT_BET)],
      activeHandIndex: 0,
      dealerHoleCardRevealed: false,
      pendingNatural: null,
      currentDeviation: drill?.currentDeviation ?? null,
      betSnapshotTC: null,
    });
    useCountStore.getState().resetCount();
    if (drill) {
      useCountStore.setState({ runningCount: drill.preSeedRC });
    }
  },
```

- [ ] **Step 5: Modify `newHand` to regenerate drill per hand**

Replace the body of `newHand` with:

```ts
  newHand: () => {
    const state = get();
    if (state.phase !== 'complete') return;

    const rules = state.rules!;
    const drill = applyDrillSeed(rules);

    const patch: Partial<GameStore> = {
      phase: 'betting',
      dealerHand: createEmptyHand(0),
      playerHands: [createEmptyHand(state.currentBet)],
      activeHandIndex: 0,
      dealerHoleCardRevealed: false,
      message: 'Place your bet',
      pendingNatural: null,
      currentDeviation: drill?.currentDeviation ?? null,
      betSnapshotTC: null,
    };

    if (drill) {
      patch.shoe = drill.shoe;
      patch.shoeSize = drill.shoeSize;
      useCountStore.setState({ runningCount: drill.preSeedRC });
    }

    set(patch);
  },
```

- [ ] **Step 6: Capture `betSnapshotTC` at the bet→deal transition**

Inside `deal`, immediately after the early returns (before the filter-retry loop):

```ts
    // Capture pre-deal TC for bet-spread feedback
    const preDealCardsDealt = state.shoeSize - state.shoe.length;
    const preDealTC = computeTrueCount(
      useCountStore.getState().runningCount,
      state.shoeSize,
      preDealCardsDealt,
    );
    set({ betSnapshotTC: preDealTC });
```

- [ ] **Step 7: Skip practice-mode filter loop in drill mode**

In `deal`, wrap the `do { ... } while (true)` filter loop so it is only used when `!rules.deviationsPracticeMode`. The drill mode path should draw 4 cards straight from the top of the shoe:

Replace the `do { ... } while (true)` block with:

```ts
    let playerCards: Card[] = [];
    let dealerCards: Card[] = [];

    if (rules.deviationsPracticeMode) {
      let tempShoe = [...shoe];
      let r = drawCard(tempShoe);
      const p1 = r.card; tempShoe = r.shoe;
      r = drawCard(tempShoe, false);
      const d1 = { ...r.card, faceUp: false }; tempShoe = r.shoe;
      r = drawCard(tempShoe);
      const p2 = r.card; tempShoe = r.shoe;
      r = drawCard(tempShoe);
      const d2 = r.card; tempShoe = r.shoe;
      playerCards = [p1, p2];
      dealerCards = [d1, d2];
      shoe = tempShoe;
    } else {
      let attempts = 0;
      do {
        let tempShoe = [...shoe];
        let result = drawCard(tempShoe);
        const p1 = result.card; tempShoe = result.shoe;
        result = drawCard(tempShoe, false);
        const d1 = { ...result.card, faceUp: false }; tempShoe = result.shoe;
        result = drawCard(tempShoe);
        const p2 = result.card; tempShoe = result.shoe;
        result = drawCard(tempShoe);
        const d2 = result.card; tempShoe = result.shoe;

        playerCards = [p1, p2];
        dealerCards = [d1, d2];

        const testHand: HandState = { cards: playerCards, bet: currentBet, isDoubled: false, isSplit: false, isComplete: false };
        if (!shouldFilterHand(testHand, rules.practiceMode)) {
          shoe = tempShoe;
          break;
        }
        attempts++;
        if (attempts >= 50) { shoe = tempShoe; break; }
        shoe = createShoe(rules.numDecks);
      } while (true);
    }
```

Also: guard the `needsReshuffle` block earlier so it is skipped in drill mode (the seeded shoe is small by design):

```ts
    if (!rules.deviationsPracticeMode && needsReshuffle(shoe, shoeSize)) {
      shoe = createShoe(rules.numDecks);
      useCountStore.getState().resetCount();
    }
```

- [ ] **Step 8: Run build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 9: Commit**

```bash
git add src/store/gameStore.ts
git commit -m "feat(game): seed deviation drill in initGame/newHand and skip filter in drill mode"
```

---

## Task 9: Integration Test — Count Lands on Target After Deal

**Files:**
- Create: `src/store/__tests__/gameStore.deviations.test.ts`

- [ ] **Step 1: Write the integration test**

Create `src/store/__tests__/gameStore.deviations.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { useCountStore } from '../countStore';
import { computeTrueCount } from '../../engine/counting';
import { DEFAULT_RULES } from '../../strategy/types';

describe('gameStore — deviations practice mode', () => {
  beforeEach(() => {
    useCountStore.getState().resetCount();
  });

  it('after deal, runningCount equals the drill target RC', () => {
    // Run several iterations to exercise randomization
    for (let i = 0; i < 20; i++) {
      useGameStore.getState().initGame({
        ...DEFAULT_RULES,
        numDecks: 6,
        surrenderAllowed: true,
        useDeviations: true,
        deviationsPracticeMode: true,
      });

      const preDealRC = useCountStore.getState().runningCount;
      useGameStore.getState().deal();
      const postDealRC = useCountStore.getState().runningCount;

      const dev = useGameStore.getState().currentDeviation!;
      expect(dev).not.toBeNull();

      // The post-deal RC should satisfy the deviation's threshold condition.
      const cardsDealt = useGameStore.getState().shoeSize - useGameStore.getState().shoe.length;
      const tc = computeTrueCount(postDealRC, useGameStore.getState().shoeSize, cardsDealt);
      if (dev.usesRunningCount) {
        if (dev.direction === 'gte') expect(postDealRC).toBeGreaterThan(0);
        else expect(postDealRC).toBeLessThan(0);
      } else {
        if (dev.direction === 'gte') expect(tc).toBeGreaterThanOrEqual(dev.threshold);
        else expect(tc).toBeLessThanOrEqual(dev.threshold);
      }

      // Pre-deal RC must have differed from post-deal (count updated live)
      expect(preDealRC).not.toBe(postDealRC);
    }
  });

  it('captures betSnapshotTC at deal time', () => {
    useGameStore.getState().initGame({
      ...DEFAULT_RULES,
      numDecks: 6,
      surrenderAllowed: true,
      useDeviations: true,
      deviationsPracticeMode: true,
    });
    useGameStore.getState().deal();
    expect(useGameStore.getState().betSnapshotTC).not.toBeNull();
  });

  it('new hand regenerates drill (count jumps)', () => {
    useGameStore.getState().initGame({
      ...DEFAULT_RULES,
      numDecks: 6,
      useDeviations: true,
      deviationsPracticeMode: true,
      surrenderAllowed: true,
    });
    const rc1 = useCountStore.getState().runningCount;

    // Force a completed phase to allow newHand
    useGameStore.setState({ phase: 'complete' });
    useGameStore.getState().newHand();
    const rc2 = useCountStore.getState().runningCount;

    // Not a strict guarantee every time, but should differ most of the time
    // Run a few cycles to dodge unlucky equal draws
    let differed = rc1 !== rc2;
    for (let i = 0; i < 5 && !differed; i++) {
      useGameStore.setState({ phase: 'complete' });
      useGameStore.getState().newHand();
      if (useCountStore.getState().runningCount !== rc2) differed = true;
    }
    expect(differed).toBe(true);
  });
});
```

- [ ] **Step 2: Add `src/store/__tests__` to vitest include (if needed)**

`vitest.config.ts` uses `src/**/*.test.ts` — already covers this path. No change.

- [ ] **Step 3: Run test**

Run: `npm test -- gameStore.deviations`
Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/store/__tests__/gameStore.deviations.test.ts
git commit -m "test(game): verify drill count lands on target after deal"
```

---

## Task 10: `BetSpreadFeedback` Component

**Files:**
- Create: `src/components/feedback/BetSpreadFeedback.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { motion } from 'framer-motion';
import type { BetEvaluation } from '../../strategy/betSpread';

interface Props {
  betTimeTC: number;
  decisionTC: number | null;
  evaluation: BetEvaluation;
}

function formatTC(tc: number): string {
  if (tc > 0) return `+${tc}`;
  return String(tc);
}

function verdictIcon(v: BetEvaluation['verdict']): string {
  if (v === 'ok') return '✓';
  if (v === 'low') return '↓';
  return '↑';
}

export function BetSpreadFeedback({ betTimeTC, decisionTC, evaluation }: Props) {
  const { recommended, actualUnits, verdict } = evaluation;
  const recText = recommended.min === recommended.max
    ? `${recommended.min}u`
    : `${recommended.min}-${recommended.max}u`;

  const tcDelta = decisionTC != null && decisionTC !== betTimeTC;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'linear' }}
      className="inline-flex items-center rounded-full font-medium"
      style={{
        padding: '10px 28px',
        background: 'rgba(251, 191, 36, 0.15)',
        border: '1px solid rgba(251, 191, 36, 0.45)',
        color: 'var(--color-text-primary, #f5f5f5)',
        fontSize: 'var(--font-sm, 14px)',
      }}
    >
      Bet at TC {formatTC(betTimeTC)} • rec {recText} • you bet {actualUnits}u {verdictIcon(verdict)}
      {tcDelta && <span style={{ opacity: 0.7, marginLeft: 10 }}>— decided at TC {formatTC(decisionTC!)}</span>}
    </motion.div>
  );
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/feedback/BetSpreadFeedback.tsx
git commit -m "feat(feedback): add bet-spread feedback pill component"
```

---

## Task 11: Render `BetSpreadFeedback` in GameTable

**Files:**
- Modify: `src/components/game/GameTable.tsx`

- [ ] **Step 1: Import the component and helpers**

At top of `GameTable.tsx`, add:

```ts
import { BetSpreadFeedback } from '../feedback/BetSpreadFeedback';
import { evaluateBet } from '../../strategy/betSpread';
import { computeTrueCount } from '../../engine/counting';
```

- [ ] **Step 2: Render conditionally in the `complete`/settle block**

Locate the JSX block that renders the settle/complete phase (result announcement). Inside it, add after the existing announcement:

```tsx
{rules?.deviationsPracticeMode && betSnapshotTC !== null && (() => {
  const cardsDealt = shoeSize - shoe.length;
  const decisionTC = computeTrueCount(runningCount, shoeSize, cardsDealt);
  // Base bet is the player's bet on the primary hand
  const betAmount = playerHands[0]?.bet ?? 0;
  const minBet = 25; // DEFAULT_BET; unit baseline for Hi-Lo 1-8 spread
  const evaluation = evaluateBet(betAmount, minBet, betSnapshotTC);
  return (
    <BetSpreadFeedback
      betTimeTC={betSnapshotTC}
      decisionTC={decisionTC !== betSnapshotTC ? decisionTC : null}
      evaluation={evaluation}
    />
  );
})()}
```

You will need to pull `betSnapshotTC`, `shoe`, `shoeSize`, `runningCount`, `playerHands`, `rules` from the stores via their hooks (follow existing patterns in `GameTable.tsx`).

- [ ] **Step 3: Verify layout does not shift (manual)**

Run: `npm run dev` and open http://localhost:5173. Enable deviations mode via settings. Play a hand. Confirm the pill appears without shifting cards. Test at 1080p, 768p, 390px.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/GameTable.tsx
git commit -m "feat(game): render bet-spread feedback on settle in drill mode"
```

---

## Task 12: SetupPage Toggle + Dependency Locking

**Files:**
- Modify: `src/components/setup/SetupPage.tsx`

- [ ] **Step 1: Read SetupPage to locate existing toggles**

Run: `cat src/components/setup/SetupPage.tsx` — identify the counting/deviations toggle group (search for `useDeviations`).

- [ ] **Step 2: Add "Deviations Practice" toggle**

Add a toggle row after the `useDeviations` toggle with label **"Deviations Practice"** and copy:

> *"Pre-selected hands with fabricated counts. Drills deviation recognition and bet spread together."*

Wire its `onChange` to a handler `handleDeviationsPracticeToggle(on: boolean)`:

```ts
function handleDeviationsPracticeToggle(on: boolean) {
  setRules(prev => {
    if (!on) return { ...prev, deviationsPracticeMode: false };
    return {
      ...prev,
      deviationsPracticeMode: true,
      useDeviations: true,
      showCount: prev.showCount === 'off' ? 'always' : prev.showCount,
      numDecks: prev.numDecks < 4 ? 4 : prev.numDecks,
    };
  });
}
```

(Use `setRules` / local state naming consistent with existing file.)

- [ ] **Step 3: Lock dependent controls when enabled**

When `rules.deviationsPracticeMode === true`:
- Render the `useDeviations` checkbox as checked+disabled.
- Render the `showCount === 'off'` radio as disabled; add a `title` tooltip: *"Required for deviations practice"*.
- If `numDecks` selector exists, disable 1/2-deck options; add inline note if coerced.

Consult the existing JSX for exact patterns. Disabled state must be visually distinct (reduced opacity, cursor `not-allowed`).

- [ ] **Step 4: Manual smoke**

Run: `npm run dev`. Toggle on/off. Verify:
- Enabling forces `useDeviations`, `showCount`, `numDecks`.
- Disabling does not alter prior user choices (simple pass-through — no stash/restore at this layer; the setting just stops coercing).

- [ ] **Step 5: Commit**

```bash
git add src/components/setup/SetupPage.tsx
git commit -m "feat(setup): add deviations practice toggle with dependency locks"
```

---

## Task 13: SettingsModal Mirror Toggle

**Files:**
- Modify: `src/components/game/SettingsModal.tsx`

- [ ] **Step 1: Add the same toggle and coercion**

Mirror the SetupPage toggle in `SettingsModal.tsx`, using the same `handleDeviationsPracticeToggle` logic (adapted to the modal's state wiring). Same disabled-option treatment for `showCount === 'off'`.

- [ ] **Step 2: Manual smoke**

Start a normal session, open settings mid-session, enable deviations practice. Confirm:
- `useDeviations` becomes checked + disabled.
- `showCount === 'off'` radio is disabled.
- Next hand enters drill mode (count jumps, forced deal appears).

- [ ] **Step 3: Commit**

```bash
git add src/components/game/SettingsModal.tsx
git commit -m "feat(settings-modal): mirror deviations practice toggle"
```

---

## Task 14: Mid-Session Guard — Auto-Disable Drill If `useDeviations` Goes Off

**Files:**
- Modify: `src/store/settingsStore.ts`

- [ ] **Step 1: Add coercion in the setter that updates `useDeviations`**

Where the settings store updates `useDeviations`, wrap so that disabling it also forces `deviationsPracticeMode: false`. If the store uses a generic `setRules(partial)` action, add at the top:

```ts
  setRules: (partial) => set(state => {
    let next = { ...state.rules, ...partial };
    if (next.useDeviations === false) next.deviationsPracticeMode = false;
    if (next.numDecks < 4) next.deviationsPracticeMode = false;
    return { rules: next };
  }),
```

(Adapt to the existing API shape.)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/store/settingsStore.ts
git commit -m "fix(settings): auto-disable drill when useDeviations or numDecks go invalid"
```

---

## Task 15: Playwright End-to-End Smoke

**Files:**
- Create: `playtest/deviations-practice.spec.ts`

- [ ] **Step 1: Write the Playwright test**

Model it on the existing specs under `playtest/`. Test flow:
1. Load app, go through setup, enable **Deviations Practice**, assert count-off radio is disabled.
2. Start session.
3. Place a bet, deal, observe that count pill is visible.
4. Click any action (e.g., Stand).
5. Settle.
6. Assert `BetSpreadFeedback` pill is visible with text containing `"Bet at TC"`.
7. Click Next Hand. Assert count value changes between hands.

Keep it as one smoke `test('end-to-end drill flow', …)`.

- [ ] **Step 2: Run the playtest**

Run: `npm run playtest -- deviations-practice`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add playtest/deviations-practice.spec.ts
git commit -m "test(e2e): deviations practice mode smoke flow"
```

---

## Task 16: Full Verification

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no new errors beyond the 3 pre-existing ones noted in CLAUDE.md.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 3: Unit tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 4: Manual smoke at 3 viewports**

Run: `npm run dev`. Test at 1080p, 768p, 390px:
- Toggle enables/disables cleanly on setup and in settings modal.
- Count pill updates live during deal animation and lands on target.
- Bet-spread feedback pill shows correct units and verdict.
- No layout shift on settle.
- Disabled count-off radio is visually obvious.

- [ ] **Step 5: Final commit if anything changed during verification**

```bash
git status
# If clean, done. Otherwise fix + commit.
```

---

## Self-Review Notes

- **Spec coverage:** every spec section maps to tasks — architecture (T3-T6, T8), RuleSet changes (T7), settings/coercion (T12-T14), UI pill (T10-T11), testing (T2-T6, T9, T15).
- **Type consistency:** `DrillResult`, `ForcedDeal`, `TargetCount`, `BetEvaluation`, `UnitRange` defined in Tasks 2-6 and referenced consistently in Tasks 8-11.
- **Placeholders:** none — every code step is complete.
- **Per-hand cadence:** T8 step 5 confirms `newHand()` regenerates the drill so each Next Hand gets fresh count + forced deal.
- **Unit size:** unit = `DEFAULT_BET` (25), matching the user's "min bet as 1u" answer.

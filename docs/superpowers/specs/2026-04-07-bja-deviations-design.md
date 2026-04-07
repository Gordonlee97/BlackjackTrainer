# BJA Deviation Training — Design Spec

## Overview

Add true-count-based deviation training to the Blackjack Trainer. When enabled via a setting, the strategy advisor considers the true count (TC) and overrides basic strategy with BJA deviation plays where applicable. The trainer grades the player on the deviation-adjusted correct play and shows deviation context in feedback.

## Approach

Deviation overlay in the advisor (Approach A from brainstorming). Deviations live in a separate `deviations.ts` file as a flat list of entries. The existing chart system (`charts.ts`, `buildStrategy()`) is untouched. The advisor gains optional TC awareness — when TC is provided, it checks for applicable deviations after the basic strategy lookup.

## Data Model

### Deviation entry (`src/strategy/deviations.ts`)

```ts
interface Deviation {
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;       // same keys as StrategyChart (e.g., 16 for hard 16, 13 for A+2)
  dealerUp: number;          // 2-11 (11 = Ace)
  threshold: number;         // true count index (e.g., +1, -1, 0)
  direction: 'gte' | 'lte';  // deviation applies when TC >= threshold or TC <= threshold
  action: ChartAction;       // the deviation play (replaces basic strategy)
}
```

- `direction: 'gte'` — deviate when TC >= threshold (most common, high-count plays like standing on 16 vs 10 at TC >= 0)
- `direction: 'lte'` — deviate when TC <= threshold (e.g., hitting 13 vs 2 at TC <= -1)
- Two exported arrays: `H17_DEVIATIONS` and `S17_DEVIATIONS`, selected based on `rules.dealerHitsSoft17`
- Data transcribed cell-by-cell from BJA H17/S17 PDFs at `src/strategy/BJA_H17.pdf` and `src/strategy/BJA_S17.pdf`
- Deviation indices are for 4-8 deck games (matching the base charts). Deviations should be disabled (ignored) for 1-2 deck games where the indices differ

### True count computation (`src/engine/counting.ts`)

New exported function:

```ts
function trueCount(runningCount: number, shoeSize: number, cardsDealt: number): number
```

- `decksRemaining = (shoeSize - cardsDealt) / 52`
- `TC = runningCount / decksRemaining`
- Rounded to nearest integer (standard for Hi-Lo index plays)
- Guard against division by zero (return 0 if no cards remaining)

## Advisor Integration

### `getCorrectAction` changes (`src/strategy/advisor.ts`)

Signature gains optional param:

```ts
getCorrectAction(
  playerCards, dealerUpcard, rules,
  canDouble, canSplit, canSurrender,
  strategy?,
  trueCount?,  // number | null — null means deviations disabled
)
```

Logic flow:
1. Look up basic strategy action (existing logic, unchanged)
2. If `trueCount` is not null, find matching deviation for `(handType, playerTotal, dealerUp)` from the appropriate H17/S17 deviation list
3. If a matching deviation exists and TC meets the threshold+direction condition, use the deviation action instead
4. Resolve compound actions (`D`, `Rh`, etc.) through existing `resolveAction()` as before

### `StrategyAdvice` return type changes

```ts
interface StrategyAdvice {
  correctAction: FinalAction;
  chartAction: ChartAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  isDeviation?: boolean;       // true when a deviation overrode basic strategy
  deviationThreshold?: number; // the TC index for feedback display
}
```

## Settings

### New field in `RuleSet` (`src/strategy/types.ts`)

```ts
useDeviations: boolean  // default: false
```

### Settings modal (`src/components/game/SettingsModal.tsx`)

- Toggle for "Use Deviations" in the settings modal
- Disabled when `showCount === 'off'` (deviations require counting to be visible)
- Grouped near the counting display option

## UI Changes

### Feedback display

When `isDeviation` is true in the advice and the player gets it wrong, the strategy feedback text includes deviation context:

> "Correct play: Stand (deviation at TC +1)"

Same modal/feedback flow as today — the text just includes the threshold info from `StrategyAdvice`.

### True count display (`src/components/game/RunningCount.tsx`)

When deviations are enabled, show both running count and true count:

> "RC: +4 | TC: +2"

Displayed in the same `RunningCount` component. True count computed from `runningCount` (countStore), `shoe.length` and `shoeSize` (gameStore).

### Caller changes (`src/components/game/GameTable.tsx`)

`checkStrategy()` updated:
1. When `rules.useDeviations` is true and `rules.showCount !== 'off'`:
   - Read `runningCount` from `countStore`
   - Compute true count from shoe state in `gameStore`
   - Pass `trueCount` to `getCorrectAction`
2. When deviations disabled: pass `null` — advisor behaves exactly as today

## Scope

### In scope
- Deviation data model and H17/S17 deviation arrays (transcribed from BJA PDFs)
- True count computation
- Advisor integration with TC-aware deviation lookup
- Settings toggle
- Feedback text with deviation context
- True count display in RunningCount component

### Deferred
- Strategy chart modal annotations (showing deviation indices on the visual chart grid)
- Deviation-specific stats tracking (how often player gets deviations right/wrong)
- Per-deviation practice mode (drill specific deviations)

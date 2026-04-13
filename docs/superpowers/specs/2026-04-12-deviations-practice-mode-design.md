# Deviations Practice Mode — Design Spec

**Date:** 2026-04-12
**Branch:** `add-features`
**Status:** Approved for implementation planning

## Summary

A new training mode that drills deviation plays and bet-spread sizing together. When enabled, every hand is a pre-selected situation where a deviation is the correct play, with a fabricated running count / true count / decks-remaining that live-updates as cards are dealt and lands exactly on the deviation's trigger index after the initial deal.

The normal game loop (betting → dealing → player turn → dealer turn → settling) is preserved — bets are real, hands play out fully, money changes hands. The only thing "fabricated" is the initial shoe state.

## Goals

- Let the player drill deviation recognition without waiting through random hands.
- Simultaneously practice bet spread — player sees pre-deal TC and sizes bet before the deal.
- Keep the engine changes minimal by pre-seeding the count state rather than patching the live count stream.

## Non-goals

- Weighted or spaced-repetition selection (uniform random for now; may revisit).
- Fake-out hands (no basic-strategy-is-correct red herrings). Every drilled hand has a genuine deviation.
- User-configurable bet spread (locked to standard Hi-Lo 1–8).

## User flow

1. Player enables **Deviations Practice** on setup page or in settings modal.
2. Dependencies auto-enable and lock: `useDeviations`, `showCount`, `countDisplay ≠ off`, `numDecks ≥ 4`.
3. Player starts a session. Bankroll and bet sizing behave normally; unit = table min bet (existing starting bet).
4. For each hand:
   - Pre-deal RC/TC/decks-remaining appear (fabricated per-hand, jumps freely between hands).
   - Player places bet based on pre-deal TC.
   - Cards deal out. Count updates live card-by-card. After the deal settles, RC/TC match the deviation's trigger index.
   - Player acts. Correct deviation action → normal success; wrong action → strategy modal with deviation context (already implemented).
   - Hand plays to completion (hit/stand/split/double/surrender all work, dealer plays normally, settlement occurs).
   - After settle, a **bet-spread feedback pill** shows: *"Bet at TC +2 • rec 2u • you bet 2u ✓"*. If pre-deal TC and decision-time TC differ, both are shown.
5. Next Hand → fresh drill; count re-seeds.
6. Disabling the mode restores the player's prior `countDisplay` / `numDecks` values.

## Architecture

### Core idea: pre-seed, don't patch

We don't intercept the count stream. We pre-compute the *target post-deal state* and back-solve the *pre-deal state* so the existing count-accumulation logic, running untouched, arrives at the target.

| Moment | RC | Decks remaining |
|---|---|---|
| Pre-deal (bet phase) | `RC_target − Δface-up` | `decksRem_target + 4/52` |
| After 4-card initial deal | `RC_target` | `decksRem_target` |
| Hits / dealer play | updates live | updates live |
| Hole reveal | updates live | updates live |

`Δface-up = hiLo(player1) + hiLo(player2) + hiLo(dealerUp)`. Hole card is face-down and not counted pre-deal (matches current engine behavior); it counts when revealed during dealer turn, which is fine.

### New modules

**`src/strategy/deviationDrill.ts`** (pure, no React)

- `pickDeviation(rules, canSurrender): Deviation` — uniform random from `getDeviations(rules)`; filters `onlyIfNoSurrender` and surrender-action entries against current rules.
- `generateTargetCount(deviation, numDecks): { targetRC, targetDecksRem }` — for TC-based deviations: random `decksRem ∈ {0.5, 1.0, …, numDecks − 0.5}`, RC = `threshold × decksRem` adjusted so `trunc(RC/decksRem) === threshold`, with ~40% borderline and ~60% overshoot by 1–3. For `usesRunningCount` deviations: RC = ±(1–4), decksRem realistic.
- `buildForcedDeal(deviation): { player1, player2, dealerUp, dealerHole }` — ranks consistent with the deviation's handType/playerTotal. Pairs → matching ranks; soft → one Ace + kicker; hard → no Ace unless the total requires one. Hole card rank unbiased.
- `buildShoe(numDecks, targetDecksRem, forcedDeal): Card[]` — length = `(targetDecksRem × 52) + 4`, top 4 = forced deal in engine deal order (P1, D1, P2, D2), rest = random permutation of a full `numDecks` shoe minus those 4.
- `generate(rules): { shoe, preSeedRC, preSeedDecksRem, targetRC, targetDecksRem, deviation }` — top-level composed call. Sanity clamp: regenerate if `|preSeedTC| > 8`.

**`src/strategy/betSpread.ts`** (pure)

- `HI_LO_1_8_SPREAD` table: TC ≤+1 → 1u, +2 → 2u, +3 → 4u, +4 → 6u, +5+ → 8u.
- `recommendUnits(tc): { min, max }` — returns adjacent spread entries as a soft range.
- `evaluateBet(betAmount, minBet, tc): { recommended, actual, verdict: 'low' | 'ok' | 'high' }`.

### Engine integration

**`gameStore.initGame`** — when `rules.deviationsPracticeMode`:
- Call `deviationDrill.generate(rules)`.
- Replace shoe with generated shoe.
- Seed `countStore.runningCount = preSeedRC`, `countStore.decksRemaining = preSeedDecksRem`.
- Stash `currentDeviation` on game state for post-hand context.

No changes to `deal()`, `hit()`, `playDealerSteps()`, or split handling. They draw from the shoe and update the count normally; the forced cards just happen to be on top.

**`gameStore`** also captures `betSnapshotTC` at the moment the bet is locked in (betting → dealing transition) for later bet-spread feedback.

### Settings / RuleSet

New field: `deviationsPracticeMode: boolean` (default `false`).

Enabling the mode:
- `useDeviations` → forced `true`, locked.
- `showCount` → forced `true`, locked.
- `countDisplay === 'off'` → coerced to `'always'`; the `'off'` radio is rendered disabled with tooltip *"Required for deviations practice."*
- `numDecks < 4` → coerced to `4`.
- Prior values for `countDisplay` and `numDecks` are stashed on enable, restored on disable.

Disabling `useDeviations` mid-session auto-disables `deviationsPracticeMode`.

### UI surface

- **Setup page**: new toggle card "Deviations Practice" alongside existing counting/deviations toggles, with copy explaining the mode.
- **Settings modal**: mirror toggle with identical coercion behavior.
- **GameTable**: no structural changes. After settle, render a **bet-spread feedback pill** next to the existing result announcement:
  - `"Bet at TC +2 • rec 2u • you bet 2u ✓"` (or ↓ underbet / ↑ overbet).
  - If pre-deal TC ≠ decision TC by ≥1: append `" — decided at TC +3"`.
  - Uses existing amber pill style; padding per CLAUDE rule #2.
- **RunningCount** component: unchanged — it updates live as today.
- **StrategyModal**: unchanged — already shows deviation context.

## Testing

### Unit — `deviationDrill`
- Coverage: every entry in H17/S17 lists produced within ±30% of uniform expected frequency over 1000 draws.
- Rule filtering: surrender actions excluded when `surrender: false`; `onlyIfNoSurrender` entries only when surrender off.
- Target consistency (TC): `trunc(targetRC / targetDecksRem) === deviation.threshold` for borderline; correct direction for overshoot.
- Target consistency (RC-based): `usesRunningCount` entries produce RC with correct sign.
- Pre-seed math: `preSeedRC + Δface-up === targetRC`; `preSeedDecksRem × 52 === targetDecksRem × 52 + 4`.
- Forced deal validity: cards match handType/playerTotal invariants.
- Shoe composition: correct length; top 4 match forced deal.
- Sanity clamp: no output with `|preSeedTC| > 8`.

### Unit — `betSpread`
- Boundary TCs (−5, 0, +1, +2, +3, +4, +5, +10) return correct unit ranges.
- `evaluateBet` verdicts at/under/over range.

### Integration — `gameStore` deviations mode
- End-to-end: `initGame` + `deal()` → post-deal `runningCount === targetRC`, `computeTrueCount()` matches deviation threshold.
- Advisor returns the deviation action at post-deal state.
- Bet feedback uses the bet-time TC snapshot.
- Hole reveal increments RC by the hole's Hi-Lo value.
- Mode-off restores stashed `countDisplay` and `numDecks`.
- Next hand regenerates drill; count visibly jumps.

### Playwright
- Setup page: toggling the mode disables the count-off radio and locks `useDeviations`.
- Full-hand drill flow shows the bet-spread pill with correct copy.
- Wrong action opens strategy modal with deviation context.

### Manual smoke
Three viewports (1080p, 768p, 390px):
- No layout shift when the bet-spread pill appears.
- Locked/greyed radio is visually obvious.
- Between-hand count jumps look intentional.

## Open questions / risks

- **Pre-deal TC occasionally unrealistic** — mitigated by the `|preSeedTC| ≤ 8` clamp + regenerate loop.
- **Split/double hits draw from the fabricated shoe** — composition beyond top 4 is a random permutation; distributional quirks are unobservable in a single hand.
- **Bet-spread copy** — exact wording may need iteration after seeing it on screen.

## Out of scope (future)

- Weighted / Illustrious-18-biased / spaced-repetition selection.
- User-configurable bet spread.
- Per-deviation drill filters (only pairs, only surrenders, etc.).
- Fake-out hands.

# CLAUDE.md

## Project Overview

Blackjack Trainer — browser-based app for practicing perfect basic strategy. Real-time feedback on deviations from optimal play. Configurable rules (deck count, H17/S17, DAS, surrender, etc.). All client-side, no backend.

## Tech Stack

React 19, TypeScript 5.9, Vite 8, Tailwind CSS v4, Framer Motion, Zustand (game/settings/stats stores), ESLint, localStorage persistence.

## Commands

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # tsc -b + Vite production build — MUST pass before any change is done
npm run lint       # ESLint (3 known errors: react-hooks/set-state-in-effect in GameTable's phase-driven juice effects)
npm test           # Vitest unit tests (engine, strategy, store)
```

## Project Structure

- `src/engine/` — Pure game logic (no React): types, shoe, hand eval, payout, sounds, counting
- `src/strategy/` — Strategy engine (no React): charts (base + overrides), advisor, explanations, types
- `src/store/` — Zustand: gameStore (state machine + `playDealerSteps`), countStore, settingsStore, statsStore
- `src/components/game/` — GameTable (orchestrator), Card, DealerHand, PlayerHand, ActionButtons, BetControls, RunningCount, SettingsModal
- `src/components/feedback/` — StrategyModal, StrategyChartModal, StatsPanel, BetSpreadFeedback
- `src/components/setup/` — SetupPage
- `src/components/shared/` — `Modal` (shell: backdrop, panel, 150ms motion, Escape, `role=dialog`) + `ModalCloseButton`, CustomSelect
- `src/hooks/` — Custom hooks: `useAnimatedNumber` (rAF number tween)
- `src/index.css` — Design tokens (~30 CSS custom properties), keyframe animations

## Architecture

**Game phases:** `betting` → `dealing` → `player_turn` → `dealer_turn` → `complete` (naturals go `dealing` → `complete`)

**Dealer play** uses `playDealerSteps()` which returns step array applied sequentially via setTimeout for card-by-card animation.

**Split animation** uses fire-and-forget timeouts from a useEffect in GameTable. Actions are disabled while any split hand still has 1 card (derived from store state).

**Natural reveal** deals cards normally first (hole card face down), then a useEffect detects `pendingNatural` and orchestrates: pause → flip hole card → pause → settle.

**Strategy engine** uses base chart + override patches pattern. Compound actions resolved at runtime.

## Critical UI Rules

### 1. NEVER conditionally render elements inside flex-centered containers
Always render elements. Use `invisible` CSS class to hide while preserving layout. Use fixed-height slots. This prevents layout shifts — the #1 recurring bug.

### 2. Generous padding always — text must NEVER touch container edges
Modal header padding MUST exceed border-radius. Use inline `style={{}}` for precise control. Minimum padding: `10px 28px` for badges, `12px 40px` for pills, `28px 36px` for modal content.

### 3. Use absolute positioning for AnimatePresence phase transitions
Controls container is fixed height (260px) with `position: relative`. All phase content is `position: absolute`. Prevents exit/enter overlap from shifting cards.

### 4. Nothing should touch screen edges
Top bar: `padding: 0 24px`. Balance text: `whitespace-nowrap`. Footer areas: `px-8 pb-8`.

## Responsive & Layout Guidelines

### 5. Design tokens are the single source of truth for all sizing
Never hardcode px values in components. Define tokens once in `src/index.css` with `clamp(min, preferred, max)`, reference via `var(--token)` everywhere. One line to change = one place to tune.

### 6. Scale with `min(vw, vh)` inside `clamp()` — not just `vw`
`vw`-only scaling breaks on short-but-wide viewports (e.g., 1920×1080). Use `min(vw, vh)` as the preferred value so elements respond to whichever dimension is tighter. Layout sections (controls, topbar) use `vh` directly; content (cards, buttons) use `min(vw, vh)`; small spacing can use `vw` alone.

### 7. Never vertically center content that can overflow its container
`items-center` on a scrollable area hides content behind fixed headers/footers. Use `items-start` for anything that might exceed its container. Reserve `items-center` only when content is guaranteed to fit.

### 8. Anchor repeating UI elements to the same position across states
Buttons that appear in multiple game phases (Deal, Next Hand) must sit at the same vertical position. Use the same `justify-end` + `paddingBottom` pattern across all phases. Jumping buttons feel broken.

### 9. Keep animations short and continuous
Modal open/close: 150ms max, no spring. No keyframe stepping (move-stop-move). One continuous motion with `ease: 'linear'` for position, keyframes only for opacity. Less is more.

New modals go through `shared/Modal` and amber primary buttons use the `.btn-cta` class, so motion and styling stay in one place.

### 10. Test at multiple viewport sizes during development, not after
Bugs at 1080p, 768p, and 390px are completely different. Check at least 3 sizes: large desktop, small laptop/tablet, phone. Check a short phone too (e.g. 390×664, a phone browser with its toolbars): height-based rules hit phones as well.

The phone `@media (max-width: 500px)` block in `index.css` must stay last so it overrides the `max-height` blocks. On phones the running count lives in the top bar (`.topbar-count`) instead of on the table.

## Workflow Rules

### Update memory on every git push
Every time changes are committed and pushed to git, update the memory system with relevant information from the changes. This includes:
- New features, architectural patterns, or design decisions worth remembering
- UI/UX feedback and preferences expressed during the session
- Project state changes (current branch focus, what's been completed, what's next)

Do NOT save code patterns, file paths, or anything derivable from the codebase itself — only context, decisions, and preferences that would be lost between sessions.

## Strategy Data Integrity

This is a training tool. Incorrect strategy data makes the entire app harmful rather than helpful. These rules are non-negotiable:

### 1. NEVER transcribe chart data freehand — verify cell-by-cell
When encoding any strategy chart (basic strategy, deviations, surrender, splits), verify every single cell against the source of truth. A single column shift, row swap, or off-by-one error silently corrupts the trainer. After writing any chart data, re-read it and cross-check each cell's (hand, dealer upcard) coordinate against the source.

### 2. `blackjack_strategy.md` is the source of truth; BJA is a cross-reference
`src/strategy/blackjack_strategy.md` is the authoritative source for basic strategy and deviation indices. It was reviewed against several sources and is considered more accurate than any single chart. Do not change chart or deviation data to match another source unless the user explicitly asks.

The BJA (Blackjack Apprentice) charts are kept as a cross-reference. Most cells match, but a few differ on purpose and must stay as encoded:
- 15 vs 10: hit at TC ≤ −1 (BJA shows "0-", i.e. any negative running count)
- 14 vs 10: surrender at TC ≥ +3 (not on BJA)
- H17 17 vs A: stand at TC ≥ +2 (BJA shows plain surrender)
- S17 16 vs A: stand at TC ≥ +3 when surrender isn't available (not on BJA S17)

If a cross-check against BJA turns up any other difference, report it to the user. Don't fix it.

The BJA PDFs are at `src/strategy/BJA_H17.pdf` and `src/strategy/BJA_S17.pdf`. The Read tool opens them directly; no conversion is needed.

### 3. H17 and S17 are different charts — never mix them
Deviation indices change between H17 and S17 rules. Always confirm which rule set a chart applies to before encoding it. Some plays that are deviations under S17 are already basic strategy under H17 (e.g., 11 vs A is always Double in H17).

### 4. Test chart data against known hands after implementation
After encoding any strategy chart, verify at least 5-10 specific hand/dealer/count combinations against the source to confirm correctness.

## TypeScript Conventions

- `verbatimModuleSyntax` enabled — use `import type { ... }` for type-only imports
- `strict` mode with `noUnusedLocals`/`noUnusedParameters` — prefix unused params with `_`
- `engine/` and `strategy/` must stay React-free

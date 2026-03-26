# CLAUDE.md

## Project Overview

Blackjack Trainer — a browser-based app for practicing perfect basic strategy in Blackjack. Players play hands of blackjack against a dealer and receive real-time feedback when they deviate from mathematically optimal play. Configurable rule variations (deck count, H17/S17, DAS, surrender, etc.) adjust the strategy charts accordingly. All logic runs client-side with no backend.

## Tech Stack

- **React 19** + **TypeScript 5.9** — UI framework
- **Vite 8** — build tool and dev server
- **Tailwind CSS v4** — utility-first styling (via `@tailwindcss/vite` plugin)
- **Framer Motion** — card deal/flip/slide animations
- **Zustand** — lightweight state management (3 stores: game, settings, stats)
- **ESLint** — linting (`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`)
- **localStorage** — persistence for user settings and stats (no database)

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # TypeScript type-check (tsc -b) + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
npx tsc --noEmit   # Type-check only (no output)
```

## Project Structure

```
src/
├── main.tsx                          # Entry point, renders <App />
├── App.tsx                           # Page router (setup vs game)
├── index.css                         # Global styles, Tailwind import, CSS variables
│
├── engine/                           # Pure game logic (no React)
│   ├── types.ts                      #   Card, Suit, Rank, HandState, GameState types
│   ├── shoe.ts                       #   Deck creation, shuffle (Fisher-Yates), draw
│   ├── hand.ts                       #   Hand evaluation: value, isSoft, isBust, isBlackjack, isPair
│   └── payout.ts                     #   Hand settlement and payout calculation
│
├── strategy/                         # Basic strategy engine (no React)
│   ├── types.ts                      #   ChartAction, FinalAction, RuleSet, FullStrategy types
│   ├── charts.ts                     #   Base strategy charts + rule-variation overrides
│   ├── advisor.ts                    #   Lookup: (hand, dealerUpcard, rules) → correct action
│   └── explanations.ts              #   Human-readable explanations for each strategy decision
│
├── store/                            # Zustand state management
│   ├── gameStore.ts                  #   Game state machine, all player/dealer actions, dealer AI
│   ├── settingsStore.ts              #   Rule settings (persisted to localStorage)
│   └── statsStore.ts                 #   Accuracy tracking: hands, decisions, streaks (persisted)
│
└── components/
    ├── setup/
    │   └── SetupPage.tsx             # Landing page: deck count, H17/S17, practice mode, toggles
    ├── game/
    │   ├── GameTable.tsx             # Main game screen: orchestrates deal/action/settle flow
    │   ├── Card.tsx                  # Single card: pure CSS rendering + Framer Motion animations
    │   ├── DealerHand.tsx            # Dealer's cards + total display
    │   ├── PlayerHand.tsx            # Player hand(s), supports splits, shows results
    │   ├── HandTotal.tsx             # Displays hard/soft total badge
    │   ├── ActionButtons.tsx         # Hit, Stand, Double, Split, Surrender (with keyboard shortcuts)
    │   └── BetControls.tsx           # Chip-style bet selector + Deal button
    └── feedback/
        ├── StrategyModal.tsx         # Wrong-move popup: shows correct play + explanation
        └── StatsPanel.tsx            # Top bar: hands played, accuracy %, streak
```

## Architecture

### Data Flow

1. **SetupPage** writes rule config to `settingsStore` → user clicks "Start Training"
2. **GameTable** mounts → calls `gameStore.initGame(rules)` to create shoe
3. Player places bet → `gameStore.deal()` deals cards (filtered by practice mode)
4. Player clicks action → **GameTable** calls `advisor.getCorrectAction()` to check against strategy → if wrong, **StrategyModal** shows feedback → action executes (or blocks, depending on setting)
5. All hands complete → `playDealer()` runs dealer AI → `payout.settleHand()` resolves results
6. Stats updated in `statsStore`, persisted to localStorage

### Strategy Engine (charts.ts)

Uses a **base chart + overrides** pattern:
- **Base charts**: 4-8 deck, Dealer Stands on Soft 17 (S17), DAS allowed
- **Override patches** applied for: H17, single deck, double deck, no DAS
- Three chart types: hard totals (5-21), soft totals (A+2 through A+9), pairs (2-2 through A-A)
- Compound actions (D, Ds, Ph, Rh, Rs, Rp) resolved at runtime based on what's currently allowed

### Game State Machine (gameStore.ts)

Phases: `betting` → `dealing` → `player_turn` → `dealer_turn` → `settling` → `complete`

The `playDealer()` function is called from `GameTable` via `useEffect` when phase becomes `dealer_turn`. It runs the dealer draw loop and settles all hands in one update.

## TypeScript Conventions

- **`verbatimModuleSyntax` is enabled** — use `import type { ... }` for type-only imports
- **`strict` mode** with `noUnusedLocals` and `noUnusedParameters` — no dead code allowed
- Prefix intentionally unused parameters with `_` (e.g., `_event`)
- Engine and strategy modules are pure TypeScript (no React imports) — keep them framework-agnostic

## Workflow Rules

- Always run `npm run build` (or `npx tsc --noEmit`) before considering a change complete — the build must pass with zero errors
- Keep `engine/` and `strategy/` free of React dependencies — they contain pure game logic
- When modifying strategy charts, verify correctness against standard basic strategy references
- Zustand stores use the `persist` middleware for `settingsStore` and `statsStore` — changes to their shape may require clearing localStorage or handling migration
- Cards are rendered with pure CSS (no image assets) — the `Card.tsx` component draws suits and ranks with Unicode symbols and styled divs

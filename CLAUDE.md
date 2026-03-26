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
├── index.css                         # Global styles, Tailwind, CSS variables, animations
│
├── engine/                           # Pure game logic (no React)
│   ├── types.ts                      #   Card, Suit, Rank, HandState, GameState types
│   ├── shoe.ts                       #   Deck creation, shuffle (Fisher-Yates), draw
│   ├── hand.ts                       #   Hand evaluation: value, isSoft, isBust, isBlackjack, isPair
│   ├── payout.ts                     #   Hand settlement and payout calculation
│   └── sounds.ts                     #   Web Audio API sound effects + global volume control
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
    │   └── SetupPage.tsx             # Landing page: rule config, display/audio settings, Start button
    ├── game/
    │   ├── GameTable.tsx             # Main game screen: orchestrates deal/action/settle flow
    │   ├── Card.tsx                  # Single card: pure CSS rendering + Framer Motion animations
    │   ├── DealerHand.tsx            # Dealer's cards + total display
    │   ├── PlayerHand.tsx            # Player hand(s), supports splits, shows results
    │   ├── HandTotal.tsx             # Displays hard/soft total badge
    │   ├── ActionButtons.tsx         # Hit, Stand, Double, Split, Surrender (with keyboard shortcuts)
    │   ├── BetControls.tsx           # Chip-style bet selector + Deal button
    │   └── SettingsModal.tsx         # In-game settings overlay (rules, display, audio, back to menu)
    └── feedback/
        ├── StrategyModal.tsx         # Wrong-move popup: shows correct play + explanation
        ├── StrategyChartModal.tsx    # Full strategy chart overlay with hard/soft/pairs tabs
        ├── StatsPanel.tsx            # Top bar: hands played, accuracy %, streak
        └── ResultAnnouncement.tsx    # Hand result display
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

### Sound Engine (sounds.ts)

Web Audio API with a global `_masterVolume` multiplier (0-1). All `tone()` calls scale `vol * _masterVolume`. Volume is synced from `rules.soundVolume` via a `useEffect` in GameTable that calls `setMasterVolume(rules.soundVolume / 100)`.

### Settings (RuleSet in strategy/types.ts)

Includes both game rules and display/audio settings:
- Game: `numDecks`, `dealerHitsSoft17`, `surrenderAllowed`, `dasAllowed`, `hitSplitAces`
- Training: `practiceMode` (all/hard/soft/splits), `wrongMoveAction` (execute/block)
- Display: `showHandTotals` (boolean)
- Audio: `soundVolume` (0-100)

## Layout Architecture (GameTable)

The game screen uses a **fixed flex layout** to prevent any content shifting:

```
h-screen flex flex-col
├── Top bar: shrink-0, h-[88px], padding 0 24px
├── Dealer zone: flex-[4], centered
├── Divider: shrink-0, message pill
├── Player zone: flex-[6]
│   ├── Card area: flex-1, centered
│   └── Controls container: shrink-0, height 270px, position relative
│       └── All control phases: position absolute, inset-x-0 top-0 bottom-0
```

**The controls container (270px) uses absolute positioning for ALL phase content** (betting, player_turn, dealer_turn, complete). This prevents AnimatePresence exit/enter overlap from causing layout shifts in the card area above.

## Design System

### Button Tiers

| Tier | Examples | Padding | Font | Style |
|------|----------|---------|------|-------|
| CTA (gold) | Deal, Next Hand, Start Training | 20-24px vert, 96px horiz | 20-22px | 5-stop gold gradient, `cta-pulse` glow animation |
| Primary action | Hit, Stand | 230×110px | 1.7rem | Color gradient per action, 1.5px white border |
| Secondary action | Double, Split, Surrender | 180×90px | 1.35rem | Color gradient per action, 1.5px white border |
| Modal action | Play Correct Move, Got it | 18px 32px | 16px | Gradient, 1.5px border |
| Toolbar | Settings, Charts | 12px 24px | base | `rgba(255,255,255,0.07)` bg, 1px border |

### Chips (BetControls)

96×96px circles, 16px font, 3px dashed colored border, inner ring shadow. Clear button always rendered (invisible when no bet) to prevent layout shift.

### Cards (Card.tsx)

164×230px, layered box-shadow (depth + ground contact + top shine), 1.5px inner border on back. Spring animation: stiffness 180, damping 22. z-index based on card index.

### CTA Glow Animation

Defined in `index.css` as `cta-pulse` keyframe: 3-second `cubic-bezier(0.4, 0, 0.6, 1)` cycle that smoothly ebbs and flows shadow intensity. NOT a blink — a gradual pulse.

### Custom Selects

`appearance: none` with SVG data URI chevron arrow in `index.css`. Styled to match the dark theme with `rgba(255,255,255,0.09)` background and 12px border-radius.

## Critical UI Rules

These rules were established through iterative feedback. **Follow them strictly.**

### 1. NEVER conditionally render elements inside flex-centered containers (TOLD 3+ TIMES)

Any element that appears/disappears inside a `justify-center` flex container will cause ALL siblings to shift position. This was the #1 recurring bug.

**Solution**: Always render the element. Use the `invisible` CSS class to hide it visually while preserving its layout space. Use fixed-height slots (`minHeight`) for elements that toggle visibility.

**Examples**:
- PlayerHand active dots: always rendered in a `minHeight: 36px` slot, `invisible` when inactive
- BetControls clear button: always rendered, transparent color/border when no bet
- Controls container: 270px fixed height with absolute-positioned children

### 2. Text and content must NEVER touch container edges (TOLD 3+ TIMES)

All modals, bubbles, badges, and containers must have generous inner padding. Text clipping at borders looks terrible.

**Rules**:
- Modal header top padding MUST exceed border-radius (e.g., 32px padding for 28px border-radius)
- Use explicit pixel values in inline `style={{}}` for precise control — Tailwind classes can render too small
- Pill/badge padding: minimum `10px 28px` for result badges, `12px 40px` for message pills
- HandTotal: `px-8 py-2.5` with `whitespace-nowrap`
- Modal content: `padding: 28px 36px` minimum

### 3. Modals must have proper spacing and sizing

- Width: `min(92vw, 720px)` for settings, `min(92vw, 920px)` for charts
- Border-radius: 24-28px
- Margin from screen edge: 24px minimum
- Section gaps: 28-32px
- Row padding: 16-18px vertical, 24px horizontal
- Separate backdrop `div` from panel `div` for click-outside-to-close

### 4. Nothing should touch screen edges

- Top bar: `padding: 0 24px`
- Balance text: `whitespace-nowrap` to prevent wrapping/overflow
- Footer/CTA areas: `px-8 pb-8`

### 5. Buttons must have consistent styling within their tier

All buttons in the same tier share: gradient style, border weight, border-radius, padding, font-size, and hover behavior. See the Button Tiers table above.

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

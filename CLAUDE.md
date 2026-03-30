# CLAUDE.md

## Project Overview

Blackjack Trainer — browser-based app for practicing perfect basic strategy. Real-time feedback on deviations from optimal play. Configurable rules (deck count, H17/S17, DAS, surrender, etc.). All client-side, no backend.

## Tech Stack

React 19, TypeScript 5.9, Vite 8, Tailwind CSS v4, Framer Motion, Zustand (game/settings/stats stores), ESLint, localStorage persistence.

## Commands

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # tsc -b + Vite production build — MUST pass before any change is done
npm run lint       # ESLint (3 pre-existing errors: 2 access-before-declare, 1 constant-condition)
```

## Project Structure

- `src/engine/` — Pure game logic (no React): types, shoe, hand eval, payout, sounds, counting
- `src/strategy/` — Strategy engine (no React): charts (base + overrides), advisor, explanations, types
- `src/store/` — Zustand: gameStore (state machine + `playDealerSteps`), countStore, settingsStore, statsStore
- `src/components/game/` — GameTable (orchestrator), Card, DealerHand, PlayerHand, ActionButtons, BetControls, RunningCount, SettingsModal
- `src/components/feedback/` — StrategyModal, StrategyChartModal, StatsPanel, ResultAnnouncement
- `src/components/setup/` — SetupPage
- `src/hooks/` — Custom hooks: `useAnimatedNumber` (rAF number tween)
- `src/index.css` — Design tokens (~30 CSS custom properties), keyframe animations

## Architecture

**Game phases:** `betting` → `dealing` → `player_turn` → `dealer_turn` → `settling` → `complete`

**Dealer play** uses `playDealerSteps()` which returns step array applied sequentially via setTimeout for card-by-card animation.

**Split animation** uses fire-and-forget timeouts from a useEffect in GameTable, with `splitAnimatingRef` to disable buttons during animation.

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

### 10. Test at multiple viewport sizes during development, not after
Bugs at 1080p, 768p, and 390px are completely different. Check at least 3 sizes: large desktop, small laptop/tablet, phone.

## Workflow Rules

### Update memory on every git push
Every time changes are committed and pushed to git, update the memory system with relevant information from the changes. This includes:
- New features, architectural patterns, or design decisions worth remembering
- UI/UX feedback and preferences expressed during the session
- Project state changes (current branch focus, what's been completed, what's next)

Do NOT save code patterns, file paths, or anything derivable from the codebase itself — only context, decisions, and preferences that would be lost between sessions.

## TypeScript Conventions

- `verbatimModuleSyntax` enabled — use `import type { ... }` for type-only imports
- `strict` mode with `noUnusedLocals`/`noUnusedParameters` — prefix unused params with `_`
- `engine/` and `strategy/` must stay React-free

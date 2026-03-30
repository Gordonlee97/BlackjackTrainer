# Responsive Optimization Design

## Goal

Make the Blackjack Trainer work well on screens from 390px (modern phones, portrait) through large desktops (~1440px+), using fluid CSS `clamp()` scaling with no breakpoints.

## Constraints

- Minimum supported width: 390px (iPhone 14 / modern Android)
- Portrait orientation only
- Current big-screen look preserved as the `clamp()` ceiling
- Proportional scaling allowed — no need to pixel-match current layout
- Nothing should get "too small" — every token has a sensible floor
- Clean code is priority over preserving exact current pixel values

## Approach: CSS Custom Property Scaling

All sizing flows through CSS custom properties using `clamp(min, preferred, max)`:
- **min** = mobile floor (390px viewport)
- **preferred** = fluid vw-based middle value
- **max** = current desktop value (ceiling)

No breakpoints, no media queries, no Tailwind config changes. Purely fluid scaling.

## Section 1: Scaling Foundation — Existing Tokens

Convert all existing design tokens in `index.css` from fixed px to `clamp()`:

| Token | Current | Mobile Floor | Clamp |
|-------|---------|-------------|-------|
| `--space-xs` | 4px | 3px | `clamp(3px, 0.3vw, 4px)` |
| `--space-sm` | 8px | 5px | `clamp(5px, 0.6vw, 8px)` |
| `--space-md` | 16px | 10px | `clamp(10px, 1.2vw, 16px)` |
| `--space-lg` | 24px | 14px | `clamp(14px, 1.7vw, 24px)` |
| `--space-xl` | 32px | 18px | `clamp(18px, 2.2vw, 32px)` |
| `--space-2xl` | 48px | 24px | `clamp(24px, 3.3vw, 48px)` |
| `--text-xs` | 11px | 10px | `clamp(10px, 0.8vw, 11px)` |
| `--text-sm` | 13px | 11px | `clamp(11px, 0.95vw, 13px)` |
| `--text-base` | 15px | 13px | `clamp(13px, 1.1vw, 15px)` |
| `--text-lg` | 18px | 15px | `clamp(15px, 1.3vw, 18px)` |
| `--text-xl` | 22px | 17px | `clamp(17px, 1.55vw, 22px)` |
| `--text-2xl` | 28px | 20px | `clamp(20px, 2vw, 28px)` |
| `--text-3xl` | 36px | 24px | `clamp(24px, 2.5vw, 36px)` |
| `--radius-sm` | 8px | 6px | `clamp(6px, 0.6vw, 8px)` |
| `--radius-md` | 12px | 8px | `clamp(8px, 0.85vw, 12px)` |
| `--radius-lg` | 16px | 10px | `clamp(10px, 1.1vw, 16px)` |
| `--radius-xl` | 24px | 14px | `clamp(14px, 1.7vw, 24px)` |
| `--row-padding` | 16px 24px | Uses space tokens | `var(--space-md) var(--space-lg)` |

## Section 2: New Component-Specific Tokens

Added to `index.css` alongside existing tokens:

```css
/* Cards */
--card-w: clamp(100px, 12vw, 164px);
--card-h: clamp(140px, 16.8vw, 230px);
--card-overlap: clamp(-30px, -3.5vw, -48px);

/* Action buttons */
--btn-lg-w: clamp(150px, 16vw, 230px);
--btn-lg-h: clamp(72px, 7.6vw, 110px);
--btn-md-w: clamp(120px, 12.5vw, 180px);
--btn-md-h: clamp(60px, 6.2vw, 90px);

/* Bet chips */
--chip-btn-size: clamp(76px, 8vw, 116px);
--chip-size: clamp(42px, 4.5vw, 64px);

/* Layout sections */
--controls-h: clamp(180px, 19vw, 260px);
--topbar-h: clamp(56px, 6vw, 88px);
```

Components reference these tokens instead of hardcoded values.

## Section 3: Inline Style Cleanup

For ~100+ remaining hardcoded inline values across components:

1. **Replace with existing tokens** — e.g., `padding: '12px 24px'` becomes `padding: 'var(--space-sm) var(--space-lg)'`
2. **Replace with new component tokens** — card sizes, button sizes, etc.
3. **Use `clamp()` directly** for one-off values not worth a token — e.g., `fontSize: 'clamp(28px, 3vw, 44px)'`
4. **Leave as-is** for non-responsive values — box shadows, small border-radius, animation keyframe distances

### File priority order:
1. **Card.tsx** — card dimensions, overlap, internal font sizes
2. **GameTable.tsx** — top bar height, controls section height, gaps, padding
3. **ActionButtons.tsx** — button dimensions
4. **BetControls.tsx** — chip sizes, deal button padding
5. **PlayerHand.tsx** — payout text, badge sizing
6. **RunningCount.tsx** — container width, count font size
7. **SetupPage.tsx** — header sizing, title font
8. **StrategyModal.tsx** — padding, font sizes
9. **StrategyChartModal.tsx** — condensed cells + scroll fallback
10. **SettingsModal.tsx** — padding, toggle dimensions
11. **StatsPanel.tsx, HandTotal.tsx, CustomSelect.tsx** — minor tweaks

## Section 4: Strategy Chart Modal — Condense + Scroll

The chart grid (~10 columns x 17+ rows) gets special treatment:

1. **Condense:** Cell height from 42px to ~30px, cell font from 14px to ~11px, row header width from 72px to ~50px, tighten padding — all via `clamp()` tokens
2. **Scroll fallback:** Table wrapper gets `overflow-x: auto` — only activates on screens where even condensed cells don't fit
3. **Modal height:** Fixed 520px table height becomes `clamp(300px, 50vh, 520px)`

## Section 5: Out of Scope

- No layout restructuring (flex containers, absolute positioning, vertical stack stays)
- No landscape mode
- No breakpoints / media queries
- No Tailwind config changes
- No changes to game logic, store, engine, or strategy code
- Box shadows, small border-radius, animation keyframe distances left at fixed values
- No meta viewport changes (Vite default already includes it)

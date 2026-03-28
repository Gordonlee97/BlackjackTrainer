# Beautify: Design Consistency, Animations, Layout Polish

**Date:** 2026-03-27
**Branch:** beautify
**Approach:** Design tokens first, then migrate components, then add animations

## Scope

Three focus areas, in priority order:

1. **Design Consistency** — Extract a token system, unify all hardcoded values
2. **Animations & Micro-interactions** — Animated counters, correct play feedback, button springs, chip stacking, card dealing physics
3. **Layout & Spacing Polish** — Unified rows, toggles, modals, borders, type scale

Out of scope: responsive/mobile, visual richness (felt textures, atmosphere), strategy feedback UX redesign, confetti/particles, card result animations.

## 1. Design Token System

Expand the existing 11 CSS variables in `:root` (index.css) to ~30, organized by category. No new files — everything stays in `:root`.

### Colors (keep existing)

```css
--felt-green: #1a6b37;
--felt-dark: #0a2e14;
--card-white: #fafaf8;
--gold: #facc15;
--chip-red: #991b1b;
--chip-green: #166534;
--chip-black: #1e293b;
--chip-purple: #581c87;
```

### Borders (keep existing 3 tiers)

```css
--border-subtle: rgba(255, 255, 255, 0.07);
--border-light: rgba(255, 255, 255, 0.12);
--border-medium: rgba(255, 255, 255, 0.18);
```

All hardcoded border opacities (0.06, 0.08, 0.11, etc.) map to the nearest tier.

### Surfaces (expand from 2 to 4)

```css
--surface-dark: rgba(0, 0, 0, 0.32);
--surface-glass: rgba(255, 255, 255, 0.07);
--surface-overlay: rgba(0, 0, 0, 0.75);
--surface-section: rgba(0, 0, 0, 0.25);
```

### Modal background (new — one gradient for all modals)

```css
--modal-bg: linear-gradient(to bottom, #1c2b22, #0f1c15, #090f0b);
```

The blue-tinted StrategyModal gradient (`#1e2535 → #151c2c → #0f1520`) becomes green-tinted to match Settings and StrategyChart modals.

### Spacing scale (new)

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
```

### Type scale (new)

```css
--text-xs: 11px;    /* labels, stat headers */
--text-sm: 13px;    /* captions, keyboard shortcuts */
--text-base: 15px;  /* body text */
--text-lg: 18px;    /* emphasis */
--text-xl: 22px;    /* stats values, section headings */
--text-2xl: 28px;   /* modal titles */
--text-3xl: 36px;   /* balance display */
```

### Border radius (new)

```css
--radius-sm: 8px;     /* badges, small buttons */
--radius-md: 12px;    /* cards, inputs, selects */
--radius-lg: 16px;    /* sections, action buttons */
--radius-xl: 24px;    /* modals */
--radius-full: 9999px; /* pills, chips */
```

### Shadow tiers (new)

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.6);
--shadow-modal: 0 32px 100px rgba(0, 0, 0, 0.85);
```

### Row padding (new — unified)

```css
--row-padding: 16px 24px;
```

Used in both SetupPage and SettingsModal for all setting rows.

## 2. Animations & Micro-interactions

### 2a. Animated Number Counters

A `useAnimatedNumber` hook using `requestAnimationFrame` for ~300ms spring tweens. No new dependencies. Applied to:

- Balance display (GameTable top bar)
- Bet amount (BetControls)
- Stats values (StatsPanel — hands, accuracy, correct, streak, best)

### 2b. Correct Play Feedback

When the player makes the correct strategy decision:

1. **0ms:** The clicked action button flashes bright (border brightens from base to highlight color for that action)
2. **100ms:** A "Correct" pill fades in at the divider/message pill slot (green tint, `rgba(16,185,129,0.15)` bg, `#10b981` text)
3. **400ms:** Pill fades out, action executes normally

Uses the existing message pill slot in the divider. No layout changes required.

### 2c. Button Press Feel

Enhance existing Framer Motion `whileHover` and `whileTap` on ActionButtons:

- **Hover:** `scale: 1.04, y: -3`, shadow expands, border brightens slightly
- **Press:** `scale: 0.97, y: 1`, shadow contracts — "pressed in" feel
- Spring transition on both states

### 2d. Streak Milestone Pulse

At streak thresholds (5, 10, 25, 50), the streak counter in StatsPanel gets:

- `scale: 1 → 1.3 → 1` spring animation
- Temporary green glow (`text-shadow: 0 0 16px rgba(16,185,129,0.5)`)
- Color shifts to `#10b981` (emerald)

### 2e. Chip Stack in Bet Area

Replace the text-only bet display with a visual chip stack in BetControls:

- Small chips (64px diameter) stacked with `position: absolute` and 4px vertical offset per chip
- Mixed denominations show actual chip colors (red $5, green $25, blue $100, purple $500)
- Each chip animates in: `scale(0) → scale(1)` with spring, staggered 80ms
- AnimatePresence for chip enter/exit
- Max 10 visible chips in stack, then "xN" label for overflow
- Clear button removes chips with exit animation

### 2f. Card Dealing Animation

Replace the current dealing animation with snappier, physics-based "dealer flick":

**Current:**
```
initial: { x: 350, y: -60, opacity: 0, rotateY: 180, rotate: -5 }
spring: stiffness 160, damping 20, mass 0.8
```

**New:**
```
initial: { x: 300, y: -20, rotate: -8, scale: 0.92, opacity: 1 }
animate: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
spring: stiffness 280, damping 26, mass 0.6
```

Key changes:
- **Visible immediately** — no opacity fade, cards arrive rather than materialize
- **Slight initial tilt** (-8deg) that levels out on landing
- **Scale 0.92 → 1** for subtle sense of distance/approach
- **Faster spring** (stiffness 280, mass 0.6) — snappy, not floaty
- **150ms stagger** between cards for dealer rhythm

**Settle bounce:** After the last card in the initial deal lands, all dealt cards get a barely-perceptible group micro-bounce:
- `y: 0 → -3 → 0`, `scale: 1 → 1.008 → 1`
- ~150ms duration, triggered ~100ms after last card settles
- Applied to both dealer and player card groups simultaneously

What is NOT changing:
- No arc/parabolic path (horizontal flick only)
- No shadow trail or motion blur
- No sound-synced bounce
- Settle bounce is barely perceptible (3px, sub-1% scale)
- Card-float (gentle bob) remains only for completed/settled hands

## 3. Layout & Spacing Polish

### Row padding unification

SetupPage rows (currently 16px vertical) and SettingsModal rows (currently 18px vertical) both use `var(--row-padding)`. Identical visual rhythm.

### Toggle size unification

SettingsModal toggles (currently 52x30px) match SetupPage toggles (58x34px). One size everywhere.

### Modal unification

All three modals (SettingsModal, StrategyModal, StrategyChartModal) share:
- Background: `var(--modal-bg)` — the green-tinted gradient
- Border radius: `var(--radius-xl)` (24px)
- Shadow: `var(--shadow-modal)`
- Border: `1px solid var(--border-light)`
- Backdrop: `var(--surface-overlay)` with backdrop-filter blur

### Border opacity normalization

Every hardcoded `rgba(255,255,255,0.XX)` border maps to `--border-subtle`, `--border-light`, or `--border-medium`. No more one-off values.

### Typography normalization

Scattered font sizes (13px/14px/15px/16px in body text) normalize to type scale tokens:
- Stat labels, section headers: `var(--text-xs)` 11px
- Captions, keyboard shortcuts, rule descriptions: `var(--text-sm)` 13px
- Body text, row labels: `var(--text-base)` 15px
- Emphasis, count display: `var(--text-lg)` 18px
- Stat values, section headings: `var(--text-xl)` 22px
- Modal titles: `var(--text-2xl)` 28px
- Balance display: `var(--text-3xl)` 36px

### Controls container height

Unify to 320px (matches CLAUDE.md documentation). Update any code referencing 270px.

## Files Modified

Token extraction and migration will touch:
- `src/index.css` — token definitions
- `src/components/setup/SetupPage.tsx` — tokens + row padding
- `src/components/game/GameTable.tsx` — tokens + settle bounce orchestration
- `src/components/game/Card.tsx` — new dealing animation
- `src/components/game/ActionButtons.tsx` — button springs + correct flash
- `src/components/game/BetControls.tsx` — chip stack + animated numbers
- `src/components/game/SettingsModal.tsx` — tokens + toggle size + row padding
- `src/components/game/HandTotal.tsx` — tokens
- `src/components/game/RunningCount.tsx` — tokens
- `src/components/feedback/StatsPanel.tsx` — animated numbers + streak pulse
- `src/components/feedback/StrategyModal.tsx` — modal-bg token (blue → green)
- `src/components/feedback/StrategyChartModal.tsx` — tokens
- `src/components/feedback/ResultAnnouncement.tsx` — tokens

New code (not new files):
- `useAnimatedNumber` hook — in `src/hooks/useAnimatedNumber.ts`

# Responsive Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Blackjack Trainer scale fluidly from 390px (mobile portrait) to large desktops using CSS `clamp()` tokens — no breakpoints, no layout restructuring.

**Architecture:** Convert all design tokens to `clamp(min, vw, max)`. Add new component-specific tokens for cards, buttons, chips, and layout sections. Replace ~100+ inline hardcoded px values in components with token references or inline `clamp()`.

**Tech Stack:** CSS custom properties, `clamp()`, existing Tailwind v4 + Framer Motion (unchanged)

---

### Task 1: Convert Existing Design Tokens to Fluid Clamp Values

**Files:**
- Modify: `src/index.css:28-59`

- [ ] **Step 1: Replace spacing tokens with clamp values**

In `src/index.css`, replace lines 28-34:

```css
  /* ── Spacing scale ── */
  --space-xs: clamp(3px, 0.3vw, 4px);
  --space-sm: clamp(5px, 0.6vw, 8px);
  --space-md: clamp(10px, 1.2vw, 16px);
  --space-lg: clamp(14px, 1.7vw, 24px);
  --space-xl: clamp(18px, 2.2vw, 32px);
  --space-2xl: clamp(24px, 3.3vw, 48px);
```

- [ ] **Step 2: Replace type scale tokens with clamp values**

Replace lines 36-43:

```css
  /* ── Type scale ── */
  --text-xs: clamp(10px, 0.8vw, 11px);
  --text-sm: clamp(11px, 0.95vw, 13px);
  --text-base: clamp(13px, 1.1vw, 15px);
  --text-lg: clamp(15px, 1.3vw, 18px);
  --text-xl: clamp(17px, 1.55vw, 22px);
  --text-2xl: clamp(20px, 2vw, 28px);
  --text-3xl: clamp(24px, 2.5vw, 36px);
```

- [ ] **Step 3: Replace border radius tokens with clamp values**

Replace lines 45-50:

```css
  /* ── Border radius ── */
  --radius-sm: clamp(6px, 0.6vw, 8px);
  --radius-md: clamp(8px, 0.85vw, 12px);
  --radius-lg: clamp(10px, 1.1vw, 16px);
  --radius-xl: clamp(14px, 1.7vw, 24px);
  --radius-full: 9999px;
```

- [ ] **Step 4: Update row-padding to use spacing tokens**

Replace line 59:

```css
  --row-padding: var(--space-md) var(--space-lg);
```

- [ ] **Step 5: Verify the dev server still works**

Run: `npm run dev`
Expected: Dev server starts without errors. Open browser and check current layout looks similar to before on desktop.

- [ ] **Step 6: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 7: Commit**

```bash
git add src/index.css
git commit -m "feat: convert design tokens to fluid clamp() values for responsive scaling"
```

---

### Task 2: Add Component-Specific Tokens

**Files:**
- Modify: `src/index.css` (add new tokens inside `:root` block, after existing tokens before closing `}`)

- [ ] **Step 1: Add card, button, chip, and layout tokens**

After the `--row-padding` line (59) and before the closing `}` of `:root`, add:

```css
  /* ── Card dimensions ── */
  --card-w: clamp(100px, 12vw, 164px);
  --card-h: clamp(140px, 16.8vw, 230px);
  --card-overlap: clamp(-30px, -3.5vw, -48px);
  --card-rank-size: clamp(18px, 2vw, 28px);
  --card-suit-sm: clamp(14px, 1.5vw, 21px);
  --card-suit-lg: clamp(40px, 4.5vw, 64px);
  --card-padding: clamp(8px, 1vw, 14px) clamp(10px, 1.1vw, 16px);

  /* ── Action buttons ── */
  --btn-lg-w: clamp(150px, 16vw, 230px);
  --btn-lg-h: clamp(72px, 7.6vw, 110px);
  --btn-md-w: clamp(120px, 12.5vw, 180px);
  --btn-md-h: clamp(60px, 6.2vw, 90px);
  --btn-radius: clamp(14px, 1.5vw, 22px);
  --btn-lg-font: clamp(1.2rem, 1.5vw, 1.7rem);
  --btn-md-font: clamp(1rem, 1.2vw, 1.35rem);

  /* ── Bet chips ── */
  --chip-btn-size: clamp(76px, 8vw, 116px);
  --chip-size: clamp(42px, 4.5vw, 64px);
  --chip-stack-h: clamp(52px, 5.5vw, 80px);

  /* ── Layout sections ── */
  --controls-h: clamp(180px, 19vw, 260px);
  --topbar-h: clamp(56px, 6vw, 88px);
  --divider-h: clamp(36px, 3.8vw, 52px);

  /* ── CTA / Deal buttons ── */
  --cta-padding-y: clamp(14px, 1.6vw, 22px);
  --cta-padding-x: clamp(48px, 8vw, 120px);
  --cta-radius: clamp(12px, 1.3vw, 18px);

  /* ── Running count ── */
  --count-width: clamp(180px, 18vw, 256px);
  --count-font: clamp(40px, 4.5vw, 64px);
  --count-sign-font: clamp(24px, 2.5vw, 36px);

  /* ── Strategy chart ── */
  --chart-cell-h: clamp(28px, 3vw, 42px);
  --chart-cell-font: clamp(11px, 1vw, 14px);
  --chart-row-header-w: clamp(48px, 5vw, 72px);
  --chart-table-h: clamp(300px, 50vh, 520px);
  --chart-legend-size: clamp(24px, 2.5vw, 34px);

  /* ── Modals ── */
  --modal-padding-x: clamp(20px, 2.8vw, 40px);
  --modal-padding-y: clamp(20px, 2.5vw, 36px);
  --modal-title-font: clamp(20px, 1.8vw, 28px);
  --modal-emoji-font: clamp(32px, 3.5vw, 48px);

  /* ── Setup page ── */
  --setup-logo: clamp(44px, 5vw, 72px);
  --setup-title: clamp(28px, 3.2vw, 44px);

  /* ── Stats panel ── */
  --stats-padding: clamp(10px, 1.3vw, 18px) clamp(20px, 2.8vw, 40px);
  --stats-gap: clamp(18px, 2.5vw, 36px);

  /* ── Payout text ── */
  --payout-font: clamp(28px, 3.2vw, 44px);

  /* ── Badge (result & hand total) ── */
  --badge-padding: clamp(8px, 0.9vw, 12px) clamp(18px, 2.2vw, 32px);
  --badge-font: clamp(1.1rem, 1.3vw, 1.7rem);
  --badge-slot-h: clamp(32px, 3.2vw, 44px);
  --badge-offset-top: clamp(20px, 2.5vw, 36px);

  /* ── Toggle switch ── */
  --toggle-w: clamp(42px, 4.2vw, 58px);
  --toggle-h: clamp(26px, 2.5vw, 34px);
  --toggle-knob: clamp(18px, 1.8vw, 24px);
  --toggle-inset: clamp(2px, 0.3vw, 4px);

  /* ── Misc ── */
  --shoe-bar-h: 24px;
  --gap-cards: clamp(24px, 3.5vw, 56px);
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add component-specific responsive tokens (cards, buttons, chips, layout)"
```

---

### Task 3: Make Card.tsx Responsive

**Files:**
- Modify: `src/components/game/Card.tsx`

- [ ] **Step 1: Replace card dimensions and overlap**

In `Card.tsx`, replace line 34:
```tsx
      style={{ marginLeft: index > 0 ? '-48px' : '0', zIndex: index }}
```
with:
```tsx
      style={{ marginLeft: index > 0 ? 'var(--card-overlap)' : '0', zIndex: index }}
```

Replace line 76:
```tsx
        className={`w-[164px] h-[230px] rounded-2xl ${settled ? 'card-float' : ''}`}
```
with:
```tsx
        className={`rounded-2xl ${settled ? 'card-float' : ''}`}
        style={{ width: 'var(--card-w)', height: 'var(--card-h)', ...(settled ? { animationDelay: `${index * 0.4}s` } : {}) }}
```

Note: Since we're moving to a style-based width/height, the `style` prop from line 77 needs to be merged. Remove the old line 77:
```tsx
        style={settled ? { animationDelay: `${index * 0.4}s` } : undefined}
```

- [ ] **Step 2: Replace CardFront font sizes and padding**

In `CardFront`, replace line 97:
```tsx
        padding: '14px 16px',
```
with:
```tsx
        padding: 'var(--card-padding)',
```

Replace line 105:
```tsx
        <div className="font-black leading-none tracking-tight" style={{ fontSize: '28px' }}>{rank}</div>
```
with:
```tsx
        <div className="font-black leading-none tracking-tight" style={{ fontSize: 'var(--card-rank-size)' }}>{rank}</div>
```

Replace line 106:
```tsx
        <div className="leading-none mt-1" style={{ fontSize: '21px' }}>{symbol}</div>
```
with:
```tsx
        <div className="leading-none mt-1" style={{ fontSize: 'var(--card-suit-sm)' }}>{symbol}</div>
```

Replace line 108:
```tsx
      <div className="text-center leading-none" style={{ fontSize: '64px' }}>{symbol}</div>
```
with:
```tsx
      <div className="text-center leading-none" style={{ fontSize: 'var(--card-suit-lg)' }}>{symbol}</div>
```

Replace line 110:
```tsx
        <div className="font-black leading-none tracking-tight" style={{ fontSize: '28px' }}>{rank}</div>
```
with:
```tsx
        <div className="font-black leading-none tracking-tight" style={{ fontSize: 'var(--card-rank-size)' }}>{rank}</div>
```

Replace line 111:
```tsx
        <div className="leading-none mt-1" style={{ fontSize: '21px' }}>{symbol}</div>
```
with:
```tsx
        <div className="leading-none mt-1" style={{ fontSize: 'var(--card-suit-sm)' }}>{symbol}</div>
```

- [ ] **Step 3: Replace CardBack padding**

Replace line 127:
```tsx
      <div className="w-full h-full" style={{ padding: '12px' }}>
```
with:
```tsx
      <div className="w-full h-full" style={{ padding: 'var(--space-sm)' }}>
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 5: Commit**

```bash
git add src/components/game/Card.tsx
git commit -m "feat: make Card component responsive with fluid tokens"
```

---

### Task 4: Make GameTable.tsx Responsive

**Files:**
- Modify: `src/components/game/GameTable.tsx`

- [ ] **Step 1: Replace top bar height and padding**

Replace line 389:
```tsx
        className="shrink-0 flex items-center justify-between h-[88px] relative"
```
with:
```tsx
        className="shrink-0 flex items-center justify-between relative"
```

Replace line 390:
```tsx
        style={{ background: 'var(--surface-dark)', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}
```
with:
```tsx
        style={{ height: 'var(--topbar-h)', background: 'var(--surface-dark)', borderBottom: '1px solid var(--border-subtle)', padding: '0 var(--space-lg)' }}
```

- [ ] **Step 2: Replace Settings/Charts button padding**

Replace both instances of (lines 400 and 416):
```tsx
              padding: '12px 24px',
```
with:
```tsx
              padding: 'var(--space-sm) var(--space-lg)',
```

- [ ] **Step 3: Replace shoe bar width**

Replace line 433:
```tsx
            <div className="relative bg-black/50 rounded-full overflow-hidden" style={{ width: `${250 + rules.numDecks * 15}px`, height: '24px' }}>
```
with:
```tsx
            <div className="relative bg-black/50 rounded-full overflow-hidden" style={{ width: `clamp(${150 + rules.numDecks * 10}px, ${17 + rules.numDecks}vw, ${250 + rules.numDecks * 15}px)`, height: 'var(--shoe-bar-h)' }}>
```

- [ ] **Step 4: Replace shoe percent font**

Replace line 454:
```tsx
            <span style={{ fontSize: '16px', fontWeight: 700, color: shoePercent > 25 ? 'rgba(255,255,255,0.40)' : 'rgba(239,68,68,0.8)', minWidth: '42px' }}>{Math.round(shoePercent)}%</span>
```
with:
```tsx
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: shoePercent > 25 ? 'rgba(255,255,255,0.40)' : 'rgba(239,68,68,0.8)', minWidth: '42px' }}>{Math.round(shoePercent)}%</span>
```

- [ ] **Step 5: Replace divider height**

Replace line 483:
```tsx
      <div className="shrink-0 flex items-center gap-6 px-12" style={{ height: '52px' }}>
```
with:
```tsx
      <div className="shrink-0 flex items-center gap-6 px-12" style={{ height: 'var(--divider-h)' }}>
```

- [ ] **Step 6: Replace message pill padding**

Replace line 490:
```tsx
              style={{ padding: '12px 40px', background: 'var(--surface-dark)', border: '1px solid var(--border-light)' }}
```
with:
```tsx
              style={{ padding: 'var(--space-sm) var(--modal-padding-x)', background: 'var(--surface-dark)', border: '1px solid var(--border-light)' }}
```

- [ ] **Step 7: Replace correct flash padding**

Replace line 507:
```tsx
                padding: '8px 24px',
```
with:
```tsx
                padding: 'var(--space-sm) var(--space-lg)',
```

- [ ] **Step 8: Replace player cards gap**

Replace line 530:
```tsx
          <div className="flex gap-14 items-start justify-center">
```
with:
```tsx
          <div className="flex items-start justify-center" style={{ gap: 'var(--gap-cards)' }}>
```

- [ ] **Step 9: Replace cards container padding**

Replace line 528:
```tsx
          style={{ paddingBottom: '12px' }}
```
with:
```tsx
          style={{ paddingBottom: 'var(--space-sm)' }}
```

- [ ] **Step 10: Replace controls section height**

Replace line 549:
```tsx
        <div className="shrink-0 relative" style={{ height: '260px' }}>
```
with:
```tsx
        <div className="shrink-0 relative" style={{ height: 'var(--controls-h)' }}>
```

- [ ] **Step 11: Replace all control variant paddingBottom values**

Replace all 4 instances of (lines 555, 574, 599, 629):
```tsx
                style={{ paddingBottom: '24px' }}
```
with:
```tsx
                style={{ paddingBottom: 'var(--space-lg)' }}
```

- [ ] **Step 12: Replace Next Hand button styling**

Replace lines 648-655:
```tsx
                  className="font-black uppercase tracking-widest cta-pulse"
                  style={{
                    padding: '22px 120px',
                    fontSize: 'var(--text-xl)',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                    border: 'none',
                    color: '#1a1a1a',
                    boxShadow: '0 8px 32px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)',
                  }}
```
with:
```tsx
                  className="font-black uppercase tracking-widest cta-pulse"
                  style={{
                    padding: 'var(--cta-padding-y) var(--cta-padding-x)',
                    fontSize: 'var(--text-xl)',
                    borderRadius: 'var(--cta-radius)',
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                    border: 'none',
                    color: '#1a1a1a',
                    boxShadow: '0 8px 32px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)',
                  }}
```

- [ ] **Step 13: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 14: Commit**

```bash
git add src/components/game/GameTable.tsx
git commit -m "feat: make GameTable responsive with fluid tokens"
```

---

### Task 5: Make ActionButtons.tsx Responsive

**Files:**
- Modify: `src/components/game/ActionButtons.tsx`

- [ ] **Step 1: Replace button dimensions with tokens**

Replace lines 52-53:
```tsx
  const w = size === 'lg' ? 230 : 180;
  const h = size === 'lg' ? 110 : 90;
```
with:
```tsx
  const w = size === 'lg' ? 'var(--btn-lg-w)' : 'var(--btn-md-w)';
  const h = size === 'lg' ? 'var(--btn-lg-h)' : 'var(--btn-md-h)';
```

- [ ] **Step 2: Replace border radius**

Replace line 70:
```tsx
        borderRadius: '22px',
```
with:
```tsx
        borderRadius: 'var(--btn-radius)',
```

- [ ] **Step 3: Replace label font sizes**

Replace line 79:
```tsx
      <span style={{ fontSize: size === 'lg' ? '1.7rem' : '1.35rem', lineHeight: 1 }}>{label}</span>
```
with:
```tsx
      <span style={{ fontSize: size === 'lg' ? 'var(--btn-lg-font)' : 'var(--btn-md-font)', lineHeight: 1 }}>{label}</span>
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 5: Commit**

```bash
git add src/components/game/ActionButtons.tsx
git commit -m "feat: make ActionButtons responsive with fluid tokens"
```

---

### Task 6: Make BetControls.tsx Responsive

**Files:**
- Modify: `src/components/game/BetControls.tsx`

- [ ] **Step 1: Replace chip stack container dimensions**

Replace line 74:
```tsx
      <div style={{ position: 'relative', height: 80, width: 64, margin: '16px auto 0', visibility: currentBet > 0 ? 'visible' : 'hidden' }}>
```
with:
```tsx
      <div style={{ position: 'relative', height: 'var(--chip-stack-h)', width: 'var(--chip-size)', margin: 'var(--space-md) auto 0', visibility: currentBet > 0 ? 'visible' : 'hidden' }}>
```

- [ ] **Step 2: Replace individual chip sizes in stack**

Replace lines 92-93:
```tsx
                width: 64,
                height: 64,
```
with:
```tsx
                width: 'var(--chip-size)',
                height: 'var(--chip-size)',
```

Also replace the `left: 0` and `width: 64` in the overflow count badge (lines 115-116):
```tsx
            left: 0,
            width: 64,
```
with:
```tsx
            left: 0,
            width: 'var(--chip-size)',
```

- [ ] **Step 3: Replace chip button sizes**

Replace lines 140-141:
```tsx
                width: '116px',
                height: '116px',
```
with:
```tsx
                width: 'var(--chip-btn-size)',
                height: 'var(--chip-btn-size)',
```

- [ ] **Step 4: Replace chips row gap**

Replace line 128:
```tsx
      <div className="flex items-center" style={{ gap: '20px', marginTop: '24px' }}>
```
with:
```tsx
      <div className="flex items-center" style={{ gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
```

- [ ] **Step 5: Replace Deal button styling**

Replace lines 185-186 (canDeal true branch):
```tsx
          marginTop: '28px',
          padding: '22px 120px',
```
with:
```tsx
          marginTop: 'var(--space-xl)',
          padding: 'var(--cta-padding-y) var(--cta-padding-x)',
```

Replace line 188:
```tsx
          borderRadius: '18px',
```
with:
```tsx
          borderRadius: 'var(--cta-radius)',
```

Do the same for the disabled branch (lines 195-196, 198):
```tsx
          marginTop: '28px',
          padding: '22px 120px',
```
to:
```tsx
          marginTop: 'var(--space-xl)',
          padding: 'var(--cta-padding-y) var(--cta-padding-x)',
```

And line 198:
```tsx
          borderRadius: '18px',
```
to:
```tsx
          borderRadius: 'var(--cta-radius)',
```

- [ ] **Step 6: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 7: Commit**

```bash
git add src/components/game/BetControls.tsx
git commit -m "feat: make BetControls responsive with fluid tokens"
```

---

### Task 7: Make PlayerHand.tsx Responsive

**Files:**
- Modify: `src/components/game/PlayerHand.tsx`

- [ ] **Step 1: Replace locked-in card overlap**

Replace line 82:
```tsx
              gap: lockedIn ? '-58px' : undefined,
```
with:
```tsx
              gap: lockedIn ? 'var(--card-overlap)' : undefined,
```

- [ ] **Step 2: Replace payout text font size**

Replace line 120:
```tsx
              fontSize: '44px',
```
with:
```tsx
              fontSize: 'var(--payout-font)',
```

- [ ] **Step 3: Replace result badge slot height and offset**

Replace line 138:
```tsx
      <div className="flex items-center justify-center" style={{ height: '44px', position: 'relative', top: '36px', opacity: hideOverlays ? 0 : 1, transition: 'opacity 0.15s' }}>
```
with:
```tsx
      <div className="flex items-center justify-center" style={{ height: 'var(--badge-slot-h)', position: 'relative', top: 'var(--badge-offset-top)', opacity: hideOverlays ? 0 : 1, transition: 'opacity 0.15s' }}>
```

- [ ] **Step 4: Replace result badge padding and font**

Replace lines 144-146:
```tsx
            className={`text-lg font-black rounded-full whitespace-nowrap ${result.classes} ${result.shimmer ? 'result-shimmer' : ''}`}
            style={{
              padding: '12px 32px',
```
with:
```tsx
            className={`font-black rounded-full whitespace-nowrap ${result.classes} ${result.shimmer ? 'result-shimmer' : ''}`}
            style={{
              padding: 'var(--badge-padding)',
              fontSize: 'var(--badge-font)',
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 6: Commit**

```bash
git add src/components/game/PlayerHand.tsx
git commit -m "feat: make PlayerHand responsive with fluid tokens"
```

---

### Task 8: Make RunningCount.tsx Responsive

**Files:**
- Modify: `src/components/game/RunningCount.tsx`

- [ ] **Step 1: Replace container dimensions and padding**

Replace lines 44-48:
```tsx
      style={{
        padding: '20px 36px 32px 36px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        width: '256px',
```
with:
```tsx
      style={{
        padding: 'var(--space-md) var(--modal-padding-x) var(--space-xl) var(--modal-padding-x)',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        width: 'var(--count-width)',
```

- [ ] **Step 2: Replace label font size and margin**

Replace line 56:
```tsx
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}
```
with:
```tsx
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-md)' }}
```

- [ ] **Step 3: Replace count display height and font**

Replace line 60:
```tsx
      <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
```
with:
```tsx
      <div style={{ height: 'var(--count-font)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
```

Replace line 66:
```tsx
              style={{ fontSize: '64px', display: 'inline-flex', alignItems: 'baseline', marginLeft: '-8px' }}
```
with:
```tsx
              style={{ fontSize: 'var(--count-font)', display: 'inline-flex', alignItems: 'baseline', marginLeft: '-8px' }}
```

Replace line 72 (the sign span):
```tsx
              {sign && <span style={{ fontSize: '36px', marginRight: '2px', width: '22px', textAlign: 'right', position: 'relative', top: '-4px', left: '-3px' }}>{sign}</span>}
```
with:
```tsx
              {sign && <span style={{ fontSize: 'var(--count-sign-font)', marginRight: '2px', width: '22px', textAlign: 'right', position: 'relative', top: '-4px', left: '-3px' }}>{sign}</span>}
```

Replace line 79:
```tsx
              style={{ fontSize: '64px' }}
```
with:
```tsx
              style={{ fontSize: 'var(--count-font)' }}
```

- [ ] **Step 4: Replace hover hint font**

Replace line 93:
```tsx
          style={{ color: 'rgba(255,255,255,0.30)', fontSize: '14px', fontWeight: 600, marginTop: '12px', letterSpacing: '0.04em' }}
```
with:
```tsx
          style={{ color: 'rgba(255,255,255,0.30)', fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 'var(--space-sm)', letterSpacing: '0.04em' }}
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 6: Commit**

```bash
git add src/components/game/RunningCount.tsx
git commit -m "feat: make RunningCount responsive with fluid tokens"
```

---

### Task 9: Make SetupPage.tsx Responsive

**Files:**
- Modify: `src/components/setup/SetupPage.tsx`

- [ ] **Step 1: Replace header padding**

Replace line 23:
```tsx
          padding: '40px 32px 32px 32px',
```
with:
```tsx
          padding: 'var(--modal-padding-y) var(--space-xl) var(--space-xl) var(--space-xl)',
```

- [ ] **Step 2: Replace logo and title sizes**

Replace line 28:
```tsx
        <span style={{ fontSize: '72px', lineHeight: 1 }}>🃏</span>
```
with:
```tsx
        <span style={{ fontSize: 'var(--setup-logo)', lineHeight: 1 }}>🃏</span>
```

Replace line 30:
```tsx
          <h1 style={{ fontSize: '44px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>Blackjack Trainer</h1>
```
with:
```tsx
          <h1 style={{ fontSize: 'var(--setup-title)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>Blackjack Trainer</h1>
```

Replace line 31:
```tsx
          <p className="text-white/40 mt-2 tracking-wide" style={{ fontSize: '16px' }}>Practice perfect basic strategy</p>
```
with:
```tsx
          <p className="text-white/40 mt-2 tracking-wide" style={{ fontSize: 'var(--text-base)' }}>Practice perfect basic strategy</p>
```

- [ ] **Step 3: Replace start button styling**

Replace lines 113-114:
```tsx
          className="w-full max-w-2xl font-black uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98] cta-pulse"
          style={{
            padding: '24px',
            fontSize: '22px',
            borderRadius: '18px',
```
with:
```tsx
          className="w-full max-w-2xl font-black uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98] cta-pulse"
          style={{
            padding: 'var(--cta-padding-y)',
            fontSize: 'var(--text-xl)',
            borderRadius: 'var(--cta-radius)',
```

- [ ] **Step 4: Replace SelectRow label font**

Replace line 172:
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', fontWeight: 500 }}>{label}</span>
```
with:
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
```

- [ ] **Step 5: Replace ToggleRow label font and toggle dimensions**

Replace line 193:
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', fontWeight: 500 }}>{label}</span>
```
with:
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
```

Replace lines 197-199:
```tsx
          width: 58,
          height: 34,
          marginLeft: '16px',
```
with:
```tsx
          width: 'var(--toggle-w)',
          height: 'var(--toggle-h)',
          marginLeft: 'var(--space-md)',
```

Replace lines 209-211:
```tsx
            top: 4,
            left: 4,
            width: 24,
            height: 24,
```
with:
```tsx
            top: 'var(--toggle-inset)',
            left: 'var(--toggle-inset)',
            width: 'var(--toggle-knob)',
            height: 'var(--toggle-knob)',
```

Note: The `translateX(24px)` for the toggle knob should change to use `calc()`:
Replace line 215:
```tsx
            transform: checked ? 'translateX(24px)' : 'translateX(0)',
```
with:
```tsx
            transform: checked ? 'translateX(calc(var(--toggle-w) - var(--toggle-knob) - var(--toggle-inset) * 2))' : 'translateX(0)',
```

- [ ] **Step 6: Replace SliderRow font and minWidth**

Replace line 239:
```tsx
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', fontWeight: 500 }}>{label}</span>
```
with:
```tsx
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
```

Replace line 240:
```tsx
      <div className="flex items-center gap-4" style={{ minWidth: '260px' }}>
```
with:
```tsx
      <div className="flex items-center gap-4" style={{ minWidth: 'clamp(160px, 20vw, 260px)' }}>
```

- [ ] **Step 7: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 8: Commit**

```bash
git add src/components/setup/SetupPage.tsx
git commit -m "feat: make SetupPage responsive with fluid tokens"
```

---

### Task 10: Make StrategyModal.tsx Responsive

**Files:**
- Modify: `src/components/feedback/StrategyModal.tsx`

- [ ] **Step 1: Replace modal header padding and fonts**

Replace line 85:
```tsx
              style={{ padding: '36px 40px 28px 40px' }}
```
with:
```tsx
              style={{ padding: 'var(--modal-padding-y) var(--modal-padding-x) var(--space-xl) var(--modal-padding-x)' }}
```

Replace line 87:
```tsx
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
```
with:
```tsx
              <div style={{ fontSize: 'var(--modal-emoji-font)', marginBottom: 'var(--space-sm)' }}>
```

Replace line 90:
```tsx
              <h2 className="text-white font-black tracking-wide" style={{ fontSize: '24px' }}>
```
with:
```tsx
              <h2 className="text-white font-black tracking-wide" style={{ fontSize: 'var(--modal-title-font)' }}>
```

Replace line 95:
```tsx
                style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}
```
with:
```tsx
                style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 'var(--space-sm)' }}
```

- [ ] **Step 2: Replace action comparison padding**

Replace line 102:
```tsx
            <div style={{ padding: '0 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
```
with:
```tsx
            <div style={{ padding: '0 var(--modal-padding-x)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
```

Replace both action row padding instances (lines 106 and 118):
```tsx
                  padding: '18px 24px',
                  borderRadius: '16px',
```
with:
```tsx
                  padding: 'var(--space-md) var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
```

Replace all 4 action text font sizes (lines 112, 113, 124, 125):
```tsx
                style={{ fontSize: '16px' }}
```
with:
```tsx
                style={{ fontSize: 'var(--text-base)' }}
```

- [ ] **Step 3: Replace explanation section padding**

Replace line 130:
```tsx
            <div style={{ padding: '24px 40px 0 40px' }}>
```
with:
```tsx
            <div style={{ padding: 'var(--space-lg) var(--modal-padding-x) 0 var(--modal-padding-x)' }}>
```

Replace line 133:
```tsx
                  padding: '20px 24px',
                  borderRadius: '16px',
```
with:
```tsx
                  padding: 'var(--space-md) var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
```

Replace line 139:
```tsx
                <p className="text-white/70 leading-relaxed" style={{ fontSize: '15px' }}>
```
with:
```tsx
                <p className="text-white/70 leading-relaxed" style={{ fontSize: 'var(--text-base)' }}>
```

- [ ] **Step 4: Replace action buttons section padding and fonts**

Replace line 146:
```tsx
            <div style={{ padding: '28px 40px 36px 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
```
with:
```tsx
            <div style={{ padding: 'var(--space-xl) var(--modal-padding-x) var(--modal-padding-y) var(--modal-padding-x)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
```

Replace lines 155-157 (Try Again button):
```tsx
                      padding: '20px 32px',
                      fontSize: '17px',
                      borderRadius: '16px',
```
with:
```tsx
                      padding: 'var(--space-md) var(--space-xl)',
                      fontSize: 'var(--text-lg)',
                      borderRadius: 'var(--radius-lg)',
```

Replace lines 171-173 (Play Anyways button):
```tsx
                        padding: '14px 32px',
                        fontSize: '13px',
                        borderRadius: '16px',
```
with:
```tsx
                        padding: 'var(--space-sm) var(--space-xl)',
                        fontSize: 'var(--text-sm)',
                        borderRadius: 'var(--radius-lg)',
```

Replace lines 191-193 (Got It button):
```tsx
                    padding: '20px 32px',
                    fontSize: '17px',
                    borderRadius: '16px',
```
with:
```tsx
                    padding: 'var(--space-md) var(--space-xl)',
                    fontSize: 'var(--text-lg)',
                    borderRadius: 'var(--radius-lg)',
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 6: Commit**

```bash
git add src/components/feedback/StrategyModal.tsx
git commit -m "feat: make StrategyModal responsive with fluid tokens"
```

---

### Task 11: Make StrategyChartModal.tsx Responsive (Condense + Scroll)

**Files:**
- Modify: `src/components/feedback/StrategyChartModal.tsx`

- [ ] **Step 1: Replace header padding and fonts**

Replace line 150:
```tsx
                padding: '32px 36px 20px 36px',
```
with:
```tsx
                padding: 'var(--space-xl) var(--modal-padding-x) var(--space-md) var(--modal-padding-x)',
```

Replace line 155:
```tsx
                <h2 className="text-white font-black tracking-wide leading-tight" style={{ fontSize: '24px' }}>
```
with:
```tsx
                <h2 className="text-white font-black tracking-wide leading-tight" style={{ fontSize: 'var(--modal-title-font)' }}>
```

Replace line 158:
```tsx
                <p className="text-white/40 mt-2 font-medium tracking-wide" style={{ fontSize: '14px' }}>{rulesDesc}</p>
```
with:
```tsx
                <p className="text-white/40 mt-2 font-medium tracking-wide" style={{ fontSize: 'var(--text-sm)' }}>{rulesDesc}</p>
```

Replace line 163:
```tsx
                style={{ fontSize: '22px' }}
```
with:
```tsx
                style={{ fontSize: 'var(--text-xl)' }}
```

- [ ] **Step 2: Replace tabs padding and font**

Replace line 173:
```tsx
                padding: '16px 36px',
```
with:
```tsx
                padding: 'var(--space-md) var(--modal-padding-x)',
```

Replace lines 185-186:
```tsx
                    padding: '10px 24px',
                    fontSize: '15px',
```
with:
```tsx
                    padding: 'var(--space-sm) var(--space-lg)',
                    fontSize: 'var(--text-base)',
```

- [ ] **Step 3: Replace table container — add horizontal scroll, fluid height**

Replace line 207:
```tsx
            <div className="overflow-auto" style={{ padding: '20px 28px 16px 28px', height: '520px' }}>
```
with:
```tsx
            <div className="overflow-auto" style={{ padding: 'var(--space-md) var(--space-xl) var(--space-md) var(--space-xl)', height: 'var(--chart-table-h)' }}>
```

- [ ] **Step 4: Replace row header width and cell dimensions**

Replace line 223:
```tsx
                      <col style={{ width: '72px' }} />
```
with:
```tsx
                      <col style={{ width: 'var(--chart-row-header-w)' }} />
```

Replace lines 244-245 (row label cell):
```tsx
                              fontSize: '13px',
                              padding: '3px 6px',
```
with:
```tsx
                              fontSize: 'var(--chart-cell-font)',
                              padding: '3px 6px',
```

Replace lines 264-268 (strategy cell):
```tsx
                                    style={{
                                      height: 42,
                                      background: cfg.bg,
                                      fontSize: '14px',
                                      letterSpacing: '0.04em',
                                    }}
```
with:
```tsx
                                    style={{
                                      height: 'var(--chart-cell-h)',
                                      background: cfg.bg,
                                      fontSize: 'var(--chart-cell-font)',
                                      letterSpacing: '0.04em',
                                    }}
```

- [ ] **Step 5: Replace legend dimensions**

Replace line 289:
```tsx
                padding: '20px 36px',
```
with:
```tsx
                padding: 'var(--space-md) var(--modal-padding-x)',
```

Replace lines 298-300:
```tsx
                    style={{
                      width: 34, height: 34,
                      background: ACTION_CONFIG[key].bg,
                      fontSize: '14px',
                    }}
```
with:
```tsx
                    style={{
                      width: 'var(--chart-legend-size)', height: 'var(--chart-legend-size)',
                      background: ACTION_CONFIG[key].bg,
                      fontSize: 'var(--chart-cell-font)',
                    }}
```

- [ ] **Step 6: Replace modal margin**

Replace line 138:
```tsx
              margin: '24px',
```
with:
```tsx
              margin: 'var(--space-lg)',
```

- [ ] **Step 7: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 8: Commit**

```bash
git add src/components/feedback/StrategyChartModal.tsx
git commit -m "feat: make StrategyChartModal responsive with condensed cells and scroll fallback"
```

---

### Task 12: Make SettingsModal.tsx Responsive

**Files:**
- Modify: `src/components/game/SettingsModal.tsx`

- [ ] **Step 1: Replace header padding and font**

Replace line 59:
```tsx
                padding: '32px 36px 24px 36px',
```
with:
```tsx
                padding: 'var(--space-xl) var(--modal-padding-x) var(--space-lg) var(--modal-padding-x)',
```

Replace line 63:
```tsx
              <h2 className="text-white font-black tracking-wide" style={{ fontSize: '28px' }}>Settings</h2>
```
with:
```tsx
              <h2 className="text-white font-black tracking-wide" style={{ fontSize: 'var(--modal-title-font)' }}>Settings</h2>
```

Replace line 67:
```tsx
                style={{ fontSize: '22px' }}
```
with:
```tsx
                style={{ fontSize: 'var(--text-xl)' }}
```

- [ ] **Step 2: Replace content padding**

Replace line 76:
```tsx
              style={{ padding: '28px 36px 28px 36px' }}
```
with:
```tsx
              style={{ padding: 'var(--space-xl) var(--modal-padding-x)' }}
```

- [ ] **Step 3: Replace footer padding**

Replace line 239:
```tsx
                padding: '20px 36px 24px 36px',
```
with:
```tsx
                padding: 'var(--space-md) var(--modal-padding-x) var(--space-lg) var(--modal-padding-x)',
```

- [ ] **Step 4: Replace Section label font**

Replace line 265:
```tsx
        style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}
```
with:
```tsx
        style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 'var(--space-sm)' }}
```

- [ ] **Step 5: Replace row component fonts**

Replace line 299 (SelectRow label):
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', fontWeight: 500 }}>{label}</span>
```
with:
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
```

Replace line 320 (ToggleRow label):
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', fontWeight: 500 }}>{label}</span>
```
with:
```tsx
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
```

- [ ] **Step 6: Replace toggle switch dimensions**

Replace lines 324-325:
```tsx
          width: 58, height: 34,
          marginLeft: '16px',
```
with:
```tsx
          width: 'var(--toggle-w)', height: 'var(--toggle-h)',
          marginLeft: 'var(--space-md)',
```

Replace lines 335-336:
```tsx
            top: 3, left: 3,
            width: 26, height: 26,
```
with:
```tsx
            top: 'var(--toggle-inset)', left: 'var(--toggle-inset)',
            width: 'var(--toggle-knob)', height: 'var(--toggle-knob)',
```

Replace line 339:
```tsx
            transform: checked ? 'translateX(26px)' : 'translateX(0)',
```
with:
```tsx
            transform: checked ? 'translateX(calc(var(--toggle-w) - var(--toggle-knob) - var(--toggle-inset) * 2))' : 'translateX(0)',
```

- [ ] **Step 7: Replace SliderRow font and minWidth**

Replace line 363:
```tsx
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', fontWeight: 500 }}>{label}</span>
```
with:
```tsx
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
```

Replace line 364:
```tsx
      <div className="flex items-center gap-4" style={{ minWidth: '220px' }}>
```
with:
```tsx
      <div className="flex items-center gap-4" style={{ minWidth: 'clamp(160px, 20vw, 220px)' }}>
```

- [ ] **Step 8: Replace Data section font sizes**

Replace line 165:
```tsx
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', fontWeight: 500 }}>Reset All Stats</span>
```
with:
```tsx
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>Reset All Stats</span>
```

- [ ] **Step 9: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 10: Commit**

```bash
git add src/components/game/SettingsModal.tsx
git commit -m "feat: make SettingsModal responsive with fluid tokens"
```

---

### Task 13: Make StatsPanel.tsx, HandTotal.tsx, and CustomSelect.tsx Responsive

**Files:**
- Modify: `src/components/feedback/StatsPanel.tsx`
- Modify: `src/components/game/HandTotal.tsx`
- Modify: `src/components/shared/CustomSelect.tsx`

- [ ] **Step 1: Replace StatsPanel padding and gap**

Replace lines 42-43:
```tsx
        padding: '18px 40px',
        gap: '36px',
```
with:
```tsx
        padding: 'var(--stats-padding)',
        gap: 'var(--stats-gap)',
```

- [ ] **Step 2: Replace HandTotal padding and font**

Replace lines 41-43:
```tsx
      className={`inline-block text-xl font-black rounded-full tracking-wide whitespace-nowrap ${colorClasses}`}
      style={{
        padding: '12px 32px',
```
with:
```tsx
      className={`inline-block font-black rounded-full tracking-wide whitespace-nowrap ${colorClasses}`}
      style={{
        padding: 'var(--badge-padding)',
        fontSize: 'var(--badge-font)',
```

- [ ] **Step 3: Replace CustomSelect minWidth default**

Replace line 12:
```tsx
export default function CustomSelect({ value, options, onChange, minWidth = '220px' }: CustomSelectProps) {
```
with:
```tsx
export default function CustomSelect({ value, options, onChange, minWidth = 'clamp(160px, 20vw, 220px)' }: CustomSelectProps) {
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 5: Commit**

```bash
git add src/components/feedback/StatsPanel.tsx src/components/game/HandTotal.tsx src/components/shared/CustomSelect.tsx
git commit -m "feat: make StatsPanel, HandTotal, and CustomSelect responsive"
```

---

### Task 14: Final Build Verification and Visual Testing

**Files:**
- No file changes — testing only

- [ ] **Step 1: Full build verification**

Run: `npm run build`
Expected: Build completes successfully with no new errors.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: Only the 3 pre-existing lint errors (2 access-before-declare, 1 constant-condition). No new errors.

- [ ] **Step 3: Visual smoke test at desktop**

Run: `npm run dev`
Open http://localhost:5173 in a browser at full desktop width. Verify:
- Setup page renders correctly
- Game table plays a hand without visual issues
- Settings, Charts, and Strategy modals open and look correct

- [ ] **Step 4: Visual smoke test at mobile (390px)**

Open browser DevTools, set viewport to 390px width (iPhone 14 portrait). Verify:
- Setup page: title readable, buttons fit, no horizontal overflow
- Game table: cards visible, action buttons fit side-by-side, bet chips fit
- Modals: Strategy chart scrolls horizontally if needed, settings fit
- Running count: fits in top-left without overlapping cards

- [ ] **Step 5: Final commit if any tuning was needed**

If any clamp values needed adjustment during visual testing:
```bash
git add -A
git commit -m "fix: tune responsive clamp values after visual testing"
```

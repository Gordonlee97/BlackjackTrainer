# Juice & Snappiness Design Spec

**Goal:** Make the blackjack trainer feel responsive, satisfying, and emotionally engaging through tighter animation physics, a tension arc around the stand → reveal → result sequence, richer sound design, and smooth transitions between hands.

**Scope:** Five focused areas — card dealing physics, lock-in moment, dealer suspense, result payoff, next hand transition. No changes to betting UI, settings, or strategy modals.

**Tech:** Framer Motion (existing), Web Audio API via `sounds.ts` (existing), CSS custom properties (existing). No new dependencies.

---

## 1. Card Dealing Physics

### Current Behavior
Cards animate in from `x: +300, y: 0` with spring stiffness 280, damping 26. Cards feel like they materialize from the right rather than being physically dealt.

### New Behavior
Cards originate from the **top-right corner** (the dealer's off-screen position), simulating a real dealer sitting across from the player.

**Initial state:** `x: +350, y: -300, rotate: 18deg (±5deg random), scale: 0.85, opacity: 0.7`

**Animation curve — magnetic snap:**
- The card travels through the air with moderate speed
- As it approaches its target position, it **accelerates** — as if magnetically drawn to its landing spot
- On arrival: a **decisive bounce** (not micro — visible snap into place)
- Spring params: high stiffness (~350-400), moderate damping (~18-22), mass ~0.7
- The bounce should overshoot slightly and snap back — the card lands with authority

**Per-card variation:**
- Start rotation varies ±5deg per card (not identical arcs)
- Stagger timing stays at ~150ms between cards

**Shadow:**
- Shadow grows as card approaches (starts small/faint, full shadow on landing)
- Reinforces the feeling of the card arriving onto the table surface

**Sound:** `playCardSlide()` fires on landing (when card reaches final position), not on launch.

**Applies to:** Initial deal (4 cards), hits, doubles, dealer draws. All cards come from the same top-right origin.

---

## 2. Lock-In Moment (Stand Action)

### Current Behavior
Clicking Stand immediately begins the dealer turn. No pause, no visual acknowledgment that the player's decision is final.

### New Behavior
When the player clicks Stand, a ~500ms sequence plays before the dealer begins:

**Visual sequence (0–500ms):**
1. **Compress** (0–150ms): Player cards tighten their overlap by ~10-12px (slide closer together)
2. **Press down** (100–250ms): Cards shift down 2-3px and a subtle scale reduction (0.98) — pressed flat onto the table
3. **Shadow intensify** (100–300ms): Drop shadow under player cards deepens — cards have been "set down" with weight
4. **Desaturate** (150–350ms): Cards darken/desaturate slightly (brightness ~0.85, saturation ~0.9 via CSS filter) — they're no longer in play
5. **Pause/breath** (350–500ms): Nothing moves. The table is still. This is the "point of no return" beat.

**Audio:** A single **low thud** sound at ~100ms — short, definitive, low-frequency (~120-180Hz). Not dramatic, just *final*. Like placing cards firmly on felt.

**After the pause:** Dealer turn begins (hole card flip).

**Also triggers on:** Double down (after the third card lands), surrender (before result). Does NOT trigger on bust (player already lost — skip straight to result).

---

## 3. Dealer Suspense

### Current Behavior
Dealer reveals hole card and draws additional cards at fixed 650ms intervals. Mechanical, no tension build.

### New Behavior

**Hole card flip:**
- Current rotateY spring (stiffness 200, damping 28) is fine but needs a **slower start** — add a 200ms delay after the lock-in pause before the flip begins
- During the flip, a subtle **lift shadow** (shadow expands as card "lifts" off table, then settles back)

**Dealer draws — escalating tension:**
- Each subsequent draw has a **longer pause** before it:
  - 1st draw: 700ms
  - 2nd draw: 800ms
  - 3rd draw: 900ms
  - 4th+ draw: 1000ms (cap)
- This creates escalating suspense — "will the dealer bust?"

**Tension audio:**
- When dealer turn begins, a **low sustained tone** fades in (sine wave, ~80-100Hz, very low volume ~0.06-0.08)
- Tone sustains through dealer draws
- Fades out over 300ms when dealer turn ends (before result)
- Optional: slight pitch rise with each draw (adds urgency)

---

## 4. Result Payoff

### Current Behavior
Result badges appear with spring animation. Sound plays (win/lose/blackjack/push). Adequate but doesn't feel like a payoff after the tension built in sections 2-3.

### New Behavior
Result presentation is **scaled to the outcome** and explicitly **releases the tension** built during dealer turn:

**Win:**
- Player cards **brighten back** to full (undo the lock-in desaturation) — they're alive again
- Cards **lift slightly** (y: -4px, scale: 1.02) — victorious rise
- Result badge enters with current spring but slightly more aggressive (stiffness 400)
- Win sound plays as-is

**Blackjack:**
- All of Win, plus:
- Brief **gold edge vignette** on the game area (radial gradient, gold/amber, fades in 150ms, fades out over 400ms)
- Blackjack sound plays as-is (already has a fanfare)

**Lose:**
- Cards stay darkened/desaturated from lock-in (no recovery)
- Cards **settle further down** (y: +2px) — deflated
- Badge enters with **less energy** (lower stiffness ~200, more damping ~30) — subdued entrance
- Lose sound plays as-is
- Quick — don't dwell on losses

**Push:**
- Cards return to normal brightness (neutral)
- Standard badge entrance
- Push sound plays as-is

---

## 5. Next Hand Transition

### Current Behavior
Clicking Next Hand immediately resets to the betting phase. Cards disappear, bet controls appear. No transition.

### New Behavior

**Card sweep-off (0–400ms):**
- All cards on the table **sweep off-screen to the right** with staggered timing
- Each card animates to `x: +500, y: -100, rotate: 12deg, opacity: 0`
- Stagger: 50ms between cards, dealer cards first, then player cards
- Spring: stiff and quick (stiffness 300, damping 20) — dealer clearing the table briskly

**Brief empty table (400–600ms):**
- 200ms of empty felt — palette cleanser between hands

**Bet controls entrance (600ms+):**
- Bet controls animate in from below with the same **magnetic snap** energy as card dealing
- Start at `y: +60, opacity: 0, scale: 0.95`
- Snap into place with authority (same spring profile as card dealing)

**Sound:** A soft **sweep/whoosh** sound for the card clearing (brief filtered noise, higher pitch than card slide). `playNextHand()` sound fires when bet controls land.

---

## Sound Design Summary

New sounds to add to `sounds.ts`:

| Sound | Trigger | Character |
|-------|---------|-----------|
| `playLockIn()` | Stand/Double/Surrender lock-in | Low thud, ~150Hz, 80ms duration, triangle wave |
| `playTensionLoop()` | Dealer turn start → end | Sustained low sine ~90Hz, vol 0.06-0.08, optional pitch rise |
| `stopTensionLoop()` | Dealer turn end | Fade out over 300ms |
| `playSweep()` | Next Hand card clear | Brief high-pass filtered noise whoosh, 120ms |

Existing sounds (`playCardSlide`, `playWin`, `playBlackjack`, `playLose`, `playPush`, `playNextHand`, `playButtonPress`) remain unchanged.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/game/Card.tsx` | New origin point (top-right), magnetic snap spring, rotation variation, shadow growth |
| `src/components/game/GameTable.tsx` | Lock-in sequence orchestration, dealer suspense timing, result payoff animations, next hand sweep transition |
| `src/components/game/PlayerHand.tsx` | Lock-in visual state (compress, darken, press), result-dependent recovery |
| `src/components/game/DealerHand.tsx` | Hole card flip timing adjustment, lift shadow |
| `src/engine/sounds.ts` | New sounds: `playLockIn`, `playTensionLoop`/`stopTensionLoop`, `playSweep` |
| `src/index.css` | Any new keyframes needed (gold vignette, etc.) |

No new files. No new dependencies.

---

## Non-Goals

- Betting phase polish (chip clicks, bet area glow)
- Split hand animation changes
- Strategy modal changes
- Mobile responsiveness
- Accessibility (prefers-reduced-motion)
- Settings or setup page changes

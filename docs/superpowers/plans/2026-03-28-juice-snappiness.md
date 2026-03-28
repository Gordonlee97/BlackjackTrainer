# Juice & Snappiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the blackjack trainer feel responsive and emotionally engaging — magnetic-snap card dealing from top-right, a tension arc around stand → reveal → result, and a sweep transition between hands.

**Architecture:** All changes are in the existing component/sound layer. Card.tsx gets new origin physics, GameTable.tsx orchestrates lock-in/suspense/sweep sequences via state + timeouts, PlayerHand.tsx responds to a new `lockedIn` prop, and sounds.ts gains 4 new procedural sounds. No store changes needed — all orchestration happens in GameTable effects.

**Tech Stack:** React 19, TypeScript 5.9, Framer Motion, Web Audio API, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-28-juice-snappiness-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/engine/sounds.ts` | Add `playLockIn`, `playTensionStart`/`playTensionStop`, `playSweep` |
| Modify | `src/components/game/Card.tsx` | Top-right origin, magnetic snap spring, rotation variation, shadow growth |
| Modify | `src/components/game/PlayerHand.tsx` | Accept `lockedIn` prop, compress/darken/settle cards, brighten on win |
| Modify | `src/components/game/DealerHand.tsx` | Accept `suspense` prop for lift-shadow on hole card flip |
| Modify | `src/components/game/GameTable.tsx` | Lock-in sequence, dealer suspense timing, result payoff, next hand sweep |
| Modify | `src/index.css` | Gold vignette keyframe for blackjack |

---

### Task 1: New Sounds

**Files:**
- Modify: `src/engine/sounds.ts:139` (append after `playChip`)

- [ ] **Step 1: Add `playLockIn` — low thud sound**

Append to `src/engine/sounds.ts` after the `playChip` function:

```typescript
/** Lock-in thud — short low-frequency impact, cards pressed onto felt */
export function playLockIn() {
  tone(150, 0.08, 0, 'triangle', 0.18);
  tone(120, 0.12, 0.02, 'sine', 0.14);
}
```

- [ ] **Step 2: Add `playTensionStart` / `playTensionStop` — sustained low drone**

Append to `src/engine/sounds.ts`:

```typescript
/** Tension drone — low sustained tone during dealer turn */
let _tensionOsc: OscillatorNode | null = null;
let _tensionGain: GainNode | null = null;

export function playTensionStart() {
  try {
    const ctx = ac();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 90;
    const scaled = 0.07 * _masterVolume;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(scaled, ctx.currentTime + 0.3);
    osc.start();
    _tensionOsc = osc;
    _tensionGain = gain;
  } catch {
    // audio unavailable
  }
}

export function playTensionStop() {
  try {
    if (_tensionGain && _tensionOsc) {
      const ctx = ac();
      _tensionGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      const osc = _tensionOsc;
      setTimeout(() => { try { osc.stop(); } catch { /* already stopped */ } }, 400);
      _tensionOsc = null;
      _tensionGain = null;
    }
  } catch {
    // ignore
  }
}
```

- [ ] **Step 3: Add `playSweep` — whoosh for card clearing**

Append to `src/engine/sounds.ts`:

```typescript
/** Sweep whoosh — cards being cleared off the table */
export function playSweep() {
  try {
    const ctx = ac();
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      d[i] = (Math.random() * 2 - 1) * env * 0.12 * _masterVolume;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    src.connect(hp);
    hp.connect(ctx.destination);
    src.start();
  } catch {
    // ignore
  }
}
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/engine/sounds.ts
git commit -m "feat: add lock-in, tension, and sweep sounds"
```

---

### Task 2: Card Dealing Physics — Magnetic Snap from Top-Right

**Files:**
- Modify: `src/components/game/Card.tsx:4-10,19-37`

- [ ] **Step 1: Add `cardIndex` prop for per-card rotation variation**

Replace the `CardProps` interface and component signature in `src/components/game/Card.tsx`:

```typescript
interface CardProps {
  card: CardType;
  index?: number;
  delay?: number;
  smoothLayout?: boolean;
  settled?: boolean;
  /** Unique index across all cards on table, used for rotation variation */
  dealId?: number;
}

export default function Card({ card, index = 0, delay = 0, smoothLayout = false, settled = false, dealId = 0 }: CardProps) {
```

- [ ] **Step 2: Replace the animation initial/animate/transition with magnetic snap from top-right**

Replace the `<motion.div` block (lines 23-37 of Card.tsx) with:

```typescript
    <motion.div
      layout={smoothLayout}
      className="relative shrink-0"
      style={{ marginLeft: index > 0 ? '-48px' : '0', zIndex: index }}
      initial={{
        x: 350,
        y: -300,
        rotate: 18 + ((dealId % 5) - 2) * 2.5,
        scale: 0.85,
        opacity: 0.7,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
      animate={{
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
        rotateY: card.faceUp ? 0 : 180,
        boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
      }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 20,
        mass: 0.7,
        delay,
        rotateY: { type: 'spring', stiffness: 200, damping: 28, delay },
        layout: { type: 'spring', stiffness: 200, damping: 28 },
        opacity: { duration: 0.15, delay },
      }}
    >
```

This creates the magnetic snap: high stiffness (380) with moderate damping (20) causes the card to accelerate into position and overshoot slightly before snapping back. The `dealId` varies the start rotation ±5deg so cards don't feel robotic.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/Card.tsx
git commit -m "feat: magnetic snap card dealing from top-right origin"
```

---

### Task 3: Lock-In Visual State on PlayerHand

**Files:**
- Modify: `src/components/game/PlayerHand.tsx:6-13,23-62`

- [ ] **Step 1: Add `lockedIn` and `resultPayoff` props**

Update the `PlayerHandProps` interface in `src/components/game/PlayerHand.tsx`:

```typescript
interface PlayerHandProps {
  hand: HandState;
  isActive: boolean;
  handIndex: number;
  totalHands: number;
  showHandTotals: boolean;
  settleBounce?: boolean;
  /** Cards are locked in (stand/double/surrender) — compress and darken */
  lockedIn?: boolean;
  /** Result payoff state: 'win' brightens cards, 'lose' keeps dark, null = normal */
  resultPayoff?: 'win' | 'blackjack' | 'lose' | 'push' | null;
}
```

- [ ] **Step 2: Add lock-in and result-payoff animation to the card container**

Replace the `<LayoutGroup>` block (lines 46-63) in `PlayerHand.tsx` with:

```typescript
      <LayoutGroup>
        <motion.div
          className="flex items-center justify-center"
          animate={
            settleBounce
              ? { y: [0, -3, 0], scale: [1, 1.008, 1] }
              : lockedIn && !resultPayoff
                ? { y: 2, scale: 0.98 }
                : resultPayoff === 'win' || resultPayoff === 'blackjack'
                  ? { y: -4, scale: 1.02 }
                  : resultPayoff === 'lose'
                    ? { y: 2, scale: 0.98 }
                    : {}
          }
          transition={
            settleBounce
              ? { duration: 0.15, ease: 'easeOut' }
              : { type: 'spring', stiffness: 300, damping: 22 }
          }
          style={{
            filter:
              lockedIn && resultPayoff !== 'win' && resultPayoff !== 'blackjack' && resultPayoff !== 'push'
                ? 'brightness(0.85) saturate(0.9)'
                : 'brightness(1) saturate(1)',
            transition: 'filter 0.25s ease',
            gap: lockedIn ? '-58px' : undefined,
          }}
        >
          {hand.cards.map((card, i) => (
            <Card
              key={`player-${handIndex}-${i}`}
              card={card}
              index={i}
              delay={i < 2 ? i * 0.2 : 0}
              smoothLayout
              settled={isSettled}
              dealId={handIndex * 10 + i}
            />
          ))}
        </motion.div>
      </LayoutGroup>
```

Note: The `gap: '-58px'` when `lockedIn` compresses the card overlap (tighter than the default `-48px` margin-left), and the CSS `filter` handles the darkening/brightening transitions.

- [ ] **Step 3: Update the component signature to accept new props**

Update the function signature:

```typescript
export default function PlayerHand({ hand, isActive, handIndex, totalHands, showHandTotals, settleBounce, lockedIn, resultPayoff }: PlayerHandProps) {
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds (GameTable doesn't pass the new props yet, they default to undefined/falsy).

- [ ] **Step 5: Commit**

```bash
git add src/components/game/PlayerHand.tsx
git commit -m "feat: add lock-in and result payoff visual states to PlayerHand"
```

---

### Task 4: Dealer Suspense — Hole Card Lift Shadow

**Files:**
- Modify: `src/components/game/DealerHand.tsx:6-11,13-43`

- [ ] **Step 1: Add `suspense` prop to DealerHand**

Update `DealerHandProps` and the component signature:

```typescript
interface DealerHandProps {
  hand: HandState;
  holeCardRevealed: boolean;
  showHandTotals: boolean;
  settleBounce?: boolean;
  /** Dealer turn is active — adds dramatic shadow to card area */
  suspense?: boolean;
}

export default function DealerHand({ hand, holeCardRevealed, showHandTotals, settleBounce, suspense }: DealerHandProps) {
```

- [ ] **Step 2: Add suspense shadow animation to the card container**

Replace the `<motion.div>` card container (lines 24-39) with:

```typescript
        <motion.div
          className="flex items-center justify-center"
          animate={
            settleBounce
              ? { y: [0, -3, 0], scale: [1, 1.008, 1] }
              : suspense
                ? { y: -2 }
                : {}
          }
          transition={
            settleBounce
              ? { duration: 0.15, ease: 'easeOut' }
              : { type: 'spring', stiffness: 200, damping: 25 }
          }
          style={{
            filter: suspense ? 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' : 'none',
            transition: 'filter 0.4s ease',
          }}
        >
          {hand.cards.map((card, i) => (
            <Card
              key={`dealer-${i}`}
              card={holeCardRevealed ? { ...card, faceUp: true } : card}
              index={i}
              delay={i < 2 ? i * 0.2 : 0}
              smoothLayout
              settled={isSettled}
              dealId={100 + i}
            />
          ))}
        </motion.div>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/DealerHand.tsx
git commit -m "feat: add suspense shadow to DealerHand during dealer turn"
```

---

### Task 5: Gold Vignette Keyframe for Blackjack

**Files:**
- Modify: `src/index.css:181` (append after `.result-shimmer`)

- [ ] **Step 1: Add gold-vignette keyframe and class**

Append to the end of `src/index.css`:

```css

/* ── Gold vignette flash — blackjack celebration ── */
@keyframes gold-vignette {
  0%   { opacity: 0; }
  25%  { opacity: 1; }
  100% { opacity: 0; }
}

.gold-vignette {
  animation: gold-vignette 0.55s ease-out forwards;
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add gold vignette keyframe for blackjack celebration"
```

---

### Task 6: GameTable Orchestration — Lock-In, Suspense, Payoff, Sweep

This is the largest task — it wires everything together in GameTable.tsx.

**Files:**
- Modify: `src/components/game/GameTable.tsx`

- [ ] **Step 1: Update imports to include new sounds**

Replace line 14 of `GameTable.tsx`:

```typescript
import { playWin, playBlackjack, playLose, playPush, playCardSlide, playButtonPress, playNextHand, playLockIn, playTensionStart, playTensionStop, playSweep, setMasterVolume } from '../../engine/sounds';
```

- [ ] **Step 2: Add new state variables for lock-in, suspense, payoff, and sweep**

After the existing state declarations (after line 61 `const animatedBalance = ...`), add:

```typescript
  // Juice states
  const [lockedIn, setLockedIn] = useState(false);
  const [dealerSuspense, setDealerSuspense] = useState(false);
  const [resultPayoff, setResultPayoff] = useState<'win' | 'blackjack' | 'lose' | 'push' | null>(null);
  const [sweepingCards, setSweepingCards] = useState(false);
  const [goldVignette, setGoldVignette] = useState(false);
```

- [ ] **Step 3: Add lock-in effect — triggers on dealer_turn phase**

The lock-in happens when transitioning to dealer_turn. Add this new effect after the `settleBounce` effect (after line 165):

```typescript
  // Lock-in effect — when player turn ends and dealer begins
  useEffect(() => {
    if (game.phase === 'dealer_turn') {
      setLockedIn(true);
      playLockIn();
    } else if (game.phase === 'betting') {
      setLockedIn(false);
      setResultPayoff(null);
      setDealerSuspense(false);
      setGoldVignette(false);
    }
  }, [game.phase]);
```

- [ ] **Step 4: Modify the dealer play effect to add suspense timing**

Replace the existing dealer play `useEffect` (lines 108-137) with:

```typescript
  // Dealer play — with suspense: lock-in pause → reveal → escalating draws → settle
  useEffect(() => {
    if (game.phase === 'dealer_turn') {
      const steps = playDealerSteps(game);
      const timers: ReturnType<typeof setTimeout>[] = [];

      // Lock-in pause before dealer starts (500ms breath)
      const LOCK_IN_PAUSE = 500;
      // Delay before hole card flip after lock-in
      const REVEAL_DELAY = 200;
      // Base draw interval, escalates per card
      const BASE_DRAW = 700;
      const DRAW_ESCALATION = 100;
      const MAX_DRAW = 1000;
      const SETTLE_DELAY = 450;

      let delay = LOCK_IN_PAUSE + REVEAL_DELAY;

      // Start tension audio after lock-in pause
      timers.push(setTimeout(() => {
        setDealerSuspense(true);
        playTensionStart();
      }, LOCK_IN_PAUSE));

      steps.forEach((step, i) => {
        const isLast = i === steps.length - 1;

        timers.push(setTimeout(() => {
          useGameStore.setState(step.state);
          if (step.countCards.length > 0) {
            useCountStore.getState().updateCount(step.countCards);
          }
          if (!isLast) playCardSlide();

          // Stop tension and resolve on final step
          if (isLast) {
            playTensionStop();
            setDealerSuspense(false);
          }
        }, delay));

        if (!isLast) {
          if (i === 0) {
            delay += BASE_DRAW;
          } else if (i === steps.length - 2) {
            delay += SETTLE_DELAY;
          } else {
            const drawTime = Math.min(BASE_DRAW + i * DRAW_ESCALATION, MAX_DRAW);
            delay += drawTime;
          }
        }
      });

      return () => {
        timers.forEach(clearTimeout);
        playTensionStop();
      };
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 5: Add result payoff effect**

Add a new effect after the stats/sound on complete effect. Replace the existing complete effect (lines 140-146) with:

```typescript
  // Stats + sound + result payoff on complete
  useEffect(() => {
    if (game.phase === 'complete') {
      stats.recordHandPlayed();
      const results = game.playerHands.map(h => h.result);
      const hasBlackjack = results.includes('blackjack');
      const hasWin = results.includes('win');
      const hasLose = results.includes('lose') && !hasWin && !hasBlackjack;

      // Determine payoff state
      if (hasBlackjack) {
        setResultPayoff('blackjack');
        setGoldVignette(true);
        setTimeout(() => setGoldVignette(false), 600);
      } else if (hasWin) {
        setResultPayoff('win');
      } else if (hasLose) {
        setResultPayoff('lose');
      } else {
        setResultPayoff('push');
      }

      const t = setTimeout(() => pickResultSound(game.playerHands)(), 100);
      return () => clearTimeout(t);
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 6: Add next-hand sweep transition**

Replace the `newHand` call in the Next Hand button's `onClick` (line 528). First, find the Next Hand button and change its onClick:

Replace:
```typescript
                  onClick={() => { playNextHand(); game.newHand(); }}
```

With:
```typescript
                  onClick={() => {
                    playSweep();
                    setSweepingCards(true);
                    setTimeout(() => {
                      game.newHand();
                      setSweepingCards(false);
                      playNextHand();
                    }, 500);
                  }}
```

- [ ] **Step 7: Pass new props to PlayerHand**

Update the `PlayerHand` usage in the JSX (around line 425-435). Replace:

```typescript
              <PlayerHand
                key={i}
                hand={hand}
                isActive={i === game.activeHandIndex && game.phase === 'player_turn'}
                handIndex={i}
                totalHands={game.playerHands.length}
                showHandTotals={rules.showHandTotals}
                settleBounce={settleBounce}
              />
```

With:

```typescript
              <PlayerHand
                key={i}
                hand={hand}
                isActive={i === game.activeHandIndex && game.phase === 'player_turn'}
                handIndex={i}
                totalHands={game.playerHands.length}
                showHandTotals={rules.showHandTotals}
                settleBounce={settleBounce}
                lockedIn={lockedIn}
                resultPayoff={resultPayoff}
              />
```

- [ ] **Step 8: Pass suspense prop to DealerHand**

Update the `DealerHand` usage in the JSX (around line 371-377). Replace:

```typescript
        <DealerHand
          hand={game.dealerHand}
          holeCardRevealed={game.dealerHoleCardRevealed}
          showHandTotals={rules.showHandTotals}
          settleBounce={settleBounce}
        />
```

With:

```typescript
        <DealerHand
          hand={game.dealerHand}
          holeCardRevealed={game.dealerHoleCardRevealed}
          showHandTotals={rules.showHandTotals}
          settleBounce={settleBounce}
          suspense={dealerSuspense}
        />
```

- [ ] **Step 9: Add sweep animation to card areas**

Wrap the dealer and player card areas with sweep animation. Update the dealer zone (around line 365):

Replace:
```typescript
      <div className="flex-[4] flex flex-col items-center justify-center min-h-0 relative">
```

With:
```typescript
      <motion.div
        className="flex-[4] flex flex-col items-center justify-center min-h-0 relative"
        animate={sweepingCards ? { x: 600, opacity: 0, rotate: 8 } : { x: 0, opacity: 1, rotate: 0 }}
        transition={sweepingCards ? { duration: 0.35, ease: 'easeIn' } : { duration: 0.01 }}
      >
```

And its closing `</div>` to `</motion.div>`.

Similarly, update the player card container (around line 423):

Replace:
```typescript
        <div className="flex-1 flex items-center justify-center min-h-0" style={{ paddingBottom: '12px' }}>
```

With:
```typescript
        <motion.div
          className="flex-1 flex items-center justify-center min-h-0"
          style={{ paddingBottom: '12px' }}
          animate={sweepingCards ? { x: 600, opacity: 0, rotate: 8 } : { x: 0, opacity: 1, rotate: 0 }}
          transition={sweepingCards ? { duration: 0.35, ease: 'easeIn', delay: 0.05 } : { duration: 0.01 }}
        >
```

And its closing `</div>` to `</motion.div>`.

- [ ] **Step 10: Add gold vignette overlay**

Add the gold vignette overlay inside the main container, just before the closing `</div>` of the root element (before line 576):

```typescript
      {/* ══ GOLD VIGNETTE — blackjack celebration flash ══ */}
      {goldVignette && (
        <div
          className="fixed inset-0 pointer-events-none gold-vignette"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(250,204,21,0.15) 100%)',
            zIndex: 100,
          }}
        />
      )}
```

- [ ] **Step 11: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 12: Commit**

```bash
git add src/components/game/GameTable.tsx
git commit -m "feat: orchestrate lock-in, dealer suspense, result payoff, and sweep transition"
```

---

### Task 7: Verify and Fix — Full Integration Check

**Files:**
- All modified files

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: Only 3 pre-existing errors (no new ones).

- [ ] **Step 3: Test the full flow manually**

Open `npm run dev` and test:
1. Place a bet and click Deal — cards should fly in from top-right with magnetic snap and decisive bounce
2. Click Stand — player cards should compress, darken, thud sound, 500ms pause, then dealer reveals
3. Watch dealer draw — pauses should escalate (700ms → 800ms → 900ms), tension drone audible
4. Result appears — win: cards brighten and lift; lose: cards stay dark; blackjack: gold vignette flash
5. Click Next Hand — cards sweep off to the right, pause, then bet controls rise in

- [ ] **Step 4: Fix any issues found during testing**

Address any timing, visual, or sound issues discovered.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: polish juice and snappiness integration"
```

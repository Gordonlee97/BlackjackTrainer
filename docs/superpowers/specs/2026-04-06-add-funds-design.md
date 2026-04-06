# Add Funds / Rebuy Feature

## Summary

Allow players to add funds to their balance without restarting the game. Two entry points: an auto-prompt when broke, and a persistent rebuy button during betting.

## Behavior

### Auto-Prompt Modal

When the betting phase starts and the player's balance is below the minimum bet ($5), display a modal:

- Heading: "You're out of chips!" (or similar)
- Three rebuy buttons: **$500**, **$1,000**, **$2,500**
- Each button adds that amount to the current balance
- "Back to Menu" link at the bottom as an escape hatch
- Stats (hands played, accuracy, streak, best streak) are fully preserved
- Modal dismisses immediately on rebuy, returning to the betting phase

### Rebuy Button in Betting Phase

- A subtle button visible during the betting phase, near the chip/bet controls area
- Clicking it opens a small rebuy picker with the same three amount options ($500 / $1,000 / $2,500)
- Available regardless of current balance (player can top up anytime)
- Should not compete visually with the primary chip buttons — secondary/tertiary styling

## Implementation

### gameStore.ts

- Add `rebuy(amount: number)` action that adds the given amount to `balance`
- No stats reset, no side effects — just `balance += amount`

### RebuyModal Component

- New component at `src/components/game/RebuyModal.tsx`
- Receives `isOpen`, `onRebuy(amount)`, `onBackToMenu` props
- Uses same modal patterns as SettingsModal (AnimatePresence, backdrop, spring animation)
- Three amount buttons styled as chips or pill buttons
- "Back to Menu" link in footer

### GameTable Integration

- Detect `phase === 'betting' && balance < 5` to auto-show the RebuyModal
- Add rebuy button to the betting phase controls area
- Wire `onRebuy` to call `game.rebuy(amount)` and close modal

### BetControls (optional)

- If the rebuy button fits better inside BetControls, add it there instead of GameTable
- Keep it visually subtle — text link or small outlined button, not a big CTA

import type { Card } from './types';
import { RANK_VALUES } from './types';

/**
 * Hi-Lo card counting value:
 *   2-6  → +1 (low cards)
 *   7-9  →  0 (neutral)
 *   10-A → −1 (high cards)
 */
export function hiLoValue(card: Card): number {
  const v = RANK_VALUES[card.rank];
  if (v >= 2 && v <= 6) return 1;
  if (v >= 7 && v <= 9) return 0;
  return -1; // 10, J, Q, K, A (value 10 or 11)
}

/**
 * True count = running count / decks remaining.
 * Truncated toward zero (BJA convention): positive counts round down,
 * negative counts round up. This keeps the TC conservative relative to
 * the raw division so index plays don't trigger early.
 */
export function computeTrueCount(runningCount: number, shoeSize: number, cardsDealt: number): number {
  const cardsRemaining = shoeSize - cardsDealt;
  if (cardsRemaining <= 0) return 0;
  const decksRemaining = cardsRemaining / 52;
  return Math.trunc(runningCount / decksRemaining);
}

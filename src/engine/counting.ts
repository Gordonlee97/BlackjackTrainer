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

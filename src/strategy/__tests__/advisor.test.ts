import { describe, it, expect } from 'vitest';
import { getCorrectAction } from '../advisor';
import { DEFAULT_RULES } from '../types';
import type { Card, Rank } from '../../engine/types';

const c = (rank: Rank): Card => ({ suit: 'hearts', rank, faceUp: true });
const rules = { ...DEFAULT_RULES, dealerHitsSoft17: false, surrenderAllowed: false };

// args: player cards, dealer upcard, canDouble, canSplit
function advise(cards: Rank[], up: Rank, canDouble: boolean, canSplit: boolean) {
  return getCorrectAction(cards.map(c), c(up), rules, canDouble, canSplit, false);
}

describe('advisor — pairs that cannot be split', () => {
  it('stands on 9,9 vs 6 when splitting is unavailable (hard 18)', () => {
    expect(advise(['9', '9'], '6', true, false).correctAction).toBe('STAND');
  });

  it('stands on 8,8 vs 6 when splitting is unavailable (hard 16)', () => {
    expect(advise(['8', '8'], '6', true, false).correctAction).toBe('STAND');
  });

  it('stands on 7,7 vs 4 when splitting is unavailable (hard 14)', () => {
    expect(advise(['7', '7'], '4', true, false).correctAction).toBe('STAND');
  });

  it('hits A,A vs 5 when splitting is unavailable (soft 12)', () => {
    expect(advise(['A', 'A'], '5', true, false).correctAction).toBe('HIT');
  });

  it('still splits 9,9 vs 6 when splitting is available', () => {
    expect(advise(['9', '9'], '6', true, true).correctAction).toBe('SPLIT');
  });

  it('still doubles 5,5 vs 6 (never split 5s)', () => {
    expect(advise(['5', '5'], '6', true, true).correctAction).toBe('DOUBLE');
  });
});

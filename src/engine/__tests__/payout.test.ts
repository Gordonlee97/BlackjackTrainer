import { describe, it, expect } from 'vitest';
import { handStake, calculatePayout } from '../payout';
import type { HandState } from '../types';

function hand(overrides: Partial<HandState>): HandState {
  return { cards: [], bet: 25, isDoubled: false, isSplit: false, isComplete: true, ...overrides };
}

describe('handStake', () => {
  it('is the bet for a normal hand', () => {
    expect(handStake(hand({}))).toBe(25);
  });

  it('is twice the bet after a double', () => {
    expect(handStake(hand({ isDoubled: true }))).toBe(50);
  });

  it('matches what a doubled loss pays out', () => {
    const h = hand({ isDoubled: true, result: 'lose' });
    expect(calculatePayout(h)).toBe(-handStake(h));
  });
});

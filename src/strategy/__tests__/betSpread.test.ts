import { describe, it, expect } from 'vitest';
import { recommendUnits, evaluateBet } from '../betSpread';

describe('recommendUnits (Hi-Lo 1-8 spread)', () => {
  it('returns 1u at or below TC +1', () => {
    expect(recommendUnits(-5)).toEqual({ min: 1, max: 1 });
    expect(recommendUnits(0)).toEqual({ min: 1, max: 1 });
    expect(recommendUnits(1)).toEqual({ min: 1, max: 1 });
  });
  it('returns 2u at TC +2', () => {
    expect(recommendUnits(2)).toEqual({ min: 1, max: 2 });
  });
  it('returns 2-4u at TC +3', () => {
    expect(recommendUnits(3)).toEqual({ min: 2, max: 4 });
  });
  it('returns 4-6u at TC +4', () => {
    expect(recommendUnits(4)).toEqual({ min: 4, max: 6 });
  });
  it('returns 6-8u at TC +5 and above', () => {
    expect(recommendUnits(5)).toEqual({ min: 6, max: 8 });
    expect(recommendUnits(10)).toEqual({ min: 6, max: 8 });
  });
});

describe('evaluateBet', () => {
  it('returns "ok" when bet is within recommended range', () => {
    expect(evaluateBet(75, 25, 3).verdict).toBe('ok');
  });
  it('returns "low" when under-bet for count', () => {
    expect(evaluateBet(25, 25, 4).verdict).toBe('low');
  });
  it('returns "high" when over-bet for count', () => {
    expect(evaluateBet(125, 25, 0).verdict).toBe('high');
  });
  it('reports unit counts in result', () => {
    const r = evaluateBet(75, 25, 3);
    expect(r.actualUnits).toBe(3);
    expect(r.recommended).toEqual({ min: 2, max: 4 });
  });
});

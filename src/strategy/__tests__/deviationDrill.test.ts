import { describe, it, expect } from 'vitest';
import { pickDeviation } from '../deviationDrill';
import { H17_DEVIATIONS, S17_DEVIATIONS } from '../deviations';
import type { RuleSet } from '../types';
import { DEFAULT_RULES } from '../types';

const h17Rules = (overrides: Partial<RuleSet> = {}): RuleSet => ({
  ...DEFAULT_RULES,
  numDecks: 6,
  dealerHitsSoft17: true,
  surrenderAllowed: true,
  useDeviations: true,
  ...overrides,
});

describe('pickDeviation', () => {
  it('returns a deviation from the H17 list for H17 rules', () => {
    const d = pickDeviation(h17Rules());
    expect(H17_DEVIATIONS).toContain(d);
  });

  it('returns a deviation from the S17 list for S17 rules', () => {
    const d = pickDeviation(h17Rules({ dealerHitsSoft17: false }));
    expect(S17_DEVIATIONS).toContain(d);
  });

  it('never returns surrender-action deviations when surrender disabled', () => {
    const surrenderActions = new Set(['Rh', 'Rs', 'Rp']);
    const rules = h17Rules({ surrenderAllowed: false });
    for (let i = 0; i < 500; i++) {
      const d = pickDeviation(rules);
      expect(surrenderActions.has(d.action)).toBe(false);
    }
  });

  it('excludes onlyIfNoSurrender entries when surrender enabled', () => {
    const rules = h17Rules({ surrenderAllowed: true });
    for (let i = 0; i < 500; i++) {
      const d = pickDeviation(rules);
      expect(d.onlyIfNoSurrender).not.toBe(true);
    }
  });

  it('allows onlyIfNoSurrender entries when surrender disabled', () => {
    const rules = h17Rules({ surrenderAllowed: false });
    let foundOnlyIfNoSurrender = false;
    for (let i = 0; i < 500; i++) {
      const d = pickDeviation(rules);
      if (d.onlyIfNoSurrender) { foundOnlyIfNoSurrender = true; break; }
    }
    expect(foundOnlyIfNoSurrender).toBe(true);
  });

  it('covers every applicable deviation across 2000 draws (uniformity)', () => {
    const rules = h17Rules({ surrenderAllowed: true });
    const seen = new Set<number>();
    const applicable = H17_DEVIATIONS.filter(d => {
      if (d.onlyIfNoSurrender) return false;
      return true;
    });
    for (let i = 0; i < 2000; i++) {
      const d = pickDeviation(rules);
      seen.add(applicable.indexOf(d));
    }
    expect(seen.size).toBe(applicable.length);
  });
});

import { generateTargetCount } from '../deviationDrill';

describe('generateTargetCount', () => {
  it('produces TC that satisfies a gte threshold (TC-based)', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'hard' && d.playerTotal === 10 && d.dealerUp === 10)!;
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      const tc = Math.trunc(r.targetRC / r.targetDecksRem);
      expect(tc).toBeGreaterThanOrEqual(dev.threshold);
    }
  });

  it('produces TC that satisfies an lte threshold (TC-based)', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'hard' && d.playerTotal === 13 && d.dealerUp === 2)!;
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      const tc = Math.trunc(r.targetRC / r.targetDecksRem);
      expect(tc).toBeLessThanOrEqual(dev.threshold);
    }
  });

  it('produces positive RC for usesRunningCount gte (0+) deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.usesRunningCount && d.direction === 'gte')!;
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      expect(r.targetRC).toBeGreaterThan(0);
    }
  });

  it('produces negative RC for usesRunningCount lte (0-) deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.usesRunningCount && d.direction === 'lte')!;
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      expect(r.targetRC).toBeLessThan(0);
    }
  });

  it('targetDecksRem is in (0, numDecks)', () => {
    const dev = H17_DEVIATIONS[0];
    for (let i = 0; i < 200; i++) {
      const r = generateTargetCount(dev, 6);
      expect(r.targetDecksRem).toBeGreaterThan(0);
      expect(r.targetDecksRem).toBeLessThan(6);
    }
  });
});

import { buildForcedDeal } from '../deviationDrill';
import { handValue, isPair } from '../../engine/hand';

describe('buildForcedDeal', () => {
  it('produces a pair for pair deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'pairs' && d.playerTotal === 10)!;
    for (let i = 0; i < 100; i++) {
      const d = buildForcedDeal(dev);
      expect(isPair([d.player1, d.player2])).toBe(true);
      expect(d.player1.rank === d.player2.rank).toBe(true);
    }
  });

  it('produces a soft hand for soft deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'soft' && d.playerTotal === 19)!;
    for (let i = 0; i < 100; i++) {
      const d = buildForcedDeal(dev);
      const hv = handValue([d.player1, d.player2]);
      expect(hv.isSoft).toBe(true);
      expect(hv.total).toBe(19);
    }
  });

  it('produces a hard hand (no Ace) for hard deviations', () => {
    const dev = H17_DEVIATIONS.find(d => d.handType === 'hard' && d.playerTotal === 16 && d.dealerUp === 10)!;
    for (let i = 0; i < 100; i++) {
      const d = buildForcedDeal(dev);
      expect(d.player1.rank).not.toBe('A');
      expect(d.player2.rank).not.toBe('A');
      const hv = handValue([d.player1, d.player2]);
      expect(hv.total).toBe(16);
      expect(hv.isSoft).toBe(false);
    }
  });

  it('dealer upcard matches deviation dealerUp value (Ace maps to rank A)', () => {
    const dev = H17_DEVIATIONS.find(d => d.dealerUp === 11)!;
    for (let i = 0; i < 50; i++) {
      const d = buildForcedDeal(dev);
      expect(d.dealerUp.rank).toBe('A');
    }
  });

  it('populates a hole card of any rank', () => {
    const dev = H17_DEVIATIONS[0];
    const d = buildForcedDeal(dev);
    expect(d.dealerHole).toBeDefined();
    expect(d.dealerHole.rank).toBeTruthy();
  });
});

import { generate } from '../deviationDrill';
import { hiLoValue } from '../../engine/counting';

describe('generate (top-level drill)', () => {
  const rules = h17Rules({ numDecks: 6, surrenderAllowed: true });

  it('produces a shoe whose top 4 cards equal the forced deal order [p1, hole, p2, up]', () => {
    const r = generate(rules);
    expect(r.shoe[0].rank).toEqual(r.forcedDeal.player1.rank);
    expect(r.shoe[1].rank).toEqual(r.forcedDeal.dealerHole.rank);
    expect(r.shoe[2].rank).toEqual(r.forcedDeal.player2.rank);
    expect(r.shoe[3].rank).toEqual(r.forcedDeal.dealerUp.rank);
  });

  it('shoe length equals (targetDecksRem * 52) + 4', () => {
    const r = generate(rules);
    expect(r.shoe.length).toBe(Math.round(r.targetDecksRem * 52) + 4);
  });

  it('pre-seed math: preSeedRC + face-up Hi-Lo === targetRC', () => {
    for (let i = 0; i < 100; i++) {
      const r = generate(rules);
      const faceUpDelta =
        hiLoValue(r.forcedDeal.player1) +
        hiLoValue(r.forcedDeal.player2) +
        hiLoValue(r.forcedDeal.dealerUp);
      expect(r.preSeedRC + faceUpDelta).toBe(r.targetRC);
    }
  });

  it('pre-seed decksRem = target + 4/52', () => {
    const r = generate(rules);
    expect(r.preSeedDecksRem).toBeCloseTo(r.targetDecksRem + 4 / 52, 6);
  });

  it('never returns |preSeedTC| > 8 (sanity clamp)', () => {
    for (let i = 0; i < 500; i++) {
      const r = generate(rules);
      const preSeedTC = Math.trunc(r.preSeedRC / r.preSeedDecksRem);
      expect(Math.abs(preSeedTC)).toBeLessThanOrEqual(8);
    }
  });
});

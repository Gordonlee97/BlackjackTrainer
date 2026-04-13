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

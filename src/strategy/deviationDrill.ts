import type { RuleSet, ChartAction } from './types';
import type { Deviation } from './deviations';
import { getDeviations } from './deviations';

const SURRENDER_ACTIONS = new Set<ChartAction>(['Rh', 'Rs', 'Rp']);

function isApplicable(d: Deviation, rules: RuleSet): boolean {
  if (SURRENDER_ACTIONS.has(d.action) && !rules.surrenderAllowed) return false;
  if (d.onlyIfNoSurrender && rules.surrenderAllowed) return false;
  return true;
}

/**
 * Uniform-random pick of a deviation applicable under the current rules.
 * Throws if the applicable set is empty (callers should ensure `numDecks >= 4`).
 */
export function pickDeviation(rules: RuleSet): Deviation {
  const all = getDeviations(rules);
  const applicable = all.filter(d => isApplicable(d, rules));
  if (applicable.length === 0) {
    throw new Error('No applicable deviations for the given rule set');
  }
  const idx = Math.floor(Math.random() * applicable.length);
  return applicable[idx];
}

export interface TargetCount {
  targetRC: number;
  targetDecksRem: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickDecksRem(numDecks: number): number {
  // Choose a half-deck step in (0.5, numDecks - 0.5)
  const steps = (numDecks - 1) * 2 + 1;
  const i = randInt(0, steps - 1);
  return 0.5 + i * 0.5;
}

/**
 * Generates an internally consistent (targetRC, targetDecksRem) pair such that
 * the deviation's threshold condition is satisfied at the decision-time count.
 *
 * For TC-based deviations: ~40% of generations land exactly at the threshold
 * (borderline), ~60% overshoot by 1-3 in the triggering direction.
 *
 * For usesRunningCount deviations (BJA 0+/0-): RC is ±(1..4); TC is whatever it
 * works out to given a realistic decksRemaining.
 */
export function generateTargetCount(dev: Deviation, numDecks: number): TargetCount {
  const decksRem = pickDecksRem(numDecks);

  if (dev.usesRunningCount) {
    const mag = randInt(1, 4);
    const targetRC = dev.direction === 'gte' ? mag : -mag;
    return { targetRC, targetDecksRem: decksRem };
  }

  const borderline = Math.random() < 0.4;
  const overshoot = borderline ? 0 : randInt(1, 3);
  const desiredTC = dev.direction === 'gte'
    ? dev.threshold + overshoot
    : dev.threshold - overshoot;

  let targetRC: number;
  if (desiredTC > 0) {
    const lo = Math.ceil(desiredTC * decksRem);
    const hi = Math.ceil((desiredTC + 1) * decksRem) - 1;
    targetRC = randInt(lo, Math.max(lo, hi));
  } else if (desiredTC < 0) {
    const hi = Math.floor(desiredTC * decksRem);
    const lo = Math.floor((desiredTC - 1) * decksRem) + 1;
    targetRC = randInt(Math.min(lo, hi), hi);
  } else {
    const range = Math.floor(decksRem);
    targetRC = randInt(-range, range);
  }

  return { targetRC, targetDecksRem: decksRem };
}

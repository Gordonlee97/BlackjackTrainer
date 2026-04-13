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

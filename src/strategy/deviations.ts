import type { ChartAction, RuleSet } from './types';

export interface Deviation {
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUp: number;
  threshold: number;
  direction: 'gte' | 'lte';
  action: ChartAction;
}

// ============================================================
// H17 DEVIATIONS (Dealer Hits Soft 17, 4-8 decks)
// Source: BJA H17 chart (src/strategy/BJA_H17.pdf)
// ============================================================
// TODO: Transcribe from BJA_H17.pdf — cell-by-cell verification required
export const H17_DEVIATIONS: Deviation[] = [];

// ============================================================
// S17 DEVIATIONS (Dealer Stands on Soft 17, 4-8 decks)
// Source: BJA S17 chart (src/strategy/BJA_S17.pdf)
// ============================================================
// TODO: Transcribe from BJA_S17.pdf — cell-by-cell verification required
export const S17_DEVIATIONS: Deviation[] = [];

/**
 * Get the applicable deviation list for the current rules.
 * Returns empty array for 1-2 deck games (deviation indices differ).
 */
export function getDeviations(rules: RuleSet): Deviation[] {
  if (rules.numDecks < 4) return [];
  return rules.dealerHitsSoft17 ? H17_DEVIATIONS : S17_DEVIATIONS;
}

/**
 * Find a matching deviation for the given hand situation.
 * Returns the deviation if TC meets the threshold condition, otherwise undefined.
 */
export function findDeviation(
  deviations: Deviation[],
  handType: 'hard' | 'soft' | 'pairs',
  playerTotal: number,
  dealerUp: number,
  trueCount: number,
): Deviation | undefined {
  return deviations.find(d =>
    d.handType === handType &&
    d.playerTotal === playerTotal &&
    d.dealerUp === dealerUp &&
    (d.direction === 'gte' ? trueCount >= d.threshold : trueCount <= d.threshold)
  );
}

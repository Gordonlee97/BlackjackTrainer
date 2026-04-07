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

export const H17_DEVIATIONS: Deviation[] = [
  // ── Stand deviations (base is Hit/Rh, deviate to Stand at high TC) ──
  { handType: 'hard', playerTotal: 16, dealerUp: 10, threshold: 0,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 16, dealerUp: 9,  threshold: 5,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 16, dealerUp: 11, threshold: 3,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 15, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 12, dealerUp: 2,  threshold: 3,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 12, dealerUp: 3,  threshold: 2,  direction: 'gte', action: 'S' },

  // ── Double deviations (base is Hit, deviate to Double at high TC) ──
  { handType: 'hard', playerTotal: 10, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 10, dealerUp: 11, threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 2,  threshold: 1,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 7,  threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 8,  dealerUp: 6,  threshold: 2,  direction: 'gte', action: 'D' },

  // ── Hit deviations (base is Stand, deviate to Hit at low TC) ──
  { handType: 'hard', playerTotal: 13, dealerUp: 2,  threshold: -1, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 13, dealerUp: 3,  threshold: -2, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 4,  threshold: 0,  direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 5,  threshold: -2, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 6,  threshold: -1, direction: 'lte', action: 'H' },

  // ── Pair splitting deviations (base is Stand on 20, deviate to Split) ──
  { handType: 'pairs', playerTotal: 10, dealerUp: 4,  threshold: 6,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 5,  threshold: 5,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 6,  threshold: 4,  direction: 'gte', action: 'P' },

  // ── Surrender deviations (base is Hit, deviate to Surrender at high TC) ──
  { handType: 'hard', playerTotal: 14, dealerUp: 10, threshold: 3,  direction: 'gte', action: 'Rh' },
  { handType: 'hard', playerTotal: 15, dealerUp: 9,  threshold: 2,  direction: 'gte', action: 'Rh' },
  { handType: 'hard', playerTotal: 16, dealerUp: 8,  threshold: 4,  direction: 'gte', action: 'Rh' },
];

// ============================================================
// S17 DEVIATIONS (Dealer Stands on Soft 17, 4-8 decks)
// Source: BJA S17 chart (src/strategy/BJA_S17.pdf)
// ============================================================

export const S17_DEVIATIONS: Deviation[] = [
  // ── Stand deviations (base is Hit/Rh, deviate to Stand at high TC) ──
  { handType: 'hard', playerTotal: 16, dealerUp: 10, threshold: 0,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 16, dealerUp: 9,  threshold: 5,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 15, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 12, dealerUp: 2,  threshold: 3,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 12, dealerUp: 3,  threshold: 2,  direction: 'gte', action: 'S' },

  // ── Double deviations (base is Hit, deviate to Double at high TC) ──
  { handType: 'hard', playerTotal: 10, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 10, dealerUp: 11, threshold: 4,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 2,  threshold: 1,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 7,  threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 8,  dealerUp: 6,  threshold: 2,  direction: 'gte', action: 'D' },

  // ── Hit deviations (base is Stand/Double, deviate to Hit at low TC) ──
  { handType: 'hard', playerTotal: 13, dealerUp: 2,  threshold: -1, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 13, dealerUp: 3,  threshold: -2, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 4,  threshold: 0,  direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 5,  threshold: -2, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 6,  threshold: -1, direction: 'lte', action: 'H' },
  // In S17, 11 vs A base chart has D but correct S17 basic is H; double only at TC ≥ 1
  { handType: 'hard', playerTotal: 11, dealerUp: 11, threshold: 0,  direction: 'lte', action: 'H' },

  // ── Pair splitting deviations (base is Stand on 20, deviate to Split) ──
  { handType: 'pairs', playerTotal: 10, dealerUp: 4,  threshold: 6,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 5,  threshold: 5,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 6,  threshold: 4,  direction: 'gte', action: 'P' },

  // ── Surrender deviations (base is Hit, deviate to Surrender at high TC) ──
  { handType: 'hard', playerTotal: 14, dealerUp: 10, threshold: 3,  direction: 'gte', action: 'Rh' },
  { handType: 'hard', playerTotal: 15, dealerUp: 9,  threshold: 2,  direction: 'gte', action: 'Rh' },
  { handType: 'hard', playerTotal: 15, dealerUp: 11, threshold: 2,  direction: 'gte', action: 'Rh' },
  { handType: 'hard', playerTotal: 16, dealerUp: 8,  threshold: 4,  direction: 'gte', action: 'Rh' },
];

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

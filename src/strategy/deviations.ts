import type { ChartAction, RuleSet } from './types';

export interface Deviation {
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUp: number;
  threshold: number;
  direction: 'gte' | 'lte';
  action: ChartAction;
  /** When true, this deviation only applies when surrender is NOT available for this hand */
  onlyIfNoSurrender?: boolean;
  /** BJA 0+/0- notation: checks running count sign instead of true count.
   *  0+ (gte) = any positive RC (RC > 0), 0- (lte) = any negative RC (RC < 0) */
  usesRunningCount?: boolean;
}

// ============================================================
// H17 DEVIATIONS (Dealer Hits Soft 17, 4-8 decks)
// Source: blackjack_strategy.md — Parts 2B–2E
// ============================================================

export const H17_DEVIATIONS: Deviation[] = [
  // ── Surrender deviations ──
  // 17 vs A: BS=SUR(Rs), stand instead of surrendering at high count
  { handType: 'hard', playerTotal: 17, dealerUp: 11, threshold: 2,  direction: 'gte', action: 'S' },
  // 16 vs 8: BS=H, surrender at high count
  { handType: 'hard', playerTotal: 16, dealerUp: 8,  threshold: 4,  direction: 'gte', action: 'Rh' },
  // 16 vs 9: BS=SUR(Rh), hit instead of surrendering at low count
  { handType: 'hard', playerTotal: 16, dealerUp: 9,  threshold: -1, direction: 'lte', action: 'H' },
  // 15 vs 9: BS=H, surrender at high count
  { handType: 'hard', playerTotal: 15, dealerUp: 9,  threshold: 2,  direction: 'gte', action: 'Rh' },
  // 15 vs 10: BS=SUR(Rh), hit instead of surrendering at low count
  { handType: 'hard', playerTotal: 15, dealerUp: 10, threshold: -1, direction: 'lte', action: 'H' },
  // 15 vs A: BS=H, surrender at TC >= -1
  { handType: 'hard', playerTotal: 15, dealerUp: 11, threshold: -1, direction: 'gte', action: 'Rh' },
  // 14 vs 10: BS=H, surrender at high count
  { handType: 'hard', playerTotal: 14, dealerUp: 10, threshold: 3,  direction: 'gte', action: 'Rh' },

  // ── Stand deviations (only when surrender is NOT available) ──
  // These are superseded by surrender when available
  { handType: 'hard', playerTotal: 16, dealerUp: 10, threshold: 0,  direction: 'gte', action: 'S', onlyIfNoSurrender: true, usesRunningCount: true },
  { handType: 'hard', playerTotal: 16, dealerUp: 9,  threshold: 4,  direction: 'gte', action: 'S', onlyIfNoSurrender: true },
  { handType: 'hard', playerTotal: 16, dealerUp: 11, threshold: 3,  direction: 'gte', action: 'S', onlyIfNoSurrender: true },
  { handType: 'hard', playerTotal: 15, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'S', onlyIfNoSurrender: true },
  { handType: 'hard', playerTotal: 15, dealerUp: 11, threshold: 5,  direction: 'gte', action: 'S', onlyIfNoSurrender: true },

  // ── Stand deviations (always apply) ──
  { handType: 'hard', playerTotal: 12, dealerUp: 2,  threshold: 3,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 12, dealerUp: 3,  threshold: 2,  direction: 'gte', action: 'S' },

  // ── Hit deviations ──
  { handType: 'hard', playerTotal: 13, dealerUp: 2,  threshold: -1, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 4,  threshold: 0, direction: 'lte', action: 'H', usesRunningCount: true },

  // ── Double deviations ──
  { handType: 'hard', playerTotal: 10, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 10, dealerUp: 11, threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 2,  threshold: 1,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 7,  threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 8,  dealerUp: 6,  threshold: 2,  direction: 'gte', action: 'D' },

  // ── Soft total deviations ──
  { handType: 'soft', playerTotal: 19, dealerUp: 4,  threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'soft', playerTotal: 19, dealerUp: 5,  threshold: 1,  direction: 'gte', action: 'D' },
  // A,8 vs 6 (H17): BS=Ds, stand at any negative running count (BJA 0-)
  { handType: 'soft', playerTotal: 19, dealerUp: 6,  threshold: 0, direction: 'lte', action: 'S', usesRunningCount: true },
  { handType: 'soft', playerTotal: 17, dealerUp: 2,  threshold: 1,  direction: 'gte', action: 'D' },

  // ── Pair splitting deviations ──
  { handType: 'pairs', playerTotal: 10, dealerUp: 4,  threshold: 6,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 5,  threshold: 5,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 6,  threshold: 4,  direction: 'gte', action: 'P' },
];

// ============================================================
// S17 DEVIATIONS (Dealer Stands on Soft 17, 4-8 decks)
// Source: blackjack_strategy.md — Parts 6B–6E
// ============================================================

export const S17_DEVIATIONS: Deviation[] = [
  // ── Surrender deviations ──
  // 16 vs 8: BS=H, surrender at high count
  { handType: 'hard', playerTotal: 16, dealerUp: 8,  threshold: 4,  direction: 'gte', action: 'Rh' },
  // 16 vs 9: BS=SUR(Rh), hit instead of surrendering at low count
  { handType: 'hard', playerTotal: 16, dealerUp: 9,  threshold: -1, direction: 'lte', action: 'H' },
  // 15 vs 9: BS=H, surrender at high count
  { handType: 'hard', playerTotal: 15, dealerUp: 9,  threshold: 2,  direction: 'gte', action: 'Rh' },
  // 15 vs 10: BS=SUR(Rh), hit instead of surrendering at low count
  { handType: 'hard', playerTotal: 15, dealerUp: 10, threshold: -1, direction: 'lte', action: 'H' },
  // 15 vs A: BS=H, surrender at high count (S17: base is Hit, not surrender)
  { handType: 'hard', playerTotal: 15, dealerUp: 11, threshold: 2,  direction: 'gte', action: 'Rh' },
  // 14 vs 10: BS=H, surrender at high count
  { handType: 'hard', playerTotal: 14, dealerUp: 10, threshold: 3,  direction: 'gte', action: 'Rh' },

  // ── Stand deviations (only when surrender is NOT available) ──
  { handType: 'hard', playerTotal: 16, dealerUp: 10, threshold: 0,  direction: 'gte', action: 'S', onlyIfNoSurrender: true, usesRunningCount: true },
  { handType: 'hard', playerTotal: 16, dealerUp: 9,  threshold: 4,  direction: 'gte', action: 'S', onlyIfNoSurrender: true },
  { handType: 'hard', playerTotal: 16, dealerUp: 11, threshold: 3,  direction: 'gte', action: 'S', onlyIfNoSurrender: true },
  { handType: 'hard', playerTotal: 15, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'S', onlyIfNoSurrender: true },

  // ── Stand deviations (always apply) ──
  { handType: 'hard', playerTotal: 12, dealerUp: 2,  threshold: 3,  direction: 'gte', action: 'S' },
  { handType: 'hard', playerTotal: 12, dealerUp: 3,  threshold: 2,  direction: 'gte', action: 'S' },

  // ── Hit deviations ──
  { handType: 'hard', playerTotal: 13, dealerUp: 2,  threshold: -1, direction: 'lte', action: 'H' },
  { handType: 'hard', playerTotal: 12, dealerUp: 4,  threshold: 0, direction: 'lte', action: 'H', usesRunningCount: true },

  // ── Double deviations ──
  // 11 vs A: BS=H in S17, double at high count
  { handType: 'hard', playerTotal: 11, dealerUp: 11, threshold: 1,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 10, dealerUp: 10, threshold: 4,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 10, dealerUp: 11, threshold: 4,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 2,  threshold: 1,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 9,  dealerUp: 7,  threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'hard', playerTotal: 8,  dealerUp: 6,  threshold: 2,  direction: 'gte', action: 'D' },

  // ── Soft total deviations ──
  { handType: 'soft', playerTotal: 19, dealerUp: 4,  threshold: 3,  direction: 'gte', action: 'D' },
  { handType: 'soft', playerTotal: 19, dealerUp: 5,  threshold: 1,  direction: 'gte', action: 'D' },
  // A,8 vs 6 (S17): BS=S, double at TC 1+
  { handType: 'soft', playerTotal: 19, dealerUp: 6,  threshold: 1,  direction: 'gte', action: 'D' },
  { handType: 'soft', playerTotal: 17, dealerUp: 2,  threshold: 1,  direction: 'gte', action: 'D' },

  // ── Pair splitting deviations ──
  { handType: 'pairs', playerTotal: 10, dealerUp: 4,  threshold: 6,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 5,  threshold: 5,  direction: 'gte', action: 'P' },
  { handType: 'pairs', playerTotal: 10, dealerUp: 6,  threshold: 4,  direction: 'gte', action: 'P' },
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
 * canSurrender gates onlyIfNoSurrender deviations.
 */
export function findDeviation(
  deviations: Deviation[],
  handType: 'hard' | 'soft' | 'pairs',
  playerTotal: number,
  dealerUp: number,
  trueCount: number,
  canSurrender: boolean,
  runningCount?: number,
): Deviation | undefined {
  const SURRENDER_ACTIONS: ChartAction[] = ['Rh', 'Rs', 'Rp'];
  return deviations.find(d => {
    if (d.handType !== handType || d.playerTotal !== playerTotal || d.dealerUp !== dealerUp) return false;
    if (d.onlyIfNoSurrender && canSurrender) return false;
    if (SURRENDER_ACTIONS.includes(d.action) && !canSurrender) return false;

    // BJA 0+/0-: check running count sign, not true count
    if (d.usesRunningCount && runningCount != null) {
      return d.direction === 'gte' ? runningCount > 0 : runningCount < 0;
    }

    return d.direction === 'gte' ? trueCount >= d.threshold : trueCount <= d.threshold;
  });
}

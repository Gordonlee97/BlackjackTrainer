export interface UnitRange {
  min: number;
  max: number;
}

export interface BetEvaluation {
  recommended: UnitRange;
  actualUnits: number;
  verdict: 'low' | 'ok' | 'high';
}

/**
 * Standard Hi-Lo 1-8 bet spread.
 * Maps true count to a recommended range (in units, where 1u = table minimum).
 */
export function recommendUnits(trueCount: number): UnitRange {
  if (trueCount <= 1) return { min: 1, max: 1 };
  if (trueCount === 2) return { min: 1, max: 2 };
  if (trueCount === 3) return { min: 2, max: 4 };
  if (trueCount === 4) return { min: 4, max: 6 };
  return { min: 6, max: 8 };
}

export function evaluateBet(
  betAmount: number,
  minBet: number,
  trueCount: number,
): BetEvaluation {
  const actualUnits = Math.round(betAmount / minBet);
  const recommended = recommendUnits(trueCount);
  let verdict: 'low' | 'ok' | 'high';
  if (actualUnits < recommended.min) verdict = 'low';
  else if (actualUnits > recommended.max) verdict = 'high';
  else verdict = 'ok';
  return { recommended, actualUnits, verdict };
}

import type { Card } from '../engine/types';
import { cardValue, handValue, isPair } from '../engine/hand';
import type { ChartAction, FinalAction, FullStrategy, RuleSet } from './types';
import { buildStrategy } from './charts';
import { getDeviations, findDeviation } from './deviations';

type HandType = StrategyAdvice['handType'];

export interface StrategyAdvice {
  correctAction: FinalAction;
  chartAction: ChartAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  isDeviation?: boolean;
  deviationThreshold?: number;
  deviationDirection?: 'gte' | 'lte';
  deviationUsesRunningCount?: boolean;
}

function buildAdvice(
  chartAction: ChartAction,
  handType: 'hard' | 'soft' | 'pairs',
  playerTotal: number,
  dealerUp: number,
  canDouble: boolean,
  canSplit: boolean,
  canSurrender: boolean,
  rules: RuleSet,
  trueCount?: number | null,
  runningCount?: number,
): StrategyAdvice {
  let finalChartAction = chartAction;
  let isDeviation = false;
  let deviationThreshold: number | undefined;
  let deviationDirection: 'gte' | 'lte' | undefined;
  let deviationUsesRunningCount: boolean | undefined;

  // Check for deviation override when true count is provided
  if (trueCount != null) {
    const deviations = getDeviations(rules);
    const deviation = findDeviation(deviations, handType, playerTotal, dealerUp, trueCount, canSurrender, runningCount);
    if (deviation) {
      finalChartAction = deviation.action;
      isDeviation = true;
      deviationThreshold = deviation.threshold;
      deviationDirection = deviation.direction;
      deviationUsesRunningCount = deviation.usesRunningCount;
    }
  }

  const correctAction = resolveAction(finalChartAction, canDouble, canSplit, canSurrender, rules);
  return {
    correctAction,
    chartAction: finalChartAction,
    handType,
    playerTotal,
    dealerUpcard: dealerUp,
    isDeviation,
    deviationThreshold,
    deviationDirection,
    deviationUsesRunningCount,
  };
}

export function getCorrectAction(
  playerCards: Card[],
  dealerUpcard: Card,
  rules: RuleSet,
  canDouble: boolean,
  canSplit: boolean,
  canSurrender: boolean,
  strategy?: FullStrategy,
  trueCount?: number | null,
  runningCount?: number,
): StrategyAdvice {
  const strat = strategy ?? buildStrategy(rules);
  const dealerUp = cardValue(dealerUpcard);
  const hv = handValue(playerCards);
  const advise = (action: ChartAction, handType: HandType, total: number) =>
    buildAdvice(action, handType, total, dealerUp, canDouble, canSplit, canSurrender, rules, trueCount, runningCount);

  // The pairs chart only applies when a split is actually possible. An unsplittable pair
  // (hand limit reached, insufficient balance, no resplit of aces) plays as its total:
  // e.g. 9,9 vs 6 stands on 18 instead of falling back to "hit".
  if (canSplit && isPair(playerCards)) {
    const pairValue = cardValue(playerCards[0]);
    const pairAction = strat.pairs[pairValue]?.[dealerUp];
    if (pairAction) return advise(pairAction, 'pairs', pairValue);
  }

  if (hv.isSoft) {
    // Soft 12 (an unsplittable A,A) can never bust on one card — always hit.
    if (hv.total <= 12) return advise('H', 'soft', hv.total);
    const softAction = strat.soft[hv.total]?.[dealerUp];
    if (softAction) return advise(softAction, 'soft', hv.total);
  }

  const hardTotal = Math.min(hv.total, 21);
  return advise(strat.hard[hardTotal]?.[dealerUp] ?? 'H', 'hard', hardTotal);
}

function resolveAction(
  raw: ChartAction,
  canDouble: boolean,
  canSplit: boolean,
  canSurrender: boolean,
  rules: RuleSet
): FinalAction {
  switch (raw) {
    case 'H':  return 'HIT';
    case 'S':  return 'STAND';
    case 'D':  return canDouble ? 'DOUBLE' : 'HIT';
    case 'Ds': return canDouble ? 'DOUBLE' : 'STAND';
    case 'P':  return canSplit ? 'SPLIT' : 'HIT';
    case 'Ph': return (canSplit && rules.dasAllowed) ? 'SPLIT' : 'HIT';
    case 'Pd': return (canSplit && rules.dasAllowed) ? 'SPLIT' : (canDouble ? 'DOUBLE' : 'HIT');
    case 'Rh': return canSurrender ? 'SURRENDER' : 'HIT';
    case 'Rs': return canSurrender ? 'SURRENDER' : 'STAND';
    case 'Rp': return canSurrender ? 'SURRENDER' : 'SPLIT';
    default:   return 'HIT';
  }
}

import type { Card } from '../engine/types';
import { handValue, isPair } from '../engine/hand';
import type { ChartAction, FinalAction, FullStrategy, RuleSet } from './types';
import { buildStrategy } from './charts';
import { getDeviations, findDeviation } from './deviations';

export interface StrategyAdvice {
  correctAction: FinalAction;
  chartAction: ChartAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  isDeviation?: boolean;
  deviationThreshold?: number;
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
): StrategyAdvice {
  let finalChartAction = chartAction;
  let isDeviation = false;
  let deviationThreshold: number | undefined;

  // Check for deviation override when true count is provided
  if (trueCount != null) {
    const deviations = getDeviations(rules);
    const deviation = findDeviation(deviations, handType, playerTotal, dealerUp, trueCount);
    if (deviation) {
      finalChartAction = deviation.action;
      isDeviation = true;
      deviationThreshold = deviation.threshold;
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
): StrategyAdvice {
  const strat = strategy ?? buildStrategy(rules);
  const dealerUp = dealerUpcard.rank === 'A' ? 11 : Math.min(10, parseInt(dealerUpcard.rank) || 10);
  const hv = handValue(playerCards);

  let chartAction: ChartAction;
  let handType: 'hard' | 'soft' | 'pairs';
  let playerTotal: number;

  // Check pairs first (only on first two cards)
  if (isPair(playerCards) && playerCards.length === 2) {
    const pairValue = playerCards[0].rank === 'A' ? 11 : Math.min(10, parseInt(playerCards[0].rank) || 10);
    const pairAction = strat.pairs[pairValue]?.[dealerUp];
    if (pairAction) {
      chartAction = pairAction;
      handType = 'pairs';
      playerTotal = pairValue;
      return buildAdvice(chartAction, handType, playerTotal, dealerUp, canDouble, canSplit, canSurrender, rules, trueCount);
    }
  }

  // Check soft totals
  if (hv.isSoft && hv.total >= 13 && hv.total <= 20) {
    const softAction = strat.soft[hv.total]?.[dealerUp];
    if (softAction) {
      chartAction = softAction;
      handType = 'soft';
      playerTotal = hv.total;
      return buildAdvice(chartAction, handType, playerTotal, dealerUp, canDouble, canSplit, canSurrender, rules, trueCount);
    }
  }

  // Hard totals
  const lookupTotal = Math.min(hv.total, 21);
  chartAction = strat.hard[lookupTotal]?.[dealerUp] ?? 'H';
  handType = 'hard';
  playerTotal = lookupTotal;
  return buildAdvice(chartAction, handType, playerTotal, dealerUp, canDouble, canSplit, canSurrender, rules, trueCount);
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

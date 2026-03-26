import type { StrategyChart, FullStrategy, ChartAction, RuleSet } from './types';

// Helper to build a chart row: dealerUpcard 2,3,4,5,6,7,8,9,10,A
function row(...actions: ChartAction[]): Record<number, ChartAction> {
  const [d2, d3, d4, d5, d6, d7, d8, d9, d10, dA] = actions;
  return { 2: d2, 3: d3, 4: d4, 5: d5, 6: d6, 7: d7, 8: d8, 9: d9, 10: d10, 11: dA };
}

// ============================================================
// BASE CHARTS: 4-8 deck, Dealer Stands on Soft 17, DAS allowed
// ============================================================

const BASE_HARD: StrategyChart = {
  5:  row('H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H'),
  6:  row('H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H'),
  7:  row('H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H'),
  8:  row('H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H'),
  9:  row('H',  'D',  'D',  'D',  'D',  'H',  'H',  'H',  'H',  'H'),
  10: row('D',  'D',  'D',  'D',  'D',  'D',  'D',  'D',  'H',  'H'),
  11: row('D',  'D',  'D',  'D',  'D',  'D',  'D',  'D',  'D',  'D'),
  12: row('H',  'H',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H'),
  13: row('S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H'),
  14: row('S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H'),
  15: row('S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'Rh', 'H'),
  16: row('S',  'S',  'S',  'S',  'S',  'H',  'H',  'Rh', 'Rh', 'Rh'),
  17: row('S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'Rs'),
  18: row('S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S'),
  19: row('S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S'),
  20: row('S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S'),
  21: row('S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S'),
};

// Soft totals: key is the non-ace card value (e.g., 13 = A+2, 14 = A+3, etc.)
const BASE_SOFT: StrategyChart = {
  13: row('H',  'H',  'H',  'D',  'D',  'H',  'H',  'H',  'H',  'H'),   // A,2
  14: row('H',  'H',  'H',  'D',  'D',  'H',  'H',  'H',  'H',  'H'),   // A,3
  15: row('H',  'H',  'D',  'D',  'D',  'H',  'H',  'H',  'H',  'H'),   // A,4
  16: row('H',  'H',  'D',  'D',  'D',  'H',  'H',  'H',  'H',  'H'),   // A,5
  17: row('H',  'D',  'D',  'D',  'D',  'H',  'H',  'H',  'H',  'H'),   // A,6
  18: row('Ds', 'Ds', 'Ds', 'Ds', 'Ds', 'S',  'S',  'H',  'H',  'H'),   // A,7
  19: row('S',  'S',  'S',  'S',  'Ds', 'S',  'S',  'S',  'S',  'S'),   // A,8
  20: row('S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S'),   // A,9
};

// Pairs: key is the value of one card in the pair (e.g., 11 = A,A; 10 = 10,10)
const BASE_PAIRS: StrategyChart = {
  2:  row('Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H'),   // 2,2
  3:  row('Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H'),   // 3,3
  4:  row('H',  'H',  'H',  'Ph', 'Ph', 'H',  'H',  'H',  'H',  'H'),   // 4,4
  5:  row('D',  'D',  'D',  'D',  'D',  'D',  'D',  'D',  'H',  'H'),   // 5,5 (never split)
  6:  row('Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H',  'H'),   // 6,6
  7:  row('P',  'P',  'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H'),   // 7,7
  8:  row('P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'Rp'),  // 8,8
  9:  row('P',  'P',  'P',  'P',  'P',  'S',  'P',  'P',  'S',  'S'),   // 9,9
  10: row('S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S'),   // 10,10
  11: row('P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P'),   // A,A
};

// ============================================================
// RULE VARIATION OVERRIDES
// ============================================================

type ChartOverride = { [playerTotal: number]: { [dealerUp: number]: ChartAction } };

interface OverrideSet {
  hard?: ChartOverride;
  soft?: ChartOverride;
  pairs?: ChartOverride;
}

// Dealer Hits Soft 17 overrides (vs S17 base)
const H17_OVERRIDES: OverrideSet = {
  hard: {
    11: { 11: 'D' },    // Still double (same as S17 for multi-deck)
    15: { 11: 'Rh' },   // Surrender vs A (S17: just hit)
    17: { 11: 'Rs' },   // Surrender vs A (S17: stand -- but Rs means stand if no surrender)
  },
  soft: {
    18: { 2: 'Ds' },    // Double vs 2 (was Ds already in many charts, confirming)
    19: { 6: 'Ds' },    // Double vs 6
  },
  pairs: {},
};

// Single deck overrides (applied on top of base)
const SINGLE_DECK_OVERRIDES: OverrideSet = {
  hard: {
    8:  { 5: 'D', 6: 'D' },
    9:  { 2: 'D' },
    11: { 11: 'D' },
  },
  soft: {
    17: { 2: 'D' },     // A,6 vs 2: Double
  },
  pairs: {
    6:  { 2: 'P', 7: 'P' },   // Split 6s more aggressively
  },
};

// Double deck overrides
const DOUBLE_DECK_OVERRIDES: OverrideSet = {
  hard: {
    9: { 2: 'D' },      // Double 9 vs 2
  },
  soft: {},
  pairs: {},
};

// No DAS overrides: Ph -> H, Pd -> D
const NO_DAS_OVERRIDES: OverrideSet = {
  pairs: {
    2:  { 2: 'H', 3: 'H' },
    3:  { 2: 'H', 3: 'H' },
    4:  { 5: 'H', 6: 'H' },
    6:  { 2: 'H' },
  },
};

function deepCopyChart(chart: StrategyChart): StrategyChart {
  const copy: StrategyChart = {};
  for (const key in chart) {
    copy[key] = { ...chart[key] };
  }
  return copy;
}

function applyOverrides(chart: StrategyChart, overrides?: ChartOverride) {
  if (!overrides) return;
  for (const playerTotal in overrides) {
    const pt = Number(playerTotal);
    if (!chart[pt]) chart[pt] = {};
    for (const dealerUp in overrides[pt]) {
      chart[pt][Number(dealerUp)] = overrides[pt][Number(dealerUp)];
    }
  }
}

export function buildStrategy(rules: RuleSet): FullStrategy {
  const hard = deepCopyChart(BASE_HARD);
  const soft = deepCopyChart(BASE_SOFT);
  const pairs = deepCopyChart(BASE_PAIRS);

  if (rules.dealerHitsSoft17) {
    applyOverrides(hard, H17_OVERRIDES.hard);
    applyOverrides(soft, H17_OVERRIDES.soft);
    applyOverrides(pairs, H17_OVERRIDES.pairs);
  }

  if (rules.numDecks === 1) {
    applyOverrides(hard, SINGLE_DECK_OVERRIDES.hard);
    applyOverrides(soft, SINGLE_DECK_OVERRIDES.soft);
    applyOverrides(pairs, SINGLE_DECK_OVERRIDES.pairs);
  } else if (rules.numDecks === 2) {
    applyOverrides(hard, DOUBLE_DECK_OVERRIDES.hard);
    applyOverrides(soft, DOUBLE_DECK_OVERRIDES.soft);
    applyOverrides(pairs, DOUBLE_DECK_OVERRIDES.pairs);
  }

  if (!rules.dasAllowed) {
    applyOverrides(pairs, NO_DAS_OVERRIDES.pairs);
  }

  return { hard, soft, pairs };
}

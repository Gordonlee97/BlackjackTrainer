export type ChartAction =
  | 'H'    // Hit
  | 'S'    // Stand
  | 'D'    // Double if allowed, else Hit
  | 'Ds'   // Double if allowed, else Stand
  | 'P'    // Split
  | 'Ph'   // Split if DAS allowed, else Hit
  | 'Pd'   // Split if DAS allowed, else Double (then Hit)
  | 'Rh'   // Surrender if allowed, else Hit
  | 'Rs'   // Surrender if allowed, else Stand
  | 'Rp';  // Surrender if allowed, else Split

export type FinalAction = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER';

export interface RuleSet {
  numDecks: 1 | 2 | 4 | 6 | 8;
  dealerHitsSoft17: boolean;
  dasAllowed: boolean;
  surrenderAllowed: boolean;
  hitSplitAces: boolean;
  practiceMode: 'all' | 'hard' | 'soft' | 'splits';
  wrongMoveAction: 'execute' | 'block';
  showHandTotals: boolean;
  soundVolume: number; // 0–100
  showCount: 'off' | 'always' | 'hover';
}

// Chart: playerValue -> dealerUpcard (2-11, where 11=Ace) -> action
export type StrategyChart = Record<number, Record<number, ChartAction>>;

export interface FullStrategy {
  hard: StrategyChart;
  soft: StrategyChart;
  pairs: StrategyChart;
}

export const DEFAULT_RULES: RuleSet = {
  numDecks: 6,
  dealerHitsSoft17: true,
  dasAllowed: true,
  surrenderAllowed: false,
  hitSplitAces: false,
  practiceMode: 'all',
  wrongMoveAction: 'block',
  showHandTotals: true,
  soundVolume: 30,
  showCount: 'hover',
};

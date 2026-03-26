export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface HandState {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isComplete: boolean;
  result?: HandResult;
}

export type HandResult = 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';

export type GamePhase =
  | 'betting'
  | 'dealing'
  | 'player_turn'
  | 'dealer_turn'
  | 'settling'
  | 'complete';

export interface GameState {
  phase: GamePhase;
  shoe: Card[];
  shoeSize: number;
  dealerHand: HandState;
  playerHands: HandState[];
  activeHandIndex: number;
  balance: number;
  currentBet: number;
  dealerHoleCardRevealed: boolean;
  message: string;
}

export const RANK_VALUES: Record<Rank, number> = {
  'A': 11,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 10,
  'Q': 10,
  'K': 10,
};

export const ALL_SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const ALL_RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

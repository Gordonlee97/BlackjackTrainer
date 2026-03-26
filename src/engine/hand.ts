import type { Card } from './types';
import { RANK_VALUES } from './types';

export interface HandValue {
  total: number;
  isSoft: boolean;
}

export function handValue(cards: Card[]): HandValue {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    const val = RANK_VALUES[card.rank];
    total += val;
    if (card.rank === 'A') aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return { total, isSoft: aces > 0 };
}

export function isBust(cards: Card[]): boolean {
  return handValue(cards).total > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function isPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const v1 = RANK_VALUES[cards[0].rank];
  const v2 = RANK_VALUES[cards[1].rank];
  return v1 === v2;
}

export function cardValue(card: Card): number {
  return RANK_VALUES[card.rank];
}

export function dealerUpcardValue(card: Card): number {
  // For strategy lookup: Ace = 11
  return RANK_VALUES[card.rank];
}

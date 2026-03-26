import type { Card } from './types';
import { ALL_SUITS, ALL_RANKS } from './types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ suit, rank, faceUp: true });
    }
  }
  return deck;
}

export function createShoe(numDecks: number): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createDeck());
  }
  return shuffle(shoe);
}

export function shuffle(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawCard(shoe: Card[], faceUp = true): { card: Card; shoe: Card[] } {
  if (shoe.length === 0) {
    throw new Error('Shoe is empty');
  }
  const [card, ...remaining] = shoe;
  return { card: { ...card, faceUp }, shoe: remaining };
}

export function needsReshuffle(shoe: Card[], totalCards: number): boolean {
  return shoe.length < totalCards * 0.25;
}

import type { HandState, HandResult, Card } from './types';
import { handValue, isBlackjack, isBust } from './hand';

export function settleHand(
  playerHand: HandState,
  dealerCards: Card[],
  dealerHasBlackjack: boolean
): HandResult {
  const playerCards = playerHand.cards;
  const playerVal = handValue(playerCards);

  // Player surrendered
  if (playerHand.result === 'surrender') return 'surrender';

  // Player busted
  if (isBust(playerCards)) return 'lose';

  // Player has natural blackjack (not from split)
  if (isBlackjack(playerCards) && !playerHand.isSplit) {
    if (dealerHasBlackjack) return 'push';
    return 'blackjack';
  }

  // Dealer has blackjack
  if (dealerHasBlackjack) return 'lose';

  // Dealer busted
  if (isBust(dealerCards)) return 'win';

  const dealerVal = handValue(dealerCards);

  if (playerVal.total > dealerVal.total) return 'win';
  if (playerVal.total < dealerVal.total) return 'lose';
  return 'push';
}

export function calculatePayout(hand: HandState): number {
  const bet = hand.isDoubled ? hand.bet * 2 : hand.bet;

  switch (hand.result) {
    case 'blackjack':
      return bet * 1.5; // 3:2 payout
    case 'win':
      return bet;
    case 'push':
      return 0;
    case 'surrender':
      return -(hand.bet / 2);
    case 'lose':
      return -bet;
    default:
      return 0;
  }
}

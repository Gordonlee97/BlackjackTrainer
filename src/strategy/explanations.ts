import type { FinalAction } from './types';

interface ExplanationContext {
  correctAction: FinalAction;
  playerAction: FinalAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
}

const DEALER_BUST_CARDS = [2, 3, 4, 5, 6];
const DEALER_STRONG_CARDS = [7, 8, 9, 10, 11];

function dealerCardName(value: number): string {
  return value === 11 ? 'Ace' : String(value);
}

function isDealerWeak(dealerUp: number): boolean {
  return DEALER_BUST_CARDS.includes(dealerUp);
}

export function getExplanation(ctx: ExplanationContext): string {
  const { correctAction, handType, playerTotal, dealerUpcard } = ctx;
  const dealerName = dealerCardName(dealerUpcard);
  const dealerWeak = isDealerWeak(dealerUpcard);

  // Pair explanations
  if (handType === 'pairs') {
    return getPairExplanation(correctAction, playerTotal, dealerName, dealerWeak);
  }

  // Soft total explanations
  if (handType === 'soft') {
    return getSoftExplanation(correctAction, playerTotal, dealerName, dealerWeak);
  }

  // Hard total explanations
  return getHardExplanation(correctAction, playerTotal, dealerName, dealerWeak, dealerUpcard);
}

function getPairExplanation(action: FinalAction, pairValue: number, dealerName: string, dealerWeak: boolean): string {
  if (pairValue === 11) {
    return `Always split Aces. Two hands starting with an Ace each are far more valuable than a soft 12.`;
  }
  if (pairValue === 8) {
    if (action === 'SURRENDER') {
      return `Against a dealer ${dealerName}, 16 is the worst hand in blackjack. Surrendering loses less than playing it out.`;
    }
    return `Always split 8s. A hard 16 is the worst hand, but two hands starting with 8 each have good potential.`;
  }
  if (pairValue === 10) {
    return `Never split 10s. A hard 20 is one of the strongest hands possible. Don't break it up.`;
  }
  if (pairValue === 5) {
    return `Never split 5s. A hard 10 is a great doubling hand. Treat it as a hard total instead.`;
  }
  if (pairValue === 9) {
    if (action === 'STAND') {
      return `Against a dealer ${dealerName}, stand on 18. Your total is strong enough without the risk of splitting.`;
    }
    return `Split 9s against a dealer ${dealerName}. Two hands starting at 9 can reach 19 easily, better than standing on 18 here.`;
  }
  if (action === 'SPLIT') {
    if (dealerWeak) {
      return `Split against a weak dealer ${dealerName}. The dealer has a high chance of busting, so maximize your bets with two hands.`;
    }
    return `Split here to give each hand a better starting point than the combined total.`;
  }
  return `Against a dealer ${dealerName}, the combined total plays better than splitting into two weaker hands.`;
}

function getSoftExplanation(action: FinalAction, total: number, dealerName: string, dealerWeak: boolean): string {
  if (action === 'DOUBLE') {
    if (dealerWeak) {
      return `Double your soft ${total} against a weak dealer ${dealerName}. You can't bust a soft hand, and the dealer is likely to bust, so maximize your bet.`;
    }
    return `Double your soft ${total} here. The soft hand gives you flexibility, and the odds favor getting more money on the table.`;
  }
  if (action === 'STAND') {
    if (total >= 19) {
      return `Stand on soft ${total}. This is already a very strong hand.`;
    }
    return `Stand on soft ${total} against a dealer ${dealerName}. Your total is strong enough, and hitting risks getting a worse hand.`;
  }
  return `Hit your soft ${total} against a dealer ${dealerName}. Your hand isn't strong enough to stand, and you can't bust a soft hand.`;
}

function getHardExplanation(action: FinalAction, total: number, dealerName: string, dealerWeak: boolean, dealerUp: number): string {
  if (action === 'SURRENDER') {
    return `Surrender your hard ${total} against a dealer ${dealerName}. This hand loses more than half the time, so getting half your bet back is the better deal.`;
  }
  if (action === 'DOUBLE') {
    if (total === 11) {
      return `Double on hard 11 against a dealer ${dealerName}. You have the best doubling hand, with a great chance of hitting 21.`;
    }
    if (total === 10) {
      return `Double on hard 10 against a dealer ${dealerName}. A strong doubling hand with good odds of reaching 20.`;
    }
    return `Double on hard ${total} against a weak dealer ${dealerName}. The dealer is likely to bust, so increase your bet.`;
  }
  if (action === 'STAND') {
    if (dealerWeak) {
      return `Stand on hard ${total} against a weak dealer ${dealerName}. The dealer has a ~${dealerUp <= 4 ? '40' : '42'}% chance of busting, so don't risk busting yourself.`;
    }
    if (total >= 17) {
      return `Stand on hard ${total}. With 17 or higher, the risk of busting by hitting is too great.`;
    }
    return `Stand on hard ${total} against a dealer ${dealerName}. The risk of busting outweighs the potential gain.`;
  }
  // HIT
  if (DEALER_STRONG_CARDS.includes(dealerUp) && total <= 16) {
    return `Hit your hard ${total} against a strong dealer ${dealerName}. The dealer is likely to make a strong hand, so you need to improve yours despite the bust risk.`;
  }
  if (total <= 11) {
    return `Hit your hard ${total}. You can't bust, so always take another card to improve your hand.`;
  }
  return `Hit your hard ${total} against a dealer ${dealerName}. Your hand isn't strong enough to stand, and you need to try to improve it.`;
}

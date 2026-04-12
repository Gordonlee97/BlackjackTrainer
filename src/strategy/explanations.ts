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

  // Pair explanations — only use pair logic if the correct play or the player's action involves splitting
  if (handType === 'pairs') {
    if (correctAction === 'SPLIT' || ctx.playerAction === 'SPLIT') {
      return getPairExplanation(correctAction, playerTotal, dealerName, dealerWeak);
    }
    // For pairs where you don't split (e.g. 5-5, 10-10), explain as a hard total
    return getHardExplanation(correctAction, playerTotal * 2, dealerName, dealerWeak, dealerUpcard);
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
    if (action === 'DOUBLE') {
      return `Never split 5s. A hard 10 is a great doubling hand. Treat it as a hard total instead.`;
    }
    return `Never split 5s. Treat it as a hard 10 instead.`;
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

/* ── Deviation explanations ── */

export interface DeviationExplanationContext {
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  threshold: number;
  direction: 'gte' | 'lte';
  usesRunningCount?: boolean;
}

function formatTC(threshold: number, direction: 'gte' | 'lte', usesRunningCount?: boolean): string {
  if (usesRunningCount) {
    return direction === 'gte' ? 'any positive running count' : 'any negative running count';
  }
  const sign = threshold > 0 ? '+' : '';
  const dirWord = direction === 'gte' ? 'or higher' : 'or lower';
  return `TC ${sign}${threshold} ${dirWord}`;
}

/**
 * Every BJA deviation gets a specific explanation grounded in card-counting logic.
 * Keys: "handType:playerTotal:dealerUpcard:direction"
 * Direction is included because some hands have deviations in both directions
 * (e.g., 16 vs 9: hit at low TC, stand at high TC in no-surrender games).
 * {tc} is replaced with the formatted threshold string.
 */
const DEVIATION_EXPLANATIONS: Record<string, string> = {
  // ── Surrender-related deviations ──
  // 17 vs A: Stand instead of surrendering at high TC
  'hard:17:11:gte':
    'Basic strategy says surrender, but at {tc}, stand. At a high count, your 17 has a better chance against the dealer\'s Ace — the high cards help you hold strong.',
  // 16 vs 8: Surrender at high TC
  'hard:16:8:gte':
    'Basic strategy says hit, but at {tc}, surrender. The dealer\'s 8 likely pairs with a 10 for 18. Hitting 16 is almost certain to bust — surrendering saves half your bet.',
  // 16 vs 9: Hit instead of surrendering at low TC
  'hard:16:9:lte':
    'Basic strategy says surrender, but at {tc}, hit instead. The deck is low-card-heavy, so hitting 16 is less likely to bust, and playing it out costs less than giving up half your bet.',
  // 16 vs 9: Stand at high TC (no-surrender games only)
  'hard:16:9:gte':
    'At {tc}, stand instead of hitting. The deck is rich in high cards — hitting 16 is almost certain to bust.',
  // 15 vs 9: Surrender at high TC
  'hard:15:9:gte':
    'Basic strategy says hit, but at {tc}, surrender. The dealer\'s 9 likely pairs with a 10 for 19. Your 15 can\'t beat that, and hitting risks busting. Surrendering cuts your losses.',
  // 15 vs 10: Hit instead of surrendering at low TC
  'hard:15:10:lte':
    'Basic strategy says surrender, but at {tc}, hit instead. With fewer high cards, hitting 15 is safer, and the dealer\'s 10 is less likely to have 20.',
  // 15 vs 10: Stand at high TC (no-surrender games only)
  'hard:15:10:gte':
    'At {tc}, stand instead of hitting. The high-card-rich deck makes busting on a hit very likely, and the dealer also risks busting when they draw.',
  // 15 vs A: Surrender at high TC (H17: TC >= -1; S17: TC >= +2), or stand in no-surrender games
  'hard:15:11:gte':
    'Basic strategy says hit, but at {tc}, don\'t risk it. Hitting 15 against the dealer\'s Ace is too likely to bust — cutting your losses is the better play.',
  // 14 vs 10: Surrender at high TC
  'hard:14:10:gte':
    'Basic strategy says hit, but at {tc}, surrender. The dealer likely has 20, and hitting 14 in a high-card deck almost certainly busts. Surrendering saves half your bet.',

  // ── Stand deviations (always apply) ──
  'hard:16:10:gte':
    'At {tc}, stand instead of hitting. The deck is rich in high cards — hitting 16 is very likely to bust. The dealer faces the same top-heavy deck when drawing.',
  'hard:16:11:gte':
    'At {tc}, stand instead of hitting. With so many high cards remaining, hitting 16 is too risky even against the dealer\'s Ace.',
  'hard:12:2:gte':
    'Basic strategy says hit, but at {tc}, stand. The excess of high cards means the dealer\'s 2 requires multiple draws with high bust probability. Don\'t risk busting your 12.',
  'hard:12:3:gte':
    'Basic strategy says hit, but at {tc}, stand. The positive count increases the dealer\'s bust chance with a 3 showing — let them take the risk.',

  // ── Hit deviations ──
  'hard:13:2:lte':
    'Basic strategy says stand, but at {tc}, hit. Fewer high cards means the dealer\'s 2 is less likely to bust. Hitting is also safer for you with more low cards remaining.',
  'hard:12:4:lte':
    'Basic strategy says stand, but at {tc}, hit. The dealer\'s 4 isn\'t busting as often as expected, and hitting 12 is safer with fewer high cards in the deck.',

  // ── Double deviations ──
  'hard:10:10:gte':
    'Basic strategy says hit, but at {tc}, double. You\'re very likely to draw a 10-value card for 20 — strong enough to justify the extra bet even against the dealer\'s 10.',
  'hard:10:11:gte':
    'Basic strategy says hit, but at {tc}, double. With so many high cards remaining, a probable 20 makes the extra bet profitable even against the dealer\'s Ace.',
  'hard:11:11:gte':
    'Basic strategy says hit in S17, but at {tc}, double. The high count means you\'re very likely to reach 21, making the extra bet worthwhile even against the dealer\'s Ace.',
  'hard:9:2:gte':
    'Basic strategy says hit, but at {tc}, double. The positive count gives you a strong chance of reaching 19, and the dealer\'s 2 forces multiple draws in this high-card deck.',
  'hard:9:7:gte':
    'Basic strategy says hit, but at {tc}, double. You\'re likely to reach 19, which beats the dealer\'s probable 17 — the extra bet is worthwhile.',
  'hard:8:6:gte':
    'Basic strategy says hit, but at {tc}, double. You have a good chance of reaching 18, and the dealer\'s 6 makes them very likely to bust in this high-card deck.',

  // ── Soft total deviations ──
  'soft:19:4:gte':
    'Basic strategy says stand, but at {tc}, double your soft 19. The high count makes reaching 20 very likely, and the dealer\'s weak 4 justifies the extra bet.',
  'soft:19:5:gte':
    'Basic strategy says stand, but at {tc}, double your soft 19. With a high count and the dealer\'s weak 5, the odds strongly favor maximizing your bet.',
  'soft:19:6:lte':
    'Basic strategy says double, but at {tc}, just stand. Without enough high cards, the double bet isn\'t justified — your soft 19 is already strong.',
  'soft:19:6:gte':
    'Basic strategy says stand, but at {tc}, double your soft 19. The count justifies the extra bet against the dealer\'s weakest upcard.',
  'soft:17:2:gte':
    'Basic strategy says hit, but at {tc}, double. The positive count gives your soft 17 a good chance of improving, and the dealer\'s 2 means high bust probability.',

  // ── Pair split deviations ──
  'pairs:10:4:gte':
    'Basic strategy says stand on 20, but at {tc}, split your 10s. Each 10 almost certainly draws another 10 for two hands of 20. Against the dealer\'s weak 4 in this 10-rich deck, two bets on probable 20s is hugely profitable.',
  'pairs:10:5:gte':
    'Basic strategy says stand on 20, but at {tc}, split your 10s. Two probable 20s against the dealer\'s 5 — with bust nearly certain for the dealer in this high-card deck.',
  'pairs:10:6:gte':
    'Basic strategy says stand on 20, but at {tc}, split your 10s. Two probable 20s against the dealer\'s weakest upcard in a 10-rich deck — the math strongly favors two bets.',
};

export function getDeviationExplanation(ctx: DeviationExplanationContext): string {
  const key = `${ctx.handType}:${ctx.playerTotal}:${ctx.dealerUpcard}:${ctx.direction}`;
  const tc = formatTC(ctx.threshold, ctx.direction, ctx.usesRunningCount);
  const template = DEVIATION_EXPLANATIONS[key];

  if (template) {
    return template.replace('{tc}', tc);
  }

  // Fallback for any unmapped deviation
  const dealerName = ctx.dealerUpcard === 11 ? 'Ace' : String(ctx.dealerUpcard);
  return `At ${tc}, this is the correct deviation play against a dealer ${dealerName}.`;
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

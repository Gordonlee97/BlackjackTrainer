import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, playDealerSteps } from '../gameStore';
import { useCountStore } from '../countStore';
import { DEFAULT_RULES } from '../../strategy/types';
import type { RuleSet } from '../../strategy/types';
import type { Card, HandState, Rank } from '../../engine/types';

const c = (rank: Rank, faceUp = true): Card => ({ suit: 'spades', rank, faceUp });

function hand(cards: Card[], extra: Partial<HandState> = {}): HandState {
  return { cards, bet: 100, isDoubled: false, isSplit: false, isComplete: false, ...extra };
}

function setup(rules: Partial<RuleSet>, state: Partial<ReturnType<typeof useGameStore.getState>>) {
  const fullRules = { ...DEFAULT_RULES, ...rules };
  useGameStore.getState().initGame(fullRules);
  useGameStore.setState({ rules: fullRules, ...state });
}

describe('gameStore — rule enforcement', () => {
  beforeEach(() => useCountStore.getState().resetCount());

  it('refunds half the bet on surrender', () => {
    setup({ surrenderAllowed: true }, {
      phase: 'player_turn',
      balance: 900, // 1000 minus the 100 bet
      playerHands: [hand([c('10'), c('6')])],
      dealerHand: hand([c('7', false), c('10')], { bet: 0 }),
      shoe: Array.from({ length: 50 }, () => c('2')),
    });
    useGameStore.getState().surrender();
    expect(useGameStore.getState().phase).toBe('dealer_turn');

    const steps = playDealerSteps(useGameStore.getState());
    const final = steps[steps.length - 1].state;
    expect(final.balance).toBe(950);
  });

  it('blocks doubling a split hand when DAS is off', () => {
    setup({ dasAllowed: false }, {
      phase: 'player_turn',
      playerHands: [hand([c('9'), c('2')], { isSplit: true }), hand([c('9'), c('5')], { isSplit: true })],
    });
    expect(useGameStore.getState().canDouble()).toBe(false);
  });

  it('allows doubling a split hand when DAS is on', () => {
    setup({ dasAllowed: true }, {
      phase: 'player_turn',
      playerHands: [hand([c('9'), c('2')], { isSplit: true }), hand([c('9'), c('5')], { isSplit: true })],
    });
    expect(useGameStore.getState().canDouble()).toBe(true);
  });

  it('blocks resplitting aces when resplitAces is off', () => {
    setup({ resplitAces: false, hitSplitAces: true }, {
      phase: 'player_turn',
      playerHands: [hand([c('A'), c('A')], { isSplit: true }), hand([c('A'), c('5')], { isSplit: true })],
    });
    expect(useGameStore.getState().canSplit()).toBe(false);
  });

  it('allows resplitting non-ace pairs regardless of resplitAces', () => {
    setup({ resplitAces: false }, {
      phase: 'player_turn',
      playerHands: [hand([c('8'), c('8')], { isSplit: true }), hand([c('8'), c('5')], { isSplit: true })],
    });
    expect(useGameStore.getState().canSplit()).toBe(true);
  });

  it('resets the running count when practice-mode filtering reshuffles the shoe', () => {
    // First 4 cards deal a non-pair, so 'splits' practice mode must reshuffle.
    const shoe = [c('2'), c('3'), c('4'), c('5'), ...Array.from({ length: 300 }, () => c('9'))];
    setup({ practiceMode: 'splits', numDecks: 6 }, { shoe, shoeSize: 312, currentBet: 25 });
    useCountStore.setState({ runningCount: 40 });
    useGameStore.getState().deal();
    // A fresh shoe has been dealt from; only the 3 face-up cards can be counted (|RC| <= 3).
    expect(Math.abs(useCountStore.getState().runningCount)).toBeLessThanOrEqual(3);
  });
});

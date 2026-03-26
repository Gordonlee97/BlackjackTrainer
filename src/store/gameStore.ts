import { create } from 'zustand';
import type { Card, GamePhase, GameState, HandState, HandResult } from '../engine/types';
import { createShoe, drawCard, needsReshuffle } from '../engine/shoe';
import { handValue, isBlackjack, isBust, isPair } from '../engine/hand';
import { settleHand, calculatePayout } from '../engine/payout';
import type { RuleSet } from '../strategy/types';

const INITIAL_BALANCE = 1000;
const DEFAULT_BET = 25;

interface GameStore extends GameState {
  rules: RuleSet | null;

  // Actions
  initGame: (rules: RuleSet) => void;
  placeBet: (amount: number) => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  surrender: () => void;
  newHand: () => void;

  // Helpers
  canDouble: () => boolean;
  canSplit: () => boolean;
  canSurrender: () => boolean;
  getActiveHand: () => HandState | null;
  getDealerUpcard: () => Card | null;
}

function createEmptyHand(bet: number): HandState {
  return { cards: [], bet, isDoubled: false, isSplit: false, isComplete: false };
}

function shouldFilterHand(hand: HandState, practiceMode: string): boolean {
  if (practiceMode === 'all') return false;
  const cards = hand.cards;
  if (cards.length !== 2) return false;

  const hv = handValue(cards);
  const hasPair = isPair(cards);

  switch (practiceMode) {
    case 'hard':
      return hv.isSoft || hasPair;
    case 'soft':
      return !hv.isSoft || hasPair;
    case 'splits':
      return !hasPair;
    default:
      return false;
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'betting',
  shoe: [],
  shoeSize: 0,
  dealerHand: createEmptyHand(0),
  playerHands: [createEmptyHand(DEFAULT_BET)],
  activeHandIndex: 0,
  balance: INITIAL_BALANCE,
  currentBet: DEFAULT_BET,
  dealerHoleCardRevealed: false,
  message: '',
  rules: null,

  initGame: (rules) => {
    const numCards = rules.numDecks * 52;
    const shoe = createShoe(rules.numDecks);
    set({
      rules,
      shoe,
      shoeSize: numCards,
      balance: INITIAL_BALANCE,
      phase: 'betting',
      message: 'Place your bet',
    });
  },

  placeBet: (amount) => {
    const { balance } = get();
    if (amount > balance) return;
    set({ currentBet: amount, message: '' });
  },

  deal: () => {
    const state = get();
    if (state.phase !== 'betting') return;
    const { currentBet, balance, rules } = state;
    if (!rules || currentBet > balance) return;

    let shoe = [...state.shoe];
    const shoeSize = state.shoeSize;

    // Check if reshuffle needed
    if (needsReshuffle(shoe, shoeSize)) {
      shoe = createShoe(rules.numDecks);
    }

    // Deal with practice mode filtering - retry up to 50 times
    let playerCards: Card[] = [];
    let dealerCards: Card[] = [];
    let attempts = 0;

    do {
      let tempShoe = [...shoe];
      let result;

      result = drawCard(tempShoe);
      const p1 = result.card;
      tempShoe = result.shoe;

      result = drawCard(tempShoe, false); // Dealer hole card face down
      const d1 = { ...result.card, faceUp: false };
      tempShoe = result.shoe;

      result = drawCard(tempShoe);
      const p2 = result.card;
      tempShoe = result.shoe;

      result = drawCard(tempShoe);
      const d2 = result.card;
      tempShoe = result.shoe;

      playerCards = [p1, p2];
      dealerCards = [d1, d2];

      const testHand: HandState = { cards: playerCards, bet: currentBet, isDoubled: false, isSplit: false, isComplete: false };
      if (!shouldFilterHand(testHand, rules.practiceMode)) {
        shoe = tempShoe;
        break;
      }

      // Reshuffle and try again
      attempts++;
      if (attempts >= 50) {
        shoe = tempShoe;
        break;
      }
      shoe = createShoe(rules.numDecks);
    } while (true);

    const playerHand: HandState = {
      cards: playerCards,
      bet: currentBet,
      isDoubled: false,
      isSplit: false,
      isComplete: false,
    };

    const dealerHand: HandState = {
      cards: dealerCards,
      bet: 0,
      isDoubled: false,
      isSplit: false,
      isComplete: false,
    };

    const newBalance = balance - currentBet;

    // Check for dealer blackjack (peek)
    const dealerHasNatural = isBlackjack(dealerCards);
    const playerHasNatural = isBlackjack(playerCards);

    if (dealerHasNatural || playerHasNatural) {
      // Reveal dealer hole card
      dealerHand.cards = dealerHand.cards.map(c => ({ ...c, faceUp: true }));

      let result: HandResult;
      if (playerHasNatural && dealerHasNatural) {
        result = 'push';
      } else if (playerHasNatural) {
        result = 'blackjack';
      } else {
        result = 'lose';
      }

      playerHand.isComplete = true;
      playerHand.result = result;
      dealerHand.isComplete = true;

      const payout = calculatePayout(playerHand);

      set({
        shoe,
        dealerHand,
        playerHands: [playerHand],
        activeHandIndex: 0,
        balance: newBalance + currentBet + payout,
        phase: 'complete',
        dealerHoleCardRevealed: true,
        message: result === 'blackjack' ? 'Blackjack! You win!' :
                 result === 'push' ? 'Push - both have Blackjack' :
                 'Dealer has Blackjack',
      });
      return;
    }

    set({
      shoe,
      dealerHand,
      playerHands: [playerHand],
      activeHandIndex: 0,
      balance: newBalance,
      phase: 'player_turn',
      dealerHoleCardRevealed: false,
      message: '',
    });
  },

  hit: () => {
    const state = get();
    if (state.phase !== 'player_turn') return;

    const hand = { ...state.playerHands[state.activeHandIndex] };
    const { card, shoe } = drawCard(state.shoe);
    hand.cards = [...hand.cards, card];

    if (isBust(hand.cards)) {
      hand.isComplete = true;
      hand.result = 'lose';
    } else if (handValue(hand.cards).total === 21) {
      hand.isComplete = true;
    }

    const playerHands = [...state.playerHands];
    playerHands[state.activeHandIndex] = hand;

    let newState: Partial<GameStore> = { shoe, playerHands };

    if (hand.isComplete) {
      newState = { ...newState, ...advanceToNextHand(playerHands) };
    }

    set(newState);
  },

  stand: () => {
    const state = get();
    if (state.phase !== 'player_turn') return;

    const playerHands = [...state.playerHands];
    playerHands[state.activeHandIndex] = {
      ...playerHands[state.activeHandIndex],
      isComplete: true,
    };

    set({ playerHands, ...advanceToNextHand(playerHands) });
  },

  double: () => {
    const state = get();
    if (state.phase !== 'player_turn' || !get().canDouble()) return;

    const hand = { ...state.playerHands[state.activeHandIndex] };
    const { card, shoe } = drawCard(state.shoe);
    hand.cards = [...hand.cards, card];
    hand.isDoubled = true;
    hand.isComplete = true;

    if (isBust(hand.cards)) {
      hand.result = 'lose';
    }

    const playerHands = [...state.playerHands];
    playerHands[state.activeHandIndex] = hand;

    const balance = state.balance - hand.bet; // Deduct additional bet

    set({
      shoe,
      playerHands,
      balance,
      ...advanceToNextHand(playerHands),
    });
  },

  split: () => {
    const state = get();
    if (state.phase !== 'player_turn' || !get().canSplit()) return;

    const hand = state.playerHands[state.activeHandIndex];
    const [card1, card2] = hand.cards;

    let shoe = state.shoe;

    // Create two new hands
    let result = drawCard(shoe);
    const newCard1 = result.card;
    shoe = result.shoe;

    result = drawCard(shoe);
    const newCard2 = result.card;
    shoe = result.shoe;

    const isAceSplit = card1.rank === 'A';
    const hand1: HandState = {
      cards: [card1, newCard1],
      bet: hand.bet,
      isDoubled: false,
      isSplit: true,
      isComplete: isAceSplit && !state.rules?.hitSplitAces,
    };

    const hand2: HandState = {
      cards: [card2, newCard2],
      bet: hand.bet,
      isDoubled: false,
      isSplit: true,
      isComplete: isAceSplit && !state.rules?.hitSplitAces,
    };

    const playerHands = [...state.playerHands];
    playerHands.splice(state.activeHandIndex, 1, hand1, hand2);

    const balance = state.balance - hand.bet; // Deduct bet for second hand

    let newState: Partial<GameStore> = {
      shoe,
      playerHands,
      balance,
    };

    // If aces split with no hit allowed, advance
    if (hand1.isComplete) {
      newState = { ...newState, ...advanceToNextHand(playerHands) };
    }

    set(newState);
  },

  surrender: () => {
    const state = get();
    if (state.phase !== 'player_turn' || !get().canSurrender()) return;

    const playerHands = [...state.playerHands];
    playerHands[state.activeHandIndex] = {
      ...playerHands[state.activeHandIndex],
      isComplete: true,
      result: 'surrender',
    };

    set({ playerHands, ...advanceToNextHand(playerHands) });
  },

  newHand: () => {
    const state = get();
    if (state.phase !== 'complete') return;

    set({
      phase: 'betting',
      dealerHand: createEmptyHand(0),
      playerHands: [createEmptyHand(state.currentBet)],
      activeHandIndex: 0,
      dealerHoleCardRevealed: false,
      message: 'Place your bet',
    });
  },

  canDouble: () => {
    const state = get();
    const hand = state.playerHands[state.activeHandIndex];
    if (!hand) return false;
    return hand.cards.length === 2 && state.balance >= hand.bet;
  },

  canSplit: () => {
    const state = get();
    const hand = state.playerHands[state.activeHandIndex];
    if (!hand) return false;
    return (
      isPair(hand.cards) &&
      hand.cards.length === 2 &&
      state.playerHands.length < 4 &&
      state.balance >= hand.bet
    );
  },

  canSurrender: () => {
    const state = get();
    if (!state.rules?.surrenderAllowed) return false;
    const hand = state.playerHands[state.activeHandIndex];
    if (!hand) return false;
    return hand.cards.length === 2 && !hand.isSplit;
  },

  getActiveHand: () => {
    const state = get();
    return state.playerHands[state.activeHandIndex] ?? null;
  },

  getDealerUpcard: () => {
    const state = get();
    // The second card (index 1) is the upcard (first dealt face-up to dealer)
    return state.dealerHand.cards[1] ?? null;
  },
}));

function advanceToNextHand(
  playerHands: HandState[]
): Partial<GameStore> {
  // Find next incomplete hand
  for (let i = 0; i < playerHands.length; i++) {
    if (!playerHands[i].isComplete) {
      return { activeHandIndex: i };
    }
  }

  // All hands complete - dealer's turn
  return { phase: 'dealer_turn' as GamePhase };
}

// Dealer play logic - called from component after phase changes to dealer_turn
export function playDealer(store: GameStore): Partial<GameStore> {
  let shoe = [...store.shoe];
  const dealerHand = { ...store.dealerHand };
  dealerHand.cards = dealerHand.cards.map(c => ({ ...c, faceUp: true }));

  const rules = store.rules!;

  // Check if all player hands busted or surrendered
  const allBustedOrSurrendered = store.playerHands.every(
    h => h.result === 'lose' || h.result === 'surrender'
  );

  if (!allBustedOrSurrendered) {
    // Dealer draws
    while (true) {
      const hv = handValue(dealerHand.cards);
      if (hv.total > 17) break;
      if (hv.total === 17 && (!hv.isSoft || !rules.dealerHitsSoft17)) break;

      const result = drawCard(shoe);
      dealerHand.cards = [...dealerHand.cards, result.card];
      shoe = result.shoe;
    }
  }

  dealerHand.isComplete = true;
  const dealerHasBlackjack = isBlackjack(store.dealerHand.cards);

  // Settle all hands
  const playerHands = store.playerHands.map(hand => {
    if (hand.result) return hand; // Already settled (bust/surrender)
    const result = settleHand(hand, dealerHand.cards, dealerHasBlackjack);
    return { ...hand, result };
  });

  // Calculate total payout
  let totalPayout = 0;
  for (const hand of playerHands) {
    const payout = calculatePayout(hand);
    const bet = hand.isDoubled ? hand.bet * 2 : hand.bet;
    // Return bet + winnings for non-losing hands
    if (payout >= 0) {
      totalPayout += bet + payout;
    }
  }

  const dealerTotal = handValue(dealerHand.cards).total;
  const dealerBusted = isBust(dealerHand.cards);

  let message = '';
  if (dealerBusted) {
    message = `Dealer busts with ${dealerTotal}!`;
  } else {
    message = `Dealer has ${dealerTotal}`;
  }

  return {
    shoe,
    dealerHand,
    playerHands,
    balance: store.balance + totalPayout,
    phase: 'complete',
    dealerHoleCardRevealed: true,
    message,
  };
}

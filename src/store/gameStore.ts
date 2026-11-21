import { create } from 'zustand';
import type { Card, GameState, HandState } from '../engine/types';
import { createShoe, drawCard, needsReshuffle } from '../engine/shoe';
import { handValue, isBlackjack, isBust, isPair } from '../engine/hand';
import { settleHand, calculatePayout, handStake } from '../engine/payout';
import type { RuleSet } from '../strategy/types';
import { useCountStore } from './countStore';
import { generate as generateDrill } from '../strategy/deviationDrill';
import { computeTrueCount } from '../engine/counting';
import type { Deviation } from '../strategy/deviations';

const INITIAL_BALANCE = 1000;
const DEFAULT_BET = 25;
const MAX_HANDS = 4;
const MAX_PRACTICE_REDEALS = 50;

export interface NaturalInfo {
  dealerHasNatural: boolean;
  playerHasNatural: boolean;
}

interface GameStore extends GameState {
  rules: RuleSet | null;
  pendingNatural: NaturalInfo | null;

  // Actions
  initGame: (rules: RuleSet) => void;
  placeBet: (amount: number) => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  dealToSplitHand: (handIndex: number) => void;
  surrender: () => void;
  newHand: () => void;
  rebuy: (amount: number) => void;

  currentDeviation: Deviation | null;
  betSnapshotTC: number | null;

  // Helpers
  canHit: () => boolean;
  canDouble: () => boolean;
  canSplit: () => boolean;
  canSurrender: () => boolean;
  getActiveHand: () => HandState | null;
  getDealerUpcard: () => Card | null;
}

function createEmptyHand(bet: number): HandState {
  return { cards: [], bet, isDoubled: false, isSplit: false, isComplete: false };
}

function shouldFilterHand(cards: Card[], practiceMode: RuleSet['practiceMode']): boolean {
  if (practiceMode === 'all') return false;

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

/** Deals in casino order: player, dealer hole (face down), player, dealer upcard. */
function dealInitialCards(shoe: Card[]): { playerCards: Card[]; dealerCards: Card[]; shoe: Card[] } {
  const p1 = drawCard(shoe);
  const hole = drawCard(p1.shoe, false);
  const p2 = drawCard(hole.shoe);
  const up = drawCard(p2.shoe);
  return {
    playerCards: [p1.card, p2.card],
    dealerCards: [hole.card, up.card],
    shoe: up.shoe,
  };
}

function applyDrillSeed(rules: RuleSet): {
  shoe: Card[];
  shoeSize: number;
  preSeedRC: number;
  currentDeviation: Deviation;
} | null {
  if (!rules.deviationsPracticeMode) return null;
  if (rules.numDecks < 4) return null;
  const drill = generateDrill(rules);
  return {
    shoe: drill.shoe,
    shoeSize: drill.shoe.length,
    preSeedRC: drill.preSeedRC,
    currentDeviation: drill.deviation,
  };
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
  pendingNatural: null,
  currentDeviation: null,
  betSnapshotTC: null,

  initGame: (rules) => {
    const drill = applyDrillSeed(rules);
    const numCards = rules.numDecks * 52;
    const shoe = drill?.shoe ?? createShoe(rules.numDecks);
    const shoeSize = drill?.shoeSize ?? numCards;
    set({
      rules,
      shoe,
      shoeSize,
      balance: INITIAL_BALANCE,
      phase: 'betting',
      message: 'Place your bet',
      dealerHand: createEmptyHand(0),
      playerHands: [createEmptyHand(DEFAULT_BET)],
      activeHandIndex: 0,
      dealerHoleCardRevealed: false,
      pendingNatural: null,
      currentDeviation: drill?.currentDeviation ?? null,
      betSnapshotTC: null,
    });
    useCountStore.getState().resetCount();
    if (drill) {
      useCountStore.setState({ runningCount: drill.preSeedRC });
    }
  },

  placeBet: (amount) => {
    const { balance } = get();
    if (amount > balance) return;
    set({ currentBet: amount });
  },

  deal: () => {
    const state = get();
    if (state.phase !== 'betting') return;
    const { currentBet, balance, rules } = state;
    if (!rules || currentBet > balance) return;

    let shoe = state.shoe;
    const shoeSize = state.shoeSize;

    const preDealCardsDealt = state.shoeSize - state.shoe.length;
    const preDealTC = computeTrueCount(
      useCountStore.getState().runningCount,
      state.shoeSize,
      preDealCardsDealt,
    );
    set({ betSnapshotTC: preDealTC });

    // Check if reshuffle needed
    if (!rules.deviationsPracticeMode && needsReshuffle(shoe, shoeSize)) {
      shoe = createShoe(rules.numDecks);
      useCountStore.getState().resetCount();
    }

    let { playerCards, dealerCards, shoe: dealtShoe } = dealInitialCards(shoe);

    // Practice modes (hard/soft/splits) redeal from a fresh shoe until the hand matches.
    // Drill mode uses a seeded shoe and must never be filtered or reshuffled.
    if (!rules.deviationsPracticeMode) {
      for (let attempt = 0; attempt < MAX_PRACTICE_REDEALS && shouldFilterHand(playerCards, rules.practiceMode); attempt++) {
        shoe = createShoe(rules.numDecks);
        useCountStore.getState().resetCount();
        ({ playerCards, dealerCards, shoe: dealtShoe } = dealInitialCards(shoe));
      }
    }
    shoe = dealtShoe;

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

    // Check for naturals
    const dealerHasNatural = isBlackjack(dealerCards);
    const playerHasNatural = isBlackjack(playerCards);

    const pendingNatural = dealerHasNatural || playerHasNatural
      ? { dealerHasNatural, playerHasNatural }
      : null;

    set({
      shoe,
      dealerHand,
      playerHands: [playerHand],
      activeHandIndex: 0,
      balance: newBalance,
      // With a natural, cards deal normally (hole face down); GameTable then runs the reveal.
      phase: pendingNatural ? 'dealing' : 'player_turn',
      dealerHoleCardRevealed: false,
      message: '',
      pendingNatural,
    });
    // Count the 3 face-up cards; the hole card is counted when revealed.
    useCountStore.getState().updateCount([playerCards[0], playerCards[1], dealerCards[1]]);
  },

  hit: () => {
    const state = get();
    if (state.phase !== 'player_turn' || !state.canHit()) return;

    const hand = { ...state.playerHands[state.activeHandIndex] };
    const { card, shoe } = drawCard(state.shoe);
    hand.cards = [...hand.cards, card];
    useCountStore.getState().updateCount([card]);

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
    useCountStore.getState().updateCount([card]);
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

    // Step 1: Separate into two 1-card hands (no new cards yet)
    const hand1: HandState = {
      cards: [card1],
      bet: hand.bet,
      isDoubled: false,
      isSplit: true,
      isComplete: false,
    };

    const hand2: HandState = {
      cards: [card2],
      bet: hand.bet,
      isDoubled: false,
      isSplit: true,
      isComplete: false,
    };

    const playerHands = [...state.playerHands];
    playerHands.splice(state.activeHandIndex, 1, hand1, hand2);

    const balance = state.balance - hand.bet; // Deduct bet for second hand

    set({
      playerHands,
      balance,
      // Phase stays 'player_turn'; GameTable sees the 1-card split hands and animates their deals
    });
  },

  // Deal one card to a specific hand (used for animated split deals)
  dealToSplitHand: (handIndex: number) => {
    const state = get();
    const hand = state.playerHands[handIndex];
    if (!hand || hand.cards.length !== 1) return;

    const { card, shoe } = drawCard(state.shoe);
    useCountStore.getState().updateCount([card]);

    // Split aces get one card each unless hitSplitAces is on. The only further
    // action is a resplit, so the hand finishes unless that resplit is possible.
    const isAceSplit = hand.cards[0].rank === 'A';
    const canResplit =
      isAceSplit &&
      card.rank === 'A' &&
      !!state.rules?.resplitAces &&
      state.playerHands.length < MAX_HANDS &&
      state.balance >= hand.bet;
    const updatedHand: HandState = {
      ...hand,
      cards: [...hand.cards, card],
      isComplete: isAceSplit && !state.rules?.hitSplitAces && !canResplit,
    };

    const playerHands = [...state.playerHands];
    playerHands[handIndex] = updatedHand;

    let newState: Partial<GameStore> = { shoe, playerHands };

    // After dealing to the last split hand, check if all aces auto-complete
    const allSplitHandsDealt = playerHands.every(h => h.cards.length >= 2);
    if (allSplitHandsDealt) {
      const allComplete = playerHands.every(h => h.isComplete);
      if (allComplete) {
        newState = { ...newState, ...advanceToNextHand(playerHands) };
      } else {
        // Set active hand to the first incomplete hand (always start from 0)
        for (let i = 0; i < playerHands.length; i++) {
          if (!playerHands[i].isComplete) {
            newState = { ...newState, activeHandIndex: i };
            break;
          }
        }
      }
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

    const rules = state.rules!;
    const drill = applyDrillSeed(rules);

    const patch: Partial<GameStore> = {
      phase: 'betting',
      dealerHand: createEmptyHand(0),
      playerHands: [createEmptyHand(state.currentBet)],
      activeHandIndex: 0,
      dealerHoleCardRevealed: false,
      message: 'Place your bet',
      pendingNatural: null,
      currentDeviation: drill?.currentDeviation ?? null,
      betSnapshotTC: null,
    };

    if (drill) {
      patch.shoe = drill.shoe;
      patch.shoeSize = drill.shoeSize;
      useCountStore.setState({ runningCount: drill.preSeedRC });
    }

    set(patch);
  },

  rebuy: (amount: number) => {
    set((state) => ({ balance: state.balance + amount }));
  },

  canHit: () => {
    const state = get();
    const hand = state.playerHands[state.activeHandIndex];
    if (!hand) return false;
    return !isLockedSplitAce(hand, state.rules);
  },

  canDouble: () => {
    const state = get();
    const hand = state.playerHands[state.activeHandIndex];
    if (!hand || hand.cards.length !== 2 || state.balance < hand.bet) return false;
    if (isLockedSplitAce(hand, state.rules)) return false;
    return !hand.isSplit || !!state.rules?.dasAllowed;
  },

  canSplit: () => {
    const state = get();
    const hand = state.playerHands[state.activeHandIndex];
    if (!hand || !isPair(hand.cards)) return false;
    if (state.playerHands.length >= MAX_HANDS || state.balance < hand.bet) return false;
    const isAces = hand.cards[0].rank === 'A';
    return !(hand.isSplit && isAces && !state.rules?.resplitAces);
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

/** A split-ace hand that may not draw (hitSplitAces off): it can only stand or resplit. */
function isLockedSplitAce(hand: HandState, rules: RuleSet | null): boolean {
  return hand.isSplit && hand.cards[0]?.rank === 'A' && !rules?.hitSplitAces;
}

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
  return { phase: 'dealer_turn' };
}

// A single step in the dealer play sequence
export interface DealerStep {
  state: Partial<GameStore>;
  countCards: Card[]; // Cards to count at this step
}

// Dealer play logic — returns steps to apply sequentially for smooth animation
export function playDealerSteps(store: GameStore): DealerStep[] {
  const steps: DealerStep[] = [];
  let shoe = [...store.shoe];
  let currentCards = store.dealerHand.cards.map(c => ({ ...c, faceUp: true }));

  const rules = store.rules!;

  // Step 1: Reveal hole card
  steps.push({
    state: {
      dealerHoleCardRevealed: true,
      dealerHand: { ...store.dealerHand, cards: [...currentCards] },
    },
    countCards: [store.dealerHand.cards[0]], // Count the hole card
  });

  // Check if all player hands busted or surrendered
  const allBustedOrSurrendered = store.playerHands.every(
    h => h.result === 'lose' || h.result === 'surrender'
  );

  if (!allBustedOrSurrendered) {
    // Draw cards one at a time
    while (true) {
      const hv = handValue(currentCards);
      if (hv.total > 17) break;
      if (hv.total === 17 && (!hv.isSoft || !rules.dealerHitsSoft17)) break;

      const result = drawCard(shoe);
      currentCards = [...currentCards, result.card];
      shoe = result.shoe;

      steps.push({
        state: {
          dealerHand: { ...store.dealerHand, cards: [...currentCards] },
          shoe: [...shoe],
        },
        countCards: [result.card], // Count this drawn card
      });
    }
  }

  // Final step: settle hands
  const finalDealerHand: HandState = {
    ...store.dealerHand,
    cards: currentCards,
    isComplete: true,
  };
  const dealerHasBlackjack = isBlackjack(store.dealerHand.cards);

  const playerHands = store.playerHands.map(hand => {
    if (hand.result) return hand;
    const result = settleHand(hand, currentCards, dealerHasBlackjack);
    return { ...hand, result };
  });

  // Stakes were deducted when placed, so return stake + net payout for every hand
  // (lose → 0, surrender → half stake, push → stake, win → 2× stake, ...).
  let totalReturned = 0;
  for (const hand of playerHands) {
    totalReturned += handStake(hand) + calculatePayout(hand);
  }

  const dealerTotal = handValue(currentCards).total;
  const dealerBusted = isBust(currentCards);

  steps.push({
    state: {
      shoe,
      dealerHand: finalDealerHand,
      playerHands,
      balance: store.balance + totalReturned,
      phase: 'complete',
      dealerHoleCardRevealed: true,
      message: dealerBusted
        ? `Dealer busts with ${dealerTotal}!`
        : `Dealer has ${dealerTotal}`,
    },
    countCards: [],
  });

  return steps;
}

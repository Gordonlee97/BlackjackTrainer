import { useEffect, useCallback, useState, useRef } from 'react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, playDealerSteps } from '../../store/gameStore';
import { calculatePayout } from '../../engine/payout';
import { useCountStore } from '../../store/countStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useStatsStore } from '../../store/statsStore';
import type { StrategyAdvice } from '../../strategy/advisor';
import { getCorrectAction } from '../../strategy/advisor';
import { buildStrategy } from '../../strategy/charts';
import type { FinalAction, FullStrategy } from '../../strategy/types';
import type { HandState } from '../../engine/types';
import { playWin, playBlackjack, playLose, playPush, playCardSlide, playButtonPress, playNextHand, playLockIn, playSweep, setMasterVolume } from '../../engine/sounds';
import DealerHand from './DealerHand';
import PlayerHand from './PlayerHand';
import ActionButtons from './ActionButtons';
import BetControls from './BetControls';
import StatsPanel from '../feedback/StatsPanel';
import StrategyModal from '../feedback/StrategyModal';
import StrategyChartModal from '../feedback/StrategyChartModal';
import SettingsModal from './SettingsModal';
import RunningCount from './RunningCount';

interface GameTableProps {
  onBackToMenu: () => void;
}

function pickResultSound(hands: HandState[]) {
  const results = hands.map(h => h.result);
  if (results.includes('blackjack')) return playBlackjack;
  if (results.includes('win')  && !results.includes('lose')) return playWin;
  if (results.includes('lose') && !results.includes('win'))  return playLose;
  if (results.every(r => r === 'push'))                      return playPush;
  return playPush;
}

const controlVariants = {
  enter: { opacity: 0, y: 16, scale: 0.95 },
  show:  { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring' as const, damping: 22, stiffness: 260 } },
  exit:  { opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.15 } },
};

export default function GameTable({ onBackToMenu }: GameTableProps) {
  const game = useGameStore();
  const { rules } = useSettingsStore();
  const stats = useStatsStore();
  const strategyRef = useRef<FullStrategy | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settleBounce, setSettleBounce] = useState(false);
  const [correctFlash, setCorrectFlash] = useState(false);
  const [modalData, setModalData] = useState<{
    playerAction: FinalAction;
    advice: StrategyAdvice;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pendingWrongAction, setPendingWrongAction] = useState<(() => void) | null>(null);

  const splitAnimatingRef = useRef(false);
  const recordedDecisionRef = useRef<string | null>(null);
  const [actionResetKey, setActionResetKey] = useState(0);
  const animatedBalance = useAnimatedNumber(game.balance);

  // Juice states
  const [lockedIn, setLockedIn] = useState(false);
  const [dealerSuspense, setDealerSuspense] = useState(false);
  const [resultPayoff, setResultPayoff] = useState<'win' | 'blackjack' | 'lose' | 'push' | null>(null);
  const [sweepingCards, setSweepingCards] = useState(false);
  const [goldVignette, setGoldVignette] = useState(false);

  // Sync volume setting
  useEffect(() => { setMasterVolume(rules.soundVolume / 100); }, [rules.soundVolume]);

  useEffect(() => { strategyRef.current = buildStrategy(rules); }, [rules]);
  useEffect(() => { game.initGame(rules); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync settings changes to gameStore so deal() uses latest practiceMode, etc.
  useEffect(() => { useGameStore.setState({ rules }); }, [rules]);

  // Animated split — detect 1-card split hands and deal to them sequentially
  const splitHandCount = game.playerHands.length;
  useEffect(() => {
    if (game.phase !== 'player_turn') {
      splitAnimatingRef.current = false;
      return;
    }

    // Find split hands that only have 1 card (need their second card dealt)
    const hands = useGameStore.getState().playerHands;
    const pendingIndices = hands
      .map((h, i) => (h.isSplit && h.cards.length === 1 ? i : -1))
      .filter(i => i !== -1);

    if (pendingIndices.length === 0) {
      splitAnimatingRef.current = false;
      return;
    }

    splitAnimatingRef.current = true;

    // Schedule all deals + final unlock in one batch, no cleanup cancellation
    pendingIndices.forEach((handIndex, i) => {
      setTimeout(() => {
        useGameStore.getState().dealToSplitHand(handIndex);
        playCardSlide();
      }, (i + 1) * 600);
    });

    setTimeout(() => {
      splitAnimatingRef.current = false;
      // Force a re-render so buttons pick up the change
      useGameStore.setState({});
    }, (pendingIndices.length + 1) * 600);

  }, [splitHandCount, game.phase]);

  // Dealer play — with suspense: lock-in pause → reveal → escalating draws → settle
  useEffect(() => {
    if (game.phase === 'dealer_turn') {
      const steps = playDealerSteps(game);
      const timers: ReturnType<typeof setTimeout>[] = [];

      // Lock-in pause before dealer starts (500ms breath)
      const LOCK_IN_PAUSE = 350;
      // Delay before hole card flip after lock-in
      const REVEAL_DELAY = 150;
      // Base draw interval, escalates per card
      const BASE_DRAW = 550;
      const DRAW_ESCALATION = 80;
      const MAX_DRAW = 800;
      const SETTLE_DELAY = 450;

      let delay = LOCK_IN_PAUSE + REVEAL_DELAY;

      // Start dealer suspense visuals after lock-in pause
      timers.push(setTimeout(() => {
        setDealerSuspense(true);
      }, LOCK_IN_PAUSE));

      steps.forEach((step, i) => {
        const isLast = i === steps.length - 1;

        timers.push(setTimeout(() => {
          useGameStore.setState(step.state);
          if (step.countCards.length > 0) {
            useCountStore.getState().updateCount(step.countCards);
          }
          if (!isLast) playCardSlide();

          // Stop tension and resolve on final step
          if (isLast) {
            setDealerSuspense(false);
          }
        }, delay));

        if (!isLast) {
          if (i === 0) {
            delay += BASE_DRAW;
          } else if (i === steps.length - 2) {
            delay += SETTLE_DELAY;
          } else {
            const drawTime = Math.min(BASE_DRAW + i * DRAW_ESCALATION, MAX_DRAW);
            delay += drawTime;
          }
        }
      });

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats + sound + result payoff on complete
  useEffect(() => {
    if (game.phase === 'complete') {
      stats.recordHandPlayed();
      const results = game.playerHands.map(h => h.result);
      const hasBlackjack = results.includes('blackjack');
      const hasWin = results.includes('win');
      const hasLose = results.includes('lose') && !hasWin && !hasBlackjack;

      // Determine payoff state
      if (hasBlackjack) {
        setResultPayoff('blackjack');
        setGoldVignette(true);
        setTimeout(() => setGoldVignette(false), 600);
      } else if (hasWin) {
        setResultPayoff('win');
      } else if (hasLose) {
        setResultPayoff('lose');
      } else {
        setResultPayoff('push');
      }

      const t = setTimeout(() => pickResultSound(game.playerHands)(), 100);
      return () => clearTimeout(t);
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deal sound — card slide per card (4 cards, 150ms stagger matching card animation)
  useEffect(() => {
    if (game.phase === 'dealing') {
      const timers = [0, 150, 300, 450].map((d) =>
        setTimeout(() => playCardSlide(), d)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [game.phase]);

  // Settle bounce — fires once when dealing completes and player_turn begins
  useEffect(() => {
    if (game.phase === 'player_turn') {
      setSettleBounce(true);
      recordedDecisionRef.current = null;
      const timer = setTimeout(() => setSettleBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [game.phase]);

  // Lock-in effect — when player turn ends and dealer begins
  useEffect(() => {
    if (game.phase === 'dealer_turn') {
      setLockedIn(true);
      playLockIn();
    } else if (game.phase === 'betting') {
      setLockedIn(false);
      setResultPayoff(null);
      setDealerSuspense(false);
      setGoldVignette(false);
    }
  }, [game.phase]);

  // Dramatic natural reveal — cards deal normally, then hole card flips, then settle
  useEffect(() => {
    if (game.phase !== 'dealing' || !game.pendingNatural) return;

    const { dealerHasNatural, playerHasNatural } = game.pendingNatural;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Step 1: Wait for deal animation to land, then reveal hole card
    timers.push(setTimeout(() => {
      const s = useGameStore.getState();
      const revealedCards = s.dealerHand.cards.map(c => ({ ...c, faceUp: true }));
      useGameStore.setState({
        dealerHoleCardRevealed: true,
        dealerHand: { ...s.dealerHand, cards: revealedCards },
      });
      // Count the hole card
      useCountStore.getState().updateCount([s.dealerHand.cards[0]]);
    }, 1200));

    // Step 2: Settle the hand after the flip animation plays
    timers.push(setTimeout(() => {
      const s = useGameStore.getState();

      let result: 'blackjack' | 'push' | 'lose';
      if (playerHasNatural && dealerHasNatural) {
        result = 'push';
      } else if (playerHasNatural) {
        result = 'blackjack';
      } else {
        result = 'lose';
      }

      const settledPlayer = {
        ...s.playerHands[0],
        isComplete: true,
        result,
      };
      const settledDealer = { ...s.dealerHand, isComplete: true };
      const payout = calculatePayout(settledPlayer);

      useGameStore.setState({
        playerHands: [settledPlayer],
        dealerHand: settledDealer,
        balance: s.balance + s.currentBet + payout,
        phase: 'complete',
        pendingNatural: null,
        message: result === 'blackjack' ? 'Blackjack! You win!' :
                 result === 'push' ? 'Push — both have Blackjack' :
                 'Dealer has Blackjack',
      });
    }, 2000));

    return () => timers.forEach(clearTimeout);
  }, [game.phase, game.pendingNatural]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (game.phase !== 'player_turn' || modalOpen || splitAnimatingRef.current) return;
      switch (e.key.toLowerCase()) {
        case 'h': handlePlayerAction('HIT', game.hit); break;
        case 's': handlePlayerAction('STAND', game.stand); break;
        case 'd': if (game.canDouble())    handlePlayerAction('DOUBLE',    game.double);    break;
        case 'p': if (game.canSplit())     handlePlayerAction('SPLIT',     game.split);     break;
        case 'r': if (game.canSurrender()) handlePlayerAction('SURRENDER', game.surrender); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [game.phase, modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkStrategy = useCallback((): StrategyAdvice | null => {
    const hand = game.getActiveHand();
    const upcard = game.getDealerUpcard();
    if (!hand || !upcard || !strategyRef.current) return null;
    return getCorrectAction(hand.cards, upcard, rules, game.canDouble(), game.canSplit(), game.canSurrender(), strategyRef.current);
  }, [game, rules]);

  const handlePlayerAction = useCallback((action: FinalAction, executeAction: () => void) => {
    const advice = checkStrategy();
    if (!advice) { executeAction(); return; }

    const isCorrect = advice.correctAction === action;
    // Only record stats once per decision point — skip duplicate wrong attempts via "Try Again"
    const decisionKey = `${game.activeHandIndex}-${game.getActiveHand()?.cards.length}`;
    const alreadyRecorded = recordedDecisionRef.current === decisionKey;
    if (!alreadyRecorded) {
      stats.recordDecision(isCorrect);
      if (!isCorrect) recordedDecisionRef.current = decisionKey;
    }

    if (isCorrect) {
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 400);
      playButtonPress();
      if (action === 'HIT' || action === 'DOUBLE') setTimeout(() => playCardSlide(), 50);
      executeAction();
    } else {
      setModalData({ playerAction: action, advice });
      if (rules.wrongMoveAction === 'block') {
        // Block mode: show modal, save wrong action for "Play Anyways" option.
        // User can try again or choose to play their original move.
        setPendingWrongAction(() => executeAction);
        setModalOpen(true);
      } else {
        // Feedback mode: show modal, execute correct action on dismiss.
        setPendingAction(() => getActionExecutor(advice.correctAction));
        setModalOpen(true);
      }
    }
  }, [checkStrategy, rules.wrongMoveAction, stats]); // eslint-disable-line react-hooks/exhaustive-deps

  const getActionExecutor = useCallback((action: FinalAction): () => void => {
    switch (action) {
      case 'HIT':       return game.hit;
      case 'STAND':     return game.stand;
      case 'DOUBLE':    return game.double;
      case 'SPLIT':     return game.split;
      case 'SURRENDER': return game.surrender;
    }
  }, [game]);

  const handleModalClose = () => {
    if (pendingAction) pendingAction();
    else setActionResetKey(k => k + 1); // Block mode: reset button hover states
    setModalOpen(false); setModalData(null); setPendingAction(null); setPendingWrongAction(null);
  };
  const handleForceCorrect = () => { handleModalClose(); };
  const handlePlayAnyways = () => {
    if (pendingWrongAction) pendingWrongAction();
    setActionResetKey(k => k + 1);
    setModalOpen(false); setModalData(null); setPendingAction(null); setPendingWrongAction(null);
  };

  const shoePercent = game.shoeSize > 0 ? (game.shoe.length / game.shoeSize) * 100 : 0;

  // Derive a stable key for the controls AnimatePresence
  const controlsKey =
    game.phase === 'betting'     ? 'betting'  :
    game.phase === 'player_turn' ? 'player'   :
    game.phase === 'complete'    ? 'complete' :
    game.phase === 'dealing'     ? 'dealing'  : 'dealer';

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse 140% 120% at 50% 30%, #1d7a40 0%, #125929 45%, #071a0e 100%)',
      }}
    >
      {/* ══ TOP BAR ══ */}
      <div
        className="shrink-0 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'var(--surface-dark)', borderBottom: '1px solid var(--border-subtle)', padding: '0 var(--space-lg)', height: 'var(--topbar-h)' }}
      >
        {/* Left: Settings + Charts */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              background: 'var(--surface-glass)',
              border: '1px solid var(--border-light)',
            }}
          >
            <span className="leading-none" style={{ fontSize: 'var(--text-lg)' }}>⚙</span>
            <span className="topbar-btn-label">Settings</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setChartOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              background: 'var(--surface-glass)',
              border: '1px solid var(--border-light)',
            }}
          >
            <span className="leading-none" style={{ fontSize: 'var(--text-lg)' }}>♠</span>
            <span className="topbar-btn-label">Charts</span>
          </motion.button>

        </div>

        <div className="topbar-stats absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -50%)' }}>
          <StatsPanel />
        </div>

        {/* Right: Balance */}
        <div className="flex items-center shrink-0">
          <div className="text-right">
            <span className="text-xs text-white/35 tracking-widest uppercase block leading-none mb-2">Balance</span>
            <span className="font-black text-yellow-400 leading-none whitespace-nowrap" style={{ fontSize: 'var(--text-3xl)' }}>${animatedBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ══ DEALER ZONE ══ */}
      <div className="flex-[3.75] flex flex-col items-center justify-center min-h-0 relative">
        {rules.showCount !== 'off' && (
          <div className="absolute top-4 left-6 z-10">
            <RunningCount mode={rules.showCount} />
          </div>
        )}
        {/* Shoe bar — top right of game area */}
        <div className="absolute top-4 right-6 z-10 flex items-center gap-3">
          <div className="relative bg-black/30 rounded-full overflow-hidden" style={{ width: `clamp(${100 + rules.numDecks * 8}px, ${12 + rules.numDecks}vw, ${200 + rules.numDecks * 12}px)`, height: '18px' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${shoePercent}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                background: shoePercent > 25 ? 'rgba(250,204,21,0.65)' : 'rgba(239,68,68,0.75)',
              }}
            />
            {Array.from({ length: rules.numDecks - 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full"
                style={{
                  left: `${((i + 1) / rules.numDecks) * 100}%`,
                  width: '1px',
                  background: 'rgba(0,0,0,0.5)',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: shoePercent > 25 ? 'rgba(255,255,255,0.30)' : 'rgba(239,68,68,0.7)' }}>{Math.round(shoePercent)}%</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <DealerHand
            hand={game.dealerHand}
            holeCardRevealed={game.dealerHoleCardRevealed}
            showHandTotals={rules.showHandTotals}
            settleBounce={settleBounce}
            suspense={dealerSuspense}
            sweeping={sweepingCards}
          />
        </div>
      </div>

      {/* ══ DIVIDER — fixed height so message pill appearing/disappearing never shifts cards ══ */}
      <div className="shrink-0 flex items-center gap-6 px-12" style={{ height: 'var(--divider-h)' }}>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
        <AnimatePresence mode="wait">
          {game.message && (
            <motion.div
              key={game.message}
              className="shrink-0 text-base font-semibold text-white/85 whitespace-nowrap rounded-full"
              style={{ padding: 'var(--space-sm) var(--modal-padding-x)', background: 'var(--surface-dark)', border: '1px solid var(--border-light)' }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            >
              {game.message}
            </motion.div>
          )}
          {correctFlash && !game.message && (
            <motion.div
              key="correct-flash"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              style={{
                padding: 'var(--space-sm) var(--space-lg)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
              }}
            >
              ✓ Correct
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
      </div>

      {/* ══ PLAYER ZONE ══ */}
      <div className="flex-[6.25] flex flex-col min-h-0">
        {/* Cards — fills available space, anchored to bottom so height changes grow upward */}
        <div
          className="flex-1 flex items-end justify-center min-h-0"
          style={{ paddingBottom: 'calc(var(--badge-slot-h) + var(--badge-offset-top) + var(--space-sm))' }}
        >
          <div className="flex items-start justify-center" style={{ gap: 'var(--gap-cards)' }}>
            {game.playerHands.map((hand, i) => (
              <PlayerHand
                key={i}
                hand={hand}
                isActive={i === game.activeHandIndex && game.phase === 'player_turn'}
                handIndex={i}
                totalHands={game.playerHands.length}
                showHandTotals={rules.showHandTotals}
                settleBounce={settleBounce}
                lockedIn={lockedIn}
                resultPayoff={resultPayoff}
                hideOverlays={sweepingCards}
              />
            ))}
          </div>
        </div>

        {/* Controls — fixed height, content absolutely positioned so cards never shift */}
        <div className="shrink-0 relative" style={{ height: 'var(--controls-h)' }}>
          <AnimatePresence mode="wait">
            {game.phase === 'betting' && (
              <motion.div
                key="betting"
                className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-end"
                style={{ paddingBottom: 'var(--space-lg)' }}
                variants={controlVariants}
                initial="enter"
                animate="show"
                exit="exit"
              >
                <BetControls
                  currentBet={game.currentBet}
                  balance={game.balance}
                  onBetChange={game.placeBet}
                  onDeal={game.deal}
                />
              </motion.div>
            )}

            {game.phase === 'player_turn' && (
              <motion.div
                key="player"
                className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-end"
                style={{ paddingBottom: 'var(--space-lg)' }}
                variants={controlVariants}
                initial="enter"
                animate="show"
                exit="exit"
              >
                <ActionButtons
                  key={actionResetKey}
                  onHit={() => handlePlayerAction('HIT', game.hit)}
                  onStand={() => handlePlayerAction('STAND', game.stand)}
                  onDouble={() => handlePlayerAction('DOUBLE', game.double)}
                  onSplit={() => handlePlayerAction('SPLIT', game.split)}
                  onSurrender={() => handlePlayerAction('SURRENDER', game.surrender)}
                  canDouble={game.canDouble()}
                  canSplit={game.canSplit()}
                  canSurrender={game.canSurrender()}
                  disabled={modalOpen || splitAnimatingRef.current}
                />
              </motion.div>
            )}

            {(game.phase === 'dealer_turn' || game.phase === 'settling') && (
              <motion.div
                key="dealer"
                className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-end gap-3"
                style={{ paddingBottom: 'var(--space-lg)' }}
                variants={controlVariants}
                initial="enter"
                animate="show"
                exit="exit"
              >
                <motion.span
                  className="text-white/50 text-base font-semibold tracking-widest uppercase"
                  animate={{ opacity: [0.35, 0.8, 0.35] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Dealer playing…
                </motion.span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-white/30 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {game.phase === 'complete' && (
              <motion.div
                key={`complete-${controlsKey}`}
                className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-end"
                style={{ paddingBottom: 'var(--space-lg)' }}
                variants={controlVariants}
                initial="enter"
                animate="show"
                exit="exit"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    playSweep();
                    setSweepingCards(true);
                    setTimeout(() => {
                      game.newHand();
                      setSweepingCards(false);
                      playNextHand();
                    }, 600);
                  }}
                  className="font-black uppercase tracking-widest cta-pulse"
                  style={{
                    padding: 'var(--cta-padding-y) var(--cta-padding-x)',
                    fontSize: 'var(--text-xl)',
                    borderRadius: 'var(--cta-radius)',
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                    border: 'none',
                    color: '#1a1a1a',
                    boxShadow: '0 8px 32px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  Next Hand
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══ STRATEGY MODAL ══ */}
      {modalData && (
        <StrategyModal
          isOpen={modalOpen}
          playerAction={modalData.playerAction}
          correctAction={modalData.advice.correctAction}
          handType={modalData.advice.handType}
          playerTotal={modalData.advice.playerTotal}
          dealerUpcard={modalData.advice.dealerUpcard}
          onClose={handleModalClose}
          onForceCorrect={rules.wrongMoveAction === 'block' ? handleForceCorrect : undefined}
          onPlayAnyways={rules.wrongMoveAction === 'block' ? handlePlayAnyways : undefined}
          blockMode={rules.wrongMoveAction === 'block'}
        />
      )}

      {/* ══ CHART MODAL ══ */}
      <StrategyChartModal
        isOpen={chartOpen}
        onClose={() => setChartOpen(false)}
        rules={rules}
      />

      {/* ══ SETTINGS MODAL ══ */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onBackToMenu={onBackToMenu}
      />

      {/* ══ GOLD VIGNETTE — blackjack celebration flash ══ */}
      {goldVignette && (
        <div
          className="fixed inset-0 pointer-events-none gold-vignette"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(250,204,21,0.15) 100%)',
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
}

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
import { playWin, playBlackjack, playLose, playPush, playDeal, setMasterVolume } from '../../engine/sounds';
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
  const [modalData, setModalData] = useState<{
    playerAction: FinalAction;
    advice: StrategyAdvice;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const splitAnimatingRef = useRef(false);
  const animatedBalance = useAnimatedNumber(game.balance);

  // Sync volume setting
  useEffect(() => { setMasterVolume(rules.soundVolume / 100); }, [rules.soundVolume]);

  useEffect(() => { strategyRef.current = buildStrategy(rules); }, [rules]);
  useEffect(() => { game.initGame(rules); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      }, (i + 1) * 600);
    });

    setTimeout(() => {
      splitAnimatingRef.current = false;
      // Force a re-render so buttons pick up the change
      useGameStore.setState({});
    }, (pendingIndices.length + 1) * 600);

  }, [splitHandCount, game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dealer play — apply steps sequentially for smooth card-by-card animation
  useEffect(() => {
    if (game.phase === 'dealer_turn') {
      const steps = playDealerSteps(game);
      const timers: ReturnType<typeof setTimeout>[] = [];

      // Step 0: reveal hole card after short pause
      // Steps 1..n-2: draw cards one at a time
      // Final step: settle
      let delay = 400;
      const DRAW_INTERVAL = 650;
      const SETTLE_DELAY = 450;

      steps.forEach((step, i) => {
        const isLast = i === steps.length - 1;

        timers.push(setTimeout(() => {
          useGameStore.setState(step.state);
          if (step.countCards.length > 0) {
            useCountStore.getState().updateCount(step.countCards);
          }
        }, delay));

        delay += isLast ? 0 : (i === 0 ? DRAW_INTERVAL : (i === steps.length - 2 ? SETTLE_DELAY : DRAW_INTERVAL));
      });

      return () => timers.forEach(clearTimeout);
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats + sound on complete (delay sound so card-flip animation plays first)
  useEffect(() => {
    if (game.phase === 'complete') {
      stats.recordHandPlayed();
      const t = setTimeout(() => pickResultSound(game.playerHands)(), 100);
      return () => clearTimeout(t);
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deal sound
  useEffect(() => {
    if (game.phase === 'dealing') playDeal();
  }, [game.phase]);

  // Settle bounce — fires once when dealing completes and player_turn begins
  useEffect(() => {
    if (game.phase === 'player_turn') {
      setSettleBounce(true);
      const timer = setTimeout(() => setSettleBounce(false), 300);
      return () => clearTimeout(timer);
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
    stats.recordDecision(isCorrect);

    if (isCorrect) {
      executeAction();
    } else {
      setModalData({ playerAction: action, advice });
      if (rules.wrongMoveAction === 'block') {
        setPendingAction(() => getActionExecutor(advice.correctAction));
        setModalOpen(true);
      } else {
        setModalOpen(true);
        executeAction();
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

  const handleModalClose   = () => { setModalOpen(false); setModalData(null); setPendingAction(null); };
  const handleForceCorrect = () => { if (pendingAction) pendingAction(); handleModalClose(); };

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
        className="shrink-0 flex items-center justify-between h-[88px]"
        style={{ background: 'var(--surface-dark)', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}
      >
        {/* Left: Settings + Charts */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: '12px 24px',
              background: 'var(--surface-glass)',
              border: '1px solid var(--border-light)',
            }}
          >
            <span className="leading-none" style={{ fontSize: 'var(--text-lg)' }}>⚙</span>
            <span>Settings</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setChartOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: '12px 24px',
              background: 'var(--surface-glass)',
              border: '1px solid var(--border-light)',
            }}
          >
            <span className="leading-none" style={{ fontSize: 'var(--text-lg)' }}>♠</span>
            <span>Charts</span>
          </motion.button>

        </div>

        <StatsPanel />

        {/* Right: Shoe + Balance */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-28 h-2.5 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${shoePercent}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{
                    background: shoePercent > 25 ? 'rgba(250,204,21,0.75)' : 'rgba(239,68,68,0.85)',
                  }}
                />
              </div>
              <span className="text-sm text-white/35 w-10">{Math.round(shoePercent)}%</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/35 tracking-widest uppercase block leading-none mb-2">Balance</span>
            <span className="font-black text-yellow-400 leading-none whitespace-nowrap" style={{ fontSize: 'var(--text-3xl)' }}>${animatedBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ══ DEALER ZONE ══ */}
      <div className="flex-[4] flex flex-col items-center justify-center min-h-0 relative">
        {rules.showCount !== 'off' && (
          <div className="absolute top-4 left-6 z-10">
            <RunningCount mode={rules.showCount} />
          </div>
        )}
        <DealerHand
          hand={game.dealerHand}
          holeCardRevealed={game.dealerHoleCardRevealed}
          showHandTotals={rules.showHandTotals}
          settleBounce={settleBounce}
        />
      </div>

      {/* ══ DIVIDER — fixed height so message pill appearing/disappearing never shifts cards ══ */}
      <div className="shrink-0 flex items-center gap-6 px-12" style={{ height: '52px' }}>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
        <AnimatePresence mode="wait">
          {game.message && (
            <motion.div
              key={game.message}
              className="shrink-0 text-base font-semibold text-white/85 whitespace-nowrap rounded-full"
              style={{ padding: '12px 40px', background: 'var(--surface-dark)', border: '1px solid var(--border-light)' }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            >
              {game.message}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
      </div>

      {/* ══ PLAYER ZONE ══ */}
      <div className="flex-[6] flex flex-col min-h-0">
        {/* Cards — fills available space, anchored to bottom so height changes grow upward */}
        <div className="flex-1 flex items-end justify-center min-h-0" style={{ paddingBottom: '12px' }}>
          <div className="flex gap-14 items-start justify-center">
            {game.playerHands.map((hand, i) => (
              <PlayerHand
                key={i}
                hand={hand}
                isActive={i === game.activeHandIndex && game.phase === 'player_turn'}
                handIndex={i}
                totalHands={game.playerHands.length}
                showHandTotals={rules.showHandTotals}
                settleBounce={settleBounce}
              />
            ))}
          </div>
        </div>

        {/* Controls — fixed height, content absolutely positioned so cards never shift */}
        <div className="shrink-0 relative" style={{ height: '320px' }}>
          <AnimatePresence mode="wait">
            {game.phase === 'betting' && (
              <motion.div
                key="betting"
                className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-end"
                style={{ paddingBottom: '48px' }}
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
                style={{ paddingBottom: '48px' }}
                variants={controlVariants}
                initial="enter"
                animate="show"
                exit="exit"
              >
                <ActionButtons
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
                style={{ paddingBottom: '48px' }}
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
                style={{ paddingBottom: '48px' }}
                variants={controlVariants}
                initial="enter"
                animate="show"
                exit="exit"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={game.newHand}
                  className="font-black uppercase tracking-widest cta-pulse"
                  style={{
                    padding: '22px 120px',
                    fontSize: 'var(--text-xl)',
                    borderRadius: '18px',
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
    </div>
  );
}

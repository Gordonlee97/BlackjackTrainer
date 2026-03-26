import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, playDealer } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useStatsStore } from '../../store/statsStore';
import type { StrategyAdvice } from '../../strategy/advisor';
import { getCorrectAction } from '../../strategy/advisor';
import { buildStrategy } from '../../strategy/charts';
import type { FinalAction, FullStrategy } from '../../strategy/types';
import type { HandState } from '../../engine/types';
import { playWin, playBlackjack, playLose, playPush, playDeal } from '../../engine/sounds';
import DealerHand from './DealerHand';
import PlayerHand from './PlayerHand';
import ActionButtons from './ActionButtons';
import BetControls from './BetControls';
import StatsPanel from '../feedback/StatsPanel';
import StrategyModal from '../feedback/StrategyModal';
import StrategyChartModal from '../feedback/StrategyChartModal';
import SettingsModal from './SettingsModal';

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
  const [modalData, setModalData] = useState<{
    playerAction: FinalAction;
    advice: StrategyAdvice;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => { strategyRef.current = buildStrategy(rules); }, [rules]);
  useEffect(() => { game.initGame(rules); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dealer play
  useEffect(() => {
    if (game.phase === 'dealer_turn') {
      const timer = setTimeout(() => {
        const result = playDealer(game);
        useGameStore.setState(result);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats + sound on complete (delay sound so card-flip animation plays first)
  useEffect(() => {
    if (game.phase === 'complete') {
      stats.recordHandPlayed();
      const t = setTimeout(() => pickResultSound(game.playerHands)(), 950);
      return () => clearTimeout(t);
    }
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deal sound
  useEffect(() => {
    if (game.phase === 'dealing') playDeal();
  }, [game.phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (game.phase !== 'player_turn' || modalOpen) return;
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
    game.phase === 'complete'    ? 'complete' : 'dealer';

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse 140% 120% at 50% 30%, #1d7a40 0%, #125929 45%, #071a0e 100%)',
      }}
    >
      {/* ══ TOP BAR ══ */}
      <div
        className="shrink-0 flex items-center justify-between px-10 h-[88px]"
        style={{ background: 'rgba(0,0,0,0.32)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Left: Settings + Charts — shrink-0 so StatsPanel never squeezes these */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span className="leading-none" style={{ fontSize: '18px' }}>⚙</span>
            <span>Settings</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setChartOpen(true)}
            className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors text-base font-semibold tracking-wide rounded-full"
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span className="leading-none" style={{ fontSize: '18px' }}>♠</span>
            <span>Charts</span>
          </motion.button>
        </div>

        <StatsPanel />

        {/* Right: Shoe + Balance — shrink-0 */}
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
            <span className="text-xs text-white/35 tracking-widest uppercase block leading-none mb-1.5">Balance</span>
            <span className="text-3xl font-black text-yellow-400 leading-none">${game.balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ══ DEALER ZONE — justify-center so cards sit in the middle, not at the edge ══ */}
      <div className="flex-[4] flex flex-col items-center justify-center min-h-0 py-6">
        <DealerHand
          hand={game.dealerHand}
          holeCardRevealed={game.dealerHoleCardRevealed}
        />
      </div>

      {/* ══ DIVIDER ══ */}
      <div className="shrink-0 flex items-center gap-6 px-12 py-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
        <AnimatePresence mode="wait">
          {game.message && (
            <motion.div
              key={game.message}
              className="shrink-0 text-lg font-semibold text-white/85 whitespace-nowrap px-10 py-3.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}
              initial={{ opacity: 0, scale: 0.88, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            >
              {game.message}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
      </div>

      {/* ══ PLAYER ZONE — justify-center + gap keeps hands and controls together ══ */}
      <div className="flex-[6] flex flex-col items-center justify-center gap-10 min-h-0 py-6">

        {/* Player hand(s) */}
        <div className="flex gap-14 items-start justify-center">
          {game.playerHands.map((hand, i) => (
            <PlayerHand
              key={i}
              hand={hand}
              isActive={i === game.activeHandIndex && game.phase === 'player_turn'}
              handIndex={i}
              totalHands={game.playerHands.length}
            />
          ))}
        </div>

        {/* Controls — animated phase transitions */}
        <AnimatePresence mode="wait">
          {game.phase === 'betting' && (
            <motion.div
              key="betting"
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
                disabled={modalOpen}
              />
            </motion.div>
          )}

          {(game.phase === 'dealer_turn' || game.phase === 'settling') && (
            <motion.div
              key="dealer"
              variants={controlVariants}
              initial="enter"
              animate="show"
              exit="exit"
            >
              <motion.span
                className="text-white/40 text-base font-semibold tracking-widest uppercase"
                animate={{ opacity: [0.35, 0.8, 0.35] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                Dealer playing…
              </motion.span>
            </motion.div>
          )}

          {game.phase === 'complete' && (
            <motion.div
              key={`complete-${controlsKey}`}
              variants={controlVariants}
              initial="enter"
              animate="show"
              exit="exit"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={game.newHand}
                className="font-black text-2xl tracking-wide rounded-full"
                style={{
                  padding: '20px 100px',
                  background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #b45309 100%)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 4px 28px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
                  color: '#111827',
                }}
              >
                Next Hand
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
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

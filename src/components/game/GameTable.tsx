import { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
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

interface GameTableProps {
  onBackToSetup: () => void;
}

function pickResultSound(hands: HandState[]) {
  const results = hands.map(h => h.result);
  if (results.includes('blackjack')) return playBlackjack;
  if (results.includes('win')  && !results.includes('lose')) return playWin;
  if (results.includes('lose') && !results.includes('win'))  return playLose;
  if (results.every(r => r === 'push'))                      return playPush;
  // mixed: win+lose → neutral
  return playPush;
}

export default function GameTable({ onBackToSetup }: GameTableProps) {
  const game = useGameStore();
  const { rules } = useSettingsStore();
  const stats = useStatsStore();
  const strategyRef = useRef<FullStrategy | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
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

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse 140% 120% at 50% 30%, #1d7a40 0%, #125929 45%, #071a0e 100%)',
      }}
    >
      {/* ══ TOP BAR ══ */}
      <div
        className="shrink-0 flex items-center justify-between px-6 h-20"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={onBackToSetup}
          className="flex items-center gap-2 text-white/55 hover:text-white/85 transition-colors text-base font-semibold tracking-wide rounded-full px-5 py-2.5"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span className="text-lg leading-none">⚙</span>
          <span>Settings</span>
        </button>

        <StatsPanel />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${shoePercent}%`,
                  background: shoePercent > 25 ? 'rgba(250,204,21,0.7)' : 'rgba(239,68,68,0.85)',
                }}
              />
            </div>
            <span className="text-xs text-white/30 w-8">{Math.round(shoePercent)}%</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/35 tracking-widest uppercase block leading-none mb-1">Balance</span>
            <span className="text-2xl font-black text-yellow-400 leading-none">${game.balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ══ DEALER ZONE ══ */}
      <div className="flex-[3] flex flex-col items-center justify-center min-h-0">
        <DealerHand
          hand={game.dealerHand}
          holeCardRevealed={game.dealerHoleCardRevealed}
        />
      </div>

      {/* ══ DIVIDER ══ */}
      <div className="shrink-0 flex items-center gap-5 px-12">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        {game.message && (
          <div
            className="shrink-0 text-base font-semibold text-white/80 whitespace-nowrap px-8 py-3 rounded-full"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {game.message}
          </div>
        )}
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* ══ PLAYER ZONE ══ */}
      <div className="flex-[5] flex flex-col items-center justify-around min-h-0 py-4">

        {/* Player hand(s) */}
        <div className="flex gap-12 items-start justify-center">
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

        {/* Controls */}
        <div className="flex items-center justify-center">
          {game.phase === 'betting' && (
            <BetControls
              currentBet={game.currentBet}
              balance={game.balance}
              onBetChange={game.placeBet}
              onDeal={game.deal}
            />
          )}

          {game.phase === 'player_turn' && (
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
          )}

          {(game.phase === 'dealer_turn' || game.phase === 'settling') && (
            <div className="text-white/35 text-sm font-medium tracking-widest uppercase animate-pulse">
              Dealer playing…
            </div>
          )}

          {game.phase === 'complete' && (
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={game.newHand}
              className="font-black text-xl tracking-wide rounded-full"
              style={{
                padding: '18px 80px',
                background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #b45309 100%)',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 4px 28px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
                color: '#111827',
              }}
            >
              Next Hand
            </motion.button>
          )}
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
    </div>
  );
}

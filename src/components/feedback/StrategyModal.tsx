import { motion, AnimatePresence } from 'framer-motion';
import type { FinalAction } from '../../strategy/types';
import { getExplanation } from '../../strategy/explanations';

interface StrategyModalProps {
  isOpen: boolean;
  playerAction: FinalAction;
  correctAction: FinalAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  onClose: () => void;
  onForceCorrect?: () => void;
  blockMode: boolean;
}

const ACTION_LABELS: Record<FinalAction, string> = {
  HIT: 'Hit',
  STAND: 'Stand',
  DOUBLE: 'Double Down',
  SPLIT: 'Split',
  SURRENDER: 'Surrender',
};

function handTypeLabel(handType: string, total: number): string {
  if (handType === 'pairs') return `Pair of ${total === 11 ? 'Aces' : total + 's'}`;
  if (handType === 'soft') return `Soft ${total}`;
  return `Hard ${total}`;
}

export default function StrategyModal({
  isOpen,
  playerAction,
  correctAction,
  handType,
  playerTotal,
  dealerUpcard,
  onClose,
  onForceCorrect,
  blockMode,
}: StrategyModalProps) {
  const explanation = getExplanation({
    correctAction,
    playerAction,
    handType,
    playerTotal,
    dealerUpcard,
  });

  const dealerLabel = dealerUpcard === 11 ? 'Ace' : String(dealerUpcard);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={!blockMode ? onClose : undefined}
          />
          <motion.div
            className="relative rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4"
            style={{
              background: 'linear-gradient(145deg, #1e2535 0%, #151c2c 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {/* Header */}
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">
                {blockMode ? '⚠️' : '❌'}
              </div>
              <h2 className="text-lg font-black text-white tracking-wide">
                {blockMode ? 'Not Quite Right' : 'Wrong Play'}
              </h2>
              <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">
                {handTypeLabel(handType, playerTotal)} vs Dealer {dealerLabel}
              </p>
            </div>

            {/* Action comparison */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between items-center rounded-xl px-4 py-3"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <span className="text-red-300/80 text-sm">You played</span>
                <span className="text-red-400 font-black text-sm">{ACTION_LABELS[playerAction]}</span>
              </div>
              <div className="flex justify-between items-center rounded-xl px-4 py-3"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-emerald-300/80 text-sm">Correct play</span>
                <span className="text-emerald-400 font-black text-sm">{ACTION_LABELS[correctAction]}</span>
              </div>
            </div>

            {/* Explanation */}
            <div className="rounded-xl px-4 py-3 mb-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm text-white/70 leading-relaxed">
                {explanation}
              </p>
            </div>

            {/* Action button */}
            <div className="flex justify-center">
              {blockMode && onForceCorrect ? (
                <button
                  onClick={onForceCorrect}
                  className="w-full font-black text-white tracking-wide rounded-full transition-opacity hover:opacity-90"
                  style={{
                    padding: '15px 32px',
                    background: 'linear-gradient(155deg, #065f46 0%, #059669 100%)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 4px 20px rgba(5,150,105,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                >
                  Play Correct Move
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full font-black tracking-wide rounded-full transition-opacity hover:opacity-90"
                  style={{
                    padding: '15px 32px',
                    background: 'linear-gradient(155deg, #1e40af 0%, #3b82f6 100%)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
                    color: 'white',
                  }}
                >
                  Got it
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

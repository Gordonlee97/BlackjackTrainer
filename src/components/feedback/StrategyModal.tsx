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
  onPlayAnyways?: () => void;
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
  onPlayAnyways,
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
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--surface-overlay)' }}
            onClick={!blockMode ? onClose : undefined}
          />
          <motion.div
            className="relative flex flex-col"
            style={{
              width: 'min(92vw, 520px)',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-modal)',
            }}
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {/* Header */}
            <div
              className="text-center"
              style={{ padding: '36px 40px 28px 40px' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {blockMode ? '\u26a0\ufe0f' : '\u274c'}
              </div>
              <h2 className="text-white font-black tracking-wide" style={{ fontSize: '24px' }}>
                {blockMode ? 'Not Quite Right' : 'Wrong Play'}
              </h2>
              <p
                className="text-white/40 tracking-[0.18em] uppercase"
                style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}
              >
                {handTypeLabel(handType, playerTotal)} vs Dealer {dealerLabel}
              </p>
            </div>

            {/* Action comparison */}
            <div style={{ padding: '0 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                className="flex justify-between items-center"
                style={{
                  padding: '18px 24px',
                  borderRadius: '16px',
                  background: 'rgba(220,38,38,0.10)',
                  border: '1px solid rgba(220,38,38,0.18)',
                }}
              >
                <span className="text-red-300/80 font-medium" style={{ fontSize: '16px' }}>You played</span>
                <span className="text-red-400 font-black" style={{ fontSize: '16px' }}>{ACTION_LABELS[playerAction]}</span>
              </div>
              <div
                className="flex justify-between items-center"
                style={{
                  padding: '18px 24px',
                  borderRadius: '16px',
                  background: 'rgba(16,185,129,0.10)',
                  border: '1px solid rgba(16,185,129,0.18)',
                }}
              >
                <span className="text-emerald-300/80 font-medium" style={{ fontSize: '16px' }}>Correct play</span>
                <span className="text-emerald-400 font-black" style={{ fontSize: '16px' }}>{ACTION_LABELS[correctAction]}</span>
              </div>
            </div>

            {/* Explanation */}
            <div style={{ padding: '24px 40px 0 40px' }}>
              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p className="text-white/70 leading-relaxed" style={{ fontSize: '15px' }}>
                  {explanation}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: '28px 40px 36px 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {blockMode && onForceCorrect ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onForceCorrect}
                    className="w-full font-black uppercase tracking-widest text-white"
                    style={{
                      padding: '20px 32px',
                      fontSize: '17px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                      border: 'none',
                      boxShadow: '0 8px 32px rgba(16,185,129,0.35), 0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    Try Again
                  </motion.button>
                  {onPlayAnyways && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onPlayAnyways}
                      className="w-full font-semibold uppercase tracking-widest"
                      style={{
                        padding: '14px 32px',
                        fontSize: '13px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.40)',
                      }}
                    >
                      Play Anyways
                    </motion.button>
                  )}
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full font-black uppercase tracking-widest text-white"
                  style={{
                    padding: '20px 32px',
                    fontSize: '17px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(59,130,246,0.35), 0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  Got It
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

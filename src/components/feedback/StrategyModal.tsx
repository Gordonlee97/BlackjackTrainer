import { motion, AnimatePresence } from 'framer-motion';
import type { FinalAction } from '../../strategy/types';
import { getExplanation, getDeviationExplanation } from '../../strategy/explanations';

interface StrategyModalProps {
  isOpen: boolean;
  playerAction: FinalAction;
  correctAction: FinalAction;
  handType: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  dealerUpcard: number;
  isDeviation?: boolean;
  deviationThreshold?: number;
  deviationDirection?: 'gte' | 'lte';
  deviationUsesRunningCount?: boolean;
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
  isDeviation,
  deviationThreshold,
  deviationDirection,
  deviationUsesRunningCount,
  onClose,
  onForceCorrect,
  onPlayAnyways,
  blockMode,
}: StrategyModalProps) {
  const explanation = isDeviation && deviationThreshold != null && deviationDirection
    ? getDeviationExplanation({ handType, playerTotal, dealerUpcard, threshold: deviationThreshold, direction: deviationDirection, usesRunningCount: deviationUsesRunningCount })
    : getExplanation({ correctAction, playerAction, handType, playerTotal, dealerUpcard });

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
              style={{ padding: 'var(--modal-padding-y) var(--modal-padding-x) var(--space-xl) var(--modal-padding-x)' }}
            >
              <div style={{ fontSize: 'var(--modal-emoji-font)', marginBottom: 'var(--space-sm)' }}>
                {blockMode ? '\u26a0\ufe0f' : '\u274c'}
              </div>
              <h2 className="text-white font-black tracking-wide" style={{ fontSize: 'var(--modal-title-font)' }}>
                {blockMode ? 'Not Quite Right' : 'Wrong Play'}
              </h2>
              <p
                className="text-white/40 tracking-[0.18em] uppercase"
                style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 'var(--space-sm)' }}
              >
                {handTypeLabel(handType, playerTotal)} vs Dealer {dealerLabel}
              </p>
              {isDeviation && (
                <span
                  className="inline-block uppercase tracking-[0.15em]"
                  style={{
                    marginTop: 'var(--space-sm)',
                    padding: '4px 14px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'rgba(251,191,36,0.95)',
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.22)',
                    borderRadius: '8px',
                    letterSpacing: '0.12em',
                  }}
                >
                  Index Play
                </span>
              )}
            </div>

            {/* Action comparison */}
            <div style={{ padding: '0 var(--modal-padding-x)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div
                className="flex justify-between items-center"
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(220,38,38,0.10)',
                  border: '1px solid rgba(220,38,38,0.18)',
                }}
              >
                <span className="text-red-300/80 font-medium" style={{ fontSize: 'var(--text-base)' }}>You played</span>
                <span className="text-red-400 font-black" style={{ fontSize: 'var(--text-base)' }}>{ACTION_LABELS[playerAction]}</span>
              </div>
              <div
                className="flex justify-between items-center"
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16,185,129,0.10)',
                  border: '1px solid rgba(16,185,129,0.18)',
                }}
              >
                <span className="text-emerald-300/80 font-medium" style={{ fontSize: 'var(--text-base)' }}>Correct play</span>
                <div className="flex items-center gap-3">
                  {isDeviation && deviationThreshold != null && (
                    <span
                      className="font-bold"
                      style={{
                        fontSize: 'var(--text-sm)',
                        padding: '2px 10px',
                        borderRadius: '8px',
                        background: 'rgba(251,191,36,0.15)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        color: 'rgba(251,191,36,0.9)',
                      }}
                    >
                      {deviationUsesRunningCount
                        ? `RC ${deviationDirection === 'gte' ? '0+' : '0\u2212'}`
                        : `TC ${deviationThreshold >= 0 ? '+' : ''}${deviationThreshold}`}
                    </span>
                  )}
                  <span className="text-emerald-400 font-black" style={{ fontSize: 'var(--text-base)' }}>{ACTION_LABELS[correctAction]}</span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div style={{ padding: 'var(--space-lg) var(--modal-padding-x) 0 var(--modal-padding-x)' }}>
              <div
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p className="text-white/70 leading-relaxed" style={{ fontSize: 'var(--text-base)' }}>
                  {explanation}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: 'var(--space-xl) var(--modal-padding-x) var(--modal-padding-y) var(--modal-padding-x)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {blockMode && onForceCorrect ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onForceCorrect}
                    className="w-full font-black uppercase tracking-widest text-white"
                    style={{
                      padding: 'var(--space-md) var(--space-xl)',
                      fontSize: 'var(--text-lg)',
                      borderRadius: 'var(--radius-lg)',
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
                        padding: 'var(--space-sm) var(--space-xl)',
                        fontSize: 'var(--text-sm)',
                        borderRadius: 'var(--radius-lg)',
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
                    padding: 'var(--space-md) var(--space-xl)',
                    fontSize: 'var(--text-lg)',
                    borderRadius: 'var(--radius-lg)',
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

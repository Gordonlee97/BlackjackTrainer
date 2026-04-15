import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onRebuy: (amount: number) => void;
  onClose: () => void;
  onBackToMenu: () => void;
}

const REBUY_OPTIONS = [500, 1000, 2500];

export default function RebuyModal({ isOpen, onRebuy, onClose, onBackToMenu }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="rebuy-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop — click to close */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--surface-overlay)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="rebuy-panel"
            className="relative flex flex-col items-center"
            style={{
              width: 'min(92vw, 420px)',
              padding: 'var(--space-2xl) var(--modal-padding-x)',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-modal)',
            }}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              style={{ top: '16px', right: '16px', width: '36px', height: '36px', fontSize: 'var(--text-base)' }}
            >
              ✕
            </button>

            <span style={{ fontSize: 'clamp(36px, 5vw, 48px)', lineHeight: 1, marginBottom: '16px' }}>💰</span>
            <h2
              className="text-white font-black tracking-wide text-center"
              style={{ fontSize: 'var(--modal-title-font)', marginBottom: '8px' }}
            >
              Add Funds
            </h2>
            <p className="text-white/45 text-sm text-center" style={{ marginBottom: '28px' }}>
              Choose an amount to add to your balance
            </p>

            <div className="flex gap-3 w-full justify-center" style={{ marginBottom: '24px' }}>
              {REBUY_OPTIONS.map((amount) => (
                <motion.button
                  key={amount}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onRebuy(amount)}
                  className="font-bold rounded-2xl transition-colors"
                  style={{
                    padding: '14px 20px',
                    fontSize: 'var(--text-base)',
                    color: '#1a1a1a',
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                    flex: 1,
                    maxWidth: '120px',
                  }}
                >
                  ${amount.toLocaleString()}
                </motion.button>
              ))}
            </div>

            <button
              onClick={onBackToMenu}
              className="text-white/35 hover:text-white/65 transition-colors text-sm font-semibold underline underline-offset-2"
            >
              Back to Menu
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion } from 'framer-motion';
import Modal, { ModalCloseButton } from '../shared/Modal';

interface Props {
  isOpen: boolean;
  onRebuy: (amount: number) => void;
  onClose: () => void;
  onBackToMenu: () => void;
}

const REBUY_OPTIONS = [500, 1000, 2500];

export default function RebuyModal({ isOpen, onRebuy, onClose, onBackToMenu }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      label="Add Funds"
      onClose={onClose}
      width="min(92vw, 420px)"
      className="flex flex-col items-center"
      style={{ padding: 'var(--space-2xl) var(--modal-padding-x)' }}
    >
      <ModalCloseButton onClick={onClose} className="absolute" style={{ top: '12px', right: '12px' }} />

      <span style={{ fontSize: 'var(--modal-emoji-font)', lineHeight: 1, marginBottom: '16px' }}>💰</span>
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
            className="btn-cta font-bold"
            style={{
              padding: '14px 20px',
              fontSize: 'var(--text-base)',
              borderRadius: 'var(--radius-lg)',
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
    </Modal>
  );
}

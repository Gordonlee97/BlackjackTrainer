import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  /** Accessible name for the dialog. */
  label: string;
  /** Called on backdrop click and Escape. Omit to make the modal non-dismissible. */
  onClose?: () => void;
  /** Panel width, e.g. 'min(92vw, 720px)'. */
  width: string;
  maxHeight?: string;
  /** Extra classes / styles for the panel (layout, padding). */
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Shared modal shell: backdrop, panel chrome, enter/exit motion and Escape-to-close.
 * Motion follows the project rule for modals — 150ms, no spring.
 */
export default function Modal({ isOpen, label, onClose, width, maxHeight, className = '', style, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--surface-overlay)' }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`relative ${className}`}
            style={{
              width,
              maxHeight,
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-modal)',
              ...style,
            }}
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The ✕ button used in every modal header. 44px hit target. */
export function ModalCloseButton({ onClick, className = '', style }: { onClick: () => void; className?: string; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors ${className}`}
      style={{ fontSize: 'var(--text-xl)', ...style }}
    >
      ✕
    </button>
  );
}

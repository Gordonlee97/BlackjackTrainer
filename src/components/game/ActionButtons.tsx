import { motion } from 'framer-motion';

interface ActionButtonsProps {
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  disabled: boolean;
}

const BUTTON_STYLES = {
  hit:       'linear-gradient(155deg, #065f46 0%, #059669 100%)',
  stand:     'linear-gradient(155deg, #991b1b 0%, #dc2626 100%)',
  double:    'linear-gradient(155deg, #1e40af 0%, #3b82f6 100%)',
  split:     'linear-gradient(155deg, #5b21b6 0%, #8b5cf6 100%)',
  surrender: 'linear-gradient(155deg, #334155 0%, #64748b 100%)',
} as const;

export default function ActionButtons({
  onHit, onStand, onDouble, onSplit, onSurrender,
  canDouble, canSplit, canSurrender, disabled,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4">
        <ActionBtn label="Hit"   shortcut="H" gradient={BUTTON_STYLES.hit}   enabled size="lg" disabled={disabled} onClick={onHit} />
        <ActionBtn label="Stand" shortcut="S" gradient={BUTTON_STYLES.stand} enabled size="lg" disabled={disabled} onClick={onStand} />
      </div>
      <div className="flex gap-3">
        <ActionBtn label="Double"    shortcut="D" gradient={BUTTON_STYLES.double}    enabled={canDouble}    size="md" disabled={disabled} onClick={onDouble} />
        <ActionBtn label="Split"     shortcut="P" gradient={BUTTON_STYLES.split}     enabled={canSplit}     size="md" disabled={disabled} onClick={onSplit} />
        <ActionBtn label="Surrender" shortcut="R" gradient={BUTTON_STYLES.surrender} enabled={canSurrender} size="md" disabled={disabled} onClick={onSurrender} />
      </div>
    </div>
  );
}

function ActionBtn({ label, shortcut, gradient, enabled, size, disabled, onClick }: {
  label: string;
  shortcut: string;
  gradient: string;
  enabled: boolean;
  size: 'lg' | 'md';
  disabled: boolean;
  onClick: () => void;
}) {
  const off = disabled || !enabled;
  const w = size === 'lg' ? 176 : 144;
  const h = size === 'lg' ? 88  : 72;

  return (
    <motion.button
      whileHover={!off ? { scale: 1.05, y: -3 } : {}}
      whileTap={!off ? { scale: 0.96 } : {}}
      onClick={onClick}
      disabled={off}
      className="flex flex-col items-center justify-center gap-1 font-black text-white select-none"
      style={{
        width: w,
        height: h,
        borderRadius: '20px',
        background: off ? 'rgba(255,255,255,0.06)' : gradient,
        border: off ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.18)',
        boxShadow: off ? 'none' : '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
        color: off ? 'rgba(255,255,255,0.18)' : 'white',
        cursor: off ? 'not-allowed' : 'pointer',
        transition: 'box-shadow 0.15s, opacity 0.15s',
      }}
    >
      <span style={{ fontSize: size === 'lg' ? '1.375rem' : '1.125rem', lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: '10px', opacity: 0.4, lineHeight: 1 }}>[{shortcut}]</span>
    </motion.button>
  );
}

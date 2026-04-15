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
  hit:       { gradient: 'linear-gradient(155deg, #065f46 0%, #059669 100%)', glow: 'rgba(5,150,105,0.5)',    pressedGlow: 'rgba(5,150,105,0.3)' },
  stand:     { gradient: 'linear-gradient(155deg, #991b1b 0%, #dc2626 100%)', glow: 'rgba(220,38,38,0.45)',   pressedGlow: 'rgba(220,38,38,0.3)' },
  double:    { gradient: 'linear-gradient(155deg, #1e40af 0%, #3b82f6 100%)', glow: 'rgba(59,130,246,0.45)',  pressedGlow: 'rgba(59,130,246,0.3)' },
  split:     { gradient: 'linear-gradient(155deg, #5b21b6 0%, #8b5cf6 100%)', glow: 'rgba(139,92,246,0.45)',  pressedGlow: 'rgba(139,92,246,0.3)' },
  surrender: { gradient: 'linear-gradient(155deg, #334155 0%, #64748b 100%)', glow: 'rgba(100,116,139,0.35)', pressedGlow: 'rgba(100,116,139,0.25)' },
} as const;

export default function ActionButtons({
  onHit, onStand, onDouble, onSplit, onSurrender,
  canDouble, canSplit, canSurrender, disabled,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons flex flex-col items-center gap-4">
      <div className="flex gap-5">
        <ActionBtn label="Hit"   shortcut="H" style={BUTTON_STYLES.hit}   enabled size="lg" disabled={disabled} onClick={onHit} />
        <ActionBtn label="Stand" shortcut="S" style={BUTTON_STYLES.stand} enabled size="lg" disabled={disabled} onClick={onStand} />
      </div>
      <div className="flex gap-4">
        <ActionBtn label="Double"    shortcut="D" style={BUTTON_STYLES.double}    enabled={canDouble}    size="md" disabled={disabled} onClick={onDouble} />
        <ActionBtn label="Split"     shortcut="P" style={BUTTON_STYLES.split}     enabled={canSplit}     size="md" disabled={disabled} onClick={onSplit} />
        <ActionBtn label="Surrender" shortcut="R" style={BUTTON_STYLES.surrender} enabled={canSurrender} size="md" disabled={disabled} onClick={onSurrender} />
      </div>
    </div>
  );
}

function ActionBtn({ label, shortcut, style, enabled, size, disabled, onClick }: {
  label: string;
  shortcut: string;
  style: { gradient: string; glow: string; pressedGlow: string };
  enabled: boolean;
  size: 'lg' | 'md';
  disabled: boolean;
  onClick: () => void;
}) {
  const off = disabled || !enabled;
  const w = size === 'lg' ? 'var(--btn-lg-w)' : 'var(--btn-md-w)';
  const h = size === 'lg' ? 'var(--btn-lg-h)' : 'var(--btn-md-h)';

  const baseShadow = `0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)`;
  const hoverShadow = `0 8px 32px ${style.glow}, 0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.22)`;
  const pressedShadow = `0 2px 8px ${style.pressedGlow}`;

  return (
    <motion.button
      whileHover={!off ? { scale: 1.04, y: -3, boxShadow: hoverShadow, borderColor: 'rgba(255,255,255,0.35)' } : undefined}
      whileTap={!off ? { scale: 0.97, y: 1, boxShadow: pressedShadow } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={off}
      className={`flex flex-col items-center justify-center gap-1.5 font-black text-white select-none ${size === 'lg' ? 'action-btn-lg' : ''}`}
      style={{
        width: w,
        height: h,
        borderRadius: 'var(--btn-radius)',
        background: off ? 'rgba(255,255,255,0.04)' : style.gradient,
        border: off ? `1px solid var(--border-subtle)` : '1.5px solid rgba(255,255,255,0.2)',
        boxShadow: off ? 'none' : baseShadow,
        color: off ? 'rgba(255,255,255,0.15)' : 'white',
        cursor: off ? 'not-allowed' : 'pointer',
        transition: 'box-shadow 0.2s ease, opacity 0.15s',
      }}
    >
      <span style={{ fontSize: size === 'lg' ? 'var(--btn-lg-font)' : 'var(--btn-md-font)', lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', opacity: off ? 0.3 : 0.5, lineHeight: 1 }}>[{shortcut}]</span>
    </motion.button>
  );
}

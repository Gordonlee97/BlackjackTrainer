import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountStore } from '../../store/countStore';

interface RunningCountProps {
  mode: 'always' | 'hover';
}

export default function RunningCount({ mode }: RunningCountProps) {
  const count = useCountStore((s) => s.runningCount);
  const [hovered, setHovered] = useState(false);

  const revealed = mode === 'always' || hovered;

  const color =
    count > 0
      ? 'text-emerald-400'
      : count < 0
        ? 'text-rose-400'
        : 'text-white/70';

  const bgColor = !revealed
    ? 'rgba(255,255,255,0.04)'
    : count > 0
      ? 'rgba(16,185,129,0.10)'
      : count < 0
        ? 'rgba(244,63,94,0.10)'
        : 'rgba(255,255,255,0.05)';

  const borderColor = !revealed
    ? 'var(--border-subtle)'
    : count > 0
      ? 'rgba(16,185,129,0.20)'
      : count < 0
        ? 'rgba(244,63,94,0.20)'
        : 'var(--border-subtle)';

  const sign = count > 0 ? '+' : count < 0 ? '−' : '';
  const absCount = String(Math.abs(count));

  return (
    <div
      className="flex flex-col rounded-3xl transition-colors duration-200"
      style={{
        padding: '20px 36px 32px 36px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        width: '256px',
        cursor: mode === 'hover' ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="uppercase tracking-[0.18em] leading-none whitespace-nowrap text-center w-full"
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}
      >
        Running Count
      </span>
      <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.span
              key={count}
              className={`font-black leading-none ${color}`}
              style={{ fontSize: '64px', display: 'inline-flex', alignItems: 'baseline', marginLeft: '-8px' }}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              {sign && <span style={{ fontSize: '36px', marginRight: '2px', width: '22px', textAlign: 'right', position: 'relative', top: '-4px', left: '-3px' }}>{sign}</span>}
              {absCount}
            </motion.span>
          ) : (
            <motion.span
              key="hidden"
              className="font-black leading-none text-white/15"
              style={{ fontSize: '64px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              ?
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {mode === 'hover' && (
        <span
          className={`leading-none text-center ${hovered ? 'invisible' : ''}`}
          style={{ color: 'rgba(255,255,255,0.30)', fontSize: '14px', fontWeight: 600, marginTop: '12px', letterSpacing: '0.04em' }}
        >
          Hover to reveal
        </span>
      )}
    </div>
  );
}

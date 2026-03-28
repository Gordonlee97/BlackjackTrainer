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

  const displayCount = count > 0 ? `+${count}` : String(count);

  return (
    <div
      className="flex flex-col rounded-3xl transition-colors duration-200"
      style={{
        padding: '24px 44px 40px 44px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        width: '320px',
        cursor: mode === 'hover' ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="uppercase tracking-[0.18em] leading-none whitespace-nowrap text-center w-full"
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}
      >
        Running Count
      </span>
      <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.span
              key={count}
              className={`font-black leading-none ${color}`}
              style={{ fontSize: '80px' }}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              {displayCount}
            </motion.span>
          ) : (
            <motion.span
              key="hidden"
              className="font-black leading-none text-white/15"
              style={{ fontSize: '80px' }}
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
          style={{ color: 'rgba(255,255,255,0.20)', fontSize: '15px', fontWeight: 500, marginTop: '16px' }}
        >
          Hover to reveal
        </span>
      )}
    </div>
  );
}

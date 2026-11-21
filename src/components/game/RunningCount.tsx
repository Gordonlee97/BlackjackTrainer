import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountStore } from '../../store/countStore';

interface RunningCountProps {
  mode: 'always' | 'hover';
  trueCount?: number | null;
  /** One-line pill for the phone top bar; tap toggles the hidden count. */
  compact?: boolean;
}

function formatCount(value: number): { sign: string; abs: string } {
  return {
    sign: value > 0 ? '+' : value < 0 ? '\u2212' : '',
    abs: String(Math.abs(value)),
  };
}

function countColor(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-rose-400';
  return 'text-white/70';
}

export default function RunningCount({ mode, trueCount, compact }: RunningCountProps) {
  const count = useCountStore((s) => s.runningCount);
  const [hovered, setHovered] = useState(false);

  const revealed = mode === 'always' || hovered;
  const rc = formatCount(count);
  const hasTc = trueCount != null;

  if (compact) {
    const tc = hasTc ? formatCount(trueCount) : null;
    return (
      <button
        type="button"
        onClick={() => mode === 'hover' && setHovered(h => !h)}
        aria-label={revealed ? 'Hide running count' : 'Show running count'}
        className="flex items-center rounded-full whitespace-nowrap leading-none"
        style={{
          gap: 'var(--space-sm)',
          minHeight: '44px',
          padding: '0 var(--space-md)',
          background: 'var(--surface-glass)',
          border: '1px solid var(--border-light)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          cursor: mode === 'hover' ? 'pointer' : 'default',
        }}
      >
        <span className="text-white/40 tracking-widest">RC</span>
        <span className={`font-black ${revealed ? countColor(count) : 'text-white/30'}`} style={{ fontSize: 'var(--text-lg)' }}>
          {revealed ? `${rc.sign}${rc.abs}` : '?'}
        </span>
        {tc && (
          <>
            <span className="text-white/40 tracking-widest">TC</span>
            <span className={`font-black ${revealed ? countColor(trueCount!) : 'text-white/30'}`} style={{ fontSize: 'var(--text-lg)' }}>
              {revealed ? `${tc.sign}${tc.abs}` : '?'}
            </span>
          </>
        )}
      </button>
    );
  }

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

  return (
    <div
      className="flex flex-col items-center rounded-3xl transition-colors duration-200"
      style={{
        padding: 'var(--space-md) var(--modal-padding-x)',
        paddingBottom: 'var(--space-lg)',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        width: 'var(--count-width)',
        cursor: mode === 'hover' ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <span
        className="uppercase tracking-[0.18em] leading-none whitespace-nowrap text-center"
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-md)' }}
      >
        Running Count
      </span>

      {/* Content area — fixed height, crossfade between states */}
      <div className="relative w-full" style={{ minHeight: hasTc ? 'calc(var(--count-font) + 36px)' : 'var(--count-font)' }}>
        {/* Hidden state: "?" + hint */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200"
          style={{ opacity: revealed ? 0 : 1, pointerEvents: revealed ? 'none' : 'auto' }}
        >
          <span
            className="font-black leading-none text-white/15"
            style={{ fontSize: 'var(--count-font)' }}
          >
            ?
          </span>
          {mode === 'hover' && (
            <span
              className="leading-none text-center"
              style={{ color: 'rgba(255,255,255,0.30)', fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 'var(--space-sm)', letterSpacing: '0.04em' }}
            >
              <span className="hint-hover">Hover to reveal</span>
              <span className="hint-tap">Tap to reveal</span>
            </span>
          )}
        </div>

        {/* Revealed state: RC number + TC */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200"
          style={{ opacity: revealed ? 1 : 0, pointerEvents: revealed ? 'auto' : 'none' }}
        >
          {/* Running count number */}
          <div style={{ height: 'var(--count-font)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                className={`font-black leading-none ${countColor(count)}`}
                style={{ fontSize: 'var(--count-font)', display: 'inline-flex', alignItems: 'baseline' }}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {rc.sign && (
                  <span style={{ fontSize: 'var(--count-sign-font)', marginRight: '2px', width: '22px', textAlign: 'right', position: 'relative', top: '-4px', left: '-3px' }}>
                    {rc.sign}
                  </span>
                )}
                {rc.abs}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* True count */}
          {hasTc && (
            <div
              className="flex items-center justify-center gap-3"
              style={{ marginTop: 'var(--space-md)' }}
            >
              <span
                className="uppercase tracking-[0.15em] leading-none"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'var(--text-base)', fontWeight: 700 }}
              >
                TC
              </span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={trueCount}
                  className={`font-black leading-none ${countColor(trueCount!)}`}
                  style={{ fontSize: 'clamp(22px, min(3vw, 3vh), 34px)' }}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {formatCount(trueCount!).sign}{formatCount(trueCount!).abs}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

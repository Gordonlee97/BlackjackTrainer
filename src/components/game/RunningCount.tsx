import { motion, AnimatePresence } from 'framer-motion';
import { useCountStore } from '../../store/countStore';

export default function RunningCount() {
  const count = useCountStore((s) => s.runningCount);

  const color =
    count > 0
      ? 'text-emerald-400'
      : count < 0
        ? 'text-rose-400'
        : 'text-white/70';

  const bgColor =
    count > 0
      ? 'rgba(16,185,129,0.12)'
      : count < 0
        ? 'rgba(244,63,94,0.12)'
        : 'rgba(255,255,255,0.06)';

  const borderColor =
    count > 0
      ? 'rgba(16,185,129,0.25)'
      : count < 0
        ? 'rgba(244,63,94,0.25)'
        : 'rgba(255,255,255,0.10)';

  const displayCount = count > 0 ? `+${count}` : String(count);

  return (
    <div
      className="flex flex-col items-center rounded-xl"
      style={{
        padding: '8px 18px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        minWidth: '72px',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest leading-none mb-1.5"
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}
      >
        Count
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          className={`text-2xl font-black leading-none ${color}`}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {displayCount}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

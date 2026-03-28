import { motion, AnimatePresence } from 'framer-motion';
import { playChip, playDealButton } from '../../engine/sounds';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface BetControlsProps {
  currentBet: number;
  balance: number;
  onBetChange: (amount: number) => void;
  onDeal: () => void;
}

const CHIPS = [
  { value: 5,   label: '$5',   bg: '#991b1b', ring: '#fca5a5', innerRing: 'rgba(252,165,165,0.25)' },
  { value: 25,  label: '$25',  bg: '#166534', ring: '#86efac', innerRing: 'rgba(134,239,172,0.25)' },
  { value: 100, label: '$100', bg: '#1e3a5f', ring: '#93c5fd', innerRing: 'rgba(147,197,253,0.25)' },
  { value: 500, label: '$500', bg: '#581c87', ring: '#c4b5fd', innerRing: 'rgba(196,181,253,0.25)' },
];

interface StackChip {
  value: number;
  color: string;
  borderColor: string;
}

const CHIP_DENOM = [
  { value: 500, color: '#581c87', borderColor: 'rgba(139,92,246,0.6)' },
  { value: 100, color: '#1e3a5f', borderColor: 'rgba(59,130,246,0.6)' },
  { value: 25, color: '#166534', borderColor: 'rgba(16,185,129,0.6)' },
  { value: 5, color: '#991b1b', borderColor: 'rgba(239,68,68,0.6)' },
];

function betToChips(amount: number): StackChip[] {
  const chips: StackChip[] = [];
  let remaining = amount;
  for (const denom of CHIP_DENOM) {
    while (remaining >= denom.value) {
      chips.push({ value: denom.value, color: denom.color, borderColor: denom.borderColor });
      remaining -= denom.value;
    }
  }
  return chips;
}

export default function BetControls({ currentBet, balance, onBetChange, onDeal }: BetControlsProps) {
  const canDeal = currentBet > 0 && currentBet <= balance;
  const showClear = currentBet > 0;
  const animatedBet = useAnimatedNumber(currentBet);

  const handleChipClick = (chipValue: number) => {
    if (currentBet + chipValue <= balance) {
      playChip();
      onBetChange(currentBet + chipValue);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Bet + balance display */}
      <div className="flex items-center gap-10">
        <div className="text-center">
          <div className="text-xs text-white/35 uppercase tracking-[0.2em] mb-1">Balance</div>
          <div className="text-2xl font-black text-white/80">${balance.toLocaleString()}</div>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="text-center">
          <div className="text-xs text-white/35 uppercase tracking-[0.2em] mb-1">Your Bet</div>
          <div className="text-3xl font-black text-yellow-400 min-w-[80px]">
            {currentBet > 0 ? `$${animatedBet.toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      {/* Chip stack visualization — always rendered to prevent layout shift */}
      <div style={{ position: 'relative', height: 80, width: 64, margin: '16px auto 0', visibility: currentBet > 0 ? 'visible' : 'hidden' }}>
        <AnimatePresence>
          {betToChips(currentBet).slice(0, 10).map((chip, i) => (
            <motion.div
              key={`${chip.value}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25,
                delay: i * 0.08,
              }}
              style={{
                position: 'absolute',
                bottom: i * 4,
                left: 0,
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: chip.color,
                border: `3px dashed ${chip.borderColor}`,
                boxShadow: `0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 10px rgba(255,255,255,0.08)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: 'white',
                zIndex: i,
              }}
            >
              ${chip.value}
            </motion.div>
          ))}
        </AnimatePresence>
        {betToChips(currentBet).length > 10 && (
          <div style={{
            position: 'absolute',
            bottom: 44,
            left: 0,
            width: 64,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
          }}>
            x{betToChips(currentBet).length}
          </div>
        )}
      </div>

      {/* Chips row */}
      <div className="flex items-center" style={{ gap: '20px', marginTop: '24px' }}>
        {CHIPS.map((chip) => {
          const canAdd = currentBet + chip.value <= balance;
          return (
            <motion.button
              key={chip.value}
              whileHover={canAdd ? { scale: 1.12, y: -5, rotate: [0, -3, 3, 0] } : {}}
              whileTap={canAdd ? { scale: 0.88, y: 2 } : {}}
              onClick={() => handleChipClick(chip.value)}
              disabled={!canAdd}
              className="relative rounded-full flex items-center justify-center font-black select-none"
              style={{
                width: '116px',
                height: '116px',
                fontSize: 'var(--text-lg)',
                backgroundColor: canAdd ? chip.bg : '#1f2937',
                border: `3px dashed ${canAdd ? chip.ring : '#374151'}`,
                color: canAdd ? 'white' : '#4b5563',
                opacity: canAdd ? 1 : 0.3,
                boxShadow: canAdd
                  ? `0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 0 10px ${chip.innerRing}`
                  : 'none',
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
            >
              {chip.label}
            </motion.button>
          );
        })}

        {/* Always rendered to reserve space */}
        <motion.button
          whileHover={showClear ? { scale: 1.1 } : {}}
          whileTap={showClear ? { scale: 0.9 } : {}}
          onClick={() => { if (showClear) onBetChange(0); }}
          disabled={!showClear}
          title="Clear bet"
          className="w-12 h-12 rounded-full flex items-center justify-center text-base transition-all"
          style={{
            border: '1.5px solid var(--border-light)',
            color: showClear ? 'rgba(255,255,255,0.4)' : 'transparent',
            borderColor: showClear ? 'var(--border-light)' : 'transparent',
            cursor: showClear ? 'pointer' : 'default',
          }}
        >
          ✕
        </motion.button>
      </div>

      {/* Deal button — this is always the last element, so it anchors at the bottom */}
      <motion.button
        whileHover={canDeal ? { scale: 1.03, y: -2 } : {}}
        whileTap={canDeal ? { scale: 0.97 } : {}}
        onClick={() => { playDealButton(); onDeal(); }}
        disabled={!canDeal}
        className={`font-black uppercase tracking-widest ${canDeal ? 'cta-pulse' : ''}`}
        style={canDeal ? {
          marginTop: '28px',
          padding: '22px 120px',
          fontSize: 'var(--text-xl)',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
          border: 'none',
          color: '#1a1a1a',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        } : {
          marginTop: '28px',
          padding: '22px 120px',
          fontSize: 'var(--text-xl)',
          borderRadius: '18px',
          background: 'rgba(255,255,255,0.04)',
          border: 'none',
          color: 'rgba(255,255,255,0.18)',
          cursor: 'not-allowed',
          boxShadow: 'none',
        }}
      >
        Deal
      </motion.button>
    </div>
  );
}

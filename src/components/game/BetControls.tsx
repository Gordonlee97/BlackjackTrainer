import { motion } from 'framer-motion';
import { playChip } from '../../engine/sounds';

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

export default function BetControls({ currentBet, balance, onBetChange, onDeal }: BetControlsProps) {
  const canDeal = currentBet > 0 && currentBet <= balance;
  const showClear = currentBet > 0;

  const handleChipClick = (chipValue: number) => {
    if (currentBet + chipValue <= balance) {
      playChip();
      onBetChange(currentBet + chipValue);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
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
            {currentBet > 0 ? `$${currentBet.toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      {/* Chips row */}
      <div className="flex items-center gap-5">
        {CHIPS.map((chip) => {
          const canAdd = currentBet + chip.value <= balance;
          return (
            <motion.button
              key={chip.value}
              whileHover={canAdd ? { scale: 1.12, y: -5 } : {}}
              whileTap={canAdd ? { scale: 0.92 } : {}}
              onClick={() => handleChipClick(chip.value)}
              disabled={!canAdd}
              className="relative rounded-full flex items-center justify-center font-black select-none"
              style={{
                width: '96px',
                height: '96px',
                fontSize: '16px',
                backgroundColor: canAdd ? chip.bg : '#1f2937',
                border: `3px dashed ${canAdd ? chip.ring : '#374151'}`,
                color: canAdd ? 'white' : '#4b5563',
                opacity: canAdd ? 1 : 0.3,
                boxShadow: canAdd
                  ? `0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 0 9px ${chip.innerRing}`
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
            border: '1.5px solid rgba(255,255,255,0.12)',
            color: showClear ? 'rgba(255,255,255,0.4)' : 'transparent',
            borderColor: showClear ? 'rgba(255,255,255,0.12)' : 'transparent',
            cursor: showClear ? 'pointer' : 'default',
          }}
        >
          ✕
        </motion.button>
      </div>

      {/* Deal button */}
      <motion.button
        whileHover={canDeal ? { scale: 1.03, y: -2 } : {}}
        whileTap={canDeal ? { scale: 0.97 } : {}}
        onClick={onDeal}
        disabled={!canDeal}
        className={`font-black tracking-wide rounded-full ${canDeal ? 'cta-pulse' : ''}`}
        style={canDeal ? {
          padding: '20px 96px',
          fontSize: '20px',
          letterSpacing: '0.05em',
          background: 'linear-gradient(135deg, #92400e 0%, #b45309 25%, #f59e0b 50%, #b45309 75%, #92400e 100%)',
          border: '1.5px solid rgba(255,255,255,0.25)',
          color: '#111827',
          cursor: 'pointer',
        } : {
          padding: '20px 96px',
          fontSize: '20px',
          letterSpacing: '0.05em',
          background: 'rgba(255,255,255,0.04)',
          border: '1.5px solid rgba(255,255,255,0.06)',
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

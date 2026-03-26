import { motion } from 'framer-motion';

interface BetControlsProps {
  currentBet: number;
  balance: number;
  onBetChange: (amount: number) => void;
  onDeal: () => void;
}

const CHIPS = [
  { value: 5,   label: '$5',   bg: '#991b1b', ring: '#fca5a5' },
  { value: 25,  label: '$25',  bg: '#166534', ring: '#86efac' },
  { value: 100, label: '$100', bg: '#1e3a5f', ring: '#93c5fd' },
  { value: 500, label: '$500', bg: '#581c87', ring: '#c4b5fd' },
];

export default function BetControls({ currentBet, balance, onBetChange, onDeal }: BetControlsProps) {
  const canDeal = currentBet > 0 && currentBet <= balance;

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Bet + balance display */}
      <div className="flex items-center gap-10">
        <div className="text-center">
          <div className="text-xs text-white/35 uppercase tracking-[0.2em] mb-1.5">Balance</div>
          <div className="text-3xl font-black text-white/80">${balance.toLocaleString()}</div>
        </div>
        <div className="w-px h-14 bg-white/10" />
        <div className="text-center">
          <div className="text-xs text-white/35 uppercase tracking-[0.2em] mb-1.5">Your Bet</div>
          <div className="text-4xl font-black text-yellow-400 min-w-[96px]">
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
              whileHover={canAdd ? { scale: 1.15, y: -6 } : {}}
              whileTap={canAdd ? { scale: 0.9 } : {}}
              onClick={() => { if (canAdd) onBetChange(currentBet + chip.value); }}
              disabled={!canAdd}
              className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center font-black text-base select-none transition-opacity"
              style={{
                backgroundColor: canAdd ? chip.bg : '#1f2937',
                border: `3px dashed ${canAdd ? chip.ring : '#374151'}`,
                color: canAdd ? 'white' : '#4b5563',
                opacity: canAdd ? 1 : 0.3,
                boxShadow: canAdd ? `0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)` : 'none',
              }}
            >
              {chip.label}
            </motion.button>
          );
        })}

        {currentBet > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onBetChange(0)}
            title="Clear bet"
            className="w-12 h-12 rounded-full flex items-center justify-center text-base text-white/30 hover:text-white/60 transition-colors"
            style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}
          >
            ✕
          </motion.button>
        )}
      </div>

      {/* Deal button */}
      <motion.button
        whileHover={canDeal ? { scale: 1.03, y: -2 } : {}}
        whileTap={canDeal ? { scale: 0.97 } : {}}
        onClick={onDeal}
        disabled={!canDeal}
        className="font-black text-2xl tracking-wide rounded-full transition-opacity"
        style={canDeal ? {
          padding: '20px 96px',
          background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #b45309 100%)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 4px 28px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
          color: '#111827',
          cursor: 'pointer',
        } : {
          padding: '20px 96px',
          background: 'rgba(255,255,255,0.05)',
          border: '1.5px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.2)',
          cursor: 'not-allowed',
        }}
      >
        Deal
      </motion.button>
    </div>
  );
}

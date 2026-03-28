import { motion, LayoutGroup } from 'framer-motion';
import Card from './Card';
import HandTotal from './HandTotal';
import type { HandState } from '../../engine/types';

interface PlayerHandProps {
  hand: HandState;
  isActive: boolean;
  handIndex: number;
  totalHands: number;
  showHandTotals: boolean;
  settleBounce?: boolean;
}

const RESULT_CONFIG: Record<string, { classes: string; label: string; glow: string; shimmer?: boolean }> = {
  win:       { classes: 'bg-emerald-500 text-white',  label: 'Win',        glow: '0 0 20px rgba(16,185,129,0.4)' },
  blackjack: { classes: 'text-black',                 label: 'Blackjack!', glow: '0 0 30px rgba(250,204,21,0.6)', shimmer: true },
  lose:      { classes: 'bg-red-600/90 text-white',   label: 'Lose',       glow: '0 0 20px rgba(220,38,38,0.35)' },
  push:      { classes: 'bg-amber-500 text-black',    label: 'Push',       glow: '0 0 20px rgba(245,158,11,0.35)' },
  surrender: { classes: 'bg-slate-500 text-white',    label: 'Surrender',  glow: '0 0 16px rgba(100,116,139,0.3)' },
};

export default function PlayerHand({ hand, isActive, handIndex, totalHands, showHandTotals, settleBounce }: PlayerHandProps) {
  if (hand.cards.length === 0) return null;

  const result = hand.result ? RESULT_CONFIG[hand.result] : null;
  const showDots = isActive && !hand.isComplete;
  const isSettled = !!hand.result;

  // During split animation (1-card hands), don't dim either hand
  const isSplitAnimating = hand.isSplit && hand.cards.length === 1;
  const shouldDim = !isActive && totalHands > 1 && !isSplitAnimating && hand.cards.length >= 2;

  return (
    <div
      className={`flex flex-col items-center gap-4 transition-all duration-200 ${
        shouldDim ? 'opacity-50 scale-95' : ''
      }`}
    >
      {totalHands > 1 && (
        <div className="text-sm font-bold text-white/50 tracking-[0.2em] uppercase">
          Hand {handIndex + 1}
        </div>
      )}

      <LayoutGroup>
        <motion.div
          className="flex items-center justify-center"
          animate={settleBounce ? { y: [0, -3, 0], scale: [1, 1.008, 1] } : {}}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {hand.cards.map((card, i) => (
            <Card
              key={`player-${handIndex}-${i}`}
              card={card}
              index={i}
              delay={i < 2 ? i * 0.2 : 0}
              smoothLayout
              settled={isSettled}
            />
          ))}
        </motion.div>
      </LayoutGroup>

      {showHandTotals && <HandTotal cards={hand.cards} />}

      {/* Fixed-height slot for result badge OR dots — never changes size */}
      <div className="flex items-center justify-center" style={{ height: '44px' }}>
        {result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, mass: 0.8 }}
            className={`text-lg font-black rounded-full whitespace-nowrap ${result.classes} ${result.shimmer ? 'result-shimmer' : ''}`}
            style={{
              padding: '10px 28px',
              boxShadow: result.glow,
              ...(result.shimmer ? {
                background: 'linear-gradient(90deg, #facc15 0%, #fde68a 40%, #fbbf24 60%, #facc15 100%)',
                backgroundSize: '200% 100%',
              } : {}),
            }}
          >
            {result.label}
          </motion.div>
        ) : (
          <div className={`flex gap-2 items-center ${showDots ? '' : 'invisible'}`}>
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { motion, LayoutGroup } from 'framer-motion';
import Card from './Card';
import HandTotal from './HandTotal';
import { calculatePayout } from '../../engine/payout';
import type { HandState } from '../../engine/types';

interface PlayerHandProps {
  hand: HandState;
  isActive: boolean;
  handIndex: number;
  totalHands: number;
  showHandTotals: boolean;
  settleBounce?: boolean;
  /** Cards are locked in (stand/double/surrender) — compress and darken */
  lockedIn?: boolean;
  /** Result payoff state: 'win' brightens cards, 'lose' keeps dark, null = normal */
  resultPayoff?: 'win' | 'blackjack' | 'lose' | 'push' | null;
  /** Hide badges and payout text (e.g. during sweep animation) */
  hideOverlays?: boolean;
}

const RESULT_CONFIG: Record<string, { classes: string; label: string; glow: string; shimmer?: boolean }> = {
  win:       { classes: 'bg-emerald-500 text-white',  label: 'Win',        glow: '0 0 20px rgba(16,185,129,0.4)' },
  blackjack: { classes: 'text-black',                 label: 'Blackjack!', glow: '0 0 30px rgba(250,204,21,0.6)', shimmer: true },
  lose:      { classes: 'bg-red-600/90 text-white',   label: 'Lose',       glow: '0 0 20px rgba(220,38,38,0.35)' },
  push:      { classes: 'bg-amber-500 text-black',    label: 'Push',       glow: '0 0 20px rgba(245,158,11,0.35)' },
  surrender: { classes: 'bg-slate-500 text-white',    label: 'Surrender',  glow: '0 0 16px rgba(100,116,139,0.3)' },
};

export default function PlayerHand({ hand, isActive, handIndex, totalHands, showHandTotals, settleBounce, lockedIn, resultPayoff, hideOverlays }: PlayerHandProps) {
  if (hand.cards.length === 0) return null;

  const result = hand.result ? RESULT_CONFIG[hand.result] : null;
  const showDots = isActive && !hand.isComplete;
  const isSettled = !!hand.result;

  const payout = hand.result ? calculatePayout(hand) : 0;
  const showPayout = hand.result && payout !== 0;

  // During split animation (1-card hands), don't dim either hand
  const isSplitAnimating = hand.isSplit && hand.cards.length === 1;
  const shouldDim = !isActive && totalHands > 1 && !isSplitAnimating && hand.cards.length >= 2;

  return (
    <div
      className={`flex flex-col items-center gap-6 transition-all duration-200 ${
        shouldDim ? 'opacity-50 scale-95' : ''
      }`}
    >
      {totalHands > 1 && (
        <div className="text-sm font-bold text-white/50 tracking-[0.2em] uppercase">
          Hand {handIndex + 1}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <LayoutGroup>
          <motion.div
            className="flex items-center justify-center"
            animate={
              settleBounce
                ? { y: [0, -3, 0], scale: [1, 1.008, 1] }
                : lockedIn && !resultPayoff
                  ? { y: 2, scale: 0.98 }
                  : resultPayoff === 'win' || resultPayoff === 'blackjack'
                    ? { y: -4, scale: 1.02 }
                    : resultPayoff === 'lose'
                      ? { y: 2, scale: 0.98 }
                      : {}
            }
            transition={
              settleBounce
                ? { duration: 0.15, ease: 'easeOut' }
                : { type: 'spring', stiffness: 300, damping: 22 }
            }
            style={{
              filter:
                lockedIn && resultPayoff !== 'win' && resultPayoff !== 'blackjack' && resultPayoff !== 'push'
                  ? 'brightness(0.85) saturate(0.9)'
                  : 'brightness(1) saturate(1)',
              transition: 'filter 0.25s ease',
              gap: lockedIn ? 'var(--card-overlap)' : undefined,
            }}
          >
            {hand.cards.map((card, i) => (
              <Card
                key={`player-${handIndex}-${i}`}
                card={card}
                index={i}
                delay={i < 2 ? i * 0.2 : 0}
                smoothLayout
                settled={isSettled}
                dealId={handIndex * 10 + i}
                sweeping={hideOverlays}
                sweepDelay={i * 0.06}
              />
            ))}
          </motion.div>
        </LayoutGroup>

        {/* Floating payout text */}
        {showPayout && !hideOverlays && (
          <motion.span
            key={`payout-${hand.result}-${hand.cards.length}`}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -70, scale: [0.5, 1.15, 1.1, 0.85] }}
            transition={{
              delay: handIndex * 0.3,
              y: { duration: 2.5, ease: 'linear', delay: handIndex * 0.3 },
              scale: { duration: 2.5, ease: 'linear', times: [0, 0.08, 0.3, 1], delay: handIndex * 0.3 },
              opacity: { duration: 2.5, ease: 'linear', times: [0, 0.08, 0.65, 1], delay: handIndex * 0.3 },
            }}
            style={{
              position: 'absolute',
              ...(totalHands <= 1 || handIndex === totalHands - 1
                ? { left: 'calc(100% + 28px)', top: '40%' }
                : handIndex === 0
                  ? { right: 'calc(100% + 28px)', top: '40%' }
                  : { left: '50%', bottom: 'calc(100% + 16px)', transform: 'translateX(-50%)' }),
              fontSize: 'var(--payout-font)',
              fontWeight: 900,
              color: payout > 0 ? '#facc15' : '#ff3333',
              textShadow: payout > 0
                ? '0 0 24px rgba(250,204,21,0.6), 0 0 48px rgba(250,204,21,0.25), 0 2px 4px rgba(0,0,0,0.5)'
                : '0 0 24px rgba(255,51,51,0.7), 0 0 48px rgba(255,51,51,0.3), 0 2px 4px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {payout > 0 ? '+' : '−'}${Math.abs(payout).toLocaleString()}
          </motion.span>
        )}
      </div>

      {showHandTotals && <HandTotal cards={hand.cards} />}

      {/* Fixed-height slot for result badge OR dots — never changes size */}
      <div className="flex items-center justify-center" style={{ height: 'var(--badge-slot-h)', position: 'relative', top: 'var(--badge-offset-top)', opacity: hideOverlays ? 0 : 1, transition: 'opacity 0.15s' }}>
        {result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, mass: 0.8 }}
            className={`font-black rounded-full whitespace-nowrap ${result.classes} ${result.shimmer ? 'result-shimmer' : ''}`}
            style={{
              padding: 'var(--badge-padding)',
              fontSize: 'var(--badge-font)',
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

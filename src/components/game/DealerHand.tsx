import { motion, LayoutGroup } from 'framer-motion';
import Card from './Card';
import HandTotal from './HandTotal';
import type { HandState } from '../../engine/types';

interface DealerHandProps {
  hand: HandState;
  holeCardRevealed: boolean;
  showHandTotals: boolean;
  settleBounce?: boolean;
  /** Dealer turn is active — adds dramatic shadow to card area */
  suspense?: boolean;
  /** Cards are being swept off the table */
  sweeping?: boolean;
}

export default function DealerHand({ hand, holeCardRevealed, showHandTotals, settleBounce, suspense, sweeping }: DealerHandProps) {
  if (hand.cards.length === 0) return null;

  const isSettled = hand.isComplete;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-bold text-white/50 tracking-[0.25em] uppercase" style={{ opacity: sweeping ? 0 : 1, transition: 'opacity 0.15s' }}>
        Dealer
      </div>
      <LayoutGroup>
        <motion.div
          className="flex items-center justify-center"
          animate={
            settleBounce
              ? { y: [0, -3, 0], scale: [1, 1.008, 1] }
              : suspense
                ? { y: -2 }
                : {}
          }
          transition={
            settleBounce
              ? { duration: 0.15, ease: 'easeOut' }
              : { type: 'spring', stiffness: 200, damping: 25 }
          }
          style={{
            filter: suspense ? 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' : 'none',
            transition: 'filter 0.4s ease',
          }}
        >
          {hand.cards.map((card, i) => (
            <Card
              key={`dealer-${i}`}
              card={holeCardRevealed ? { ...card, faceUp: true } : card}
              index={i}
              delay={i < 2 ? i * 0.2 : 0}
              smoothLayout
              settled={isSettled}
              dealId={100 + i}
              sweeping={sweeping}
              sweepDelay={i * 0.06}
            />
          ))}
        </motion.div>
      </LayoutGroup>
      <div style={{ opacity: sweeping ? 0 : 1, transition: 'opacity 0.15s' }}>
        {showHandTotals && <HandTotal cards={hand.cards} hideHole={!holeCardRevealed} />}
      </div>
    </div>
  );
}

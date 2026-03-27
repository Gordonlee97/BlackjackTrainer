import { LayoutGroup } from 'framer-motion';
import Card from './Card';
import HandTotal from './HandTotal';
import type { HandState } from '../../engine/types';

interface DealerHandProps {
  hand: HandState;
  holeCardRevealed: boolean;
  showHandTotals: boolean;
}

export default function DealerHand({ hand, holeCardRevealed, showHandTotals }: DealerHandProps) {
  if (hand.cards.length === 0) return null;

  const isSettled = hand.isComplete;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-bold text-white/50 tracking-[0.25em] uppercase">
        Dealer
      </div>
      <LayoutGroup>
        <div className="flex items-center justify-center">
          {hand.cards.map((card, i) => (
            <Card
              key={`dealer-${i}`}
              card={holeCardRevealed ? { ...card, faceUp: true } : card}
              index={i}
              delay={i < 2 ? i * 0.2 : 0}
              smoothLayout
              settled={isSettled}
            />
          ))}
        </div>
      </LayoutGroup>
      {showHandTotals && <HandTotal cards={hand.cards} hideHole={!holeCardRevealed} />}
    </div>
  );
}

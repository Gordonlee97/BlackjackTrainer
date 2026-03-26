import Card from './Card';
import HandTotal from './HandTotal';
import type { HandState } from '../../engine/types';

interface DealerHandProps {
  hand: HandState;
  holeCardRevealed: boolean;
}

export default function DealerHand({ hand, holeCardRevealed }: DealerHandProps) {
  if (hand.cards.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs font-bold text-white/40 tracking-[0.25em] uppercase">
        Dealer
      </div>
      <div className="flex items-center justify-center">
        {hand.cards.map((card, i) => (
          <Card
            key={`dealer-${i}`}
            card={holeCardRevealed ? { ...card, faceUp: true } : card}
            index={i}
            delay={i * 0.12}
          />
        ))}
      </div>
      <HandTotal cards={hand.cards} hideHole={!holeCardRevealed} />
    </div>
  );
}

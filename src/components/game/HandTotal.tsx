import type { Card } from '../../engine/types';
import { handValue, isBust } from '../../engine/hand';

interface HandTotalProps {
  cards: Card[];
  hideHole?: boolean;
}

export default function HandTotal({ cards, hideHole }: HandTotalProps) {
  if (cards.length === 0) return null;

  const visibleCards = hideHole ? cards.filter(c => c.faceUp) : cards;
  if (visibleCards.length === 0) return null;

  const hv = handValue(visibleCards);
  const bust = isBust(visibleCards);

  let display: string;
  if (bust) {
    display = `Bust (${hv.total})`;
  } else if (hv.isSoft && hv.total <= 21) {
    display = `${hv.total - 10} / ${hv.total}`;
  } else {
    display = String(hv.total);
  }

  return (
    <span
      className={`inline-block text-base font-black px-4 py-1.5 rounded-full tracking-wide ${
        bust
          ? 'bg-red-600 text-white'
          : hv.total === 21
          ? 'bg-yellow-400 text-black'
          : 'bg-black/50 text-white'
      }`}
    >
      {display}
    </span>
  );
}

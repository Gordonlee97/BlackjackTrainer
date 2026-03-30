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

  const colorClasses = bust
    ? 'bg-red-600 text-white'
    : hv.total === 21
    ? 'bg-yellow-400 text-black'
    : 'bg-black/50 text-white';

  const glowShadow = bust
    ? '0 0 16px rgba(220,38,38,0.3)'
    : hv.total === 21
    ? '0 0 20px rgba(250,204,21,0.35)'
    : 'none';

  return (
    <span
      className={`inline-block font-black rounded-full tracking-wide whitespace-nowrap ${colorClasses}`}
      style={{
        padding: 'var(--badge-padding)',
        fontSize: 'var(--badge-font)',
        border: '1px solid var(--border-subtle)',
        boxShadow: glowShadow,
      }}
    >
      {display}
    </span>
  );
}

import Card from './Card';
import HandTotal from './HandTotal';
import type { HandState } from '../../engine/types';

interface PlayerHandProps {
  hand: HandState;
  isActive: boolean;
  handIndex: number;
  totalHands: number;
}

const RESULT_STYLES: Record<string, string> = {
  win:       'bg-emerald-500 text-white',
  blackjack: 'bg-yellow-400 text-black',
  lose:      'bg-red-600 text-white',
  push:      'bg-amber-500 text-black',
  surrender: 'bg-slate-500 text-white',
};

const RESULT_LABELS: Record<string, string> = {
  win:       '+ Win',
  blackjack: '★ Blackjack!',
  lose:      '− Lose',
  push:      '= Push',
  surrender: 'Surrender',
};

export default function PlayerHand({ hand, isActive, handIndex, totalHands }: PlayerHandProps) {
  if (hand.cards.length === 0) return null;

  return (
    <div
      className={`flex flex-col items-center gap-3 transition-all duration-200 ${
        !isActive && totalHands > 1 ? 'opacity-50 scale-95' : ''
      }`}
    >
      {totalHands > 1 && (
        <div className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase">
          Hand {handIndex + 1}
        </div>
      )}

      <div className="flex items-center justify-center">
        {hand.cards.map((card, i) => (
          <Card
            key={`player-${handIndex}-${i}`}
            card={card}
            index={i}
            delay={i * 0.12}
          />
        ))}
      </div>

      <HandTotal cards={hand.cards} />

      {hand.result && (
        <div className={`text-base font-black px-5 py-2 rounded-full ${RESULT_STYLES[hand.result] ?? 'bg-gray-600 text-white'}`}>
          {RESULT_LABELS[hand.result] ?? hand.result.toUpperCase()}
        </div>
      )}

      {isActive && !hand.isComplete && (
        <div className="flex gap-1.5 items-center">
          {[0, 150, 300].map((d) => (
            <div
              key={d}
              className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

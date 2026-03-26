import { motion } from 'framer-motion';
import type { Card as CardType } from '../../engine/types';

interface CardProps {
  card: CardType;
  index?: number;
  delay?: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

export default function Card({ card, index = 0, delay = 0 }: CardProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <motion.div
      className="relative shrink-0"
      style={{ marginLeft: index > 0 ? '-32px' : '0' }}
      initial={{ x: 200, y: -200, opacity: 0, rotateY: 180 }}
      animate={{ x: 0, y: 0, opacity: 1, rotateY: card.faceUp ? 0 : 180 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay }}
    >
      <div
        className="w-[120px] h-[168px] rounded-xl"
        style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }}
      >
        {card.faceUp ? (
          <CardFront rank={card.rank} suit={card.suit} isRed={isRed} />
        ) : (
          <CardBack />
        )}
      </div>
    </motion.div>
  );
}

function CardFront({ rank, suit, isRed }: { rank: string; suit: string; isRed: boolean }) {
  const color = isRed ? '#c41e3a' : '#111827';
  const symbol = SUIT_SYMBOLS[suit];

  return (
    <div
      className="w-full h-full rounded-xl flex flex-col justify-between p-2.5 select-none"
      style={{
        backgroundColor: '#f9f9f7',
        color,
        border: '1px solid rgba(0,0,0,0.14)',
      }}
    >
      <div className="text-left leading-none">
        <div className="text-[20px] font-black leading-none tracking-tight">{rank}</div>
        <div className="text-[15px] leading-none mt-0.5">{symbol}</div>
      </div>
      <div className="text-center text-[44px] leading-none">{symbol}</div>
      <div className="text-right leading-none rotate-180">
        <div className="text-[20px] font-black leading-none tracking-tight">{rank}</div>
        <div className="text-[15px] leading-none mt-0.5">{symbol}</div>
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 50%, #1e3a8a 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div className="w-full h-full p-2.5">
        <div
          className="w-full h-full rounded-lg border border-white/20"
          style={{
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 12px)',
          }}
        />
      </div>
    </div>
  );
}

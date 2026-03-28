import { motion } from 'framer-motion';
import type { Card as CardType } from '../../engine/types';

interface CardProps {
  card: CardType;
  index?: number;
  delay?: number;
  smoothLayout?: boolean;
  settled?: boolean;
  /** Unique index across all cards on table, used for rotation variation */
  dealId?: number;
  /** Card is being swept off the table */
  sweeping?: boolean;
  /** Stagger delay for sweep animation */
  sweepDelay?: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

export default function Card({ card, index = 0, delay = 0, smoothLayout = false, settled = false, dealId = 0, sweeping = false, sweepDelay = 0 }: CardProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  const sweepRotate = -5 + ((dealId % 7) - 3) * 3;

  return (
    <motion.div
      layout={smoothLayout}
      className="relative shrink-0 rounded-2xl"
      style={{ marginLeft: index > 0 ? '-48px' : '0', zIndex: index }}
      initial={{
        x: 350,
        y: -300,
        rotate: 18 + ((dealId % 5) - 2) * 2.5,
        scale: 0.85,
        opacity: 0.7,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
      animate={sweeping ? {
        x: 350,
        y: -300,
        rotate: sweepRotate,
        scale: 0.85,
        opacity: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      } : {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
        rotateY: card.faceUp ? 0 : 180,
        boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
      }}
      transition={sweeping ? {
        duration: 0.35,
        ease: [0.4, 0, 0.8, 0.2],
        delay: sweepDelay,
        opacity: { duration: 0.25, delay: sweepDelay + 0.08 },
      } : {
        type: 'spring',
        stiffness: 380,
        damping: 20,
        mass: 0.7,
        delay,
        rotateY: { type: 'spring', stiffness: 200, damping: 28, delay },
        layout: { type: 'spring', stiffness: 200, damping: 28 },
        opacity: { duration: 0.15, delay },
      }}
    >
      <div
        className={`w-[164px] h-[230px] rounded-2xl ${settled ? 'card-float' : ''}`}
        style={settled ? { animationDelay: `${index * 0.4}s` } : undefined}
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
      className="w-full h-full rounded-2xl flex flex-col justify-between select-none"
      style={{
        padding: '14px 16px',
        backgroundColor: '#f9f9f7',
        color,
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div className="text-left leading-none">
        <div className="font-black leading-none tracking-tight" style={{ fontSize: '28px' }}>{rank}</div>
        <div className="leading-none mt-1" style={{ fontSize: '21px' }}>{symbol}</div>
      </div>
      <div className="text-center leading-none" style={{ fontSize: '64px' }}>{symbol}</div>
      <div className="text-right leading-none rotate-180">
        <div className="font-black leading-none tracking-tight" style={{ fontSize: '28px' }}>{rank}</div>
        <div className="leading-none mt-1" style={{ fontSize: '21px' }}>{symbol}</div>
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 50%, #1e3a8a 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div className="w-full h-full" style={{ padding: '12px' }}>
        <div
          className="w-full h-full rounded-xl"
          style={{
            border: '1.5px solid rgba(255,255,255,0.18)',
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 12px)',
          }}
        />
      </div>
    </div>
  );
}

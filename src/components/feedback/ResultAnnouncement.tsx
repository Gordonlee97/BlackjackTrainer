import { motion } from 'framer-motion';
import type { HandState } from '../../engine/types';

interface ResultAnnouncementProps {
  hands: HandState[];
}

type Outcome = 'blackjack' | 'win' | 'lose' | 'push' | 'mixed';

function getOutcome(hands: HandState[]): Outcome {
  const results = hands.map(h => h.result).filter(Boolean) as string[];
  if (results.length === 0) return 'push';
  if (results.includes('blackjack')) return 'blackjack';
  const wins   = results.filter(r => r === 'win').length;
  const losses = results.filter(r => r === 'lose').length;
  const pushes = results.filter(r => r === 'push').length;
  if (wins > 0 && losses === 0 && pushes === 0) return 'win';
  if (losses > 0 && wins === 0) return 'lose';
  if (pushes === results.length) return 'push';
  return 'mixed';
}

const CONFIG: Record<Outcome, { label: string; sub: string; bg: string; border: string; textClass: string }> = {
  blackjack: {
    label: 'Blackjack!',
    sub: 'Pays 3:2',
    bg: 'linear-gradient(135deg, #ca8a04 0%, #facc15 50%, #ca8a04 100%)',
    border: 'rgba(253,224,71,0.4)',
    textClass: 'text-black',
  },
  win: {
    label: 'You Win',
    sub: '↑ Bet collected',
    bg: 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #166534 100%)',
    border: 'rgba(74,222,128,0.3)',
    textClass: 'text-white',
  },
  lose: {
    label: 'Dealer Wins',
    sub: '↓ Bet lost',
    bg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #7f1d1d 100%)',
    border: 'rgba(252,165,165,0.2)',
    textClass: 'text-white',
  },
  push: {
    label: 'Push',
    sub: 'Bet returned',
    bg: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #78350f 100%)',
    border: 'rgba(253,186,116,0.3)',
    textClass: 'text-white',
  },
  mixed: {
    label: 'Split Result',
    sub: 'See hands above',
    bg: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
    border: 'rgba(148,163,184,0.2)',
    textClass: 'text-white',
  },
};

export default function ResultAnnouncement({ hands }: ResultAnnouncementProps) {
  const outcome = getOutcome(hands);
  const cfg = CONFIG[outcome];

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`flex flex-col items-center justify-center px-12 py-5 shadow-2xl ${cfg.textClass}`}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        minWidth: '240px',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="font-black tracking-tight leading-none" style={{ fontSize: 'var(--text-3xl)' }}>{cfg.label}</div>
      <div className="opacity-70 mt-1.5 font-medium tracking-wide" style={{ fontSize: 'var(--text-sm)' }}>{cfg.sub}</div>
    </motion.div>
  );
}

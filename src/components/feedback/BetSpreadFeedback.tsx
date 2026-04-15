import { motion } from 'framer-motion';
import type { BetEvaluation } from '../../strategy/betSpread';

interface Props {
  betTimeTC: number;
  decisionTC: number | null;
  evaluation: BetEvaluation;
}

function formatTC(tc: number): string {
  if (tc > 0) return `+${tc}`;
  return String(tc);
}

function verdictIcon(v: BetEvaluation['verdict']): string {
  if (v === 'ok') return '✓';
  if (v === 'low') return '↓';
  return '↑';
}

export function BetSpreadFeedback({ betTimeTC, decisionTC, evaluation }: Props) {
  const { recommended, actualUnits, verdict } = evaluation;
  const recText = recommended.min === recommended.max
    ? `${recommended.min}u`
    : `${recommended.min}-${recommended.max}u`;

  const tcDelta = decisionTC != null && decisionTC !== betTimeTC;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'linear' }}
      className="inline-flex items-center rounded-full font-medium"
      style={{
        padding: '10px 28px',
        background: 'rgba(251, 191, 36, 0.15)',
        border: '1px solid rgba(251, 191, 36, 0.45)',
        color: 'var(--color-text-primary, #f5f5f5)',
        fontSize: 'var(--font-sm, 14px)',
      }}
    >
      Bet at TC {formatTC(betTimeTC)} • rec {recText} • you bet {actualUnits}u {verdictIcon(verdict)}
      {tcDelta && <span style={{ opacity: 0.7, marginLeft: 10 }}>— decided at TC {formatTC(decisionTC!)}</span>}
    </motion.div>
  );
}

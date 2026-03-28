import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStatsStore } from '../../store/statsStore';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

export default function StatsPanel() {
  const { handsPlayed, correctDecisions, totalDecisions, accuracy, currentStreak, bestStreak } = useStatsStore();

  const animatedHands = useAnimatedNumber(handsPlayed);
  const animatedAccuracy = useAnimatedNumber(accuracy, 400);
  const animatedStreak = useAnimatedNumber(currentStreak);
  const animatedBest = useAnimatedNumber(bestStreak);
  const animatedCorrect = useAnimatedNumber(correctDecisions);
  const animatedTotal = useAnimatedNumber(totalDecisions);

  const [milestoneHit, setMilestoneHit] = useState(false);
  const prevStreakRef = useRef(currentStreak);

  useEffect(() => {
    const milestones = [5, 10, 25, 50];
    const prev = prevStreakRef.current;
    const curr = currentStreak;
    prevStreakRef.current = curr;

    if (curr > prev && milestones.includes(curr)) {
      setMilestoneHit(true);
      const timer = setTimeout(() => setMilestoneHit(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);

  const accDisplay = totalDecisions > 0 ? `${animatedAccuracy.toFixed(1)}%` : '—';
  const accHighlight = accuracy >= 90 && totalDecisions > 0;
  const accWarning = accuracy < 70 && totalDecisions > 5;

  const streakValue = currentStreak > 0 ? animatedStreak : '—';

  return (
    <div
      className="flex items-center rounded-2xl"
      style={{
        padding: '18px 40px',
        gap: '36px',
        background: 'var(--surface-section)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <Stat label="Hands"    value={handsPlayed > 0 ? animatedHands : '—'} />
      <Sep />
      <Stat label="Accuracy" value={accDisplay} highlight={accHighlight} warn={accWarning} />
      <Sep />
      <Stat label="Correct"  value={totalDecisions > 0 ? `${animatedCorrect}/${animatedTotal}` : '—'} />
      <Sep />
      <div className="text-center min-w-[60px]">
        <div className="text-white/40 uppercase tracking-widest leading-none mb-2.5" style={{ fontSize: 'var(--text-xs)' }}>Streak</div>
        <div className={`font-black leading-none ${currentStreak >= 5 ? 'text-emerald-400' : 'text-white/80'}`} style={{ fontSize: 'var(--text-xl)' }}>
          <motion.span
            animate={milestoneHit ? {
              scale: [1, 1.3, 1],
              color: '#10b981',
              textShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 16px rgba(16,185,129,0.5)', '0 0 0px rgba(16,185,129,0)'],
            } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ display: 'inline-block' }}
          >
            {streakValue}
          </motion.span>
        </div>
      </div>
      <Sep />
      <Stat label="Best"     value={bestStreak > 0 ? animatedBest : '—'} />
    </div>
  );
}

function Stat({ label, value, highlight, warn }: {
  label: string;
  value: string | number;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="text-center min-w-[60px]">
      <div className="text-white/40 uppercase tracking-widest leading-none mb-2.5" style={{ fontSize: 'var(--text-xs)' }}>{label}</div>
      <div className={`font-black leading-none ${
        highlight ? 'text-emerald-400' : warn ? 'text-rose-400' : 'text-white/80'
      }`} style={{ fontSize: 'var(--text-xl)' }}>
        {value}
      </div>
    </div>
  );
}

function Sep() {
  return <div className="w-px h-8" style={{ background: 'var(--border-subtle)' }} />;
}

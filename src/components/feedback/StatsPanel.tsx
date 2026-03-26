import { useStatsStore } from '../../store/statsStore';

export default function StatsPanel() {
  const { handsPlayed, correctDecisions, totalDecisions, accuracy, currentStreak, bestStreak } = useStatsStore();

  const accDisplay = totalDecisions > 0 ? `${accuracy.toFixed(1)}%` : '—';
  const accHighlight = accuracy >= 90 && totalDecisions > 0;
  const accWarning = accuracy < 70 && totalDecisions > 5;

  return (
    <div
      className="flex items-center gap-6 px-6 py-3 rounded-2xl"
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Stat label="Hands"    value={handsPlayed || '—'} />
      <Sep />
      <Stat label="Accuracy" value={accDisplay} highlight={accHighlight} warn={accWarning} />
      <Sep />
      <Stat label="Correct"  value={totalDecisions > 0 ? `${correctDecisions}/${totalDecisions}` : '—'} />
      <Sep />
      <Stat label="Streak"   value={currentStreak || '—'} highlight={currentStreak >= 5} />
      <Sep />
      <Stat label="Best"     value={bestStreak || '—'} />
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
    <div className="text-center min-w-[56px]">
      <div className="text-xs text-white/40 uppercase tracking-widest leading-none mb-2">{label}</div>
      <div className={`text-2xl font-black leading-none ${
        highlight ? 'text-emerald-400' : warn ? 'text-rose-400' : 'text-white/80'
      }`}>
        {value}
      </div>
    </div>
  );
}

function Sep() {
  return <div className="w-px h-8 bg-white/10" />;
}

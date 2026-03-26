import { useSettingsStore } from '../../store/settingsStore';
import type { RuleSet } from '../../strategy/types';

interface SetupPageProps {
  onStart: () => void;
}

export default function SetupPage({ onStart }: SetupPageProps) {
  const { rules, setRules } = useSettingsStore();

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 140% 120% at 50% 30%, #1d7a40 0%, #125929 45%, #071a0e 100%)',
      }}
    >
      {/* ── Header bar ── */}
      <div
        className="shrink-0 flex items-center justify-center gap-5 py-6 px-8"
        style={{ background: 'rgba(0,0,0,0.28)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-5xl leading-none">🃏</span>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">Blackjack Trainer</h1>
          <p className="text-white/40 text-sm mt-1 tracking-wide">Practice perfect basic strategy</p>
        </div>
      </div>

      {/* ── Settings area ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-2">

          <SectionLabel>Game Rules</SectionLabel>
          <SettingsCard>
            <SelectRow
              label="Number of Decks"
              value={String(rules.numDecks)}
              options={[
                { value: '1', label: '1 Deck' },
                { value: '2', label: '2 Decks' },
                { value: '4', label: '4 Decks' },
                { value: '6', label: '6 Decks' },
                { value: '8', label: '8 Decks' },
              ]}
              onChange={(v) => setRules({ numDecks: Number(v) as RuleSet['numDecks'] })}
            />
            <SelectRow
              label="Dealer Soft 17"
              value={rules.dealerHitsSoft17 ? 'hit' : 'stand'}
              options={[
                { value: 'stand', label: 'Dealer Stands on Soft 17 (S17)' },
                { value: 'hit',   label: 'Dealer Hits on Soft 17 (H17)' },
              ]}
              onChange={(v) => setRules({ dealerHitsSoft17: v === 'hit' })}
            />
            <ToggleRow label="Surrender Allowed"        checked={rules.surrenderAllowed} onChange={(v) => setRules({ surrenderAllowed: v })} />
            <ToggleRow label="Double After Split (DAS)" checked={rules.dasAllowed}       onChange={(v) => setRules({ dasAllowed: v })} last />
            <ToggleRow label="Hit Split Aces"           checked={rules.hitSplitAces}     onChange={(v) => setRules({ hitSplitAces: v })} last />
          </SettingsCard>

          <div className="pt-3" />
          <SectionLabel>Training Options</SectionLabel>
          <SettingsCard>
            <SelectRow
              label="Practice Mode"
              value={rules.practiceMode}
              options={[
                { value: 'all',    label: 'All Hands' },
                { value: 'hard',   label: 'Hard Totals Only' },
                { value: 'soft',   label: 'Soft Totals Only' },
                { value: 'splits', label: 'Splits Only' },
              ]}
              onChange={(v) => setRules({ practiceMode: v as RuleSet['practiceMode'] })}
            />
            <SelectRow
              label="Wrong Move"
              value={rules.wrongMoveAction}
              options={[
                { value: 'execute', label: 'Show feedback, play move' },
                { value: 'block',   label: 'Block until correct move' },
              ]}
              onChange={(v) => setRules({ wrongMoveAction: v as RuleSet['wrongMoveAction'] })}
              last
            />
          </SettingsCard>

        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div
        className="shrink-0 flex flex-col items-center gap-3 py-6 px-8"
        style={{ background: 'rgba(0,0,0,0.28)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={onStart}
          className="w-full max-w-2xl rounded-full font-black text-lg tracking-wide transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{
            padding: '18px',
            background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #b45309 100%)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 4px 28px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            color: '#111827',
          }}
        >
          Start Training
        </button>
        <p className="text-white/20 text-xs tracking-widest">
          H = Hit &nbsp;·&nbsp; S = Stand &nbsp;·&nbsp; D = Double &nbsp;·&nbsp; P = Split &nbsp;·&nbsp; R = Surrender
        </p>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] px-1 pb-1">
      {children}
    </p>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  );
}

function SelectRow({ label, value, options, onChange, last }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={last ? {} : { borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="text-white/70 text-base font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-white text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(255,255,255,0.12)',
          minWidth: '220px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#1f2937' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, last }: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={last ? {} : { borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      onClick={() => onChange(!checked)}
    >
      <span className="text-white/70 text-base font-medium">{label}</span>
      <div
        className="relative shrink-0 ml-4 transition-all duration-200"
        style={{
          width: 48,
          height: 28,
          borderRadius: 9999,
          background: checked ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.1)',
          border: checked ? '1.5px solid rgba(245,158,11,0.7)' : '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: checked ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
        }}
      >
        <span
          className="absolute transition-transform duration-200"
          style={{
            top: 3,
            left: 3,
            width: 20,
            height: 20,
            borderRadius: 9999,
            background: checked ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  );
}

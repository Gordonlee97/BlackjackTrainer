import { useSettingsStore } from '../../store/settingsStore';
import CustomSelect from '../shared/CustomSelect';
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
      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-center gap-6"
        style={{
          padding: 'var(--modal-padding-y) var(--space-xl) var(--space-xl) var(--space-xl)',
          background: 'var(--surface-section)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ fontSize: 'var(--setup-logo)', lineHeight: 1 }}>🃏</span>
        <div>
          <h1 style={{ fontSize: 'var(--setup-title)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>Blackjack Trainer</h1>
          <p className="text-white/40 mt-2 tracking-wide" style={{ fontSize: 'var(--text-base)' }}>Practice perfect basic strategy</p>
        </div>
      </div>

      {/* ── Settings area ── */}
      <div className="flex-1 flex items-start justify-center px-8 overflow-y-auto">
        <div className="w-full max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingTop: 'var(--space-2xl)' }}>

          <Section label="Game Rules">
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
            <ToggleRow label="Double After Split (DAS)" checked={rules.dasAllowed}       onChange={(v) => setRules({ dasAllowed: v })} />
            <ToggleRow label="Hit Split Aces"           checked={rules.hitSplitAces}     onChange={(v) => setRules({ hitSplitAces: v })} last />
          </Section>

          <Section label="Training Options">
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
          </Section>

          <Section label="Display & Audio">
            <ToggleRow label="Show Hand Totals" checked={rules.showHandTotals} onChange={(v) => setRules({ showHandTotals: v })} />
            <SelectRow
              label="Running Count (Hi-Lo)"
              value={rules.showCount}
              options={[
                { value: 'off',    label: 'Off' },
                { value: 'always', label: 'Always Visible' },
                { value: 'hover',  label: 'Hover to Reveal' },
              ]}
              onChange={(v) => setRules({ showCount: v as RuleSet['showCount'] })}
            />
            <SliderRow label="Sound Volume" value={rules.soundVolume} onChange={(v) => setRules({ soundVolume: v })} last />
          </Section>

          {/* Scroll spacer — ensures settings don't butt against the CTA */}
          <div aria-hidden className="shrink-0" style={{ height: '60px' }} />

        </div>
      </div>

      {/* ── Footer / CTA — no dark background, just the button ── */}
      <div className="shrink-0 flex flex-col items-center gap-4 px-8 pb-8 pt-4">
        <button
          onClick={onStart}
          className="w-full max-w-2xl font-black uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98] cta-pulse cta-shine relative overflow-hidden"
          style={{
            padding: 'var(--cta-padding-y)',
            fontSize: 'var(--text-xl)',
            borderRadius: 'var(--cta-radius)',
            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
            border: 'none',
            color: '#1a1a1a',
            boxShadow: '0 8px 32px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Start Training
        </button>
        <p className="text-white/25 text-sm tracking-widest">
          H = Hit &nbsp;·&nbsp; S = Stand &nbsp;·&nbsp; D = Double &nbsp;·&nbsp; P = Split &nbsp;·&nbsp; R = Surrender
        </p>
      </div>
    </div>
  );
}

/* ── Shared components ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="uppercase tracking-[0.18em]"
        style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', padding: '0 4px', marginBottom: '10px' }}
      >
        {label}
      </p>
      <div
        style={{
          background: 'var(--surface-section)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {children}
      </div>
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
      className="flex items-center justify-between"
      style={{
        padding: 'var(--row-padding)',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
      <CustomSelect value={value} options={options} onChange={onChange} minWidth="260px" />
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
      className="flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={{
        padding: 'var(--row-padding)',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
      }}
      onClick={() => onChange(!checked)}
    >
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', fontWeight: 500 }}>{label}</span>
      <div
        className="relative shrink-0 transition-all duration-200"
        style={{
          width: 58,
          height: 34,
          marginLeft: '16px',
          borderRadius: 9999,
          background: checked ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.1)',
          border: checked ? '1.5px solid rgba(245,158,11,0.7)' : `1.5px solid var(--border-light)`,
          boxShadow: checked ? '0 0 14px rgba(245,158,11,0.25)' : 'none',
        }}
      >
        <span
          className="absolute transition-transform duration-200"
          style={{
            top: 4,
            left: 4,
            width: 24,
            height: 24,
            borderRadius: 9999,
            background: checked ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            transform: checked ? 'translateX(24px)' : 'translateX(0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  );
}

function SliderRow({ label, value, onChange, last }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: 'var(--row-padding)',
        gap: '24px',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', fontWeight: 500 }}>{label}</span>
      <div className="flex items-center gap-4" style={{ minWidth: '260px' }}>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #f59e0b ${value}%, rgba(255,255,255,0.12) ${value}%)`,
            accentColor: '#f59e0b',
          }}
        />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 600, width: '40px', textAlign: 'right' }}>{value}%</span>
      </div>
    </div>
  );
}

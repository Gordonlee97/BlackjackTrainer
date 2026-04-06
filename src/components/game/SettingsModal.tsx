import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';
import { useStatsStore } from '../../store/statsStore';
import CustomSelect from '../shared/CustomSelect';
import type { RuleSet } from '../../strategy/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBackToMenu: () => void;
}

export default function SettingsModal({ isOpen, onClose, onBackToMenu }: Props) {
  const { rules, setRules } = useSettingsStore();
  const resetStats = useStatsStore(s => s.reset);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--surface-overlay)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="settings-panel"
            className="relative flex flex-col"
            style={{
              width: 'min(92vw, 720px)',
              maxHeight: '85vh',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-modal)',
            }}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div
              className="shrink-0 flex items-center justify-between"
              style={{
                padding: 'var(--space-xl) var(--modal-padding-x) var(--space-lg) var(--modal-padding-x)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <h2 className="text-white font-black tracking-wide" style={{ fontSize: 'var(--modal-title-font)' }}>Settings</h2>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                style={{ fontSize: 'var(--text-xl)' }}
              >
                ✕
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div
              className="overflow-y-auto flex-1"
              style={{ padding: 'var(--space-xl) var(--modal-padding-x)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Game Rules */}
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
                    onChange={v => setRules({ numDecks: Number(v) as RuleSet['numDecks'] })}
                  />
                  <SelectRow
                    label="Dealer Soft 17"
                    value={rules.dealerHitsSoft17 ? 'hit' : 'stand'}
                    options={[
                      { value: 'stand', label: 'Stand on Soft 17 (S17)' },
                      { value: 'hit',   label: 'Hit on Soft 17 (H17)' },
                    ]}
                    onChange={v => setRules({ dealerHitsSoft17: v === 'hit' })}
                  />
                  <ToggleRow label="Surrender Allowed"        checked={rules.surrenderAllowed} onChange={v => setRules({ surrenderAllowed: v })} />
                  <ToggleRow label="Double After Split (DAS)" checked={rules.dasAllowed}       onChange={v => setRules({ dasAllowed: v })} />
                  <ToggleRow label="Hit Split Aces"           checked={rules.hitSplitAces}     onChange={v => setRules({ hitSplitAces: v })} last />
                </Section>

                {/* Training */}
                <Section label="Training">
                  <SelectRow
                    label="Practice Mode"
                    value={rules.practiceMode}
                    options={[
                      { value: 'all',    label: 'All Hands' },
                      { value: 'hard',   label: 'Hard Totals Only' },
                      { value: 'soft',   label: 'Soft Totals Only' },
                      { value: 'splits', label: 'Splits Only' },
                    ]}
                    onChange={v => setRules({ practiceMode: v as RuleSet['practiceMode'] })}
                  />
                  <SelectRow
                    label="Wrong Move"
                    value={rules.wrongMoveAction}
                    options={[
                      { value: 'execute', label: 'Show feedback, play move' },
                      { value: 'block',   label: 'Block until correct move' },
                    ]}
                    onChange={v => setRules({ wrongMoveAction: v as RuleSet['wrongMoveAction'] })}
                    last
                  />
                </Section>

                {/* Display */}
                <Section label="Display">
                  <ToggleRow label="Show Hand Totals" checked={rules.showHandTotals} onChange={v => setRules({ showHandTotals: v })} />
                  <SelectRow
                    label="Running Count (Hi-Lo)"
                    value={rules.showCount}
                    options={[
                      { value: 'off',    label: 'Off' },
                      { value: 'always', label: 'Always Visible' },
                      { value: 'hover',  label: 'Hover to Reveal' },
                    ]}
                    onChange={v => setRules({ showCount: v as RuleSet['showCount'] })}
                    last
                  />
                </Section>

                {/* Audio */}
                <Section label="Audio">
                  <SliderRow
                    label="Sound Volume"
                    value={rules.soundVolume}
                    onChange={v => setRules({ soundVolume: v })}
                    last
                  />
                </Section>

                {/* Data */}
                <Section label="Data">
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: 'var(--row-padding)' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>Reset All Stats</span>
                    {!confirmReset ? (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="cursor-pointer"
                        style={{
                          padding: '10px 24px',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'rgba(239,68,68,0.85)',
                          background: 'rgba(239,68,68,0.10)',
                          border: '1px solid rgba(239,68,68,0.20)',
                          borderRadius: '12px',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                      >
                        Reset
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 500 }}>Are you sure?</span>
                        <button
                          type="button"
                          onClick={() => { resetStats(); setConfirmReset(false); }}
                          className="cursor-pointer"
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'white',
                            background: 'rgba(239,68,68,0.65)',
                            border: '1px solid rgba(239,68,68,0.5)',
                            borderRadius: '12px',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.8)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.65)')}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="cursor-pointer"
                          style={{
                            padding: '10px 16px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.5)',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            borderRadius: '12px',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </Section>

              </div>
            </div>

            {/* ── Footer ── */}
            <div
              className="shrink-0 flex items-center justify-between"
              style={{
                padding: 'var(--space-md) var(--modal-padding-x) var(--space-lg) var(--modal-padding-x)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-white/30 text-sm">Changes apply on the next hand</p>
              <button
                onClick={onBackToMenu}
                className="text-white/35 hover:text-white/65 transition-colors text-sm font-semibold underline underline-offset-2"
              >
                Back to Menu
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Section wrapper ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="uppercase tracking-[0.18em]"
        style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 'var(--space-sm)' }}
      >
        {label}
      </p>
      <div
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Row components ── */

function SelectRow({ label, value, options, onChange, last }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: 'var(--row-padding)',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
      <CustomSelect value={value} options={options} onChange={onChange} />
    </div>
  );
}

function ToggleRow({ label, checked, onChange, last }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={{
        padding: 'var(--row-padding)',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={() => onChange(!checked)}
    >
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
      <div
        className="relative shrink-0 transition-all duration-200"
        style={{
          width: 'var(--toggle-w)', height: 'var(--toggle-h)',
          marginLeft: 'var(--space-md)',
          borderRadius: 9999,
          background: checked ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.1)',
          border: checked ? '1.5px solid rgba(245,158,11,0.7)' : '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: checked ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
        }}
      >
        <span
          className="absolute transition-transform duration-200"
          style={{
            top: 'var(--toggle-inset)', left: 'var(--toggle-inset)',
            width: 'var(--toggle-knob)', height: 'var(--toggle-knob)',
            borderRadius: 9999,
            background: checked ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            transform: checked ? 'translateX(calc(var(--toggle-w) - var(--toggle-knob) - var(--toggle-inset) * 2))' : 'translateX(0)',
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
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
      <div className="flex items-center gap-4" style={{ minWidth: 'clamp(160px, 20vw, 220px)' }}>
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

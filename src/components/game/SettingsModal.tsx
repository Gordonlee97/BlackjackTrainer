import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';
import type { RuleSet } from '../../strategy/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBackToMenu: () => void;
}

export default function SettingsModal({ isOpen, onClose, onBackToMenu }: Props) {
  const { rules, setRules } = useSettingsStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            key="settings-panel"
            className="relative flex flex-col overflow-hidden"
            style={{
              width: 'min(96vw, 560px)',
              maxHeight: '90vh',
              background: 'linear-gradient(160deg, #1c2b22 0%, #0f1c15 55%, #090f0b 100%)',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: '22px',
              boxShadow: '0 32px 100px rgba(0,0,0,0.85)',
            }}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="shrink-0 flex items-center justify-between px-8 pt-8 pb-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <h2 className="text-white font-black text-2xl tracking-wide">Settings</h2>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/80 transition-colors leading-none"
                style={{ fontSize: '36px', fontWeight: 300, marginTop: '-6px', marginRight: '-4px' }}
              >
                ×
              </button>
            </div>

            {/* Settings */}
            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
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
            </div>

            {/* Footer */}
            <div
              className="shrink-0 flex items-center justify-between px-8 py-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-white/35 uppercase tracking-[0.18em] mb-3">{label}</p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
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
  onChange: (v: string) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={last ? {} : { borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-white/75 text-base font-medium">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-white text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(255,255,255,0.12)',
          minWidth: '210px',
        }}
      >
        {options.map(opt => (
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
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={last ? {} : { borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      onClick={() => onChange(!checked)}
    >
      <span className="text-white/75 text-base font-medium">{label}</span>
      <div
        className="relative shrink-0 ml-4 transition-all duration-200"
        style={{
          width: 52, height: 30,
          borderRadius: 9999,
          background: checked ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.1)',
          border: checked ? '1.5px solid rgba(245,158,11,0.7)' : '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: checked ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
        }}
      >
        <span
          className="absolute transition-transform duration-200"
          style={{
            top: 3, left: 3,
            width: 22, height: 22,
            borderRadius: 9999,
            background: checked ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            transform: checked ? 'translateX(22px)' : 'translateX(0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  );
}

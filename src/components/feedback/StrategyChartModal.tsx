import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { buildStrategy } from '../../strategy/charts';
import type { RuleSet, ChartAction } from '../../strategy/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rules: RuleSet;
}

type TabId = 'hard' | 'soft' | 'pairs';
type DisplayAction = 'H' | 'S' | 'D' | 'P' | 'R';

const DEALER_COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const DEALER_LABELS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
  7: '7', 8: '8', 9: '9', 10: '10', 11: 'A',
};

const HARD_ROWS = [
  { key: 17, label: '17+' },
  { key: 16, label: '16' },
  { key: 15, label: '15' },
  { key: 14, label: '14' },
  { key: 13, label: '13' },
  { key: 12, label: '12' },
  { key: 11, label: '11' },
  { key: 10, label: '10' },
  { key: 9,  label: '9' },
  { key: 8,  label: '8−' },
];

const SOFT_ROWS = [
  { key: 20, label: 'A,9' },
  { key: 19, label: 'A,8' },
  { key: 18, label: 'A,7' },
  { key: 17, label: 'A,6' },
  { key: 16, label: 'A,5' },
  { key: 15, label: 'A,4' },
  { key: 14, label: 'A,3' },
  { key: 13, label: 'A,2' },
];

const PAIR_ROWS = [
  { key: 11, label: 'A,A' },
  { key: 10, label: '10,10' },
  { key: 9,  label: '9,9' },
  { key: 8,  label: '8,8' },
  { key: 7,  label: '7,7' },
  { key: 6,  label: '6,6' },
  { key: 5,  label: '5,5' },
  { key: 4,  label: '4,4' },
  { key: 3,  label: '3,3' },
  { key: 2,  label: '2,2' },
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'hard',  label: 'Hard Hands' },
  { id: 'soft',  label: 'Soft Hands' },
  { id: 'pairs', label: 'Pairs' },
];

const ACTION_CONFIG: Record<DisplayAction, { bg: string; name: string }> = {
  H: { bg: 'rgba(71,85,105,0.95)',  name: 'Hit' },
  S: { bg: 'rgba(4,120,87,0.95)',   name: 'Stand' },
  D: { bg: 'rgba(180,83,9,0.95)',   name: 'Double' },
  P: { bg: 'rgba(29,78,216,0.95)', name: 'Split' },
  R: { bg: 'rgba(190,18,60,0.95)', name: 'Surrender' },
};

const LEGEND: [DisplayAction, string][] = [
  ['H', 'Hit'],
  ['S', 'Stand'],
  ['D', 'Double'],
  ['P', 'Split'],
  ['R', 'Surrender'],
];

function resolveAction(action: ChartAction, rules: RuleSet): DisplayAction {
  switch (action) {
    case 'H':  return 'H';
    case 'S':  return 'S';
    case 'D':  return 'D';
    case 'Ds': return 'D';
    case 'P':  return 'P';
    case 'Ph': return rules.dasAllowed ? 'P' : 'H';
    case 'Pd': return rules.dasAllowed ? 'P' : 'D';
    case 'Rh': return rules.surrenderAllowed ? 'R' : 'H';
    case 'Rs': return rules.surrenderAllowed ? 'R' : 'S';
    case 'Rp': return rules.surrenderAllowed ? 'R' : 'P';
  }
}

export default function StrategyChartModal({ isOpen, onClose, rules }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('hard');
  const strategy = useMemo(() => buildStrategy(rules), [rules]);

  const rows = activeTab === 'hard' ? HARD_ROWS : activeTab === 'soft' ? SOFT_ROWS : PAIR_ROWS;
  const chart = strategy[activeTab];

  const rulesDesc = [
    `${rules.numDecks} Deck${rules.numDecks !== 1 ? 's' : ''}`,
    rules.dealerHitsSoft17 ? 'H17' : 'S17',
    rules.dasAllowed ? 'DAS' : 'No DAS',
    rules.surrenderAllowed ? 'Surrender' : 'No Surrender',
  ].join(' · ');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chart-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="chart-panel"
            className="relative flex flex-col overflow-hidden"
            style={{
              width: 'min(92vw, 920px)',
              maxHeight: '88vh',
              background: 'linear-gradient(160deg, #1c2b22 0%, #0f1c15 55%, #090f0b 100%)',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: '24px',
              boxShadow: '0 32px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
              margin: '24px',
            }}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="shrink-0 flex items-start justify-between"
              style={{
                padding: '32px 36px 20px 36px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div>
                <h2 className="text-white font-black tracking-wide leading-tight" style={{ fontSize: '24px' }}>
                  Perfect Basic Strategy
                </h2>
                <p className="text-white/40 mt-2 font-medium tracking-wide" style={{ fontSize: '14px' }}>{rulesDesc}</p>
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors shrink-0"
                style={{ fontSize: '22px' }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div
              className="shrink-0 flex gap-3"
              style={{
                padding: '16px 36px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {TABS.map(tab => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveTab(tab.id)}
                  className="rounded-full font-bold"
                  style={{
                    padding: '10px 24px',
                    fontSize: '15px',
                    color: activeTab === tab.id ? '#111827' : 'rgba(255,255,255,0.45)',
                    background: activeTab === tab.id
                      ? 'linear-gradient(135deg, #b45309, #f59e0b)'
                      : 'rgba(255,255,255,0.05)',
                    border: '1px solid',
                    borderColor: activeTab === tab.id
                      ? 'rgba(255,200,60,0.3)'
                      : 'rgba(255,255,255,0.07)',
                    boxShadow: activeTab === tab.id
                      ? '0 2px 14px rgba(245,158,11,0.35)'
                      : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1" style={{ padding: '20px 28px 16px 28px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="text-center mb-3">
                    <span className="text-white/30 text-sm font-semibold tracking-widest uppercase">
                      ← Dealer's Up Card →
                    </span>
                  </div>
                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '72px' }} />
                      {DEALER_COLS.map(d => <col key={d} />)}
                    </colgroup>
                    <thead>
                      <tr>
                        <th />
                        {DEALER_COLS.map(d => (
                          <th key={d} className="text-white/60 text-sm font-bold pb-2 text-center">
                            {DEALER_LABELS[d]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIdx) => {
                        const rowData = chart[row.key] ?? {};
                        return (
                          <motion.tr
                            key={row.key}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: rowIdx * 0.035, duration: 0.2 }}
                          >
                            <td
                              className="text-white/85 font-black text-center"
                              style={{
                                fontSize: '13px',
                                padding: '3px 6px',
                                background: 'rgba(255,255,255,0.07)',
                                borderRadius: '7px',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {row.label}
                            </td>
                            {DEALER_COLS.map((d, colIdx) => {
                              const rawAction = rowData[d];
                              if (rawAction === undefined) {
                                return <td key={d} />;
                              }
                              const resolved = resolveAction(rawAction, rules);
                              const cfg = ACTION_CONFIG[resolved];
                              return (
                                <motion.td
                                  key={d}
                                  className="p-[3px]"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{
                                    delay: rowIdx * 0.035 + colIdx * 0.012,
                                    duration: 0.18,
                                  }}
                                >
                                  <div
                                    className="flex items-center justify-center font-black text-white rounded-md"
                                    style={{
                                      height: 42,
                                      background: cfg.bg,
                                      fontSize: '14px',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    {resolved}
                                  </div>
                                </motion.td>
                              );
                            })}
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div
              className="shrink-0 flex flex-wrap items-center gap-x-6 gap-y-3"
              style={{
                padding: '20px 36px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {LEGEND.map(([key, name]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center font-black text-white rounded-md"
                    style={{
                      width: 34, height: 34,
                      background: ACTION_CONFIG[key].bg,
                      fontSize: '14px',
                    }}
                  >
                    {key}
                  </div>
                  <span className="text-white/50 text-sm font-semibold">{name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

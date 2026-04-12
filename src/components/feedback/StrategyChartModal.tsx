import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { buildStrategy } from '../../strategy/charts';
import { getDeviations } from '../../strategy/deviations';
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
  { key: 8,  label: '8\u2212' },
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

const ACTION_CONFIG: Record<DisplayAction, { bg: string; devBg: string; name: string }> = {
  H: { bg: 'rgba(71,85,105,0.95)',  devBg: 'rgba(90,105,125,0.95)',  name: 'Hit' },
  S: { bg: 'rgba(4,120,87,0.95)',   devBg: 'rgba(15,140,100,0.95)',  name: 'Stand' },
  D: { bg: 'rgba(180,83,9,0.95)',   devBg: 'rgba(195,100,25,0.95)',  name: 'Double' },
  P: { bg: 'rgba(29,78,216,0.95)',  devBg: 'rgba(50,95,230,0.95)',   name: 'Split' },
  R: { bg: 'rgba(190,18,60,0.95)',  devBg: 'rgba(210,40,75,0.95)',   name: 'Surrender' },
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

/* ── Deviation chart overlay ── */

interface DeviationDisplay {
  threshold: number;
  direction: 'gte' | 'lte';
  action: ChartAction;
  usesRunningCount?: boolean;
}

type DeviationMap = Map<string, DeviationDisplay[]>;

const SURRENDER_ACTIONS: ChartAction[] = ['Rh', 'Rs', 'Rp'];

function buildDeviationMap(rules: RuleSet): DeviationMap {
  const deviations = getDeviations(rules);
  const map: DeviationMap = new Map();

  for (const d of deviations) {
    // Skip surrender-action deviations when surrender isn't available
    if (SURRENDER_ACTIONS.includes(d.action) && !rules.surrenderAllowed) continue;
    // Skip no-surrender-only deviations when surrender IS available
    if (d.onlyIfNoSurrender && rules.surrenderAllowed) continue;

    const key = `${d.handType}:${d.playerTotal}:${d.dealerUp}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({
      threshold: d.threshold,
      direction: d.direction,
      action: d.action,
      usesRunningCount: d.usesRunningCount,
    });
  }

  return map;
}

/**
 * Format deviation index in BJA notation:
 *   3+  = TC 3 or higher
 *  -1-  = TC -1 or lower
 *   0+  = any positive running count (RC > 0)
 *   0−  = any negative running count (RC < 0)
 */
function formatIndex(threshold: number, direction: 'gte' | 'lte', usesRunningCount?: boolean): string {
  if (usesRunningCount) {
    return direction === 'gte' ? '0+' : '0\u2212';
  }
  const suffix = direction === 'gte' ? '+' : '\u2212';
  return `${threshold}${suffix}`;
}

/** Check if a deviation produces a different resolved action than the base chart */
function isEffectiveDeviation(dev: DeviationDisplay, baseAction: ChartAction, rules: RuleSet): boolean {
  return resolveAction(dev.action, rules) !== resolveAction(baseAction, rules);
}

export default function StrategyChartModal({ isOpen, onClose, rules }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('hard');
  const [showDeviations, setShowDeviations] = useState(false);
  const strategy = useMemo(() => buildStrategy(rules), [rules]);
  const deviationMap = useMemo(() => buildDeviationMap(rules), [rules]);

  const canShowDeviations = rules.numDecks >= 4;

  const rows = activeTab === 'hard' ? HARD_ROWS : activeTab === 'soft' ? SOFT_ROWS : PAIR_ROWS;
  const chart = strategy[activeTab];

  const rulesDesc = [
    `${rules.numDecks} Deck${rules.numDecks !== 1 ? 's' : ''}`,
    rules.dealerHitsSoft17 ? 'H17' : 'S17',
    rules.dasAllowed ? 'DAS' : 'No DAS',
    rules.surrenderAllowed ? 'Surrender' : 'No Surrender',
  ].join(' \u00b7 ');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chart-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--surface-overlay)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="chart-panel"
            className="relative flex flex-col overflow-hidden"
            style={{
              width: 'min(92vw, 920px)',
              maxHeight: '88vh',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-modal)',
              margin: 'var(--space-lg)',
            }}
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="shrink-0 flex items-start justify-between"
              style={{
                padding: 'var(--space-xl) var(--modal-padding-x) var(--space-md) var(--modal-padding-x)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div>
                <h2 className="text-white font-black tracking-wide leading-tight" style={{ fontSize: 'var(--modal-title-font)' }}>
                  {showDeviations && canShowDeviations ? 'Deviation Chart' : 'Perfect Basic Strategy'}
                </h2>
                <p className="text-white/40 mt-2 font-medium tracking-wide" style={{ fontSize: 'var(--text-sm)' }}>{rulesDesc}</p>
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors shrink-0"
                style={{ fontSize: 'var(--text-xl)' }}
              >
                ✕
              </button>
            </div>

            {/* Tabs + Deviation Toggle */}
            <div
              className="shrink-0 flex items-center justify-between"
              style={{
                padding: 'var(--space-md) var(--modal-padding-x)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex gap-3">
                {TABS.map(tab => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="rounded-full font-bold"
                    style={{
                      padding: 'var(--space-sm) var(--space-lg)',
                      fontSize: 'var(--text-base)',
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

              {/* Deviations toggle */}
              {canShowDeviations && (
                <button
                  onClick={() => setShowDeviations(v => !v)}
                  className="flex items-center gap-2 rounded-full font-bold transition-all"
                  style={{
                    padding: '6px 14px',
                    fontSize: 'var(--text-sm)',
                    color: showDeviations ? 'rgba(251,191,36,0.95)' : 'rgba(255,255,255,0.35)',
                    background: showDeviations ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid',
                    borderColor: showDeviations ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Toggle track */}
                  <div
                    className="relative rounded-full transition-colors"
                    style={{
                      width: '28px',
                      height: '16px',
                      background: showDeviations ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <div
                      className="absolute top-[2px] rounded-full transition-all"
                      style={{
                        width: '12px',
                        height: '12px',
                        background: showDeviations ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                        left: showDeviations ? '14px' : '2px',
                      }}
                    />
                  </div>
                  Deviations
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-auto" style={{ padding: 'var(--space-md) var(--space-xl) var(--space-md) var(--space-xl)', height: 'var(--chart-table-h)' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className="text-center mb-3">
                    <span className="text-white/30 text-sm font-semibold tracking-widest uppercase">
                      &larr; Dealer's Up Card &rarr;
                    </span>
                  </div>
                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: 'var(--chart-row-header-w)' }} />
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
                      {rows.map(row => {
                        const rowData = chart[row.key] ?? {};
                        return (
                          <tr key={row.key}>
                            <td
                              className="text-white/85 font-black text-center"
                              style={{
                                fontSize: 'var(--chart-cell-font)',
                                padding: '3px 6px',
                                background: 'rgba(255,255,255,0.07)',
                                borderRadius: '7px',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {row.label}
                            </td>
                            {DEALER_COLS.map(d => {
                              const rawAction = rowData[d];
                              if (rawAction === undefined) {
                                return <td key={d} />;
                              }
                              return (
                                <td key={d} className="p-[3px]">
                                  <ChartCell
                                    rawAction={rawAction}
                                    rules={rules}
                                    handType={activeTab}
                                    playerTotal={row.key}
                                    dealerUp={d}
                                    showDeviations={showDeviations && canShowDeviations}
                                    deviationMap={deviationMap}
                                  />
                                </td>
                              );
                            })}
                          </tr>
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
                padding: 'var(--space-md) var(--modal-padding-x)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {LEGEND.map(([key, name]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center font-black text-white rounded-md"
                    style={{
                      width: 'var(--chart-legend-size)', height: 'var(--chart-legend-size)',
                      background: ACTION_CONFIG[key].bg,
                      fontSize: 'var(--chart-cell-font)',
                    }}
                  >
                    {key}
                  </div>
                  <span className="text-white/50 text-sm font-semibold">{name}</span>
                </div>
              ))}
              {showDeviations && canShowDeviations && (
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center font-black rounded-md"
                    style={{
                      width: 'var(--chart-legend-size)', height: 'var(--chart-legend-size)',
                      background: 'rgba(71,85,105,0.95)',
                      color: '#ffeb3b',
                      fontSize: 'var(--chart-cell-font)',
                    }}
                  >
                    #
                  </div>
                  <span className="text-white/50 text-sm font-semibold">Deviation Index</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Individual chart cell ── */

interface ChartCellProps {
  rawAction: ChartAction;
  rules: RuleSet;
  handType: TabId;
  playerTotal: number;
  dealerUp: number;
  showDeviations: boolean;
  deviationMap: DeviationMap;
}

function ChartCell({ rawAction, rules, handType, playerTotal, dealerUp, showDeviations, deviationMap }: ChartCellProps) {
  const resolved = resolveAction(rawAction, rules);
  const cfg = ACTION_CONFIG[resolved];

  // Check for deviations on this cell
  const deviationKey = `${handType}:${playerTotal}:${dealerUp}`;
  const devs = showDeviations ? deviationMap.get(deviationKey) : undefined;
  const effectiveDevs = devs?.filter(d => isEffectiveDeviation(d, rawAction, rules));
  const hasDeviation = effectiveDevs && effectiveDevs.length > 0;

  if (!hasDeviation) {
    // Normal cell — base action
    return (
      <div
        className="flex items-center justify-center font-black text-white rounded-md"
        style={{
          height: 'var(--chart-cell-h)',
          background: cfg.bg,
          fontSize: 'var(--chart-cell-font)',
          letterSpacing: '0.04em',
        }}
      >
        {resolved}
      </div>
    );
  }

  // Deviation cell — lighter shade + glow border
  if (effectiveDevs.length === 1) {
    const dev = effectiveDevs[0];
    const devResolved = resolveAction(dev.action, rules);
    const devCfg = ACTION_CONFIG[devResolved];
    return (
      <div
        className="dev-cell flex items-center justify-center font-black rounded-md"
        style={{
          height: 'var(--chart-cell-h)',
          background: devCfg.devBg,
          fontSize: 'var(--chart-cell-font)',
          color: '#ffeb3b',
          letterSpacing: '0.02em',
        }}
      >
        {formatIndex(dev.threshold, dev.direction, dev.usesRunningCount)}
      </div>
    );
  }

  // Two deviations — stack them, color by the higher-threshold deviation
  const sorted = [...effectiveDevs].sort((a, b) => a.threshold - b.threshold);
  const primaryDev = sorted[sorted.length - 1];
  const devResolved = resolveAction(primaryDev.action, rules);
  const devCfg = ACTION_CONFIG[devResolved];
  return (
    <div
      className="dev-cell flex flex-col items-center justify-center font-black rounded-md"
      style={{
        height: 'var(--chart-cell-h)',
        background: devCfg.devBg,
        fontSize: 'calc(var(--chart-cell-font) * 0.78)',
        color: '#ffeb3b',
        lineHeight: '1.1',
        gap: '1px',
      }}
    >
      {sorted.map((dev, i) => (
        <span key={i}>{formatIndex(dev.threshold, dev.direction, dev.usesRunningCount)}</span>
      ))}
    </div>
  );
}

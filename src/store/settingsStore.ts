import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RuleSet } from '../strategy/types';
import { DEFAULT_RULES } from '../strategy/types';

interface SettingsState {
  rules: RuleSet;
  setRules: (rules: Partial<RuleSet>) => void;
  resetRules: () => void;
}

/**
 * Saved settings predate any rule added later, and persist's default merge is
 * shallow, so a saved `rules` object would drop new fields. Merge rules deeply.
 */
export function mergePersistedSettings(persisted: unknown, current: SettingsState): SettingsState {
  const saved = (persisted ?? {}) as Partial<SettingsState>;
  return { ...current, ...saved, rules: { ...DEFAULT_RULES, ...current.rules, ...saved.rules } };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      rules: DEFAULT_RULES,
      setRules: (partial) =>
        set((state) => {
          const nextRules = { ...state.rules, ...partial };
          // Guard: disable drill if dependencies become invalid
          if (!nextRules.useDeviations || nextRules.numDecks < 4) {
            nextRules.deviationsPracticeMode = false;
          }
          return { rules: nextRules };
        }),
      resetRules: () => set({ rules: DEFAULT_RULES }),
    }),
    { name: 'blackjack-settings', merge: mergePersistedSettings }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RuleSet } from '../strategy/types';
import { DEFAULT_RULES } from '../strategy/types';

interface SettingsState {
  rules: RuleSet;
  setRules: (rules: Partial<RuleSet>) => void;
  resetRules: () => void;
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
    { name: 'blackjack-settings' }
  )
);

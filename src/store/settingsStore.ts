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
        set((state) => ({ rules: { ...state.rules, ...partial } })),
      resetRules: () => set({ rules: DEFAULT_RULES }),
    }),
    { name: 'blackjack-settings' }
  )
);

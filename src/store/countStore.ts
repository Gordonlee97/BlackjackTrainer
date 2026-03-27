import { create } from 'zustand';
import type { Card } from '../engine/types';
import { hiLoValue } from '../engine/counting';

interface CountState {
  runningCount: number;
  updateCount: (cards: Card[]) => void;
  resetCount: () => void;
}

export const useCountStore = create<CountState>((set) => ({
  runningCount: 0,

  updateCount: (cards) =>
    set((state) => ({
      runningCount: state.runningCount + cards.reduce((sum, c) => sum + hiLoValue(c), 0),
    })),

  resetCount: () => set({ runningCount: 0 }),
}));

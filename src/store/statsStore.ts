import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StatsState {
  handsPlayed: number;
  correctDecisions: number;
  totalDecisions: number;
  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  recordDecision: (correct: boolean) => void;
  recordHandPlayed: () => void;
  reset: () => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      handsPlayed: 0,
      correctDecisions: 0,
      totalDecisions: 0,
      currentStreak: 0,
      bestStreak: 0,
      accuracy: 0,
      recordDecision: (correct) =>
        set((state) => {
          const totalDecisions = state.totalDecisions + 1;
          const correctDecisions = state.correctDecisions + (correct ? 1 : 0);
          const currentStreak = correct ? state.currentStreak + 1 : 0;
          const bestStreak = Math.max(state.bestStreak, currentStreak);
          return {
            totalDecisions,
            correctDecisions,
            currentStreak,
            bestStreak,
            accuracy: totalDecisions > 0 ? (correctDecisions / totalDecisions) * 100 : 0,
          };
        }),
      recordHandPlayed: () =>
        set((state) => ({ handsPlayed: state.handsPlayed + 1 })),
      reset: () =>
        set({
          handsPlayed: 0,
          correctDecisions: 0,
          totalDecisions: 0,
          currentStreak: 0,
          bestStreak: 0,
          accuracy: 0,
        }),
    }),
    { name: 'blackjack-stats' }
  )
);

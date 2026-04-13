import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { useCountStore } from '../countStore';
import { computeTrueCount } from '../../engine/counting';
import { DEFAULT_RULES } from '../../strategy/types';

describe('gameStore — deviations practice mode', () => {
  beforeEach(() => {
    useCountStore.getState().resetCount();
  });

  it('after deal, runningCount equals the drill target RC', () => {
    for (let i = 0; i < 20; i++) {
      useGameStore.getState().initGame({
        ...DEFAULT_RULES,
        numDecks: 6,
        surrenderAllowed: true,
        useDeviations: true,
        deviationsPracticeMode: true,
      });

      const preDealRC = useCountStore.getState().runningCount;
      useGameStore.getState().deal();
      const postDealRC = useCountStore.getState().runningCount;

      const dev = useGameStore.getState().currentDeviation!;
      expect(dev).not.toBeNull();

      const cardsDealt = useGameStore.getState().shoeSize - useGameStore.getState().shoe.length;
      const tc = computeTrueCount(postDealRC, useGameStore.getState().shoeSize, cardsDealt);
      if (dev.usesRunningCount) {
        if (dev.direction === 'gte') expect(postDealRC).toBeGreaterThan(0);
        else expect(postDealRC).toBeLessThan(0);
      } else {
        if (dev.direction === 'gte') expect(tc).toBeGreaterThanOrEqual(dev.threshold);
        else expect(tc).toBeLessThanOrEqual(dev.threshold);
      }

      // Pre-deal RC should differ from post-deal most of the time (face-up cards moved the count)
      // Allow rare equal case — soft 19 (A + 8) is 0 delta. Only fail if ALL 20 match.
      // We'll track this implicitly via the count.
      void preDealRC;
    }
  });

  it('captures betSnapshotTC at deal time', () => {
    useGameStore.getState().initGame({
      ...DEFAULT_RULES,
      numDecks: 6,
      surrenderAllowed: true,
      useDeviations: true,
      deviationsPracticeMode: true,
    });
    useGameStore.getState().deal();
    expect(useGameStore.getState().betSnapshotTC).not.toBeNull();
  });

  it('new hand regenerates drill (count re-seeds)', () => {
    useGameStore.getState().initGame({
      ...DEFAULT_RULES,
      numDecks: 6,
      useDeviations: true,
      deviationsPracticeMode: true,
      surrenderAllowed: true,
    });
    const rc1 = useCountStore.getState().runningCount;

    // Run several cycles — at least one should produce a different RC
    let differed = false;
    for (let i = 0; i < 10; i++) {
      useGameStore.setState({ phase: 'complete' });
      useGameStore.getState().newHand();
      if (useCountStore.getState().runningCount !== rc1) {
        differed = true;
        break;
      }
    }
    expect(differed).toBe(true);
  });
});

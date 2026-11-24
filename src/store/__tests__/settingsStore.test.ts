import { describe, it, expect } from 'vitest';
import { mergePersistedSettings, useSettingsStore } from '../settingsStore';
import { DEFAULT_RULES } from '../../strategy/types';

describe('mergePersistedSettings', () => {
  it('fills rules added since the settings were saved with their defaults', () => {
    const saved = { rules: { numDecks: 6, dealerHitsSoft17: false } };
    const merged = mergePersistedSettings(saved, useSettingsStore.getState());
    expect(merged.rules.numDecks).toBe(6);
    expect(merged.rules.dealerHitsSoft17).toBe(false);
    expect(merged.rules.betUnit).toBe(DEFAULT_RULES.betUnit);
  });

  it('keeps the current state when nothing was saved', () => {
    const current = useSettingsStore.getState();
    expect(mergePersistedSettings(undefined, current).rules).toEqual(current.rules);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installChromeFake, type ChromeFake } from '../testing/chromeFake';
import {
  getStorageValue,
  onStorageValueChanged,
  removeStorageValue,
  setStorageValue,
} from './storage';

let chromeFake: ChromeFake;

beforeEach(() => {
  chromeFake = installChromeFake();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('typed storage', () => {
  it('returns the schema default value when storage has no value', async () => {
    await expect(getStorageValue('fillerSettings')).resolves.toEqual({
      defaultPreset: 'valid',
      defaultSeed: 'jpqa-001',
      requireConfirmation: true,
    });
  });

  it('sets and gets a typed value', async () => {
    const settings = {
      defaultPreset: 'boundary' as const,
      defaultSeed: 'boundary-001',
      requireConfirmation: false,
    };
    await setStorageValue('fillerSettings', settings);

    await expect(getStorageValue('fillerSettings')).resolves.toEqual(settings);
  });

  it('malformedな保存値は項目ごとに安全な既定値へ戻す', async () => {
    await chromeFake.chrome.storage.local.set({
      fillerSettings: {
        defaultPreset: 'unexpected',
        defaultSeed: 42,
        requireConfirmation: 'yes',
      },
    });

    await expect(getStorageValue('fillerSettings')).resolves.toEqual({
      defaultPreset: 'valid',
      defaultSeed: 'jpqa-001',
      requireConfirmation: true,
    });
  });

  it('removes a value and falls back to the schema default value', async () => {
    await setStorageValue('fillerSettings', {
      defaultPreset: 'invalid',
      defaultSeed: 'remove-me',
      requireConfirmation: false,
    });
    await removeStorageValue('fillerSettings');

    await expect(getStorageValue('fillerSettings')).resolves.toEqual({
      defaultPreset: 'valid',
      defaultSeed: 'jpqa-001',
      requireConfirmation: true,
    });
  });

  it('subscribes to typed storage changes for a key', async () => {
    const listener = vi.fn();
    const unsubscribe = onStorageValueChanged('fillerSettings', listener);
    const before = {
      defaultPreset: 'valid' as const,
      defaultSeed: 'before',
      requireConfirmation: true,
    };
    const after = {
      defaultPreset: 'boundary' as const,
      defaultSeed: 'after',
      requireConfirmation: false,
    };

    await setStorageValue('fillerSettings', before);
    listener.mockClear();
    await setStorageValue('fillerSettings', after);

    expect(listener).toHaveBeenCalledWith(after, before);

    unsubscribe();
    expect(
      chromeFake.chrome.storage.onChanged.removeListener,
    ).toHaveBeenCalledTimes(1);
  });

  it('storage change listenerにもruntime validationを適用する', async () => {
    const listener = vi.fn();
    const unsubscribe = onStorageValueChanged('fillerSettings', listener);

    await chromeFake.chrome.storage.local.set({
      fillerSettings: {
        defaultPreset: null,
        defaultSeed: 'safe-seed',
        requireConfirmation: false,
      },
    });

    expect(listener).toHaveBeenCalledWith(
      {
        defaultPreset: 'valid',
        defaultSeed: 'safe-seed',
        requireConfirmation: false,
      },
      {
        defaultPreset: 'valid',
        defaultSeed: 'jpqa-001',
        requireConfirmation: true,
      },
    );
    unsubscribe();
  });
});

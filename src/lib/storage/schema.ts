import { normalizeSeed } from '../generator/prng';
import { isFillerPreset, type FillerPreset } from '../generator/types';

export type FillerSettings = {
  defaultPreset: FillerPreset;
  defaultSeed: string;
  requireConfirmation: boolean;
};

type AppStorageValues = {
  fillerSettings: FillerSettings;
};

export const DEFAULT_FILLER_SETTINGS: FillerSettings = {
  defaultPreset: 'valid',
  defaultSeed: 'jpqa-001',
  requireConfirmation: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseFillerSettings = (value: unknown): FillerSettings => {
  if (!isRecord(value)) return DEFAULT_FILLER_SETTINGS;
  const stored = value;
  return {
    defaultPreset: isFillerPreset(stored.defaultPreset)
      ? stored.defaultPreset
      : DEFAULT_FILLER_SETTINGS.defaultPreset,
    defaultSeed:
      typeof stored.defaultSeed === 'string'
        ? normalizeSeed(stored.defaultSeed, DEFAULT_FILLER_SETTINGS.defaultSeed)
        : DEFAULT_FILLER_SETTINGS.defaultSeed,
    requireConfirmation:
      typeof stored.requireConfirmation === 'boolean'
        ? stored.requireConfirmation
        : DEFAULT_FILLER_SETTINGS.requireConfirmation,
  };
};

export const storageSchema = {
  fillerSettings: {
    area: 'local',
    defaultValue: DEFAULT_FILLER_SETTINGS,
    parse: parseFillerSettings,
  },
} as const satisfies {
  [Key in keyof AppStorageValues]: {
    area: chrome.storage.AreaName;
    defaultValue: AppStorageValues[Key];
    parse: (value: unknown) => AppStorageValues[Key];
  };
};

export type StorageSchema = typeof storageSchema;
export type StorageKey = keyof StorageSchema;
export type StorageValue<Key extends StorageKey> = AppStorageValues[Key];
export type StorageAreaName<Key extends StorageKey> =
  StorageSchema[Key]['area'];

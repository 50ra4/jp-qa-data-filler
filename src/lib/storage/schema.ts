import type { FillerPreset } from '../generator/types';

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

export const storageSchema = {
  fillerSettings: {
    area: 'local',
    defaultValue: DEFAULT_FILLER_SETTINGS,
  },
} as const satisfies {
  [Key in keyof AppStorageValues]: {
    area: chrome.storage.AreaName;
    defaultValue: AppStorageValues[Key];
  };
};

export type StorageSchema = typeof storageSchema;
export type StorageKey = keyof StorageSchema;
export type StorageValue<Key extends StorageKey> = AppStorageValues[Key];
export type StorageAreaName<Key extends StorageKey> =
  StorageSchema[Key]['area'];

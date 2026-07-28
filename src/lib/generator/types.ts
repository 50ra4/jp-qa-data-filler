export const FILLER_PRESETS = ['valid', 'boundary', 'invalid'] as const;

export type FillerPreset = (typeof FILLER_PRESETS)[number];

export const isFillerPreset = (value: unknown): value is FillerPreset =>
  typeof value === 'string' &&
  FILLER_PRESETS.some((preset) => preset === value);

export type QaProfile = {
  fullName: string;
  familyName: string;
  givenName: string;
  fullNameKana: string;
  familyNameKana: string;
  givenNameKana: string;
  email: string;
  tel: string;
  postalCode: string;
  prefecture: string;
  locality: string;
  streetAddress: string;
  fullAddress: string;
  organization: string;
};

export type FieldKind = keyof QaProfile;

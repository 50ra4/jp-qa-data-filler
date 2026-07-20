export type FillerPreset = 'valid' | 'boundary' | 'invalid';

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

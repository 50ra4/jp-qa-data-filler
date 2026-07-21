import { describe, expect, test, vi } from 'vitest';

import { generateProfile } from './generateProfile';
import type { FieldKind, FillerPreset } from './types';

const FIELD_KINDS: FieldKind[] = [
  'fullName',
  'familyName',
  'givenName',
  'fullNameKana',
  'familyNameKana',
  'givenNameKana',
  'email',
  'tel',
  'postalCode',
  'prefecture',
  'locality',
  'streetAddress',
  'fullAddress',
  'organization',
];

describe('generateProfile', () => {
  test.each<FillerPreset>(['valid', 'boundary', 'invalid'])(
    '%s presetは同じseedから同じprofileを返す',
    (preset) => {
      expect(generateProfile('repeatable', preset)).toEqual(
        generateProfile('repeatable', preset),
      );
    },
  );

  test('seedまたはpresetが変わればprofileが変わる', () => {
    const base = generateProfile('seed-a', 'valid');

    expect(generateProfile('seed-b', 'valid')).not.toEqual(base);
    expect(generateProfile('seed-a', 'boundary')).not.toEqual(base);
  });

  test('14種の値を同一profileとして整合させる', () => {
    const profile = generateProfile('coherent', 'valid');

    expect(FIELD_KINDS.every((kind) => profile[kind].length > 0)).toBe(true);
    expect(profile.fullName).toBe(`${profile.familyName} ${profile.givenName}`);
    expect(profile.fullNameKana).toBe(
      `${profile.familyNameKana} ${profile.givenNameKana}`,
    );
    expect(profile.fullAddress).toBe(
      `${profile.prefecture}${profile.locality}${profile.streetAddress}`,
    );
  });

  test('validは日本向けの形式とexample.comを使う', () => {
    const profile = generateProfile('valid-format', 'valid');

    expect(profile.email).toMatch(/^[a-z0-9.]+@example\.com$/u);
    expect(profile.tel).toMatch(/^090-0\d{3}-\d{4}$/u);
    expect(profile.postalCode).toMatch(/^\d{3}-\d{4}$/u);
    expect(profile.organization).toMatch(/^株式会社テストデータ/u);
    expect(profile.fullNameKana).toMatch(/^[ァ-ヶー]+ [ァ-ヶー]+$/u);
  });

  test('boundaryは長い値と全角数字のhyphenなし表記を返す', () => {
    const profile = generateProfile('boundary-format', 'boundary');

    expect(profile.fullName.length).toBeGreaterThan(12);
    expect(profile.organization.length).toBeGreaterThan(24);
    expect(profile.tel).toMatch(/^[０-９]+$/u);
    expect(profile.tel.normalize('NFKC')).toMatch(/^0900\d{7}$/u);
    expect(profile.postalCode).toMatch(/^[０-９]{7}$/u);
    expect(profile.streetAddress.length).toBeGreaterThan(20);
  });

  test('invalidは各validationを意図的に外す', () => {
    const profile = generateProfile('invalid-format', 'invalid');

    expect(profile.email).not.toContain('@');
    expect(profile.tel.replace(/\D/gu, '').length).toBeLessThan(10);
    expect(profile.postalCode.replace(/\D/gu, '').length).toBeLessThan(7);
    expect(profile.fullNameKana).not.toMatch(/^[ァ-ヶー ]+$/u);
  });

  test('Math.randomと現在時刻へ依存しない', () => {
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');

    generateProfile('offline', 'valid');

    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
  });

  test('NFKC後の64 code pointだけをseedに使う', () => {
    const sixtyFour = 'あ'.repeat(64);

    expect(generateProfile(`  ${sixtyFour}余分`, 'valid')).toEqual(
      generateProfile(sixtyFour, 'valid'),
    );
  });
});

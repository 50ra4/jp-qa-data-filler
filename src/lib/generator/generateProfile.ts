import type { FillerPreset, QaProfile } from './types';

import {
  ADDRESS_PARTS,
  COMPANY_SUFFIXES,
  FAMILY_NAMES,
  GIVEN_NAMES,
} from './datasets';
import { createPrng, hashSeed, normalizeSeed } from './prng';

const DEFAULT_SEED = 'jpqa-001';
const FULL_WIDTH_DIGITS = '０１２３４５６７８９';
// Japan's national numbering plan leaves the 090-0 subscriber block unused.
const UNASSIGNED_MOBILE_PREFIX = '0900';

const pick = <Value>(values: readonly Value[], random: () => number): Value =>
  values[Math.floor(random() * values.length)];

const digits = (random: () => number, length: number): string =>
  Array.from({ length }, () => Math.floor(random() * 10)).join('');

const toFullWidthDigits = (value: string): string =>
  value.replace(/\d/gu, (digit) => FULL_WIDTH_DIGITS[Number(digit)]);

export const generateProfile = (
  seed: string,
  preset: FillerPreset,
): QaProfile => {
  const normalizedSeed = normalizeSeed(seed, DEFAULT_SEED);
  const normalizedProfileSeed = `${preset}:${normalizedSeed}`;
  const seedHash = hashSeed(normalizedProfileSeed);
  const random = createPrng(seedHash);
  const family = pick(FAMILY_NAMES, random);
  const given = pick(GIVEN_NAMES, random);
  const address = pick(ADDRESS_PARTS, random);
  const companySuffix = pick(COMPANY_SUFFIXES, random);
  const discriminator = seedHash.toString(36).padStart(7, '0').slice(0, 7);
  const streetNumber = `${Math.floor(random() * 9) + 1}-${Math.floor(random() * 20) + 1}-${Math.floor(random() * 30) + 1}`;

  if (preset === 'boundary') {
    const familyName = `${family.kanji}品質保証境界値試験姓`;
    const givenName = `${given.kanji}入力文字数確認名`;
    const familyNameKana = `${family.kana}ヒンシツホショウキョウカイチシケンセイ`;
    const givenNameKana = `${given.kana}ニュウリョクモジスウカクニンメイ`;
    const streetAddress = `${toFullWidthDigits(streetNumber.replaceAll('-', ''))}番地テストデータ境界値確認超長尺ビルディング百二十八号室`;

    return {
      fullName: `${familyName} ${givenName}`,
      familyName,
      givenName,
      fullNameKana: `${familyNameKana} ${givenNameKana}`,
      familyNameKana,
      givenNameKana,
      email: `boundary.${discriminator}.long-local-part@example.com`,
      tel: toFullWidthDigits(`${UNASSIGNED_MOBILE_PREFIX}${digits(random, 7)}`),
      postalCode: toFullWidthDigits(digits(random, 7)),
      prefecture: address.prefecture,
      locality: `${address.locality}境界値確認特別長域町`,
      streetAddress,
      fullAddress: `${address.prefecture}${address.locality}境界値確認特別長域町${streetAddress}`,
      organization: `株式会社テストデータ${companySuffix}境界値文字数上限確認事業部`,
    };
  }

  if (preset === 'invalid') {
    const familyName = `${family.kanji}!`;
    const givenName = `${given.kanji}?`;
    const familyNameKana = `${family.kana}漢字`;
    const givenNameKana = `${given.kana}123`;
    const streetAddress = `不正記号#${streetNumber}`;

    return {
      fullName: `${familyName} ${givenName}`,
      familyName,
      givenName,
      fullNameKana: `${familyNameKana} ${givenNameKana}`,
      familyNameKana,
      givenNameKana,
      email: `invalid-${discriminator}.example.com`,
      tel: digits(random, 6),
      postalCode: digits(random, 4),
      prefecture: `${address.prefecture}?`,
      locality: ` ${address.locality}`,
      streetAddress,
      fullAddress: `${address.prefecture}? ${address.locality}${streetAddress}`,
      organization: `!株式会社テストデータ${companySuffix}`,
    };
  }

  const streetAddress = `${streetNumber} テストビル${Math.floor(random() * 9) + 1}号室`;

  return {
    fullName: `${family.kanji} ${given.kanji}`,
    familyName: family.kanji,
    givenName: given.kanji,
    fullNameKana: `${family.kana} ${given.kana}`,
    familyNameKana: family.kana,
    givenNameKana: given.kana,
    email: `qa.${discriminator}@example.com`,
    tel: `0${Math.floor(random() * 8) + 2}-${digits(random, 4)}-${digits(random, 4)}`,
    postalCode: `${digits(random, 3)}-${digits(random, 4)}`,
    prefecture: address.prefecture,
    locality: address.locality,
    streetAddress,
    fullAddress: `${address.prefecture}${address.locality}${streetAddress}`,
    organization: `株式会社テストデータ${companySuffix}`,
  };
};

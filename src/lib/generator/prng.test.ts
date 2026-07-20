import { describe, expect, test } from 'vitest';

import { createPrng, hashSeed, normalizeSeed } from './prng';

describe('hashSeed', () => {
  test.each([
    ['', 2_166_136_261],
    ['hello', 1_335_831_723],
  ])('FNV-1aの固定ベクトル %j を返す', (value, expected) => {
    expect(hashSeed(value)).toBe(expected);
  });
});

describe('normalizeSeed', () => {
  test('前後空白と全角英数字をNFKCで正規化する', () => {
    expect(normalizeSeed('  ＪＰ１２３  ', 'fallback')).toBe('JP123');
  });

  test('空文字では既定seedへ戻す', () => {
    expect(normalizeSeed('   ', 'jpqa-001')).toBe('jpqa-001');
  });

  test('Unicode code point単位で64文字に制限する', () => {
    expect([...normalizeSeed('あ'.repeat(65), 'fallback')]).toHaveLength(64);
  });
});

describe('createPrng', () => {
  test('同じ32bit seedから同じ列を返す', () => {
    const first = createPrng(1234);
    const second = createPrng(1234);

    expect([first(), first(), first()]).toEqual([
      second(),
      second(),
      second(),
    ]);
  });

  test('0以上1未満の値だけを返す', () => {
    const random = createPrng(99);
    const values = Array.from({ length: 20 }, () => random());

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

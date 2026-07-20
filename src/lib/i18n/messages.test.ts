import { describe, expect, test } from 'vitest';

import { getMessages } from './messages';

describe('getMessages', () => {
  test('jaで始まる言語は日本語を返す', () => {
    expect(getMessages('ja-JP').fillCurrentForm).toBe('現在のフォームへ入力');
  });

  test('ja以外は英語を返す', () => {
    expect(getMessages('en-US').fillCurrentForm).toBe('Fill current form');
    expect(getMessages('fr').settingsTitle).toBe('Settings');
  });

  test('両言語が同じkeyを持つ', () => {
    expect(Object.keys(getMessages('ja'))).toEqual(
      Object.keys(getMessages('en')),
    );
  });
});

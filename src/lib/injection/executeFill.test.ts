import { afterEach, describe, expect, test, vi } from 'vitest';

import { generateProfile } from '../generator/generateProfile';
import { installChromeFake } from '../testing/chromeFake';
import { fillPage } from './fillPage';
import { executeFill } from './executeFill';
import type { FillPageResult } from './types';

const profile = generateProfile('execute-fill', 'valid');
const pageResult: FillPageResult = {
  filled: [{ fieldKind: 'email', descriptor: 'email', confidence: 100 }],
  skipped: [{ descriptor: 'password', reason: 'SENSITIVE_FIELD' }],
  unmatchedCount: 1,
  warnings: [],
  omitted: { filled: 0, skipped: 0, warnings: 0 },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('executeFill', () => {
  test('active tabのtop frameへfillPageを注入する', async () => {
    const fake = installChromeFake({
      activeTab: { id: 42, url: 'https://example.test/form' },
      executeScriptResult: [{ frameId: 0, result: pageResult }],
    });

    await expect(executeFill(profile, 'valid')).resolves.toEqual({
      ok: true,
      page: pageResult,
    });
    expect(fake.chrome.tabs.query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
    expect(fake.chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      func: fillPage,
      args: [profile, 'valid'],
    });
  });

  test.each([
    'chrome://extensions',
    'edge://settings',
    'about:blank',
    'view-source:https://example.test',
    'chrome-extension://extension-id/options.html',
    'https://chromewebstore.google.com/detail/example/id',
    'https://chrome.google.com/webstore/detail/example/id',
  ])('制限URLでは注入しない: %s', async (url) => {
    const fake = installChromeFake({ activeTab: { id: 1, url } });

    await expect(executeFill(profile, 'valid')).resolves.toMatchObject({
      ok: false,
      code: 'RESTRICTED_URL',
    });
    expect(fake.chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  test.each([undefined, {}])(
    '有効なactive tabがなければ失敗する',
    async (tab) => {
      installChromeFake({ activeTab: tab });

      await expect(executeFill(profile, 'valid')).resolves.toMatchObject({
        ok: false,
        code: 'NO_ACTIVE_TAB',
      });
    },
  );

  test('top frameの結果がなければ失敗する', async () => {
    installChromeFake({
      activeTab: { id: 1, url: 'https://example.test' },
      executeScriptResult: [{ frameId: 2, result: pageResult }],
    });

    await expect(executeFill(profile, 'valid')).resolves.toMatchObject({
      ok: false,
      code: 'NO_RESULT',
    });
  });

  test('結果のruntime guardに失敗したら拒否する', async () => {
    installChromeFake({
      activeTab: { id: 1, url: 'https://example.test' },
      executeScriptResult: [
        { frameId: 0, result: { ...pageResult, unmatchedCount: -1 } },
      ],
    });

    await expect(executeFill(profile, 'valid')).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_RESULT',
    });
  });

  test('Chrome APIの拒否をユーザー向けエラーへ変換する', async () => {
    installChromeFake({
      activeTab: { id: 1, url: 'https://example.test' },
      executeScriptError: new Error('Cannot access contents of the page'),
    });

    await expect(executeFill(profile, 'valid')).resolves.toMatchObject({
      ok: false,
      code: 'INJECTION_DENIED',
      message: expect.stringContaining('Cannot access contents of the page'),
    });
  });

  test('上限超過の結果をruntime guardで拒否する', async () => {
    installChromeFake({
      activeTab: { id: 1, url: 'https://example.test' },
      executeScriptResult: [
        {
          frameId: 0,
          result: {
            ...pageResult,
            filled: Array.from({ length: 51 }, () => pageResult.filled[0]),
          },
        },
      ],
    });

    await expect(executeFill(profile, 'valid')).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_RESULT',
    });
  });
});

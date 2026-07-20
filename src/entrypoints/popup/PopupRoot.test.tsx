import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { generateProfile } from '../../lib/generator/generateProfile';
import type { FillExecutionResult } from '../../lib/injection/types';
import {
  installChromeFake,
  type ChromeFake,
} from '../../lib/testing/chromeFake';
import { PopupRoot } from './PopupRoot';

let chromeFake: ChromeFake;

beforeEach(() => {
  chromeFake = installChromeFake();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const setSettings = async (requireConfirmation: boolean) => {
  await chromeFake.api.storage.local.set({
    fillerSettings: {
      defaultPreset: 'valid',
      defaultSeed: 'popup-test',
      requireConfirmation,
    },
  });
};

describe('PopupRoot', () => {
  test('常時表示の安全上の注意を表示する', () => {
    render(<PopupRoot language="en" />);

    expect(
      screen.getByRole('heading', { name: 'JP QA Data Filler' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Synthetic test data only.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The extension does not click or invoke form submission. Page scripts can react to input/change events and may save or transmit the values.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Do not use on production systems.'),
    ).toBeInTheDocument();
  });

  test('presetとseedの変更で日本語profile previewを更新する', async () => {
    render(<PopupRoot language="ja" />);
    const expected = generateProfile('changed-seed', 'boundary');

    fireEvent.change(screen.getByLabelText('プリセット'), {
      target: { value: 'boundary' },
    });
    fireEvent.change(screen.getByLabelText('seed'), {
      target: { value: 'changed-seed' },
    });

    expect(screen.getByText(expected.fullName)).toBeInTheDocument();
    expect(screen.getByText(expected.email)).toBeInTheDocument();
    expect(screen.getByText(expected.fullAddress)).toBeInTheDocument();
  });

  test('確認設定がONなら確認後にだけ実行する', async () => {
    const onExecute = vi.fn(async (): Promise<FillExecutionResult> => ({
      ok: true,
      page: { filled: [], skipped: [], unmatchedCount: 0, warnings: [] },
    }));
    render(<PopupRoot language="ja" onExecute={onExecute} />);

    fireEvent.click(
      screen.getByRole('button', { name: '現在のフォームへ入力' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(
        'ページへinput/changeイベントを送るため、ページ側の処理が値を自動保存・送信する可能性があります。専用のQA環境でのみ実行してください。',
      ),
    ).toBeInTheDocument();
    expect(onExecute).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '入力を実行' }));
    await waitFor(() => expect(onExecute).toHaveBeenCalledOnce());
  });

  test('確認設定がOFFなら直接実行し、実行中の二重操作を防ぐ', async () => {
    await setSettings(false);
    let resolveExecution: ((result: FillExecutionResult) => void) | undefined;
    const onExecute = vi.fn(
      () =>
        new Promise<FillExecutionResult>((resolve) => {
          resolveExecution = resolve;
        }),
    );
    render(<PopupRoot language="ja" onExecute={onExecute} />);
    await waitFor(() =>
      expect(screen.getByLabelText('seed')).toHaveValue('popup-test'),
    );
    const button = screen.getByRole('button', {
      name: '現在のフォームへ入力',
    });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onExecute).toHaveBeenCalledOnce();
    resolveExecution?.({
      ok: true,
      page: { filled: [], skipped: [], unmatchedCount: 0, warnings: [] },
    });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  test('入力件数・skip理由・判定不能・warningを表示する', async () => {
    await setSettings(false);
    const onExecute = vi.fn(async (): Promise<FillExecutionResult> => ({
      ok: true,
      page: {
        filled: [
          { fieldKind: 'email', descriptor: 'メール', confidence: 80 },
          { fieldKind: 'tel', descriptor: '電話', confidence: 80 },
        ],
        skipped: [
          { descriptor: 'password', reason: 'SENSITIVE_FIELD' },
          { descriptor: 'disabled', reason: 'DISABLED' },
        ],
        unmatchedCount: 3,
        warnings: ['会社名: value truncated to maxLength 5.'],
      },
    }));
    render(<PopupRoot language="ja" onExecute={onExecute} />);
    await waitFor(() =>
      expect(screen.getByLabelText('seed')).toHaveValue('popup-test'),
    );

    fireEvent.click(
      screen.getByRole('button', { name: '現在のフォームへ入力' }),
    );

    expect(await screen.findByText('入力: 2件')).toBeInTheDocument();
    expect(screen.getByText('スキップ: 2件')).toBeInTheDocument();
    expect(screen.getByText('判定不能: 3件')).toBeInTheDocument();
    expect(screen.getByText(/機密項目: 1件/u)).toBeInTheDocument();
    expect(screen.getByText(/無効な項目: 1件/u)).toBeInTheDocument();
    expect(screen.getByText(/maxLength 5/u)).toBeInTheDocument();
  });

  test('注入エラーをcodeと案内付きで表示する', async () => {
    await setSettings(false);
    const onExecute = vi.fn(async (): Promise<FillExecutionResult> => ({
      ok: false,
      code: 'RESTRICTED_URL',
      message: 'restricted',
    }));
    render(<PopupRoot language="en" onExecute={onExecute} />);
    await waitFor(() =>
      expect(screen.getByLabelText('Seed')).toHaveValue('popup-test'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fill current form' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'RESTRICTED_URL',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('restricted');
  });
});

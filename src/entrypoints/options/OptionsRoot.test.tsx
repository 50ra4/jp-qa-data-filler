import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { getStorageValue } from '../../lib/storage';
import { installChromeFake } from '../../lib/testing/chromeFake';
import { OptionsRoot } from './OptionsRoot';

beforeEach(() => {
  installChromeFake();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('OptionsRoot', () => {
  test('既定設定と言語表示を表示する', async () => {
    render(<OptionsRoot language="ja-JP" />);

    expect(
      screen.getByRole('heading', { name: 'JP QA Data Filler 設定' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('既定プリセット')).toHaveValue('valid');
    await waitFor(() =>
      expect(screen.getByLabelText('既定seed')).toHaveValue('jpqa-001'),
    );
    expect(screen.getByText('表示言語: 日本語')).toBeInTheDocument();
  });

  test('変更した設定をstorage.localへ保存する', async () => {
    render(<OptionsRoot language="ja" />);

    await waitFor(() =>
      expect(screen.getByLabelText('既定seed')).toHaveValue('jpqa-001'),
    );
    fireEvent.change(screen.getByLabelText('既定プリセット'), {
      target: { value: 'boundary' },
    });
    fireEvent.change(screen.getByLabelText('既定seed'), {
      target: { value: ` ${'あ'.repeat(70)} ` },
    });
    fireEvent.click(screen.getByLabelText('実行前に確認する'));
    fireEvent.click(screen.getByRole('button', { name: '設定を保存' }));

    await waitFor(async () => {
      await expect(getStorageValue('fillerSettings')).resolves.toEqual({
        defaultPreset: 'boundary',
        defaultSeed: 'あ'.repeat(64),
        requireConfirmation: false,
      });
    });
    expect(screen.getByRole('status')).toHaveTextContent('保存しました');
  });
});

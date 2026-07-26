import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { AppErrorBoundary } from './AppErrorBoundary';

afterEach(() => {
  vi.restoreAllMocks();
});

test('descendantのrender errorを画面全体の白化へ波及させない', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const Broken = () => {
    throw new Error('broken');
  };

  render(
    <AppErrorBoundary fallback="設定を読み込めませんでした">
      <Broken />
    </AppErrorBoundary>,
  );

  expect(screen.getByRole('alert')).toHaveTextContent(
    '設定を読み込めませんでした',
  );
});

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { PopupRoot } from './PopupRoot';

describe('PopupRoot', () => {
  test('常時表示の安全上の注意を表示する', () => {
    render(<PopupRoot />);

    expect(
      screen.getByRole('heading', { name: 'JP QA Data Filler' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Synthetic test data only.')).toBeInTheDocument();
    expect(
      screen.getByText('This extension never submits the form.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Do not use on production systems.'),
    ).toBeInTheDocument();
  });
});

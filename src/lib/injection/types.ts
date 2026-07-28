import type { FieldKind } from '../generator/types';

export const FILL_RESULT_LIMIT = 50;

export const FILL_SKIP_REASONS = [
  'SENSITIVE_FIELD',
  'UNSUPPORTED_CONTROL',
  'DISABLED',
  'READONLY',
  'HIDDEN',
  'AMBIGUOUS',
  'NO_MATCHING_VALUE',
  'VALUE_REJECTED',
  'EMPTY_AFTER_TRUNCATION',
  'WRITE_FAILED',
] as const;

export type FillSkipReason = (typeof FILL_SKIP_REASONS)[number];

export type FillSkipReasonCounts = Record<FillSkipReason, number>;

export type FilledField = {
  fieldKind: FieldKind;
  descriptor: string;
  confidence: number;
};

export type SkippedField = {
  descriptor: string;
  reason: FillSkipReason;
};

export type FillWarning = {
  code: 'TRUNCATED';
  descriptor: string;
  detail: number;
};

export type FillPageResult = {
  filled: FilledField[];
  skipped: SkippedField[];
  skippedReasonCounts: FillSkipReasonCounts;
  unmatchedCount: number;
  warnings: FillWarning[];
  omitted: {
    filled: number;
    skipped: number;
    warnings: number;
  };
};

export type FillExecutionResult =
  | { ok: true; page: FillPageResult }
  | {
      ok: false;
      code:
        | 'NO_ACTIVE_TAB'
        | 'RESTRICTED_URL'
        | 'INJECTION_DENIED'
        | 'NO_RESULT'
        | 'INVALID_RESULT'
        | 'UNKNOWN';
      message: string;
    };

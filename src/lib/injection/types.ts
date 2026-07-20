import type { FieldKind } from '../generator/types';

export type FillSkipReason =
  | 'SENSITIVE_FIELD'
  | 'UNSUPPORTED_CONTROL'
  | 'DISABLED'
  | 'READONLY'
  | 'HIDDEN'
  | 'AMBIGUOUS'
  | 'NO_MATCHING_VALUE'
  | 'CLOSED_SHADOW_ROOT'
  | 'WRITE_FAILED';

export type FilledField = {
  fieldKind: FieldKind;
  descriptor: string;
  confidence: number;
};

export type SkippedField = {
  descriptor: string;
  reason: FillSkipReason;
};

export type FillPageResult = {
  filled: FilledField[];
  skipped: SkippedField[];
  unmatchedCount: number;
  warnings: string[];
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

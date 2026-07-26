import type { FieldKind, FillerPreset, QaProfile } from '../generator/types';
import { fillPage } from './fillPage';
import type {
  FillExecutionResult,
  FillSkipReason,
  FillWarning,
  FilledField,
  FillPageResult,
  SkippedField,
} from './types';

const RESULT_LIMIT = 50;

const FIELD_KINDS: Readonly<Record<FieldKind, true>> = {
  fullName: true,
  familyName: true,
  givenName: true,
  fullNameKana: true,
  familyNameKana: true,
  givenNameKana: true,
  email: true,
  tel: true,
  postalCode: true,
  prefecture: true,
  locality: true,
  streetAddress: true,
  fullAddress: true,
  organization: true,
};

const SKIP_REASONS: Readonly<Record<FillSkipReason, true>> = {
  SENSITIVE_FIELD: true,
  UNSUPPORTED_CONTROL: true,
  DISABLED: true,
  READONLY: true,
  HIDDEN: true,
  AMBIGUOUS: true,
  NO_MATCHING_VALUE: true,
  VALUE_REJECTED: true,
  WRITE_FAILED: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = <Key extends PropertyKey>(
  value: object,
  key: Key,
): value is Record<Key, unknown> => Object.hasOwn(value, key);

const isFilledField = (value: unknown): value is FilledField =>
  isRecord(value) &&
  typeof value.fieldKind === 'string' &&
  hasOwn(FIELD_KINDS, value.fieldKind) &&
  typeof value.descriptor === 'string' &&
  value.descriptor.length <= 80 &&
  typeof value.confidence === 'number' &&
  Number.isFinite(value.confidence) &&
  value.confidence >= 0 &&
  value.confidence <= 100;

const isSkippedField = (value: unknown): value is SkippedField =>
  isRecord(value) &&
  typeof value.descriptor === 'string' &&
  value.descriptor.length <= 80 &&
  typeof value.reason === 'string' &&
  hasOwn(SKIP_REASONS, value.reason);

const isFillWarning = (value: unknown): value is FillWarning =>
  isRecord(value) &&
  value.code === 'TRUNCATED' &&
  typeof value.descriptor === 'string' &&
  value.descriptor.length <= 80 &&
  Number.isInteger(value.detail) &&
  (value.detail as number) >= 0;

const isOmittedCounts = (value: unknown): value is FillPageResult['omitted'] =>
  isRecord(value) &&
  ['filled', 'skipped', 'warnings'].every(
    (key) => Number.isSafeInteger(value[key]) && (value[key] as number) >= 0,
  );

const isFillPageResult = (value: unknown): value is FillPageResult =>
  isRecord(value) &&
  Array.isArray(value.filled) &&
  value.filled.every(isFilledField) &&
  Array.isArray(value.skipped) &&
  value.skipped.every(isSkippedField) &&
  Number.isSafeInteger(value.unmatchedCount) &&
  (value.unmatchedCount as number) >= 0 &&
  Array.isArray(value.warnings) &&
  value.warnings.every(isFillWarning) &&
  value.filled.length + value.skipped.length + value.warnings.length <=
    RESULT_LIMIT &&
  isOmittedCounts(value.omitted);

const errorMessage = (error: unknown, fallback: string): string => {
  const detail = error instanceof Error ? error.message : String(error);
  return detail ? `${fallback} (${detail})` : fallback;
};

const isRestrictedUrl = (url: string | undefined): boolean => {
  if (!url) return true;
  const normalized = url.toLowerCase();
  if (
    ['chrome:', 'edge:', 'about:', 'view-source:', 'chrome-extension:'].some(
      (scheme) => normalized.startsWith(scheme),
    )
  ) {
    return true;
  }
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname === 'chromewebstore.google.com' ||
      (hostname === 'chrome.google.com' &&
        new URL(url).pathname.startsWith('/webstore'))
    );
  } catch {
    return true;
  }
};

export const executeFill = async (
  profile: QaProfile,
  preset: FillerPreset,
): Promise<FillExecutionResult> => {
  let tabs: chrome.tabs.Tab[];
  try {
    tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (error: unknown) {
    return {
      ok: false,
      code: 'NO_ACTIVE_TAB',
      message: errorMessage(error, 'The active tab could not be read.'),
    };
  }

  const tab = tabs[0];
  if (!tab || typeof tab.id !== 'number') {
    return {
      ok: false,
      code: 'NO_ACTIVE_TAB',
      message: 'No active tab is available.',
    };
  }
  if (isRestrictedUrl(tab.url)) {
    return {
      ok: false,
      code: 'RESTRICTED_URL',
      message: 'Chrome does not allow this extension to fill the current page.',
    };
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillPage,
      args: [profile, preset],
    });
    const topFrame = results.find((result) => result.frameId === 0);
    if (!topFrame || topFrame.result === undefined) {
      return {
        ok: false,
        code: 'NO_RESULT',
        message: 'The page did not return a fill result.',
      };
    }
    if (!isFillPageResult(topFrame.result)) {
      return {
        ok: false,
        code: 'INVALID_RESULT',
        message: 'The page returned an invalid fill result.',
      };
    }
    return { ok: true, page: topFrame.result };
  } catch (error: unknown) {
    return {
      ok: false,
      code: 'INJECTION_DENIED',
      message: errorMessage(
        error,
        'The page blocked form filling. Open a normal web page and try again.',
      ),
    };
  }
};

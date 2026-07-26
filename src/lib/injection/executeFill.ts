import type { FieldKind, FillerPreset, QaProfile } from '../generator/types';
import { fillPage } from './fillPage';
import {
  FILL_RESULT_LIMIT,
  FILL_SKIP_REASONS,
  type FillExecutionResult,
  type FillSkipReason,
  type FillSkipReasonCounts,
  type FillWarning,
  type FilledField,
  type FillPageResult,
  type SkippedField,
} from './types';

/*
 * Keep this boundary strict: executeScript returns untrusted page-context data,
 * even though fillPage normally creates it.
 */
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
  FILL_SKIP_REASONS.includes(value.reason as FillSkipReason);

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

const isSkippedReasonCounts = (
  value: unknown,
  expectedTotal: number,
): value is FillSkipReasonCounts =>
  isRecord(value) &&
  Object.keys(value).length === FILL_SKIP_REASONS.length &&
  FILL_SKIP_REASONS.every(
    (reason) =>
      Number.isSafeInteger(value[reason]) && (value[reason] as number) >= 0,
  ) &&
  FILL_SKIP_REASONS.reduce(
    (total, reason) => total + (value[reason] as number),
    0,
  ) === expectedTotal;

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
  value.filled.length <= FILL_RESULT_LIMIT &&
  value.skipped.length <= FILL_RESULT_LIMIT &&
  value.warnings.length <= FILL_RESULT_LIMIT &&
  isOmittedCounts(value.omitted) &&
  isSkippedReasonCounts(
    value.skippedReasonCounts,
    value.skipped.length + value.omitted.skipped,
  );

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
      args: [profile, preset, { resultLimit: FILL_RESULT_LIMIT }],
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

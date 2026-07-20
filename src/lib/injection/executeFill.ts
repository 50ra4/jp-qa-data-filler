import type { FillerPreset, QaProfile } from '../generator/types';
import { fillPage } from './fillPage';
import type {
  FillExecutionResult,
  FilledField,
  FillPageResult,
  SkippedField,
} from './types';

const FIELD_KINDS = new Set([
  'fullName',
  'familyName',
  'givenName',
  'fullNameKana',
  'familyNameKana',
  'givenNameKana',
  'email',
  'tel',
  'postalCode',
  'prefecture',
  'locality',
  'streetAddress',
  'fullAddress',
  'organization',
]);

const SKIP_REASONS = new Set([
  'SENSITIVE_FIELD',
  'UNSUPPORTED_CONTROL',
  'DISABLED',
  'READONLY',
  'HIDDEN',
  'AMBIGUOUS',
  'NO_MATCHING_VALUE',
  'CLOSED_SHADOW_ROOT',
  'WRITE_FAILED',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFilledField = (value: unknown): value is FilledField =>
  isRecord(value) &&
  FIELD_KINDS.has(value.fieldKind as string) &&
  typeof value.descriptor === 'string' &&
  typeof value.confidence === 'number' &&
  Number.isFinite(value.confidence) &&
  value.confidence >= 0 &&
  value.confidence <= 100;

const isSkippedField = (value: unknown): value is SkippedField =>
  isRecord(value) &&
  typeof value.descriptor === 'string' &&
  SKIP_REASONS.has(value.reason as string);

const isFillPageResult = (value: unknown): value is FillPageResult =>
  isRecord(value) &&
  Array.isArray(value.filled) &&
  value.filled.every(isFilledField) &&
  Array.isArray(value.skipped) &&
  value.skipped.every(isSkippedField) &&
  Number.isInteger(value.unmatchedCount) &&
  (value.unmatchedCount as number) >= 0 &&
  Array.isArray(value.warnings) &&
  value.warnings.every((warning) => typeof warning === 'string');

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
  } catch {
    return {
      ok: false,
      code: 'NO_ACTIVE_TAB',
      message: 'The active tab could not be read.',
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
  } catch {
    return {
      ok: false,
      code: 'INJECTION_DENIED',
      message:
        'The page blocked form filling. Open a normal web page and try again.',
    };
  }
};

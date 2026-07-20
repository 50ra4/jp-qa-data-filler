import { useEffect, useMemo, useState } from 'react';

import { generateProfile } from '../../lib/generator/generateProfile';
import type { FillerPreset } from '../../lib/generator/types';
import { executeFill } from '../../lib/injection/executeFill';
import type {
  FillExecutionResult,
  FillSkipReason,
} from '../../lib/injection/types';
import { getMessages } from '../../lib/i18n/messages';
import { useStorageValue } from '../../lib/storage';

type PopupRootProps = {
  language?: string;
  onExecute?: typeof executeFill;
};

const PRESETS: FillerPreset[] = ['valid', 'boundary', 'invalid'];

export const PopupRoot = ({
  language = navigator.language,
  onExecute = executeFill,
}: PopupRootProps) => {
  const messages = getMessages(language);
  const [settings] = useStorageValue('fillerSettings');
  const [preset, setPreset] = useState<FillerPreset>(settings.defaultPreset);
  const [seed, setSeed] = useState(settings.defaultSeed);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<FillExecutionResult>();

  useEffect(() => {
    setPreset(settings.defaultPreset);
    setSeed(settings.defaultSeed);
  }, [settings]);

  const profile = useMemo(
    () => generateProfile(seed || settings.defaultSeed, preset),
    [preset, seed, settings.defaultSeed],
  );
  const previewRows = [
    [messages.previewFullName, profile.fullName],
    [messages.previewFullNameKana, profile.fullNameKana],
    [messages.previewEmail, profile.email],
    [messages.previewTel, profile.tel],
    [messages.previewPostalCode, profile.postalCode],
    [messages.previewAddress, profile.fullAddress],
    [messages.previewOrganization, profile.organization],
  ];
  const reasonLabels: Record<FillSkipReason, string> = {
    SENSITIVE_FIELD: messages.reasonSensitive,
    UNSUPPORTED_CONTROL: messages.reasonUnsupported,
    DISABLED: messages.reasonDisabled,
    READONLY: messages.reasonReadonly,
    HIDDEN: messages.reasonHidden,
    AMBIGUOUS: messages.reasonAmbiguous,
    NO_MATCHING_VALUE: messages.reasonNoMatchingValue,
    CLOSED_SHADOW_ROOT: messages.reasonClosedShadow,
    WRITE_FAILED: messages.reasonWriteFailed,
  };

  const runFill = async () => {
    if (isRunning) return;
    setIsConfirming(false);
    setIsRunning(true);
    setResult(undefined);
    try {
      setResult(await onExecute(profile, preset));
    } catch (error: unknown) {
      setResult({
        ok: false,
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const requestFill = () => {
    if (isRunning) return;
    if (settings.requireConfirmation) setIsConfirming(true);
    else void runFill();
  };

  const reasonCounts = new Map<FillSkipReason, number>();
  if (result?.ok) {
    for (const skipped of result.page.skipped) {
      reasonCounts.set(
        skipped.reason,
        (reasonCounts.get(skipped.reason) ?? 0) + 1,
      );
    }
  }

  return (
    <main className="jpqa-popup">
      <header className="jpqa-popup__header">
        <div>
          <p className="jpqa-popup__eyebrow">{messages.eyebrow}</p>
          <h1>{messages.productName}</h1>
        </div>
        <a href="/options.html" rel="noreferrer" target="_blank">
          {messages.openSettings}
        </a>
        <p>{messages.popupSubtitle}</p>
      </header>

      <section aria-label={messages.previewTitle} className="jpqa-popup__panel">
        <div className="jpqa-popup__controls">
          <label htmlFor="preset">{messages.presetLabel}</label>
          <select
            id="preset"
            onChange={(event) =>
              setPreset(event.currentTarget.value as FillerPreset)
            }
            value={preset}
          >
            {PRESETS.map((value) => (
              <option key={value} value={value}>
                {
                  messages[
                    `preset${value[0].toUpperCase()}${value.slice(1)}` as keyof typeof messages
                  ]
                }
              </option>
            ))}
          </select>
          <label htmlFor="seed">{messages.seedLabel}</label>
          <input
            id="seed"
            maxLength={64}
            onChange={(event) => setSeed(event.currentTarget.value)}
            spellCheck={false}
            type="text"
            value={seed}
          />
        </div>

        <h2>{messages.previewTitle}</h2>
        <dl className="jpqa-popup__preview">
          {previewRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside aria-label={messages.safetyTitle} className="jpqa-popup__safety">
        <strong>{messages.syntheticOnly}</strong>
        <span>{messages.submissionSafety}</span>
        <span>{messages.notProduction}</span>
      </aside>

      <button
        className="jpqa-popup__primary"
        disabled={isRunning}
        onClick={requestFill}
        type="button"
      >
        {isRunning ? messages.filling : messages.fillCurrentForm}
      </button>

      {isConfirming && (
        <div
          aria-labelledby="confirmation-title"
          aria-modal="true"
          className="jpqa-popup__dialog"
          role="dialog"
        >
          <h2 id="confirmation-title">{messages.confirmationTitle}</h2>
          <p>{messages.confirmationBody}</p>
          <div>
            <button onClick={() => setIsConfirming(false)} type="button">
              {messages.cancel}
            </button>
            <button onClick={() => void runFill()} type="button">
              {messages.confirmFill}
            </button>
          </div>
        </div>
      )}

      {result?.ok && (
        <section className="jpqa-popup__result" aria-live="polite">
          <h2>{messages.resultTitle}</h2>
          <div className="jpqa-popup__metrics">
            <strong>
              {messages.filledCount}: {result.page.filled.length}
              {messages.countSuffix}
            </strong>
            <strong>
              {messages.skippedCount}: {result.page.skipped.length}
              {messages.countSuffix}
            </strong>
            <strong>
              {messages.unmatchedCount}: {result.page.unmatchedCount}
              {messages.countSuffix}
            </strong>
          </div>
          {result.page.filled.length === 0 && <p>{messages.noFieldsFilled}</p>}
          {reasonCounts.size > 0 && (
            <div>
              <h3>{messages.skipReasonsTitle}</h3>
              <ul>
                {[...reasonCounts].map(([reason, count]) => (
                  <li key={reason}>
                    {reasonLabels[reason]}: {count}
                    {messages.countSuffix}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.page.warnings.length > 0 && (
            <div>
              <h3>{messages.warningsTitle}</h3>
              <ul>
                {result.page.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {result && !result.ok && (
        <section className="jpqa-popup__error" role="alert">
          <h2>{messages.errorTitle}</h2>
          <strong>{result.code}</strong>
          <p>{result.message}</p>
        </section>
      )}
    </main>
  );
};

import { useEffect, useRef, useState } from 'react';

import {
  FILLER_PRESETS,
  isFillerPreset,
} from '../../lib/generator/types';
import { normalizeSeed } from '../../lib/generator/prng';
import { getMessages, getPresetLabel } from '../../lib/i18n/messages';
import {
  DEFAULT_FILLER_SETTINGS,
  useStorageValue,
  type FillerSettings,
} from '../../lib/storage';

type OptionsRootProps = {
  language?: string;
};

export const OptionsRoot = ({
  language = navigator.language,
}: OptionsRootProps) => {
  const messages = getMessages(language);
  const [settings, setSettings] = useStorageValue('fillerSettings');
  const [draft, setDraft] = useState<FillerSettings>(settings);
  const [saveMessage, setSaveMessage] = useState('');
  const syncedSettingsRef = useRef(settings);

  useEffect(() => {
    if (syncedSettingsRef.current === settings) return;
    syncedSettingsRef.current = settings;
    setDraft(settings);
  }, [settings]);

  const updateDraft = (patch: Partial<FillerSettings>) => {
    setSaveMessage('');
    setDraft((current) => ({ ...current, ...patch }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSettings: FillerSettings = {
      ...draft,
      defaultSeed: normalizeSeed(
        draft.defaultSeed,
        DEFAULT_FILLER_SETTINGS.defaultSeed,
      ),
    };
    await setSettings(nextSettings);
    syncedSettingsRef.current = nextSettings;
    setDraft(nextSettings);
    setSaveMessage(messages.saved);
  };

  const languageName = language.toLowerCase().startsWith('ja')
    ? messages.languageJapanese
    : messages.languageEnglish;

  return (
    <main className="jpqa-options">
      <header className="jpqa-options__header">
        <p className="jpqa-options__eyebrow">{messages.productName}</p>
        <h1>{messages.settingsHeading}</h1>
        <p>{messages.settingsDescription}</p>
      </header>

      <form className="jpqa-options__card" onSubmit={onSubmit}>
        <label htmlFor="default-preset">{messages.defaultPreset}</label>
        <select
          id="default-preset"
          onChange={(event) => {
            if (isFillerPreset(event.currentTarget.value)) {
              updateDraft({ defaultPreset: event.currentTarget.value });
            }
          }}
          value={draft.defaultPreset}
        >
          {FILLER_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {getPresetLabel(messages, preset)}
            </option>
          ))}
        </select>

        <label htmlFor="default-seed">{messages.defaultSeed}</label>
        <input
          id="default-seed"
          maxLength={64}
          onChange={(event) =>
            updateDraft({ defaultSeed: event.currentTarget.value })
          }
          spellCheck={false}
          type="text"
          value={draft.defaultSeed}
        />

        <label className="jpqa-options__check" htmlFor="require-confirmation">
          <input
            checked={draft.requireConfirmation}
            id="require-confirmation"
            onChange={(event) =>
              updateDraft({ requireConfirmation: event.currentTarget.checked })
            }
            type="checkbox"
          />
          <span>{messages.requireConfirmation}</span>
        </label>

        <button type="submit">{messages.saveSettings}</button>
        <p aria-live="polite" className="jpqa-options__status" role="status">
          {saveMessage}
        </p>
      </form>

      <p className="jpqa-options__language">
        {messages.languageLabel}: {languageName}
      </p>
    </main>
  );
};

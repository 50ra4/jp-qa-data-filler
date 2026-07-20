const ENGLISH_MESSAGES = {
  productName: 'JP QA Data Filler',
  settingsTitle: 'Settings',
  settingsHeading: 'JP QA Data Filler Settings',
  settingsDescription:
    'Choose the defaults used when the popup opens. Only these settings are saved on this device.',
  defaultPreset: 'Default preset',
  defaultSeed: 'Default seed',
  requireConfirmation: 'Confirm before filling',
  saveSettings: 'Save settings',
  saved: 'Saved',
  languageLabel: 'Display language',
  languageJapanese: 'Japanese',
  languageEnglish: 'English',
  presetValid: 'Valid',
  presetBoundary: 'Boundary',
  presetInvalid: 'Invalid',
  fillCurrentForm: 'Fill current form',
  syntheticOnly: 'Synthetic test data only.',
  neverSubmits: 'This extension never submits the form.',
  notProduction: 'Do not use on production systems.',
} as const;

type Messages = { [Key in keyof typeof ENGLISH_MESSAGES]: string };

const JAPANESE_MESSAGES: Messages = {
  productName: 'JP QA Data Filler',
  settingsTitle: '設定',
  settingsHeading: 'JP QA Data Filler 設定',
  settingsDescription:
    'ポップアップを開いたときの既定値を設定します。端末に保存するのはこの設定だけです。',
  defaultPreset: '既定プリセット',
  defaultSeed: '既定seed',
  requireConfirmation: '実行前に確認する',
  saveSettings: '設定を保存',
  saved: '保存しました',
  languageLabel: '表示言語',
  languageJapanese: '日本語',
  languageEnglish: '英語',
  presetValid: '通常形式',
  presetBoundary: '境界値',
  presetInvalid: '不正形式',
  fillCurrentForm: '現在のフォームへ入力',
  syntheticOnly: '合成したテストデータのみを使用します。',
  neverSubmits: 'この拡張機能はフォームを送信しません。',
  notProduction: '本番環境では使用しないでください。',
};

export const getMessages = (language: string): Messages =>
  language.toLowerCase().startsWith('ja')
    ? JAPANESE_MESSAGES
    : ENGLISH_MESSAGES;

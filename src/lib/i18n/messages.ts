import type { FillerPreset } from '../generator/types';

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
  eyebrow: 'Synthetic QA utility',
  popupSubtitle: 'Deterministic Japanese form data for development and QA.',
  presetLabel: 'Preset',
  seedLabel: 'Seed',
  previewTitle: 'Preview',
  previewFullName: 'Name',
  previewFullNameKana: 'Name (Kana)',
  previewEmail: 'Email',
  previewTel: 'Phone',
  previewPostalCode: 'Postal code',
  previewAddress: 'Address',
  previewOrganization: 'Organization',
  fillCurrentForm: 'Fill current form',
  filling: 'Filling…',
  openSettings: 'Open settings',
  safetyTitle: 'Safety notice',
  syntheticOnly: 'Synthetic test data only.',
  submissionSafety:
    'The extension does not click or invoke form submission. Page scripts can react to input/change events and may save or transmit the values.',
  notProduction: 'Do not use on production systems.',
  confirmationTitle: 'Fill the current form?',
  confirmationBody:
    'Only recognized non-sensitive fields will change. The page receives input/change events, so its scripts may save or transmit the values. Run only in a dedicated QA environment.',
  confirmFill: 'Fill form',
  cancel: 'Cancel',
  resultTitle: 'Result',
  filledCount: 'Filled',
  skippedCount: 'Skipped',
  unmatchedCount: 'Unmatched',
  noFieldsFilled:
    'No fields were filled. Check autocomplete attributes or explicit labels.',
  skipReasonsTitle: 'Skip reasons',
  warningsTitle: 'Warnings',
  filledFieldsTitle: 'Filled fields',
  confidenceLabel: 'confidence',
  filledFieldFormat: '{descriptor} ({label} {confidence}%)',
  warningTruncated:
    '{descriptor}: truncated to a maximum of {count} characters',
  omittedResults: '{count} more omitted',
  errorTitle: 'Could not fill the form',
  unexpectedUiError:
    'The extension interface could not be displayed. Reopen it and try again.',
  reasonSensitive: 'Sensitive field',
  reasonUnsupported: 'Unsupported control',
  reasonDisabled: 'Disabled field',
  reasonReadonly: 'Read-only field',
  reasonHidden: 'Hidden field',
  reasonAmbiguous: 'Ambiguous field',
  reasonNoMatchingValue: 'No matching select option',
  reasonValueRejected: 'Value rejected by browser',
  reasonWriteFailed: 'Write failed',
  countSuffix: '',
} as const;

export type Messages = {
  [Key in keyof typeof ENGLISH_MESSAGES]: string;
};

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
  eyebrow: '合成QAデータツール',
  popupSubtitle: '開発・QA向けの再現可能な日本語フォームデータです。',
  presetLabel: 'プリセット',
  seedLabel: 'seed',
  previewTitle: '生成プレビュー',
  previewFullName: '氏名',
  previewFullNameKana: '氏名カナ',
  previewEmail: 'メール',
  previewTel: '電話',
  previewPostalCode: '郵便番号',
  previewAddress: '住所',
  previewOrganization: '会社名',
  fillCurrentForm: '現在のフォームへ入力',
  filling: '入力中…',
  openSettings: '設定を開く',
  safetyTitle: '安全上の注意',
  syntheticOnly: '合成したテストデータのみを使用します。',
  submissionSafety:
    '拡張機能自体は送信操作を行いません。ページ側の処理はinput/changeイベントに反応し、値を自動保存・送信する可能性があります。',
  notProduction: '本番環境では使用しないでください。',
  confirmationTitle: '現在のフォームへ入力しますか？',
  confirmationBody:
    'ページへinput/changeイベントを送るため、ページ側の処理が値を自動保存・送信する可能性があります。専用のQA環境でのみ実行してください。',
  confirmFill: '入力を実行',
  cancel: 'キャンセル',
  resultTitle: '実行結果',
  filledCount: '入力',
  skippedCount: 'スキップ',
  unmatchedCount: '判定不能',
  noFieldsFilled:
    '入力できる項目がありません。autocomplete属性または明示labelを確認してください。',
  skipReasonsTitle: '除外理由',
  warningsTitle: '警告',
  filledFieldsTitle: '入力した項目',
  confidenceLabel: '確度',
  filledFieldFormat: '{descriptor}（{label} {confidence}%）',
  warningTruncated: '{descriptor}：最大{count}文字に短縮',
  omittedResults: 'ほか{count}件を省略',
  errorTitle: 'フォームへ入力できませんでした',
  unexpectedUiError:
    '拡張機能の画面を表示できませんでした。開き直して再実行してください。',
  reasonSensitive: '機密項目',
  reasonUnsupported: '未対応control',
  reasonDisabled: '無効な項目',
  reasonReadonly: '読み取り専用',
  reasonHidden: '非表示項目',
  reasonAmbiguous: '判定が曖昧',
  reasonNoMatchingValue: 'selectの一致候補なし',
  reasonValueRejected: 'ブラウザが値を不受理',
  reasonWriteFailed: '値の書き込み失敗',
  countSuffix: '件',
};

export const getMessages = (language: string): Messages =>
  language.toLowerCase().startsWith('ja')
    ? JAPANESE_MESSAGES
    : ENGLISH_MESSAGES;

export const getPresetLabel = (
  messages: Messages,
  preset: FillerPreset,
): string => {
  const labels: Record<FillerPreset, string> = {
    valid: messages.presetValid,
    boundary: messages.presetBoundary,
    invalid: messages.presetInvalid,
  };
  return labels[preset];
};

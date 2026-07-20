# Chrome Web Store material

## Single purpose

Fill recognizable Japanese web-form fields with deterministic synthetic data after an explicit user action for development, QA, and demonstrations.

## Permission justifications

### activeTab

Required to access only the tab where the user invokes the extension action. The extension does not run persistently and does not request broad site access.

### scripting

Required to inject the packaged, self-contained fill function after the user selects **Fill current form**. No remote code is fetched or executed.

### storage

Required to save the default preset, seed, and confirmation preference locally. Generated profiles, page data, and fill results are not stored.

## English store description

### Short description

Fill Japanese QA forms with reproducible synthetic data—only when you explicitly ask.

### Detailed description

JP QA Data Filler helps developers and QA engineers repeatedly test Japanese web forms without retyping names, Kana, phone numbers, postal codes, addresses, email addresses, and organization names.

Choose a valid, boundary, or intentionally invalid preset and a seed. The same preset and seed always produce the same synthetic profile, making bug reproduction straightforward.

Safety is conservative by design: the extension never submits forms and never fills passwords, one-time codes, card information, hidden controls, disabled controls, or read-only controls. It runs only after an explicit popup action and reports what was filled, skipped, or left unmatched.

All processing stays in the browser. There is no account, backend, analytics, advertising, remote code, persistent content script, or broad host permission.

## Japanese store description

### 概要

明示操作時だけ、日本向けQAフォームへ再現可能な合成テストデータを入力します。

### 詳細

JP QA Data Fillerは、日本向けWebフォームを繰り返し確認する開発者・QA担当者向けのChrome拡張です。氏名、カナ、電話番号、郵便番号、住所、メール、会社名の手入力を減らします。

通常形式、境界値、不正形式のpresetとseedを選択できます。同じpresetとseedからは常に同じ合成profileを生成するため、不具合を再現しやすくなります。

安全性を優先し、フォームを送信せず、password、OTP、カード情報、hidden、disabled、readonlyへ入力しません。popupから明示的に実行した場合だけ動作し、入力・skip・判定不能の結果を表示します。

処理はブラウザ内で完結します。アカウント、外部backend、解析、広告、remote code、常駐content script、広範なhost permissionはありません。

## Screenshot checklist

- `docs/images/popup.png`: preset, seed, preview, safety notice, and primary action
- `docs/images/options.png`: local default settings and language indicator

Before submission, capture screenshots from the packaged `v0.1.0` build at the Chrome Web Store's current required dimensions and verify no production or personal data is visible.

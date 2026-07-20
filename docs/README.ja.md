# JP QA Data Filler

日本向けWebフォームの判定可能な項目へ、再現可能な合成テストデータを入力するChrome Manifest V3拡張です。開発・QA・デモ専用であり、本番環境では使用しないでください。

本リポジトリは[`50ra4/crx-vite-ts-react-template` v1.0.0](https://github.com/50ra4/crx-vite-ts-react-template/releases/tag/v1.0.0)から派生しています。

[English README](../README.md)

## 安全性

- ユーザーがpopupを開き、明示的に入力操作した場合だけ現在タブで動作します。
- buttonをclickせず、規約へ同意せず、フォームをsubmitしません。
- password、OTP、カード情報、hidden、disabled、readonlyへ入力しません。
- 常駐content script、host permission、background、外部backend、解析SDK、remote codeはありません。
- `chrome.storage.local`へ保存するのは既定preset、seed、実行前確認設定だけです。
- 生成profile、フォーム値、URL、field名、HTMLを保存・送信しません。

詳細は[プライバシーポリシー](privacy.md)を参照してください。

## 機能

- `valid`、`boundary`、`invalid`の3 preset
- 同じpresetとseedから常に同じ14種類のprofileを生成
- autocompleteを最優先し、label/ARIA、name/id、placeholderの順で保守的にfield判定
- native value setterとbubbling/composedな`input`・`change` event
- top frameと再帰的なopen Shadow DOMに対応
- popupとoptionsの日本語・英語表示
- 入力件数、skip理由、判定不能、warning、errorの表示

対象は氏名、姓、名、氏名カナ、姓カナ、名カナ、メール、電話、郵便番号、都道府県、市区町村、番地、住所全文、会社名です。

## 使い方

1. 開発、QA、専用デモ環境のフォームを開きます。
2. 拡張popupを開きます。
3. presetとseedを選び、生成プレビューを確認します。
4. **現在のフォームへ入力**を押し、確認設定がONなら実行を確定します。
5. popupの結果とフォームを確認します。送信が必要なテストでは、適切な環境か確認して手動送信します。

`valid`は文字列形式上の妥当性だけを示します。電話番号、郵便番号、住所の割当・配達可能性・実在性は保証しません。

## 対応しないフォーム

- cross-origin/same-origin iframe
- closed Shadow DOM
- contenteditable、native input/textarea/都道府県selectではないcustom control
- 強い判定根拠がない曖昧なfield
- サイト別selector mapping
- CAPTCHA、規約同意、フォーム送信
- Chrome以外のブラウザ

## 権限

| 権限 | 用途 |
| --- | --- |
| `activeTab` | 拡張actionを起点に、現在タブへ一時的にアクセスするため |
| `scripting` | 明示的な入力操作時だけ自己完結した関数を注入するため |
| `storage` | 既定preset、seed、実行前確認設定を端末内へ保存するため |

本番manifestに`host_permissions`、`content_scripts`、background、`web_accessible_resources`はありません。

## 開発

Node.js 24以上と、Playwright用Chromiumが必要です。

```bash
npm ci
npm run dev
npm run verify
npm run verify:full
npm run package
```

`npm run verify:full`は型、lint、unit/component test、production build、manifest検証、実Chromium E2Eを実行します。E2Eはbuild済み拡張の一時コピーだけへlocalhost権限を追加し、本番manifestを変更しません。

ブラウザ確認は[手動テスト計画](manual-test.md)に従ってください。

## ライセンス

[MIT](../LICENSE)

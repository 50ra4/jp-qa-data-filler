# Privacy Policy — JP QA Data Filler

Last updated: 2026-07-20

JP QA Data Filler processes form structure and synthetic values locally in the user's browser for the single purpose of filling development, QA, or demonstration forms after an explicit user action.

## Data collection and transmission

The extension does not collect, sell, share, save, or independently transmit personal data, form values, generated profiles, browsing history, page URLs, field names, or page HTML. It reads field attributes and nearby labels in memory to classify fields and displays short field descriptors in the popup result. Those descriptors are discarded when the popup closes. The extension has no account system, network client, backend, analytics SDK, crash-reporting SDK, advertising SDK, remote configuration, or remote-hosted code.

## Host-page behavior

To update controlled forms, the extension dispatches standard bubbling `input` and `change` events after assigning a value. Scripts belonging to the page can react to those events and may autosave, submit, or transmit the inserted values under that site's own behavior and privacy terms. The extension cannot guarantee or control those page-side effects. Use it only on local fixtures or dedicated QA/demonstration environments where that behavior is safe.

## Data stored on the device

The extension stores only these user settings in `chrome.storage.local`:

- default preset (`valid`, `boundary`, or `invalid`)
- default seed, limited to 64 Unicode code points
- whether confirmation is required before filling

Generated profiles and fill results are kept only in memory while the popup is open. They are not written to extension storage.

The `valid` preset generates a seed-dependent Japanese-shaped phone placeholder in the form `000-0000-XXXX`, where the final four digits vary with the seed. The `000` domestic prefix is structurally outside Japan's subscriber-number formats, so the value cannot identify a recipient and may intentionally fail prefix-aware validators. The `boundary` preset uses a longer seed-dependent sequence of full-width digits without hyphens, and `invalid` uses a deliberately short value.

## Permissions

- `activeTab`: temporary access to the current tab after the user invokes the extension.
- `scripting`: injects the local fill function after the user selects **Fill current form**.
- `storage`: stores the three settings listed above on the device.

The production extension does not request host permissions or `<all_urls>` and does not install a persistent content script.

## Retention and deletion

Settings remain in the browser profile until the user changes them, removes them through browser data controls, or uninstalls the extension. Uninstalling the extension removes its local extension storage according to Chrome's behavior.

## Contact

Questions and privacy reports can be filed at [GitHub Issues](https://github.com/50ra4/jp-qa-data-filler/issues).

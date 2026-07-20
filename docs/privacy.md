# Privacy Policy — JP QA Data Filler

Last updated: 2026-07-20

JP QA Data Filler processes form structure and synthetic values locally in the user's browser for the single purpose of filling development, QA, or demonstration forms after an explicit user action.

## Data collection and transmission

The extension does not collect, sell, share, or transmit personal data, form values, generated profiles, browsing history, page URLs, field names, or page HTML. It has no account system, backend, analytics SDK, crash-reporting SDK, advertising SDK, remote configuration, or remote-hosted code.

## Data stored on the device

The extension stores only these user settings in `chrome.storage.local`:

- default preset (`valid`, `boundary`, or `invalid`)
- default seed, limited to 64 Unicode code points
- whether confirmation is required before filling

Generated profiles and fill results are kept only in memory while the popup is open. They are not written to extension storage.

## Permissions

- `activeTab`: temporary access to the current tab after the user invokes the extension.
- `scripting`: injects the local fill function after the user selects **Fill current form**.
- `storage`: stores the three settings listed above on the device.

The production extension does not request host permissions or `<all_urls>` and does not install a persistent content script.

## Retention and deletion

Settings remain in the browser profile until the user changes them, removes them through browser data controls, or uninstalls the extension. Uninstalling the extension removes its local extension storage according to Chrome's behavior.

## Contact

Questions and privacy reports can be filed at [GitHub Issues](https://github.com/50ra4/jp-qa-data-filler/issues).

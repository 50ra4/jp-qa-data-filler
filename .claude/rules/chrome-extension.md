---
paths:
  [
    'manifest.config.ts',
    'src/lib/injection/**',
    'src/entrypoints/popup/**',
    'src/entrypoints/options/**',
  ]
---

MV3 facts specific to this repo:

- Production has popup and options only. Do not add a background worker,
  content script, runtime messaging layer, host permission, or web-accessible
  resource without explicit owner sign-off.
- All manifest changes go through `manifest.config.ts` (`defineManifest`); never hand-edit a raw `manifest.json`.
- Dev vs. build differ in `manifest.config.ts`: the extension name is prefixed
  `[DEV] ${name}` when `command === 'serve'`, and icon filenames get a `-dev`
  suffix (`createIconFileSuffix`).
- Stable package versions are copied to manifest `version`. For prereleases,
  manifest `version` uses the numeric SemVer core and `version_name` preserves
  the complete package version because Chrome rejects prerelease text in `version`.
- Real active-tab access is isolated in `src/lib/injection/executeFill.ts`.
  Validate the active tab and restricted URLs before calling
  `chrome.scripting.executeScript`; execute only in the top frame.
- `fillPage` is a self-contained injected function. It must work after
  serialization with no module closure and must return only the guarded
  `FillPageResult` shape—never field values or page HTML.
- Controlled-form compatibility requires native value setters plus bubbling,
  composed `input` and `change` events. Host-page handlers can react by
  autosaving, submitting, or transmitting values. Keep that risk explicit in
  the persistent safety notice, confirmation dialog, manifest description,
  README, privacy policy, store copy, and manual test plan.
- The extension itself must not click controls, call form submission APIs, or
  initiate external network requests.
- Chrome APIs are typed via `@types/chrome`.

# Manual test plan

Run only against local fixtures or a dedicated QA environment. Do not use production business systems.

## Setup

1. Run `npm ci` with Node.js 24 or later.
2. Run `npm run verify:full`.
3. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
4. Select this repository's `extension/` directory.
5. Confirm the manifest shows only `activeTab`, `scripting`, and `storage`, with no site access requested at installation.

## Core activeTab path

1. Open a normal local HTML form in the active tab.
2. Click the extension action icon. Do not navigate directly to `popup.html` for this check.
3. Verify the preview changes when preset or seed changes.
4. Select **Fill current form** and confirm execution.
5. Verify the confirmation explains that page scripts may autosave, submit, or transmit values in response to `input`/`change` events.
6. Verify recognized name, Kana, email, phone, postal, address, and organization fields are filled.
7. Verify the popup remains open and reports filled, skipped, unmatched, and warning counts.
8. Repeat with the same seed and confirm the generated values are identical.

## Safety cases

- Confirm password, `current-password`, `new-password`, `one-time-code`, and every `cc-*` field stay unchanged.
- Confirm hidden, file, checkbox, radio, submit, button, disabled, and readonly controls stay unchanged.
- On a form with no page handler that submits, attach a `submit` listener and confirm its count remains zero.
- Add a page `input` handler with a local autosave counter and confirm it runs, proving why the popup warning is required. Do not connect this fixture to a network endpoint.
- Confirm an ambiguous label such as `名前` remains unchanged and appears as ambiguous.
- Confirm a prefecture select changes only when exactly one option text or value matches.

## Compatibility cases

- Verify a React/Vue-style controlled input observes both bubbling `input` and `change` events.
- Verify explicit Japanese labels without autocomplete fill only high-confidence fields.
- Verify nested open Shadow DOM fields fill and closed Shadow DOM remains untouched.
- Verify cross-origin and same-origin iframe contents remain untouched.
- Verify keyboard-only operation, visible focus, and logical tab order in popup and options.
- Verify popup and options in light and dark operating-system themes.

## Restricted pages

Open each page, invoke the extension, and confirm an explanatory error appears without a popup crash:

- `chrome://extensions`
- Chrome Web Store
- another extension page
- `about:blank` or `view-source:` URL

## Expected limitations

Closed Shadow DOM, iframes, contenteditable, custom controls, ambiguous fields, and site-specific selector conventions are intentionally unsupported. Host-page reactions to dispatched `input` and `change` events—including autosave, submission, and network transmission—are outside the extension's control.

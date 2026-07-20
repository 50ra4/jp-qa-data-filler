---
name: add-entrypoint
description: Rewire the popup or options surface in JP QA Data Filler. Use when changing the HTML, React mount, or manifest wiring for either existing product surface.
---

JP QA Data Filler has exactly two product surfaces: popup and options. Adding a
background worker, content script, runtime messaging layer, host permission, or
web-accessible resource requires explicit owner sign-off and is outside this
recipe.

Three wiring points, in order:

1. **Root-level HTML**: update `popup.html` or `options.html` at repo root with
   `<div id="root"></div>` and `<script type="module" src="/src/entrypoints/<surface>/<name>.tsx"></script>`.
   Copy the shape of the existing `popup.html`/`options.html`.

2. **`src/entrypoints/<surface>/<name>.tsx`**: standard mount boilerplate — see
   `.claude/rules/typescript-react.md` for the exact snippet, don't re-derive it.

3. **Register in `manifest.config.ts`** — the key depends on the surface:
   - popup → `action.default_popup: '<name>.html'`
   - options page → `options_ui.page: '<name>.html'`

**Verify:**

- `npm run verify:full` — confirm the built manifest still has popup/options
  only and the real-Chromium product flow passes.
- `npm run dev` gives HMR for the new surface via `@crxjs/vite-plugin`.

# jp-qa-data-filler

Chrome Manifest V3 extension built with Vite, TypeScript, and React. The product
has exactly two extension surfaces: popup and options. It has no background
service worker, content script, runtime messaging layer, or persistent host
access. The popup invokes `src/lib/injection/executeFill.ts` after an explicit
user action; that wrapper uses `activeTab` and `scripting` to run the
self-contained top-frame filler.

Root-level `popup.html` and `options.html` load their matching entrypoints under
`src/entrypoints/`. Shared product code lives under `src/lib/` (generator,
injection, i18n, storage, and testing). The manifest is generated from
`manifest.config.ts`; `npm run build` outputs to `extension/` (gitignored).

## Commands

| Command               | What it does                                                  | Notes                                                                              |
| --------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm ci`              | Install deps                                                  | 407 packages, verified OK                                                          |
| `npm run dev`         | Vite dev server with HMR                                      | via `@crxjs/vite-plugin`                                                           |
| `npm run build`       | Build to `extension/`                                         | deletes and recreates the dir                                                      |
| `npm run package`     | Build, verify manifest, create reproducible `extension.zip`   | archives distributable files from `extension/`                                     |
| `npm run verify`      | check-type → lint → test → build → verify:manifest, in series | the safety contract for most changes; excludes e2e for speed                       |
| `npm run verify:full` | `verify` then `npm run e2e`                                   | full contract; requires installed Chromium                                         |
| `npm run e2e`         | Run Playwright Chromium smoke tests                           | requires a prior build and installed Chromium                                      |
| `npm run check-type`  | `tsc --noEmit`                                                |                                                                                    |
| `npm test`            | Run Vitest                                                    | src tests use jsdom; script tests use Node                                         |
| `npm run lint`        | `oxlint` (check-only)                                         | no file mutation; pre-commit runs the staged-only equivalent via lint-staged       |
| `npm run format`      | `prettier --write`                                            | rewrites files on disk; pre-commit runs the staged-only equivalent via lint-staged |
| `npm run zip`         | Alias for `npm run package`                                   |                                                                                    |

`.nvmrc` pins Node 24, matching the `engines.node` (`>=24.0.0`) requirement.

## Verification contract

After changing code, prove it is safe with a single command. **The source of truth
is the checks themselves** (types, lint, tests, `verify:manifest`) — this section
only tells you which to run.

- `npm run verify` — check-type → lint → test → build → verify:manifest, in series.
  This is the contract for most changes. `verify:manifest` reads the built
  `extension/manifest.json`, so `build` always runs before it. e2e is excluded here
  because it needs a real Chromium and is slow.
- `npm run verify:full` — `verify` then `npm run e2e` (real Chromium smoke tests).
  Run this when your change could affect the built extension's runtime wiring.

Minimum verification per change type:

| Change                                                                                  | Run                                     |
| --------------------------------------------------------------------------------------- | --------------------------------------- |
| `src/lib/**`, types, unit tests                                                         | `npm run verify`                        |
| `manifest.config.ts`, permissions, CSP                                                  | `npm run verify` (asserts the manifest) |
| popup/options wiring, active-tab injection, storage round-trips, anything e2e exercises | `npm run verify:full`                   |

CI is not changed by this file: it already runs the same underlying checks as
separate jobs. `verify` / `verify:full` are the local and agent-facing entry points.

## Architecture invariants

These hold regardless of the task. Where a check enforces an invariant, that check —
not this file — is the authority; the note explains the intent a check cannot.

- **Dependency direction is `entrypoints → lib` only; `lib` never imports from
  `entrypoints`.** `src/lib/` stays reusable and unit-testable in isolation
  (with `installChromeFake` from `src/lib/testing/chromeFake.ts`); a back-edge would
  couple shared code to one surface.
- **Entrypoints do not import each other directly.** Popup and options are
  separate runtime contexts; reusable behavior belongs in `src/lib/`.
- **Real `chrome.*` access lives only inside `src/lib/`.** Outside `src/lib/**`,
  referencing the `chrome` global is an Oxlint error (`no-restricted-globals` /
  `no-restricted-properties` override in `.oxlintrc.json`); route the call through a
  thin `src/lib/` wrapper instead. Type-only references via the `chrome` namespace
  (`@types/chrome`) are allowed everywhere. An unavoidable exception must carry a
  reasoned `oxlint-disable` comment so the boundary violation stays visible.
- **The production surface and permission set is fixed.** The manifest has popup
  and options only, permissions `activeTab`, `scripting`, and `storage`, and no
  background, `content_scripts`, host permissions, or
  `web_accessible_resources`. Expanding this boundary requires explicit owner
  sign-off.
- **Form event side effects are disclosed.** The filler dispatches bubbling,
  composed `input` and `change` events for controlled forms. Host-page scripts
  can react by autosaving, submitting, or transmitting values, so UI and docs
  must not claim the page itself cannot do so.

## Recipes

Minimal, real code paths for the common changes. Each recipe ends with the
verification its change type calls for in **Verification contract** above — not a
blanket command.

- **Change field detection or filling.** Add a failing colocated test in
  `src/lib/injection/fillPage.test.ts` first, then update `fillPage.ts`. Preserve
  sensitive-field exclusion, top-frame-only execution, deterministic results,
  and bubbling/composed `input` and `change` events. Run **`npm run verify:full`**
  because real Chromium covers the injected controlled-form flow.
- **Add a storage key.** In `src/lib/storage/schema.ts`, add the key to the
  `AppStorageValues` type and to `storageSchema` (`area` + `defaultValue`). Everything
  else (`getStorageValue` / `setStorageValue` / `removeStorageValue` /
  `onStorageValueChanged` / `useStorageValue`) is generic and follows automatically.
  The schema edit is `src/lib/**`-only, so **`npm run verify`** covers it; if you also
  wire a surface to read or write the key, verify that with `npm run verify:full`.
- **Add a Chrome permission.** Add it to `permissions` (or `host_permissions` /
  `optional_permissions`) in `manifest.config.ts`, **and** update the matching
  allowlist (`EXPECTED_PERMISSIONS`, `EXPECTED_HOST_PERMISSIONS`, …) in
  `scripts/verify-manifest.mjs`. A mismatch makes `verify:manifest` fail by design —
  that failure is the guard against silent privilege growth. **`npm run verify`** asserts it.

## Forbidden changes

Do not make these without explicit owner sign-off. Most are enforced by
`scripts/verify-manifest.mjs`, which fails the build on violation:

- Adding a background worker, content script, runtime messaging layer, or host
  access without explicit owner sign-off.
- Adding a manifest `permission` / `host_permission` without updating the
  `verify-manifest.mjs` allowlist (and without a reason to hold the new privilege).
- Adding an external runtime dependency to `src/lib/` — generation, injection,
  and storage are dependency-free by design; keep them so.
- Relaxing the CSP. `verify:manifest` pins
  `content_security_policy.extension_pages` to `script-src 'self'; object-src 'self';`.
- Declaring `externally_connectable` — `verify:manifest` rejects it outright.

## Conventions

- Named exports only, no default exports — except `*.config.ts` (`vite.config.ts`, `manifest.config.ts`, `playwright.config.ts`, `vitest.config.ts`), which must keep `export default` because Vite/CRXJS/Playwright/Vitest require it to load the config.
- Components are arrow functions.
- Unit tests are colocated as `*.test.ts(x)` next to TypeScript source or `*.test.mjs` next to Node scripts; Playwright smoke tests live under `e2e/` as `*.spec.ts`.
- Hooks return tuples `as const` (state, action).
- Everything else (formatting, quote style, etc.) is enforced by Oxlint/Prettier/tsc — run them, don't hand-check. Import order is not lint-enforced (no Oxlint equivalent to the old `import/order`); keep imports reasonably grouped by convention.

## On-demand context

Read these only when the row matches your task — they are excluded from the always-loaded context by design.

| When you are...                                                               | Read                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------- |
| editing any `.ts`/`.tsx` file                                                 | `.claude/rules/typescript-react.md`      |
| touching `manifest.config.ts`, `src/lib/injection/**`, or Chrome API wrappers | `.claude/rules/chrome-extension.md`      |
| writing tests                                                                 | `.claude/rules/testing.md`               |
| rewiring popup or options                                                     | `.claude/skills/add-entrypoint/SKILL.md` |
| releasing/packaging/deploying                                                 | `.claude/skills/release/SKILL.md`        |

## Git

- Stage files individually; never `git add -A` / `git add .`.
- Use Conventional Commit types: feat, fix, docs, style, refactor, test, chore.
- Commit body records WHY, not what.

## Responses

Reply in Japanese, conclusion first, concise. No greetings, emoji, or progress narration. Point out problems bluntly.

## Safety

- Destructive ops (rm -rf, force-push, history rewrite) need explicit user approval.
- Never read, print, or commit secrets.
- If the user corrects the same mistake twice, append the correction to the matching `.claude/rules/*.md` file.

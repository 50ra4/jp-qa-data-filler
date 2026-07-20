# 1. Chrome-only runtime target

- Status: Accepted (2026-07-20)
- Deciders: repository owner

## Context

JP QA Data Filler relies on Chrome Manifest V3 `activeTab`, `scripting`, and `storage` behavior. The MVP requirements explicitly exclude browsers other than Chrome. Speculative compatibility work would widen verification and manifest complexity without serving the current product scope.

## Decision

- Chrome is the only supported and verified browser.
- Firefox, Edge, Safari, and other Chromium distributions are not release targets.
- No polyfill, browser-specific manifest branch, or cross-browser build is included.
- Real `chrome.*` access remains localized to `src/lib/**` as an architectural boundary, not as a compatibility claim.

## Consequences

- Permission, active-tab, injection, and E2E behavior can be verified against one declared runtime.
- Users of other browsers receive no compatibility guarantee even if the unpacked artifact happens to load.
- Cross-browser support requires a new product decision, manifest review, API audit, and full browser-specific acceptance suite.

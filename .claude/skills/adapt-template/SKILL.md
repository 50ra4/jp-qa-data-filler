---
name: adapt-template
description: Audit that JP QA Data Filler remains fully adapted from its source template. Use only when checking for stale template metadata or sample surfaces.
---

This repository is already a product, not a reusable extension template. Never
restore template samples, messaging, background, or content-script surfaces.

Audit checklist:

- `package.json`, manifest name, repository URLs, icons, and README identify JP
  QA Data Filler.
- `src/examples/`, background/content entrypoints, and `src/lib/messaging/` are
  absent.
- The production manifest contains only popup/options, permissions
  `activeTab`, `scripting`, and `storage`, and no persistent site access.
- `AGENTS.md` and `.claude/rules/` describe the current product architecture.
- Run `npm run verify:full` after removing any discovered template remnant.

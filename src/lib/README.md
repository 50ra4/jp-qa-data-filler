# Shared library boundaries

`src/lib/` contains reusable, independently tested product logic. Entrypoints may import these modules; shared modules never import entrypoints.

- `generator/`: deterministic PRNG, fixed synthetic datasets, and the 14-field profile generator.
- `injection/fillPage.ts`: a self-contained injected function. Helpers stay inside the function because `chrome.scripting.executeScript({ func })` does not preserve module closures.
- `injection/executeFill.ts`: the only production wrapper for `chrome.tabs` and `chrome.scripting`.
- `i18n/`: complete Japanese and English UI dictionaries.
- `storage/`: typed `chrome.storage.local` schema and React hook for filler settings only.
- `testing/`: the shared Chrome API fake used by unit and component tests.

Do not add external runtime dependencies, reverse imports into `entrypoints`, page-specific selector maps, or direct `chrome.*` calls outside this directory.

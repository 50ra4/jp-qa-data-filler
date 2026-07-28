// @vitest-environment node

import { MANIFEST_DESCRIPTION } from './product-metadata.mjs';

test('manifest description states the extension and host-page submission boundary', () => {
  expect(MANIFEST_DESCRIPTION).toBe(
    'Fill Japanese forms with synthetic QA data. It does not click submit or call submission APIs; page scripts may react to events.',
  );
  expect(MANIFEST_DESCRIPTION.length).toBeLessThanOrEqual(132);
  expect(MANIFEST_DESCRIPTION).not.toMatch(/without submitting/iu);
});

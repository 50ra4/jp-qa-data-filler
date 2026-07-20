import { defineManifest } from '@crxjs/vite-plugin';
import { version } from './package.json';
import { createManifestVersion } from './scripts/manifest-version.mjs';

const manifestVersion = createManifestVersion(version);
const PRODUCT_NAME = 'JP QA Data Filler';

const EXTENSION_NAMES = {
  build: PRODUCT_NAME,
  serve: `[DEV] ${PRODUCT_NAME}`,
} as const;

const createIconFileSuffix = (command: 'build' | 'serve') =>
  command === 'serve' ? '-dev' : '';

// import to `vite.config.ts`
export default defineManifest(({ command }) => ({
  ...manifestVersion,
  manifest_version: 3,
  name: EXTENSION_NAMES[command],
  description:
    'Fill Japanese web forms with deterministic synthetic QA data without submitting them.',
  icons: {
    '16': `public/logo/icon16${createIconFileSuffix(command)}.png`,
    '48': `public/logo/icon48${createIconFileSuffix(command)}.png`,
    '128': `public/logo/icon128${createIconFileSuffix(command)}.png`,
  },
  action: {
    default_popup: 'popup.html',
  },
  options_ui: {
    page: 'options.html',
    open_in_tab: true,
  },
  ...(command === 'build'
    ? {
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'self';",
        },
      }
    : {}),
  // Declare only permissions for Chrome APIs that the extension actually uses.
  // Keep the allowlists in scripts/verify-manifest.mjs in sync when adding one.
  permissions: ['activeTab', 'scripting', 'storage'],
}));

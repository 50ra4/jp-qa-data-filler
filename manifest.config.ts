import { defineManifest } from '@crxjs/vite-plugin';
import { version } from './package.json';
import { createManifestVersion } from './scripts/manifest-version.mjs';

const manifestVersion = createManifestVersion(version);

const createIconFileSuffix = (command: 'build' | 'serve') =>
  command === 'serve' ? '-dev' : '';

// import to `vite.config.ts`
export default defineManifest(({ command }) => ({
  ...manifestVersion,
  manifest_version: 3,
  default_locale: 'en',
  name:
    command === 'serve' ? '__MSG_extensionDevName__' : '__MSG_extensionName__',
  description: '__MSG_extensionDescription__',
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

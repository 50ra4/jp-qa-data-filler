import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createManifestVersion } from './manifest-version.mjs';

const EXPECTED_CSP = "script-src 'self'; object-src 'self';";
const EXPECTED_PERMISSIONS = ['activeTab', 'scripting', 'storage'];
const EXPECTED_HOST_PERMISSIONS = [];

const extensionDirectory = fileURLToPath(
  new URL('../extension/', import.meta.url),
);
const manifestPath = resolve(extensionDirectory, 'manifest.json');
const packagePath = fileURLToPath(new URL('../package.json', import.meta.url));
const errors = [];
const references = [];

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const report = (condition, message) => {
  if (!condition) errors.push(message);
};

const readStrings = (value, field) => {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    errors.push(`${field} must be an array of strings.`);
    return undefined;
  }
  return value;
};

const expectSet = (value, expected, field) => {
  const values = readStrings(value ?? [], field);
  if (values === undefined) return [];

  const actual = values.toSorted();
  const wanted = expected.toSorted();
  report(
    JSON.stringify(actual) === JSON.stringify(wanted),
    `${field} must equal ${JSON.stringify(wanted)}; received ${JSON.stringify(actual)}.`,
  );
  return actual;
};

const addReference = (value, field) => {
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${field} must reference a non-empty path.`);
    return;
  }
  references.push({ field, value });
};

const addIconReferences = (icons, field) => {
  if (typeof icons === 'string') {
    addReference(icons, field);
  } else if (isRecord(icons)) {
    for (const [size, path] of Object.entries(icons)) {
      addReference(path, `${field}.${size}`);
    }
  } else {
    errors.push(`${field} must be a path or an icon-size map.`);
  }
};

let manifest;
let packageJson;
try {
  [manifest, packageJson] = await Promise.all([
    readFile(manifestPath, 'utf8').then(JSON.parse),
    readFile(packagePath, 'utf8').then(JSON.parse),
  ]);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Manifest verification failed:\n- ${message}`);
  process.exit(1);
}

if (!isRecord(manifest)) {
  console.error('Manifest verification failed:\n- manifest must be an object.');
  process.exit(1);
}

if (!isRecord(packageJson) || typeof packageJson.version !== 'string') {
  console.error(
    'Manifest verification failed:\n- package.json version must be a string.',
  );
  process.exit(1);
}

const expectedManifestVersion = createManifestVersion(packageJson.version);

report(
  manifest.version === expectedManifestVersion.version,
  `version must equal ${JSON.stringify(expectedManifestVersion.version)}; received ${JSON.stringify(manifest.version)}.`,
);
report(
  manifest.version_name === expectedManifestVersion.version_name,
  `version_name must equal ${JSON.stringify(expectedManifestVersion.version_name)}; received ${JSON.stringify(manifest.version_name)}.`,
);

report(
  manifest.manifest_version === 3,
  `manifest_version must be 3; received ${JSON.stringify(manifest.manifest_version)}.`,
);
expectSet(manifest.permissions, EXPECTED_PERMISSIONS, 'permissions');
expectSet(
  manifest.host_permissions,
  EXPECTED_HOST_PERMISSIONS,
  'host_permissions',
);
expectSet(manifest.optional_permissions, [], 'optional_permissions');
expectSet(manifest.optional_host_permissions, [], 'optional_host_permissions');
report(
  manifest.externally_connectable === undefined,
  'externally_connectable must not be declared.',
);

const csp = manifest.content_security_policy?.extension_pages;
report(
  csp === EXPECTED_CSP,
  `content_security_policy.extension_pages must equal ${JSON.stringify(EXPECTED_CSP)}; received ${JSON.stringify(csp)}.`,
);

if (manifest.icons !== undefined) addIconReferences(manifest.icons, 'icons');
if (manifest.action?.default_icon !== undefined) {
  addIconReferences(manifest.action.default_icon, 'action.default_icon');
}
if (manifest.action?.default_popup !== undefined) {
  addReference(manifest.action.default_popup, 'action.default_popup');
}
report(
  manifest.action?.default_popup === 'popup.html',
  'action.default_popup must equal "popup.html".',
);
if (manifest.options_ui?.page !== undefined) {
  addReference(manifest.options_ui.page, 'options_ui.page');
}
report(
  manifest.options_ui?.page === 'options.html',
  'options_ui.page must equal "options.html".',
);
report(
  manifest.options_ui?.open_in_tab === true,
  'options_ui.open_in_tab must be true.',
);
report(
  manifest.background === undefined,
  'background must not be declared.',
);

report(
  Array.isArray(manifest.content_scripts ?? []),
  'content_scripts must be an array.',
);
const contentScripts = Array.isArray(manifest.content_scripts)
  ? manifest.content_scripts
  : [];
report(contentScripts.length === 0, 'content_scripts must be empty or absent.');

report(
  Array.isArray(manifest.web_accessible_resources ?? []),
  'web_accessible_resources must be an array.',
);
const webAccessibleResources = Array.isArray(manifest.web_accessible_resources)
  ? manifest.web_accessible_resources
  : [];
report(
  webAccessibleResources.length === 0,
  'web_accessible_resources must be empty or absent.',
);

const verifyReference = async ({ field, value }) => {
  const absolutePath = resolve(extensionDirectory, value);
  const localPath = relative(extensionDirectory, absolutePath);
  if (
    isAbsolute(value) ||
    /^[a-z][a-z0-9+.-]*:/iu.test(value) ||
    localPath === '..' ||
    localPath.startsWith('../') ||
    localPath.startsWith('..\\') ||
    isAbsolute(localPath)
  ) {
    return `${field} must stay within the extension directory: ${value}`;
  }

  try {
    const file = await stat(absolutePath);
    return file.isFile()
      ? undefined
      : `${field} does not reference a file: ${value}`;
  } catch {
    return `${field} references a missing file: ${value}`;
  }
};

const referenceErrors = await Promise.all(references.map(verifyReference));
errors.push(...referenceErrors.filter(Boolean));

if (errors.length > 0) {
  console.error(
    `Manifest verification failed:\n${errors.map((error) => `- ${error}`).join('\n')}`,
  );
  process.exit(1);
}

console.log('Manifest verification passed.');

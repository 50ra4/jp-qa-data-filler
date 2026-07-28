import { createServer, type Server } from 'node:http';
import { access, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

import {
  chromium,
  expect,
  test as base,
  type BrowserContext,
  type Page,
} from '@playwright/test';

const E2E_HOST_PERMISSION = 'http://127.0.0.1/*';

type TestFixtures = {
  extensionPage: Page;
  testPage: Page;
};

type WorkerFixtures = {
  extensionContext: BrowserContext;
  extensionId: string;
  testServerOrigin: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const prepareExtension = async (): Promise<{
  extensionPath: string;
  temporaryDirectory: string;
}> => {
  const builtExtensionPath = resolve(process.cwd(), 'extension');
  const builtManifestPath = join(builtExtensionPath, 'manifest.json');

  try {
    await access(builtManifestPath);
  } catch {
    throw new Error(
      'E2E requires extension/manifest.json. Run "npm run build" first.',
    );
  }

  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'jpqa-e2e-'));
  const extensionPath = join(temporaryDirectory, 'extension');

  try {
    await cp(builtExtensionPath, extensionPath, { recursive: true });
    const manifestPath = join(extensionPath, 'manifest.json');
    const parsedManifest: unknown = JSON.parse(
      await readFile(manifestPath, 'utf8'),
    );
    if (!isRecord(parsedManifest)) {
      throw new Error('Built extension manifest must be an object.');
    }
    parsedManifest.host_permissions = [E2E_HOST_PERMISSION];
    parsedManifest.background = {
      service_worker: 'e2e-worker.js',
    };
    await Promise.all([
      writeFile(
        manifestPath,
        `${JSON.stringify(parsedManifest, null, 2)}\n`,
        'utf8',
      ),
      writeFile(
        join(extensionPath, 'e2e-worker.js'),
        "chrome.runtime.onInstalled.addListener(() => undefined);\n",
        'utf8',
      ),
    ]);
    return { extensionPath, temporaryDirectory };
  } catch (error: unknown) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
};

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolvePromise, rejectPromise) => {
    server.close((error) => {
      if (error) rejectPromise(error);
      else resolvePromise();
    });
    server.closeAllConnections();
  });

const contentTypeFor = (filePath: string): string =>
  extname(filePath) === '.html'
    ? 'text/html; charset=utf-8'
    : 'application/octet-stream';

export const test = base.extend<TestFixtures, WorkerFixtures>({
  extensionContext: [
    // Playwright requires the fixture dependency argument to use object destructuring.
    // oxlint-disable-next-line no-empty-pattern
    async ({}, provide) => {
      const { extensionPath, temporaryDirectory } = await prepareExtension();
      let context: BrowserContext | undefined;

      try {
        context = await chromium.launchPersistentContext(
          join(temporaryDirectory, 'user-data'),
          {
            channel: 'chromium',
            headless: true,
            args: [
              `--disable-extensions-except=${extensionPath}`,
              `--load-extension=${extensionPath}`,
            ],
          },
        );
        await provide(context);
      } finally {
        await context?.close();
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    },
    { scope: 'worker' },
  ],

  extensionId: [
    async ({ extensionContext }, provide) => {
      let serviceWorker = extensionContext
        .serviceWorkers()
        .find((worker) => worker.url().startsWith('chrome-extension://'));
      serviceWorker ??= await extensionContext.waitForEvent('serviceworker', {
        predicate: (worker) => worker.url().startsWith('chrome-extension://'),
      });
      await provide(new URL(serviceWorker.url()).host);
    },
    { scope: 'worker' },
  ],

  testServerOrigin: [
    // Playwright requires the fixture dependency argument to use object destructuring.
    // oxlint-disable-next-line no-empty-pattern
    async ({}, provide) => {
      const pagesDirectory = resolve(process.cwd(), 'e2e/pages');
      const server = createServer(async (request, response) => {
        const requestedName = new URL(
          request.url ?? '/',
          'http://127.0.0.1',
        ).pathname.slice(1);
        if (!/^[a-z-]+\.html$/u.test(requestedName)) {
          response.writeHead(404, { Connection: 'close' });
          response.end('Not found');
          return;
        }
        try {
          const filePath = join(pagesDirectory, requestedName);
          const body = await readFile(filePath);
          response.writeHead(200, {
            Connection: 'close',
            'Content-Type': contentTypeFor(filePath),
          });
          response.end(body);
        } catch {
          response.writeHead(404, { Connection: 'close' });
          response.end('Not found');
        }
      });

      await new Promise<void>((resolvePromise, rejectPromise) => {
        server.once('error', rejectPromise);
        server.listen(0, '127.0.0.1', resolvePromise);
      });
      const address = server.address();
      if (!address || typeof address === 'string') {
        await closeServer(server);
        throw new Error('Failed to resolve the local E2E server address.');
      }
      try {
        await provide(`http://127.0.0.1:${address.port}`);
      } finally {
        await closeServer(server);
      }
    },
    { scope: 'worker' },
  ],

  extensionPage: async ({ extensionContext }, provide) => {
    const page = await extensionContext.newPage();
    try {
      await provide(page);
    } finally {
      await page.close();
    }
  },

  testPage: async ({ extensionContext }, provide) => {
    const page = await extensionContext.newPage();
    try {
      await provide(page);
    } finally {
      await page.close();
    }
  },
});

export { expect };

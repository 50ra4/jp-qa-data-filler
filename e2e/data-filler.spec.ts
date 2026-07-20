import { expect, test } from './fixtures';

const popupUrl = (extensionId: string): string =>
  `chrome-extension://${extensionId}/popup.html`;

test('standard formへ入力し、機密項目とsubmitを安全に除外する', async ({
  extensionId,
  extensionPage,
  testPage,
  testServerOrigin,
}) => {
  await testPage.goto(`${testServerOrigin}/standard-form.html`);
  await extensionPage.goto(popupUrl(extensionId));
  await testPage.bringToFront();

  await extensionPage.getByLabel('Seed').fill('e2e-repeatable');
  await extensionPage
    .getByRole('button', { name: 'Fill current form' })
    .click();
  await extensionPage.getByRole('button', { name: 'Fill form' }).click();

  await expect(extensionPage.getByText('Filled: 14')).toBeVisible();
  await expect(extensionPage.getByText(/Skipped: [1-9]/u)).toBeVisible();
  await expect(testPage.locator('[autocomplete="name"]')).not.toHaveValue('');
  await expect(testPage.locator('#email')).toHaveValue(/@example\.com$/u);
  await expect(
    testPage.locator('[autocomplete="current-password"]'),
  ).toHaveValue('');
  await expect(testPage.locator('[autocomplete="one-time-code"]')).toHaveValue(
    '',
  );
  await expect(testPage.locator('[autocomplete="cc-number"]')).toHaveValue('');
  await expect(testPage.locator('[data-sensitive-japanese]')).toHaveValue('');
  await expect(testPage.locator('[data-sensitive-hidden]')).toHaveValue('');
  await expect(testPage.locator('[data-explicit-disabled]')).toHaveValue('');
  await expect(testPage.locator('[data-fieldset-disabled]')).toHaveValue('');
  await expect(testPage.locator('[readonly]')).toHaveValue('');
  await expect(testPage.locator('#submit-count')).toHaveText('0');

  const firstEmail = await testPage.locator('#email').inputValue();
  await extensionPage
    .getByRole('button', { name: 'Fill current form' })
    .click();
  await extensionPage.getByRole('button', { name: 'Fill form' }).click();
  await expect(testPage.locator('#email')).toHaveValue(firstEmail);
});

test('framework型inputでinput/change eventを反映する', async ({
  extensionId,
  extensionPage,
  testPage,
  testServerOrigin,
}) => {
  await testPage.goto(`${testServerOrigin}/react-form.html`);
  await extensionPage.goto(popupUrl(extensionId));
  await testPage.bringToFront();

  await extensionPage
    .getByRole('button', { name: 'Fill current form' })
    .click();
  await extensionPage.getByRole('button', { name: 'Fill form' }).click();

  await expect(testPage.locator('#email-state')).toHaveText(/@example\.com$/u);
  await expect(testPage.locator('#input-count')).toHaveText('1');
  await expect(testPage.locator('#change-count')).toHaveText('1');
});

test('open Shadow DOM内の項目へ入力する', async ({
  extensionId,
  extensionPage,
  testPage,
  testServerOrigin,
}) => {
  await testPage.goto(`${testServerOrigin}/shadow-form.html`);
  await extensionPage.goto(popupUrl(extensionId));
  await testPage.bringToFront();

  await extensionPage
    .getByRole('button', { name: 'Fill current form' })
    .click();
  await extensionPage.getByRole('button', { name: 'Fill form' }).click();

  await expect(testPage.locator('#open-host').locator('input')).toHaveValue(
    /@example\.com$/u,
  );
  await expect(testPage.locator('#closed-value')).toHaveText('untouched');
});

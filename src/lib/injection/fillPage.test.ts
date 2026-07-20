import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { generateProfile } from '../generator/generateProfile';
import { fillPage } from './fillPage';

const profile = generateProfile('fill-page', 'valid');

const setBody = (html: string) => {
  document.body.innerHTML = html;
};

beforeEach(() => {
  setBody('');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fillPage', () => {
  test('autocompleteで対応する11種を最優先で分類する', () => {
    const mappings = [
      ['name', 'fullName'],
      ['family-name', 'familyName'],
      ['given-name', 'givenName'],
      ['email', 'email'],
      ['tel-national', 'tel'],
      ['postal-code', 'postalCode'],
      ['address-level1', 'prefecture'],
      ['address-level2', 'locality'],
      ['address-line1', 'streetAddress'],
      ['street-address', 'fullAddress'],
      ['organization', 'organization'],
    ] as const;
    setBody(
      `<form>${mappings
        .map(
          ([token, kind]) =>
            kind === 'prefecture'
              ? `<select autocomplete="${token}" data-kind="${kind}"><option>${profile.prefecture}</option></select>`
              : `<input autocomplete="${token}" data-kind="${kind}">`,
        )
        .join('')}</form>`,
    );

    const result = fillPage(profile, 'valid');

    expect(result.filled).toHaveLength(mappings.length);
    for (const [, kind] of mappings) {
      expect(
        document.querySelector<HTMLInputElement>(`[data-kind="${kind}"]`)?.value,
      ).toBe(profile[kind]);
    }
    expect(result.filled.every(({ confidence }) => confidence === 100)).toBe(
      true,
    );
  });

  test('日本語labelからカナを含む14種を分類する', () => {
    const labels = [
      ['氏名', 'fullName'],
      ['姓', 'familyName'],
      ['名', 'givenName'],
      ['氏名カナ', 'fullNameKana'],
      ['姓カナ', 'familyNameKana'],
      ['名カナ', 'givenNameKana'],
      ['メールアドレス', 'email'],
      ['電話番号', 'tel'],
      ['郵便番号', 'postalCode'],
      ['都道府県', 'prefecture'],
      ['市区町村', 'locality'],
      ['番地', 'streetAddress'],
      ['住所全文', 'fullAddress'],
      ['会社名', 'organization'],
    ] as const;
    setBody(
      `<form>${labels
        .map(
          ([label, kind]) =>
            kind === 'prefecture'
              ? `<label>${label}<select data-kind="${kind}"><option value="${profile.prefecture}">${profile.prefecture}</option></select></label>`
              : `<label>${label}<input data-kind="${kind}"></label>`,
        )
        .join('')}</form>`,
    );

    const result = fillPage(profile, 'valid');

    expect(result.filled.map(({ fieldKind }) => fieldKind).toSorted()).toEqual(
      labels.map(([, kind]) => kind).toSorted(),
    );
  });

  test('曖昧な「名前」は入力しない', () => {
    setBody('<label>名前<input value="original"></label>');

    const result = fillPage(profile, 'valid');

    expect(document.querySelector('input')?.value).toBe('original');
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ reason: 'AMBIGUOUS' }),
    );
  });

  test.each([
    '<input type="password" name="login_password">',
    '<input autocomplete="current-password">',
    '<input autocomplete="new-password">',
    '<input autocomplete="one-time-code">',
    '<input autocomplete="cc-number">',
    '<input name="credit_card_number">',
    '<label>CVV<input></label>',
  ])('機密項目を除外する: %s', (control) => {
    setBody(control);

    const result = fillPage(profile, 'invalid');

    expect(document.querySelector<HTMLInputElement>('input')?.value).toBe('');
    expect(result.skipped[0]?.reason).toBe('SENSITIVE_FIELD');
  });

  test.each([
    ['<input type="hidden" autocomplete="email">', 'HIDDEN'],
    ['<input hidden autocomplete="email">', 'HIDDEN'],
    ['<input style="display:none" autocomplete="email">', 'HIDDEN'],
    ['<input disabled autocomplete="email">', 'DISABLED'],
    ['<input readonly autocomplete="email">', 'READONLY'],
    ['<input type="file" name="email">', 'UNSUPPORTED_CONTROL'],
    ['<input type="checkbox" name="email">', 'UNSUPPORTED_CONTROL'],
    ['<input type="radio" name="email">', 'UNSUPPORTED_CONTROL'],
    ['<input type="submit" name="email">', 'UNSUPPORTED_CONTROL'],
  ])('操作不能な項目を除外する: %s', (control, reason) => {
    setBody(control);

    const result = fillPage(profile, 'valid');

    expect(result.skipped[0]?.reason).toBe(reason);
  });

  test('native setterでinputとtextareaを更新しinput/changeだけを送る', () => {
    setBody(`
      <form>
        <label>メールアドレス<input></label>
        <label>住所全文<textarea></textarea></label>
        <button type="submit">送信</button>
      </form>
    `);
    const input = document.querySelector('input');
    const textarea = document.querySelector('textarea');
    const form = document.querySelector('form');
    const inputEvents: string[] = [];
    const textareaEvents: string[] = [];
    const submit = vi.fn((event: Event) => event.preventDefault());
    input?.addEventListener('input', (event) => inputEvents.push(event.type));
    input?.addEventListener('change', (event) => inputEvents.push(event.type));
    textarea?.addEventListener('input', (event) =>
      textareaEvents.push(event.type),
    );
    textarea?.addEventListener('change', (event) =>
      textareaEvents.push(event.type),
    );
    form?.addEventListener('submit', submit);

    fillPage(profile, 'valid');

    expect(input?.value).toBe(profile.email);
    expect(textarea?.value).toBe(profile.fullAddress);
    expect(inputEvents).toEqual(['input', 'change']);
    expect(textareaEvents).toEqual(['input', 'change']);
    expect(submit).not.toHaveBeenCalled();
  });

  test('都道府県selectはNFKC完全一致だけを選ぶ', () => {
    setBody(`
      <label>都道府県
        <select>
          <option value="">選択してください</option>
          <option value="${profile.prefecture}">${profile.prefecture}</option>
        </select>
      </label>
      <label>都道府県
        <select data-unmatched>
          <option value="">選択してください</option>
          <option value="沖縄県">沖縄県</option>
        </select>
      </label>
    `);

    const result = fillPage(profile, 'valid');

    expect(document.querySelector('select')?.value).toBe(profile.prefecture);
    expect(
      document.querySelector<HTMLSelectElement>('select[data-unmatched]')
        ?.value,
    ).toBe('');
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ reason: 'NO_MATCHING_VALUE' }),
    );
  });

  test('open Shadow DOMを再帰走査する', () => {
    const host = document.createElement('div');
    const nestedHost = document.createElement('div');
    const firstRoot = host.attachShadow({ mode: 'open' });
    const secondRoot = nestedHost.attachShadow({ mode: 'open' });
    secondRoot.innerHTML = '<label>メールアドレス<input></label>';
    firstRoot.append(nestedHost);
    document.body.append(host);

    const result = fillPage(profile, 'valid');

    expect(secondRoot.querySelector('input')?.value).toBe(profile.email);
    expect(result.filled).toHaveLength(1);
  });

  test('validとboundaryはmaxLengthへcode point単位で丸めて警告する', () => {
    setBody('<label>会社名<input maxlength="5"></label>');

    const result = fillPage(profile, 'valid');
    const value =
      document.querySelector<HTMLInputElement>('input')?.value ?? '';

    expect([...value]).toHaveLength(5);
    expect(result.warnings[0]).toContain('maxLength');
  });

  test('結果へ入力値やHTMLを含めない', () => {
    setBody('<label>メールアドレス<input id="mail"></label>');

    const result = fillPage(profile, 'valid');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain(profile.email);
    expect(serialized).not.toContain('<input');
    expect(result.filled[0]?.descriptor).toContain('メールアドレス');
  });

  test('外部closureなしで再生成した関数として動作する', () => {
    setBody('<input autocomplete="email">');
    const isolatedFillPage = Function(
      `return (${fillPage.toString()})`,
    )() as typeof fillPage;

    const result = isolatedFillPage(profile, 'valid');

    expect(document.querySelector('input')?.value).toBe(profile.email);
    expect(result.filled).toHaveLength(1);
  });
});

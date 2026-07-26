import type { FillerPreset, QaProfile } from '../generator/types';
import type { FillPageResult } from './types';

export const fillPage = (
  profile: QaProfile,
  preset: FillerPreset,
  options: { skipLayoutCheck?: boolean } = {},
): FillPageResult => {
  const RESULT_LIMIT = 50;
  const autocompleteMap: Record<string, keyof QaProfile> = {
    name: 'fullName',
    'family-name': 'familyName',
    'given-name': 'givenName',
    email: 'email',
    tel: 'tel',
    'tel-national': 'tel',
    'postal-code': 'postalCode',
    'address-level1': 'prefecture',
    'address-level2': 'locality',
    'address-line1': 'streetAddress',
    'street-address': 'fullAddress',
    organization: 'organization',
  };
  const keywords: Record<keyof QaProfile, readonly string[]> = {
    fullName: ['氏名', 'お名前', '姓名', 'fullname'],
    familyName: ['姓', '苗字', '名字', 'lastname', 'familyname'],
    givenName: ['名', 'firstname', 'givenname'],
    fullNameKana: [
      '氏名カナ',
      '氏名かな',
      'フリガナ',
      'ふりがな',
      'お名前カナ',
      'fullnamekana',
    ],
    familyNameKana: ['姓カナ', '姓かな', 'セイ', '苗字カナ', 'familynamekana'],
    givenNameKana: [
      '名カナ',
      '名かな',
      'メイ',
      'givennamekana',
      'firstnamekana',
    ],
    email: ['メールアドレス', 'メール', 'email', 'mailaddress'],
    tel: ['電話番号', '電話', 'tel', 'telephone', 'phone'],
    postalCode: ['郵便番号', '郵便', 'postalcode', 'zipcode', 'zip'],
    prefecture: ['都道府県', 'prefecture'],
    locality: ['市区町村', '市町村', 'addresslevel2', 'city'],
    streetAddress: ['町名番地', '番地', 'addressline1', 'streetaddress'],
    fullAddress: ['住所全文', '住所', 'fulladdress'],
    organization: ['会社名', '法人名', '組織名', 'organization', 'company'],
  };
  const sensitiveTokens = [
    'password',
    'passwd',
    'otp',
    'onetime',
    'passcode',
    'verificationcode',
    'verificationtoken',
    'confirmationcode',
    'authenticationcode',
    'authcode',
    'securitytoken',
    'recoverycode',
    '2facode',
    'mfacode',
    'twofactorcode',
    'multifactorcode',
    'card',
    'credit',
    'cvv',
    'cvc',
    'securitycode',
    'パスワード',
    'パスコード',
    '暗証',
    '認証コード',
    '認証番号',
    '確認コード',
    'ワンタイムパスワード',
    'ワンタイムコード',
    'セキュリティコード',
    'セキュリティ番号',
    'カード',
    'クレジット',
    'デビット',
    '秘密の質問',
    '秘密の答え',
  ];
  const unsupportedInputTypes = new Set([
    'button',
    'checkbox',
    'color',
    'date',
    'file',
    'image',
    'month',
    'number',
    'radio',
    'range',
    'reset',
    'submit',
    'time',
    'week',
  ]);
  const normalizeText = (value: string): string =>
    value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s\p{P}\p{S}_]+/gu, '');
  const normalizeOption = (value: string): string =>
    value.normalize('NFKC').trim();
  const rootByControl = (
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ): Document | ShadowRoot => control.getRootNode() as Document | ShadowRoot;
  const labelTexts = (
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ): string[] => {
    const values: string[] = [];
    for (const label of Array.from(control.labels ?? [])) {
      if (label.textContent?.trim()) values.push(label.textContent.trim());
    }
    const ariaLabel = control.getAttribute('aria-label')?.trim();
    if (ariaLabel) values.push(ariaLabel);
    const root = rootByControl(control);
    const labelledBy = control.getAttribute('aria-labelledby')?.split(/\s+/u);
    for (const id of labelledBy ?? []) {
      const referenced = root.querySelector(
        `[id="${id.replaceAll('"', '\\"')}"]`,
      );
      if (referenced?.textContent?.trim()) {
        values.push(referenced.textContent.trim());
      }
    }
    if (control.id) {
      for (const label of Array.from(root.querySelectorAll('label[for]'))) {
        if (
          label instanceof HTMLLabelElement &&
          label.htmlFor === control.id &&
          label.textContent?.trim()
        ) {
          values.push(label.textContent.trim());
        }
      }
    }
    return [...new Set(values)];
  };
  const descriptorFor = (
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    labels: string[],
  ): string => {
    const value =
      labels[0] ??
      control.getAttribute('name') ??
      control.id ??
      control.getAttribute('placeholder') ??
      `${control.tagName.toLowerCase()}${control instanceof HTMLInputElement ? `:${control.type}` : ''}`;
    return value.replace(/\s+/gu, ' ').trim().slice(0, 80);
  };
  const isSensitive = (
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    labels: string[],
  ): boolean => {
    if (control instanceof HTMLInputElement && control.type === 'password') {
      return true;
    }
    const autocompleteTokens = (control.getAttribute('autocomplete') ?? '')
      .toLowerCase()
      .split(/\s+/u)
      .filter(Boolean);
    if (
      autocompleteTokens.some(
        (token) =>
          token === 'current-password' ||
          token === 'new-password' ||
          token === 'one-time-code' ||
          token.startsWith('cc-'),
      )
    ) {
      return true;
    }
    const evidence = normalizeText(
      [
        control.getAttribute('name') ?? '',
        control.id,
        control.getAttribute('placeholder') ?? '',
        control.getAttribute('aria-label') ?? '',
        ...labels,
      ].join(' '),
    );
    return sensitiveTokens.some((token) => evidence.includes(token));
  };
  const isHidden = (
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ): boolean => {
    if (
      control.hidden ||
      control.getAttribute('aria-hidden') === 'true' ||
      (control instanceof HTMLInputElement && control.type === 'hidden')
    ) {
      return true;
    }
    let element: HTMLElement | null = control;
    while (element) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden')
        return true;
      const root = element.getRootNode();
      element =
        element.parentElement ??
        (root instanceof ShadowRoot ? (root.host as HTMLElement) : null);
    }
    return !options.skipLayoutCheck && control.getClientRects().length === 0;
  };
  const classify = (
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    labels: string[],
  ):
    | { kind: keyof QaProfile; confidence: number }
    | { ambiguous: true }
    | undefined => {
    const autocompleteTokens = (control.getAttribute('autocomplete') ?? '')
      .toLowerCase()
      .split(/\s+/u)
      .filter(Boolean);
    for (const token of autocompleteTokens) {
      const mapped = autocompleteMap[token];
      if (mapped) return { kind: mapped, confidence: 100 };
    }
    const normalizedLabels = labels.map(normalizeText).filter(Boolean);
    const identityValues = [control.name, control.id]
      .map(normalizeText)
      .filter(Boolean);
    const placeholderValues = [control.getAttribute('placeholder') ?? '']
      .map(normalizeText)
      .filter(Boolean);
    if (
      [...normalizedLabels, ...identityValues].some(
        (value) => value === '名前' || value === 'name',
      )
    ) {
      return { ambiguous: true };
    }
    const scores = new Map<keyof QaProfile, number>();
    const addScores = (
      values: string[],
      exactScore: number,
      partialScore: number,
    ) => {
      for (const [kind, patterns] of Object.entries(keywords) as [
        keyof QaProfile,
        readonly string[],
      ][]) {
        for (const value of values) {
          for (const pattern of patterns) {
            const normalizedPattern = normalizeText(pattern);
            const score =
              value === normalizedPattern
                ? exactScore
                : normalizedPattern.length >= 2 &&
                    value.includes(normalizedPattern)
                  ? partialScore
                  : 0;
            if (score > (scores.get(kind) ?? 0)) scores.set(kind, score);
          }
        }
      }
    };
    addScores(normalizedLabels, 80, 65);
    addScores(identityValues, 60, 50);
    addScores(placeholderValues, 35, 35);
    if (control instanceof HTMLInputElement) {
      const typeKind =
        control.type === 'email'
          ? 'email'
          : control.type === 'tel'
            ? 'tel'
            : undefined;
      if (typeKind && 20 > (scores.get(typeKind) ?? 0)) {
        scores.set(typeKind, 20);
      }
    }
    const ranked = [...scores.entries()].sort(
      ([firstKind, firstScore], [secondKind, secondScore]) =>
        secondScore - firstScore || firstKind.localeCompare(secondKind, 'en'),
    );
    const [top, second] = ranked;
    if (!top || top[1] < 60) return undefined;
    if (second && top[1] - second[1] < 15) return { ambiguous: true };
    return { kind: top[0], confidence: top[1] };
  };
  const findValueSetter = (control: Element): ((value: string) => void) => {
    let prototype = Object.getPrototypeOf(control) as object | null;
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor?.set) return descriptor.set.bind(control);
      prototype = Object.getPrototypeOf(prototype) as object | null;
    }
    throw new Error('value setter is unavailable');
  };
  const dispatchValueEvents = (control: Element) => {
    // Controlled forms require these events. Host-page handlers may autosave,
    // submit, or transmit values, so the popup and docs disclose that risk.
    control.dispatchEvent(
      new Event('input', { bubbles: true, composed: true }),
    );
    control.dispatchEvent(
      new Event('change', { bubbles: true, composed: true }),
    );
  };
  const result: FillPageResult = {
    filled: [],
    skipped: [],
    unmatchedCount: 0,
    warnings: [],
    omitted: {
      filled: 0,
      skipped: 0,
      warnings: 0,
    },
  };
  let reportedCount = 0;
  const pushLimited = <
    Key extends 'filled' | 'skipped' | 'warnings',
    Value extends FillPageResult[Key][number],
  >(
    key: Key,
    value: Value,
  ) => {
    const values = result[key] as Value[];
    if (reportedCount < RESULT_LIMIT) {
      values.push(value);
      reportedCount += 1;
    } else {
      result.omitted[key] += 1;
    }
  };
  const roots: (Document | ShadowRoot)[] = [document];
  const visited = new Set<Document | ShadowRoot>();

  while (roots.length > 0) {
    const root = roots.shift();
    if (!root || visited.has(root)) continue;
    visited.add(root);
    for (const element of Array.from(root.querySelectorAll('*'))) {
      if (element.shadowRoot && !visited.has(element.shadowRoot)) {
        roots.push(element.shadowRoot);
      }
    }
    const controls = Array.from(
      root.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >('input, textarea, select'),
    );
    for (const control of controls) {
      const labels = labelTexts(control);
      const descriptor = descriptorFor(control, labels);
      if (isSensitive(control, labels)) {
        pushLimited('skipped', { descriptor, reason: 'SENSITIVE_FIELD' });
        continue;
      }
      if (
        control.matches(':disabled') ||
        control.getAttribute('aria-disabled') === 'true'
      ) {
        pushLimited('skipped', { descriptor, reason: 'DISABLED' });
        continue;
      }
      if (
        (control instanceof HTMLInputElement ||
          control instanceof HTMLTextAreaElement) &&
        control.readOnly
      ) {
        pushLimited('skipped', { descriptor, reason: 'READONLY' });
        continue;
      }
      if (isHidden(control)) {
        pushLimited('skipped', { descriptor, reason: 'HIDDEN' });
        continue;
      }
      if (
        control instanceof HTMLInputElement &&
        unsupportedInputTypes.has(control.type)
      ) {
        pushLimited('skipped', { descriptor, reason: 'UNSUPPORTED_CONTROL' });
        continue;
      }
      const classified = classify(control, labels);
      if (!classified) {
        result.unmatchedCount += 1;
        continue;
      }
      if ('ambiguous' in classified) {
        pushLimited('skipped', { descriptor, reason: 'AMBIGUOUS' });
        continue;
      }
      if (
        control instanceof HTMLSelectElement &&
        classified.kind !== 'prefecture'
      ) {
        pushLimited('skipped', { descriptor, reason: 'UNSUPPORTED_CONTROL' });
        continue;
      }
      const sourceValue = profile[classified.kind];
      try {
        if (control instanceof HTMLSelectElement) {
          const expected = normalizeOption(sourceValue);
          const matches = Array.from(control.options).filter(
            (option) =>
              normalizeOption(option.value) === expected ||
              normalizeOption(option.textContent ?? '') === expected,
          );
          if (matches.length !== 1) {
            pushLimited('skipped', {
              descriptor,
              reason: 'NO_MATCHING_VALUE',
            });
            continue;
          }
          const value = matches[0].value;
          findValueSetter(control)(value);
          if (control.value !== value) {
            pushLimited('skipped', {
              descriptor,
              reason: 'VALUE_REJECTED',
            });
            continue;
          }
          dispatchValueEvents(control);
        } else {
          const maxLength = control.maxLength;
          const shouldTruncate =
            preset !== 'invalid' &&
            maxLength >= 0 &&
            [...sourceValue].length > maxLength;
          const value = shouldTruncate
            ? [...sourceValue].slice(0, maxLength).join('')
            : sourceValue;
          findValueSetter(control)(value);
          if (control.value !== value) {
            pushLimited('skipped', {
              descriptor,
              reason: 'VALUE_REJECTED',
            });
            continue;
          }
          if (shouldTruncate) {
            pushLimited('warnings', {
              code: 'TRUNCATED',
              descriptor,
              detail: maxLength,
            });
          }
          dispatchValueEvents(control);
        }
        pushLimited('filled', {
          fieldKind: classified.kind,
          descriptor,
          confidence: classified.confidence,
        });
      } catch {
        pushLimited('skipped', { descriptor, reason: 'WRITE_FAILED' });
      }
    }
  }

  return result;
};

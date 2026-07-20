export const FAMILY_NAMES = [
  { kanji: '佐藤', kana: 'サトウ' },
  { kanji: '鈴木', kana: 'スズキ' },
  { kanji: '高橋', kana: 'タカハシ' },
  { kanji: '田中', kana: 'タナカ' },
  { kanji: '伊藤', kana: 'イトウ' },
  { kanji: '渡辺', kana: 'ワタナベ' },
  { kanji: '山本', kana: 'ヤマモト' },
  { kanji: '中村', kana: 'ナカムラ' },
] as const;

export const GIVEN_NAMES = [
  { kanji: '試太郎', kana: 'シタロウ' },
  { kanji: '検花', kana: 'ケンカ' },
  { kanji: '例一', kana: 'レイイチ' },
  { kanji: '架空子', kana: 'カクウコ' },
  { kanji: '確認', kana: 'カクニン' },
  { kanji: '標本', kana: 'ヒョウホン' },
] as const;

export const ADDRESS_PARTS = [
  { prefecture: '東京都', locality: 'テスト市中央区' },
  { prefecture: '北海道', locality: 'サンプル市北区' },
  { prefecture: '大阪府', locality: '検証市浪速区' },
  { prefecture: '京都府', locality: '架空市左京区' },
  { prefecture: '福岡県', locality: '試験市博多区' },
  { prefecture: '愛知県', locality: '確認市中区' },
] as const;

export const COMPANY_SUFFIXES = [
  '品質保証研究所',
  'フォーム検証室',
  '自動試験工房',
  '入力確認センター',
] as const;

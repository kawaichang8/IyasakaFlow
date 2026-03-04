/**
 * CSV のシリアライズ・パース
 * ダブルクォートで囲み、内部の " は "" にエスケープ
 */

const CSV_SEP = ',';
const CSV_QUOTE = '"';
const CSV_QUOTE_ESCAPED = '""';

/**
 * フィールドをCSV用にエスケープ
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // カンマ・改行・ダブルクォートを含む場合はクォートで囲む
  if (s.includes(CSV_SEP) || s.includes('\n') || s.includes('\r') || s.includes(CSV_QUOTE)) {
    return CSV_QUOTE + s.replace(new RegExp(CSV_QUOTE, 'g'), CSV_QUOTE_ESCAPED) + CSV_QUOTE;
  }
  return s;
}

/**
 * オブジェクト配列をCSV文字列に変換
 */
export function stringifyCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (rows.length === 0) {
    return columns.map((c) => escapeField(c.header)).join(CSV_SEP) + '\n';
  }
  const headerLine = columns.map((c) => escapeField(c.header)).join(CSV_SEP);
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeField(row[col.key])).join(CSV_SEP)
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * ヘッダー名を正規化（比較用: 空白除去・全角→半角）
 */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, '')
    .replace(/，/g, ',')
    .toLowerCase();
}

/**
 * CSV行をパース（区切り文字指定、ダブルクォート対応）
 */
function parseCsvLine(line: string, separator: string = CSV_SEP): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === CSV_QUOTE) {
      if (inQuotes && line[i + 1] === CSV_QUOTE) {
        current += CSV_QUOTE;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * CSV文字列を「論理行」に分割（引用符内の改行は行区切りにしない）
 */
function splitCsvIntoRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === CSV_QUOTE) {
      if (inQuotes && text[i + 1] === CSV_QUOTE) {
        current += CSV_QUOTE;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      current += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      if (current.trim()) rows.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) rows.push(current.trim());
  return rows;
}

/**
 * CSV文字列をオブジェクト配列にパース
 * - 区切り文字: 1行目でカンマ・セミコロン・タブの数を比較し、多い方を採用
 * - ヘッダー: 正規化して照合（空白除去・全角カンマ考慮）
 * - 戻り値: { rows, headerRow } でヘッダー行も返す（エラー表示用）
 */
export function parseCsv(
  csvText: string,
  columns: string[]
): Record<string, string>[];

export function parseCsv(
  csvText: string,
  columns: string[],
  opts: { returnHeaders: true }
): { rows: Record<string, string>[]; headerRow: string[] };

export function parseCsv(
  csvText: string,
  columns: string[],
  opts?: { returnHeaders?: boolean }
): Record<string, string>[] | { rows: Record<string, string>[]; headerRow: string[] } {
  const normalized = csvText
    .replace(/^\uFEFF/, '')
    .replace(/，/g, ',')
    .trim();
  const lines = splitCsvIntoRows(normalized);
  if (lines.length < 2) {
    return opts?.returnHeaders ? { rows: [], headerRow: [] } : [];
  }
  const firstLine = lines[0];
  if (!firstLine) {
    return opts?.returnHeaders ? { rows: [], headerRow: [] } : [];
  }
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const separator =
    tabCount > commaCount && tabCount > semicolonCount ? '\t' :
    semicolonCount > commaCount ? ';' : CSV_SEP;
  const headerRow = parseCsvLine(firstLine, separator);
  const headerNormalized = headerRow.map((h) => normalizeHeader(h));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = parseCsvLine(line, separator);
    const row: Record<string, string> = {};
    columns.forEach((col) => {
      const colStr = typeof col === 'string' ? col : String(col);
      const colNorm = normalizeHeader(colStr);
      const idx = headerNormalized.indexOf(colNorm);
      if (idx >= 0) {
        const raw = values[idx];
        if (raw !== undefined && raw !== null) {
          row[colStr] = String(raw).replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        }
      }
    });
    rows.push(row);
  }
  if (opts?.returnHeaders) {
    return { rows, headerRow };
  }
  return rows;
}

/**
 * エクスポート用カラム定義
 */
export const EXPORT_COLUMNS = {
  accounts: [
    { key: 'name', header: '会社名' },
    { key: 'industry', header: '業種' },
    { key: 'website', header: 'Webサイト' },
    { key: 'phone', header: '電話番号' },
    { key: 'email', header: 'メール' },
    { key: 'address', header: '住所' },
    { key: 'city', header: '市区町村' },
    { key: 'state', header: '都道府県' },
    { key: 'postalCode', header: '郵便番号' },
    { key: 'country', header: '国' },
    { key: 'employeeCount', header: '従業員数' },
    { key: 'annualRevenue', header: '年間売上' },
    { key: 'status', header: 'ステータス' },
    { key: 'description', header: '説明' },
    { key: 'tags', header: 'タグ' },
  ] as const,
  contacts: [
    { key: 'accountName', header: '企業名' },
    { key: 'name', header: '名前' },
    { key: 'email', header: 'メール' },
    { key: 'phone', header: '電話番号' },
    { key: 'mobile', header: '携帯' },
    { key: 'role', header: '役職' },
    { key: 'department', header: '部署' },
    { key: 'influenceLevel', header: '影響力レベル' },
    { key: 'status', header: 'ステータス' },
    { key: 'notes', header: 'メモ' },
    { key: 'tags', header: 'タグ' },
  ] as const,
  deals: [
    { key: 'accountName', header: '企業名' },
    { key: 'contactName', header: '連絡先名' },
    { key: 'name', header: '案件名' },
    { key: 'value', header: '金額' },
    { key: 'currency', header: '通貨' },
    { key: 'stage', header: 'ステージ' },
    { key: 'probability', header: '成約確率' },
    { key: 'expectedCloseDate', header: '予定クローズ日' },
    { key: 'description', header: '説明' },
    { key: 'tags', header: 'タグ' },
  ] as const,
};

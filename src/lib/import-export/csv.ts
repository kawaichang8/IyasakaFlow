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
 * CSV行をパース（簡易実装: ダブルクォート対応）
 */
function parseCsvLine(line: string): string[] {
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
    } else if (char === CSV_SEP && !inQuotes) {
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
 * CSV文字列をオブジェクト配列にパース
 */
export function parseCsv(
  csvText: string,
  columns: string[]
): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headerRow = parseCsvLine(lines[0]);
  const headerMap = headerRow.map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    columns.forEach((col) => {
      const idx = headerMap.indexOf(col.toLowerCase());
      if (idx >= 0 && values[idx] !== undefined) {
        row[col] = values[idx].replace(/^"|"$/g, '').replace(/""/g, '"');
      }
    });
    rows.push(row);
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
    { key: 'firstName', header: '名' },
    { key: 'lastName', header: '姓' },
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

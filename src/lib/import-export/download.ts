/**
 * エクスポートダウンロード用ユーティリティ
 */

export type ExportType = 'accounts' | 'contacts' | 'deals';
export type ExportFormat = 'csv' | 'json';

const EXPORT_INCLUDE_NOTES_KEY = 'export:csv:includeNotes';
const EXPORT_ACCOUNTS_MODE_KEY = 'export:accounts:csvMode'; // 'all' | 'customersOnly'

/**
 * エクスポートを実行し、ファイルをダウンロード
 */
export function downloadExport(type: ExportType, format: ExportFormat): void {
  let url = `/api/export?type=${type}&format=${format}`;
  if (format === 'csv' && typeof window !== 'undefined') {
    const includeNotes = localStorage.getItem(EXPORT_INCLUDE_NOTES_KEY) !== 'false';
    const flag = includeNotes ? '1' : '0';
    url += `&includeNotes=${flag}`;

    if (type === 'accounts') {
      const mode = (localStorage.getItem(EXPORT_ACCOUNTS_MODE_KEY) || 'all') as 'all' | 'customersOnly';
      if (mode === 'customersOnly') {
        url += '&customersOnly=1';
      }
    }
  }
  if (format === 'csv') {
    window.open(url, '_blank');
    return;
  }
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${type}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => {
      throw new Error('エクスポートに失敗しました');
    });
}

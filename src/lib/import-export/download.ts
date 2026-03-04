/**
 * エクスポートダウンロード用ユーティリティ
 */

export type ExportType = 'accounts' | 'contacts' | 'deals';
export type ExportFormat = 'csv' | 'json';

const EXPORT_INCLUDE_NOTES_KEY = 'export:csv:includeNotes';
const EXPORT_ACCOUNTS_MODE_KEY = 'export:accounts:csvMode'; // 'all' | 'customersOnly' | 'custom'
const EXPORT_ACCOUNTS_TYPES_KEY = 'export:accounts:csvTypes'; // JSON配列: ['customer', ...]

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
      const mode = (localStorage.getItem(EXPORT_ACCOUNTS_MODE_KEY) || 'all') as 'all' | 'customersOnly' | 'custom';
      if (mode === 'customersOnly') {
        url += '&customersOnly=1';
      } else if (mode === 'custom') {
        try {
          const raw = localStorage.getItem(EXPORT_ACCOUNTS_TYPES_KEY);
          const parsed = raw ? (JSON.parse(raw) as string[]) : [];
          const types = Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v) : [];
          const known = ['customer', 'prospect', 'subcontractor', 'outsource', 'freelancer', 'partner', 'other', 'unknown'];
          const selected = types.filter((t) => known.includes(t));
          if (selected.length > 0) {
            const withoutUnknown = selected.filter((t) => t !== 'unknown');
            if (withoutUnknown.length > 0) {
              url += `&accountTypes=${encodeURIComponent(withoutUnknown.join(','))}`;
            }
            if (selected.includes('unknown')) {
              url += '&includeUnknown=1';
            }
          }
        } catch {
          // 破損している場合は何もしない（全件出力）
        }
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

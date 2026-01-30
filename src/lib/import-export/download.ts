/**
 * エクスポートダウンロード用ユーティリティ
 */

export type ExportType = 'accounts' | 'contacts' | 'deals';
export type ExportFormat = 'csv' | 'json';

/**
 * エクスポートを実行し、ファイルをダウンロード
 */
export function downloadExport(type: ExportType, format: ExportFormat): void {
  const url = `/api/export?type=${type}&format=${format}`;
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

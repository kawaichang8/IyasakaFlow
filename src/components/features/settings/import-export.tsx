'use client';

import { useState, useRef } from 'react';
import { Download, Upload, FileText, Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type ExportType = 'accounts' | 'contacts' | 'deals';
type ExportFormat = 'csv' | 'json';

const EXPORT_OPTIONS: { type: ExportType; label: string; icon: React.ElementType }[] = [
  { type: 'accounts', label: '企業アカウント', icon: Building2 },
  { type: 'contacts', label: '連絡先', icon: Users },
  { type: 'deals', label: '取引・案件', icon: TrendingUp },
];

/**
 * エクスポート実行（ダウンロード）
 */
function triggerExport(type: ExportType, format: ExportFormat) {
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
    .catch(() => toast.error('エクスポートに失敗しました'));
}

/**
 * インポート/エクスポート設定
 */
export function ImportExport() {
  const [importType, setImportType] = useState<ExportType>('accounts');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (type: ExportType, format: ExportFormat) => {
    triggerExport(type, format);
    toast.success(`${type === 'accounts' ? '企業' : type === 'contacts' ? '連絡先' : '取引'}を${format.toUpperCase()}でダウンロードしました`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.set('file', file);
    formData.set('type', importType);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'インポートに失敗しました');
        setImporting(false);
        return;
      }
      setImportResult({
        created: data.created,
        skipped: data.skipped,
        errors: data.errors || [],
      });
      const total = data.total ?? data.created + data.skipped;
      if (data.skipped > 0) {
        toast.success(`${data.created}件作成、${data.skipped}件スキップ（エラーあり）`, { duration: 5000 });
      } else {
        toast.success(`${data.created}件をインポートしました`);
      }
    } catch {
      toast.error('インポートに失敗しました');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* エクスポート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            データのエクスポート
          </CardTitle>
          <CardDescription>
            企業アカウント・連絡先・取引データをCSVまたはJSON形式でダウンロードします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EXPORT_OPTIONS.map(({ type, label, icon: Icon }) => (
            <div
              key={type}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(type, 'csv')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(type, 'json')}
                >
                  JSON
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* インポート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            データのインポート
          </CardTitle>
          <CardDescription>
            CSVまたはJSONファイルからデータを取り込みます。連絡先・取引は企業名で既存の企業と紐付けます。
            <span className="block mt-1 text-muted-foreground/90">※インポートは既存データに<strong>追加</strong>するだけです。既存の企業・連絡先は削除されません。</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>インポートするデータの種類</Label>
            <Select value={importType} onValueChange={(v: ExportType) => setImportType(v)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_OPTIONS.map(({ type, label, icon: Icon }) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'インポート中...' : 'ファイルを選択'}
            </Button>
            <p className="text-sm text-muted-foreground">
              CSVはエクスポートした形式（日本語ヘッダー）に対応しています
            </p>
            <p className="text-xs text-muted-foreground">
              データが見えない場合: ローカルと本番で同じデータベース（DATABASE_URL）か確認してください。Supabase利用時はダッシュボードの「Backups」から復元できる場合があります。
            </p>
          </div>

          {importResult && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="font-medium">
                取り込み完了: {importResult.created}件作成 / {importResult.skipped}件スキップ
              </p>
              {importResult.skipped > 0 && (
                <p className="text-sm text-amber-600">
                  スキップされた行は下記のエラーをご確認ください。該当行を修正して再インポートできます。
                </p>
              )}
              {importResult.created > 10 && importType === 'accounts' && (
                <p className="text-sm text-muted-foreground">
                  企業一覧は1ページ10件表示です。2ページ目以降にもデータがあります。一覧のページ送りで全件ご確認ください。
                </p>
              )}
              {importResult.created > 10 && importType === 'contacts' && (
                <p className="text-sm text-muted-foreground">
                  連絡先一覧もページ区切りで表示されています。全件はページを進めてご確認ください。
                </p>
              )}
              {importResult.errors.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <ul className="list-disc pl-4">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        {err.row}行目: {err.message}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>他 {importResult.errors.length - 10} 件のエラー</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

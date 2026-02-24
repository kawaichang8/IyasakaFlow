'use client';

import { BookOpen } from 'lucide-react';
import { ScriptLibrary } from '@/components/features/sales-advisor';

export default function ScriptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <BookOpen className="h-8 w-8" />
          営業スクリプト集
        </h1>
        <p className="mt-1 text-muted-foreground">
          シーン別の「話し方・書き方」テンプレート。コピーしてそのまま使えます。
        </p>
      </div>
      <ScriptLibrary />
    </div>
  );
}

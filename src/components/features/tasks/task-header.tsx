'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FilterBar } from '@/components/ui/filter-bar';
import { SearchInput } from '@/components/ui/search-input';
import { TaskForm } from './task-form';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/validations/task';

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface TaskHeaderProps {
  stats?: TaskStats;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  status?: string;
  priority?: string;
  onFilterChange?: (key: string, value: string | undefined) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
}

/**
 * タスクページのヘッダー
 * 検索・フィルターをURLと連携
 */
export function TaskHeader({ 
  stats, 
  searchValue = '', 
  onSearchChange, 
  status = '', 
  priority = '', 
  onFilterChange, 
  onClearFilters, 
  activeFilterCount = 0 
}: TaskHeaderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* タイトルとアクション */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">タスク</h1>
          <p className="text-muted-foreground">
            やるべきことを管理して、営業活動を効率化
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規タスク
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>新規タスクを作成</DialogTitle>
              <DialogDescription>
                タスクの内容を入力してください
              </DialogDescription>
            </DialogHeader>
            <TaskForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Clock className="h-5 w-5 text-slate-600" />}
            label="未着手"
            value={stats.pending}
            color="bg-slate-100 dark:bg-slate-800"
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-blue-600" />}
            label="進行中"
            value={stats.inProgress}
            color="bg-blue-100 dark:bg-blue-900"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            label="完了"
            value={stats.completed}
            color="bg-green-100 dark:bg-green-900"
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
            label="期限切れ"
            value={stats.overdue}
            color="bg-red-100 dark:bg-red-900"
          />
        </div>
      )}

      {/* 検索とフィルター */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput
            placeholder="タスク名で検索..."
            value={localSearch}
            onChange={setLocalSearch}
            onDebouncedChange={(v) => onSearchChange?.(v.trim() || '')}
            debounceMs={300}
          />
        </div>
        {onFilterChange && onClearFilters && (
          <FilterBar
            activeCount={activeFilterCount}
            onClear={onClearFilters}
            defaultOpen={activeFilterCount > 0}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>ステータス</Label>
                <Select
                  value={status || 'all'}
                  onValueChange={(v) => onFilterChange('status', v === 'all' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>優先度</Label>
                <Select
                  value={priority || 'all'}
                  onValueChange={(v) => onFilterChange('priority', v === 'all' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FilterBar>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`flex items-center gap-3 rounded-lg p-4 ${color}`}>
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

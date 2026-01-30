'use client';

import { useState } from 'react';
import { Plus, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/use-teams';

interface Team {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

/**
 * チーム管理コンポーネント
 */
export function TeamManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data, isLoading, refetch } = useTeams();
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const deleteMutation = useDeleteTeam();

  const teams = data?.data || [];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateOpen(false);
      setFormData({ name: '', description: '' });
      refetch();
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingTeam) return;
    try {
      await updateMutation.mutateAsync({ id: editingTeam.id, data: formData });
      setEditingTeam(null);
      setFormData({ name: '', description: '' });
      refetch();
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このチームを削除してもよろしいですか？')) return;
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, description: team.description || '' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>チーム管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>チーム管理</CardTitle>
          <CardDescription>チームを作成・編集してメンバーを整理します</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              チームを作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規チームを作成</DialogTitle>
              <DialogDescription>
                チーム名と説明を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">チーム名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: 営業1課"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="チームの説明（任意）"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name}>
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              チームがありません。「チームを作成」から作成しましょう。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.description || 'チームの説明なし'} · {team.memberCount}人
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(team)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(team.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* 編集ダイアログ */}
        <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>チームを編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">チーム名 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">説明</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTeam(null)}>
                キャンセル
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name}>
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

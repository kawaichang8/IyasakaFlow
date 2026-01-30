'use client';

import { useState } from 'react';
import {
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Star,
  StarOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemplateForm } from './template-form';
import { TEMPLATE_CATEGORIES } from '@/lib/validations/email';
import { formatRelativeTime } from '@/lib/utils';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  category?: string;
  tags: string[];
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplateListProps {
  templates: EmailTemplate[];
  onEdit?: (template: EmailTemplate) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (template: EmailTemplate) => void;
  onToggleDefault?: (id: string, isDefault: boolean) => void;
  isLoading?: boolean;
}

/**
 * テンプレート一覧コンポーネント
 */
export function TemplateList({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleDefault,
  isLoading,
}: TemplateListProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">テンプレートがありません</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          新しいテンプレートを作成してください
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => {
              setSelectedTemplate(template);
              setShowPreview(true);
            }}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  {template.isDefault && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  {template.name}
                </CardTitle>
                {template.category && (
                  <Badge variant="secondary" className="text-xs">
                    {TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label ||
                      template.category}
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(template);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.(template);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    複製
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDefault?.(template.id, !template.isDefault);
                    }}
                  >
                    {template.isDefault ? (
                      <>
                        <StarOff className="mr-2 h-4 w-4" />
                        デフォルト解除
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        デフォルトに設定
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(template.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {template.subject}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>使用回数: {template.usageCount}</span>
                <span>{formatRelativeTime(template.updatedAt)}</span>
              </div>
              {template.variables.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map((v) => (
                    <Badge key={v} variant="outline" className="text-xs">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                  {template.variables.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.variables.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* プレビューダイアログ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>テンプレートのプレビュー</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">件名</p>
                <p className="mt-1">{selectedTemplate.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">本文</p>
                <div className="mt-1 whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 text-sm">
                  {selectedTemplate.body}
                </div>
              </div>
              {selectedTemplate.variables.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    利用可能な変数
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((v) => (
                      <Badge key={v} variant="secondary">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onEdit?.(selectedTemplate);
                    setShowPreview(false);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  編集
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

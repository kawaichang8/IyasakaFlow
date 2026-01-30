'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';

/**
 * 新規登録フォーム
 */
export function RegisterForm() {
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // パスワード要件チェック
  const passwordRequirements = [
    { label: '6文字以上', met: password?.length >= 6 },
    { label: '大文字を含む', met: /[A-Z]/.test(password || '') },
    { label: '小文字を含む', met: /[a-z]/.test(password || '') },
    { label: '数字を含む', met: /\d/.test(password || '') },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);

      // ユーザー登録API呼び出し
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          result.error ||
          (result.details && typeof result.details === 'string'
            ? result.details
            : '登録に失敗しました');
        setError(message);
        return;
      }

      // 登録成功後、自動ログイン
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // ログイン失敗時はログインページへ
        router.push('/login?registered=true');
        return;
      }

      // ダッシュボードへリダイレクト
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('登録に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* エラーメッセージ */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 名前 */}
      <div className="space-y-2">
        <Label htmlFor="name">名前</Label>
        <Input
          id="name"
          type="text"
          placeholder="山田 太郎"
          autoComplete="name"
          disabled={isSubmitting}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* メールアドレス */}
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* パスワード */}
      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {/* パスワード要件 */}
        {password && (
          <div className="mt-2 space-y-1">
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-2 text-xs ${
                  req.met ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {req.met ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {req.label}
              </div>
            ))}
          </div>
        )}
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* パスワード確認 */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">パスワード確認</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* 登録ボタン */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            登録中...
          </>
        ) : (
          '無料で始める'
        )}
      </Button>
    </form>
  );
}

'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * URL検索パラメータを読み書きするフック
 * 一覧ページの検索・フィルター・ソートをURLと同期
 */
export function useSearchParamsState<T extends Record<string, string | number | boolean | undefined>>(
  _defaults: Partial<T> = {}
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = useCallback(
    (key: keyof T): string | undefined => {
      const value = searchParams.get(String(key));
      return value ?? undefined;
    },
    [searchParams]
  );

  const getNumber = useCallback(
    (key: keyof T): number | undefined => {
      const value = searchParams.get(String(key));
      if (value === null || value === '') return undefined;
      const num = parseInt(value, 10);
      return Number.isNaN(num) ? undefined : num;
    },
    [searchParams]
  );

  const set = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      // ページは1にリセット
      if (Object.keys(updates).some((k) => k !== 'page')) {
        params.set('page', '1');
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const setOne = useCallback(
    (key: keyof T, value: string | number | boolean | undefined) => {
      set({ [key]: value } as Partial<T>);
    },
    [set]
  );

  const clear = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const toObject = useCallback((): Partial<T> => {
    const obj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    return obj as Partial<T>;
  }, [searchParams]);

  return {
    get,
    getNumber,
    set,
    setOne,
    clear,
    toObject,
    isPending,
    searchParams,
  };
}

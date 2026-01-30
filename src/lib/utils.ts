import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * クラス名をマージするユーティリティ
 * clsx + tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FormatCurrencyOptions {
  notation?: 'standard' | 'compact';
  locale?: string;
  currency?: string;
}

/**
 * 数値をフォーマット（通貨表示）
 * 呼び出し例:
 *   formatCurrency(1000)
 *   formatCurrency(1000, { notation: 'compact' })
 *   formatCurrency(1000, 'USD')
 *   formatCurrency(1000, 'USD', { notation: 'compact' })
 */
export function formatCurrency(
  amount: number,
  currencyOrOptions: string | FormatCurrencyOptions = 'JPY',
  localeOrOptions?: string | FormatCurrencyOptions
): string {
  let currency = 'JPY';
  let locale = 'ja-JP';
  let notation: 'standard' | 'compact' | undefined;

  if (typeof currencyOrOptions === 'object' && currencyOrOptions !== null) {
    // 第2引数がオプションの場合: formatCurrency(amount, { notation: 'compact' })
    currency = currencyOrOptions.currency ?? 'JPY';
    locale = currencyOrOptions.locale ?? 'ja-JP';
    notation = currencyOrOptions.notation;
  } else if (typeof currencyOrOptions === 'string') {
    currency = currencyOrOptions;
    if (typeof localeOrOptions === 'object' && localeOrOptions !== null) {
      locale = localeOrOptions.locale ?? 'ja-JP';
      notation = localeOrOptions.notation;
    } else if (typeof localeOrOptions === 'string') {
      locale = localeOrOptions;
    }
  }

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  if (notation === 'compact') {
    options.notation = 'compact';
    options.compactDisplay = 'short';
  }
  return new Intl.NumberFormat(locale, options).format(amount);
}

/**
 * 日付をフォーマット
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = 'ja-JP'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * 相対時間をフォーマット（例: "3日前"）
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = 'ja-JP'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * 数値を短縮表示（例: 1000 → 1K）
 */
export function formatCompactNumber(
  num: number,
  locale: string = 'ja-JP'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * 文字列を切り詰め
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * スラッグを生成
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * ランダムIDを生成
 */
export function generateId(prefix: string = ''): string {
  const randomPart = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}_${timestamp}${randomPart}` : `${timestamp}${randomPart}`;
}

/**
 * オブジェクトから空の値を除去
 */
export function removeEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  ) as Partial<T>;
}

/**
 * デバウンス関数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 安全なJSONパース
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

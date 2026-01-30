'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SearchInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  showIcon?: boolean;
}

/**
 * 検索入力（デバウンス対応）
 * onDebouncedChange を指定すると入力停止後にコールバック
 */
export function SearchInput({
  value: controlledValue,
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  showIcon = true,
  className,
  ...props
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue ?? '');

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : localValue;

  useEffect(() => {
    if (isControlled) setLocalValue(controlledValue);
  }, [isControlled, controlledValue]);

  const debouncedCb = useCallback(
    debounce((v: string) => {
      onDebouncedChange?.(v);
    }, debounceMs),
    [debounceMs, onDebouncedChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!isControlled) setLocalValue(v);
      onChange?.(v);
      onDebouncedChange && debouncedCb(v);
    },
    [isControlled, onChange, onDebouncedChange, debouncedCb]
  );

  return (
    <div className="relative">
      {showIcon && (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        className={cn(showIcon && 'pl-9', className)}
        {...props}
      />
    </div>
  );
}

/**
 * デバウンスユーティリティ
 */
export interface DebouncedFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void
  /** 保留中のタイマーをキャンセル */
  cancel(): void
  /** 保留中の呼び出しを即座に実行 */
  flush(): void
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const debouncedFn = (...args: Parameters<T>) => {
    lastArgs = args
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
      lastArgs = null
    }, delay)
  }

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastArgs = null
    }
  }

  debouncedFn.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId)
      fn(...lastArgs)
      timeoutId = null
      lastArgs = null
    }
  }

  return debouncedFn as DebouncedFunction<T>
}

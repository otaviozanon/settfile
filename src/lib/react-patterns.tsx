import React, { useState, useEffect, useCallback, useRef } from 'react'

interface UseQueryOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

export function useQuery<T>(
  key: string | string[],
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const refetch = useCallback(async () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      options?.onSuccess?.(result)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const error = err as Error
        setError(error)
        options?.onError?.(error)
      }
    } finally {
      setLoading(false)
    }
  }, [fetcher, options?.onSuccess, options?.onError])

  useEffect(() => {
    if (options?.enabled !== false) {
      refetch()
    }
    return () => abortControllerRef.current?.abort()
  }, [key, refetch, options?.enabled])

  return { data, error, loading, refetch }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function DataLoader<T>({
  url,
  children
}: {
  url: string
  children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode
}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    fetch(url, { signal: abortControllerRef.current.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch(err => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err)
        }
      })
      .finally(() => setLoading(false))

    return () => abortControllerRef.current?.abort()
  }, [url])

  return <>{children(data, loading, error)}</>
}
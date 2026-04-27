/**
 * SEO数据缓存Hook
 * 用于缓存SEO相关数据，减少API请求，提升用户体验
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // 缓存有效期（毫秒），默认5分钟
  key?: string; // 缓存key前缀
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

// 内存缓存存储
const memoryCache = new Map<string, CacheItem<any>>();

/**
 * SEO数据缓存Hook
 * @param fetchFn 数据获取函数
 * @param options 缓存选项
 * @returns 缓存的数据和控制方法
 */
export function useSEOCache<T>(
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = DEFAULT_TTL, key = 'seo_cache' } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheKeyRef = useRef(key);

  // 从缓存获取数据
  const getFromCache = useCallback((): T | null => {
    const cached = memoryCache.get(cacheKeyRef.current);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  }, []);

  // 保存数据到缓存
  const saveToCache = useCallback((newData: T) => {
    memoryCache.set(cacheKeyRef.current, {
      data: newData,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }, [ttl]);

  // 清除缓存
  const clearCache = useCallback(() => {
    memoryCache.delete(cacheKeyRef.current);
    setData(null);
  }, []);

  // 刷新数据（强制重新获取）
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      saveToCache(result);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取数据失败'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, saveToCache]);

  // 加载数据（优先从缓存获取）
  const load = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getFromCache();
      if (cached) {
        setData(cached);
        return cached;
      }
    }
    return refresh();
  }, [getFromCache, refresh]);

  // 检查缓存是否过期
  const isStale = useCallback(() => {
    const cached = memoryCache.get(cacheKeyRef.current);
    if (!cached) return true;
    return cached.expiresAt <= Date.now();
  }, []);

  // 获取缓存信息
  const getCacheInfo = useCallback(() => {
    const cached = memoryCache.get(cacheKeyRef.current);
    if (!cached) return null;
    return {
      timestamp: cached.timestamp,
      expiresAt: cached.expiresAt,
      age: Date.now() - cached.timestamp,
      isStale: cached.expiresAt <= Date.now(),
    };
  }, []);

  // 初始加载
  useEffect(() => {
    // 使用setTimeout避免同步调用setState
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时加载一次

  return {
    data,
    loading,
    error,
    load,
    refresh,
    clearCache,
    isStale,
    getCacheInfo,
  };
}

/**
 * 批量缓存Hook - 用于同时缓存多个SEO数据
 */
export function useSEOBatchCache<T extends Record<string, any>>(
  fetchers: { [K in keyof T]: () => Promise<T[K]> },
  options: CacheOptions = {}
) {
  const { ttl = DEFAULT_TTL, key = 'seo_batch_cache' } = options;
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [errors, setErrors] = useState<Partial<Record<keyof T, Error>>>({});

  const cacheKeys = useRef(
    Object.keys(fetchers).reduce((acc, k) => {
      acc[k as keyof T] = `${key}_${k}`;
      return acc;
    }, {} as Record<keyof T, string>)
  ).current;

  // 获取单个缓存
  const getFromCache = useCallback((cacheKey: string): any | null => {
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  }, []);

  // 保存单个缓存
  const saveToCache = useCallback((cacheKey: string, newData: any) => {
    memoryCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }, [ttl]);

  // 加载单个数据
  const loadOne = useCallback(async <K extends keyof T>(
    key: K,
    forceRefresh = false
  ): Promise<T[K] | null> => {
    const cacheKey = cacheKeys[key];
    
    if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        setData(prev => ({ ...prev, [key as string]: cached }));
        return cached;
      }
    }

    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: undefined }));

    try {
      const result = await fetchers[key]();
      saveToCache(cacheKey, result);
      setData(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`获取${String(key)}失败`);
      setErrors(prev => ({ ...prev, [key]: error }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [cacheKeys, fetchers, getFromCache, saveToCache]);

  // 加载全部数据
  const loadAll = useCallback(async (forceRefresh = false) => {
    const keys = Object.keys(fetchers) as Array<keyof T>;
    
    // 初始化loading状态
    const initialLoading: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
    keys.forEach(key => {
      initialLoading[key] = true;
    });
    setLoading(initialLoading);
    
    try {
      const results = await Promise.allSettled(
        keys.map(key => loadOne(key, forceRefresh))
      );
      
      const newData: Partial<T> = {};
      const newErrors: Partial<Record<keyof T, Error>> = {};
      
      results.forEach((result, index) => {
        const key = keys[index];
        if (result.status === 'fulfilled' && result.value) {
          newData[key] = result.value;
        } else if (result.status === 'rejected') {
          newErrors[key] = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
        }
      });
      
      setErrors(newErrors);
      return newData;
    } catch (error) {
      console.error('批量加载数据失败:', error);
      return {};
    }
  }, [fetchers, loadOne]);

  // 刷新指定数据
  const refresh = useCallback(<K extends keyof T>(key: K) => {
    return loadOne(key, true);
  }, [loadOne]);

  // 刷新全部数据
  const refreshAll = useCallback(() => {
    return loadAll(true);
  }, [loadAll]);

  // 清除所有缓存
  const clearAllCache = useCallback(() => {
    Object.values(cacheKeys).forEach(cacheKey => {
      memoryCache.delete(cacheKey);
    });
    setData({});
  }, [cacheKeys]);

  // 清除指定缓存
  const clearCache = useCallback(<K extends keyof T>(key: K) => {
    memoryCache.delete(cacheKeys[key]);
    setData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  }, [cacheKeys]);

  // 初始加载
  useEffect(() => {
    // 使用setTimeout避免同步调用setState
    const timer = setTimeout(() => {
      loadAll();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时加载一次

  return {
    data,
    loading,
    errors,
    loadOne,
    loadAll,
    refresh,
    refreshAll,
    clearCache,
    clearAllCache,
  };
}

/**
 * 清除所有SEO缓存
 */
export function clearAllSEOCache() {
  memoryCache.clear();
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}

export default useSEOCache;

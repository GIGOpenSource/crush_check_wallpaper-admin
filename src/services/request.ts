/**
 * HTTP请求服务
 * 封装fetch API，提供统一的请求处理
 */

import { message } from 'antd';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, QueryValue>;
  data?: unknown;
  headers?: Record<string, string>;
  token?: string;
  signal?: AbortSignal;
  responseType?: 'json' | 'blob' | 'text';
}

interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// 默认配置
const defaultConfig: RequestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * 构建URL查询字符串
 */
function buildQueryString(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * 获取存储的token
 */
function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * 发送HTTP请求
 */
async function httpRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    params,
    data,
    headers = {},
    token,
    signal,
    responseType = 'json',
  } = options;

  // 构建完整URL
  let fullUrl = url.startsWith('http') ? url : `${defaultConfig.baseURL}${url}`;
  
  // 添加查询参数
  if (params && Object.keys(params).length > 0) {
    fullUrl += buildQueryString(params);
  }

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    ...defaultConfig.headers,
    ...headers,
  };

  // 添加认证token
  const authToken = token || getToken();
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  // 构建请求配置
  const requestConfig: RequestInit = {
    method,
    headers: requestHeaders,
    signal,
  };

  // 添加请求体
  if (data && method !== 'GET') {
    if (data instanceof FormData) {
      // FormData不需要设置Content-Type，浏览器会自动设置
      delete requestHeaders['Content-Type'];
      requestConfig.body = data;
    } else {
      requestConfig.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(fullUrl, requestConfig);

    // 处理响应
    if (!response.ok) {
      // 处理特定状态码
      if (response.status === 401) {
        // 未授权，清除token并跳转登录
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('登录已过期，请重新登录');
      }
      
      if (response.status === 403) {
        throw new Error('没有权限执行此操作');
      }

      if (response.status === 404) {
        throw new Error('请求的资源不存在');
      }

      if (response.status >= 500) {
        throw new Error('服务器错误，请稍后重试');
      }

      // 尝试解析错误信息
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `请求失败: ${response.status}`);
    }

    // 根据responseType处理响应数据
    if (responseType === 'blob') {
      return response.blob() as Promise<T>;
    }
    
    if (responseType === 'text') {
      return response.text() as Promise<T>;
    }

    // 默认JSON响应
    const result = await response.json();
    return result as T;
  } catch (error) {
    // 处理网络错误
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      message.error('网络连接失败，请检查网络设置');
      throw new Error('网络连接失败');
    }

    // 处理中止请求
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求已取消');
    }

    // 显示错误消息
    if (error instanceof Error) {
      message.error(error.message);
    }

    throw error;
  }
}

/**
 * 请求对象，提供get/post/put/patch/delete方法
 */
export const request = {
  /**
   * GET请求
   */
  get<T>(url: string, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<T> {
    return httpRequest<T>(url, { ...options, method: 'GET' });
  },

  /**
   * POST请求
   */
  post<T>(url: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<T> {
    return httpRequest<T>(url, { ...options, method: 'POST', data });
  },

  /**
   * PUT请求
   */
  put<T>(url: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<T> {
    return httpRequest<T>(url, { ...options, method: 'PUT', data });
  },

  /**
   * PATCH请求
   */
  patch<T>(url: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<T> {
    return httpRequest<T>(url, { ...options, method: 'PATCH', data });
  },

  /**
   * DELETE请求
   */
  delete<T>(url: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return httpRequest<T>(url, { ...options, method: 'DELETE' });
  },
};

/**
 * 创建取消令牌
 */
export function createCancelToken() {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}

export default request;

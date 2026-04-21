/**
 * API配置管理
 * 统一管理API基础URL、超时、重试策略
 * 支持Mock/真实API切换
 */

// API基础配置
export const API_CONFIG = {
  // 基础URL - 根据环境切换
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // 超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 重试次数
  RETRY_COUNT: 3,
  
  // 重试延迟（毫秒）
  RETRY_DELAY: 1000,
  
  // 是否使用Mock数据
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true' || false,
  
  // SEO模块API前缀
  SEO_PREFIX: '/seo',
};

// API响应码
export const API_CODE = {
  SUCCESS: 200,
  ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
};

// API错误消息
export const API_MESSAGE = {
  [API_CODE.SUCCESS]: '请求成功',
  [API_CODE.ERROR]: '服务器错误',
  [API_CODE.UNAUTHORIZED]: '未授权，请重新登录',
  [API_CODE.FORBIDDEN]: '禁止访问',
  [API_CODE.NOT_FOUND]: '资源不存在',
};

// 请求配置接口
export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: Record<string, unknown> | FormData;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  responseType?: 'json' | 'blob' | 'text';
}

// API响应接口
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

// 分页响应接口
export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export default API_CONFIG;

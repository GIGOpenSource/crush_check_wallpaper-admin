/**
 * Axios HTTP请求服务
 * 封装axios，提供统一的请求处理、拦截器、错误处理等
 */

import axios from 'axios';
import type { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig,
  AxiosError 
} from 'axios';
import { message, Modal } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

// 全局导航函数（用于在非组件中导航）
let navigate: ((to: string, options?: { replace?: boolean }) => void) | null = null;

export function setNavigate(fn: typeof navigate) {
  navigate = fn;
}

// 全局 message 实例（通过 App 组件设置）
let globalMessage: MessageInstance = message;

export function setMessageInstance(msgInstance: MessageInstance) {
  globalMessage = msgInstance;
}

// 响应数据结构定义
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success?: boolean;
}

// 请求配置扩展
export interface CustomRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean | 'modal'; // false:不显示, true:message提示, 'modal':弹窗提示
  skipAuth?: boolean; // 是否跳过认证，默认false
  showErrorModal?: boolean; // 是否使用Modal显示错误（针对重要错误）
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    
    // 如果配置了skipAuth则不添加token
    const customConfig = config as CustomRequestConfig;
    if (token && !customConfig.skipAuth) {
      // 方式1: 添加 Token 请求头（后端自定义的 Token 头）
      config.headers.Token = token;
      
      // 方式2: 添加标准的 Authorization Bearer 头（兼容 RESTful API 规范）
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 可以在这里添加其他请求前的处理逻辑
    // 例如：添加请求时间戳、loading状态等
    
    return config;
  },
  (error: AxiosError) => {
    // 请求错误处理
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 */
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    
    // 如果返回的是二进制数据（blob），直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }

    // 根据后端返回的code判断请求是否成功
    // 支持大小写兼容：code 或 Code
    const responseCode = res.code !== undefined ? res.code : res.Code;
    const responseMessage = res.message !== undefined ? res.message : res.Message;
    
    // 判断逻辑：
    // 1. 如果有 code 字段，且 code 不等于 200、201 或 0，则视为错误
    // 2. 如果没有 code 字段，视为成功（兼容部分接口只返回 message 的情况）
    // 注意：201 表示"已创建"，也是成功的响应
    if (responseCode !== undefined && responseCode !== 200 && responseCode !== 201 && responseCode !== 0) {
      const customConfig = response.config as CustomRequestConfig;
      
      // 只要 code 不等于 200，都显示错误提示（除非明确配置为 false）
      if (customConfig.showErrorMessage !== false) {
        const errorMsg = responseMessage || '请求失败';
        
        // 使用全局 message 实例显示错误提示
        globalMessage.error(errorMsg);
      }

      // 特殊状态码处理
      if (responseCode === 401) {
        // 未授权，清除token并跳转登录
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        
        // 使用 react-router 导航（如果已设置）
        if (navigate) {
          navigate('/login', { replace: true });
        } else {
          // 降级方案：使用 window.location
          window.location.href = '/login';
        }
      }

      // 返回包含错误信息的 Promise.reject
      return Promise.reject(new Error(responseMessage || '请求失败'));
    }

    // 请求成功，返回数据
    // 如果响应包含 data 字段且 data 不为 undefined，返回 data（实际业务数据）
    // 否则返回整个响应对象（兼容不同接口格式）
    return res.data !== undefined && res.data !== null ? res.data : res;
  },
  (error: AxiosError) => {
    const customConfig = error.config as CustomRequestConfig;
    
    // 处理HTTP错误状态码
    let errorMessage = '网络错误，请稍后重试';
    
    if (error.response) {
      // 尝试从响应中获取错误信息
      const errorData = error.response.data as any;
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else {
        switch (error.response.status) {
          case 400:
            errorMessage = '请求参数错误';
            break;
          case 401:
            errorMessage = '登录已过期，请重新登录';
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            
            // 使用 react-router 导航（如果已设置）
            if (navigate) {
              navigate('/login', { replace: true });
            } else {
              window.location.href = '/login';
            }
            break;
          case 403:
            errorMessage = '没有权限执行此操作';
            break;
          case 404:
            errorMessage = '请求的资源不存在';
            break;
          case 408:
            errorMessage = '请求超时';
            break;
          case 500:
            errorMessage = '服务器内部错误';
            break;
          case 502:
            errorMessage = '网关错误';
            break;
          case 503:
            errorMessage = '服务不可用';
            break;
          case 504:
            errorMessage = '网关超时';
            break;
          default:
            errorMessage = `请求失败: ${error.response.status}`;
        }
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查网络连接';
    } else if (error.message === 'Network Error') {
      errorMessage = '网络连接失败，请检查网络设置';
    }

    // 根据配置决定如何显示错误消息
    if (customConfig?.showErrorMessage !== false) {
      // 使用全局 message 实例显示错误提示
      globalMessage.error(errorMessage);
    }

    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

/**
 * 通用请求方法
 */
async function request<T = any>(
  url: string,
  config: CustomRequestConfig = {}
): Promise<T> {
  try {
    const response = await service.request<ApiResponse<T>>({
      url,
      ...config,
    });
    
    // 如果响应数据是blob类型，直接返回
    if (config.responseType === 'blob') {
      return response.data as unknown as T;
    }
    
    // 返回data字段
    return (response as any).data ?? response;
  } catch (error) {
    throw error;
  }
}

/**
 * 封装常用的HTTP方法
 */
export const http = {
  /**
   * GET请求
   * @param url 请求地址
   * @param params 查询参数
   * @param config 其他配置
   */
  get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: CustomRequestConfig
  ): Promise<T> {
    return request<T>(url, {
      method: 'GET',
      params,
      ...config,
    });
  },

  /**
   * POST请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 其他配置
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: CustomRequestConfig
  ): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      data,
      ...config,
    });
  },

  /**
   * PUT请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 其他配置
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: CustomRequestConfig
  ): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      data,
      ...config,
    });
  },

  /**
   * PATCH请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 其他配置
   */
  patch<T = any>(
    url: string,
    data?: any,
    config?: CustomRequestConfig
  ): Promise<T> {
    return request<T>(url, {
      method: 'PATCH',
      data,
      ...config,
    });
  },

  /**
   * DELETE请求
   * @param url 请求地址
   * @param params 查询参数
   * @param config 其他配置
   */
  delete<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: CustomRequestConfig
  ): Promise<T> {
    return request<T>(url, {
      method: 'DELETE',
      params,
      ...config,
    });
  },

  /**
   * 上传文件
   * @param url 请求地址
   * @param formData FormData对象
   * @param config 其他配置
   */
  upload<T = any>(
    url: string,
    formData: FormData,
    config?: CustomRequestConfig
  ): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  },

  /**
   * 下载文件
   * @param url 请求地址
   * @param params 查询参数
   * @param filename 文件名（可选）
   * @param config 其他配置
   */
  download(
    url: string,
    params?: Record<string, any>,
    filename?: string,
    config?: CustomRequestConfig
  ): Promise<void> {
    return request<Blob>(url, {
      method: 'GET',
      params,
      responseType: 'blob',
      ...config,
    }).then((blob) => {
      // 创建下载链接
      const blobUrl = window.URL.createObjectURL(blob as unknown as Blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    });
  },
};

/**
 * 取消请求令牌
 */
export const CancelToken = axios.CancelToken;

/**
 * 创建取消令牌源
 */
export function createCancelToken() {
  return axios.CancelToken.source();
}

// 导出axios实例（用于特殊场景）
export { service };

// 默认导出
export default http;

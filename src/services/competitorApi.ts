/**
 * 竞争对手分析API服务层
 * 封装所有竞争对手分析相关的API调用
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { API_CONFIG, API_CODE, type ApiResponse, type PaginatedResponse } from '../config/api.config';

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加认证token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.Token = `${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data } = response;
      // 支持 200 和 201 状态码都视为成功
      if (data.code !== API_CODE.SUCCESS && data.code !== 201) {
        console.error('API Error:', data.message);
        return Promise.reject(new Error(data.message));
      }
      return response;
    },
    (error) => {
      const { response } = error;
      if (response) {
        const { status } = response;
        console.error('HTTP Error:', status, error.message);
        
        // 401 特殊处理：清除token并跳转登录
        if (status === API_CODE.UNAUTHORIZED) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } else {
        console.error('Network Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const axiosInstance = createAxiosInstance();

// 通用请求方法
const request = async <T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await axiosInstance.request<ApiResponse<T>>(config);
  return response.data;
};

// ==================== 类型定义 ====================

/**
 * 竞争对手项数据结构
 */
export interface CompetitorItem {
  id: number;                    // 竞争对手ID
  name: string;                  // 名称
  url: string;                   // 网站URL
  domain_authority: number;      // 域名权重
  backlink_count: number;        // 外链数
  keyword_count: number;         // 关键词数
  monthly_traffic: number;       // 月流量
  growth_trend: string;          // 增长趋势 (up/stable/down)
  growth_trend_display: string;  // 增长趋势显示文本
  last_synced_at: string;        // 最后同步时间
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}

/**
 * 竞争对手统计数据
 */
export interface CompetitorStatistics {
  total_count: number;                     // 竞争对手总数
  avg_domain_authority: number;            // 平均域名权重
  total_backlinks: number;                 // 总外链数
  total_keywords: number;                  // 总关键词数
  total_monthly_traffic: number;           // 月流量总计
  trend_distribution: {                    // 趋势分布
    up: number;                            // 增长中
    stable: number;                        // 稳定
    down: number;                          // 下降中
  };
}

/**
 * 关键词差距项数据结构
 */
export interface KeywordGapItem {
  keyword: string;              // 关键词
  our_ranking: number | null;   // 我们的排名
  competitor_ranking: number | null;  // 对手排名
  our_search_volume: number;    // 我们的搜索量
  competitor_search_volume: number;  // 对手的搜索量
  difficulty: number;           // 难度
}

/**
 * 关键词差距接口响应数据结构
 */
export interface KeywordGapResponse {
  keyword_gaps: KeywordGapItem[];  // 关键词差距数组
  note?: string;                   // 备注说明
  our_site?: string;               // 我们的网站
  competitor_site?: string;        // 竞争对手网站
  total_gaps?: number;             // 总差距数
}

// ==================== API函数 ====================

/**
 * 获取竞争对手列表
 * @param params 查询参数（分页等）
 * @returns 竞争对手列表
 */
export const getCompetitorList = async (params: {
  currentPage?: number;
  pageSize?: number;
  name?: string;
}): Promise<ApiResponse<PaginatedResponse<CompetitorItem>>> => {
  try {
    const response = await request<PaginatedResponse<CompetitorItem>>({
      url: `${API_CONFIG.SEO_PREFIX}/competitor/`,
      method: 'GET',
      params,
    });
    return response;
  } catch (error) {
    console.error('获取竞争对手列表失败:', error);
    return {
      code: 500,
      success: false,
      message: '获取竞争对手列表失败',
      data: {
        results: [],
        total: 0,
        page: 1,
        pageSize: 10,
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: 0,
        },
      },
    };
  }
};

/**
 * 获取竞争对手统计数据
 * @returns 竞争对手统计数据
 */
export const getCompetitorStatistics = async (): Promise<ApiResponse<CompetitorStatistics>> => {
  try {
    const response = await request<CompetitorStatistics>({
      url: `${API_CONFIG.SEO_PREFIX}/competitor/statistics/`,
      method: 'GET',
    });
    return response;
  } catch (error) {
    console.error('获取竞争对手统计数据失败:', error);
    return {
      code: 500,
      success: false,
      message: '获取竞争对手统计数据失败',
      data: {
        total_count: 0,
        avg_domain_authority: 0,
        total_backlinks: 0,
        total_keywords: 0,
        total_monthly_traffic: 0,
        trend_distribution: {
          up: 0,
          stable: 0,
          down: 0,
        },
      },
    };
  }
};

/**
 * 添加竞争对手
 * @param data 竞争对手数据
 * @returns 添加结果
 */
export const addCompetitor = async (data: {
  name: string;
  url: string;
}): Promise<ApiResponse<CompetitorItem>> => {
  try {
    const response = await request<CompetitorItem>({
      url: `${API_CONFIG.SEO_PREFIX}/competitor/`,
      method: 'POST',
      data,
    });
    return response;
  } catch (error) {
    console.error('添加竞争对手失败:', error);
    throw error;
  }
};

/**
 * 删除竞争对手
 * @param id 竞争对手ID
 * @returns 删除结果
 */
export const deleteCompetitor = async (id: number): Promise<ApiResponse<any>> => {
  try {
    const response = await request<any>({
      url: `${API_CONFIG.SEO_PREFIX}/competitor/${id}/`,
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('删除竞争对手失败:', error);
    throw error;
  }
};

/**
 * 获取关键词差距分析
 * @param id 竞争对手ID
 * @returns 关键词差距列表
 */
export const getKeywordGap = async (competitor_id: number): Promise<ApiResponse<KeywordGapResponse>> => {
  try {
    const response = await request<KeywordGapResponse>({
      url: `${API_CONFIG.SEO_PREFIX}/competitor/keyword-gap/`,
      method: 'GET',
      params: { competitor_id },
    });
    return response;
  } catch (error) {
    console.error('获取关键词差距失败:', error);
    throw error;
  }
};

// ==================== 内容优化相关接口 ====================

/**
 * 获取优化建议
 * @param id 内容优化任务ID
 * @returns 优化建议列表
 */
export const getContentOptimizationSuggestions = async (id: number): Promise<ApiResponse<any>> => {
  try {
    const response = await request<any>({
      url: `${API_CONFIG.SEO_PREFIX}/content_optimization/suggestions/`,
      method: 'GET',
      params: { id },
    });
    return response;
  } catch (error) {
    console.error('获取优化建议失败:', error);
    throw error;
  }
};

/**
 * 获取问题检测
 * @param id 内容优化任务ID
 * @returns 问题检测列表
 */
export const getContentOptimizationIssues = async (id: number): Promise<ApiResponse<any>> => {
  try {
    const response = await request<any>({
      url: `${API_CONFIG.SEO_PREFIX}/content_optimization/issues/`,
      method: 'GET',
      params: { id },
    });
    return response;
  } catch (error) {
    console.error('获取问题检测失败:', error);
    throw error;
  }
};

/**
 * 获取内容分析概览
 * @param id 内容优化任务ID
 * @returns 内容分析数据
 */
export const getContentOptimizationAnalysisOverview = async (id: number): Promise<ApiResponse<any>> => {
  try {
    const response = await request<any>({
      url: `${API_CONFIG.SEO_PREFIX}/content_optimization/analysis-overview/`,
      method: 'GET',
      params: { id },
    });
    return response;
  } catch (error) {
    console.error('获取内容分析失败:', error);
    throw error;
  }
};

// ==================== 统一导出 ====================

export const competitorApi = {
  getCompetitorList,
  getCompetitorStatistics,
  addCompetitor,
  deleteCompetitor,
  getKeywordGap,
  getContentOptimizationSuggestions,
  getContentOptimizationIssues,
  getContentOptimizationAnalysisOverview,
};

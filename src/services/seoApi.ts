/**
 * SEO模块API服务层
 * 封装所有SEO相关API调用
 * 支持Mock/真实API无缝切换
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { API_CONFIG, API_CODE, type ApiResponse, type PaginatedResponse } from '../config/api.config';
import { seoMockApi } from './seoMockApi';

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
        // 不在API层显示错误提示，由业务层自行处理
        console.error('API Error:', data.message);
        return Promise.reject(new Error(data.message));
      }
      return response;
    },
    (error) => {
      const { response } = error;
      if (response) {
        const { status } = response;
        // 只记录错误日志，不显示UI提示
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
  // 如果使用Mock模式，调用Mock API
  if (API_CONFIG.USE_MOCK) {
    return _mockRequest<T>(config);
  }
  
  const response = await axiosInstance.request<ApiResponse<T>>(config);
  return response.data;
};

// Mock请求方法（模拟延迟）
const _mockRequest = async <T>(_config: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  // 这里可以根据config.url路由到对应的mock函数
  // 实际由各个API方法直接调用seoMockApi
  throw new Error('Mock request not implemented for this endpoint');
};

// ==================== 1. SEO仪表盘 API ====================

export interface HealthScoreData {
  score: number;
  lastUpdate: string;
  trends: { date: string; score: number }[];
}

export interface PendingIssue {
  type: 'warning' | 'error';
  title: string;
  count: number;
  icon: string;
}

export interface CoreMetric {
  title: string;
  value: number | string;
  change: number;
  changeType: 'up' | 'down';
}

export interface TechCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  count: string;
}

export interface OperationLog {
  id: number;
  time: string;
  content: string;
  status: 'success' | 'warning' | 'error';
  operator: string;
  type: string;
}

export const getSEOHealthScore = async (): Promise<ApiResponse<HealthScoreData>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getSEOHealthScore();
  }
  return request<HealthScoreData>({
    url: `${API_CONFIG.SEO_PREFIX}/health-score`,
    method: 'GET',
  });
};

/**
 * SEO仪表盘数据接口
 */
export interface SEODashboardData {
  health_score: number;
  // 其他字段根据实际返回添加
}

/**
 * 获取SEO仪表盘数据
 * @returns SEO仪表盘数据
 */
export const getSEODashboard = async (): Promise<ApiResponse<SEODashboardData>> => {
  return request<SEODashboardData>({
    url: `${API_CONFIG.SEO_PREFIX}/seo_view/dashboard/`,
    method: 'GET',
    params: {
      site_url: 'https://www.markwallpapers.com',
      days: 30,
    },
  });
};

export const getPendingIssues = async (): Promise<ApiResponse<PendingIssue[]>> => {
  // TODO: 后端接口尚未就绪，暂时使用 Mock 数据
  // if (API_CONFIG.USE_MOCK) {
  //   return seoMockApi.getPendingIssues() as Promise<ApiResponse<PendingIssue[]>>;
  // }
  // try {
  //   return request<PendingIssue[]>({
  //     url: `${API_CONFIG.SEO_PREFIX}/issues`,
  //     method: 'GET',
  //   });
  // } catch (error) {
  //   console.warn('getPendingIssues API failed, falling back to mock data:', error);
  //   return seoMockApi.getPendingIssues() as Promise<ApiResponse<PendingIssue[]>>;
  // }
  
  // 直接使用 Mock 数据
  return seoMockApi.getPendingIssues() as Promise<ApiResponse<PendingIssue[]>>;
};

export const getCoreMetrics = async (): Promise<ApiResponse<CoreMetric[]>> => {
  // TODO: 后端接口尚未就绪，暂时使用 Mock 数据
  // if (API_CONFIG.USE_MOCK) {
  //   return seoMockApi.getCoreMetrics() as Promise<ApiResponse<CoreMetric[]>>;
  // }
  // try {
  //   return request<CoreMetric[]>({
  //     url: `${API_CONFIG.SEO_PREFIX}/metrics`,
  //     method: 'GET',
  //   });
  // } catch (error) {
  //   console.warn('getCoreMetrics API failed, falling back to mock data:', error);
  //   return seoMockApi.getCoreMetrics() as Promise<ApiResponse<CoreMetric[]>>;
  // }
  
  // 直接使用 Mock 数据
  return seoMockApi.getCoreMetrics() as Promise<ApiResponse<CoreMetric[]>>;
};

export const getTechChecks = async (): Promise<ApiResponse<TechCheck[]>> => {
  // TODO: 后端接口尚未就绪，暂时使用 Mock 数据
  // if (API_CONFIG.USE_MOCK) {
  //   return seoMockApi.getTechChecks() as Promise<ApiResponse<TechCheck[]>>;
  // }
  // try {
  //   return request<TechCheck[]>({
  //     url: `${API_CONFIG.SEO_PREFIX}/tech-checks`,
  //     method: 'GET',
  //   });
  // } catch (error) {
  //   console.warn('getTechChecks API failed, falling back to mock data:', error);
  //   return seoMockApi.getTechChecks() as Promise<ApiResponse<TechCheck[]>>;
  // }
  
  // 直接使用 Mock 数据
  return seoMockApi.getTechChecks() as Promise<ApiResponse<TechCheck[]>>;
};

export const getOperationLogs = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
}): Promise<ApiResponse<PaginatedResponse<OperationLog>>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getOperationLogs(params) as Promise<ApiResponse<PaginatedResponse<OperationLog>>>;
  }
  return request<PaginatedResponse<OperationLog>>({
    url: `${API_CONFIG.SEO_PREFIX}/logs`,
    method: 'GET',
    params,
  });
};

// ==================== 2. 技术优化 API ====================

export interface CheckResult {
  checkId: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warning: number;
  };
  issues: IssueDetail[];
}

export interface IssueDetail {
  id: number;
  url: string;
  issue: string;
  type: 'warning' | 'error';
  suggestion: string;
}

export const startSiteCheck = async (): Promise<ApiResponse<{ checkId: string }>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.startSiteCheck();
  }
  return request<{ checkId: string }>({
    url: `${API_CONFIG.SEO_PREFIX}/check/start`,
    method: 'POST',
  });
};

export const getCheckProgress = async (checkId: string): Promise<ApiResponse<{
  checkId: string;
  progress: number;
  status: 'running' | 'completed' | 'error';
  currentItem: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getCheckProgress(checkId) as Promise<ApiResponse<{ checkId: string; progress: number; status: 'running' | 'completed' | 'error'; currentItem: string }>>;
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/check/${checkId}/progress`,
    method: 'GET',
  });
};

export const getCheckResults = async (checkId: string): Promise<ApiResponse<CheckResult>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getCheckResults(checkId) as Promise<ApiResponse<CheckResult>>;
  }
  return request<CheckResult>({
    url: `${API_CONFIG.SEO_PREFIX}/check/${checkId}/results`,
    method: 'GET',
  });
};

export const fixIssue = async (issueId: number, fixType: string): Promise<ApiResponse<{
  success: boolean;
  fixedAt: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.fixIssue(issueId, fixType);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/fix/${issueId}`,
    method: 'POST',
    data: { fixType },
  });
};

export const batchFixIssues = async (issueIds: number[], fixType: string): Promise<ApiResponse<{
  success: boolean;
  fixedCount: number;
  fixedAt: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.batchFixIssues(issueIds, fixType);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/fix/batch`,
    method: 'POST',
    data: { issueIds, fixType },
  });
};

export const exportTechReport = async (checkId: string): Promise<Blob> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.exportTechReport(checkId);
  }
  const response = await axiosInstance.get(`${API_CONFIG.SEO_PREFIX}/check/${checkId}/export`, {
    responseType: 'blob',
  });
  return response.data;
};

// ==================== 3. Sitemap管理 API ====================

export interface SitemapFile {
  id: number;
  name: string;
  url: string;
  type: 'index' | 'sitemap';
  urls: number;
  size: string;
  lastUpdate: string;
  status: 'valid' | 'invalid' | 'error';
  autoUpdate: boolean;
  content?: string;  // Sitemap内容
}

export interface SitemapConfig {
  types: string[];
  changefreq: string;
  priority: number;
  includeImages: boolean;
  compress: boolean;
}

// Sitemap URL 类型
export interface SitemapUrl {
  id: number;
  loc: string;                       // URL地址（展示用）
  lastmod: string;                   // 最后修改时间
  changefreq: string;                // 更新频率
  priority: number;                  // 优先级
  status: 'indexed' | 'pending' | 'excluded' | 'error';  // 索引状态
  // 编辑表单用字段
  content: string;                   // URL内容
  index_status: 'pending' | 'indexed' | 'excluded';  // 索引状态
  title: 'article' | 'category' | 'tag' | 'page';  // 分类
}

// Sitemap 统计类型
export interface SitemapStatistics {
  total_urls: number;      // 总URL数
  indexed_count: number;   // 已索引数
  pending_count: number;   // 待索引数
  index_rate: number;      // 索引率
}

// Sitemap 提交历史类型
export interface SitemapHistory {
  path: string;
  type: string;
  is_sitemap_index: boolean;
  last_submitted: string;
  is_pending: boolean;
  errors: string;
  warnings: string;
}

export const getSitemaps = async (): Promise<ApiResponse<SitemapFile[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getSitemaps() as Promise<ApiResponse<SitemapFile[]>>;
  }
  return request<SitemapFile[]>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/list-sitemaps/`,
    method: 'GET',
  });
};

export const listSitemaps = async (params?: { currentPage?: number; pageSize?: number }): Promise<ApiResponse<any>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getSitemaps() as Promise<ApiResponse<any>>;
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/list-sitemaps/`,
    method: 'GET',
    params: {
      currentPage: params?.currentPage,
      pageSize: params?.pageSize,
    },
  });
};

// 创建 Sitemap URL
export const createSitemapUrl = async (data: {
  content: string;
  index_status: 'pending' | 'indexed' | 'excluded';
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  title: 'article' | 'category' | 'tag' | 'page';
}): Promise<ApiResponse<SitemapUrl>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockResult: SitemapUrl = {
      id: Date.now(),
      loc: data.content,
      lastmod: new Date().toISOString(),
      changefreq: data.changefreq,
      priority: data.priority,
      status: data.index_status === 'excluded' ? 'error' : data.index_status,
      content: data.content,
      index_status: data.index_status,
      title: data.title,
    };
    return Promise.resolve({
      code: 201,
      data: mockResult,
      message: '创建成功',
    }) as Promise<ApiResponse<SitemapUrl>>;
  }
  return request<SitemapUrl>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/`,
    method: 'POST',
    data,
  });
};

// 更新 Sitemap
export const updateSitemap = async (id: number, data: {
  title: string;
  content: string;
}): Promise<ApiResponse<SitemapFile>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockResult: SitemapFile = {
      id: id,
      name: data.title,
      url: `/sitemap_${id}.xml`,
      type: 'sitemap',
      urls: 0,
      size: '0KB',
      lastUpdate: new Date().toISOString(),
      status: 'valid',
      autoUpdate: false,
      content: data.content,
    };
    return Promise.resolve({
      code: 200,
      data: mockResult,
      message: '更新成功',
    }) as Promise<ApiResponse<SitemapFile>>;
  }
  return request<SitemapFile>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemaps/${id}/`,
    method: 'PUT',
    data,
  });
};

// 删除 Sitemap
export const deleteSitemap = async (id: number): Promise<ApiResponse<void>> => {
  if (API_CONFIG.USE_MOCK) {
    return Promise.resolve({
      code: 200,
      data: undefined,
      message: '删除成功',
    }) as Promise<ApiResponse<void>>;
  }
  return request<void>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemaps/${id}/`,
    method: 'DELETE',
  });
};

// 更新 Sitemap URL
export const updateSitemapUrl = async (id: number, data: {
  content: string;
  index_status: 'pending' | 'indexed' | 'excluded';
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  title: 'article' | 'category' | 'tag' | 'page';
}): Promise<ApiResponse<SitemapUrl>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockResult: SitemapUrl = {
      id: id,
      loc: data.content,
      lastmod: new Date().toISOString(),
      changefreq: data.changefreq,
      priority: data.priority,
      status: data.index_status === 'excluded' ? 'error' : data.index_status === 'indexed' ? 'indexed' : 'pending',
      content: data.content,
      index_status: data.index_status,
      title: data.title,
    };
    return Promise.resolve({
      code: 200,
      data: mockResult,
      message: '更新成功',
    }) as Promise<ApiResponse<SitemapUrl>>;
  }
  return request<SitemapUrl>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/${id}/`,
    method: 'PUT',
    data,
  });
};

// 删除 Sitemap URL
export const deleteSitemapUrl = async (id: number): Promise<ApiResponse<void>> => {
  if (API_CONFIG.USE_MOCK) {
    return Promise.resolve({
      code: 200,
      data: undefined,
      message: '删除成功',
    }) as Promise<ApiResponse<void>>;
  }
  return request<void>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/${id}/`,
    method: 'DELETE',
  });
};

// 获取 Sitemap URL 列表
export const getSitemapUrls = async (params?: {
  currentPage?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<ApiResponse<PaginatedResponse<SitemapUrl>>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockUrls: SitemapUrl[] = [
      { 
        id: 1, 
        loc: 'https://example.com/wallpaper/4k-star-sky', 
        lastmod: '2026-04-17', 
        changefreq: 'weekly', 
        priority: 0.8, 
        status: 'indexed',
        content: 'https://example.com/wallpaper/4k-star-sky',
        index_status: 'indexed',
        title: 'article',
      },
      { 
        id: 2, 
        loc: 'https://example.com/wallpaper/anime-girl', 
        lastmod: '2026-04-17', 
        changefreq: 'weekly', 
        priority: 0.8, 
        status: 'indexed',
        content: 'https://example.com/wallpaper/anime-girl',
        index_status: 'indexed',
        title: 'article',
      },
      { 
        id: 3, 
        loc: 'https://example.com/category/nature', 
        lastmod: '2026-04-16', 
        changefreq: 'daily', 
        priority: 0.9, 
        status: 'indexed',
        content: 'https://example.com/category/nature',
        index_status: 'indexed',
        title: 'category',
      },
      { 
        id: 4, 
        loc: 'https://example.com/tag/4k', 
        lastmod: '2026-04-15', 
        changefreq: 'daily', 
        priority: 0.7, 
        status: 'pending',
        content: 'https://example.com/tag/4k',
        index_status: 'pending',
        title: 'tag',
      },
      { 
        id: 5, 
        loc: 'https://example.com/about', 
        lastmod: '2026-04-10', 
        changefreq: 'monthly', 
        priority: 0.5, 
        status: 'indexed',
        content: 'https://example.com/about',
        index_status: 'indexed',
        title: 'page',
      },
    ];
    return Promise.resolve({
      code: 200,
      data: {
        results: mockUrls,
        pagination: {
          total: mockUrls.length,
          page: params?.currentPage || 1,
          page_size: params?.pageSize || 10,
        },
      },
      message: 'success',
      success: true,
    }) as unknown as Promise<ApiResponse<PaginatedResponse<SitemapUrl>>>;
  }
  return request<PaginatedResponse<SitemapUrl>>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/`,
    method: 'GET',
    params,
  });
};

// 获取 Sitemap URL 统计
export const getSitemapStatistics = async (): Promise<ApiResponse<SitemapStatistics>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockStats: SitemapStatistics = {
      total_urls: 1627,
      indexed_count: 1580,
      pending_count: 45,
      index_rate: 97.2,
    };
    return Promise.resolve({
      code: 200,
      data: mockStats,
      message: 'success',
    }) as Promise<ApiResponse<SitemapStatistics>>;
  }
  return request<SitemapStatistics>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/statistics/`,
    method: 'GET',
  });
};

export const generateSitemap = async (data: SitemapConfig): Promise<ApiResponse<{
  sitemapId: number;
  name: string;
  content: string;
  urlCount: number;
  size: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.generateSitemap(data);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap/generate`,
    method: 'POST',
    data,
  });
};

// 重新生成 Sitemap XML
export const generateSitemapXml = async (data: {
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  content_type: 'article' | 'category' | 'tag' | 'page';
}): Promise<ApiResponse<{
  success: boolean;
  message: string;
  generated_count?: number;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    return Promise.resolve({
      code: 200,
      data: {
        success: true,
        message: 'Sitemap XML 生成成功',
        generated_count: Math.floor(Math.random() * 100) + 50,
      },
      message: 'success',
    }) as Promise<ApiResponse<{ success: boolean; message: string; generated_count?: number }>>;
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/generate-xml/`,
    method: 'POST',
    data,
  });
};

export const downloadSitemap = async (sitemapId: number): Promise<Blob> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.downloadSitemap(sitemapId);
  }
  const response = await axiosInstance.get(`${API_CONFIG.SEO_PREFIX}/sitemap/${sitemapId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Sitemap提交历史记录接口类型
 */
export interface SitemapSubmissionRecord {
  path: string;
  type: string;
  is_sitemap_index: boolean;
  last_submitted: string;
  is_pending: boolean;
  errors: string;
  warnings: string;
}

/**
 * 获取Sitemap提交历史记录
 * @returns 提交历史记录列表
 */
export const getSitemapSubmissionHistory = async (): Promise<ApiResponse<SitemapSubmissionRecord[]>> => {
  const token = localStorage.getItem('token');
  return request<SitemapSubmissionRecord[]>({
    url: `${API_CONFIG.SEO_PREFIX}/seo_view/sitemap-status/`,
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Token': token ? `${token}` : '',
    },
    params: {
      site_url: 'https://www.markwallpapers.com',
    },
  });
};

export const submitToSearchEngines = async (sitemapIds: number[]): Promise<ApiResponse<{
  submitted: number;
  status: string;
  message: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.submitToSearchEngines(sitemapIds);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/submit-to-search-engine/`,
    method: 'POST',
    data: { sitemap_ids: sitemapIds },  // sitemap_id: [1,2,3]
  });
};

/**
 * 检查 Sitemap 状态
 * @returns 状态信息
 */
export const getSitemapStatus = async (): Promise<ApiResponse<{
  is_valid: boolean;
  updated_at: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    return Promise.resolve({
      code: 200,
      data: {
        is_valid: true,
        updated_at: new Date().toISOString(),
      },
      message: 'success',
    }) as Promise<ApiResponse<{ is_valid: boolean; updated_at: string }>>;
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/check-status/`,
    method: 'POST',
  });
};

// ==================== 4. 外链管理 API ====================

export interface Backlink {
}

// ==================== 5. 内链管理 API ====================

export interface InternalLink {
}

// ==================== 6. 站点地图 API ====================

export interface SiteMap {
}

// ==================== 7. 关键词研究 API ====================

export interface Keyword {
  id: number;
  source_page: string;           // 来源页面URL
  target_page: string;           // 目标页面URL
  anchor_text: string;           // 锚文本
  da_score: number;              // DA评分
  attribute: string;             // 链接属性 (dofollow/nofollow/ugc/sponsored)
  attribute_display: string;     // 属性显示文本
  build_status: string;          // 建设状态 (pending/completed/cancelled)
  build_status_display: string;  // 建设状态显示文本
  status: string;                // 状态 (active/inactive/pending/toxic)
  status_display: string;        // 状态显示文本
  quality_score: number;         // 质量评分
  relevance: string;             // 相关性 (high/medium/low)
  contact_info: {                // 联系信息
    email: string;
    phone: string;
  };
  remark: string;                // 备注
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}

// 外链统计类型
export interface BacklinkStatistics {
  total_count: number;      // 总外链数
  active_count: number;     // 有效外链数
  inactive_count: number;   // 失效外链数
  toxic_count: number;      // 有毒外链数
}

export const getBacklinks = async (params: {
  currentPage?: number;
  pageSize?: number;
  status?: string;
  source_page?: string;
  build_status?: string;  // 外链建设状态筛选
}): Promise<ApiResponse<PaginatedResponse<Backlink>>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getBacklinks(params) as Promise<ApiResponse<PaginatedResponse<Backlink>>>;
  }
  return request<PaginatedResponse<Backlink>>({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/`,
    method: 'GET',
    params: {
      currentPage: params.currentPage || 1,
      pageSize: params.pageSize || 10,
      status: params.status,
      source_page: params.source_page,
      build_status: params.build_status,
    },
  });
};

// 获取外链统计
export const getBacklinkStatistics = async (): Promise<ApiResponse<BacklinkStatistics>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockStats: BacklinkStatistics = {
      total_count: 0,
      active_count: 0,
      inactive_count: 0,
      toxic_count: 0,
    };
    return Promise.resolve({
      code: 200,
      data: mockStats,
      message: 'success',
    }) as Promise<ApiResponse<BacklinkStatistics>>;
  }
  return request<BacklinkStatistics>({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/statistics/`,
    method: 'GET',
  });
};

export const checkBacklink = async (backlinkId: number): Promise<ApiResponse<{
  backlinkId: number;
  status: string;
  message: string;
  httpCode: number;
  checkedAt: string;
  responseTime: number;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.checkBacklink(backlinkId);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/${backlinkId}/check`,
    method: 'POST',
  });
};

export const batchCheckBacklinks = async (backlinkIds: number[]): Promise<ApiResponse<{
  checked: number;
  active: number;
  broken: number;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.batchCheckBacklinks(backlinkIds);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/check-batch`,
    method: 'POST',
    data: { backlinkIds },
  });
};

export const scanBacklinks = async (): Promise<ApiResponse<{
  found: number;
  newBacklinks: Partial<Backlink>[];
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.scanBacklinks();
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/backlinks/scan`,
    method: 'POST',
  });
};

// 创建外链
export const createBacklink = async (data: {
  source_page: string;
  target_page: string;
  anchor_text: string;
  da_score: number;
  attribute: string;
  quality_score?: number;
  remark?: string;
  status?: string;
}): Promise<ApiResponse<Backlink>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock数据
    const attributeDisplayMap: Record<string, string> = {
      'dofollow': 'Dofollow',
      'nofollow': 'Nofollow',
      'ugc': 'UGC',
      'sponsored': 'Sponsored',
    };
    const statusDisplayMap: Record<string, string> = {
      'pending': '待审核',
      'active': '有效',
      'inactive': '失效',
      'toxic': '有毒',
    };
    
    const mockResult: Backlink = {
      id: Date.now(),
      source_page: data.source_page,
      target_page: data.target_page,
      anchor_text: data.anchor_text,
      da_score: data.da_score,
      attribute: data.attribute,
      attribute_display: attributeDisplayMap[data.attribute] || data.attribute,
      build_status: 'pending',
      build_status_display: '待建设',
      status: data.status || 'pending',
      status_display: statusDisplayMap[data.status || 'pending'] || '待审核',
      quality_score: data.quality_score || 0,
      relevance: 'medium',
      contact_info: {
        email: 'contact@example.com',
        phone: '+1-555-0123',
      },
      remark: data.remark || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve({
      code: 201,
      data: mockResult,
      message: '创建成功',
    }) as Promise<ApiResponse<Backlink>>;
  }
  return request<Backlink>({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/`,
    method: 'POST',
    data,
  });
};

// 更新外链
export const updateBacklink = async (id: number, data: {
  source_page?: string;
  target_page?: string;
  anchor_text?: string;
  da_score?: number;
  attribute?: string;
  quality_score?: number;
  remark?: string;
  status?: string;
}): Promise<ApiResponse<Backlink>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock数据
    const attributeDisplayMap: Record<string, string> = {
      'dofollow': 'Dofollow',
      'nofollow': 'Nofollow',
      'ugc': 'UGC',
      'sponsored': 'Sponsored',
    };
    const statusDisplayMap: Record<string, string> = {
      'pending': '待审核',
      'active': '有效',
      'inactive': '失效',
      'toxic': '有毒',
    };
    
    const mockResult: Backlink = {
      id,
      source_page: data.source_page || '',
      target_page: data.target_page || '',
      anchor_text: data.anchor_text || '',
      da_score: data.da_score || 0,
      attribute: data.attribute || 'dofollow',
      attribute_display: attributeDisplayMap[data.attribute || 'dofollow'] || 'Dofollow',
      build_status: 'pending',
      build_status_display: '待建设',
      status: data.status || 'pending',
      status_display: statusDisplayMap[data.status || 'pending'] || '待审核',
      quality_score: data.quality_score || 0,
      relevance: 'medium',
      contact_info: {
        email: 'contact@example.com',
        phone: '+1-555-0123',
      },
      remark: data.remark || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve({
      code: 200,
      data: mockResult,
      message: '更新成功',
    }) as Promise<ApiResponse<Backlink>>;
  }
  return request<Backlink>({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/${id}/`,
    method: 'PUT',
    data,
  });
};

// 删除外链
export const deleteBacklink = async (id: number): Promise<ApiResponse<void>> => {
  if (API_CONFIG.USE_MOCK) {
    return Promise.resolve({
      code: 200,
      data: undefined,
      message: '删除成功',
    }) as Promise<ApiResponse<void>>;
  }
  return request<void>({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/${id}/`,
    method: 'DELETE',
  });
};

// 一键扫描外链机会
export const scanBacklinkOpportunities = async (): Promise<ApiResponse<void>> => {
  if (API_CONFIG.USE_MOCK) {
    return Promise.resolve({
      code: 200,
      data: undefined,
      message: '扫描成功',
    }) as Promise<ApiResponse<void>>;
  }
  return request<void>({
    url: `${API_CONFIG.SEO_PREFIX}/backlink/find-opportunities/`,
    method: 'POST',
  });
};

// ==================== 5. TDK管理 API ====================

// TDK模板类型定义
export interface TDKTemplate {
  id: number;
  page_type: string;                 // 页面类型标识（如article, category, tag, home）
  page_type_display: string;         // 页面类型显示名称（如文章页、分类页）
  title?: string;                    // title模板（可选）
  description?: string;              // description模板（可选）
  keywords?: string;                 // keywords关键词（可选）
  updated_at?: string;               // 最后更新（可选）
  applied_count?: number;            // 应用页面数（可选）
  is_template?: boolean;
}

// 页面TDK类型定义
export interface PageTDK {
  id: number;
  page_type: string;                 // 页面类型标识
  page_type_display: string;         // 页面类型显示名称
  url_content?: string;              // 页面URL（可选）
  title?: string;                    // 标题（可选）
  description?: string;              // 描述（可选）
  keywords?: string[];               // 关键词数组（可选）
  char_count?: { title: number; desc: number };
}

/**
 * 获取TDK列表（模板或页面）
 * @param params - 请求参数
 * @param params.currentPage - 当前页码
 * @param params.pageSize - 每页数量
 * @param params.is_template - 是否为模板（true: 模板，false: 页面）
 */
export const getTDKList = async (params: {
  currentPage?: number;
  pageSize?: number;
  is_template: boolean;
  title?: string;
  page_type?: string;
}): Promise<ApiResponse<{
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
  results: (TDKTemplate | PageTDK)[];
}>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据 - 匹配实际后端返回结构
    if (params.is_template) {
      const mockTemplates: TDKTemplate[] = [
        {
          id: 1,
          page_type: 'article',
          page_type_display: '文章页',
          title: '{标题前50字}-{分类词}-{品牌词}',
          description: '前150字符+相关标签词',
          keywords: '{分类词},{标签1},{标签2},{标签3}',
          applied_count: 856,
          updated_at: '2026-04-15',
          is_template: true,
        },
        {
          id: 2,
          page_type: 'category',
          page_type_display: '分类页',
          title: '{分类名}-{相关词}-{品牌词}',
          description: '分类描述+热门标签',
          keywords: '{分类词},壁纸,高清壁纸',
          applied_count: 24,
          updated_at: '2026-04-14',
          is_template: true,
        },
      ];
      return Promise.resolve({
        code: 200,
        data: {
          pagination: {
            page: params.currentPage || 1,
            page_size: params.pageSize || 10,
            total: mockTemplates.length,
          },
          results: mockTemplates,
        },
        message: 'success',
        success: true,
      }) as unknown as Promise<ApiResponse<{
        pagination: { page: number; page_size: number; total: number };
        results: (TDKTemplate | PageTDK)[];
      }>>;
    } else {
      const mockPages: PageTDK[] = [
        {
          id: 1,
          url_content: '/wallpaper/4k-star-sky',
          title: '4K星空壁纸-夜景壁纸-壁纸大全',
          description: '精选4K超高清星空壁纸，3840x2160分辨率，完美适配电脑桌面，免费下载使用',
          keywords: ['4K壁纸', '星空壁纸', '夜景壁纸', '高清壁纸'],
          page_type: 'article',
          page_type_display: '文章页',
          char_count: { title: 24, desc: 52 },
        },
        {
          id: 2,
          url_content: '/category/anime',
          title: '动漫壁纸-二次元高清壁纸-壁纸大全',
          description: '海量动漫壁纸，二次元风格，高清分辨率，适配手机和电脑',
          keywords: ['动漫壁纸', '二次元', '高清壁纸'],
          page_type: 'category',
          page_type_display: '分类页',
          char_count: { title: 23, desc: 38 },
        },
      ];
      return Promise.resolve({
        code: 200,
        data: {
          pagination: {
            page: params.currentPage || 1,
            page_size: params.pageSize || 10,
            total: mockPages.length,
          },
          results: mockPages,
        },
        message: 'success',
        success: true,
      }) as unknown as Promise<ApiResponse<{
        pagination: { page: number; page_size: number; total: number };
        results: (TDKTemplate | PageTDK)[];
      }>>;
    }
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/tdk/`,
    method: 'GET',
    params,
  });
};

/**
 * 删除TDK记录
 * @param id - TDK记录ID
 */
export const deleteTDK = async (id: number): Promise<ApiResponse<void>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    return Promise.resolve({
      code: 200,
      data: undefined,
      message: '删除成功',
      success: true,
    }) as unknown as Promise<ApiResponse<void>>;
  }
  return request<void>({
    url: `${API_CONFIG.SEO_PREFIX}/tdk/${id}/`,
    method: 'DELETE',
  });
};

/**
 * 创建TDK模板或页面TDK
 * @param data - TDK数据
 */
export const createTDKTemplate = async (data: {
  page_type: string;
  title?: string;
  description?: string;
  keywords?: string;
  is_template?: boolean;
  url_content?: string;  // 页面URL地址（仅页面TDK需要）
  url?: number;  // 选中的URL ID（仅页面TDK需要）
}): Promise<ApiResponse<TDKTemplate>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    return Promise.resolve({
      code: 201,
      data: {
        id: Date.now(),
        page_type: data.page_type,
        page_type_display: data.page_type,
        title: data.title || '',
        description: data.description || '',
        keywords: data.keywords || '',
        updated_at: new Date().toISOString(),
        applied_count: 0,
        is_template: data.is_template !== false,
        url_content: data.url_content || '',
      },
      message: '创建成功',
      success: true,
    }) as unknown as Promise<ApiResponse<TDKTemplate>>;
  }
  return request<TDKTemplate>({
    url: `${API_CONFIG.SEO_PREFIX}/tdk/`,
    method: 'POST',
    data,
  });
};

/**
 * 更新TDK模板
 * @param id - 模板ID
 * @param data - 更新的数据
 */
export const updateTDKTemplate = async (id: number, data: {
  page_type?: string;
  title?: string;
  description?: string;
  keywords?: string;
}): Promise<ApiResponse<TDKTemplate>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    return Promise.resolve({
      code: 200,
      data: {
        id,
        page_type: data.page_type || 'article',
        page_type_display: data.page_type || '文章页',
        title: data.title || '',
        description: data.description || '',
        keywords: data.keywords || '',
        updated_at: new Date().toISOString(),
        applied_count: 0,
        is_template: true,
      },
      message: '更新成功',
      success: true,
    }) as unknown as Promise<ApiResponse<TDKTemplate>>;
  }
  return request<TDKTemplate>({
    url: `${API_CONFIG.SEO_PREFIX}/tdk/${id}/`,
    method: 'PUT',
    data,
  });
};

export const exportTDKReport = async (): Promise<Blob> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.exportTDKReport();
  }
  const response = await axiosInstance.get(`${API_CONFIG.SEO_PREFIX}/tdk/export`, {
    responseType: 'blob',
  });
  return response.data;
};

export const importTDKData = async (file: File): Promise<ApiResponse<{
  imported: number;
  failed: number;
  message: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    const formData = new FormData();
    formData.append('file', file);
    return seoMockApi.importTDKData(formData);
  }
  const formData = new FormData();
  formData.append('file', file);
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/tdk/import`,
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ==================== 6. Google Search Console API ====================

export interface GSCData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  dates: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
}

export const getSearchConsoleData = async (params: {
  site_url: string;
  start_timestamp: number;
  end_timestamp: number;
}): Promise<ApiResponse<GSCData>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getSearchConsoleData(params) as Promise<ApiResponse<GSCData>>;
  }
  return request<GSCData>({
    url: `${API_CONFIG.SEO_PREFIX}/data_analysis/data-analysis/`,
    method: 'GET',
    params,
  });
};

export const getIndexTrend = async (params: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<GSCData>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getIndexTrend(params);
  }
  return request<GSCData>({
    url: `${API_CONFIG.SEO_PREFIX}/data_analysis/index-trend/`,
    method: 'GET',
    params,
  });
};

export interface KeywordRanking {
  id: number;
  keyword: string;
  searchEngine: string;
  currentRank: number;
  previousRank: number;
  change: number;
  searchVolume: number;
  url: string;
}

export const getKeywordRankings = async (params: {
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<PaginatedResponse<KeywordRanking>>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getKeywordRankings(params) as Promise<ApiResponse<PaginatedResponse<KeywordRanking>>>;
  }
  return request<PaginatedResponse<KeywordRanking>>({
    url: `${API_CONFIG.SEO_PREFIX}/rankings`,
    method: 'GET',
    params,
  });
};

export interface LongTailKeyword {
  id: number;
  keyword: string;
  parentKeyword: string;
  searchVolume: number;
  difficulty: number;
  recommendation: string;
}

/**
 * 数据分析详细数据类型
 */
export interface DataAnalysisDetail {
  index_trend: Array<{
    date: string;
    indexed_count: number;
  }>;
  keyword_rankings: Array<{
    keyword: string;
    current_rank: number;
    previous_rank: number;
    search_volume: number;
    url: string;
  }>;
  landing_pages: Array<{
    page_path: string;
    visits: number;
    bounce_rate: number;
    avg_duration: string;
    conversion_rate: number;
  }>;
}

/**
 * 获取数据分析详细数据
 * @param params 查询参数
 * @returns 数据分析详细数据
 */
export const getDataAnalysisDetail = async (params: {
  site_url: string;
  start_timestamp: number;
  end_timestamp: number;
}): Promise<ApiResponse<DataAnalysisDetail>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    return Promise.resolve({
      code: 200,
      data: {
        index_trend: [],
        keyword_rankings: [],
        landing_pages: [],
      },
      message: 'success',
    }) as Promise<ApiResponse<DataAnalysisDetail>>;
  }
  return request<DataAnalysisDetail>({
    url: `${API_CONFIG.SEO_PREFIX}/data_analysis/data-analysis/`,
    method: 'GET',
    params,
  });
};

export const generateLongTailKeywords = async (data: {
  coreKeyword: string;
  modifiers: string[];
}): Promise<ApiResponse<LongTailKeyword[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.generateLongTailKeywords(data);
  }
  return request<LongTailKeyword[]>({
    url: `${API_CONFIG.SEO_PREFIX}/keywords/generate`,
    method: 'POST',
    data,
  });
};


// ==================== 8. 定时任务 API ====================

export interface ScheduledTask {
  id: number;
  name: string;
  type: 'check' | 'sitemap' | 'backlink';
  cron: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
}

export const getScheduledTasks = async (): Promise<ApiResponse<ScheduledTask[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getScheduledTasks() as Promise<ApiResponse<ScheduledTask[]>>;
  }
  return request<ScheduledTask[]>({
    url: `${API_CONFIG.SEO_PREFIX}/scheduled-tasks`,
    method: 'GET',
  });
};

export const addScheduledTask = async (data: Omit<ScheduledTask, 'id' | 'lastRun' | 'nextRun'>): Promise<ApiResponse<ScheduledTask>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.addScheduledTask(data);
  }
  return request<ScheduledTask>({
    url: `${API_CONFIG.SEO_PREFIX}/scheduled-tasks`,
    method: 'POST',
    data,
  });
};

export const updateScheduledTask = async (taskId: number, data: Partial<ScheduledTask>): Promise<ApiResponse<ScheduledTask>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.updateScheduledTask(taskId, data);
  }
  return request<ScheduledTask>({
    url: `${API_CONFIG.SEO_PREFIX}/scheduled-tasks/${taskId}`,
    method: 'PUT',
    data,
  });
};

export const deleteScheduledTask = async (taskId: number): Promise<ApiResponse<{ deleted: boolean }>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.deleteScheduledTask(taskId);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/scheduled-tasks/${taskId}`,
    method: 'DELETE',
  });
};

export const executeScheduledTask = async (taskId: number): Promise<ApiResponse<{
  taskId: number;
  executedAt: string;
  result: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.executeScheduledTask(taskId);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/scheduled-tasks/${taskId}/execute`,
    method: 'POST',
  });
};

// ==================== 9. 告警规则 API ====================

export interface AlertRule {
  id: number;
  type: 'health_score' | '404_errors' | 'index_drop' | 'ranking_drop';
  name: string;
  threshold: number;
  enabled: boolean;
  notify: ('email' | 'sms' | 'webhook')[];
}

export const getAlertRules = async (): Promise<ApiResponse<AlertRule[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getAlertRules() as Promise<ApiResponse<AlertRule[]>>;
  }
  return request<AlertRule[]>({
    url: `${API_CONFIG.SEO_PREFIX}/alert-rules`,
    method: 'GET',
  });
};

export const saveAlertRules = async (rules: AlertRule[]): Promise<ApiResponse<{ saved: boolean; count: number }>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.saveAlertRules(rules);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/alert-rules`,
    method: 'POST',
    data: { rules },
  });
};

// ==================== 10. Robots.txt测试 API ====================

export interface RobotsTestData {
  userAgent: string;
  url: string;
  rules?: string;
}

export const testRobotsRule = async (data: RobotsTestData): Promise<ApiResponse<{
  userAgent: string;
  url: string;
  result: 'Allow' | 'Disallow';
  matchedRule: string;
  explanation: string;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.testRobotsRule(data) as Promise<ApiResponse<{ userAgent: string; url: string; result: 'Allow' | 'Disallow'; matchedRule: string; explanation: string }>>;
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/robots/test`,
    method: 'POST',
    data,
  });
};

// ==================== 12. 页面速度统计 API ====================

/**
 * 页面速度统计数据接口
 */
export interface PageSpeedStatistics {
  total_count: number;         // 已测试页面总数
  avg_score: number;           // 平均评分
  excellent_count: number;     // 优秀数量（>=90分）
  needs_improvement_count: number;  // 需要改进数量
}

/**
 * 获取页面速度统计数据
 * @returns 页面速度统计数据
 */
export const getPageSpeedStatistics = async (): Promise<ApiResponse<PageSpeedStatistics>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockStats: PageSpeedStatistics = {
      total_count: 125,
      avg_score: 82.5,
      excellent_count: 45,
      needs_improvement_count: 80,
    };
    return Promise.resolve({
      code: 200,
      data: mockStats,
      message: 'success',
    }) as Promise<ApiResponse<PageSpeedStatistics>>;
  }
  return request<PageSpeedStatistics>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/statistics/`,
    method: 'GET',
    params: {
      platform: 'page',
    },
  });
};

/**
 * 页面速度测试请求参数
 */
export interface PageSpeedTestRequest {
  page_path: string;  // 页面路径（必填）
  platform: 'page';   // 平台（固定为'page'）
}

/**
 * 页面速度测试响应数据
 */
export interface PageSpeedTestResult {
  test_id: number;
  page_path: string;
  status: string;  // 'pending' | 'running' | 'completed' | 'failed'
  message: string;
}

/**
 * 测试页面速度
 * @param params 测试参数
 * @returns 测试结果
 */
export const testPageSpeed = async (params: PageSpeedTestRequest): Promise<ApiResponse<PageSpeedTestResult>> => {
  return request<PageSpeedTestResult>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/test/`,
    method: 'POST',
    data: params,
  });
};

/**
 * 页面速度列表项数据类型
 */
export interface PageSpeedItem {
  id: number;
  page_path: string;           // 页面路径
  overall_score: number;       // 综合评分
  fcp: number;                 // 首次内容绘制（秒）
  lcp: number;                 // 最大内容绘制（秒）
  fid: number;                 // 首次输入延迟（毫秒）
  cls: number;                 // 累积布局偏移
  ttfb: number;                // 首字节时间（秒）
  load_time: number;           // 加载时间（秒）
  page_size: number;           // 页面大小（MB）
  resource_count: number;      // 资源数量
  issue_count: number;         // 问题数量
  is_mobile_friendly: boolean; // 是否移动友好（移动端专用）
  tested_at: string;           // 测试时间
}

/**
 * 页面速度详情数据类型
 */
export interface PageSpeedDetail extends PageSpeedItem {
  issues: SpeedIssue[];        // 问题列表
  platform: string;            // 平台
}

/**
 * 速度问题类型
 */
export interface SpeedIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  solution: string;
}

/**
 * 获取页面速度列表
 * @param params 查询参数
 * @returns 页面速度列表
 */
export const getPageSpeedList = async (params: {
  currentPage?: number;
  pageSize?: number;
  platform?: string;
}): Promise<ApiResponse<PaginatedResponse<PageSpeedItem>>> => {
  return request<PaginatedResponse<PageSpeedItem>>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/`,
    method: 'GET',
    params: {
      currentPage: params.currentPage || 1,
      pageSize: params.pageSize || 10,
      platform: params.platform || 'page',
    },
  });
};

/**
 * 获取页面速度详情
 * @param id 页面速度记录ID
 * @returns 页面速度详情
 */
export const getPageSpeedDetail = async (id: number): Promise<ApiResponse<PageSpeedDetail>> => {
  return request<PageSpeedDetail>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/${id}/`,
    method: 'GET',
  });
};

/**
 * 移动端页面速度测试请求类型（新测试）
 */
export interface MobilePageSpeedTestRequest {
  page_path: string;           // 页面路径
  platform: 'phone';          // 平台固定为phone
}

/**
 * 页面速度重测请求类型
 */
export interface PageSpeedRetestRequest {
  id: number;                  // 页面速度记录ID
  platform: 'page' | 'phone';  // 平台类型
}

/**
 * 移动端页面速度测试结果类型
 */
export interface MobilePageSpeedTestResult {
  test_id: number;             // 测试ID
  page_path: string;           // 页面路径
  status: string;              // 状态
  message: string;             // 消息
}

/**
 * 测试新页面速度（移动端）
 * @param params 测试参数
 * @returns 测试结果
 */
export const testMobilePageSpeed = async (params: MobilePageSpeedTestRequest): Promise<ApiResponse<MobilePageSpeedTestResult>> => {
  return request<MobilePageSpeedTestResult>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/test/`,
    method: 'POST',
    data: params,
  });
};

/**
 * 重测页面速度
 * @param params 重测参数
 * @returns 测试结果
 */
export const retestPageSpeed = async (params: PageSpeedRetestRequest): Promise<ApiResponse<MobilePageSpeedTestResult>> => {
  return request<MobilePageSpeedTestResult>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/test/`,
    method: 'POST',
    data: params,
  });
};

/**
 * 移动端页面速度统计类型
 */
export interface MobilePageSpeedStatistics {
  total_count: number;         // 总测试数
  avg_score: number;           // 平均分数
  excellent_count: number;     // 优秀数量
  needs_improvement_count: number;  // 需要改进数量
}

/**
 * 获取移动端页面速度统计数据
 * @returns 统计数据
 */
export const getMobilePageSpeedStatistics = async (): Promise<ApiResponse<MobilePageSpeedStatistics>> => {
  return request<MobilePageSpeedStatistics>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/statistics/`,
    method: 'GET',
    params: {
      platform: 'phone',
    },
  });
};

/**
 * 获取移动端页面速度列表
 * @param params 查询参数
 * @returns 移动端页面速度列表
 */
// export const getMobilePageSpeedList = async (params: {
//   currentPage?: number;
//   pageSize?: number;
// }): Promise<ApiResponse<PaginatedResponse<PageSpeedItem>>> => {
//   return request<PaginatedResponse<PageSpeedItem>>({
//     url: `${API_CONFIG.SEO_PREFIX}/page_speed/`,
//     method: 'GET',
//     params: {
//       currentPage: params.currentPage || 1,
//       pageSize: params.pageSize || 10,
//       platform: 'phone',
//     },
//   });
// };

// ==================== 13. 域名分析 API ====================

// 域名分析数据类型
export interface DomainAnalysis {
  id: number;
  domain: string;              // 域名
  safety_score: number;        // 安全评分
  status: string;              // 状态码
  status_display: string;      // 状态显示文本
  backlink_count?: number;     // 外链数量（可选）
  remark?: string | null;      // 备注（可选）
  created_at?: string;         // 创建时间（可选）
  analyzed_at?: string;        // 分析时间（可选）
}

// 获取域名分析列表
export const getDomainAnalysisList = async (params: {
  currentPage?: number;
  pageSize?: number;
  domain?: string;
  status?: string;
}): Promise<ApiResponse<PaginatedResponse<DomainAnalysis>>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockData: DomainAnalysis[] = [
      {
        id: 1,
        domain: 'example.com',
        safety_score: 90,
        status: 'safe',
        status_display: '安全',
        backlink_count: 150,
        remark: null,
        created_at: '2026-01-15T10:00:00Z',
        analyzed_at: '2026-04-17T10:00:00Z',
      },
      {
        id: 2,
        domain: 'test-site.org',
        safety_score: 45,
        status: 'warning',
        status_display: '需关注',
        backlink_count: 30,
        remark: null,
        created_at: '2026-02-20T08:30:00Z',
        analyzed_at: '2026-04-16T15:30:00Z',
      },
    ];
    return Promise.resolve({
      code: 200,
      data: {
        results: mockData,
        pagination: {
          total: mockData.length,
          page: params?.currentPage || 1,
          page_size: params?.pageSize || 10,
        },
      },
      message: 'success',
    }) as Promise<ApiResponse<PaginatedResponse<DomainAnalysis>>>;
  }
  return request<PaginatedResponse<DomainAnalysis>>({
    url: `${API_CONFIG.SEO_PREFIX}/domain_analysis/`,
    method: 'GET',
    params: {
      currentPage: params.currentPage || 1,
      pageSize: params.pageSize || 10,
      domain: params.domain,
      status: params.status,
    },
  });
};

// 重新分析域名
export const reAnalyzeDomain = async (ids: number[]): Promise<ApiResponse<{
  total_count: number;
  success_count: number;
  failed_count: number;
  results: Array<{
    id: number;
    domain: string;
    status: string;
    message: string;
  }>;
}>> => {
  if (API_CONFIG.USE_MOCK) {
    return Promise.resolve({
      code: 200,
      data: {
        total_count: ids.length,
        success_count: ids.length,
        failed_count: 0,
        results: ids.map(id => ({
          id,
          domain: 'example.com',
          status: 'success',
          message: '分析成功',
        })),
      },
      message: 'success',
    }) as Promise<ApiResponse<{
      total_count: number;
      success_count: number;
      failed_count: number;
      results: Array<{
        id: number;
        domain: string;
        status: string;
        message: string;
      }>;
    }>>;
  }
  return request<{
    total_count: number;
    success_count: number;
    failed_count: number;
    results: Array<{
      id: number;
      domain: string;
      status: string;
      message: string;
    }>;
  }>({
    url: `${API_CONFIG.SEO_PREFIX}/domain_analysis/re-analyze/`,
    method: 'POST',
    data: { ids },
  });
};

// ==================== 14. 检测日志 API ====================

/**
 * 检测日志数据类型
 */
export interface DetectionLog {
  id: number;                  // 日志ID
  check_time: string;          // 检测时间
  category_display: string;    // 检测类型显示文本
  content: string;             // 检测内容
  result_summary: string;      // 检测结果摘要
  message: string;             // 状态消息
  operator?: string;           // 操作人（可选）
}

/**
 * 获取检测日志列表
 * @param params 查询参数
 * @returns 检测日志列表
 */
export const getDetectionLogs = async (params: {
  currentPage?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResponse<PaginatedResponse<DetectionLog>>> => {
  return request<PaginatedResponse<DetectionLog>>({
    url: `${API_CONFIG.SEO_PREFIX}/detection-log/`,
    method: 'GET',
    params: {
      currentPage: params.currentPage || 1,
      pageSize: params.pageSize || 10,
      search: params.search,
    },
  });
};

/**
 * 资源分析数据类型
 */
export interface ResourceAnalysis {
  page_size: number;                // 页面大小
  resource_count: number;           // 资源数量
  ttfb: number;                     // TTFB（首字节时间）
  loading_timeline: {               // 加载时间线
    ttfb: number;                   // 首字节时间（秒）
    fcp: number;                    // 首次内容绘制（秒）
    lcp: number;                    // 最大内容绘制（秒）
    full_load: number;              // 完全加载（秒）
  };
}

/**
 * 优化建议数据类型
 */
export interface OptimizationSuggestion {
  id: number;
  page_speed_id: number;
  type: string;                     // 建议类型（image/script/css/server等）
  suggestion_type?: string;         // 建议类型（兼容字段）
  priority: string;                 // 优先级（high/medium/low）
  title: string;                    // 建议标题
  description: string;              // 建议描述
  estimated_improvement?: string;   // 预估提升（可选）
  created_at: string;               // 创建时间
}

/**
 * 获取资源分析
 * @param id 页面速度记录ID
 * @returns 资源分析数据
 */
export const getResourceAnalysis = async (id: number): Promise<ApiResponse<ResourceAnalysis>> => {
  return request<ResourceAnalysis>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/resource-analysis/`,
    method: 'GET',
    params: { id },
  });
};

/**
 * 获取优化建议
 * @param id 页面速度记录ID
 * @returns 优化建议列表
 */
export const getOptimizationSuggestions = async (id: number): Promise<ApiResponse<OptimizationSuggestion[]>> => {
  return request<OptimizationSuggestion[]>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/optimization-suggestions/`,
    method: 'GET',
  });
};

// ==================== 14. 数据分析 API ====================

/**
 * 数据分析仪表盘数据类型
 */
export interface DataAnalysisDashboard {
  total_indexed: number;                    // 总收录量
  total_indexed_weekly_increment: number;   // 收录量周增量
  seo_traffic: number;                      // SEO流量
  seo_traffic_weekly_increment: number;     // 流量周增量
  avg_ranking: number;                      // 平均排名
  avg_ranking_weekly_increment: number;     // 排名周增量
  backlink_count: number;                   // 外链数量
  backlink_count_weekly_increment: number;  // 外链周增量
}

/**
 * 获取数据分析仪表盘数据
 * @param site_url 站点URL（必填）
 * @returns 数据分析仪表盘数据
 */
export const getDataAnalysisDashboard = async (site_url: string): Promise<ApiResponse<DataAnalysisDashboard>> => {
  return request<DataAnalysisDashboard>({
    url: `${API_CONFIG.SEO_PREFIX}/data_analysis/dashboard/`,
    method: 'GET',
    params: { site_url },
  });
};
export const getMobilePageSpeedList = async (params: {
  currentPage?: number;
  pageSize?: number;
}): Promise<ApiResponse<PaginatedResponse<PageSpeedItem>>> => {
  return request<PaginatedResponse<PageSpeedItem>>({
    url: `${API_CONFIG.SEO_PREFIX}/page_speed/`,
    method: 'GET',
    params: {
      currentPage: params.currentPage || 1,
      pageSize: params.pageSize || 10,
      platform: 'phone',
    },
  });
};

// ==================== 统一导出 ====================

export const seoApi = {
  // 配置
  config: API_CONFIG,
  
  // 仪表盘
  getSEOHealthScore,
  getSEODashboard,
  getPendingIssues,
  getCoreMetrics,
  getTechChecks,
  getOperationLogs,
  
  // 技术优化
  startSiteCheck,
  getCheckProgress,
  getCheckResults,
  fixIssue,
  batchFixIssues,
  exportTechReport,
  
  // Sitemap
  getSitemaps,
  listSitemaps,
  getSitemapUrls,
  getSitemapStatistics,
  createSitemapUrl,
  updateSitemap,
  deleteSitemap,
  generateSitemap,
  generateSitemapXml,
  downloadSitemap,
  submitToSearchEngines,
  getSitemapSubmissionHistory,
  getSitemapStatus,

  // 外链
  getBacklinks,
  getBacklinkStatistics,
  getDomainAnalysisList,
  reAnalyzeDomain,
  checkBacklink,
  batchCheckBacklinks,
  scanBacklinks,
  createBacklink,
  updateBacklink,
  deleteBacklink,
  scanBacklinkOpportunities,
  
  // TDK管理
  getTDKList,
  deleteTDK,
  createTDKTemplate,
  updateTDKTemplate,
  exportTDKReport,
  importTDKData,
  
  // Google Search Console
  getSearchConsoleData,
  
  // 数据分析
  getDataAnalysisDashboard,
  getDataAnalysisDetail,
  
  // 关键词
  deleteScheduledTask,
  executeScheduledTask,
  
  // 告警规则
  getAlertRules,
  saveAlertRules,
  
  // Robots测试
  testRobotsRule,
  
  // 页面速度
  getPageSpeedStatistics,
  testPageSpeed,
  retestPageSpeed,
  getPageSpeedList,
  getPageSpeedDetail,
  testMobilePageSpeed,
  getMobilePageSpeedStatistics,
  getMobilePageSpeedList,
  getResourceAnalysis,
  getOptimizationSuggestions,

  // 内容优化统计
  getContentOptimizationDashboard,
  getContentOptimizationList,
  analyzeContentOptimization,
  reAnalyzeContentOptimization,

  // 检测日志
  getDetectionLogs,
};
export interface ContentOptimizationDashboard {
  analyzed_pages_count: number;    // 已分析页面总数
  avg_content_score: number;       // 平均内容评分
  total_issues: number;            // 待修复问题总数
  total_suggestions: number;       // 优化建议总数
}

/**
 * 内容优化问题类型
 */
export interface ContentIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  location: string;
}

/**
 * 内容优化页面类型
 */
export interface ContentOptimizationPage {
  id: number;
  page_path: string;           // 页面路径
  page_title: string;          // 页面标题
  full_url?: string;           // 完整URL（可选）
  platform?: string;           // 平台类型
  platform_display?: string;   // 平台显示名称
  content_score: number;       // 内容评分
  word_count: number;          // 字数
  issue_count: number;         // 问题数量
  issues?: ContentIssue[];     // 问题列表（可选）
  optimization_suggestions?: string[]; // 优化建议（可选）
  last_optimized_at: string;   // 最后优化时间
  created_at?: string;         // 创建时间
}

/**
 * 分析新页面内容请求类型
 */
export interface AnalyzeContentRequest {
  page_path: string;  // 页面路径
}

/**
 * 分析新页面内容响应类型
 */
export interface AnalyzeContentResult {
  message: string;    // 分析结果消息
  page_id?: number;   // 分析后的页面ID
}

/**
 * 分析新页面内容
 * @param params 分析参数
 * @returns 分析结果
 */
async function analyzeContentOptimization(params: AnalyzeContentRequest): Promise<ApiResponse<AnalyzeContentResult>> {
  try {
    const response = await request<AnalyzeContentResult>({
      url: '/seo/content_optimization/analyze/',
      method: 'post',
      data: params,
    });
    return response;
  } catch (error) {
    console.error('分析页面内容失败:', error);
    return {
      code: 500,
      success: false,
      message: '分析失败',
      data: {} as AnalyzeContentResult,
    };
  }
}

/**
 * 重新分析页面内容请求类型
 */
export interface ReAnalyzeContentRequest {
  id: number;  // 页面ID
}

/**
 * 重新分析页面内容
 * @param params 重新分析参数
 * @returns 分析结果
 */
async function reAnalyzeContentOptimization(params: ReAnalyzeContentRequest): Promise<ApiResponse<AnalyzeContentResult>> {
  try {
    const response = await request<AnalyzeContentResult>({
      url: '/seo/content_optimization/re-analyze/',
      method: 'post',
      data: params,
    });
    return response;
  } catch (error) {
    console.error('重新分析页面内容失败:', error);
    return {
      code: 500,
      success: false,
      message: '重新分析失败',
      data: {} as AnalyzeContentResult,
    };
  }
}

/**
 * 获取内容优化统计数据
 */
async function getContentOptimizationDashboard(): Promise<ApiResponse<ContentOptimizationDashboard>> {
  try {
    const response = await request<ContentOptimizationDashboard>({
      url: '/seo/content_optimization/dashboard/',
      method: 'get',
    });
    return response;
  } catch (error) {
    console.error('获取内容优化统计数据失败:', error);
    return {
      code: 500,
      success: false,
      message: '获取统计数据失败',
      data: {} as ContentOptimizationDashboard,
    };
  }
}

/**
 * 获取内容优化列表
 */
async function getContentOptimizationList(params: {
  currentPage: number;
  pageSize: number;
  title?: string;          // 页面标题搜索
  min_score?: number;      // 最低评分筛选
  max_score?: number;      // 最高评分筛选
}): Promise<ApiResponse<PaginatedResponse<ContentOptimizationPage>>> {
  try {
    const response = await request<PaginatedResponse<ContentOptimizationPage>>({
      url: '/seo/content_optimization/',
      method: 'get',
      params,
    });
    return response;
  } catch (error) {
    console.error('获取内容优化列表失败:', error);
    return {
      code: 500,
      success: false,
      message: '获取列表失败',
      data: {
        results: [],
        pagination: {
          total: 0,
          currentPages: 1,
          page_size: 10,
          total_pages: 0,
        },
      }
    }
  }    
}
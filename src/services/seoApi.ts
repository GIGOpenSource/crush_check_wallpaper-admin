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
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
  status: 'indexed' | 'pending' | 'error';
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

// 更新 Sitemap URL
export const updateSitemapUrl = async (data: {
  id: number;
  title: string;
  content: string;
}): Promise<ApiResponse<SitemapUrl>> => {
  if (API_CONFIG.USE_MOCK) {
    // Mock 数据
    const mockResult: SitemapUrl = {
      id: data.id,
      loc: data.content,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.5,
      status: 'indexed',
    };
    return Promise.resolve({
      code: 200,
      data: mockResult,
      message: '更新成功',
    }) as Promise<ApiResponse<SitemapUrl>>;
  }
  return request<SitemapUrl>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemap_urls/update-sitemap-xml/`,
    method: 'POST',
    data,
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
      { id: 1, loc: 'https://example.com/wallpaper/4k-star-sky', lastmod: '2026-04-17', changefreq: 'weekly', priority: 0.8, status: 'indexed' },
      { id: 2, loc: 'https://example.com/wallpaper/anime-girl', lastmod: '2026-04-17', changefreq: 'weekly', priority: 0.8, status: 'indexed' },
      { id: 3, loc: 'https://example.com/category/nature', lastmod: '2026-04-16', changefreq: 'daily', priority: 0.9, status: 'indexed' },
      { id: 4, loc: 'https://example.com/tag/4k', lastmod: '2026-04-15', changefreq: 'daily', priority: 0.7, status: 'pending' },
      { id: 5, loc: 'https://example.com/about', lastmod: '2026-04-10', changefreq: 'monthly', priority: 0.5, status: 'indexed' },
    ];
    return Promise.resolve({
      code: 200,
      data: {
        items: mockUrls,
        total: mockUrls.length,
        page: params?.currentPage || 1,
        pageSize: params?.pageSize || 10,
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
  id: number;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  isNofollow: boolean;
  isSponsored: boolean;
  status: 'active' | 'removed' | 'broken';
  discoveredAt: string;
  lastChecked: string;
}

export const getBacklinks = async (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}): Promise<ApiResponse<PaginatedResponse<Backlink>>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getBacklinks(params) as Promise<ApiResponse<PaginatedResponse<Backlink>>>;
  }
  return request<PaginatedResponse<Backlink>>({
    url: `${API_CONFIG.SEO_PREFIX}/backlinks`,
    method: 'GET',
    params,
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
  url_content?: string;  // 页面URL（仅页面TDK需要）
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
  dates: { date: string; clicks: number; impressions: number }[];
}

export const getSearchConsoleData = async (params: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<GSCData>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getSearchConsoleData(params);
  }
  return request<GSCData>({
    url: `${API_CONFIG.SEO_PREFIX}/gsc/data`,
    method: 'GET',
    params,
  });
};

export const getIndexTrend = async (params: {
  days?: number;
}): Promise<ApiResponse<{ date: string; google: number; indexed: number; discovered: number }[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getIndexTrend(params);
  }
  return request({
    url: `${API_CONFIG.SEO_PREFIX}/gsc/index-trend`,
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

// ==================== 7. 关键词研究 API ====================

export interface Keyword {
  id: number;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  competition: 'high' | 'medium' | 'low';
  relatedCount: number;
  category: string;
}

export const searchKeywords = async (params: {
  keyword: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<PaginatedResponse<Keyword>>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.searchKeywords(params) as Promise<ApiResponse<PaginatedResponse<Keyword>>>;
  }
  return request<PaginatedResponse<Keyword>>({
    url: `${API_CONFIG.SEO_PREFIX}/keywords/search`,
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
  generateSitemap,
  generateSitemapXml,
  downloadSitemap,
  submitToSearchEngines,
  getSitemapSubmissionHistory,
  getSitemapStatus,

  // 外链
  getBacklinks,
  checkBacklink,
  batchCheckBacklinks,
  scanBacklinks,
  
  // TDK
  getTDKList,
  deleteTDK,
  createTDKTemplate,
  updateTDKTemplate,
  exportTDKReport,
  importTDKData,
  
  // Google Search Console
  getSearchConsoleData,
  getIndexTrend,
  getKeywordRankings,
  
  // 关键词
  searchKeywords,
  generateLongTailKeywords,
  
  // 定时任务
  getScheduledTasks,
  addScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  executeScheduledTask,
  
  // 告警规则
  getAlertRules,
  saveAlertRules,
  
  // Robots测试
  testRobotsRule,
};

export default seoApi;

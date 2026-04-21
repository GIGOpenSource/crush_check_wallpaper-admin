/**
 * SEO模块API服务层
 * 封装所有SEO相关API调用
 * 支持Mock/真实API无缝切换
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { message } from 'antd';
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
      if (data.code !== API_CODE.SUCCESS) {
        message.error(data.message || '请求失败');
        return Promise.reject(new Error(data.message));
      }
      return response;
    },
    (error) => {
      const { response } = error;
      if (response) {
        const { status } = response;
        switch (status) {
          case API_CODE.UNAUTHORIZED:
            message.error('登录已过期，请重新登录');
            // 可以在这里处理登出逻辑
            break;
          case API_CODE.FORBIDDEN:
            message.error('没有权限执行此操作');
            break;
          case API_CODE.NOT_FOUND:
            message.error('请求的资源不存在');
            break;
          default:
            message.error('服务器错误，请稍后重试');
        }
      } else {
        message.error('网络错误，请检查网络连接');
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

export const getPendingIssues = async (): Promise<ApiResponse<PendingIssue[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getPendingIssues() as Promise<ApiResponse<PendingIssue[]>>;
  }
  return request<PendingIssue[]>({
    url: `${API_CONFIG.SEO_PREFIX}/issues`,
    method: 'GET',
  });
};

export const getCoreMetrics = async (): Promise<ApiResponse<CoreMetric[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getCoreMetrics() as Promise<ApiResponse<CoreMetric[]>>;
  }
  return request<CoreMetric[]>({
    url: `${API_CONFIG.SEO_PREFIX}/metrics`,
    method: 'GET',
  });
};

export const getTechChecks = async (): Promise<ApiResponse<TechCheck[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getTechChecks() as Promise<ApiResponse<TechCheck[]>>;
  }
  return request<TechCheck[]>({
    url: `${API_CONFIG.SEO_PREFIX}/tech-checks`,
    method: 'GET',
  });
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
}

export interface SitemapConfig {
  types: string[];
  changefreq: string;
  priority: number;
  includeImages: boolean;
  compress: boolean;
}

export const getSitemaps = async (): Promise<ApiResponse<SitemapFile[]>> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.getSitemaps() as Promise<ApiResponse<SitemapFile[]>>;
  }
  return request<SitemapFile[]>({
    url: `${API_CONFIG.SEO_PREFIX}/sitemaps`,
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

export const downloadSitemap = async (sitemapId: number): Promise<Blob> => {
  if (API_CONFIG.USE_MOCK) {
    return seoMockApi.downloadSitemap(sitemapId);
  }
  const response = await axiosInstance.get(`${API_CONFIG.SEO_PREFIX}/sitemap/${sitemapId}/download`, {
    responseType: 'blob',
  });
  return response.data;
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
    url: `${API_CONFIG.SEO_PREFIX}/sitemap/submit`,
    method: 'POST',
    data: { sitemapIds },
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
  generateSitemap,
  downloadSitemap,
  submitToSearchEngines,
  
  // 外链
  getBacklinks,
  checkBacklink,
  batchCheckBacklinks,
  scanBacklinks,
  
  // TDK
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

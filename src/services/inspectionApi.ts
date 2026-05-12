/**
 * 日常巡查API服务
 * 独立于SEO模块，专门处理日常巡查相关接口
 */
import http from './request';

/**
 * 巡查项类型定义（匹配后端实际返回字段）
 */
export interface InspectionItem {
  id: number;
  site_url: string;                    // 站点URL
  category: string;                    // 巡查类别: search_crawl/page_quality/security/performance
  category_display: string;            // 巡查类别显示名称
  inspection_item: string;             // 检查项标识
  inspection_item_display: string;     // 检查项显示名称
  status: 'normal' | 'warning' | 'error';  // 状态标识
  status_display: string;              // 状态显示名称
  current_value: string;               // 当前值
  threshold: string;                   // 阈值
  suggestion: string;                  // 处理建议
  inspected_at: string;                // 检查时间
  created_at?: string;                 // 创建时间
  updated_at?: string;                 // 更新时间
  start_date?: string | null;          // 开始日期
  end_date?: string | null;            // 结束日期
  problem_urls?: string | null;        // 问题URL列表
}

/**
 * 获取日常巡查列表请求参数
 */
export interface GetInspectionListParams {
  currentPage?: number;                // 当前页码
  pageSize?: number;                   // 每页数量
  category?: 'search_crawl' | 'page_quality' | 'security' | 'performance';  // 巡查类别筛选
  site_url?: string;                   // 站点URL
  start_timestamp?: number;            // 开始时间戳（秒级）
  end_timestamp?: number;              // 结束时间戳（秒级）
}

/**
 * 分页响应数据类型
 */
export interface InspectionListResponse {
  results: InspectionItem[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages?: number;
  };
}

/**
 * 统计概览数据接口
 */
export interface InspectionDashboard {
  site_url: string;                // 站点URL
  summary: {                       // 汇总统计数据
    total_normal: number;          // 正常项总数
    total_warning: number;         // 警告项总数
    total_error: number;           // 异常项总数
    total_items: number;           // 总检查项数
    check_time: string;            // 检查时间
  };
  categories: any[];               // 各分类详细数据
}

/**
 * 获取日常巡查统计数据参数
 */
export interface GetInspectionDashboardParams {
  url: string;                    // 站点URL
  start_timestamp?: number;       // 开始时间戳（秒级）
  end_timestamp?: number;         // 结束时间戳（秒级）
}

/**
 * 获取日常巡查统计数据
 * @param params 查询参数
 * @returns 巡查仪表盘统计数据
 */
const getInspectionDashboard = (params: GetInspectionDashboardParams) => {
  return http.get<InspectionDashboard>(
    '/seo/inspection/inspection/inspection_dashboard/',
    {
      site_url: params.url,
      start_timestamp: params.start_timestamp,
      end_timestamp: params.end_timestamp,
    }
  );
};

/**
 * 告警规则类型定义
 */
export interface AlertRule {
  id: number;
  type: 'health_score' | '404_errors' | 'index_drop' | 'ranking_drop';
  name: string;
  threshold: number;
  enabled: boolean;
  notify: ('email' | 'sms' | 'webhook')[];
}

/**
 * 获取日常巡查列表
 * @param params 查询参数
 * @returns 巡查列表数据（带分页）
 */
const getInspectionList = (params?: GetInspectionListParams) => {
  return http.get<InspectionListResponse>('/seo/inspection/inspection/', {
    currentPage: params?.currentPage,
    pageSize: params?.pageSize,
    category: params?.category,
    site_url: params?.site_url,
    start_timestamp: params?.start_timestamp,
    end_timestamp: params?.end_timestamp,
  });
};

/**
 * 获取告警规则列表
 * @returns 告警规则列表
 */
const getAlertRules = () => {
  return http.get<AlertRule[]>('/seo/inspection/alert-rules/');
};

/**
 * 保存告警规则
 * @param rules 告警规则数组
 * @returns 保存结果
 */
const saveAlertRules = (rules: AlertRule[]) => {
  return http.post<{ saved: boolean; count: number }>('/seo/inspection/alert-rules/', { rules });
};

/**
 * 运行巡查
 * @param params 巡查参数
 * @returns 巡查结果
 */
const runInspection = (params: {
  site_url: string;
  category: 'search_crawl' | 'page_quality' | 'security' | 'performance';
  start_timestamp?: number;
  end_timestamp?: number;
}) => {
  return http.post('/seo/inspection/inspection/run_inspection/', params);
};

/**
 * 巡查日志类型定义
 */
export interface InspectionLog {
  id: number;
  site_url: string;                    // 站点URL
  category: string;                    // 巡查类别
  category_display: string;            // 巡查类别显示名称
  status: 'success' | 'failed' | 'running';  // 执行状态
  status_display: string;              // 状态显示名称
  start_time: string;                  // 开始时间
  end_time?: string;                   // 结束时间
  duration?: number;                   // 耗时（秒）
  total_items?: number;                // 检查项总数
  normal_count?: number;               // 正常项数量
  warning_count?: number;              // 警告项数量
  error_count?: number;                // 异常项数量
  operator?: string;                   // 操作人
  remark?: string;                     // 备注
  created_at: string;                  // 创建时间
}

/**
 * 获取巡查日志请求参数
 */
export interface GetInspectionLogParams {
  currentPage?: number;                // 当前页码
  pageSize?: number;                   // 每页数量
  site_url?: string;                   // 站点URL
  category?: string;                   // 巡查类别
  status?: string;                     // 执行状态
  start_timestamp?: number;            // 开始时间戳（秒级）
  end_timestamp?: number;              // 结束时间戳（秒级）
  operator?: string;                   // 操作人
}

/**
 * 巡查日志分页响应数据类型
 */
export interface InspectionLogListResponse {
  results: InspectionLog[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages?: number;
  };
}

/**
 * 获取巡查日志列表
 * @param params 查询参数
 * @returns 巡查日志列表
 */
const getInspectionLogs = (params?: GetInspectionLogParams) => {
  return http.get<InspectionLogListResponse>('/seo/inspection/inspection/inspection_logs/', {
    currentPage: params?.currentPage,
    pageSize: params?.pageSize,
    site_url: params?.site_url,
    category: params?.category,
    status: params?.status,
    start_timestamp: params?.start_timestamp,
    end_timestamp: params?.end_timestamp,
    operator: params?.operator,
  });
};

/**
 * 历史记录对比请求参数
 */
export interface CompareReportParams {
  category: string;                    // 巡查类别
  site_url: string;                    // 站点URL
  timestamp_a: number;                 // 时间戳A（秒级）
  timestamp_b: number;                 // 时间戳B（秒级）
}

/**
 * 历史记录对比响应数据类型
 */
export interface CompareReportItem {
  inspection_item: string;             // 检查项标识
  inspection_item_display: string;     // 检查项显示名称
  difference: number;                  // 差异值
  status_a: string;                    // 日期A的状态
  status_b: string;                    // 日期B的状态
  time_a: string;                      // 日期A的时间
  time_b: string;                      // 日期B的时间
  trend: string;                       // 趋势：stable/improved/worsened
  value_a: string;                     // 日期A的值
  value_b: string;                     // 日期B的值
}

export interface CompareReportResponse {
  results: CompareReportItem[];
}

/**
 * 获取历史记录对比数据
 * @param params 对比参数
 * @returns 对比结果
 */
const compareReport = (params: CompareReportParams) => {
  return http.get<CompareReportResponse>('/seo/inspection/inspection/compare_report/', {
    category: params.category,
    site_url: params.site_url,
    timestamp_a: params.timestamp_a,
    timestamp_b: params.timestamp_b,
  });
};

/**
 * 导出巡查报告
 * @param params 导出参数
 * @returns Blob 文件流
 */
const exportReport = (params: { category: string; site_url: string }) => {
  return http.get<Blob>(
    '/seo/inspection/inspection/export_report/',
    {
      category: params.category,
      site_url: params.site_url,
    },
    { responseType: 'blob' }
  );
};

// 导出API对象
export const inspectionApi = {
  getInspectionList,
  getInspectionDashboard,
  getAlertRules,
  saveAlertRules,
  runInspection,
  getInspectionLogs,
  compareReport,
  exportReport,
};

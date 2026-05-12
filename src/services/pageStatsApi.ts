import http from './request';

// Dashboard 统计数据类型（根据实际接口返回调整）
export interface PageStatsDashboard {
  desktop_visits: number;
  android_visits: number;
  ios_visits: number;
  tablet_visits: number;
  total_pages: number;
  total_visits: number;
  avg_bounce_rate: number;
  avg_seo_score: number;
}

// 页面详细数据类型
export interface PageDetail {
  id: number;
  page_name: string;
  page_path: string;
  page_type: 'desktop' | 'mobile' | 'responsive' | 'hybrid';
  device_type?: 'pc' | 'mobile' | 'ipad';  // 添加设备类型字段
  visit_count: number;
  avg_stay_time: number;
  bounce_rate: number;
  seo_score: number;
  last_updated: string;
  status: 'active' | 'inactive';
  status_display: string;  // 添加状态显示字段
}

// 页面列表响应类型
export interface PageListResponse {
  results: PageDetail[];
  pagination: {
    total: number;
    current_page: number;
    page_size: number;
    total_pages: number;
  };
}

/**
 * 获取页面统计Dashboard数据
 */
export function getPageStatsDashboard() {
  return http.get<PageStatsDashboard>('/page_stats/dashboard/');
}

/**
 * 获取页面详细列表
 * @param params - 查询参数
 */
export function getPageDetails(params?: {
  currentPage?: number;
  pageSize?: number;
  pageType?: string;
  status?: string;
}) {
  return http.get<PageListResponse>('/page_stats/', {
    currentPage: params?.currentPage || 1,
    pageSize: params?.pageSize || 10,
    page_type: params?.pageType,
    status: params?.status,
  });
}

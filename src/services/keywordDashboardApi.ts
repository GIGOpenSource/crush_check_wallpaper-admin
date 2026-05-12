/**
 * 关键词挖掘数据统计 API服务
 */
import http from './request';

/**
 * 关键词数据统计响应类型
 */
export interface KeywordDashboardStatistics {
  total_count: number;        // 总关键词数
  long_tail_count: number;    // 长尾词数量
  today_new: number;          // 今日新增数量
  yesterday_new: number;      // 昨日新增数量
  new_change: number;         // 新增变化量
  new_trend: 'up' | 'down';   // 新增趋势（up:上升，down:下降）
  optimized_count: number;    // 已优化数量
}

/**
 * 获取关键词数据统计
 */
export function getKeywordDashboardStatistics(): Promise<KeywordDashboardStatistics> {
  return http.get<KeywordDashboardStatistics>('/seo/keyword/keyword_dashboard/');
}

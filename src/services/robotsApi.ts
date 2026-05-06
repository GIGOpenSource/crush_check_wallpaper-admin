/**
 * Robots API服务
 */
import http from './request';

/**
 * Robots配置响应类型
 */
export interface RobotsConfig {
  content: string;
  updated_at?: string;
}

/**
 * Robots统计数据响应类型
 */
export interface RobotsStatistics {
  total_rules: number;
  allow_count: number;
  disallow_count: number;
  last_updated: string;
}

/**
 * 获取Robots.txt内容
 */
export function getRobotsContent() {
  return http.get<RobotsConfig>('/site/robots-txt/');
}

/**
 * 更新Robots.txt内容
 * @param content Robots.txt内容
 */
export function updateRobotsContent(content: string) {
  return http.post<RobotsConfig>('/site/update-robots-txt/', {
    content,
  });
}

/**
 * 获取Robots统计数据
 */
export function getRobotsStatistics() {
  return http.get<RobotsStatistics>('/site/robots-statistics/');
}
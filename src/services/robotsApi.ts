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

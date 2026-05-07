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
 * Robots规则项类型
 */
export interface RobotsRuleItem {
  id: number;
  user_agent: string;
  allow: string[];
  disallow: string[];
  crawl_delay?: number | null;
  sitemap?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * 添加Robots规则请求参数类型
 */
export interface AddRobotsRuleParams {
  user_agent: string;
  allow_paths: string[];
  disallow_paths: string[];
  crawl_delay?: number;
}

/**
 * 测试Robots规则请求参数类型
 */
export interface TestRobotsRuleParams {
  user_agent: string;
  url_path: string;
}

/**
 * 测试Robots规则响应类型
 */
export interface TestRobotsRuleResult {
  user_agent: string;
  result: string;
  rule: string;
  explanation: string;
}

/**
 * 将后端返回的规则转换为前端格式
 */
export const convertBackendRuleToFrontend = (backendRule: RobotsRuleItem) => ({
  id: backendRule.id,
  userAgent: backendRule.user_agent,
  allow: backendRule.allow || [],
  disallow: backendRule.disallow || [],
  crawlDelay: backendRule.crawl_delay || undefined,
  sitemap: backendRule.sitemap || undefined,
});

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

/**
 * 获取Robots规则列表
 */
export function getRobotsRules() {
  return http.get<RobotsRuleItem[]>('/site/robots-rules/');
}

/**
 * 删除Robots规则
 * @param id 规则ID
 */
export function deleteRobotsRule(id: number) {
  return http.delete('/site/delete-robots-rule/', {
    rule_id: id,
  });
}

/**
 * 添加Robots规则
 * @param params 规则参数
 */
export function addRobotsRule(params: AddRobotsRuleParams) {
  return http.post('/site/add-robots-rule/', params);
}

/**
 * 测试Robots规则
 * @param params 测试参数
 */
export function testRobotsRule(params: TestRobotsRuleParams) {
  return http.post<TestRobotsRuleResult>('/site/test-robots-rule/', params);
}

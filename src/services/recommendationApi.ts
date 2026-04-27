/**
 * 推荐管理相关API接口
 */

import http from './request';

// 推荐策略数据类型
export interface RecommendationStrategy {
  id?: number;
  name: string;
  strategy_type: 'home' | 'hot' | 'banner';  // 策略类型：home-首页推荐，hot-热门推荐，banner-精选轮播图
  apply_area: string;  // 应用区域：global-全球, cn-中国大陆, overseas-海外, us-美国, jp-日本, kr-韩国
  priority: number;
  content_limit?: number;  // 内容数量限制
  wallpaper_ids?: number[];  // 壁纸ID列表
  start_time?: string;
  end_time?: string;
  status: 'draft' | 'active' | 'inactive';  // 状态：draft-草稿，active-激活，inactive-未激活
  contents?: StrategyContentItem[];
  content_count?: number;
  total_view_count?: number;
  total_click_count?: number;
  avg_ctr?: number;
  created_at?: string;
  updated_at?: string;
  operator?: string;
  remark?: string;
}

// 标签信息
export interface TagInfo {
  id: number;
  name: string;
}

// 壁纸信息
export interface WallpaperInfo {
  name: string;           // 壁纸名称
  thumb_url: string;      // 壁纸缩略图
  tags?: TagInfo[];       // 壁纸标签（对象数组）
}

// 策略中的内容项
export interface StrategyContentItem {
  id?: number;                    // 策略内容项ID（state_contents的ID）
  content_id: number;
  content_type: 'wallpaper' | 'category' | 'tag' | 'collection';
  content_title: string;
  content_image: string;
  sort_order: number;
  wallpaper?: number;             // 壁纸ID
  wallpaper_info?: WallpaperInfo; // 壁纸详细信息
  strategy?: number;              // 策略ID
}

// 内容库中的内容项
export interface ContentItem {
  id: number;
  title: string;
  image: string;
  type: 'wallpaper' | 'category' | 'tag' | 'collection';
  type_name: string;
  views: number;
  downloads: number;
  created_at: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  results: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取推荐策略列表
 * @param currentPage 当前页码
 * @param pageSize 每页条数
 * @param strategy_type 策略类型：'home' 或 'hot' 或 'banner'
 */
export function getStrategyList(
  currentPage: number,
  pageSize: number,
  strategy_type: 'home' | 'hot' | 'banner'
) {
  return http.get<PaginatedResponse<RecommendationStrategy>>('/strategy/strategies/', {
    currentPage,
    pageSize,
    strategy_type,
  });
}

/**
 * 获取推荐策略统计数据
 * @param strategy_type 策略类型：'home' 或 'hot' 或 'banner'
 */
export interface StrategyStatistics {
  total_count: number;          // 策略总数
  active_count: number;         // 生效中
  expired_count: number;        // 已过期
  total_content_count: number;  // 内容总数
}

export function getStrategyStatistics(strategy_type: 'home' | 'hot' | 'banner') {
  return http.get<StrategyStatistics>('/strategy/strategies/statistics/', {
    strategy_type,
  });
}

/**
 * 创建推荐策略
 * @param data 策略数据
 */
export function createStrategy(data: Partial<RecommendationStrategy>) {
  return http.post<RecommendationStrategy>('/strategy/strategies/', data);
}

/**
 * 更新推荐策略
 * @param id 策略ID
 * @param data 策略数据
 */
export function updateStrategy(id: number, data: Partial<RecommendationStrategy>) {
  return http.put<RecommendationStrategy>(`/strategy/strategies/${id}/`, data);
}

/**
 * 删除推荐策略
 * @param id 策略ID
 */
export function deleteStrategy(id: number) {
  return http.delete(`/strategy/strategies/${id}/`);
}

/**
 * 获取内容库列表（壁纸列表）
 * @param currentPage 当前页码
 * @param pageSize 每页条数
 * @param name 搜索关键词
 */
export function getContentLibrary(
  currentPage: number = 1,
  pageSize: number = 20,
  name?: string
) {
  return http.get<any>('/wallpapers/wallpaper/', {
    currentPage,
    pageSize,
    name,
  });
}

/**
 * 获取策略的内容列表
 * @param currentPage 当前页码
 * @param pageSize 每页条数
 * @param strategy_id 策略ID
 */
export function getStrategyContents(
  currentPage: number,
  pageSize: number,
  strategy_id: number
) {
  return http.get<PaginatedResponse<StrategyContentItem>>('/strategy/state_contents/', {
    currentPage,
    pageSize,
    strategy_id,
  });
}

/**
 * 向策略添加壁纸内容
 * @param strategyId 策略ID
 * @param wallpaperIds 壁纸ID列表
 */
export function addContentToStrategy(strategyId: number, wallpaperIds: number[]) {
  return http.post('/strategy/state_contents/', {
    strategy_id: strategyId,
    wallpaper_ids: wallpaperIds,
  });
}

/**
 * 从策略移除内容
 * @param id 策略内容项ID（state_contents 的 ID）
 */
export function removeContentFromStrategy(id: number) {
  return http.delete(`/strategy/state_contents/${id}/`);
}

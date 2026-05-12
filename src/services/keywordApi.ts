/**
 * 关键词挖掘 API服务
 */
import http from './request';
import type { PaginatedResponse } from '../config/api.config';

/**
 * 关键词项类型
 */
export interface KeywordItem {
  id: number;
  keyword: string;                      // 关键词
   category?: string;                    // 分类（可选）
  search_volume: number;                // 搜索量
  difficulty: number;                   // 难度
  cpc: number;                          // CPC费用
  competition: string;                  // 竞争度
  trend: string;                        // 趋势
  keyword_type: 'hot' | 'long_tail' | 'normal';  // 关键词类型
  is_favorite: boolean;                 // 是否收藏
  created_at: string;                   // 创建时间
  updated_at: string;                   // 更新时间
}

/**
 * 获取关键词列表请求参数
 */
export interface GetKeywordsParams {
  currentPage: number;                  // 当前页码（必填）
  pageSize: number;                     // 每页数量（必填）
  category?: string;                    // 分类筛选（可选）
  keyword_type?: 'hot' | 'long_tail' | 'normal';  // 关键词类型（hot:热门/long_tail:长尾词/normal:词库）
  is_favorite?: boolean;                // 是否收藏（false时配合keyword_type使用，true时不使用keyword_type）
}

/**
 * 获取关键词列表
 * @param params 查询参数
 */
export function getKeywords(params: GetKeywordsParams): Promise<PaginatedResponse<KeywordItem>> {
  return http.get<PaginatedResponse<KeywordItem>>('/seo/keyword/', {
    currentPage: params.currentPage,
    pageSize: params.pageSize,
    category: params.category,
    keyword_type: params.keyword_type,
    is_favorite: params.is_favorite,
  });
}

/**
 * 获取收藏关键词列表
 * @param currentPage 当前页码
 * @param pageSize 每页数量
 */
export function getFavoriteKeywords(currentPage: number, pageSize: number): Promise<PaginatedResponse<KeywordItem>> {
  return http.get<PaginatedResponse<KeywordItem>>('/seo/keyword/', {
    currentPage,
    pageSize,
    is_favorite: true,
  });
}

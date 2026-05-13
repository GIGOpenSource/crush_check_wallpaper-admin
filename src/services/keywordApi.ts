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
  keyword_type: 'hot' | 'long_tail' | 'normal';  // 关键词类型
  keyword_type_display: string;         // 关键词类型显示文本（如"热门关键词"）
  category?: string;                    // 分类（可选）
  category_display?: string;            // 分类显示文本（如"风格"）
  competition: number;                  // 竞争度（0-1）
  cpc: string;                          // CPC费用（字符串格式，如"0.45"）
  created_at: string;                   // 创建时间
  is_favorite?: boolean;                // 是否收藏（仅收藏相关接口返回，AI挖掘接口不返回）
  monthly_search_volume: number;        // 月搜索量
  optimization_difficulty: number;      // 优化难度（0-100）
  parent_keyword: string | null;        // 父关键词
  recommendation_score: number;         // 推荐分数
  trend: 'rising' | 'falling' | 'stable';  // 趋势（rising:上升/falling:下降/stable:稳定）
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

/**
 * 创建关键词请求参数
 */
export interface CreateKeywordParams {
  keyword: string;                      // 关键词（必填）
  keyword_type: 'hot' | 'long_tail' | 'normal';  // 关键词类型（必填）
  is_favorite?: boolean;                // 是否收藏（可选，默认false）
  category?: string;                    // 分类（可选）
}

/**
 * 创建关键词
 * @param params 创建参数
 */
export function createKeyword(params: CreateKeywordParams): Promise<KeywordItem> {
  return http.post<KeywordItem>('/seo/keyword/', {
    keyword: params.keyword,
    keyword_type: params.keyword_type,
    is_favorite: params.is_favorite || false,
    category: params.category,
  });
}

/**
 * AI扩展长尾词请求参数
 */
export interface AIExpandLongTailParams {
  parent_keyword: string;               // 父关键词（必填）
  pos?: string;                         // 词性：noun(名词)/adjective(形容词)/verb(动词)，默认noun
  modifiers?: string;                   // 修饰词，逗号分隔（如：4k,高清,免费,下载）
}

/**
 * AI扩展长尾词返回的关键词数据
 */
export interface ExpandLongTailKeyword {
  id?: number;                          // 关键词ID
  long_tail_keyword: string;            // 长尾关键词
  parent_keyword: string;               // 父关键词
  monthly_search_volume: number;        // 月搜索量
  optimization_difficulty: number;      // 优化难度
}

/**
 * AI扩展长尾词响应数据
 */
export interface AIExpandLongTailResponse {
  parent_keyword: string;               // 父关键词
  pos: string;                          // 词性
  modifiers: string;                    // 修饰词
  keywords: ExpandLongTailKeyword[];    // 关键词列表
  total: number;                        // 总数
  saved_to_library: number;             // 已保存到词库的数量
  message: string;                      // 提示信息
}

/**
 * AI扩展长尾词
 * @param params 请求参数
 */
export function aiExpandLongTail(params: AIExpandLongTailParams): Promise<AIExpandLongTailResponse> {
  return http.get<AIExpandLongTailResponse>('/seo/keyword/ai_expand_long_tail/', {
    parent_keyword: params.parent_keyword,
    pos: params.pos || 'noun',
    modifiers: params.modifiers,
  });
}

/**
 * 批量收藏关键词请求参数
 */
export interface BatchFavoriteKeywordsParams {
  ids: number[];                        // 关键词ID数组
  is_favorite: boolean;                 // 是否收藏（true: 收藏, false: 取消收藏）
}

/**
 * 批量收藏/取消收藏关键词
 * @param params 请求参数
 */
export function batchFavoriteKeywords(params: BatchFavoriteKeywordsParams): Promise<void> {
  return http.post<void>('/seo/keyword/batch_favorite_keywords/', {
    ids: params.ids,
    is_favorite: params.is_favorite,
  });
}

/**
 * AI挖掘热门关键词请求参数
 */
export interface AIMineHotKeywordsParams {
  seed_keyword: string;                 // 种子关键词（必填）
}

/**
 * AI挖掘热门关键词
 * @param params 请求参数
 */
export function aiMineHotKeywords(params: AIMineHotKeywordsParams): Promise<KeywordItem[]> {
  return http.get<KeywordItem[]>('/seo/keyword/ai_mine_hot_keywords/', {
    seed_keyword: params.seed_keyword,
  });
}

/**
 * 导入关键词请求参数
 */
export interface ImportKeywordsParams {
  file: File;                           // 文件（必填）
  keyword_type: 'hot' | 'long_tail' | 'normal';  // 关键词类型（必填）
}

/**
 * 导入关键词响应数据
 */
export interface ImportKeywordsResponse {
  imported: number;                     // 导入成功数量
  failed: number;                       // 导入失败数量
  message: string;                      // 提示信息
}

/**
 * 导入关键词
 * @param params 请求参数
 */
export function importKeywords(params: ImportKeywordsParams): Promise<ImportKeywordsResponse> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('keyword_type', params.keyword_type);
  
  return http.post<ImportKeywordsResponse>('/seo/keyword/import_keywords/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 更新关键词请求参数
 */
export interface UpdateKeywordParams {
  keyword?: string;                     // 关键词（可选）
  keyword_type?: 'hot' | 'long_tail' | 'normal';  // 关键词类型（可选）
  is_favorite?: boolean;                // 是否收藏（可选）
  category?: string;                    // 分类（可选）
}

/**
 * 更新关键词
 * @param id 关键词ID
 * @param params 更新参数
 */
export function updateKeyword(id: number, params: UpdateKeywordParams): Promise<KeywordItem> {
  return http.put<KeywordItem>(`/seo/keyword/${id}/`, params);
}

/**
 * 删除关键词
 * @param id 关键词ID
 */
export function deleteKeyword(id: number): Promise<void> {
  return http.delete<void>(`/seo/keyword/${id}/`);
}

/**
 * 标签相关API接口
 */

import http from './request';

// 标签信息
export interface Tag {
  id: number;
  name: string;
  wallpaper_count: number;
  created_at: string;
}

// 创建/更新标签请求参数
export interface CreateOrUpdateTagParams {
  name: string;
}

// 获取标签列表请求参数
export interface GetTagListParams {
  currentPage?: number;
  pageSize?: number;
  name?: string;
}

// 获取标签列表响应
export interface GetTagListResponse {
  results: Tag[];
  pagination: {
    currentPage: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取标签列表
 * @param params 查询参数
 */
export function getTagList(params?: GetTagListParams) {
  return http.get<GetTagListResponse>('/wallpapers/tags/', params);
}

/**
 * 创建标签
 * @param data 标签数据
 */
export function createTag(data: CreateOrUpdateTagParams) {
  return http.post<Tag>('/wallpapers/tags/', data);
}

/**
 * 获取标签详情
 * @param id 标签ID
 */
export function getTagDetail(id: number) {
  return http.get<Tag>(`/wallpapers/tags/${id}/`);
}

/**
 * 更新标签
 * @param id 标签ID
 * @param data 标签数据
 */
export function updateTag(id: number, data: CreateOrUpdateTagParams) {
  return http.put<Tag>(`/wallpapers/tags/${id}/`, data);
}

/**
 * 删除标签
 * @param id 标签ID
 */
export function deleteTag(id: number) {
  return http.delete(`/wallpapers/tags/${id}/`);
}

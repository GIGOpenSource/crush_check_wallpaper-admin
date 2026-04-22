/**
 * 壁纸相关API接口
 */

import http, { service } from './request';

// 壁纸信息
export interface Wallpaper {
  id: number;
  name: string;
  thumb_url: string;
  url: string;
  category: string[] | Array<{ id: number; name: string }>;
  tags: string[] | Array<{ id: number; name: string }> | number[];
  width: number;
  height: number;
  image_format: string;
  description: string;
  view_count?: number;
  download_count?: number;
  hot_score?: number;
  tag_ids?: number[]; // 标签ID数组（用于编辑回显）
  uploader: {
    id: number;
    nickname: string;
    avatar_url: string;
  };
  audit_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// 获取壁纸列表请求参数
export interface GetWallpaperListParams {
  currentPage?: number;
  pageSize?: number;
  name?: string;
  audit_status?: 'pending' | 'approved' | 'rejected';
}

// 获取壁纸列表响应
export interface GetWallpaperListResponse {
  results: Wallpaper[];
  pagination: {
    currentPage: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// 审核壁纸请求参数
export interface AuditWallpaperParams {
  audit_status: 'approved' | 'rejected';
  remark?: string;
}

/**
 * 获取壁纸列表（用于审核）
 * @param params 查询参数
 */
export function getWallpaperAuditList(params?: GetWallpaperListParams) {
  return http.get<GetWallpaperListResponse>('/wallpapers/wallpaper/', {
    ...params,
    audit_status: 'pending',  // 默认只查询待审核的
  });
}

/**
 * 获取壁纸列表（通用）
 * @param params 查询参数
 */
export function getWallpaperList(params?: GetWallpaperListParams) {
  return http.get<GetWallpaperListResponse>('/wallpapers/wallpaper/', params);
}

/**
 * 审核壁纸
 * @param id 壁纸ID
 * @param params 审核参数
 */
export function auditWallpaper(id: number, params: AuditWallpaperParams) {
  return http.put(`/wallpapers/wallpaper/${id}/audit/`, params);
}

/**
 * 批量审核壁纸
 * @param params 批量审核参数
 */
export function batchAuditWallpaper(params: {
  wallpaper_ids: number[];
  remark: string;
  action: 'approve' | 'reject';
}) {
  const url = params.action === 'approve' 
    ? '/wallpapers/wallpaper/audit/batch-approve/'
    : '/wallpapers/wallpaper/audit/batch-reject/';
  
  return http.post(url, {
    wallpaper_ids: params.wallpaper_ids,
    remark: params.remark,
  });
}

/**
 * 获取壁纸详情
 * @param id 壁纸ID
 */
export function getWallpaperDetail(id: number) {
  return http.get<Wallpaper>(`/wallpapers/wallpaper/${id}/`);
}

/**
 * 批量删除壁纸
 * @param params 批量删除参数
 */
export function batchDeleteWallpaper(params: {
  wallpaper_ids: number[];
}) {
  return http.post('/wallpapers/wallpaper/batch-delete/', params);
}

/**
 * 更新壁纸信息
 * @param id 壁纸ID
 * @param data 壁纸数据
 */
export function updateWallpaper(id: number, data: {
  name?: string;
  description?: string;
  category_ids?: number[];
  tag_ids?: number[];
  thumb_url?: string;
  url?: string;
  width?: number;
  height?: number;
  image_format?: string;
  view_count?: number;
  download_count?: number;
  hot_score?: number;
}) {
  return http.put(`/wallpapers/wallpaper/${id}/`, data);
}

/**
 * 上传图片
 * @param file 图片文件
 */
export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<{ url: string }>('/client/upload-image/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 创建壁纸
 * @param data 壁纸数据
 */
export function createWallpaper(data: {
  name: string;
  description?: string;
  category_ids: number[];
  tag_ids?: number[];
  thumb_url: string;
  url?: string;
  width?: number;
  height?: number;
  image_format?: string;
  view_count?: number;
  download_count?: number;
  hot_score?: number;
}) {
  return http.post('/wallpapers/wallpaper/', data);
}

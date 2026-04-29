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
 * 更新壁纸（带图片上传）
 * @param id 壁纸ID
 * @param data 壁纸数据（包含二进制图片文件和is_change标志）
 */
export function updateWallpaperWithImage(id: number, data: {
  name?: string;
  description?: string;
  category_ids?: number[];
  tag_ids?: number[];
  file?: File; // 二进制图片文件
  is_change?: boolean; // 是否修改图片
  view_count?: number;
  download_count?: number;
  hot_score?: number;
}) {
  const formData = new FormData();
  
  // 添加文本字段
  if (data.name) {
    formData.append('name', data.name);
  }
  if (data.description) {
    formData.append('description', data.description);
  }
  
  // 添加分类ID（数组转为JSON字符串）
  if (data.category_ids && data.category_ids.length > 0) {
    formData.append('category_ids', JSON.stringify(data.category_ids));
  }
  
  // 添加标签ID（数组转为JSON字符串）
  if (data.tag_ids && data.tag_ids.length > 0) {
    formData.append('tag_ids', JSON.stringify(data.tag_ids));
  }
  
  // 添加图片修改标志
  if (data.is_change !== undefined) {
    formData.append('is_change', String(data.is_change));
  }
  
  // 如果修改了图片，添加图片文件（二进制）
  if (data.is_change && data.file) {
    formData.append('file', data.file);
  }
  
  // 添加可选字段
  if (data.view_count !== undefined) {
    formData.append('view_count', String(data.view_count));
  }
  if (data.download_count !== undefined) {
    formData.append('download_count', String(data.download_count));
  }
  if (data.hot_score !== undefined) {
    formData.append('hot_score', String(data.hot_score));
  }
  
  return http.put(`/wallpapers/wallpaper/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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

/**
 * 创建壁纸（带图片上传）
 * @param data 壁纸数据（包含二进制图片文件）
 */
export function createWallpaperWithImage(data: {
  name: string;
  description?: string;
  category_ids: number[];
  tag_ids?: number[];
  file: File; // 二进制图片文件
  view_count?: number;
  download_count?: number;
  hot_score?: number;
}) {
  const formData = new FormData();
  
  // 添加文本字段
  formData.append('name', data.name);
  if (data.description) {
    formData.append('description', data.description);
  }
  
  // 添加分类ID（数组转为JSON字符串）
  formData.append('category_ids', JSON.stringify(data.category_ids));
  
  // 添加标签ID（数组转为JSON字符串）
  if (data.tag_ids && data.tag_ids.length > 0) {
    formData.append('tag_ids', JSON.stringify(data.tag_ids));
  }
  
  // 添加图片文件（二进制）
  formData.append('file', data.file);
  
  // 添加可选字段
  if (data.view_count !== undefined) {
    formData.append('view_count', String(data.view_count));
  }
  if (data.download_count !== undefined) {
    formData.append('download_count', String(data.download_count));
  }
  if (data.hot_score !== undefined) {
    formData.append('hot_score', String(data.hot_score));
  }
  
  return http.post('/wallpapers/wallpaper/upload-admin/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 获取用户上传的壁纸列表
 * @param customerId 用户ID
 * @param params 查询参数
 */
export function getUserUploads(customerId: number, params?: {
  currentPage?: number;
  pageSize?: number;
}) {
  return http.get<GetWallpaperListResponse>(`/wallpapers/wallpaper/my-uploads/`, {
    customer_id: customerId,
    ...params,
  });
}

/**
 * 获取用户收藏的壁纸列表
 * @param customerId 用户ID
 * @param params 查询参数
 */
export function getUserCollections(customerId: number, params?: {
  currentPage?: number;
  pageSize?: number;
}) {
  return http.get<GetWallpaperListResponse>(`/wallpapers/wallpaper/my-collections/`, {
    customer_id: customerId,
    ...params,
  });
}

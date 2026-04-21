/**
 * 评论相关API接口
 */

import http from './request';

// 评论信息
export interface Comment {
  id: number;
  customer_info: {
    id: number;
    nickname: string;
    avatar_url: string;
  };
  content: string;
  like_count: number;
  created_at: string;
  wallpaper?: {
    id: number;
    name: string;
    thumbnail_url: string;
  };
}

// 获取评论列表请求参数
export interface GetCommentListParams {
  currentPage?: number;
  pageSize?: number;
  content?: string;
  user_nickname?: string;
}

// 获取评论列表响应
export interface GetCommentListResponse {
  results: Comment[];
  pagination: {
    currentPage: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取评论列表
 * @param params 查询参数
 */
export function getCommentList(params?: GetCommentListParams) {
  return http.get<GetCommentListResponse>('/wallpapers/comments/', params);
}

/**
 * 删除评论
 * @param id 评论ID
 */
export function deleteComment(id: number) {
  return http.delete(`/wallpapers/comments/${id}/`);
}

/**
 * 批量删除评论
 * @param ids 评论ID数组
 */
export function batchDeleteComments(ids: number[]) {
  return http.post('/wallpapers/comments/batch_delete/', { ids });
}

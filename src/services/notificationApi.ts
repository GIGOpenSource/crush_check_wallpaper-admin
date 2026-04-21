/**
 * 通知相关API接口
 */

import http from './request';

// 通知信息
export interface Notification {
  id: number;
  extra_data?: {
    title?: string;
    content?: string;
    [key: string]: unknown;
  };
  notification_type: 'system' | 'feature' | 'activity';
  send_to: 'all' | 'specific';
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}

// 获取通知列表响应
export interface GetNotificationListResponse {
  results: Notification[];
  pagination: {
    currentPage: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// 获取通知列表请求参数
export interface GetNotificationListParams {
  currentPage?: number;
  pageSize?: number;
  title?: string;
  notification_type?: 'system' | 'feature' | 'activity';
}

/**
 * 获取通知列表（通用）
 * @param params 查询参数
 */
export function getNotificationList(params?: Omit<GetNotificationListParams, 'type'>) {
   return http.get<GetNotificationListResponse>('/notifications/', {
    ...params,
    type: 'announcement',  // 固定传递announcement类型
  });
}

/**
 * 获取公告列表
 * @param params 查询参数
 */
export function getAnnouncementList(params?: Omit<GetNotificationListParams, 'notification_type'>) {
  return http.get<GetNotificationListResponse>('/notifications/', {
    ...params,
  });
}

/**
 * 删除通知
 * @param id 通知ID
 */
export function deleteNotification(id: number) {
  return http.delete(`/notifications/${id}/`);
}

// 发送通知请求参数
export interface SendNotificationParams {
  title: string;
  content: string;
  notification_type: 'system' | 'feature' | 'activity';
  send_to: 'all' | 'specific';
  user_ids?: number[]; // 当 send_to 为 specific 时需要
}

/**
 * 发送通知
 * @param params 发送参数
 */
export function sendNotification(params: SendNotificationParams) {
  return http.post('/notifications/send-announcement/', params);
}

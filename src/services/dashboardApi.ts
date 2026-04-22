import http from './request';
import { service } from './request';

// 统计数据接口返回类型
export interface DashboardStats {
  total_users: number;
  total_wallpapers: number;
  total_views: number;
  total_downloads: number;
  total_likes: number;
  total_collection: number;
  daily_active_users?: number;
  weekly_active_users?: number;
}

// 热门壁纸数据类型
export interface HotWallpaper {
  id: number;
  name: string;
  thumb_url: string;
  view_count: number;
  download_count: number;
  hot_score: number;
}

// 最新用户数据类型
export interface RecentUser {
  id: number;
  email: string;
  nickname: string;
  avatar?: string;
  created_at: string;
}

// 列表响应类型
export interface ListResponse<T> {
  results: T[];
  pagination: {
    total: number;
    current_page: number;
    page_size: number;
    total_pages: number;
  };
}

/**
 * 获取Dashboard统计数据
 */
export function getDashboardStats() {
  return http.get<DashboardStats>('/dashboard/stats/');
}

/**
 * 获取热门壁纸列表
 */
export function getHotWallpapers() {
  return http.get<ListResponse<HotWallpaper>>('/wallpapers/wallpaper/', {
    currentPage: 1,
    pageSize: 5,
    order: 'hot',
  });
}

/**
 * 获取最新注册用户列表
 */
export function getRecentUsers() {
  return http.get<ListResponse<RecentUser>>('/dashboard/customer_user/', {
    currentPage: 1,
    pageSize: 5,
  });
}

/**
 * 用户相关API接口
 */

import http from './request';

// 登录请求参数
export interface LoginParams {
  username: string;
  password: string;
}

// 登录响应数据
export interface LoginResponse {
  token: string;
  userInfo?: {
    id: number;
    username: string;
    nickname?: string;
    avatar?: string;
    role?: string;
    permissions?: string[];
  };
}

// 用户信息
export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 用户登录
 * @param params 登录参数
 */
export function login(params: LoginParams) {
  return http.post<LoginResponse>('/users/login/', params);
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  return http.get<UserInfo>('/users/me');
}

/**
 * 退出登录
 */
export function logout() {
  return http.post('/users/logout');
}

/**
 * 修改密码
 * @param data 包含旧密码和新密码
 */
export function changePassword(data: { oldPassword: string; newPassword: string }) {
  return http.post('/users/change-password', data);
}

// ==================== 客户用户管理 ====================

// 客户用户信息
export interface CustomerUser {
  id: number;
  avatar_url: string;          // 头像
  email: string;               // 邮箱
  nickname: string;            // 昵称
  gender: number;              // 性别
  level: number;               // 等级
  followers_count?: number;    // 粉丝数
  following_count?: number;    // 关注数
  collection_count: number;    // 收藏数
  upload_count: number;        // 上传数
  created_at: string;          // 注册时间
  updated_at: string;          // 最后登陆时间
  status: 1 | 2;               // 状态：1正常 2禁用
}

// 获取客户用户列表请求参数
export interface GetCustomerUserListParams {
  currentPage?: number;
  pageSize?: number;
  email?: string;
  nickname?: string;
  gender?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// 获取客户用户列表响应
export interface GetCustomerUserListResponse {
  results: CustomerUser[];
  pagination: {
    currentPage: number;        // 当前页码
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// 创建/更新客户用户请求参数
export interface CreateOrUpdateCustomerUserParams {
  email?: string;
  nickname?: string;
  gender?: number;
  avatar_url?: string;
  level?: number;
  status?: 1 | 2;  // 1正常 2禁用
}

/**
 * 获取客户用户列表
 * @param params 查询参数
 */
export function getCustomerUserList(params?: GetCustomerUserListParams) {
  return http.get<GetCustomerUserListResponse>('/dashboard/customer_user/', params);
}

/**
 * 获取客户用户详情
 * @param id 用户ID
 */
export function getCustomerUserDetail(id: number) {
  return http.get<CustomerUser>(`/dashboard/customer_user/${id}/`);
}

/**
 * 创建客户用户
 * @param data 用户数据
 */
export function createCustomerUser(data: CreateOrUpdateCustomerUserParams) {
  return http.post<CustomerUser>('/dashboard/customer_user/', data);
}

/**
 * 更新客户用户
 * @param id 用户ID
 * @param data 用户数据
 */
export function updateCustomerUser(id: number, data: CreateOrUpdateCustomerUserParams) {
  return http.put<CustomerUser>(`/dashboard/customer_user/${id}/`, data);
}

/**
 * 删除客户用户
 * @param id 用户ID
 */
export function deleteCustomerUser(id: number) {
  return http.delete(`/dashboard/customer_user/${id}/`);
}

/**
 * 批量禁用客户用户
 * @param ids 用户ID数组
 */
export function batchDisableCustomerUsers(ids: number[]) {
  return http.post('/client/users/batch-disable/', { user_ids: ids,status:1 });
}

/**
 * 批量删除客户用户
 * @param ids 用户ID数组
 */
export function batchDeleteCustomerUsers(ids: number[]) {
  return http.post('/client/users/batch-delete/', { user_ids: ids });
}

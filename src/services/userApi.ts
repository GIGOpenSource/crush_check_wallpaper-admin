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

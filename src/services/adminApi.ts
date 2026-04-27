
/**
 * 管理员管理API服务
 */
import http from './request';

/**
 * 管理员数据类型定义
 */
export interface Admin {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  role_id?: number;
  role_display?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  remark?: string;
}

/**
 * 创建管理员请求参数
 */
export interface CreateAdminParams {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role_id: number;
  remark?: string;
}

/**
 * 更新管理员请求参数
 */
export interface UpdateAdminParams {
  username?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  status?: 1 | 2;
  remark?: string;
}

/**
 * 分页响应类型
 */
export interface PaginatedAdminResponse {
  results: Admin[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取管理员列表
 * @param currentPage 当前页码
 * @param pageSize 每页条数
 * @param params 查询参数
 */
export function getAdminList(
  currentPage: number,
  pageSize: number,
  params?: {
    username?: string;
    status?: 1 | 2;
    role_id?: number;
  }
) {
  return http.get<PaginatedAdminResponse>('/users_admin/', {
    currentPage,
    pageSize,
    ...params,
  });
}

/**
 * 获取管理员详情
 * @param id 管理员ID
 */
export function getAdminDetail(id: number) {
  return http.get<Admin>(`/users_admin/${id}/`);
}

/**
 * 创建管理员
 * @param data 管理员信息
 */
export function createAdmin(data: CreateAdminParams) {
  return http.post<Admin>('/users_admin/', data);
}

/**
 * 更新管理员信息
 * @param id 管理员ID
 * @param data 更新的管理员信息
 */
export function updateAdmin(id: number, data: UpdateAdminParams) {
  return http.put<Admin>(`/users_admin/${id}/`, data);
}

/**
 * 删除管理员
 * @param id 管理员ID
 */
export function deleteAdmin(id: number) {
  return http.delete(`/users_admin/${id}/`);
}

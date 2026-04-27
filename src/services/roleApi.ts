/**
 * 角色管理API服务
 */
import http from './request';

/**
 * 角色数据类型定义
 */
export interface Role {
  id: number;
  name: string;
  code?: string;
  user_type?: 'admin' | 'customer';
  description?: string;
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 权限数据类型定义
 */
export interface Permission {
  id: number;
  name: string;
  code: string;
  module: string;
  description?: string;
}

/**
 * 创建角色请求参数
 */
export interface CreateRoleParams {
  name: string;
  code?: string;
  user_type?: 'admin' | 'customer';
  description?: string;
}

/**
 * 更新角色请求参数
 */
export interface UpdateRoleParams {
  name?: string;
  code?: string;
  user_type?: 'admin' | 'customer';
  description?: string;
}

/**
 * 分页响应类型
 */
export interface PaginatedRoleResponse {
  results: Role[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取角色列表
 * @param currentPage 当前页码
 * @param pageSize 每页条数
 * @param params 查询参数
 */
export function getRoleList(
  currentPage: number,
  pageSize: number,
  params?: {
    name?: string;
    status?: 1 | 2;
  }
) {
  return http.get<PaginatedRoleResponse>('/roles/', {
    currentPage,
    pageSize,
    ...params,
  });
}

/**
 * 获取角色详情
 * @param id 角色ID
 */
export function getRoleDetail(id: number) {
  return http.get<Role>(`/roles/${id}/`);
}

/**
 * 创建角色
 * @param data 角色信息
 */
export function createRole(data: CreateRoleParams) {
  return http.post<Role>('/roles/', data);
}

/**
 * 更新角色信息
 * @param id 角色ID
 * @param data 更新的角色信息
 */
export function updateRole(id: number, data: UpdateRoleParams) {
  return http.put<Role>(`/roles/${id}/`, data);
}

/**
 * 删除角色
 * @param id 角色ID
 */
export function deleteRole(id: number) {
  return http.delete(`/roles/${id}/`);
}

/**
 * 获取权限列表
 */
export function getPermissionList() {
  return http.get<Permission[]>('/permissions/');
}

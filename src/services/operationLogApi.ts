/**
 * 操作日志API服务
 */
import http from './request';

/**
 * 操作日志数据类型定义
 */
export interface OperationLog {
  id: number;
  operator: string;
  operator_name?: string;
  module: string;
  action: string;
  target?: string;
  ip: string;
  user_agent?: string;
  created_at: string;
  request_method?: string;
  request_url?: string;
  request_params?: string;
  response_code?: number;
  response_msg?: string;
  duration?: number;
}

/**
 * 分页响应类型
 */
export interface PaginatedLogResponse {
  results: OperationLog[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取操作日志列表
 * @param currentPage 当前页码
 * @param pageSize 每页条数
 * @param params 查询参数
 */
export function getOperationLogList(
  currentPage: number,
  pageSize: number,
  params?: {
    operator?: string;
    module?: string;
    action?: string;
    start_time?: string;
    end_time?: string;
  }
) {
  return http.get<PaginatedLogResponse>('/operation_log/operation_log/', {
    currentPage,
    pageSize,
    ...params,
  });
}

/**
 * 获取操作日志详情
 * @param id 日志ID
 */
export function getOperationLogDetail(id: number) {
  return http.get<OperationLog>(`/operation_log/operation_log/${id}/`);
}

/**
 * 系统设置相关API接口
 */

import http from './request';

// 页面内容类型
export type PageContentType = 'help' | 'about' | 'privacy';

// 页面内容
export interface PageContent {
  id?: number;           // 页面内容 ID
  help?: string;         // 帮助与支持
  about?: string;        // 关于我们
  privacy?: string;      // 隐私政策
}

/**
 * 获取页面内容
 * @param type 页面类型：help | about | privacy
 */
export function getPageContent(type: PageContentType) {
  return http.get<{ id: number; content: string }>(`/site/${type}/`);
}

/**
 * 保存页面内容
 * @param type 页面类型：help | about | privacy
 * @param content 页面内容
 * @param id 页面内容 ID
 */
export function savePageContent(type: PageContentType, content: string, id: number) {
  return http.put<{ content: string }>(`/site/${id}/`, { content });
}

// 基础设置数据类型
export interface BasicSettings {
  site_name?: string;                // 站点名称
  site_description?: string;         // 站点描述
  icp_number?: string;               // 备案号
  contact_email?: string;            // 联系邮箱
  enable_wallpaper_audit?: boolean;  // 开启壁纸审核
  enable_comment_audit?: boolean;    // 开启评论审核
  allow_user_register?: boolean;     // 允许用户注册
}

/**
 * 获取基础设置
 */
export function getBasicSettings() {
  return http.get<BasicSettings>('/site/basic-settings/');
}

/**
 * 更新基础设置
 * @param data 基础设置数据
 */
export function updateBasicSettings(data: BasicSettings) {
  return http.post<BasicSettings>('/site/update-basic-settings/', data);
}

/**
 * 批量获取所有页面内容
 */
export function getAllPageContent() {
  return Promise.all([
    getPageContent('help').then(res => ({ help: res.content, help_id: res.id })),
    getPageContent('about').then(res => ({ about: res.content, about_id: res.id })),
    getPageContent('privacy').then(res => ({ privacy: res.content, privacy_id: res.id })),
  ]).then(results => {
    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {}) as any;
  });
}

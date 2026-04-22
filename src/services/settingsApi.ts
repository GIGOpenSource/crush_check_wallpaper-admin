/**
 * 系统设置相关API接口
 */

import http from './request';

// 页面内容类型
export type PageContentType = 'help' | 'about' | 'privacy';

// 页面内容
export interface PageContent {
  help?: string;         // 帮助与支持
  about?: string;        // 关于我们
  privacy?: string;      // 隐私政策
}

/**
 * 获取页面内容
 * @param type 页面类型：help | about | privacy
 */
export function getPageContent(type: PageContentType) {
  return http.get<{ content: string }>(`/site/${type}`);
}

/**
 * 保存页面内容
 * @param type 页面类型：help | about | privacy
 * @param content 页面内容
 */
export function savePageContent(type: PageContentType, content: string) {
  return http.post<{ content: string }>(`/site/${type}`, { content });
}

/**
 * 批量获取所有页面内容
 */
export function getAllPageContent() {
  return Promise.all([
    getPageContent('help').then(res => ({ help: res.content })),
    getPageContent('about').then(res => ({ about: res.content })),
    getPageContent('privacy').then(res => ({ privacy: res.content })),
  ]).then(results => {
    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {}) as PageContent;
  });
}

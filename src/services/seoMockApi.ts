/**
 * SEO模块Mock API服务
 * 用于在没有后端API时提供模拟数据
 * 当后端API就绪后，可以无缝切换到真实API
 */

import { message } from 'antd';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== 1. 对接真实数据API - SEO仪表盘 ====================

export const mockGetSEOHealthScore = async () => {
  await delay(300);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      score: 87,
      lastUpdate: '2026-04-17 10:00:00',
      trends: [
        { date: '2026-04-11', score: 82 },
        { date: '2026-04-12', score: 83 },
        { date: '2026-04-13', score: 84 },
        { date: '2026-04-14', score: 85 },
        { date: '2026-04-15', score: 86 },
        { date: '2026-04-16', score: 86 },
        { date: '2026-04-17', score: 87 },
      ],
    },
  };
};

export const mockGetPendingIssues = async () => {
  await delay(200);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: [
      { type: 'warning', title: 'ALT标签缺失', count: 45, icon: 'WarningOutlined' },
      { type: 'error', title: '404错误页面', count: 12, icon: 'CloseCircleOutlined' },
      { type: 'warning', title: 'TDK待优化', count: 23, icon: 'FileTextOutlined' },
      { type: 'error', title: 'Canonical错误', count: 3, icon: 'ToolOutlined' },
    ],
  };
};

export const mockGetCoreMetrics = async () => {
  await delay(250);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: [
      { title: 'Google收录', value: 12850, change: 234, changeType: 'up' },
      { title: '日抓取次数', value: 4560, change: 18, changeType: 'up' },
      { title: '核心词排名', value: 8, change: 3, changeType: 'up' },
      { title: '自然流量占比', value: '72.3%', change: 5.1, changeType: 'up' },
    ],
  };
};

export const mockGetTechChecks = async () => {
  await delay(200);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: [
      { name: 'Core Web Vitals', status: 'success', count: '通过' },
      { name: 'Mobile Friendly', status: 'success', count: '100%' },
      { name: 'HTTPS Security', status: 'success', count: '有效' },
      { name: 'Canonical标签', status: 'success', count: '1200/1200' },
      { name: 'Schema标记', status: 'warning', count: '1150/1200' },
      { name: 'Sitemap', status: 'success', count: '正常' },
    ],
  };
};

export const mockGetOperationLogs = async (params: any) => {
  await delay(300);
  const allLogs = [
    { id: 1, time: '2026-04-17 10:30:00', content: '完成全站SEO检查', status: 'success', operator: '系统', type: '检查' },
    { id: 2, time: '2026-04-17 09:15:00', content: '修复15个ALT标签缺失', status: 'success', operator: '管理员', type: '修复' },
    { id: 3, time: '2026-04-17 08:00:00', content: '生成新的Sitemap', status: 'success', operator: '系统', type: '生成' },
    { id: 4, time: '2026-04-16 18:30:00', content: '发现3个404错误', status: 'warning', operator: '系统', type: '检查' },
    { id: 5, time: '2026-04-16 15:20:00', content: '更新TDK模板', status: 'success', operator: '管理员', type: '更新' },
    { id: 6, time: '2026-04-16 12:00:00', content: '提交Sitemap到Google', status: 'success', operator: '系统', type: '提交' },
    { id: 7, time: '2026-04-16 09:00:00', content: '检测到Canonical错误', status: 'error', operator: '系统', type: '检查' },
    { id: 8, time: '2026-04-15 20:00:00', content: '完成日常巡查', status: 'success', operator: '系统', type: '巡查' },
  ];
  
  // 筛选逻辑
  let filtered = allLogs;
  if (params.search) {
    filtered = filtered.filter(log => log.content.includes(params.search));
  }
  if (params.status && params.status !== 'all') {
    filtered = filtered.filter(log => log.status === params.status);
  }
  if (params.type && params.type !== 'all') {
    filtered = filtered.filter(log => log.type === params.type);
  }
  
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      items: filtered.slice(0, params.pageSize || 10),
      total: filtered.length,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    },
  };
};

// ==================== 2. 一键修复实际逻辑 - 技术优化 ====================

export const mockStartSiteCheck = async () => {
  await delay(500);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: { checkId: `check_${Date.now()}` },
  };
};

export const mockGetCheckProgress = async (checkId: string) => {
  await delay(200);
  // 模拟进度变化
  const progress = Math.min(100, Math.floor(Math.random() * 100));
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      checkId,
      progress,
      status: progress < 100 ? 'running' : 'completed',
      currentItem: '检查图片ALT标签...',
    },
  };
};

export const mockGetCheckResults = async (checkId: string) => {
  await delay(300);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      checkId,
      summary: {
        total: 1200,
        passed: 1150,
        failed: 50,
        warning: 30,
      },
      issues: [
        { id: 1, url: '/wallpaper/1234', issue: 'ALT标签缺失', type: 'warning', suggestion: '添加描述性ALT' },
        { id: 2, url: '/wallpaper/5678', issue: 'ALT标签缺失', type: 'warning', suggestion: '添加描述性ALT' },
        { id: 3, url: '/404', issue: '返回200状态码', type: 'error', suggestion: '修改为返回真实404状态码' },
      ],
    },
  };
};

export const mockFixIssue = async (issueId: number, _fixType: string) => {
  await delay(800);
  message.success(`问题 #${issueId} 修复成功`);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: { success: true, fixedAt: new Date().toISOString() },
  };
};

export const mockBatchFixIssues = async (issueIds: number[], _fixType: string) => {
  await delay(1500);
  message.success(`成功修复 ${issueIds.length} 个问题`);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: { 
      success: true, 
      fixedCount: issueIds.length,
      fixedAt: new Date().toISOString(),
    },
  };
};

export const mockExportTechReport = async (checkId: string) => {
  await delay(500);
  // 生成报告数据
  const reportData = {
    title: 'SEO技术优化报告',
    date: new Date().toLocaleString(),
    checkId,
    summary: { total: 1200, passed: 1150, failed: 50 },
  };
  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  return blob;
};

// ==================== 3. 后端生成Sitemap - Sitemap管理 ====================

export const mockGetSitemaps = async () => {
  await delay(200);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: [
      { id: 1, name: 'sitemap.xml', url: '/sitemap.xml', type: 'index', urls: 5, size: '2.4KB', lastUpdate: '2026-04-17 10:00', status: 'valid', autoUpdate: true },
      { id: 2, name: 'sitemap-posts.xml', url: '/sitemap-posts.xml', type: 'sitemap', urls: 1250, size: '156KB', lastUpdate: '2026-04-17 09:30', status: 'valid', autoUpdate: true },
      { id: 3, name: 'sitemap-categories.xml', url: '/sitemap-categories.xml', type: 'sitemap', urls: 45, size: '8.2KB', lastUpdate: '2026-04-17 09:30', status: 'valid', autoUpdate: true },
    ],
  };
};

export const mockGenerateSitemap = async (data: any) => {
  await delay(2000);
  message.success('Sitemap生成成功');
  
  // 生成XML内容
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${data.types.map((type: string) => `
  <url>
    <loc>https://example.com/${type}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${data.changefreq}</changefreq>
    <priority>${data.priority}</priority>
  </url>`).join('')}
</urlset>`;
  
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      sitemapId: Date.now(),
      name: `sitemap-${data.types.join('-')}.xml`,
      content: xmlContent,
      urlCount: data.types.length * 100,
      size: `${(xmlContent.length / 1024).toFixed(1)}KB`,
    },
  };
};

export const mockDownloadSitemap = async (_sitemapId: number) => {
  await delay(300);
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/wallpaper/4k-star-sky</loc>
    <lastmod>2026-04-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  return blob;
};

export const mockSubmitToSearchEngines = async (sitemapIds: number[]) => {
  await delay(1000);
  message.success(`成功提交 ${sitemapIds.length} 个Sitemap到Google Search Console`);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      submitted: sitemapIds.length,
      status: 'success',
      message: 'Submitted to Google Search Console successfully',
    },
  };
};

// ==================== 4. 外链有效性检测 - 外链管理 ====================

export const mockGetBacklinks = async (params: any) => {
  await delay(300);
  const allBacklinks = [
    { 
      id: 1, 
      source_page: 'https://example-blog.com/post-1', 
      target_page: 'https://example.com/wallpaper/4k', 
      anchor_text: '4K壁纸下载', 
      da_score: 45, 
      attribute: 'dofollow',
      attribute_display: 'Dofollow',
      status: 'active', 
      status_display: '有效',
      quality_score: 75,
      remark: '高质量外链',
      created_at: '2026-04-10T10:00:00', 
      updated_at: '2026-04-17T10:00:00'
    },
    { 
      id: 2, 
      source_page: 'https://tech-site.com/article', 
      target_page: 'https://example.com/category/anime', 
      anchor_text: '动漫壁纸', 
      da_score: 62, 
      attribute: 'nofollow',
      attribute_display: 'Nofollow',
      status: 'pending', 
      status_display: '待审核',
      quality_score: 0,
      remark: '',
      created_at: '2026-04-08T10:00:00', 
      updated_at: '2026-04-17T10:00:00'
    },
    { 
      id: 3, 
      source_page: 'https://suspicious-site.com', 
      target_page: 'https://example.com/wallpaper/nature', 
      anchor_text: '点击这里', 
      da_score: 12, 
      attribute: 'ugc',
      attribute_display: 'UGC',
      status: 'toxic', 
      status_display: '有毒',
      quality_score: 20,
      remark: '低质量网站，建议删除',
      created_at: '2026-04-05T10:00:00', 
      updated_at: '2026-04-17T10:00:00'
    },
    { 
      id: 4, 
      source_page: 'https://design-portfolio.com', 
      target_page: 'https://example.com/', 
      anchor_text: '壁纸大全', 
      da_score: 38, 
      attribute: 'sponsored',
      attribute_display: 'Sponsored',
      status: 'inactive', 
      status_display: '失效',
      quality_score: 45,
      remark: '链接已失效',
      created_at: '2026-04-01T10:00:00', 
      updated_at: '2026-04-16T10:00:00'
    },
  ];
  
  let filtered = allBacklinks;
  if (params.status) {
    filtered = filtered.filter(b => b.status === params.status);
  }
  if (params.source_page) {
    filtered = filtered.filter(b => 
      b.source_page.includes(params.source_page)
    );
  }
  
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      pagination: {
        page: params.page || 1,
        page_size: params.pageSize || 10,
        total: filtered.length,
        total_pages: Math.ceil(filtered.length / (params.pageSize || 10)),
      },
      results: filtered,
    },
  };
};

export const mockCheckBacklink = async (backlinkId: number) => {
  await delay(1500);
  
  // 模拟检测结果
  const results = [
    { status: 'active', message: '外链状态正常', httpCode: 200 },
    { status: 'broken', message: '页面返回404错误', httpCode: 404 },
    { status: 'redirect', message: '页面发生重定向', httpCode: 301 },
  ];
  const result = results[Math.floor(Math.random() * results.length)];
  
  message.info(`检测完成: ${result.message}`);
  
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      backlinkId,
      ...result,
      checkedAt: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 500) + 100,
    },
  };
};

export const mockBatchCheckBacklinks = async (backlinkIds: number[]) => {
  await delay(2000);
  message.success(`完成 ${backlinkIds.length} 个外链的检测`);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      checked: backlinkIds.length,
      active: Math.floor(backlinkIds.length * 0.8),
      broken: Math.floor(backlinkIds.length * 0.2),
    },
  };
};

export const mockScanBacklinks = async () => {
  await delay(3000);
  message.success('扫描完成，发现 5 个新外链');
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      found: 5,
      newBacklinks: [
        { id: 5, sourceUrl: 'https://new-site-1.com', targetUrl: 'https://example.com/wallpaper/123', anchorText: '精美壁纸' },
        { id: 6, sourceUrl: 'https://new-site-2.com', targetUrl: 'https://example.com/category/nature', anchorText: '自然风景' },
      ],
    },
  };
};

// ==================== 5. Excel/CSV导入导出 - TDK管理 ====================

export const mockExportTDKReport = async () => {
  await delay(500);
  
  // 生成CSV内容
  const csvContent = `页面URL,标题,描述,关键词
https://example.com/,壁纸大全 - 4K高清壁纸下载,提供海量4K高清壁纸下载，包括风景、动漫、美女等多种分类,壁纸 4K 高清
https://example.com/category/nature,自然风景壁纸 - 4K高清,精选自然风景壁纸，山水、森林、星空等,自然风景 山水 星空
https://example.com/category/anime,动漫壁纸 - 4K高清,热门动漫壁纸，二次元精美图片,动漫 二次元 壁纸`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return blob;
};

export const mockImportTDKData = async (_formData: FormData) => {
  await delay(1000);
  message.success('成功导入 50 条TDK数据');
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      imported: 50,
      failed: 0,
      message: '导入成功',
    },
  };
};

// ==================== 6. Google Search Console API - 数据分析 ====================

export const mockGetSearchConsoleData = async (_params: any) => {
  await delay(500);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      clicks: 12580,
      impressions: 256000,
      ctr: 4.91,
      position: 8.5,
      dates: [
        { date: '2026-04-11', clicks: 1800, impressions: 35000, ctr: 5.14, position: 8.2 },
        { date: '2026-04-12', clicks: 1750, impressions: 36000, ctr: 4.86, position: 8.5 },
        { date: '2026-04-13', clicks: 1900, impressions: 37000, ctr: 5.14, position: 8.1 },
        { date: '2026-04-14', clicks: 1850, impressions: 38000, ctr: 4.87, position: 8.7 },
        { date: '2026-04-15', clicks: 2100, impressions: 40000, ctr: 5.25, position: 7.9 },
        { date: '2026-04-16', clicks: 2050, impressions: 39000, ctr: 5.26, position: 8.3 },
        { date: '2026-04-17', clicks: 2130, impressions: 41000, ctr: 5.20, position: 8.0 },
      ],
    },
  };
};

export const mockGetIndexTrend = async (_params: any) => {
  await delay(400);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: [
      { date: '04-11', google: 8500, indexed: 8200, discovered: 300 },
      { date: '04-12', google: 8620, indexed: 8320, discovered: 280 },
      { date: '04-13', google: 8740, indexed: 8450, discovered: 250 },
      { date: '04-14', google: 8850, indexed: 8560, discovered: 320 },
      { date: '04-15', google: 8920, indexed: 8650, discovered: 290 },
      { date: '04-16', google: 8980, indexed: 8720, discovered: 310 },
      { date: '04-17', google: 9050, indexed: 8800, discovered: 280 },
    ],
  };
};

export const mockGetKeywordRankings = async (_params: any) => {
  await delay(300);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      items: [
        { id: 1, keyword: '4k wallpaper', searchEngine: 'Google', currentRank: 3, previousRank: 5, change: 2, searchVolume: 185000, url: '/category/4k' },
        { id: 2, keyword: 'hd wallpaper', searchEngine: 'Google', currentRank: 5, previousRank: 6, change: 1, searchVolume: 148000, url: '/category/hd' },
        { id: 3, keyword: 'anime wallpaper', searchEngine: 'Google', currentRank: 2, previousRank: 4, change: 2, searchVolume: 256000, url: '/category/anime' },
        { id: 4, keyword: 'nature wallpaper', searchEngine: 'Google', currentRank: 8, previousRank: 12, change: 4, searchVolume: 95000, url: '/category/nature' },
      ],
      total: 4,
      page: 1,
      pageSize: 10,
    },
  };
};

// ==================== 7. 关键词研究API - 关键词挖掘 ====================

export const mockSearchKeywords = async (params: any) => {
  await delay(400);
  const keywords = [
    { id: 1, keyword: '4k wallpaper', searchVolume: 185000, difficulty: 65, cpc: 2.5, trend: 'up', competition: 'high', relatedCount: 1256, category: 'Resolution' },
    { id: 2, keyword: 'hd wallpaper', searchVolume: 248000, difficulty: 58, cpc: 1.8, trend: 'up', competition: 'high', relatedCount: 1890, category: 'Resolution' },
    { id: 3, keyword: 'anime wallpaper', searchVolume: 356000, difficulty: 45, cpc: 1.2, trend: 'up', competition: 'high', relatedCount: 2150, category: 'Style' },
  ];
  
  let filtered = keywords;
  if (params.keyword) {
    filtered = filtered.filter(k => k.keyword.includes(params.keyword.toLowerCase()));
  }
  
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: 10,
    },
  };
};

export const mockGenerateLongTailKeywords = async (data: any) => {
  await delay(1000);
  const generated = data.modifiers.map((modifier: string, index: number) => ({
    id: index + 1,
    keyword: `${data.coreKeyword} ${modifier}`,
    parentKeyword: data.coreKeyword,
    searchVolume: Math.floor(Math.random() * 10000) + 1000,
    difficulty: Math.floor(Math.random() * 40) + 20,
    recommendation: Math.random() > 0.5 ? 'Highly Recommended' : 'Recommended',
  }));
  
  message.success(`成功生成 ${generated.length} 个长尾关键词`);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: generated,
  };
};

// ==================== 8. 定时任务设置 - 技术优化 ====================

export const mockGetScheduledTasks = async () => {
  await delay(200);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: [
      { id: 1, name: '每日SEO检查', type: 'check', cron: '0 2 * * *', enabled: true, lastRun: '2026-04-17 02:00', nextRun: '2026-04-18 02:00' },
      { id: 2, name: '每周Sitemap生成', type: 'sitemap', cron: '0 3 * * 1', enabled: true, lastRun: '2026-04-14 03:00', nextRun: '2026-04-21 03:00' },
      { id: 3, name: '每日外链检测', type: 'backlink', cron: '0 4 * * *', enabled: false, lastRun: '-', nextRun: '-' },
    ],
  };
};

export const mockAddScheduledTask = async (data: any) => {
  await delay(300);
  message.success('定时任务添加成功');
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      taskId: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    },
  };
};

export const mockUpdateScheduledTask = async (taskId: number, data: any) => {
  await delay(300);
  message.success('定时任务更新成功');
  return {
    code: 200,
    success: true,
    message: 'success',
    data: { taskId, ...data },
  };
};

export const mockDeleteScheduledTask = async (_taskId: number) => {
  await delay(200);
  message.success('定时任务删除成功');
  return {
    code: 200,
    success: true,
    message: 'success',
    data: { deleted: true },
  };
};

export const mockExecuteScheduledTask = async (taskId: number) => {
  await delay(1000);
  message.success('定时任务执行成功');
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      taskId,
      executedAt: new Date().toISOString(),
      result: 'success',
    },
  };
};

// ==================== 9. 告警规则设置 - 日常巡查 ====================

export const mockGetAlertRules = async () => {
  await delay(200);
  return {
    code: 200,
    success: true,
    message: 'success',
    data: [
      { id: 1, type: 'health_score', name: '健康度下降', threshold: 80, enabled: true, notify: ['email'] },
      { id: 2, type: '404_errors', name: '404错误增加', threshold: 20, enabled: true, notify: ['email', 'sms'] },
      { id: 3, type: 'index_drop', name: '收录量下降', threshold: 100, enabled: false, notify: ['email'] },
    ],
  };
};

export const mockSaveAlertRules = async (rules: any[]) => {
  await delay(300);
  message.success('告警规则保存成功');
  return {
    code: 200,
    success: true,
    message: 'success',
    data: { saved: true, count: rules.length },
  };
};

// ==================== 10. 规则测试功能 - Robots.txt ====================

export const mockTestRobotsRule = async (data: any) => {
  await delay(500);
  
  // 模拟测试结果
  const isAllowed = !data.url.includes('/admin/') && !data.url.includes('/api/');
  
  return {
    code: 200,
    success: true,
    message: 'success',
    data: {
      userAgent: data.userAgent,
      url: data.url,
      result: isAllowed ? 'Allow' : 'Disallow',
      matchedRule: isAllowed ? 'Allow: /' : 'Disallow: /admin/',
      explanation: isAllowed 
        ? '该URL允许被搜索引擎抓取' 
        : '该URL被robots.txt规则禁止抓取',
    },
  };
};

// ==================== 统一导出 ====================

export const seoMockApi = {
  // 仪表盘
  getSEOHealthScore: mockGetSEOHealthScore,
  getPendingIssues: mockGetPendingIssues,
  getCoreMetrics: mockGetCoreMetrics,
  getTechChecks: mockGetTechChecks,
  getOperationLogs: mockGetOperationLogs,
  
  // 技术优化
  startSiteCheck: mockStartSiteCheck,
  getCheckProgress: mockGetCheckProgress,
  getCheckResults: mockGetCheckResults,
  fixIssue: mockFixIssue,
  batchFixIssues: mockBatchFixIssues,
  exportTechReport: mockExportTechReport,
  
  // Sitemap
  getSitemaps: mockGetSitemaps,
  generateSitemap: mockGenerateSitemap,
  downloadSitemap: mockDownloadSitemap,
  submitToSearchEngines: mockSubmitToSearchEngines,
  
  // 外链
  getBacklinks: mockGetBacklinks,
  checkBacklink: mockCheckBacklink,
  batchCheckBacklinks: mockBatchCheckBacklinks,
  scanBacklinks: mockScanBacklinks,
  
  // TDK
  exportTDKReport: mockExportTDKReport,
  importTDKData: mockImportTDKData,
  
  // 数据分析
  getSearchConsoleData: mockGetSearchConsoleData,
  getIndexTrend: mockGetIndexTrend,
  getKeywordRankings: mockGetKeywordRankings,
  
  // 关键词
  searchKeywords: mockSearchKeywords,
  generateLongTailKeywords: mockGenerateLongTailKeywords,
  
  // 定时任务
  getScheduledTasks: mockGetScheduledTasks,
  addScheduledTask: mockAddScheduledTask,
  updateScheduledTask: mockUpdateScheduledTask,
  deleteScheduledTask: mockDeleteScheduledTask,
  executeScheduledTask: mockExecuteScheduledTask,
  
  // 告警规则
  getAlertRules: mockGetAlertRules,
  saveAlertRules: mockSaveAlertRules,
  
  // Robots测试
  testRobotsRule: mockTestRobotsRule,
};

export default seoMockApi;

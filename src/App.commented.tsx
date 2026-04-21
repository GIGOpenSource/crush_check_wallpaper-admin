/**
 * App.tsx - 应用程序根组件
 * 
 * 这是整个后台管理面板的入口文件，负责：
 * 1. 配置 Ant Design 主题和国际化
 * 2. 设置 React Router 路由系统
 * 3. 组织所有页面组件的导入和路由映射
 */

// ============================================
// 第1部分：Ant Design 相关导入
// ============================================

// 从 antd 导入 ConfigProvider（配置提供者）和 theme（主题）
// ConfigProvider 用于全局配置 Ant Design 组件的样式、语言等
// theme 提供主题算法，如 defaultAlgorithm（默认主题算法）
import { ConfigProvider, theme } from 'antd';

// ============================================
// 第2部分：React Router 相关导入
// ============================================

// 从 react-router-dom 导入路由相关组件
// BrowserRouter: 使用 HTML5 History API 的路由器，支持干净的 URL（无 #）
// Routes: 路由容器，用于包裹多个 Route 组件
// Route: 单个路由定义，匹配 URL 路径并渲染对应组件
// Navigate: 导航组件，用于重定向到其他路由
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 导入 Ant Design 的中文语言包
// 这会将所有 Ant Design 组件的默认文本（如日期选择器、分页等）显示为中文
import zhCN from 'antd/locale/zh_CN';

// ============================================
// 第3部分：布局组件导入
// ============================================

// 导入后台管理面板的主布局组件
// AdminLayout 包含侧边栏导航、顶部 Header 和主内容区域
import AdminLayout from './layouts/AdminLayout';

// ============================================
// 第4部分：页面组件导入 - 数据概览
// ============================================

// 导入 Dashboard（仪表盘/数据概览）页面组件
// 这是登录后默认显示的页面，展示网站的核心统计数据
import Dashboard from './pages/Dashboard';

// ============================================
// 第5部分：页面组件导入 - 用户管理
// ============================================

// 导入用户列表页面，展示所有注册用户的信息表格
import UserList from './pages/User/UserList';

// 导入用户详情页面，展示单个用户的详细信息
// 包括用户的基本信息、下载记录、上传记录等
import UserDetail from './pages/User/UserDetail';

// ============================================
// 第6部分：页面组件导入 - 壁纸管理
// ============================================

// 导入壁纸列表页面，展示所有壁纸的信息
// 支持搜索、筛选、编辑、删除等操作
import WallpaperList from './pages/Wallpaper/WallpaperList';

// 导入壁纸审核页面，用于审核用户上传的壁纸
// 可以批准或拒绝待审核的壁纸
import WallpaperAudit from './pages/Wallpaper/WallpaperAudit';

// ============================================
// 第7部分：页面组件导入 - 标签管理
// ============================================

// 导入标签列表页面，管理所有标签
// 支持创建、编辑、删除标签
import TagList from './pages/Tag/TagList';

// 导入导航标签页面，配置网站顶部导航栏显示的标签
// 可以设置标签的显示顺序和区域
import NavigationTag from './pages/Tag/NavigationTag';

// ============================================
// 第8部分：页面组件导入 - 内容管理
// ============================================

// 导入评论列表页面，管理用户发表的评论
// 可以查看、删除、隐藏评论
import CommentList from './pages/Content/CommentList';

// 导入举报处理页面，处理用户举报的内容
// 包括举报的壁纸、评论等
import ReportList from './pages/Content/ReportList';

// ============================================
// 第9部分：页面组件导入 - 通知管理
// ============================================

// 导入通知列表页面，查看已发送的系统通知
import NotificationList from './pages/Notification/NotificationList';

// 导入发送通知页面，创建并发送系统通知给用户
// 支持站内信、邮件、推送等多种方式
import SendNotification from './pages/Notification/SendNotification';

// ============================================
// 第10部分：页面组件导入 - 数据统计
// ============================================

// 导入综合统计页面，展示网站的整体数据统计
// 包括用户、壁纸、访问量等趋势图表
import Statistics from './pages/Statistics/Statistics';

// 导入页面类型统计页面，分析不同类型页面的访问数据
import PageTypeStatistics from './pages/Statistics/PageTypeStatistics';

// ============================================
// 第11部分：页面组件导入 - SEO管理
// ============================================

// 导入 SEO 仪表盘页面，展示 SEO 健康度评分和核心指标
import SEODashboard from './pages/SEO/SEODashboard';

// 导入技术优化页面，进行网站技术层面的 SEO 检查
// 包括 Core Web Vitals、移动端适配等
import TechnicalSEO from './pages/SEO/TechnicalSEO';

// 导入 TDK 管理页面，管理页面的 Title、Description、Keywords
import TDKManager from './pages/SEO/TDKManager';

// 导入日常巡查页面，自动检查网站的 SEO 问题
import DailyAudit from './pages/SEO/DailyAudit';

// 导入数据分析页面，展示 Google Search Console 的数据
import SEOAnalytics from './pages/SEO/SEOAnalytics';

// 导入关键词挖掘页面，研究和分析关键词
import KeywordResearch from './pages/SEO/KeywordResearch';

// 导入 Sitemap 管理页面，生成和提交网站地图
import SitemapManager from './pages/SEO/SitemapManager';

// 导入 Robots.txt 管理页面，配置搜索引擎爬虫规则
import RobotsManager from './pages/SEO/RobotsManager';

// 导入外链管理页面，监控和管理外部链接
import BacklinkManager from './pages/SEO/BacklinkManager';

// ============================================
// 第12部分：页面组件导入 - 权限管理
// ============================================

// 导入管理员列表页面，管理后台管理员账号
import AdminList from './pages/Permission/AdminList';

// 导入角色列表页面，配置不同角色的权限
import RoleList from './pages/Permission/RoleList';

// 导入操作日志页面，查看管理员的操作记录
import OperationLog from './pages/Permission/OperationLog';

// ============================================
// 第13部分：页面组件导入 - 系统设置
// ============================================

// 导入基础设置页面，配置网站的基本信息
// 如站点名称、Logo、SEO 基础设置等
import BasicSettings from './pages/Settings/BasicSettings';

// 导入页面内容管理页面，管理网站的静态页面内容
import PageContent from './pages/Settings/PageContent';

// ============================================
// 第14部分：页面组件导入 - 登录
// ============================================

// 导入登录页面组件
// 这是未登录用户访问的第一个页面
import Login from './pages/Login';

// ============================================
// 第15部分：样式文件导入
// ============================================

// 导入 App 组件的 CSS 样式文件
// 包含全局样式重置和基础样式定义
import './App.css';

// ============================================
// 第16部分：App 组件定义
// ============================================

/**
 * App 组件 - 应用程序根组件
 * 
 * 这是一个函数组件，使用 React 的函数组件语法
 * 返回 JSX 元素，描述 UI 的结构
 */
function App() {
  // 返回 JSX，描述应用的渲染结构
  return (
    // ConfigProvider 是 Ant Design 的全局配置组件
    // 包裹整个应用，为所有子组件提供统一的配置
    <ConfigProvider
      // locale 属性设置语言环境
      // zhCN 是中文语言包，所有组件将显示中文
      locale={zhCN}
      // theme 属性设置主题配置
      theme={{
        // algorithm 设置主题算法
        // theme.defaultAlgorithm 是 Ant Design 的默认主题算法
        algorithm: theme.defaultAlgorithm,
        // token 设置主题变量（设计令牌）
        token: {
          // colorPrimary 设置主题主色，这里是 Ant Design 的经典蓝色 #1890ff
          colorPrimary: '#1890ff',
          // borderRadius 设置组件的默认圆角大小，4 像素
          borderRadius: 4,
        },
      }}
    >
      {/* BrowserRouter 是 React Router 的路由器组件 */}
      {/* 使用 HTML5 History API，使 URL 更美观（无 # 号） */}
      <BrowserRouter>
        {/* Routes 是路由容器组件 */}
        {/* 用于包裹多个 Route 组件，定义应用的所有路由规则 */}
        <Routes>
          {/* Route 定义单个路由 */}
          {/* path="/login" 表示匹配 /login 路径 */}
          {/* element={<Login />} 表示渲染 Login 组件 */}
          <Route path="/login" element={<Login />} />
          
          {/* 嵌套路由：所有后台页面共享 AdminLayout 布局 */}
          {/* path="/" 匹配根路径 */}
          {/* element={<AdminLayout />} 表示使用 AdminLayout 作为布局 */}
          <Route path="/" element={<AdminLayout />}>
            
            {/* index 表示默认子路由 */}
            {/* 当访问 / 时，自动重定向到 /dashboard */}
            {/* Navigate 组件用于重定向，replace 表示替换当前历史记录 */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* dashboard 路由：数据概览页面 */}
            {/* 访问 /dashboard 时渲染 Dashboard 组件 */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* ========================================== */}
            {/* 用户管理模块路由 */}
            {/* ========================================== */}
            
            {/* users 路由：用户列表页面 */}
            {/* 访问 /users 时渲染 UserList 组件 */}
            <Route path="users" element={<UserList />} />
            
            {/* users/:id 路由：用户详情页面 */}
            {/* :id 是 URL 参数，表示用户 ID */}
            {/* 例如 /users/123 会渲染 ID 为 123 的用户详情 */}
            <Route path="users/:id" element={<UserDetail />} />
            
            {/* ========================================== */}
            {/* 壁纸管理模块路由 */}
            {/* ========================================== */}
            
            {/* wallpapers 路由：壁纸列表页面 */}
            <Route path="wallpapers" element={<WallpaperList />} />
            
            {/* wallpapers/audit 路由：壁纸审核页面 */}
            <Route path="wallpapers/audit" element={<WallpaperAudit />} />
            
            {/* ========================================== */}
            {/* 标签管理模块路由 */}
            {/* ========================================== */}
            
            {/* tags 路由：标签列表页面 */}
            <Route path="tags" element={<TagList />} />
            
            {/* tags/navigation 路由：导航标签配置页面 */}
            <Route path="tags/navigation" element={<NavigationTag />} />
            
            {/* ========================================== */}
            {/* 内容管理模块路由 */}
            {/* ========================================== */}
            
            {/* comments 路由：评论管理页面 */}
            <Route path="comments" element={<CommentList />} />
            
            {/* reports 路由：举报处理页面 */}
            <Route path="reports" element={<ReportList />} />
            
            {/* ========================================== */}
            {/* 通知管理模块路由 */}
            {/* ========================================== */}
            
            {/* notifications 路由：通知列表页面 */}
            <Route path="notifications" element={<NotificationList />} />
            
            {/* notifications/send 路由：发送通知页面 */}
            <Route path="notifications/send" element={<SendNotification />} />
            
            {/* ========================================== */}
            {/* 数据统计模块路由 */}
            {/* ========================================== */}
            
            {/* statistics 路由：综合统计页面 */}
            <Route path="statistics" element={<Statistics />} />
            
            {/* statistics/pages 路由：页面类型统计页面 */}
            <Route path="statistics/pages" element={<PageTypeStatistics />} />
            
            {/* ========================================== */}
            {/* SEO 管理模块路由 */}
            {/* ========================================== */}
            
            {/* seo 路由：SEO 仪表盘（默认页面） */}
            <Route path="seo" element={<SEODashboard />} />
            
            {/* seo/technical 路由：技术优化页面 */}
            <Route path="seo/technical" element={<TechnicalSEO />} />
            
            {/* seo/tdk 路由：TDK 管理页面 */}
            <Route path="seo/tdk" element={<TDKManager />} />
            
            {/* seo/audit 路由：日常巡查页面 */}
            <Route path="seo/audit" element={<DailyAudit />} />
            
            {/* seo/analytics 路由：数据分析页面 */}
            <Route path="seo/analytics" element={<SEOAnalytics />} />
            
            {/* seo/keywords 路由：关键词挖掘页面 */}
            <Route path="seo/keywords" element={<KeywordResearch />} />
            
            {/* seo/sitemap 路由：Sitemap 管理页面 */}
            <Route path="seo/sitemap" element={<SitemapManager />} />
            
            {/* seo/robots 路由：Robots.txt 管理页面 */}
            <Route path="seo/robots" element={<RobotsManager />} />
            
            {/* seo/backlinks 路由：外链管理页面 */}
            <Route path="seo/backlinks" element={<BacklinkManager />} />
            
            {/* ========================================== */}
            {/* 权限管理模块路由 */}
            {/* ========================================== */}
            
            {/* admins 路由：管理员列表页面 */}
            <Route path="admins" element={<AdminList />} />
            
            {/* roles 路由：角色管理页面 */}
            <Route path="roles" element={<RoleList />} />
            
            {/* logs 路由：操作日志页面 */}
            <Route path="logs" element={<OperationLog />} />
            
            {/* ========================================== */}
            {/* 系统设置模块路由 */}
            {/* ========================================== */}
            
            {/* settings/basic 路由：基础设置页面 */}
            <Route path="settings/basic" element={<BasicSettings />} />
            
            {/* settings/pages 路由：页面内容管理页面 */}
            <Route path="settings/pages" element={<PageContent />} />
            
          </Route> {/* AdminLayout 嵌套路由结束 */}
        </Routes> {/* Routes 路由容器结束 */}
      </BrowserRouter> {/* BrowserRouter 路由器结束 */}
    </ConfigProvider> /* ConfigProvider 配置提供者结束 */
  );
}

// ============================================
// 第17部分：导出 App 组件
// ============================================

// 使用默认导出语法导出 App 组件
// 这样其他文件可以通过 import App from './App' 来使用这个组件
export default App;

import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import NavigateInitializer from './components/NavigateInitializer';
import Dashboard from './pages/Dashboard';
import UserList from './pages/User/UserList';
import UserDetail from './pages/User/UserDetail';
import WallpaperList from './pages/Wallpaper/WallpaperList';
import WallpaperAudit from './pages/Wallpaper/WallpaperAudit';
import TagList from './pages/Tag/TagList';
import NavigationTag from './pages/Tag/NavigationTag';
import CommentList from './pages/Content/CommentList';
import ReportList from './pages/Content/ReportList';
import NotificationList from './pages/Notification/NotificationList';
import SendNotification from './pages/Notification/SendNotification';
import Statistics from './pages/Statistics/Statistics';
import PageTypeStatistics from './pages/Statistics/PageTypeStatistics';
import SEODashboard from './pages/SEO/SEODashboard';
import TechnicalSEO from './pages/SEO/TechnicalSEO';
import TDKManager from './pages/SEO/TDKManager';
import DailyAudit from './pages/SEO/DailyAudit';
import SEOAnalytics from './pages/SEO/SEOAnalytics';
import KeywordResearch from './pages/SEO/KeywordResearch';
import SitemapManager from './pages/SEO/SitemapManager';
import RobotsManager from './pages/SEO/RobotsManager';
import BacklinkManager from './pages/SEO/BacklinkManager';
import CompetitorAnalysis from './pages/SEO/CompetitorAnalysis';
import ContentOptimizer from './pages/SEO/ContentOptimizer';
import MobileSEOTester from './pages/SEO/MobileSEOTester';
import PageSpeedAnalyzer from './pages/SEO/PageSpeedAnalyzer';
import RecommendationManager from './pages/Recommendation/RecommendationManagerV2';
import AdminList from './pages/Permission/AdminList';
import RoleList from './pages/Permission/RoleList';
import OperationLog from './pages/Permission/OperationLog';
import BasicSettings from './pages/Settings/BasicSettings';
import PageContent from './pages/Settings/PageContent';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
      }}
    >
      <AntdApp>
        <HashRouter>
          {/* 初始化全局导航函数 */}
          <NavigateInitializer />
          
          <Routes>
            {/* 登录页面 - 无需权限 */}
            <Route path="/login" element={<Login />} />
            
            {/* 后台页面 - 需要登录权限 */}
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* 用户管理 */}
              <Route path="users" element={<UserList />} />
              <Route path="users/:id" element={<UserDetail />} />
              
              {/* 壁纸管理 */}
              <Route path="wallpapers" element={<WallpaperList />} />
              <Route path="wallpapers/audit" element={<WallpaperAudit />} />
              
              {/* 标签管理 */}
              <Route path="tags" element={<TagList />} />
              <Route path="tags/navigation" element={<NavigationTag />} />
              
              {/* 内容管理 */}
              <Route path="comments" element={<CommentList />} />
              <Route path="reports" element={<ReportList />} />
              
              {/* 通知管理 */}
              <Route path="notifications" element={<NotificationList />} />
              <Route path="notifications/send" element={<SendNotification />} />
              
              {/* 数据统计 */}
              <Route path="statistics" element={<Statistics />} />
              <Route path="statistics/pages" element={<PageTypeStatistics />} />
              
              {/* SEO管理 */}
              <Route path="seo" element={<SEODashboard />} />
              <Route path="seo/technical" element={<TechnicalSEO />} />
              <Route path="seo/tdk" element={<TDKManager />} />
              <Route path="seo/audit" element={<DailyAudit />} />
              <Route path="seo/analytics" element={<SEOAnalytics />} />
              <Route path="seo/keywords" element={<KeywordResearch />} />
              <Route path="seo/sitemap" element={<SitemapManager />} />
              <Route path="seo/robots" element={<RobotsManager />} />
              <Route path="seo/backlinks" element={<BacklinkManager />} />
              <Route path="seo/competitors" element={<CompetitorAnalysis />} />
              <Route path="seo/content" element={<ContentOptimizer />} />
              <Route path="seo/mobile" element={<MobileSEOTester />} />
              <Route path="seo/speed" element={<PageSpeedAnalyzer />} />
              
              {/* 推荐管理 */}
              <Route path="recommendations" element={<RecommendationManager />} />
              
              {/* 权限管理 */}
              <Route path="admins" element={<AdminList />} />
              <Route path="roles" element={<RoleList />} />
              <Route path="logs" element={<OperationLog />} />
              
              {/* 系统设置 */}
              <Route path="settings/basic" element={<BasicSettings />} />
              <Route path="settings/pages" element={<PageContent />} />
            </Route>
            
            {/* 捕获未匹配的路由，重定向到登录页 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;

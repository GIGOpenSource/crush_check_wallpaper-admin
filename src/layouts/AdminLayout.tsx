import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, theme, Drawer, message, Popconfirm } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  PictureOutlined,
  TagsOutlined,
  CommentOutlined,
  BellOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  RiseOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/userApi';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据概览',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: 'wallpaper',
      icon: <PictureOutlined />,
      label: '壁纸管理',
      children: [
        { key: '/wallpapers', label: '壁纸列表' },
        { key: '/wallpapers/audit', label: '壁纸审核' },
      ],
    },
    {
      key: 'tag',
      icon: <TagsOutlined />,
      label: '标签管理',
      children: [
        { key: '/tags', label: '标签列表' },
        // { key: '/tags/navigation', label: '导航标签' },
      ],
    },
    {
      key: 'content',
      icon: <CommentOutlined />,
      label: '内容管理',
      children: [
        { key: '/comments', label: '评论管理' },
        // { key: '/reports', label: '举报处理' },
      ],
    },
    {
      key: 'notification',
      icon: <BellOutlined />,
      label: '通知管理',
      children: [
        { key: '/notifications', label: '通知列表' },
        { key: '/notifications/send', label: '发送通知' },
      ],
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: '数据统计',
      children: [
        { key: '/statistics', label: '综合统计' },
        { key: '/statistics/pages', label: '页面类型统计' },
      ],
    },
    {
      key: 'seo',
      icon: <RiseOutlined />,
      label: 'SEO管理',
      children: [
        // { key: '/seo', label: 'SEO仪表盘' },
        { key: '/seo/technical', label: '技术优化' },
        { key: '/seo/tdk', label: 'TDK管理' },
        { key: '/seo/audit', label: '日常巡查' },
        { key: '/seo/analytics', label: '数据分析' },
        { key: '/seo/keywords', label: '关键词挖掘' },
        { key: '/seo/sitemap', label: 'Sitemap管理' },
        { key: '/seo/robots', label: 'Robots.txt' },
        { key: '/seo/backlinks', label: '外链管理' },
        { key: '/seo/competitors', label: '竞争对手' },
        { key: '/seo/content', label: '内容优化' },
        { key: '/seo/mobile', label: '移动端检测' },
        { key: '/seo/speed', label: '页面速度' },
      ],
    },
    {
      key: 'recommendation',
      icon: <StarOutlined />,
      label: '推荐管理',
      children: [
        { key: '/recommendations', label: '推荐内容' },
      ],
    },
    {
      key: 'permission',
      icon: <TeamOutlined />,
      label: '权限管理',
      children: [
        { key: '/admins', label: '管理员' },
        { key: '/roles', label: '角色管理' },
        { key: '/logs', label: '操作日志' },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        { key: '/settings/basic', label: '基础设置' },
        { key: '/settings/pages', label: '页面内容' },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
    },
  ];

  // 退出登录处理函数
  const handleLogout = async () => {
    try {
      // 调用退出登录接口
      await logout();
      
      // 清除本地存储的认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
      message.success('退出登录成功');
      
      // 跳转到登录页
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使接口调用失败，也清除本地信息并跳转
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      navigate('/login', { replace: true });
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'settings') {
      navigate('/settings');
    }
  };

  const getSelectedKeys = () => {
    const pathname = location.pathname;
    return [pathname];
  };

  const getOpenKeys = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/wallpapers')) return ['wallpaper'];
    if (pathname.startsWith('/tags')) return ['tag'];
    if (pathname.startsWith('/comments') || pathname.startsWith('/reports')) return ['content'];
    if (pathname.startsWith('/notifications')) return ['notification'];
    if (pathname.startsWith('/statistics')) return ['statistics'];
    if (pathname.startsWith('/seo')) return ['seo'];
    if (pathname.startsWith('/admins') || pathname.startsWith('/roles') || pathname.startsWith('/logs')) return ['permission'];
    if (pathname.startsWith('/settings')) return ['settings'];
    return [];
  };

  // 侧边栏菜单内容
  const renderMenu = () => (
    <>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 20 : (collapsed ? 16 : 20),
            fontWeight: 600,
            color: '#1890ff',
          }}
        >
          {isMobile ? '壁纸管理后台' : (collapsed ? 'WP' : '壁纸管理后台')}
        </h1>
      </div>
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={({ key }) => {
          handleMenuClick({ key });
          if (isMobile) {
            setMobileDrawerOpen(false);
          }
        }}
        style={{ borderRight: 0 }}
      />
    </>
  );

  // 计算侧边栏宽度
  const siderWidth = isMobile ? 0 : (collapsed ? 80 : 200);

  return (
    <Layout style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="light"
          width={200}
          collapsedWidth={80}
          style={{
            boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          {renderMenu()}
        </Sider>
      )}

      {/* 移动端抽屉菜单 */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={true}
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={250}
          bodyStyle={{ padding: 0 }}
        >
          {renderMenu()}
        </Drawer>
      )}
      <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s', minWidth: 0 }}>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            position: 'fixed',
            top: 0,
            right: 0,
            left: siderWidth,
            zIndex: 99,
            transition: 'left 0.2s',
            width: 'auto',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>管理员</span>
              </div>
            </Dropdown>
            {/* 退出登录按钮 - 使用 Popconfirm */}
            <Popconfirm
              title="确认退出"
              description="确定要退出登录吗？"
              onConfirm={handleLogout}
              okText="确定退出"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" icon={<LogoutOutlined />} style={{ color: '#ff4d4f' }}>
                退出
              </Button>
            </Popconfirm>
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? 12 : 24,
            marginTop: 64 + (isMobile ? 12 : 24),
            padding: isMobile ? 16 : 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
            overflowX: 'hidden',
            minHeight: 'calc(100vh - 112px)',
            width: 'auto',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
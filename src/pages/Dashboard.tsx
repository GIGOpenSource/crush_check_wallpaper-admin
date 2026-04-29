import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, List, Avatar, Divider, Spin, Button, message, Select } from 'antd';
import { UserOutlined, PictureOutlined, EyeOutlined, DownloadOutlined, LikeOutlined, StarOutlined, RiseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { 
  getDashboardStats, 
  getHotWallpapers, 
  getRecentUsers,
  getWallpaperCategoryDistribution,
  getUserGrowthTrend,
  type DashboardStats,
  type HotWallpaper,
  type RecentUser,
  type WallpaperCategoryDistribution
} from '../services/dashboardApi';

interface StatsData {
  total_users: number;
  total_wallpapers: number;
  total_views: number;
  total_downloads: number;
  total_likes: number;
  total_collection: number;
  daily_active_users?: number;
  weekly_active_users?: number;
  new_users_today?: number;
  new_wallpapers_today?: number;
  new_daily_active_users?: number;
  new_weekly_active_users?: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hotWallpapers, setHotWallpapers] = useState<HotWallpaper[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [categoryData, setCategoryData] = useState<WallpaperCategoryDistribution[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [days, setDays] = useState<number>(7);

  // 加载Dashboard统计数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResponse, wallpapersResponse, usersResponse, categoryResponse, userGrowthResponse] = await Promise.all([
        getDashboardStats(),
        getHotWallpapers(),
        getRecentUsers(),
        getWallpaperCategoryDistribution(),
        getUserGrowthTrend(days),
      ]);
      
      setStats(statsResponse);
      setHotWallpapers(wallpapersResponse.results || []);
      setRecentUsers(usersResponse.results || []);
      
      // 转换饼图数据格式
      console.log('饼图原始响应:', categoryResponse);
      if (categoryResponse && Array.isArray(categoryResponse)) {
        console.log('饼图数据数组:', categoryResponse);
        // 计算总数
        const total = categoryResponse.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
        console.log('饼图总数:', total);
        // 转换为饼图需要的格式
        const transformedData = categoryResponse.map((item: any) => ({
          category_name: item.category_name,
          percentage: total > 0 ? ((item.count / total) * 100) : 0,
          count: item.count,
        }));
        console.log('饼图转换后数据:', transformedData);
        setCategoryData(transformedData);
      }
      
      // 转换用户增长趋势数据格式
      console.log('折线图原始响应:', userGrowthResponse);
      if (userGrowthResponse && Array.isArray(userGrowthResponse)) {
        console.log('折线图数据数组:', userGrowthResponse);
        const transformedGrowthData = userGrowthResponse.map((item: any) => ({
          date: item.date,
          value: item.new_users || 0,
        }));
        console.log('折线图转换后数据:', transformedGrowthData);
        setUserGrowthData(transformedGrowthData);
      }
    } catch (error) {
      console.error('加载Dashboard数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const lineConfig = useMemo(() => ({
    data: userGrowthData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    height: 300,
    color: '#1890ff',
    point: {
      size: 5,
      shape: 'circle',
    },
  }), [userGrowthData]);

  const totalCategoryValue = categoryData.reduce((sum, d) => sum + ((d as any).count || 0), 0);

  const pieConfig = useMemo(() => ({
    data: categoryData,
    angleField: 'percentage',
    colorField: 'category_name',
    radius: 0.8,
    height: 300,
    label: {
      type: 'outer',
      text: (item: any) => {
        return `${item.category_name} ${item.percentage.toFixed(1)}%`;
      },
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
  }), [categoryData]);

  const hotColumns = [
    { 
      title: '排名', 
      dataIndex: 'rank', 
      key: 'rank', 
      width: 60, 
      render: (_: any, __: any, index: number) => index + 1 
    },
    { 
      title: '壁纸名称', 
      dataIndex: 'name', 
      key: 'name', 
      ellipsis: true,
      render: (text: string) => text || '--'
    },
    { 
      title: '浏览量', 
      dataIndex: 'view_count', 
      key: 'view_count', 
      sorter: (a: HotWallpaper, b: HotWallpaper) => a.view_count - b.view_count,
      render: (value: number) => value || 0
    },
    { 
      title: '下载量', 
      dataIndex: 'download_count', 
      key: 'download_count',
      render: (value: number) => value || 0
    },
    { 
      title: '热度', 
      dataIndex: 'hot_score', 
      key: 'hot_score',
      render: (value: number) => value || 0
    },
  ];

  const userColumns = [
    { 
      title: '用户名', 
      dataIndex: 'nickname', 
      key: 'nickname', 
      ellipsis: true,
      render: (text: string) => text || '--'
    },
    { 
      title: '邮箱', 
      dataIndex: 'email', 
      key: 'email', 
      ellipsis: true,
      render: (text: string) => text || '--'
    },
    { 
      title: '注册时间', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      width: 180,
      render: (text: string) => {
        if (!text) return '--';
        const date = new Date(text);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-');
      }
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return <div>加载失败或未获取到数据</div>;
  }

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>数据概览</h2>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={async () => {
              try {
                setLoading(true);
                await loadDashboardData();
                message.success('刷新成功');
              } catch (error) {
                message.error('刷新失败');
              }
            }}
          >
            刷新
          </Button>
        </div>
        
        {/* 核心数据指标 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats?.total_users || 0}
                prefix={<UserOutlined />}
                suffix={<Tag color="success">+{stats?.new_users_today || 0} 今日</Tag>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总壁纸数"
                value={stats?.total_wallpapers || 0}
                prefix={<PictureOutlined />}
                suffix={<Tag color="success">+{stats?.new_wallpapers_today || 0} 今日</Tag>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总浏览量"
                value={stats?.total_views || 0}
                prefix={<EyeOutlined />}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总下载量"
                value={stats?.total_downloads || 0}
                prefix={<DownloadOutlined />}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总点赞数"
                value={stats?.total_likes || 0}
                prefix={<LikeOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总收藏数"
                value={stats?.total_collection || 0}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="日活跃用户"
                value={stats?.daily_active_users || 0}
                prefix={<RiseOutlined />}
                suffix={<Tag color="processing">+{stats?.new_daily_active_users || 0}</Tag>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="周活跃用户"
                value={stats?.weekly_active_users || 0}
                prefix={<RiseOutlined />}
                suffix={<Tag color="processing">+{stats?.new_weekly_active_users || 0}</Tag>}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="用户增长趋势">
              <Select
                style={{ width: 120, marginBottom: 16 }}
                value={days}
                onChange={async (value) => {
                  setDays(value);
                  try {
                    setLoading(true);
                    const response = await getUserGrowthTrend(value);
                    console.log('折线图切换天数响应:', response);
                    if (response && Array.isArray(response)) {
                      const transformedGrowthData = response.map((item: any) => ({
                        date: item.date,
                        value: item.new_users || 0,
                      }));
                      console.log('折线图切换天数转换后:', transformedGrowthData);
                      setUserGrowthData(transformedGrowthData);
                    }
                  } catch (error) {
                    console.error('加载用户增长趋势数据失败:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                options={[
                  { value: 7, label: '最近7天' },
                  { value: 14, label: '最近14天' },
                  { value: 30, label: '最近30天' },
                  { value: 90, label: '最近90天' },
                ]}
              />
              <Line {...lineConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="壁纸分类分布">
              <Pie {...pieConfig} />
            </Card>
          </Col>
        </Row>

        {/* 列表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="热门壁纸 TOP5">
              <Table
                dataSource={hotWallpapers}
                columns={hotColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="最新注册用户">
              <Table
                dataSource={recentUsers}
                columns={userColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>

  );
};

export default Dashboard;

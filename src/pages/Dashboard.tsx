import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Table, List, Avatar, Tag } from 'antd';
import {
  UserOutlined,
  PictureOutlined,
  EyeOutlined,
  DownloadOutlined,
  LikeOutlined,
  StarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';

interface StatsData {
  totalUsers: number;
  todayNewUsers: number;
  totalWallpapers: number;
  todayNewWallpapers: number;
  totalViews: number;
  totalDownloads: number;
  totalLikes: number;
  totalCollections: number;
}

const Dashboard: React.FC = () => {
  const [stats] = useState<StatsData>({
    totalUsers: 12580,
    todayNewUsers: 128,
    totalWallpapers: 45620,
    todayNewWallpapers: 45,
    totalViews: 1256800,
    totalDownloads: 456800,
    totalLikes: 234500,
    totalCollections: 189200,
  });

  // 用户增长趋势数据
  const userGrowthData = [
    { date: '2026-04-10', value: 120 },
    { date: '2026-04-11', value: 132 },
    { date: '2026-04-12', value: 101 },
    { date: '2026-04-13', value: 134 },
    { date: '2026-04-14', value: 90 },
    { date: '2026-04-15', value: 230 },
    { date: '2026-04-16', value: 210 },
  ];

  // 壁纸分类分布数据
  const categoryData = [
    { type: 'PC壁纸', value: 18600 },
    { type: '手机壁纸', value: 22400 },
    { type: '静态壁纸', value: 34200 },
    { type: '动态壁纸', value: 6800 },
  ];

  // 热门壁纸数据
  const hotWallpapers = [
    { id: 1, title: '4K星空壁纸', views: 12500, downloads: 3400, likes: 890 },
    { id: 2, title: '动漫风景', views: 11200, downloads: 2900, likes: 756 },
    { id: 3, title: '极简风格', views: 9800, downloads: 2100, likes: 623 },
    { id: 4, title: '游戏截图', views: 8700, downloads: 1800, likes: 534 },
    { id: 5, title: '自然风光', views: 7600, downloads: 1500, likes: 445 },
  ];

  // 最新用户数据
  const newUsers = [
    { id: 1, email: 'user1@example.com', nickname: '用户1', avatar: '', time: '2026-04-17 10:30' },
    { id: 2, email: 'user2@example.com', nickname: '用户2', avatar: '', time: '2026-04-17 10:25' },
    { id: 3, email: 'user3@example.com', nickname: '用户3', avatar: '', time: '2026-04-17 10:20' },
    { id: 4, email: 'user4@example.com', nickname: '用户4', avatar: '', time: '2026-04-17 10:15' },
    { id: 5, email: 'user5@example.com', nickname: '用户5', avatar: '', time: '2026-04-17 10:10' },
  ];

  const lineConfig = {
    data: userGrowthData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    height: 300,
    color: '#1890ff',
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
  };

  const pieConfig = {
    data: categoryData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    height: 300,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
  };

  const hotColumns = [
    { title: '排名', dataIndex: 'id', key: 'id', width: 60 },
    { title: '壁纸名称', dataIndex: 'title', key: 'title' },
    { title: '浏览量', dataIndex: 'views', key: 'views', sorter: (a: {views: number}, b: {views: number}) => a.views - b.views },
    { title: '下载量', dataIndex: 'downloads', key: 'downloads' },
    { title: '点赞数', dataIndex: 'likes', key: 'likes' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据概览</h2>
      
      {/* 核心数据指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              suffix={<Tag color="success">+{stats.todayNewUsers} 今日</Tag>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总壁纸数"
              value={stats.totalWallpapers}
              prefix={<PictureOutlined />}
              suffix={<Tag color="success">+{stats.todayNewWallpapers} 今日</Tag>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总浏览量"
              value={stats.totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总下载量"
              value={stats.totalDownloads}
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
              value={stats.totalLikes}
              prefix={<LikeOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总收藏数"
              value={stats.totalCollections}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="日活跃用户"
              value={3456}
              prefix={<RiseOutlined />}
              suffix={<Tag color="processing">+12.5%</Tag>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="周活跃用户"
              value={12345}
              prefix={<RiseOutlined />}
              suffix={<Tag color="processing">+8.3%</Tag>}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="用户增长趋势">
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
            <List
              itemLayout="horizontal"
              dataSource={newUsers}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.nickname}
                    description={item.email}
                  />
                  <div>{item.time}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

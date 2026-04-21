import React from 'react';
import { Card, Table, Tag, Progress, Row, Col, Statistic } from 'antd';
import { DesktopOutlined, MobileOutlined, GlobalOutlined, FileTextOutlined } from '@ant-design/icons';

interface PageType {
  id: number;
  pageName: string;
  pagePath: string;
  pageType: 'desktop' | 'mobile' | 'responsive' | 'hybrid';
  visitCount: number;
  avgStayTime: string;
  bounceRate: number;
  seoScore: number;
  lastUpdate: string;
  status: 'active' | 'inactive';
}

const PageTypeStatistics: React.FC = () => {
  // 模拟页面类型统计数据
  const pageData: PageType[] = [
    {
      id: 1,
      pageName: '首页',
      pagePath: '/',
      pageType: 'responsive',
      visitCount: 45680,
      avgStayTime: '2分35秒',
      bounceRate: 35.2,
      seoScore: 92,
      lastUpdate: '2026-04-15',
      status: 'active',
    },
    {
      id: 2,
      pageName: '壁纸详情页',
      pagePath: '/wallpaper/:id',
      pageType: 'responsive',
      visitCount: 38920,
      avgStayTime: '3分12秒',
      bounceRate: 28.5,
      seoScore: 88,
      lastUpdate: '2026-04-14',
      status: 'active',
    },
    {
      id: 3,
      pageName: '搜索页',
      pagePath: '/search',
      pageType: 'responsive',
      visitCount: 21560,
      avgStayTime: '1分48秒',
      bounceRate: 42.3,
      seoScore: 85,
      lastUpdate: '2026-04-13',
      status: 'active',
    },
    {
      id: 4,
      pageName: '个人中心',
      pagePath: '/profile',
      pageType: 'responsive',
      visitCount: 12890,
      avgStayTime: '2分05秒',
      bounceRate: 38.7,
      seoScore: 78,
      lastUpdate: '2026-04-12',
      status: 'active',
    },
    {
      id: 5,
      pageName: '标签列表页',
      pagePath: '/tags',
      pageType: 'desktop',
      visitCount: 8760,
      avgStayTime: '1分25秒',
      bounceRate: 45.2,
      seoScore: 82,
      lastUpdate: '2026-04-10',
      status: 'active',
    },
    {
      id: 6,
      pageName: '上传页',
      pagePath: '/upload',
      pageType: 'responsive',
      visitCount: 6540,
      avgStayTime: '4分20秒',
      bounceRate: 22.1,
      seoScore: 75,
      lastUpdate: '2026-04-08',
      status: 'active',
    },
    {
      id: 7,
      pageName: '登录页',
      pagePath: '/login',
      pageType: 'responsive',
      visitCount: 12340,
      avgStayTime: '0分45秒',
      bounceRate: 65.8,
      seoScore: 70,
      lastUpdate: '2026-04-05',
      status: 'active',
    },
    {
      id: 8,
      pageName: '设置页',
      pagePath: '/settings',
      pageType: 'mobile',
      visitCount: 4320,
      avgStayTime: '1分55秒',
      bounceRate: 40.5,
      seoScore: 72,
      lastUpdate: '2026-04-01',
      status: 'inactive',
    },
  ];

  // 页面类型分布统计
  const typeStats = [
    { type: 'responsive', name: '响应式', count: 5, icon: <GlobalOutlined />, color: '#1890ff' },
    { type: 'desktop', name: '桌面端', count: 1, icon: <DesktopOutlined />, color: '#52c41a' },
    { type: 'mobile', name: '移动端', count: 1, icon: <MobileOutlined />, color: '#faad14' },
    { type: 'hybrid', name: '混合式', count: 1, icon: <FileTextOutlined />, color: '#722ed1' },
  ];

  const getPageTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      desktop: { color: 'blue', text: '桌面端' },
      mobile: { color: 'orange', text: '移动端' },
      responsive: { color: 'green', text: '响应式' },
      hybrid: { color: 'purple', text: '混合式' },
    };
    const { color, text } = typeMap[type] || { color: 'default', text: type };
    return <Tag color={color}>{text}</Tag>;
  };

  const getSeoProgress = (score: number) => {
    let status: 'success' | 'normal' | 'exception' = 'normal';
    if (score >= 90) status = 'success';
    else if (score >= 70) status = 'normal';
    else status = 'exception';
    return <Progress percent={score} size="small" status={status} />;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '页面名称',
      dataIndex: 'pageName',
      key: 'pageName',
    },
    {
      title: '页面路径',
      dataIndex: 'pagePath',
      key: 'pagePath',
      render: (path: string) => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{path}</code>,
    },
    {
      title: '页面类型',
      dataIndex: 'pageType',
      key: 'pageType',
      render: (type: string) => getPageTypeTag(type),
      filters: [
        { text: '响应式', value: 'responsive' },
        { text: '桌面端', value: 'desktop' },
        { text: '移动端', value: 'mobile' },
        { text: '混合式', value: 'hybrid' },
      ],
      onFilter: (value: React.Key | boolean, record: PageType) => record.pageType === value,
    },
    {
      title: '访问量',
      dataIndex: 'visitCount',
      key: 'visitCount',
      sorter: (a: PageType, b: PageType) => a.visitCount - b.visitCount,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '平均停留',
      dataIndex: 'avgStayTime',
      key: 'avgStayTime',
    },
    {
      title: '跳出率',
      dataIndex: 'bounceRate',
      key: 'bounceRate',
      sorter: (a: PageType, b: PageType) => a.bounceRate - b.bounceRate,
      render: (rate: number) => `${rate}%`,
    },
    {
      title: 'SEO评分',
      dataIndex: 'seoScore',
      key: 'seoScore',
      sorter: (a: PageType, b: PageType) => a.seoScore - b.seoScore,
      render: (score: number) => getSeoProgress(score),
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      sorter: (a: PageType, b: PageType) => new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>前端页面类型统计</h2>

      {/* 页面类型分布卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {typeStats.map((stat) => (
          <Col xs={12} sm={12} lg={6} key={stat.type}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 24,
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#666' }}>{stat.name}</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{stat.count} 个</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总页面数" value={pageData.length} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总访问量" value={pageData.reduce((sum, p) => sum + p.visitCount, 0).toLocaleString()} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="平均SEO评分" value={(pageData.reduce((sum, p) => sum + p.seoScore, 0) / pageData.length).toFixed(1)} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="平均跳出率" value={`${(pageData.reduce((sum, p) => sum + p.bounceRate, 0) / pageData.length).toFixed(1)}%`} />
          </Card>
        </Col>
      </Row>

      {/* 详细表格 */}
      <Card title="页面详细统计">
        <Table
          columns={columns}
          dataSource={pageData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个页面`,
          }}
        />
      </Card>
    </div>
  );
};

export default PageTypeStatistics;

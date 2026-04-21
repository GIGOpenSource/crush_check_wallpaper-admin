import React, { useState } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, message, Alert, Statistic, Row, Col, Progress, Breadcrumb, Avatar } from 'antd';
import { PlusOutlined, EyeOutlined, RiseOutlined, FallOutlined, TrophyOutlined } from '@ant-design/icons';

interface Competitor {
  id: number;
  domain: string;
  name: string;
  traffic: number;
  keywords: number;
  backlinks: number;
  authority: number;
  growth: number;
  topKeywords: string[];
}

interface KeywordGap {
  keyword: string;
  ourRank: number | null;
  competitorRank: number;
  searchVolume: number;
  difficulty: number;
}

const CompetitorAnalysis: React.FC = () => {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [gapModalVisible, setGapModalVisible] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // 竞争对手数据
  const competitors: Competitor[] = [
    {
      id: 1,
      domain: 'wallpaperhub.com',
      name: 'Wallpaper Hub',
      traffic: 1250000,
      keywords: 28500,
      backlinks: 45000,
      authority: 78,
      growth: 12.5,
      topKeywords: ['4k wallpaper', 'hd wallpaper', 'anime wallpaper'],
    },
    {
      id: 2,
      domain: 'unsplash.com',
      name: 'Unsplash',
      traffic: 8500000,
      keywords: 45600,
      backlinks: 120000,
      authority: 92,
      growth: 8.3,
      topKeywords: ['free photos', 'stock images', 'nature wallpaper'],
    },
    {
      id: 3,
      domain: 'pexels.com',
      name: 'Pexels',
      traffic: 3200000,
      keywords: 32400,
      backlinks: 85000,
      authority: 88,
      growth: -2.1,
      topKeywords: ['free wallpaper', 'mobile wallpaper', 'hd background'],
    },
  ];

  // 关键词差距数据
  const keywordGaps: KeywordGap[] = [
    { keyword: '4k wallpaper download', ourRank: 15, competitorRank: 3, searchVolume: 185000, difficulty: 65 },
    { keyword: 'hd wallpaper for pc', ourRank: 8, competitorRank: 2, searchVolume: 148000, difficulty: 58 },
    { keyword: 'anime wallpaper 4k', ourRank: 12, competitorRank: 5, searchVolume: 256000, difficulty: 72 },
    { keyword: 'nature wallpaper hd', ourRank: null, competitorRank: 4, searchVolume: 95000, difficulty: 45 },
    { keyword: 'mobile wallpaper hd', ourRank: 6, competitorRank: 1, searchVolume: 167000, difficulty: 62 },
  ];

  const columns = [
    {
      title: '网站',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Competitor) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>{text[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.domain}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '域名权重',
      dataIndex: 'authority',
      key: 'authority',
      width: 120,
      render: (score: number) => (
        <Progress percent={score} size="small" strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d'} />
      ),
    },
    {
      title: '月流量',
      dataIndex: 'traffic',
      key: 'traffic',
      width: 120,
      render: (v: number) => `${(v / 10000).toFixed(1)}万`,
    },
    {
      title: '关键词数',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 100,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '外链数',
      dataIndex: 'backlinks',
      key: 'backlinks',
      width: 100,
      render: (v: number) => `${(v / 1000).toFixed(1)}K`,
    },
    {
      title: '增长趋势',
      dataIndex: 'growth',
      key: 'growth',
      width: 100,
      render: (growth: number) => (
        <Tag color={growth >= 0 ? 'success' : 'error'} icon={growth >= 0 ? <RiseOutlined /> : <FallOutlined />}>
          {growth >= 0 ? '+' : ''}{growth}%
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Competitor) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" onClick={() => handleAnalyzeGap(record)}>关键词差距</Button>
          <Button type="link" danger onClick={() => message.success('已删除')}>删除</Button>
        </Space>
      ),
    },
  ];

  const gapColumns = [
    { title: '关键词', dataIndex: 'keyword', key: 'keyword' },
    {
      title: '我们的排名',
      dataIndex: 'ourRank',
      key: 'ourRank',
      render: (rank: number | null) => rank ? <Tag color={rank <= 10 ? 'success' : 'warning'}>#{rank}</Tag> : <Tag>未排名</Tag>,
    },
    {
      title: '对手排名',
      dataIndex: 'competitorRank',
      key: 'competitorRank',
      render: (rank: number) => <Tag color="blue">#{rank}</Tag>,
    },
    { title: '搜索量', dataIndex: 'searchVolume', key: 'searchVolume', render: (v: number) => v.toLocaleString() },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (v: number) => <Progress percent={v} size="small" status={v > 60 ? 'exception' : 'normal'} />,
    },
  ];

  const handleViewDetail = (record: Competitor) => {
    setSelectedCompetitor(record);
    message.info(`查看 ${record.name} 的详细信息`);
  };

  const handleAnalyzeGap = (record: Competitor) => {
    setSelectedCompetitor(record);
    setAnalyzing(true);
    setGapModalVisible(true);
    
    setTimeout(() => {
      setAnalyzing(false);
    }, 1000);
  };

  const handleAdd = () => {
    form.validateFields().then(() => {
      message.success('竞争对手添加成功');
      setAddModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>SEO管理</Breadcrumb.Item>
        <Breadcrumb.Item>竞争对手分析</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="监控竞争对手" value={competitors.length} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="关键词差距" value={128} suffix="个" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="外链差距" value={3500} suffix="个" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="平均权重" value={86} suffix="分" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="竞争对手列表"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索竞争对手"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
              添加竞争对手
            </Button>
          </Space>
        }
      >
        <Alert
          message="竞争对手分析说明"
          description="分析竞争对手的SEO策略，发现关键词差距和外链机会，制定更有针对性的优化方案。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table columns={columns} dataSource={competitors} rowKey="id" />
      </Card>

      {/* 添加竞争对手弹窗 */}
      <Modal
        title="添加竞争对手"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="domain" label="网站域名" rules={[{ required: true }]}>
            <Input placeholder="example.com" />
          </Form.Item>
          <Form.Item name="name" label="网站名称" rules={[{ required: true }]}>
            <Input placeholder="网站名称" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="添加备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 关键词差距分析弹窗 */}
      <Modal
        title={`关键词差距分析 - ${selectedCompetitor?.name}`}
        open={gapModalVisible}
        onCancel={() => setGapModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setGapModalVisible(false)}>关闭</Button>,
        ]}
      >
        {analyzing ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Progress percent={50} status="active" />
            <p>正在分析关键词差距...</p>
          </div>
        ) : (
          <>
            <Alert
              message="分析结果"
              description={`发现 ${keywordGaps.length} 个关键词差距机会，建议优先优化搜索量高且难度适中的关键词。`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table columns={gapColumns} dataSource={keywordGaps} rowKey="keyword" pagination={{ pageSize: 5 }} />
          </>
        )}
      </Modal>
    </div>
  );
};

export default CompetitorAnalysis;

import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, message, Alert, Statistic, Row, Col, Progress, Breadcrumb, Avatar, Spin, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, RiseOutlined, FallOutlined, TrophyOutlined, DeleteOutlined } from '@ant-design/icons';
import { competitorApi, type CompetitorItem, type CompetitorStatistics as CompetitorStatisticsType, type KeywordGapItem } from '../../services/competitorApi';

interface Competitor {
  id: number;
  name: string;
  url: string;
  domain_authority: number;
  backlink_count: number;
  keyword_count: number;
  monthly_traffic: number;
  growth_trend: string;
  growth_trend_display: string;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
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
  const [statistics, setStatistics] = useState<CompetitorStatisticsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [keywordGaps, setKeywordGaps] = useState<KeywordGap[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [tableLoading, setTableLoading] = useState(false);

  // 获取竞争对手统计数据
  useEffect(() => {
    fetchStatistics();
    fetchCompetitorList();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await competitorApi.getCompetitorStatistics();
      if (response.code === 200 || response.code === 201) {
        setStatistics(response.data);
      } else {
        message.error(response.message || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取竞争对手统计数据失败:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取竞争对手列表
  const fetchCompetitorList = async (page = 1, pageSize = 10, name = '') => {
    setTableLoading(true);
    try {
      const response = await competitorApi.getCompetitorList({
        currentPage: page,
        pageSize: pageSize,
        name: name || undefined,
      });
      
      if (response.code === 200 || response.code === 201) {
        const data = response.data;
        // 直接使用后端返回的数据，不做额外转换
        setCompetitors(data.results || []);
        setPagination({
          current: data.pagination?.page || data.page || page,
          pageSize: data.pagination?.page_size || data.pageSize || pageSize,
          total: data.pagination?.total || data.total || 0,
        });
      } else {
        message.error(response.message || '获取竞争对手列表失败');
      }
    } catch (error) {
      console.error('获取竞争对手列表失败:', error);
      message.error('获取竞争对手列表失败');
    } finally {
      setTableLoading(false);
    }
  };

  // 处理分页变化
  const handleTableChange = (newPagination: any) => {
    fetchCompetitorList(newPagination.current, newPagination.pageSize, searchText);
  };

  // 处理搜索
  const handleSearch = () => {
    fetchCompetitorList(1, pagination.pageSize, searchText);
  };

  // 处理重置
  const handleReset = () => {
    setSearchText('');
    fetchCompetitorList(1, pagination.pageSize, '');
  };

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
            <div style={{ fontSize: 12, color: '#999' }}>{record.url}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '域名权重',
      dataIndex: 'domain_authority',
      key: 'domain_authority',
      width: 120,
      render: (score: number) => (
        <Progress percent={score || 0} size="small" strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d'} />
      ),
    },
    {
      title: '月流量',
      dataIndex: 'monthly_traffic',
      key: 'monthly_traffic',
      width: 120,
      render: (v: number) => v ? `${((v || 0) / 10000).toFixed(1)}万` : '--',
    },
    {
      title: '关键词数',
      dataIndex: 'keyword_count',
      key: 'keyword_count',
      width: 100,
      render: (v: number) => (v || 0).toLocaleString(),
    },
    {
      title: '外链数',
      dataIndex: 'backlink_count',
      key: 'backlink_count',
      width: 100,
      render: (v: number) => v ? `${((v || 0) / 1000).toFixed(1)}K` : '--',
    },
    {
      title: '增长趋势',
      dataIndex: 'growth_trend',
      key: 'growth_trend',
      width: 100,
      render: (trend: string, record: Competitor) => {
        const trendMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          up: { color: 'success', icon: <RiseOutlined />, text: '增长' },
          stable: { color: 'warning', icon: null, text: '稳定' },
          down: { color: 'error', icon: <FallOutlined />, text: '下降' },
        };
        const trendInfo = trendMap[trend] || { color: 'default', icon: null, text: record.growth_trend_display || '--' };
        return (
          <Tag color={trendInfo.color} icon={trendInfo.icon}>
            {trendInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Competitor) => (
        <Space>
          <Button type="link" onClick={() => handleAnalyzeGap(record)}>关键词差距</Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除竞争对手 "${record.name}" 吗？此操作不可撤销。`}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
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

  const handleAnalyzeGap = async (record: Competitor) => {
    setSelectedCompetitor(record);
    setAnalyzing(true);
    setGapModalVisible(true);
    
    try {
      const response = await competitorApi.getKeywordGap(record.id);
      
      if (response.code === 200 || response.code === 201) {
        // 从 response.data.keyword_gaps 中获取数组数据
        const keywordGapsData = response.data?.keyword_gaps || [];
        const gaps: KeywordGap[] = Array.isArray(keywordGapsData) ? keywordGapsData.map((item: KeywordGapItem) => ({
          keyword: item.keyword,
          ourRank: item.our_ranking,
          competitorRank: item.competitor_ranking,
          searchVolume: item.our_search_volume,
          difficulty: item.difficulty,
        })) : [];
        setKeywordGaps(gaps);
      } else {
        message.error(response.message || '获取关键词差距失败');
        setKeywordGaps([]);
      }
    } catch (error) {
      console.error('获取关键词差距失败:', error);
      message.error('获取关键词差距失败');
      setKeywordGaps([]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const response = await competitorApi.addCompetitor({
        name: values.name,
        url: values.url,
      });
      
      if (response.code === 200 || response.code === 201) {
        message.success(response.message || '竞争对手添加成功');
        setAddModalVisible(false);
        form.resetFields();
        // 刷新列表和统计数据
        fetchCompetitorList();
        fetchStatistics();
      } else {
        message.error(response.message || '添加失败');
      }
    } catch (error) {
      console.error('添加竞争对手失败:', error);
      message.error('添加竞争对手失败');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      const response = await competitorApi.deleteCompetitor(id);
      
      if (response.code === 200 || response.code === 201) {
        message.success(response.message || `已成功删除竞争对手：${name}`);
        // 刷新列表和统计数据
        fetchCompetitorList();
        fetchStatistics();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除竞争对手失败:', error);
      message.error('删除竞争对手失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb 
        style={{ marginBottom: 16 }}
        items={[
          { title: 'SEO管理' },
          { title: '竞争对手分析' },
        ]}
      />

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="监控竞争对手" 
                value={statistics?.total_count || 0} 
                prefix={<TrophyOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="总关键词数" 
                value={statistics?.total_keywords || 0} 
                suffix="个" 
                valueStyle={{ color: '#1890ff' }} 
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="总外链数" 
                value={statistics?.total_backlinks || 0} 
                suffix="个" 
                valueStyle={{ color: '#722ed1' }} 
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="月流量总计" 
                value={statistics?.total_monthly_traffic || 0} 
                suffix="PV" 
                valueStyle={{ color: '#3f8600' }} 
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Card
        title="竞争对手列表"
        extra={
          <Space>
            <Input
              placeholder="搜索竞争对手名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
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
        <Table 
          columns={columns} 
          dataSource={competitors} 
          rowKey="id" 
          loading={tableLoading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 添加竞争对手弹窗 */}
      <Modal
        title="添加竞争对手"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="网站名称" rules={[{ required: true, message: '请输入网站名称' }]}>
            <Input placeholder="例如：wallpapers" />
          </Form.Item>
          <Form.Item name="url" label="网站URL" rules={[
            { required: true, message: '请输入网站URL' },
            { type: 'url', message: '请输入有效的URL地址' }
          ]}>
            <Input placeholder="例如：https://4kwallpapers.com/" />
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
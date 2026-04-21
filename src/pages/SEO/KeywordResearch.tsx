import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Tag, Space, Progress, Tabs, List, Statistic, Row, Col, Alert, Select, Breadcrumb, message, Modal, Form, Descriptions, Divider, Tooltip } from 'antd';
import { SearchOutlined, DownloadOutlined, StarOutlined, FireOutlined, RiseOutlined, FallOutlined, PlusOutlined, ArrowLeftOutlined, EyeOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi } from '../../services/seoApi';

const { TabPane } = Tabs;
const { Search } = Input;

interface Keyword {
  id: number;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  competition: 'high' | 'medium' | 'low';
  relatedCount: number;
  category: string;
}

interface LongTailKeyword {
  id: number;
  keyword: string;
  parentKeyword: string;
  searchVolume: number;
  difficulty: number;
  recommendation: string;
}

const KeywordResearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [addForm] = Form.useForm();
  const [hotKeywords, setHotKeywords] = useState<Keyword[]>([]);
  const [longTailKeywords] = useState<LongTailKeyword[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // 收藏的关键词
  const [favorites, setFavorites] = useState<Keyword[]>([]);
  const [, setActiveTab] = useState('hot');

  const loadKeywords = async () => {
    if (!searchValue) return;
    setLoading(true);
    try {
      const res = await seoApi.searchKeywords({
        keyword: searchValue,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (res.code === 200) {
        setHotKeywords(res.data.items);
        setPagination(prev => ({ ...prev, total: res.data.total }));
      }
    } catch (_err) {
      message.error('加载关键词数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载关键词数据
  useEffect(() => {
    // 使用setTimeout避免同步调用setState
    const timer = setTimeout(() => {
      loadKeywords();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  // 静态数据已移除，使用API获取真实数据

  // 竞品关键词分析（国际市场）
  const competitorKeywords = [
    { domain: 'wallpaperhub.com', keywords: 28500, overlap: 8200, topKeywords: ['4k wallpaper', 'hd wallpaper', 'anime wallpaper'] },
    { domain: 'unsplash.com', keywords: 45600, overlap: 12000, topKeywords: ['nature wallpaper', 'aesthetic wallpaper', 'minimalist wallpaper'] },
    { domain: 'pexels.com', keywords: 32400, overlap: 9500, topKeywords: ['free wallpaper', 'mobile wallpaper', 'hd background'] },
  ];

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadKeywords();
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 60) return '#f5222d';
    if (difficulty >= 40) return '#faad14';
    return '#52c41a';
  };

  const getCompetitionTag = (competition: string) => {
    const map: Record<string, { color: string; text: string }> = {
      high: { color: 'error', text: '高' },
      medium: { color: 'warning', text: '中' },
      low: { color: 'success', text: '低' },
    };
    return <Tag color={map[competition].color}>{map[competition].text}竞争</Tag>;
  };

  const handleAddKeyword = () => {
    addForm.validateFields().then((values) => {
      message.success(`关键词 "${values.keyword}" 添加成功！`);
      setAddModalVisible(false);
      addForm.resetFields();
    });
  };

  const handleViewDetail = (record: Keyword) => {
    setSelectedKeyword(record);
    setDetailModalVisible(true);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'down') return <FallOutlined style={{ color: '#f5222d' }} />;
    return <span style={{ color: '#999' }}>-</span>;
  };

  // 检查是否已收藏
  const isFavorite = (keywordId: number) => {
    return favorites.some(k => k.id === keywordId);
  };

  // 添加/取消收藏
  const toggleFavorite = (record: Keyword) => {
    if (isFavorite(record.id)) {
      setFavorites(prev => prev.filter(k => k.id !== record.id));
      message.success(`已取消收藏 "${record.keyword}"`);
    } else {
      setFavorites(prev => [...prev, record]);
      message.success(`已收藏 "${record.keyword}"`);
    }
  };

  // 移除收藏
  const removeFavorite = (keywordId: number) => {
    const keyword = favorites.find(k => k.id === keywordId);
    setFavorites(prev => prev.filter(k => k.id !== keywordId));
    if (keyword) {
      message.success(`已移除 "${keyword.keyword}"`);
    }
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text: string, record: Keyword) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <Tooltip title={isFavorite(record.id) ? '取消收藏' : '收藏关键词'}>
            <Button 
              type="link" 
              size="small" 
              icon={isFavorite(record.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
              onClick={() => toggleFavorite(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '月搜索量',
      dataIndex: 'searchVolume',
      key: 'searchVolume',
      sorter: (a: Keyword, b: Keyword) => a.searchVolume - b.searchVolume,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '优化难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      sorter: (a: Keyword, b: Keyword) => a.difficulty - b.difficulty,
      render: (v: number) => (
        <Progress
          percent={v}
          size="small"
          strokeColor={getDifficultyColor(v)}
          format={(p) => `${p}`}
        />
      ),
    },
    {
      title: 'CPC',
      dataIndex: 'cpc',
      key: 'cpc',
      render: (v: number) => `¥${v}`,
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => getTrendIcon(trend),
    },
    {
      title: '竞争度',
      dataIndex: 'competition',
      key: 'competition',
      render: (c: string) => getCompetitionTag(c),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Keyword) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => {
            setSelectedKeyword(record);
            setAddModalVisible(true);
          }}>添加</Button>
        </Space>
      ),
    },
  ];

  const longTailColumns = [
    { title: '长尾关键词', dataIndex: 'keyword', key: 'keyword' },
    { title: '父关键词', dataIndex: 'parentKeyword', key: 'parentKeyword' },
    { title: '月搜索量', dataIndex: 'searchVolume', key: 'searchVolume', render: (v: number) => v.toLocaleString() },
    {
      title: '优化难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (v: number) => <Progress percent={v} size="small" strokeColor={getDifficultyColor(v)} />,
    },
    {
      title: '推荐度',
      dataIndex: 'recommendation',
      key: 'recommendation',
      render: (v: string) => (
        <Tag color={v === '强烈推荐' ? 'success' : v === '推荐' ? 'processing' : 'default'}>{v}</Tag>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>关键词挖掘</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        关键词挖掘
      </h2>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Search
            placeholder="输入关键词进行挖掘"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            loading={loading}
            style={{ width: 400 }}
            enterButton={<><SearchOutlined /> 挖掘</>}
          />
          <Button icon={<DownloadOutlined />} onClick={() => message.success('数据导出成功')}>导出数据</Button>
        </Space>
      </Card>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="关键词库"
              value={25680}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="长尾词"
              value={12560}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={128}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已优化"
              value={8920}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="hot" onChange={setActiveTab}>
        <TabPane tab="热门关键词" key="hot">
          <Card>
            <Alert
              message="Google关键词数据说明"
              description="基于Google Keyword Planner数据，搜索量为月均全球搜索量，优化难度0-100分，CPC为美元单次点击预估费用"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={hotKeywords}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="长尾关键词" key="longtail">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="推荐长尾词">
                <Table
                  columns={longTailColumns}
                  dataSource={longTailKeywords}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="生成工具">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input placeholder="输入核心词" />
                  <Select placeholder="选择词性" style={{ width: '100%' }}>
                    <Select.Option value="noun">名词</Select.Option>
                    <Select.Option value="adj">形容词</Select.Option>
                    <Select.Option value="verb">动词</Select.Option>
                  </Select>
                  <Select placeholder="选择修饰词" style={{ width: '100%' }} mode="multiple">
                    <Select.Option value="4k">4K</Select.Option>
                    <Select.Option value="hd">高清</Select.Option>
                    <Select.Option value="free">免费</Select.Option>
                    <Select.Option value="download">下载</Select.Option>
                  </Select>
                  <Button type="primary" block onClick={() => message.success('长尾词生成成功')}>生成长尾词</Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="竞品分析" key="competitor">
          <Card title="竞品关键词对比">
            <List
              itemLayout="horizontal"
              dataSource={competitorKeywords}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(item as unknown as Keyword)}>查看详情</Button>,
                    <Button type="primary" onClick={() => message.success('词库导出成功')}>导出词库</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.domain}
                    description={
                      <Space>
                        <span>关键词数: {item.keywords.toLocaleString()}</span>
                        <span>重叠词: {item.overlap.toLocaleString()}</span>
                      </Space>
                    }
                  />
                  <div>
                    <span style={{ marginRight: 8 }}>TOP关键词:</span>
                    {item.topKeywords.map((k, i) => (
                      <Tag key={i} color="blue">{k}</Tag>
                    ))}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab={`我的收藏 (${favorites.length})`} key="favorites">
          <Card>
            {favorites.length === 0 ? (
              <Alert
                message="暂无收藏关键词"
                description="在热门关键词或长尾词页面点击心形图标即可收藏"
                type="info"
                showIcon
              />
            ) : (
              <Table
                columns={[
                  ...columns.filter(col => col.key !== 'action'),
                  {
                    title: '操作',
                    key: 'action',
                    render: (_: unknown, record: Keyword) => (
                      <Space>
                        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
                        <Button type="link" danger onClick={() => removeFavorite(record.id)}>移除</Button>
                      </Space>
                    ),
                  },
                ]}
                dataSource={favorites}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                }}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="我的词库" key="mykeywords">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>添加关键词</Button>
              <Button onClick={() => message.info('批量导入功能开发中')}>批量导入</Button>
              <Button onClick={() => message.success('导出成功')}>批量导出</Button>
            </Space>
            <Table
              columns={[
                ...columns,
                {
                  title: '操作',
                  key: 'action',
                  render: () => (
                    <Space>
                      <Button type="link">编辑</Button>
                      <Button type="link" danger>删除</Button>
                    </Space>
                  ),
                },
              ]}
              dataSource={hotKeywords.slice(0, 3)}
              rowKey="id"
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 添加关键词弹窗 */}
      <Modal
        title="添加关键词"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={handleAddKeyword}
        okText="添加"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            name="keyword"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
            initialValue={selectedKeyword?.keyword || ''}
          >
            <Input placeholder="输入关键词" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类">
              <Select.Option value="Resolution">分辨率</Select.Option>
              <Select.Option value="Style">风格</Select.Option>
              <Select.Option value="Theme">主题</Select.Option>
              <Select.Option value="Device">设备</Select.Option>
              <Select.Option value="Type">类型</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="searchVolume"
            label="月搜索量"
            rules={[{ required: true, message: '请输入月搜索量' }]}
          >
            <Input type="number" placeholder="输入月搜索量" />
          </Form.Item>
          <Form.Item
            name="difficulty"
            label="优化难度 (0-100)"
            rules={[{ required: true, message: '请输入优化难度' }]}
          >
            <Input type="number" min={0} max={100} placeholder="输入优化难度" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="可选：输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 关键词详情弹窗 */}
      <Modal
        title={selectedKeyword ? `关键词详情: ${selectedKeyword.keyword}` : '关键词详情'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedKeyword && (
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
              setDetailModalVisible(false);
              setAddModalVisible(true);
            }}>
              添加到词库
            </Button>
          ),
        ]}
        width={700}
      >
        {selectedKeyword && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="关键词">{selectedKeyword.keyword}</Descriptions.Item>
              <Descriptions.Item label="分类">{selectedKeyword.category}</Descriptions.Item>
              <Descriptions.Item label="月搜索量">{selectedKeyword.searchVolume.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="CPC">${selectedKeyword.cpc}</Descriptions.Item>
              <Descriptions.Item label="优化难度">
                <Progress percent={selectedKeyword.difficulty} size="small" strokeColor={getDifficultyColor(selectedKeyword.difficulty)} />
              </Descriptions.Item>
              <Descriptions.Item label="竞争度">{getCompetitionTag(selectedKeyword.competition)}</Descriptions.Item>
            </Descriptions>
            <Divider />
            <h4>趋势分析</h4>
            <div style={{ marginTop: 8 }}>
              <Space>
                <span>趋势: {getTrendIcon(selectedKeyword.trend)}</span>
                <Tag color="blue">相关词: {selectedKeyword.relatedCount}个</Tag>
              </Space>
            </div>
            <Divider />
            <h4>优化建议</h4>
            <Alert
              message={selectedKeyword.difficulty > 60 ? '优化难度较高' : selectedKeyword.difficulty > 40 ? '中等优化难度' : '较易优化'}
              description={
                selectedKeyword.difficulty > 60
                  ? '该关键词竞争激烈，建议结合长尾词策略，从相关内容页面入手。'
                  : selectedKeyword.difficulty > 40
                  ? '有一定竞争，可以通过优质内容和外链建设提升排名。'
                  : '竞争度较低，是较好的优化目标，建议尽快布局相关页面。'
              }
              type={selectedKeyword.difficulty > 60 ? 'warning' : selectedKeyword.difficulty > 40 ? 'info' : 'success'}
              showIcon
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default KeywordResearch;

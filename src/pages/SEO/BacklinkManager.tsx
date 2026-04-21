import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, Select, message, Alert, Tabs, Statistic, Row, Col, Progress, Timeline, Breadcrumb } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, WarningOutlined, GlobalOutlined, LinkOutlined, SafetyOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi } from '../../services/seoApi';

const { TabPane } = Tabs;
const { Option } = Select;

interface Backlink {
  id: number;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  isNofollow: boolean;
  isSponsored: boolean;
  status: 'active' | 'removed' | 'broken';
  discoveredAt: string;
  lastChecked: string;
  qualityScore?: number;
  qualityMetrics?: {
    relevance: number;
    authority: number;
    traffic: number;
    diversity: number;
  };
}

interface DomainScore {
  domain: string;
  score: number;
  backlinks: number;
  status: 'safe' | 'suspicious' | 'dangerous';
}

const BacklinkManager: React.FC = () => {
  const navigate = useNavigate();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedBacklink, setSelectedBacklink] = useState<Backlink | null>(null);
  const [checking, setChecking] = useState(false);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [_backlinksLoading, setBacklinksLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // 质量评分弹窗
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [qualityAnalyzing, setQualityAnalyzing] = useState(false);
  const [qualityAnalysis, setQualityAnalysis] = useState<{
    overall: number;
    metrics: {
      relevance: number;
      authority: number;
      traffic: number;
      diversity: number;
    };
    suggestions: string[];
  } | null>(null);

  // 加载外链数据
  const loadBacklinks = async () => {
    setBacklinksLoading(true);
    try {
      const res = await seoApi.getBacklinks({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText,
      });
      if (res.code === 200) {
        setBacklinks(res.data.items);
        setPagination(prev => ({ ...prev, total: res.data.total }));
      }
    } catch (_err) {
      message.error('加载外链数据失败');
    } finally {
      setBacklinksLoading(false);
    }
  };

  useEffect(() => {
    // 使用setTimeout避免同步调用setState
    const timer = setTimeout(() => {
      loadBacklinks();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchText]);

  // 静态数据已移除，使用API获取真实数据

  // 域名评分
  const domainScores: DomainScore[] = [
    { domain: 'example-blog.com', score: 85, backlinks: 12, status: 'safe' },
    { domain: 'tech-site.com', score: 92, backlinks: 5, status: 'safe' },
    { domain: 'suspicious-site.com', score: 25, backlinks: 1, status: 'dangerous' },
    { domain: 'design-portfolio.com', score: 78, backlinks: 8, status: 'safe' },
  ];

  const columns = [
    { title: '来源页面', dataIndex: 'sourceUrl', key: 'sourceUrl', ellipsis: true },
    { title: '目标页面', dataIndex: 'targetUrl', key: 'targetUrl', ellipsis: true },
    { title: '锚文本', dataIndex: 'anchorText', key: 'anchorText', width: 150 },
    {
      title: 'DA评分',
      dataIndex: 'domainAuthority',
      key: 'domainAuthority',
      width: 100,
      render: (score: number) => <Progress percent={score} size="small" status={score > 50 ? 'success' : 'normal'} />,
    },
    {
      title: '质量评分',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      width: 100,
      render: (score: number | undefined) => (
        score ? (
          <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}>
            {score}分
          </Tag>
        ) : (
          <Tag>未分析</Tag>
        )
      ),
    },
    {
      title: '属性',
      key: 'attrs',
      width: 120,
      render: (_: unknown, record: Backlink) => (
        <Space>
          {record.isNofollow && <Tag>nofollow</Tag>}
          {record.isSponsored && <Tag color="orange">sponsored</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '正常' },
          removed: { color: 'default', text: '已移除' },
          broken: { color: 'error', text: '失效' },
        };
        return <Tag color={map[status].color}>{map[status].text}</Tag>;
      },
    },
    { title: '发现时间', dataIndex: 'discoveredAt', key: 'discoveredAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Backlink) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" icon={<SafetyOutlined />} onClick={() => handleCheck(record)}>检测</Button>
          <Button type="link" onClick={() => handleAnalyzeQuality(record)}>质量分析</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => message.success('已删除')}>删除</Button>
        </Space>
      ),
    },
  ];

  const domainColumns = [
    { title: '域名', dataIndex: 'domain', key: 'domain' },
    {
      title: '安全评分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 80 ? '#52c41a' : score >= 50 ? '#faad14' : '#f5222d'}
        />
      ),
    },
    { title: '外链数', dataIndex: 'backlinks', key: 'backlinks' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          safe: { color: 'success', icon: <CheckCircleOutlined />, text: '安全' },
          suspicious: { color: 'warning', icon: <WarningOutlined />, text: '可疑' },
          dangerous: { color: 'error', icon: <WarningOutlined />, text: '危险' },
        };
        const { color, icon, text } = map[status];
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link" onClick={() => message.info('查看详情功能开发中')}>查看详情</Button>,
    },
  ];

  const handleViewDetail = (record: Backlink) => {
    setSelectedBacklink(record);
    setDetailModalVisible(true);
  };

  const handleCheck = async (record: Backlink) => {
    setChecking(true);
    message.loading(`正在检测 ${record.sourceUrl}...`, 1.5);
    try {
      const res = await seoApi.checkBacklink(record.id);
      if (res.code === 200) {
        message.success(`检测完成：${res.data.message}`);
        loadBacklinks(); // 刷新列表
      }
    } catch (_err) {
      message.error('检测失败');
    } finally {
      setChecking(false);
    }
  };

  // 分析外链质量
  const handleAnalyzeQuality = async (record: Backlink) => {
    setSelectedBacklink(record);
    setQualityAnalyzing(true);
    setQualityModalVisible(true);
    
    try {
      // 模拟质量分析
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 生成质量评分
      const metrics = {
        relevance: Math.floor(Math.random() * 30) + 70, // 70-100
        authority: record.domainAuthority,
        traffic: Math.floor(Math.random() * 40) + 60, // 60-100
        diversity: Math.floor(Math.random() * 30) + 65, // 65-100
      };
      
      const overall = Math.floor((metrics.relevance + metrics.authority + metrics.traffic + metrics.diversity) / 4);
      
      const suggestions: string[] = [];
      if (metrics.relevance < 80) {
        suggestions.push('相关性较低：建议寻找与壁纸内容更相关的网站');
      }
      if (metrics.authority < 50) {
        suggestions.push('域名权重较低：优先获取高权重网站的外链');
      }
      if (metrics.traffic < 70) {
        suggestions.push('流量较低：选择流量更大的网站可获得更多曝光');
      }
      if (record.isNofollow) {
        suggestions.push('nofollow属性：此链接不会传递权重，但可带来流量');
      }
      if (!record.isNofollow && !record.isSponsored) {
        suggestions.push('优质dofollow链接：此链接可有效提升SEO权重');
      }
      
      setQualityAnalysis({
        overall,
        metrics,
        suggestions: suggestions.length > 0 ? suggestions : ['外链质量良好，继续保持！'],
      });
      
      // 更新外链数据
      setBacklinks(prev => prev.map(item => 
        item.id === record.id 
          ? { ...item, qualityScore: overall, qualityMetrics: metrics }
          : item
      ));
    } catch (_err) {
      message.error('分析失败');
    } finally {
      setQualityAnalyzing(false);
    }
  };

  const handleAdd = () => {
    form.validateFields().then(() => {
      message.success('外链添加成功');
      setAddModalVisible(false);
      form.resetFields();
    });
  };

  const handleScan = async () => {
    message.loading('正在扫描外链...', 2);
    try {
      const res = await seoApi.scanBacklinks();
      if (res.code === 200) {
        message.success(`扫描完成，发现 ${res.data.found} 个新外链`);
        loadBacklinks(); // 刷新列表
      }
    } catch (_err) {
      message.error('扫描失败');
    }
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>外链管理</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        外链管理
      </h2>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总外链数" value={2580} prefix={<LinkOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="正常外链" value={2456} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="失效外链" value={45} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="危险域名" value={3} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            添加外链
          </Button>
          <Button icon={<GlobalOutlined />} onClick={handleScan}>
            扫描外链
          </Button>
          <Input.Search
            placeholder="搜索域名或URL"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </Space>
      </Card>

      <Tabs defaultActiveKey="backlinks">
        <TabPane tab="外链列表" key="backlinks">
          <Card>
            <Alert
              message="外链健康度检查"
              description="系统每日自动检测外链状态，失效或危险的外链会在这里标记"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={backlinks}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="域名分析" key="domains">
          <Card>
            <Alert
              message="域名安全评分"
              description="基于域名权威度、历史记录、内容质量等因素计算的安全评分"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={domainColumns}
              dataSource={domainScores}
              rowKey="domain"
            />
          </Card>
        </TabPane>

        <TabPane tab="检测日志" key="logs">
          <Card>
            <Timeline
              items={[
                { color: 'green', children: <><strong>2026-04-17 10:00</strong><p>完成全站外链扫描，发现 3 个新外链</p></> },
                { color: 'red', children: <><strong>2026-04-17 09:30</strong><p>检测到 1 个外链失效：suspicious-site.com</p></> },
                { color: 'orange', children: <><strong>2026-04-16 08:00</strong><p>发现 1 个可疑域名：spam-site.com</p></> },
                { color: 'green', children: <><strong>2026-04-15 10:00</strong><p>外链健康度检查完成，整体良好</p></> },
              ]}
            />
          </Card>
        </TabPane>

        <TabPane tab="外链建设" key="build">
          <Card title="外链建设建议">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="高质量外链来源"
                description="行业相关博客、权威媒体、合作伙伴网站、社交媒体"
                type="success"
                showIcon
              />
              <Alert
                message="避免的外链类型"
                description="链接农场、PBN网络、自动生成的外链、与内容无关的外链"
                type="error"
                showIcon
              />
              <Card type="inner" title="待联系网站">
                <Table
                  columns={[
                    { title: '网站', dataIndex: 'site' },
                    { title: 'DA评分', dataIndex: 'da' },
                    { title: '相关性', dataIndex: 'relevance', render: (r: string) => <Tag color="blue">{r}</Tag> },
                    { title: '操作', render: () => <Button type="primary" size="small" onClick={() => message.info('联系功能开发中')}>联系</Button> },
                  ]}
                  dataSource={[
                    { site: 'designhub.com', da: 78, relevance: '高' },
                    { site: 'wallpaperhub.net', da: 65, relevance: '高' },
                    { site: 'techblog.com', da: 82, relevance: '中' },
                  ]}
                  pagination={false}
                />
              </Card>
            </Space>
          </Card>
        </TabPane>
      </Tabs>

      {/* 添加外链弹窗 */}
      <Modal
        title="添加外链"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="sourceUrl" label="来源URL" rules={[{ required: true }]}>
            <Input placeholder="https://example.com/page" />
          </Form.Item>
          <Form.Item name="targetUrl" label="目标URL" rules={[{ required: true }]}>
            <Input placeholder="https://your-site.com/page" />
          </Form.Item>
          <Form.Item name="anchorText" label="锚文本" rules={[{ required: true }]}>
            <Input placeholder="点击文本" />
          </Form.Item>
          <Form.Item name="isNofollow" label="Nofollow" valuePropName="checked">
            <Select defaultValue={true}>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item name="isSponsored" label="Sponsored" valuePropName="checked">
            <Select defaultValue={false}>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 外链详情弹窗 */}
      <Modal
        title="外链详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedBacklink && (
            <Button key="check" type="primary" icon={<SafetyOutlined />} onClick={() => {
              setDetailModalVisible(false);
              handleCheck(selectedBacklink);
            }} loading={checking}>
              重新检测
            </Button>
          ),
        ]}
        width={700}
      >
        {selectedBacklink && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message={selectedBacklink.status === 'active' ? '外链状态正常' : selectedBacklink.status === 'broken' ? '外链已失效' : '外链已移除'}
              type={selectedBacklink.status === 'active' ? 'success' : selectedBacklink.status === 'broken' ? 'error' : 'warning'}
              showIcon
            />
            <Card title="基本信息" size="small">
              <p><strong>来源页面：</strong><a href={selectedBacklink.sourceUrl} target="_blank" rel="noopener noreferrer">{selectedBacklink.sourceUrl}</a></p>
              <p><strong>目标页面：</strong><a href={selectedBacklink.targetUrl} target="_blank" rel="noopener noreferrer">{selectedBacklink.targetUrl}</a></p>
              <p><strong>锚文本：</strong>{selectedBacklink.anchorText}</p>
              <p><strong>发现时间：</strong>{selectedBacklink.discoveredAt}</p>
              <p><strong>最后检测：</strong>{selectedBacklink.lastChecked}</p>
            </Card>
            <Card title="域名权威度" size="small">
              <Progress percent={selectedBacklink.domainAuthority} status={selectedBacklink.domainAuthority > 50 ? 'success' : 'normal'} />
              <p>DA评分: {selectedBacklink.domainAuthority}/100</p>
            </Card>
            <Card title="链接属性" size="small">
              <Space>
                {selectedBacklink.isNofollow && <Tag color="blue">nofollow</Tag>}
                {selectedBacklink.isSponsored && <Tag color="orange">sponsored</Tag>}
                {!selectedBacklink.isNofollow && !selectedBacklink.isSponsored && <Tag color="green">dofollow</Tag>}
              </Space>
            </Card>
          </Space>
        )}
      </Modal>

      {/* 质量分析弹窗 */}
      <Modal
        title="外链质量分析"
        open={qualityModalVisible}
        onCancel={() => setQualityModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQualityModalVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {qualityAnalyzing ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Progress percent={50} status="active" />
            <p>正在分析外链质量...</p>
          </div>
        ) : qualityAnalysis && selectedBacklink ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message={`综合质量评分: ${qualityAnalysis.overall}分`}
              type={qualityAnalysis.overall >= 80 ? 'success' : qualityAnalysis.overall >= 60 ? 'warning' : 'error'}
              showIcon
            />
            
            <Card title="质量指标" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <span>相关性: </span>
                  <Progress percent={qualityAnalysis.metrics.relevance} size="small" status={qualityAnalysis.metrics.relevance >= 80 ? 'success' : 'normal'} />
                </div>
                <div>
                  <span>权威性: </span>
                  <Progress percent={qualityAnalysis.metrics.authority} size="small" status={qualityAnalysis.metrics.authority >= 50 ? 'success' : 'normal'} />
                </div>
                <div>
                  <span>流量: </span>
                  <Progress percent={qualityAnalysis.metrics.traffic} size="small" status={qualityAnalysis.metrics.traffic >= 70 ? 'success' : 'normal'} />
                </div>
                <div>
                  <span>多样性: </span>
                  <Progress percent={qualityAnalysis.metrics.diversity} size="small" status={qualityAnalysis.metrics.diversity >= 70 ? 'success' : 'normal'} />
                </div>
              </Space>
            </Card>
            
            <Card title="优化建议" size="small">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {qualityAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>{suggestion}</li>
                ))}
              </ul>
            </Card>
            
            <Card title="外链信息" size="small">
              <p><strong>来源:</strong> {selectedBacklink.sourceUrl}</p>
              <p><strong>锚文本:</strong> {selectedBacklink.anchorText}</p>
              <p><strong>属性:</strong> 
                {selectedBacklink.isNofollow && <Tag color="blue">nofollow</Tag>}
                {selectedBacklink.isSponsored && <Tag color="orange">sponsored</Tag>}
                {!selectedBacklink.isNofollow && !selectedBacklink.isSponsored && <Tag color="green">dofollow</Tag>}
              </p>
            </Card>
          </Space>
        ) : null}
      </Modal>
    </div>
  );
};

export default BacklinkManager;

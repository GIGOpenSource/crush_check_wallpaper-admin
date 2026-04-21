import React, { useState } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, message, Alert, Statistic, Row, Col, Progress, Breadcrumb, List, Typography, Tabs, Badge } from 'antd';
import { EditOutlined, CheckCircleOutlined, WarningOutlined, FileTextOutlined, SearchOutlined, BulbOutlined, EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TabPane } = Tabs;

interface ContentPage {
  id: number;
  url: string;
  title: string;
  contentScore: number;
  wordCount: number;
  issues: ContentIssue[];
  suggestions: string[];
  lastOptimized: string;
}

interface ContentIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  location: string;
}

const ContentOptimizer: React.FC = () => {
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false);
  const [optimizeModalVisible, setOptimizeModalVisible] = useState(false);
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [_form] = Form.useForm();

  // 内容页面数据
  const pages: ContentPage[] = [
    {
      id: 1,
      url: '/wallpaper/nature-landscape',
      title: '自然风景壁纸高清下载',
      contentScore: 78,
      wordCount: 450,
      issues: [
        { type: 'warning', message: '标题长度偏短，建议增加到30-60字符', location: 'title' },
        { type: 'info', message: '图片缺少alt属性', location: 'image' },
      ],
      suggestions: ['添加更多相关关键词', '增加图片alt描述', '补充内容到800字以上'],
      lastOptimized: '2024-01-15',
    },
    {
      id: 2,
      url: '/wallpaper/anime-collection',
      title: '动漫壁纸精选合集 - 高清4K动漫壁纸免费下载',
      contentScore: 85,
      wordCount: 1200,
      issues: [
        { type: 'info', message: '内链数量较少', location: 'content' },
      ],
      suggestions: ['增加相关壁纸推荐', '添加更多内链'],
      lastOptimized: '2024-01-20',
    },
    {
      id: 3,
      url: '/category/minimalist',
      title: '极简主义壁纸',
      contentScore: 62,
      wordCount: 180,
      issues: [
        { type: 'error', message: '内容过短，建议至少300字', location: 'content' },
        { type: 'warning', message: '缺少H2标题', location: 'heading' },
        { type: 'warning', message: '关键词密度过低', location: 'content' },
      ],
      suggestions: ['扩展内容介绍', '添加分类说明', '增加使用场景描述'],
      lastOptimized: '2024-01-10',
    },
  ];

  const columns = [
    {
      title: '页面',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ContentPage) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.url}</div>
        </div>
      ),
    },
    {
      title: '内容评分',
      dataIndex: 'contentScore',
      key: 'contentScore',
      width: 120,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d'}
        />
      ),
    },
    {
      title: '字数',
      dataIndex: 'wordCount',
      key: 'wordCount',
      width: 80,
      render: (count: number) => (
        <Tag color={count >= 800 ? 'success' : count >= 300 ? 'warning' : 'error'}>
          {count}字
        </Tag>
      ),
    },
    {
      title: '问题数',
      key: 'issues',
      width: 100,
      render: (_: unknown, record: ContentPage) => {
        const errors = record.issues.filter(i => i.type === 'error').length;
        const warnings = record.issues.filter(i => i.type === 'warning').length;
        return (
          <Space>
            {errors > 0 && <Badge count={errors} style={{ backgroundColor: '#f5222d' }} />}
            {warnings > 0 && <Badge count={warnings} style={{ backgroundColor: '#faad14' }} />}
            {record.issues.length === 0 && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          </Space>
        );
      },
    },
    {
      title: '最后优化',
      dataIndex: 'lastOptimized',
      key: 'lastOptimized',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: ContentPage) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" icon={<BulbOutlined />} onClick={() => handleOptimize(record)}>优化建议</Button>
        </Space>
      ),
    },
  ];

  const handleViewDetail = (record: ContentPage) => {
    setSelectedPage(record);
    message.info(`查看 ${record.title} 的详细分析`);
  };

  const handleOptimize = (record: ContentPage) => {
    setSelectedPage(record);
    setOptimizeModalVisible(true);
  };

  const handleAnalyze = () => {
    if (!analyzeUrl) {
      message.warning('请输入要分析的页面URL');
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      message.success('分析完成');
      setAnalyzeModalVisible(false);
      setAnalyzeUrl('');
    }, 2000);
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <WarningOutlined style={{ color: '#f5222d' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      default:
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>SEO管理</Breadcrumb.Item>
        <Breadcrumb.Item>内容优化建议</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="已分析页面" value={pages.length} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="平均内容评分" value={75} suffix="分" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="待修复问题" value={8} suffix="个" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="优化建议" value={15} suffix="条" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="内容优化分析"
        extra={
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setAnalyzeModalVisible(true)}>
            分析新页面
          </Button>
        }
      >
        <Alert
          message="内容优化说明"
          description="通过AI分析页面内容质量，检测SEO问题并提供优化建议，帮助提升页面搜索排名。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table columns={columns} dataSource={pages} rowKey="id" />
      </Card>

      {/* 分析新页面弹窗 */}
      <Modal
        title="分析页面内容"
        open={analyzeModalVisible}
        onOk={handleAnalyze}
        onCancel={() => setAnalyzeModalVisible(false)}
        confirmLoading={analyzing}
      >
        <Form layout="vertical">
          <Form.Item label="页面URL" required>
            <Input
              placeholder="输入页面路径，如 /wallpaper/nature"
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              prefix="/"
            />
          </Form.Item>
        </Form>
        <Alert
          message="分析内容"
          description="系统将分析页面标题、内容质量、关键词密度、图片优化、内链结构等多个维度。"
          type="info"
          showIcon
        />
      </Modal>

      {/* 优化建议弹窗 */}
      <Modal
        title={`内容优化建议 - ${selectedPage?.title}`}
        open={optimizeModalVisible}
        onCancel={() => setOptimizeModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setOptimizeModalVisible(false)}>关闭</Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => message.info('跳转编辑页面')}>编辑页面</Button>,
        ]}
      >
        {selectedPage && (
          <Tabs defaultActiveKey="issues">
            <TabPane tab="问题检测" key="issues">
              <List
                dataSource={selectedPage.issues}
                renderItem={(item) => (
                  <List.Item>
                    <Alert
                      message={item.message}
                      description={`位置: ${item.location}`}
                      type={getIssueColor(item.type) as any}
                      icon={getIssueIcon(item.type)}
                      showIcon
                      style={{ width: '100%' }}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
            <TabPane tab="优化建议" key="suggestions">
              <List
                dataSource={selectedPage.suggestions}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <BulbOutlined style={{ color: '#1890ff' }} />
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </TabPane>
            <TabPane tab="内容分析" key="analysis">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card size="small" title="基础指标">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="内容评分" value={selectedPage.contentScore} suffix="/100" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="字数统计" value={selectedPage.wordCount} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="问题数量" value={selectedPage.issues.length} />
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title="优化检查清单">
                  <List>
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      标题包含目标关键词
                    </List.Item>
                    <List.Item>
                      {selectedPage.wordCount >= 800 ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      ) : (
                        <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                      )}
                      内容长度达标 (建议≥800字)
                    </List.Item>
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      图片已优化
                    </List.Item>
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      包含内链
                    </List.Item>
                  </List>
                </Card>
              </Space>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default ContentOptimizer;

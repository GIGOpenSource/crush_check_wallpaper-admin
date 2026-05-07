import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, App, Alert, Statistic, Row, Col, Progress, Breadcrumb, List, Typography, Tabs, Badge, Pagination, Popconfirm } from 'antd';
import { EditOutlined, CheckCircleOutlined, WarningOutlined, FileTextOutlined, SearchOutlined, BulbOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons';
import { seoApi, type ContentOptimizationDashboard, type ContentOptimizationPage } from '../../services/seoApi';

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
  const { message } = App.useApp();
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false);
  const [optimizeModalVisible, setOptimizeModalVisible] = useState(false);
  const [selectedPage, setSelectedPage] = useState<ContentOptimizationPage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reAnalyzing, setReAnalyzing] = useState<number | null>(null);
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [_form] = Form.useForm();
  
  // 统计数据状态
  const [statistics, setStatistics] = useState<ContentOptimizationDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 列表数据状态
  const [pages, setPages] = useState<ContentOptimizationPage[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 获取统计数据
  useEffect(() => {
    fetchStatistics();
    fetchPagesList();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await seoApi.getContentOptimizationDashboard();
      if (response.code === 200 && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取内容优化列表
  const fetchPagesList = async (page = currentPage, size = pageSize) => {
    setListLoading(true);
    try {
      const response = await seoApi.getContentOptimizationList({
        currentPage: page,
        pageSize: size,
      });
      if (response.code === 200 && response.data) {
        setPages(response.data.results || []);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (error) {
      message.error('获取内容优化列表失败');
    } finally {
      setListLoading(false);
    }
  };

  // 分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageSize(pageSize);
    fetchPagesList(page, pageSize);
  };

  const columns = [
    {
      title: '页面',
      dataIndex: 'page_title',
      key: 'page_title',
      render: (text: string, record: ContentOptimizationPage) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.page_path}</div>
          {/* {record.full_url && (
            <div style={{ fontSize: 11, color: '#1890ff' }}>
              <a href={record.full_url} target="_blank" rel="noopener noreferrer">
                {record.full_url}
              </a>
            </div>
          )} */}
        </div>
      ),
    },
    {
      title: '内容评分',
      dataIndex: 'content_score',
      key: 'content_score',
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
      dataIndex: 'word_count',
      key: 'word_count',
      width: 80,
      render: (count: number) => (
        <Tag color={count >= 800 ? 'success' : count >= 300 ? 'warning' : 'error'}>
          {count}字
        </Tag>
      ),
    },
    {
      title: '问题数',
      dataIndex: 'issue_count',
      key: 'issue_count',
      width: 100,
      render: (count: number, record: ContentOptimizationPage) => {
        const issues = record.issues || [];
        const errors = issues.filter(i => i.type === 'error').length;
        const warnings = issues.filter(i => i.type === 'warning').length;
        return (
          <Space>
            {errors > 0 && <Badge count={errors} style={{ backgroundColor: '#f5222d' }} />}
            {warnings > 0 && <Badge count={warnings} style={{ backgroundColor: '#faad14' }} />}
            {count === 0 && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          </Space>
        );
      },
    },
    {
      title: '最后优化',
      dataIndex: 'last_optimized_at',
      key: 'last_optimized_at',
      width: 160,
      render: (text: string) => {
        if (!text) return '--';
        return new Date(text).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: ContentOptimizationPage) => (
        <Space>
          <Popconfirm
            title="确定要重新分析吗？"
            description={`重新分析页面 "${record.page_title}" 的内容质量`}
            onConfirm={() => handleReAnalyze(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              icon={<SyncOutlined />} 
              loading={reAnalyzing === record.id}
              disabled={reAnalyzing !== null && reAnalyzing !== record.id}
            >
              重新分析
            </Button>
          </Popconfirm>
          <Button type="link" icon={<BulbOutlined />} onClick={() => handleOptimize(record)}>优化建议</Button>
        </Space>
      ),
    },
  ];

  const handleReAnalyze = async (record: ContentOptimizationPage) => {
    setReAnalyzing(record.id);
    try {
      const response = await seoApi.reAnalyzeContentOptimization({
        id: record.id,
      });
      // 支持 200 和 201 状态码都视为成功
      if (response.code === 200 || response.code === 201 || response.success) {
        message.success(response.data?.message || '重新分析完成');
        // 刷新列表和统计数据
        fetchPagesList();
        fetchStatistics();
      } else {
        message.error(response.message || '重新分析失败');
      }
    } catch (error) {
      console.error('重新分析页面内容失败:', error);
      message.error('重新分析页面内容失败');
    } finally {
      setReAnalyzing(null);
    }
  };

  const handleOptimize = (record: ContentOptimizationPage) => {
    setSelectedPage(record);
    setOptimizeModalVisible(true);
  };

  const handleAnalyze = async () => {
    if (!analyzeUrl) {
      message.warning('请输入要分析的页面URL');
      return;
    }
    setAnalyzing(true);
    try {
      const response = await seoApi.analyzeContentOptimization({
        page_path: analyzeUrl,
      });
      // 支持 200 和 201 状态码都视为成功
      if (response.code === 200 || response.code === 201 || response.success) {
        message.success(response.data?.message || '分析完成');
        setAnalyzeModalVisible(false);
        setAnalyzeUrl('');
        // 刷新列表和统计数据
        fetchPagesList();
        fetchStatistics();
      } else {
        message.error(response.message || '分析失败');
      }
    } catch (error) {
      console.error('分析页面内容失败:', error);
      message.error('分析页面内容失败');
    } finally {
      setAnalyzing(false);
    }
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
          <Card loading={loading}>
            <Statistic title="已分析页面" value={statistics?.analyzed_pages_count || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic 
              title="平均内容评分" 
              value={statistics?.avg_content_score || 0} 
              suffix="分" 
              valueStyle={{ color: (statistics?.avg_content_score || 0) >= 70 ? '#3f8600' : '#cf1322' }} 
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic 
              title="待修复问题" 
              value={statistics?.total_issues || 0} 
              suffix="个" 
              valueStyle={{ color: '#cf1322' }} 
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic 
              title="优化建议" 
              value={statistics?.total_suggestions || 0} 
              suffix="条" 
              valueStyle={{ color: '#1890ff' }} 
            />
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
        <Table columns={columns} dataSource={pages} rowKey="id" loading={listLoading} pagination={false} />
        <Pagination
          style={{ marginTop: 16, textAlign: 'right' }}
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
        />
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
          <Form.Item 
            label="页面URL" 
            required
            rules={[{ required: true, message: '请输入页面URL' }]}
          >
            <Input
              placeholder="输入页面路径，如 /wallpaper/nature"
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              prefix=""
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
        title={`内容优化建议 - ${selectedPage?.page_title}`}
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
                dataSource={selectedPage.optimization_suggestions || []}
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
                      <Statistic title="内容评分" value={selectedPage.content_score} suffix="/100" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="字数统计" value={selectedPage.word_count} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="问题数量" value={selectedPage.issues?.length || 0} />
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
                      {selectedPage.word_count >= 800 ? (
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

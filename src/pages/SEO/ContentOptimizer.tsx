import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, App, Alert, Statistic, Row, Col, Progress, Breadcrumb, List, Typography, Tabs, Badge, Pagination, Popconfirm } from 'antd';
import { EditOutlined, CheckCircleOutlined, WarningOutlined, FileTextOutlined, SearchOutlined, BulbOutlined, EyeOutlined, SyncOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { competitorApi } from '../../services/competitorApi';
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
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false);
  const [optimizeModalVisible, setOptimizeModalVisible] = useState(false);
  const [selectedPage, setSelectedPage] = useState<ContentOptimizationPage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reAnalyzing, setReAnalyzing] = useState<number | null>(null);
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [_form] = Form.useForm();
  
  // 刷新状态
  const [refreshing, setRefreshing] = useState(false);
  
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

  // 刷新所有数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStatistics(),
        fetchPagesList(currentPage, pageSize),
      ]);
      message.success('数据刷新成功');
    } catch (error) {
      console.error('刷新数据失败:', error);
      message.error('刷新数据失败');
    } finally {
      setRefreshing(false);
    }
  };

  const columns = [
    {
      title: '页面',
      dataIndex: 'page_title',
      key: 'page_title',
      width: 280,
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
      align: 'center' as const,
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
      width: 100,
      align: 'center' as const,
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
      align: 'center' as const,
      render: (count: number) => {
        return (
          <Space>
            {count > 0 ? (
              <Badge count={count} style={{ backgroundColor: '#f5222d' }} />
            ) : (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            )}
          </Space>
        );
      },
    },
    {
      title: '最后优化',
      dataIndex: 'last_optimized_at',
      key: 'last_optimized_at',
      width: 170,
      align: 'center' as const,
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
      align: 'left' as const,
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

  const handleOptimize = async (record: ContentOptimizationPage) => {
    setSelectedPage(record);
    
    // 先加载数据，成功后再打开弹窗
    try {
      const [suggestionsRes, issuesRes, overviewRes] = await Promise.all([
        competitorApi.getContentOptimizationSuggestions(record.id),
        competitorApi.getContentOptimizationIssues(record.id),
        competitorApi.getContentOptimizationAnalysisOverview(record.id),
      ]);
      
      // 更新选中页面的数据
      setSelectedPage({
        ...record,
        optimization_suggestions: suggestionsRes.data || [],
        issues: issuesRes.data || [],
        ...overviewRes.data, // 展开内容分析概览数据（包含 content_score, word_count, issue_count, optimization_checklist）
      });
      
      // 数据获取成功后再打开弹窗
      setOptimizeModalVisible(true);
    } catch (error) {
      console.error('获取优化数据失败:', error);
      message.error('获取优化数据失败，请检查网络');
      // 重置选中页面
      setSelectedPage(null);
    }
  };

  const handleAnalyze = async () => {
    // 表单验证
    try {
      await _form.validateFields();
    } catch (error) {
      // 验证失败，显示错误提示
      return;
    }

    if (!analyzeUrl) {
      message.warning('请输入要分析的页面URL');
      return;
    }

    // 正则校验
    const urlPattern = /^\/[a-zA-Z0-9\-_\/.]*$/;
    if (!urlPattern.test(analyzeUrl)) {
      message.error('URL格式错误：只能包含字母、数字、斜杠、连字符和下划线，且必须以/开头');
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
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>内容优化建议</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
          内容优化建议
        </h2>
        <Button 
          type="primary" 
          icon={<ReloadOutlined spin={refreshing} />} 
          onClick={handleRefresh} 
          loading={refreshing}
        >
          刷新数据
        </Button>
      </div>

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
        <Table 
          columns={columns} 
          dataSource={pages} 
          rowKey="id" 
          loading={listLoading} 
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
          />
        </div>
      </Card>

      {/* 分析新页面弹窗 */}
      <Modal
        title="分析页面内容"
        open={analyzeModalVisible}
        onOk={handleAnalyze}
        onCancel={() => setAnalyzeModalVisible(false)}
        confirmLoading={analyzing}
      >
        <Form layout="vertical" form={_form}>
          <Form.Item 
            label="页面URL" 
            name="pageUrl"
            required
            rules={[
              { required: true, message: '请输入页面URL' },
              {
                pattern: /^\/[a-zA-Z0-9\-_\/.]*$/,
                message: 'URL只能包含字母、数字、斜杠、连字符和下划线，且必须以/开头',
              },
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input
              placeholder="输入页面路径，如 /wallpaper/nature"
              value={analyzeUrl}
              onChange={(e) => {
                setAnalyzeUrl(e.target.value);
                _form.setFieldsValue({ pageUrl: e.target.value });
              }}
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
          // <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => message.info('跳转编辑页面')}>编辑页面</Button>,
        ]}
      >
        {selectedPage && (
          <Tabs defaultActiveKey="issues">
            <TabPane tab="问题检测" key="issues">
              <List
                dataSource={selectedPage.issues || []}
                renderItem={(item: any) => (
                  <List.Item>
                    <Alert
                      message={
                        <Space>
                          <span>{item.title || '未知问题'}</span>
                          {item.severity && (
                            <Tag color={item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'default'}>
                              {item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低'}优先级
                            </Tag>
                          )}
                        </Space>
                      }
                      description={item.description || '暂无描述'}
                      type={getIssueColor(item.severity || item.type) as any}
                      showIcon={false}
                      style={{ width: '100%' }}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
            <TabPane tab="优化建议" key="suggestions">
              <List
                dataSource={selectedPage.optimization_suggestions || []}
                renderItem={(item: any) => (
                  <List.Item>
                    <Alert
                      message={
                        <Space>
                          <span>{item.title || '优化建议'}</span>
                          {item.priority && (
                            <Tag color={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}>
                              {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}优先级
                            </Tag>
                          )}
                        </Space>
                      }
                      description={item.description || '暂无描述'}
                      type="info"
                      showIcon={false}
                      style={{ width: '100%' }}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
            <TabPane tab="内容分析" key="analysis">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card size="small" title="基础指标">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic 
                        title="内容评分" 
                        value={selectedPage.content_score || 0} 
                        suffix="/100" 
                        valueStyle={{ color: (selectedPage.content_score || 0) >= 70 ? '#3f8600' : '#cf1322' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic title="字数统计" value={selectedPage.word_count || 0} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="问题数量" value={selectedPage.issues?.length || 0} />
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title="优化检查清单">
                  <List
                    dataSource={selectedPage.optimization_checklist || []}
                    renderItem={(item: any) => (
                      <List.Item>
                        <Space>
                          {item.is_passed || item.is_passed === true ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <WarningOutlined style={{ color: '#faad14' }} />
                          )}
                          <span>{item.title || item.description || '检查项'}</span>
                        </Space>
                      </List.Item>
                    )}
                  />
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

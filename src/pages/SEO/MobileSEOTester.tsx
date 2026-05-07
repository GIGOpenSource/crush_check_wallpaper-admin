import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, App, Alert, Statistic, Row, Col, Progress, Breadcrumb, List, Tabs, Badge, Radio, Pagination, Popconfirm } from 'antd';
import { MobileOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, ScanOutlined, EyeOutlined, ReloadOutlined, FileImageOutlined, CodeOutlined, DatabaseOutlined } from '@ant-design/icons';
import { seoApi, type MobilePageSpeedStatistics, type PageSpeedItem, type PageSpeedDetail, type OptimizationSuggestion } from '../../services/seoApi';

const { TabPane } = Tabs;

const MobileSEOTester: React.FC = () => {
  const { message } = App.useApp();
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<PageSpeedDetail | null>(null);
  const [testing, setTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  
  // 统计数据状态
  const [statistics, setStatistics] = useState<MobilePageSpeedStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 列表数据状态
  const [pageSpeedList, setPageSpeedList] = useState<PageSpeedItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // 优化建议状态
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // 获取页面速度统计数据
  useEffect(() => {
    fetchStatistics();
    fetchPageSpeedList();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await seoApi.getMobilePageSpeedStatistics();
      if (response.code === 200) {
        setStatistics(response.data);
      }
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取页面速度列表
  const fetchPageSpeedList = async (page = currentPage, size = pageSize) => {
    setListLoading(true);
    try {
      const response = await seoApi.getMobilePageSpeedList({
        currentPage: page,
        pageSize: size,
      });
      if (response.code === 200 && response.data) {
        setPageSpeedList(response.data.results || []);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (error) {
      message.error('获取页面速度列表失败');
    } finally {
      setListLoading(false);
    }
  };

  // 分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageSize(pageSize);
    fetchPageSpeedList(page, pageSize);
  };

  // 表格列定义
  const columns = [
    {
      title: '页面',
      dataIndex: 'page_path',
      key: 'page_path',
      width: 200,
      ellipsis: true,
    },
    {
      title: '设备',
      key: 'device',
      width: 100,
      render: () => (
        <Tag icon={<MobileOutlined />}>手机</Tag>
      ),
    },
    {
      title: '移动友好',
      dataIndex: 'is_mobile_friendly',
      key: 'is_mobile_friendly',
      width: 100,
      render: (isFriendly: boolean) => (
        <Tag 
          icon={isFriendly ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isFriendly ? 'success' : 'error'}
        >
          {isFriendly ? '友好' : '不友好'}
        </Tag>
      ),
    },
    {
      title: '评分',
      dataIndex: 'overall_score',
      key: 'overall_score',
      width: 120,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d'}
          format={() => `${score}%`}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '加载时间',
      dataIndex: 'load_time',
      key: 'load_time',
      width: 100,
      render: (time: number) => (
        <Tag color={time < 2 ? 'success' : time < 4 ? 'warning' : 'error'}>
          {time}s
        </Tag>
      ),
    },
    {
      title: '问题数',
      key: 'issues',
      width: 80,
      render: (_: unknown, record: PageSpeedItem) => {
        const issueCount = record.issue_count || 0;
        return (
          <Space>
            {issueCount > 0 && (
              <Badge 
                count={issueCount} 
                style={{ backgroundColor: issueCount > 2 ? '#f5222d' : '#faad14' }} 
              />
            )}
            {issueCount === 0 && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          </Space>
        );
      },
    },
    {
      title: '测试时间',
      dataIndex: 'tested_at',
      key: 'tested_at',
      width: 120,
      render: (time: string) => time ? new Date(time).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: PageSpeedItem) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Popconfirm
            title="确认重测"
            description={`确定要重新测试页面 ${record.page_path} 吗？`}
            onConfirm={() => handleRetest(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<ReloadOutlined />}>
              重测
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleViewDetail = async (record: PageSpeedItem) => {
    try {
      // 并行加载详情和优化建议
      const [detailResponse, suggestionsResponse] = await Promise.all([
        seoApi.getPageSpeedDetail(record.id),
        seoApi.getOptimizationSuggestions(record.id),
      ]);
      
      if (detailResponse.code === 200 && detailResponse.data) {
        setSelectedResult(detailResponse.data);
      } else {
        message.error('获取详情失败');
        return;
      }
      
      if (suggestionsResponse.code === 200 && suggestionsResponse.data) {
        setOptimizationSuggestions(suggestionsResponse.data || []);
      } else {
        setOptimizationSuggestions([]);
      }
      
      setDetailModalVisible(true);
    } catch (error) {
      console.error('获取页面速度详情失败:', error);
      message.error('获取详情失败，请稍后重试');
    }
  };

  const handleRetest = async (record: PageSpeedItem) => {
    message.loading(`正在重新测试 ${record.page_path}...`, 1.5);
    try {
      const response = await seoApi.retestPageSpeed({
        id: record.id,
        platform: 'phone',
      });
      if (response.code === 200 || response.code === 201) {
        // 优先使用后端返回的 message
        message.success(response.message || '重新测试已提交');
        fetchPageSpeedList();
        fetchStatistics();
      } else {
        message.error(response.message || '重新测试失败');
      }
    } catch (error) {
      console.error('重新测试失败:', error);
      message.error('重新测试失败，请稍后重试');
    }
  };

  const handleTest = async () => {
    if (!testUrl) {
      message.warning('请输入要测试的页面URL');
      return;
    }
    
    setTesting(true);
    try {
      // 确保路径以 / 开头
      const path = testUrl.startsWith('/') ? testUrl : `/${testUrl}`;
      const response = await seoApi.testMobilePageSpeed({
        page_path: path,
        platform: 'phone',
      });
      
      if (response.code === 200 || response.code === 201) {
        message.success('移动端页面速度测试已提交，正在后台处理');
        setTestModalVisible(false);
        setTestUrl('');
        fetchStatistics();
        fetchPageSpeedList();
      } else {
        message.error(response.message || '测试提交失败');
      }
    } catch (error) {
      console.error('测试提交失败:', error);
      message.error('测试提交失败，请稍后重试');
    } finally {
      setTesting(false);
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      default:
        return <CheckCircleOutlined style={{ color: '#1890ff' }} />;
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

  // 获取优化建议
  const fetchOptimizationSuggestions = async (id: number) => {
    setSuggestionsLoading(true);
    try {
      const response = await seoApi.getOptimizationSuggestions(id);
      if (response.code === 200 && response.data) {
        setOptimizationSuggestions(response.data || []);
      } else {
        setOptimizationSuggestions([]);
      }
    } catch (error) {
      console.error('获取优化建议失败:', error);
      message.error('获取优化建议失败');
      setOptimizationSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>SEO管理</Breadcrumb.Item>
        <Breadcrumb.Item>移动端SEO检测</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic title="测试页面数" value={statistics?.total_count || 0} prefix={<MobileOutlined />} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic 
              title="优秀页面" 
              value={statistics?.excellent_count || 0} 
              suffix={`/ ${statistics?.total_count || 0}`} 
              valueStyle={{ color: '#3f8600' }} 
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic 
              title="平均评分" 
              value={statistics?.avg_score || 0} 
              suffix="分" 
              valueStyle={{ color: (statistics?.avg_score || 0) >= 80 ? '#3f8600' : '#cf1322' }} 
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic 
              title="需改进" 
              value={statistics?.needs_improvement_count || 0} 
              suffix="个"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="移动端适配测试"
        extra={
          <Button type="primary" icon={<ScanOutlined />} onClick={() => setTestModalVisible(true)}>
            测试新页面
          </Button>
        }
      >
        <Alert
          message="移动端SEO检测说明"
          description="检测页面在移动设备上的适配性，包括视口设置、字体大小、触摸目标、加载速度等关键指标。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table 
          columns={columns} 
          dataSource={pageSpeedList} 
          rowKey="id" 
          loading={listLoading}
          pagination={false}
        />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination 
                current={currentPage} 
                pageSize={pageSize} 
                total={total} 
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange} 
                showSizeChanger 
                showQuickJumper 
                showTotal={(total) => `共 ${total} 条`}
            />
        </div>
      </Card>

      {/* 测试新页面弹窗 */}
      <Modal
        title="移动端适配测试"
        open={testModalVisible}
        onOk={handleTest}
        onCancel={() => setTestModalVisible(false)}
        confirmLoading={testing}
        okButtonProps={{ disabled: !testUrl }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form layout="vertical">
            <Form.Item 
              label="页面URL" 
              required
              validateStatus={!testUrl ? 'error' : ''}
              help={!testUrl ? '请输入页面路径' : ''}
            >
              <Input
                placeholder="输入页面路径，如 /wallpaper/nature"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                prefix="/"
                status={!testUrl ? 'error' : ''}
              />
            </Form.Item>
          </Form>
          <Alert
            message="测试内容"
            description="系统将检测视口设置、字体可读性、触摸目标大小、页面加载速度等移动端SEO关键指标。"
            type="info"
            showIcon
          />
        </Space>
      </Modal>

      {/* 测试详情弹窗 */}
      <Modal
        title="移动端页面速度详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedResult && (
            <Popconfirm
              key="retest"
              title="确认重测"
              description={`确定要重新测试页面 ${selectedResult.page_path} 吗？`}
              onConfirm={() => {
                handleRetest(selectedResult);
                setDetailModalVisible(false);
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button type="primary" icon={<ReloadOutlined />}>
                重新测试
              </Button>
            </Popconfirm>
          ),
        ]}
      >
        {selectedResult && (
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message={selectedResult.is_mobile_friendly ? '✅ 页面移动端适配良好' : '❌ 页面存在移动端适配问题'}
                  type={selectedResult.is_mobile_friendly ? 'success' : 'error'}
                  showIcon
                />
                <Progress
                  type="circle"
                  percent={selectedResult.overall_score}
                  width={80}
                  status={selectedResult.overall_score >= 80 ? 'success' : selectedResult.overall_score >= 60 ? 'normal' : 'exception'}
                />
                <Card size="small" title="测试指标">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="综合评分" value={selectedResult.overall_score} suffix="分" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="加载时间" value={selectedResult.load_time} suffix="秒" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="问题数量" value={selectedResult.issue_count} />
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title="页面信息">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="TTFB" value={selectedResult.ttfb} suffix="秒" />
                    </Col>
                    <Col span={12}>
                      <Statistic title="资源数量" value={selectedResult.resource_count} suffix="个" />
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title="测试信息">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="页面路径" value={selectedResult.page_path} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="测试时间" value={new Date(selectedResult.tested_at).toLocaleString('zh-CN')} />
                    </Col>
                  </Row>
                </Card>
              </Space>
            </TabPane>
            <TabPane tab="问题详情" key="issues">
              {optimizationSuggestions.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {optimizationSuggestions.map((item) => {
                    const suggestionType = item.type || item.suggestion_type || 'unknown';
                    const bgColor = item.priority === 'high' ? '#fff1f0' : item.priority === 'medium' ? '#fffbe6' : '#e6f4ff';
                    const borderColor = item.priority === 'high' ? '#ffccc7' : item.priority === 'medium' ? '#ffe58f' : '#91caff';
                    
                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: bgColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: 8,
                          padding: 16,
                        }}
                      >
                        <Space style={{ marginBottom: 12 }}>
                          {suggestionType === 'image' && <FileImageOutlined />}
                          {suggestionType === 'script' && <CodeOutlined />}
                          {suggestionType === 'css' && <CodeOutlined />}
                          {suggestionType === 'server' && <DatabaseOutlined />}
                          <strong style={{ fontSize: 16 }}>{suggestionType.toUpperCase()}</strong>
                          <Tag color={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}>
                            {item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}
                          </Tag>
                        </Space>
                        <div style={{ marginBottom: 12, color: '#333' }}>
                         
                          {item.title}
                        </div>
                        <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                          <strong>解决方案：</strong> {item.description || item.title}
                        </div>
                      </div>
                    );
                  })}
                </Space>
              ) : (
                <Alert
                  message="暂无问题"
                  description="当前页面移动端适配良好，暂无优化建议。"
                  type="success"
                  showIcon
                />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default MobileSEOTester;

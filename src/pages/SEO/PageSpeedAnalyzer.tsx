import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, message, Alert, Statistic, Row, Col, Progress, Breadcrumb, List, Tabs, Badge, Timeline, Spin, Form, Pagination } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, PlayCircleOutlined, EyeOutlined, ReloadOutlined, DashboardOutlined, FileImageOutlined, CodeOutlined, DatabaseOutlined } from '@ant-design/icons';
import { seoApi, type PageSpeedStatistics, type PageSpeedItem, type PageSpeedDetail } from '../../services/seoApi';

const { TabPane } = Tabs;

const PageSpeedAnalyzer: React.FC = () => {
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<PageSpeedDetail | null>(null);
  const [testing, setTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  
  // 统计数据状态
  const [statistics, setStatistics] = useState<PageSpeedStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  // 列表数据状态
  const [pageSpeedList, setPageSpeedList] = useState<PageSpeedItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 获取页面速度统计数据
  useEffect(() => {
    fetchStatistics();
    fetchPageSpeedList();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await seoApi.getPageSpeedStatistics();
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
      const response = await seoApi.getPageSpeedList({
        currentPage: page,
        pageSize: size,
        platform: 'page',
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
      title: '综合评分',
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
      title: 'LCP',
      dataIndex: 'lcp',
      key: 'lcp',
      width: 80,
      render: (lcp: number) => (
        <Tag color={lcp < 2.5 ? 'success' : lcp < 4 ? 'warning' : 'error'}>
          {lcp}s
        </Tag>
      ),
    },
    {
      title: 'FID',
      dataIndex: 'fid',
      key: 'fid',
      width: 80,
      render: (fid: number) => (
        <Tag color={fid < 100 ? 'success' : fid < 300 ? 'warning' : 'error'}>
          {fid}ms
        </Tag>
      ),
    },
    {
      title: 'CLS',
      dataIndex: 'cls',
      key: 'cls',
      width: 80,
      render: (cls: number) => (
        <Tag color={cls < 0.1 ? 'success' : cls < 0.25 ? 'warning' : 'error'}>
          {cls}
        </Tag>
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
      title: '页面大小',
      dataIndex: 'page_size',
      key: 'page_size',
      width: 100,
      render: (size: number) => `${size}MB`,
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
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: PageSpeedItem) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" icon={<ReloadOutlined />} onClick={() => handleRetest(record)}>
            重测
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewDetail = async (record: PageSpeedItem) => {
    try {
      const response = await seoApi.getPageSpeedDetail(record.id);
      if (response.code === 200 && response.data) {
        setSelectedResult(response.data);
        setDetailModalVisible(true);
      } else {
        message.error('获取详情失败');
      }
    } catch (error) {
      console.error('获取页面速度详情失败:', error);
      message.error('获取详情失败，请稍后重试');
    }
  };

  const handleRetest = async (record: PageSpeedItem) => {
    message.loading(`正在重新测试 ${record.page_path}...`, 1.5);
    try {
      const response = await seoApi.testPageSpeed({
        page_path: record.page_path,
        platform: 'page',
      });
      if (response.code === 200 || response.code === 201) {
        message.success('重新测试已提交');
        fetchPageSpeedList();
        fetchStatistics();
      } else {
        message.error(response.message || '重新测试失败');
      }
    } catch (error) {
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
      const response = await seoApi.testPageSpeed({
        page_path: testUrl.startsWith('/') ? testUrl : `/${testUrl}`,
        platform: 'page',
      });
      
      // 支持200和201状态码都视为成功
      if (response.code === 200 || response.code === 201) {
        message.success('页面速度测试已提交，正在后台处理');
        setTestModalVisible(false);
        setTestUrl('');
        // 刷新统计数据和列表
        fetchStatistics();
        fetchPageSpeedList();
      } else {
        message.error(response.message || '测试提交失败');
      }
    } catch (error: any) {
      console.error('页面速度测试失败:', error);
      message.error(error?.message || '测试提交失败，请稍后重试');
    } finally {
      setTesting(false);
    }
  };

  const getIssueIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <FileImageOutlined />;
      case 'script':
      case 'css':
        return <CodeOutlined />;
      case 'server':
        return <DatabaseOutlined />;
      default:
        return <DashboardOutlined />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>SEO管理</Breadcrumb.Item>
        <Breadcrumb.Item>页面速度分析</Breadcrumb.Item>
      </Breadcrumb>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="已测试页面" 
                value={statistics?.total_count || 0} 
                prefix={<ThunderboltOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="平均评分" 
                value={statistics?.avg_score || 0} 
                suffix="分" 
                valueStyle={{ 
                  color: (statistics?.avg_score || 0) >= 80 ? '#3f8600' : '#cf1322' 
                }} 
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="优秀页面" 
                value={statistics?.excellent_count || 0} 
                suffix="个" 
                valueStyle={{ color: '#3f8600' }} 
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card>
              <Statistic 
                title="待优化页面" 
                value={statistics?.needs_improvement_count || 0} 
                suffix="个" 
                valueStyle={{ color: '#cf1322' }} 
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Card
        title="Core Web Vitals 测试"
        extra={
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={() => {
              setTestUrl('');  // 清空输入框
              setTestModalVisible(true);
            }}
          >
            测试新页面
          </Button>
        }
      >
        <Alert
          message="Core Web Vitals 说明"
          description="Google核心网页指标：LCP(最大内容绘制) < 2.5s，FID(首次输入延迟) < 100ms，CLS(累积布局偏移) < 0.1"
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
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
          />
        </div>
      </Card>

      {/* 测试新页面弹窗 */}
      <Modal
        title="页面速度测试"
        open={testModalVisible}
        onOk={handleTest}
        onCancel={() => setTestModalVisible(false)}
        confirmLoading={testing}
        okButtonProps={{ disabled: !testUrl }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item
            label="页面路径"
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
          <Alert
            message="测试内容"
            description="系统将测试FCP、LCP、FID、CLS等Core Web Vitals指标，分析页面加载性能和用户体验。"
            type="info"
            showIcon
          />
        </Space>
      </Modal>

      {/* 测试详情弹窗 */}
      <Modal
        title="页面速度详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedResult && (
            <Button key="retest" type="primary" icon={<ReloadOutlined />} onClick={() => handleRetest(selectedResult)}>
              重新测试
            </Button>
          ),
        ]}
      >
        {selectedResult && (
          <Tabs defaultActiveKey="vitals">
            <TabPane tab="Core Web Vitals" key="vitals">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Progress
                  type="circle"
                  percent={selectedResult.overall_score}
                  width={80}
                  status={selectedResult.overall_score >= 90 ? 'success' : selectedResult.overall_score >= 70 ? 'normal' : 'exception'}
                />
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" title="FCP (首次内容绘制)">
                      <Statistic value={selectedResult.fcp} suffix="秒" />
                      <Progress percent={Math.min(100, (2.5 / selectedResult.fcp) * 50)} size="small" status={selectedResult.fcp < 1.8 ? 'success' : 'exception'} />
                      <div style={{ fontSize: 12, color: '#999' }}>目标: &lt; 1.8秒</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="LCP (最大内容绘制)">
                      <Statistic value={selectedResult.lcp} suffix="秒" />
                      <Progress percent={Math.min(100, (2.5 / selectedResult.lcp) * 50)} size="small" status={selectedResult.lcp < 2.5 ? 'success' : 'exception'} />
                      <div style={{ fontSize: 12, color: '#999' }}>目标: &lt; 2.5秒</div>
                    </Card>
                  </Col>
                  <Col span={12} style={{ marginTop: 16 }}>
                    <Card size="small" title="FID (首次输入延迟)">
                      <Statistic value={selectedResult.fid} suffix="毫秒" />
                      <Progress percent={Math.min(100, (100 / selectedResult.fid) * 50)} size="small" status={selectedResult.fid < 100 ? 'success' : 'exception'} />
                      <div style={{ fontSize: 12, color: '#999' }}>目标: &lt; 100毫秒</div>
                    </Card>
                  </Col>
                  <Col span={12} style={{ marginTop: 16 }}>
                    <Card size="small" title="CLS (累积布局偏移)">
                      <Statistic value={selectedResult.cls} />
                      <Progress percent={Math.min(100, (0.1 / selectedResult.cls) * 50)} size="small" status={selectedResult.cls < 0.1 ? 'success' : 'exception'} />
                      <div style={{ fontSize: 12, color: '#999' }}>目标: &lt; 0.1</div>
                    </Card>
                  </Col>
                </Row>
              </Space>
            </TabPane>
            <TabPane tab="资源分析" key="resources">
              <Card size="small" title="页面资源统计">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="页面大小" value={selectedResult.page_size} suffix="MB" />
                  </Col>
                  <Col span={8}>
                    <Statistic title="资源数量" value={selectedResult.resource_count} suffix="个" />
                  </Col>
                  <Col span={8}>
                    <Statistic title="TTFB" value={selectedResult.ttfb} suffix="秒" />
                  </Col>
                </Row>
              </Card>
              <Card size="small" title="加载时间线" style={{ marginTop: 16 }}>
                <Timeline>
                  <Timeline.Item color="green">TTFB: {selectedResult.ttfb}秒 - 首字节时间</Timeline.Item>
                  <Timeline.Item color="green">FCP: {selectedResult.fcp}秒 - 首次内容绘制</Timeline.Item>
                  <Timeline.Item color={selectedResult.lcp < 2.5 ? 'green' : 'orange'}>
                    LCP: {selectedResult.lcp}秒 - 最大内容绘制
                  </Timeline.Item>
                  <Timeline.Item color={selectedResult.load_time < 3 ? 'green' : 'red'}>
                    完全加载: {selectedResult.load_time}秒
                  </Timeline.Item>
                </Timeline>
              </Card>
            </TabPane>
            <TabPane tab="优化建议" key="issues">
              <List
                dataSource={selectedResult.issues}
                renderItem={(item) => (
                  <List.Item>
                    <Alert
                      message={
                        <Space>
                          {getIssueIcon(item.category)}
                          <strong>{item.category.toUpperCase()}</strong>
                          <Tag color={getImpactColor(item.impact)}>{item.impact}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <p>{item.message}</p>
                          <p style={{ color: '#52c41a' }}><strong>解决方案：</strong>{item.solution}</p>
                        </div>
                      }
                      type={item.type as any}
                      style={{ width: '100%' }}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default PageSpeedAnalyzer;

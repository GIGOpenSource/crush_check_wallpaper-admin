import React, { useState } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, message, Alert, Statistic, Row, Col, Progress, Breadcrumb, List, Tabs, Badge, Timeline } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, PlayCircleOutlined, EyeOutlined, ReloadOutlined, DashboardOutlined, FileImageOutlined, CodeOutlined, DatabaseOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

interface SpeedTestResult {
  id: number;
  url: string;
  overallScore: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  loadTime: number;
  pageSize: number;
  resourceCount: number;
  issues: SpeedIssue[];
  testedAt: string;
}

interface SpeedIssue {
  type: 'error' | 'warning' | 'info';
  category: 'image' | 'script' | 'css' | 'server' | 'render';
  message: string;
  impact: 'high' | 'medium' | 'low';
  solution: string;
}

const PageSpeedAnalyzer: React.FC = () => {
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SpeedTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('');

  // 测试结果数据
  const testResults: SpeedTestResult[] = [
    {
      id: 1,
      url: '/wallpaper/nature-landscape',
      overallScore: 85,
      fcp: 1.2,
      lcp: 2.1,
      fid: 15,
      cls: 0.05,
      ttfb: 0.3,
      loadTime: 2.3,
      pageSize: 2.4,
      resourceCount: 45,
      issues: [
        { type: 'warning', category: 'image', message: '部分图片未压缩', impact: 'medium', solution: '使用WebP格式并启用图片压缩' },
        { type: 'info', category: 'script', message: '存在未使用的JavaScript', impact: 'low', solution: '移除或延迟加载未使用的脚本' },
      ],
      testedAt: '2024-01-20',
    },
    {
      id: 2,
      url: '/wallpaper/anime-collection',
      overallScore: 62,
      fcp: 2.8,
      lcp: 4.5,
      fid: 120,
      cls: 0.25,
      ttfb: 0.8,
      loadTime: 5.2,
      pageSize: 5.8,
      resourceCount: 78,
      issues: [
        { type: 'error', category: 'image', message: '图片文件过大，平均单张超过500KB', impact: 'high', solution: '压缩图片至200KB以下，使用懒加载' },
        { type: 'error', category: 'script', message: 'JavaScript执行时间过长', impact: 'high', solution: '代码分割，延迟加载非关键脚本' },
        { type: 'warning', category: 'css', message: '存在阻塞渲染的CSS', impact: 'medium', solution: '内联关键CSS，异步加载非关键样式' },
        { type: 'warning', category: 'server', message: 'TTFB超过600ms', impact: 'medium', solution: '启用CDN，优化服务器响应时间' },
      ],
      testedAt: '2024-01-19',
    },
    {
      id: 3,
      url: '/category/minimalist',
      overallScore: 92,
      fcp: 0.8,
      lcp: 1.5,
      fid: 10,
      cls: 0.02,
      ttfb: 0.2,
      loadTime: 1.6,
      pageSize: 1.2,
      resourceCount: 28,
      issues: [
        { type: 'info', category: 'render', message: '可以进一步优化首屏渲染', impact: 'low', solution: '考虑使用服务端渲染(SSR)' },
      ],
      testedAt: '2024-01-18',
    },
  ];

  const columns = [
    {
      title: '页面',
      dataIndex: 'url',
      key: 'url',
      render: (text: string) => (
        <div style={{ fontWeight: 500 }}>{text}</div>
      ),
    },
    {
      title: '综合评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 120,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#f5222d'}
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
      dataIndex: 'loadTime',
      key: 'loadTime',
      width: 100,
      render: (time: number) => (
        <Tag color={time < 2 ? 'success' : time < 4 ? 'warning' : 'error'}>
          {time}s
        </Tag>
      ),
    },
    {
      title: '页面大小',
      dataIndex: 'pageSize',
      key: 'pageSize',
      width: 100,
      render: (size: number) => `${size}MB`,
    },
    {
      title: '问题数',
      key: 'issues',
      width: 100,
      render: (_: unknown, record: SpeedTestResult) => {
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
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: SpeedTestResult) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" icon={<ReloadOutlined />} onClick={() => handleRetest(record)}>重测</Button>
        </Space>
      ),
    },
  ];

  const handleViewDetail = (record: SpeedTestResult) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

  const handleRetest = (record: SpeedTestResult) => {
    message.loading(`正在重新测试 ${record.url}...`, 1.5);
    setTimeout(() => {
      message.success('测试完成');
    }, 1500);
  };

  const handleTest = () => {
    if (!testUrl) {
      message.warning('请输入要测试的页面URL');
      return;
    }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      message.success('页面速度测试完成');
      setTestModalVisible(false);
      setTestUrl('');
    }, 2000);
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

  // 计算统计数据
  const totalTests = testResults.length;
  const avgScore = Math.floor(testResults.reduce((sum, r) => sum + r.overallScore, 0) / totalTests);
  const avgLoadTime = (testResults.reduce((sum, r) => sum + r.loadTime, 0) / totalTests).toFixed(1);
  const totalIssues = testResults.reduce((sum, r) => sum + r.issues.length, 0);

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>SEO管理</Breadcrumb.Item>
        <Breadcrumb.Item>页面速度分析</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="已测试页面" value={totalTests} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="平均评分" value={avgScore} suffix="分" valueStyle={{ color: avgScore >= 80 ? '#3f8600' : '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="平均加载时间" value={avgLoadTime} suffix="秒" valueStyle={{ color: Number(avgLoadTime) < 2 ? '#3f8600' : '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="待优化问题" value={totalIssues} suffix="个" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Core Web Vitals 测试"
        extra={
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setTestModalVisible(true)}>
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
        <Table columns={columns} dataSource={testResults} rowKey="id" />
      </Card>

      {/* 测试新页面弹窗 */}
      <Modal
        title="页面速度测试"
        open={testModalVisible}
        onOk={handleTest}
        onCancel={() => setTestModalVisible(false)}
        confirmLoading={testing}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="输入页面路径，如 /wallpaper/nature"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            prefix="/"
          />
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
                <Alert
                  message={`综合评分: ${selectedResult.overallScore}/100`}
                  type={selectedResult.overallScore >= 90 ? 'success' : selectedResult.overallScore >= 70 ? 'warning' : 'error'}
                  showIcon
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
                    <Statistic title="页面大小" value={selectedResult.pageSize} suffix="MB" />
                  </Col>
                  <Col span={8}>
                    <Statistic title="资源数量" value={selectedResult.resourceCount} suffix="个" />
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
                  <Timeline.Item color={selectedResult.loadTime < 3 ? 'green' : 'red'}>
                    完全加载: {selectedResult.loadTime}秒
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

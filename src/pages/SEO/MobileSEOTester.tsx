import React, { useState } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, message, Alert, Statistic, Row, Col, Progress, Breadcrumb, List, Tabs, Badge, Radio } from 'antd';
import { MobileOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, ScanOutlined, EyeOutlined, ReloadOutlined, TabletOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

interface MobileTestResult {
  id: number;
  url: string;
  device: 'mobile' | 'tablet';
  isMobileFriendly: boolean;
  viewport: boolean;
  fontSize: boolean;
  touchTargets: boolean;
  loadTime: number;
  score: number;
  issues: MobileIssue[];
  testedAt: string;
}

interface MobileIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  solution: string;
}

const MobileSEOTester: React.FC = () => {
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<MobileTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testDevice, setTestDevice] = useState<'mobile' | 'tablet'>('mobile');

  // 测试结果数据
  const testResults: MobileTestResult[] = [
    {
      id: 1,
      url: '/wallpaper/nature-landscape',
      device: 'mobile',
      isMobileFriendly: true,
      viewport: true,
      fontSize: true,
      touchTargets: true,
      loadTime: 1.8,
      score: 92,
      issues: [
        { type: 'info', category: '图片优化', message: '部分图片未使用响应式尺寸', solution: '使用srcset属性提供不同尺寸图片' },
      ],
      testedAt: '2024-01-20',
    },
    {
      id: 2,
      url: '/wallpaper/anime-collection',
      device: 'mobile',
      isMobileFriendly: false,
      viewport: true,
      fontSize: false,
      touchTargets: false,
      loadTime: 3.5,
      score: 58,
      issues: [
        { type: 'error', category: '字体大小', message: '字体大小小于12px，难以阅读', solution: '将字体大小调整为至少16px' },
        { type: 'error', category: '触摸目标', message: '按钮间距过小，容易误触', solution: '增大按钮尺寸至48x48px以上' },
        { type: 'warning', category: '加载速度', message: '页面加载时间超过3秒', solution: '优化图片大小，启用懒加载' },
      ],
      testedAt: '2024-01-19',
    },
    {
      id: 3,
      url: '/category/minimalist',
      device: 'tablet',
      isMobileFriendly: true,
      viewport: true,
      fontSize: true,
      touchTargets: true,
      loadTime: 1.2,
      score: 88,
      issues: [
        { type: 'warning', category: '布局', message: '平板设备上内容宽度未充分利用', solution: '优化响应式布局断点' },
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
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
        </div>
      ),
    },
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
      width: 100,
      render: (device: string) => (
        <Tag icon={device === 'mobile' ? <MobileOutlined /> : <TabletOutlined />}>
          {device === 'mobile' ? '手机' : '平板'}
        </Tag>
      ),
    },
    {
      title: '移动友好',
      dataIndex: 'isMobileFriendly',
      key: 'isMobileFriendly',
      width: 100,
      render: (friendly: boolean) => (
        friendly ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>友好</Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>不友好</Tag>
        )
      ),
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
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
      title: '加载时间',
      dataIndex: 'loadTime',
      key: 'loadTime',
      width: 100,
      render: (time: number) => (
        <Tag color={time < 2 ? 'success' : time < 3 ? 'warning' : 'error'}>
          {time}s
        </Tag>
      ),
    },
    {
      title: '问题数',
      key: 'issues',
      width: 100,
      render: (_: unknown, record: MobileTestResult) => {
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
      title: '测试时间',
      dataIndex: 'testedAt',
      key: 'testedAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: MobileTestResult) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" icon={<ReloadOutlined />} onClick={() => handleRetest(record)}>重测</Button>
        </Space>
      ),
    },
  ];

  const handleViewDetail = (record: MobileTestResult) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

  const handleRetest = (record: MobileTestResult) => {
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
      message.success('移动端适配测试完成');
      setTestModalVisible(false);
      setTestUrl('');
    }, 2000);
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

  // 计算统计数据
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.isMobileFriendly).length;
  const avgScore = Math.floor(testResults.reduce((sum, r) => sum + r.score, 0) / totalTests);
  const avgLoadTime = (testResults.reduce((sum, r) => sum + r.loadTime, 0) / totalTests).toFixed(1);

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>SEO管理</Breadcrumb.Item>
        <Breadcrumb.Item>移动端SEO检测</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="测试页面数" value={totalTests} prefix={<MobileOutlined />} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card>
            <Statistic title="移动友好页面" value={passedTests} suffix={`/${totalTests}`} valueStyle={{ color: '#3f8600' }} />
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
        <Table columns={columns} dataSource={testResults} rowKey="id" />
      </Card>

      {/* 测试新页面弹窗 */}
      <Modal
        title="移动端适配测试"
        open={testModalVisible}
        onOk={handleTest}
        onCancel={() => setTestModalVisible(false)}
        confirmLoading={testing}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form layout="vertical">
            <Form.Item label="页面URL" required>
              <Input
                placeholder="输入页面路径，如 /wallpaper/nature"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                prefix="/"
              />
            </Form.Item>
            <Form.Item label="测试设备">
              <Radio.Group value={testDevice} onChange={(e) => setTestDevice(e.target.value)}>
                <Radio.Button value="mobile"><MobileOutlined /> 手机</Radio.Button>
                <Radio.Button value="tablet"><TabletOutlined /> 平板</Radio.Button>
              </Radio.Group>
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
        title="移动端测试详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
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
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message={selectedResult.isMobileFriendly ? '页面移动端适配良好' : '页面存在移动端适配问题'}
                  type={selectedResult.isMobileFriendly ? 'success' : 'error'}
                  showIcon
                />
                <Card size="small" title="测试指标">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="综合评分" value={selectedResult.score} suffix="/100" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="加载时间" value={selectedResult.loadTime} suffix="秒" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="问题数量" value={selectedResult.issues.length} />
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title="检测项">
                  <List>
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>视口设置</span>
                        {selectedResult.viewport ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>通过</Tag>
                        ) : (
                          <Tag color="error" icon={<CloseCircleOutlined />}>未通过</Tag>
                        )}
                      </Space>
                    </List.Item>
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>字体大小</span>
                        {selectedResult.fontSize ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>通过</Tag>
                        ) : (
                          <Tag color="error" icon={<CloseCircleOutlined />}>未通过</Tag>
                        )}
                      </Space>
                    </List.Item>
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>触摸目标</span>
                        {selectedResult.touchTargets ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>通过</Tag>
                        ) : (
                          <Tag color="error" icon={<CloseCircleOutlined />}>未通过</Tag>
                        )}
                      </Space>
                    </List.Item>
                  </List>
                </Card>
              </Space>
            </TabPane>
            <TabPane tab="问题详情" key="issues">
              <List
                dataSource={selectedResult.issues}
                renderItem={(item) => (
                  <List.Item>
                    <Alert
                      message={
                        <Space>
                          {getIssueIcon(item.type)}
                          <strong>{item.category}</strong>
                        </Space>
                      }
                      description={
                        <div>
                          <p>{item.message}</p>
                          <p style={{ color: '#52c41a' }}><strong>解决方案：</strong>{item.solution}</p>
                        </div>
                      }
                      type={getIssueColor(item.type) as any}
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

export default MobileSEOTester;

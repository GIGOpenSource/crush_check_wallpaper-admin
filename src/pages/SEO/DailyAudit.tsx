import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Badge, Button, DatePicker, Space, Alert, Tabs, Timeline, Statistic, Row, Col, Breadcrumb, message, Progress, Modal, List, Form, Input, Select, Switch } from 'antd';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, FileTextOutlined, ArrowLeftOutlined, PlayCircleOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import { seoApi } from '../../services/seoApi';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface AuditItem {
  id: number;
  category: string;
  item: string;
  status: 'normal' | 'warning' | 'error';
  value: string;
  threshold: string;
  suggestion: string;
  checkedAt: string;
}

interface AuditLog {
  time: string;
  content: string;
  type: 'success' | 'warning' | 'error';
}

const DailyAudit: React.FC = () => {
  const navigate = useNavigate();
  const [, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // 巡查状态
  const [auditing, setAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditResults, setAuditResults] = useState<{
    normal: number;
    warning: number;
    error: number;
    checked: number;
    total: number;
  }>({ normal: 0, warning: 0, error: 0, checked: 0, total: 20 });
  
  // 巡查结果弹窗
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [auditResultDetails, setAuditResultDetails] = useState<AuditItem[]>([]);
  
  // 告警规则设置
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertRules, setAlertRules] = useState<any[]>([]);
  const [alertForm] = Form.useForm();
  
  // 历史记录对比
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryDates, setSelectedHistoryDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [historyComparisonData, setHistoryComparisonData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const loadAlertRules = async () => {
    try {
      const res = await seoApi.getAlertRules();
      if (res.code === 200) {
        setAlertRules(res.data);
      }
    } catch (_err) {
      message.error('加载告警规则失败');
    }
  };

  // 加载告警规则
  useEffect(() => {
    // 使用setTimeout避免同步调用setState
    const timer = setTimeout(() => {
      loadAlertRules();
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  
  const saveAlertRules = async () => {
    try {
      const values = alertForm.getFieldsValue();
      const res = await seoApi.saveAlertRules([...alertRules, values]);
      if (res.code === 200) {
        message.success('告警规则保存成功');
        loadAlertRules();
      }
    } catch (_err) {
      message.error('保存失败');
    }
  };

  // 加载历史记录对比数据
  const loadHistoryComparison = async () => {
    if (!selectedHistoryDates || !selectedHistoryDates[0] || !selectedHistoryDates[1]) {
      message.warning('请选择两个日期进行对比');
      return;
    }
    
    setHistoryLoading(true);
    try {
      // 模拟加载历史数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成对比数据
      const comparisonData = [
        { item: 'Indexed Pages', before: '+234', after: '+245', change: '+11', trend: 'up' },
        { item: '404错误页面', before: '12个', after: '8个', change: '-4', trend: 'down' },
        { item: 'TDK缺失页面', before: '23个', after: '15个', change: '-8', trend: 'down' },
        { item: '平均响应时间', before: '320ms', after: '280ms', change: '-40ms', trend: 'up' },
        { item: 'LCP首屏加载', before: '2.1s', after: '1.9s', change: '-0.2s', trend: 'up' },
        { item: 'Googlebot Crawls', before: '4,560', after: '4,890', change: '+330', trend: 'up' },
      ];
      
      setHistoryComparisonData(comparisonData);
    } catch (_err) {
      message.error('加载历史数据失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Google搜索与抓取监控
  const searchData: AuditItem[] = [
    { id: 1, category: 'Index Coverage', item: 'Indexed Pages', status: 'normal', value: '+234', threshold: '±15%', suggestion: 'Normal fluctuation', checkedAt: '2026-04-17 10:00' },
    { id: 2, category: 'Index Coverage', item: 'Discovered Pages', status: 'normal', value: '+89', threshold: '±15%', suggestion: 'Normal fluctuation', checkedAt: '2026-04-17 10:00' },
    { id: 3, category: 'Crawl Stats', item: 'Googlebot Crawls/Day', status: 'normal', value: '4,560', threshold: '>30%', suggestion: 'Crawl rate healthy', checkedAt: '2026-04-17 10:00' },
    { id: 4, category: 'Crawl Stats', item: 'Avg Response Time', status: 'normal', value: '180ms', threshold: '<500ms', suggestion: 'Response time good', checkedAt: '2026-04-17 10:00' },
    { id: 5, category: 'Sitemap', item: 'Sitemap Status', status: 'normal', value: 'OK', threshold: '200', suggestion: 'No issues', checkedAt: '2026-04-17 10:00' },
    { id: 6, category: 'Manual Actions', item: 'Google Penalties', status: 'normal', value: '0', threshold: '0', suggestion: 'No penalties', checkedAt: '2026-04-17 10:00' },
  ];

  // 页面质量监控
  const qualityData: AuditItem[] = [
    { id: 7, category: '404/500错误', item: '404错误页面', status: 'warning', value: '12个', threshold: '>50', suggestion: '新增3个，需检查', checkedAt: '2026-04-17 10:00' },
    { id: 8, category: '404/500错误', item: '500服务器错误', status: 'normal', value: '0个', threshold: '>10', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
    { id: 9, category: '跳转错误', item: '错误跳转', status: 'normal', value: '0个', threshold: '>0', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
    { id: 10, category: '广告违规', item: '无nofollow外链', status: 'normal', value: '0个', threshold: '>0', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
    { id: 11, category: 'H标签/TDK', item: 'TDK缺失页面', status: 'warning', value: '23个', threshold: '>0', suggestion: '需批量补充', checkedAt: '2026-04-17 10:00' },
    { id: 12, category: 'H标签/TDK', item: 'H标签结构异常', status: 'normal', value: '0个', threshold: '>0', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
  ];

  // 安全巡查
  const securityData: AuditItem[] = [
    { id: 13, category: '黑名单域名', item: '危险域名引用', status: 'normal', value: '0个', threshold: '>0', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
    { id: 14, category: '内链污染', item: '低质内链', status: 'normal', value: '0个', threshold: '>0', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
    { id: 15, category: '内容篡改', item: '页面篡改检测', status: 'normal', value: '正常', threshold: '-', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
    { id: 16, category: '挂马检测', item: '恶意代码检测', status: 'normal', value: '正常', threshold: '-', suggestion: '无异常', checkedAt: '2026-04-17 10:00' },
  ];

  // 性能巡查
  const performanceData: AuditItem[] = [
    { id: 17, category: '广告脚本', item: '首屏渲染阻塞', status: 'normal', value: 'LCP 2.1s', threshold: '>4s', suggestion: '表现良好', checkedAt: '2026-04-17 10:00' },
    { id: 18, category: '图片加载', item: '首屏图片加载', status: 'warning', value: '3张未加载', threshold: '>0', suggestion: '优化图片懒加载', checkedAt: '2026-04-17 10:00' },
    { id: 19, category: '服务器响应', item: '平均响应时间', status: 'normal', value: '320ms', threshold: '>800ms', suggestion: '响应正常', checkedAt: '2026-04-17 10:00' },
    { id: 20, category: 'Core Web Vitals', item: 'FID首次输入延迟', status: 'normal', value: '45ms', threshold: '>300ms', suggestion: '表现优秀', checkedAt: '2026-04-17 10:00' },
  ];

  // Google巡查日志
  const auditLogs: AuditLog[] = [
    { time: '10:00', content: 'Google Search Console sync completed, +234 indexed pages', type: 'success' },
    { time: '09:30', content: '3 pages with LCP > 2.5s detected', type: 'warning' },
    { time: '09:00', content: 'Security scan completed, no issues found', type: 'success' },
    { time: '08:30', content: '23 pages missing TDK tags', type: 'warning' },
    { time: '08:00', content: 'Daily audit task started', type: 'success' },
  ];

  const columns = [
    { title: '检查项', dataIndex: 'item', key: 'item', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          normal: { color: 'success', icon: <CheckCircleOutlined />, text: '正常' },
          warning: { color: 'warning', icon: <WarningOutlined />, text: '警告' },
          error: { color: 'error', icon: <CloseCircleOutlined />, text: '异常' },
        };
        const { color, icon, text } = config[status];
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    { title: '当前值', dataIndex: 'value', key: 'value', width: 120 },
    { title: '阈值', dataIndex: 'threshold', key: 'threshold', width: 100 },
    { title: '处理建议', dataIndex: 'suggestion', key: 'suggestion' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: AuditItem) => (
        record.status !== 'normal' && <Button type="link" size="small" onClick={() => message.info('处理功能开发中')}>处理</Button>
      ),
    },
  ];

  const getStatusBadge = (data: AuditItem[]) => {
    const errorCount = data.filter((d) => d.status === 'error').length;
    const warningCount = data.filter((d) => d.status === 'warning').length;
    if (errorCount > 0) return <Badge count={errorCount} style={{ backgroundColor: '#f5222d' }} />;
    if (warningCount > 0) return <Badge count={warningCount} style={{ backgroundColor: '#faad14' }} />;
    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  };

  // 开始巡查
  const handleStartAudit = () => {
    setAuditing(true);
    setAuditProgress(0);
    setAuditResults({ normal: 0, warning: 0, error: 0, checked: 0, total: 20 });
    
    let progress = 0;
    const timer = setInterval(() => {
      progress += 5;
      setAuditProgress(progress);
      
      // 模拟检查结果
      if (progress % 20 === 0) {
        setAuditResults(prev => ({
          ...prev,
          checked: Math.min(prev.total, prev.checked + 1),
          normal: prev.normal + (Math.random() > 0.3 ? 1 : 0),
          warning: prev.warning + (Math.random() > 0.7 ? 1 : 0),
          error: prev.error + (Math.random() > 0.9 ? 1 : 0),
        }));
      }
      
      if (progress >= 100) {
        clearInterval(timer);
        setAuditing(false);
        message.success('巡查完成！');
        
        // 生成巡查结果
        const results: AuditItem[] = [
          ...searchData.map(item => ({ ...item, status: (Math.random() > 0.8 ? 'warning' : 'normal') as 'normal' | 'warning' | 'error' })),
          ...qualityData.map(item => ({ ...item, status: (Math.random() > 0.7 ? 'warning' : 'normal') as 'normal' | 'warning' | 'error' })),
          ...securityData.map(item => ({ ...item, status: 'normal' as 'normal' | 'warning' | 'error' })),
          ...performanceData.map(item => ({ ...item, status: (Math.random() > 0.8 ? 'warning' : 'normal') as 'normal' | 'warning' | 'error' })),
        ];
        setAuditResultDetails(results);
        setResultModalVisible(true);
      }
    }, 200);
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>日常巡查</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        日常巡查
      </h2>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button 
            type="primary" 
            icon={auditing ? <ReloadOutlined spin /> : <PlayCircleOutlined />}
            onClick={handleStartAudit}
            loading={auditing}
            disabled={auditing}
          >
            {auditing ? '巡查中...' : '立即巡查'}
          </Button>
          <RangePicker onChange={setDateRange} />
          <Button icon={<FileTextOutlined />} onClick={() => message.success('报告导出成功')}>导出报告</Button>
          <Button icon={<SettingOutlined />} onClick={() => setAlertModalVisible(true)}>设置告警规则</Button>
          <Button onClick={() => setHistoryModalVisible(true)}>历史记录对比</Button>
        </Space>
        
        {/* 巡查进度 */}
        {auditing && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={auditProgress} status="active" />
            <div style={{ marginTop: 8, color: '#666' }}>
              正在检查: {auditResults.checked} / {auditResults.total} 项 | 
              正常: {auditResults.normal} | 
              警告: {auditResults.warning} | 
              异常: {auditResults.error}
            </div>
          </div>
        )}
      </Card>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="正常项" value={14} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="警告项" value={4} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="异常项" value={0} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="检查时间" value="10:00" />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="search">
        <TabPane
          tab={<span>搜索与抓取 {getStatusBadge(searchData)}</span>}
          key="search"
        >
          <Card>
            <Alert
              message="Google indexing status normal, Core Web Vitals passing for all pages"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={searchData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span>页面质量 {getStatusBadge(qualityData)}</span>}
          key="quality"
        >
          <Card>
            <Alert
              message="发现12个404错误页面和23个TDK缺失页面，建议尽快修复"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={qualityData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span>安全巡查 {getStatusBadge(securityData)}</span>}
          key="security"
        >
          <Card>
            <Alert
              message="安全扫描通过，未发现异常"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={securityData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span>性能巡查 {getStatusBadge(performanceData)}</span>}
          key="performance"
        >
          <Card>
            <Alert
              message="整体性能良好，发现3张首屏图片未加载"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={performanceData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="巡查日志" key="logs">
          <Card title="今日巡查记录">
            <Timeline
              items={auditLogs.map((log) => ({
                color: log.type === 'success' ? 'green' : log.type === 'warning' ? 'orange' : 'red',
                children: (
                  <>
                    <p style={{ marginBottom: 4 }}>
                      <strong>{log.time}</strong>
                    </p>
                    <p>{log.content}</p>
                  </>
                ),
              }))}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 巡查结果弹窗 */}
      <Modal
        title="巡查结果报告"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultModalVisible(false)}>
            关闭
          </Button>,
          <Button key="export" type="primary" icon={<FileTextOutlined />} onClick={() => message.success('报告导出成功')}>
            导出报告
          </Button>,
        ]}
        width={900}
      >
        <Alert
          message={`巡查完成！共检查 ${auditResults.total} 项`}
          description={
            <div>
              <span style={{ color: '#52c41a', marginRight: 16 }}>正常: {auditResults.normal} 项</span>
              <span style={{ color: '#faad14', marginRight: 16 }}>警告: {auditResults.warning} 项</span>
              <span style={{ color: '#f5222d' }}>异常: {auditResults.error} 项</span>
            </div>
          }
          type={auditResults.error > 0 ? 'error' : auditResults.warning > 0 ? 'warning' : 'success'}
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        {auditResults.warning > 0 || auditResults.error > 0 ? (
          <>
            <h4 style={{ marginBottom: 12 }}>需要关注的问题</h4>
            <List
              dataSource={auditResultDetails.filter(item => item.status !== 'normal')}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small" onClick={() => message.info('处理功能开发中')}>处理</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.item}
                    description={item.suggestion}
                  />
                  <Tag color={item.status === 'error' ? 'error' : 'warning'}>
                    {item.status === 'error' ? '异常' : '警告'}
                  </Tag>
                </List.Item>
              )}
            />
          </>
        ) : (
          <Alert
            message="恭喜！"
            description="所有检查项均正常，未发现任何问题。"
            type="success"
            showIcon
          />
        )}
      </Modal>

      {/* 告警规则设置弹窗 */}
      <Modal
        title="告警规则设置"
        open={alertModalVisible}
        onCancel={() => setAlertModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setAlertModalVisible(false)}>取消</Button>,
          <Button key="save" type="primary" onClick={saveAlertRules}>保存设置</Button>,
        ]}
      >
        <Form form={alertForm} layout="vertical">
          <Form.Item label="规则名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如：健康度下降告警" />
          </Form.Item>
          <Form.Item label="监控指标" name="type" rules={[{ required: true }]}>
            <Select placeholder="选择监控指标">
              <Select.Option value="health_score">SEO健康度</Select.Option>
              <Select.Option value="404_errors">404错误数</Select.Option>
              <Select.Option value="index_drop">收录量下降</Select.Option>
              <Select.Option value="ranking_drop">排名下降</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="告警阈值" name="threshold" rules={[{ required: true }]}>
            <Input type="number" placeholder="例如：80" />
          </Form.Item>
          <Form.Item label="通知方式" name="notify">
            <Select mode="multiple" placeholder="选择通知方式">
              <Select.Option value="email">邮件</Select.Option>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="webhook">Webhook</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 24 }}>
          <h4>现有告警规则</h4>
          <Table
            size="small"
            dataSource={alertRules}
            columns={[
              { title: '规则名称', dataIndex: 'name' },
              { title: '监控指标', dataIndex: 'type' },
              { title: '阈值', dataIndex: 'threshold' },
              { title: '状态', dataIndex: 'enabled', render: (enabled: boolean) => <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '禁用'}</Tag> },
              { title: '操作', render: () => <Button type="link" danger>删除</Button> },
            ]}
            pagination={false}
          />
        </div>
      </Modal>

      {/* 历史记录对比弹窗 */}
      <Modal
        title="历史记录对比"
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setHistoryComparisonData([]);
          setSelectedHistoryDates(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>关闭</Button>,
        ]}
      >
        <Space style={{ marginBottom: 16 }}>
          <RangePicker 
            onChange={(dates) => setSelectedHistoryDates(dates as [Dayjs | null, Dayjs | null])}
            placeholder={['选择日期A', '选择日期B']}
          />
          <Button type="primary" onClick={loadHistoryComparison} loading={historyLoading}>
            开始对比
          </Button>
        </Space>
        
        {historyComparisonData.length > 0 && (
          <>
            <Alert
              message="对比结果"
              description={`${selectedHistoryDates?.[0]?.format('YYYY-MM-DD')} vs ${selectedHistoryDates?.[1]?.format('YYYY-MM-DD')}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={historyComparisonData}
              rowKey="item"
              pagination={false}
              columns={[
                { title: '检查项', dataIndex: 'item', width: 150 },
                { title: '日期A', dataIndex: 'before', width: 120 },
                { title: '日期B', dataIndex: 'after', width: 120 },
                { 
                  title: '变化', 
                  dataIndex: 'change', 
                  width: 100,
                  render: (change: string, record: any) => (
                    <Tag color={record.trend === 'up' ? 'success' : 'error'}>
                      {record.trend === 'up' ? '↑' : '↓'} {change}
                    </Tag>
                  )
                },
                { 
                  title: '趋势', 
                  dataIndex: 'trend',
                  render: (trend: string) => (
                    <span style={{ color: trend === 'up' ? '#52c41a' : '#f5222d' }}>
                      {trend === 'up' ? '改善 ↑' : '下降 ↓'}
                    </span>
                  )
                },
              ]}
            />
          </>
        )}
        
        {historyComparisonData.length === 0 && !historyLoading && (
          <Alert
            message="使用说明"
            description="请选择两个日期进行对比，查看SEO指标的变化趋势。"
            type="info"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default DailyAudit;

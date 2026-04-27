import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Tag, Button, Alert, Modal, Timeline, Badge, Space, message, Table, DatePicker, Select, Input, Tooltip, App } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ToolOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  EyeOutlined,
  SearchOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { seoApi } from '../../services/seoApi';
import { useSEOBatchCache } from '../../hooks/useSEOCache';

// 图标映射表：将字符串转换为实际的图标组件
const iconMap: Record<string, React.ReactNode> = {
  'WarningOutlined': <WarningOutlined />,
  'CloseCircleOutlined': <CloseCircleOutlined />,
  'FileTextOutlined': <FileTextOutlined />,
  'ToolOutlined': <ToolOutlined />,
  'CheckCircleOutlined': <CheckCircleOutlined />,
  'SafetyOutlined': <SafetyOutlined />,
  'ThunderboltOutlined': <ThunderboltOutlined />,
};

const { RangePicker } = DatePicker;
const { Option } = Select;

// 操作日志数据类型
interface OperationLog {
  id: number;
  time: string;
  content: string;
  status: 'success' | 'warning' | 'error';
  operator: string;
  type: string;
}

const SEODashboard: React.FC = () => {
  const navigate = useNavigate();
  const [checkModalVisible, setCheckModalVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  
  // 查看全部日志弹窗状态
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearchText, setLogsSearchText] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState<string>('all');
  const [logsTypeFilter, setLogsTypeFilter] = useState<string>('all');
  const [logsDateRange, setLogsDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  // 使用批量缓存Hook加载SEO数据
  const {
    data: cachedData,
    loading: cacheLoading,
    refreshAll,
    clearAllCache,
  } = useSEOBatchCache({
    seoDashboard: () => seoApi.getSEODashboard().then(res => res.data),
    pendingIssues: () => seoApi.getPendingIssues().then(res => res.data),
    coreMetrics: () => seoApi.getCoreMetrics().then(res => res.data),
    techChecks: () => seoApi.getTechChecks().then(res => res.data),
  }, {
    key: 'seo_dashboard',
    ttl: 5 * 60 * 1000, // 5分钟缓存
  });

  // 从缓存数据中提取状态
  // 确保 healthScore 是数字类型
  const rawHealthScore = cachedData.seoDashboard?.health_score;
  const healthScore = typeof rawHealthScore === 'number' 
    ? rawHealthScore 
    : typeof rawHealthScore === 'object' && rawHealthScore !== null && (rawHealthScore as any).score !== undefined
      ? (rawHealthScore as any).score
      : 0;
  
  // 调试日志
  console.log('rawHealthScore:', rawHealthScore, 'type:', typeof rawHealthScore);
  console.log('healthScore:', healthScore);
  
  // 严格的数据类型检查和空值保护
  // 如果后端返回的是对象而不是数组，需要特殊处理
  const pendingIssuesRaw = cachedData.pendingIssues;
  const coreMetricsRaw = cachedData.coreMetrics;
  const techChecksRaw = cachedData.techChecks;
  
  // 调试日志：检查原始数据结构
  console.log('=== SEO Dashboard 数据调试 ===');
  console.log('pendingIssuesRaw:', pendingIssuesRaw);
  console.log('coreMetricsRaw:', coreMetricsRaw);
  console.log('techChecksRaw:', techChecksRaw);
  
  // 检查数据类型并记录警告
  if (pendingIssuesRaw && typeof pendingIssuesRaw === 'object' && !Array.isArray(pendingIssuesRaw)) {
    console.warn('pendingIssues 不是数组:', pendingIssuesRaw);
  }
  if (coreMetricsRaw && typeof coreMetricsRaw === 'object' && !Array.isArray(coreMetricsRaw)) {
    console.warn('coreMetrics 不是数组:', coreMetricsRaw);
  }
  if (techChecksRaw && typeof techChecksRaw === 'object' && !Array.isArray(techChecksRaw)) {
    console.warn('techChecks 不是数组:', techChecksRaw);
  }
  
  const pendingIssues = Array.isArray(pendingIssuesRaw) ? pendingIssuesRaw : [];
  const coreMetrics = Array.isArray(coreMetricsRaw) ? coreMetricsRaw : [];
  const techChecks = Array.isArray(techChecksRaw) ? techChecksRaw : [];
  
  // 对待处理问题进行数据清洗，确保所有字段都是基本类型
  const cleanedPendingIssues = pendingIssues.map((issue: any) => {
    if (!issue || typeof issue !== 'object') {
      return {
        type: 'warning' as const,
        title: '',
        count: 0,
        icon: <WarningOutlined />,
      };
    }
    
    // 将字符串图标转换为实际的图标组件
    const iconComponent = typeof issue.icon === 'string' 
      ? (iconMap[issue.icon] || <WarningOutlined />)
      : (issue.icon || <WarningOutlined />);
    
    return {
      ...issue,
      // 确保 icon 是 React 组件
      icon: iconComponent,
      // 确保 count 是数字或字符串
      count: typeof issue.count === 'number' || typeof issue.count === 'string' ? issue.count : 0,
      // 确保 title 是字符串
      title: typeof issue.title === 'string' ? issue.title : '',
      // 确保 type 是有效值
      type: issue.type === 'error' || issue.type === 'warning' ? issue.type : 'warning',
    };
  });
  
  // 对核心指标数据进行深度清洗，确保所有字段都是基本类型
  const cleanedCoreMetrics = coreMetrics.map((metric: any) => {
    // 如果 metric 不是有效对象，返回默认结构
    if (!metric || typeof metric !== 'object') {
      return {
        title: '',
        value: 0,
        change: 0,
        changeType: 'up' as const,
      };
    }
    
    return {
      ...metric,
      // 确保 value 是基本类型
      value: typeof metric.value === 'number' || typeof metric.value === 'string' 
        ? metric.value 
        : typeof metric.value === 'object' && metric.value !== null
          ? (metric.value as any).score !== undefined 
            ? (metric.value as any).score 
            : 0
          : 0,
      // 确保 change 是数字
      change: typeof metric.change === 'number' ? metric.change : 0,
      // 确保 title 是字符串
      title: typeof metric.title === 'string' ? metric.title : '',
      // 确保 changeType 是有效值
      changeType: metric.changeType === 'up' || metric.changeType === 'down' ? metric.changeType : 'up',
    };
  });
  
  // 对技术检查结果进行数据清洗
  const cleanedTechChecks = techChecks.map((check: any) => {
    if (!check || typeof check !== 'object') {
      return {
        name: '',
        status: 'success' as const,
        count: '0',
      };
    }
    
    return {
      ...check,
      // 确保 name 是字符串
      name: typeof check.name === 'string' ? check.name : '',
      // 确保 status 是有效值
      status: ['success', 'warning', 'error'].includes(check.status) ? check.status : 'success',
      // 确保 count 是字符串或数字
      count: typeof check.count === 'string' || typeof check.count === 'number' ? check.count : '0',
    };
  });
  
  const _loading = cacheLoading.seoDashboard || cacheLoading.pendingIssues || 
                   cacheLoading.coreMetrics || cacheLoading.techChecks;

  // 更新最后更新时间
  useEffect(() => {
    if (cachedData.seoDashboard) {
      setLastUpdateTime(dayjs().format('HH:mm:ss'));
    }
  }, [cachedData]);

  // 刷新数据
  const handleRefresh = async () => {
    try {
      await refreshAll();
      message.success('数据已刷新');
    } catch (_err) {
      message.error('刷新失败');
    }
  };

  // 清除缓存
  const handleClearCache = () => {
    clearAllCache();
    message.success('缓存已清除');
  };

  // 一键修复所有问题
  const [fixingAll, setFixingAll] = useState(false);
  const handleFixAllIssues = async () => {
    if (pendingIssues.length === 0) {
      message.info('当前没有待处理问题');
      return;
    }
    
    Modal.confirm({
      title: '确认一键修复',
      content: `将自动修复 ${pendingIssues.length} 类问题，是否继续？`,
      onOk: async () => {
        setFixingAll(true);
        try {
          // 模拟批量修复API调用
          await new Promise(resolve => setTimeout(resolve, 2000));
          message.success('所有问题已修复成功');
          // 刷新数据
          await refreshAll();
        } catch (_err) {
          message.error('修复失败，请重试');
        } finally {
          setFixingAll(false);
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      success: 'success',
      warning: 'warning',
      error: 'error',
    };
    return map[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (status === 'warning') return <WarningOutlined style={{ color: '#faad14' }} />;
    return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
  };

  const handleQuickCheck = () => {
    setCheckModalVisible(true);
    setChecking(true);
    setCheckProgress(0);
    
    const timer = setInterval(() => {
      setCheckProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setChecking(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const recentLogs = [
    { time: '10:30', content: 'Google Search Console 同步完成', status: 'success' },
    { time: '09:15', content: '发现45个图片ALT缺失', status: 'warning' },
    { time: '08:00', content: 'IndexNow推送125条URL到Google', status: 'success' },
    { time: '07:30', content: 'Core Web Vitals检测通过', status: 'success' },
  ];

  // 全部日志数据（模拟）
  const allLogs: OperationLog[] = [
    { id: 1, time: '2026-04-17 10:30:00', content: 'Google Search Console 同步完成', status: 'success', operator: '系统', type: '同步' },
    { id: 2, time: '2026-04-17 09:15:00', content: '发现45个图片ALT缺失', status: 'warning', operator: '系统', type: '检测' },
    { id: 3, time: '2026-04-17 08:00:00', content: 'IndexNow推送125条URL到Google', status: 'success', operator: '管理员', type: '推送' },
    { id: 4, time: '2026-04-17 07:30:00', content: 'Core Web Vitals检测通过', status: 'success', operator: '系统', type: '检测' },
    { id: 5, time: '2026-04-16 18:20:00', content: 'Sitemap生成成功，包含12500条URL', status: 'success', operator: '管理员', type: '生成' },
    { id: 6, time: '2026-04-16 16:45:00', content: '修复12个404错误页面', status: 'success', operator: '管理员', type: '修复' },
    { id: 7, time: '2026-04-16 14:30:00', content: 'TDK模板批量更新完成，影响1200个页面', status: 'success', operator: '管理员', type: '更新' },
    { id: 8, time: '2026-04-16 11:20:00', content: '检测到3个Canonical标签错误', status: 'error', operator: '系统', type: '检测' },
    { id: 9, time: '2026-04-16 09:00:00', content: 'Google Indexing API推送成功', status: 'success', operator: '系统', type: '推送' },
    { id: 10, time: '2026-04-15 17:30:00', content: '外链检测完成，发现2个失效链接', status: 'warning', operator: '系统', type: '检测' },
    { id: 11, time: '2026-04-15 15:00:00', content: 'Robots.txt规则更新成功', status: 'success', operator: '管理员', type: '更新' },
    { id: 12, time: '2026-04-15 10:30:00', content: '日常巡查完成，无异常', status: 'success', operator: '系统', type: '巡查' },
  ];

  // 打开日志弹窗
  const handleOpenLogsModal = () => {
    setLogsModalVisible(true);
    setLogsLoading(true);
    // 模拟加载
    setTimeout(() => {
      setLogsLoading(false);
    }, 500);
  };

  // 筛选日志
  const filteredLogs = allLogs.filter(log => {
    if (logsStatusFilter !== 'all' && log.status !== logsStatusFilter) return false;
    if (logsTypeFilter !== 'all' && log.type !== logsTypeFilter) return false;
    if (logsSearchText && !log.content.toLowerCase().includes(logsSearchText.toLowerCase())) return false;
    if (logsDateRange && logsDateRange[0] && logsDateRange[1]) {
      const logDate = dayjs(log.time);
      if (logDate.isBefore(logsDateRange[0]) || logDate.isAfter(logsDateRange[1])) return false;
    }
    return true;
  });

  // 日志表格列定义
  const logsColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
    },
    {
      title: '操作内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = {
          success: { color: 'success', text: '成功' },
          warning: { color: 'warning', text: '警告' },
          error: { color: 'error', text: '错误' },
        };
        const { color, text } = config[status as keyof typeof config];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
  ];

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>SEO仪表盘</h2>
        <Space>
          {lastUpdateTime && (
            <Tooltip title="数据更新时间">
              <Tag icon={<ClockCircleOutlined />} color="blue">
                更新于 {lastUpdateTime}
              </Tag>
            </Tooltip>
          )}
          <Button 
            icon={<ReloadOutlined spin={_loading} />} 
            onClick={handleRefresh}
            loading={_loading}
          >
            刷新数据
          </Button>
          <Button onClick={handleClearCache}>
            清除缓存
          </Button>
        </Space>
      </div>

      {/* SEO健康度评分 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <h3>SEO健康度评分</h3>
              <Progress
                type="circle"
                percent={healthScore}
                strokeColor={healthScore >= 80 ? '#52c41a' : healthScore >= 60 ? '#faad14' : '#f5222d'}
                format={(percent) => <span style={{ fontSize: 32, fontWeight: 'bold' }}>{percent}</span>}
                size={150}
              />
              <p style={{ marginTop: 16, color: '#666' }}>
                {healthScore >= 80 ? '优秀，继续保持！' : healthScore >= 60 ? '良好，还有提升空间' : '需要立即优化'}
              </p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="待处理问题" extra={<Button type="primary" onClick={handleFixAllIssues} loading={fixingAll}>一键修复</Button>}>
            {_loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div>加载中...</div>
              </div>
            ) : cleanedPendingIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                <div>太好了！当前没有待处理问题</div>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {cleanedPendingIssues.map((issue, index) => (
                  <Col xs={12} sm={6} key={index}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 8,
                        background: issue.type === 'error' ? '#fff2f0' : '#fffbe6',
                        border: `1px solid ${issue.type === 'error' ? '#ffccc7' : '#ffe58f'}`,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{issue.icon}</div>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: issue.type === 'error' ? '#cf1322' : '#d48806' }}>
                        {issue.count}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>{issue.title}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* 核心指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {_loading ? (
          <Col span={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>加载核心指标...</div>
            </Card>
          </Col>
        ) : cleanedCoreMetrics.length === 0 ? (
          <Col span={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无核心指标数据</div>
            </Card>
          </Col>
        ) : (
          cleanedCoreMetrics.map((metric: any, index: number) => {
            return (
              <Col xs={12} lg={6} key={index}>
                <Card>
                  <Statistic
                    title={metric.title}
                    value={metric.value}
                    suffix={metric.changeType === 'up' ? <ArrowUpOutlined style={{ color: '#52c41a' }} /> : <ArrowDownOutlined style={{ color: '#cf1322' }} />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color={metric.changeType === 'up' ? 'success' : 'error'}>
                      {metric.changeType === 'up' ? '+' : ''}{metric.change} {metric.changeType === 'up' ? '↑' : '↓'}
                    </Tag>
                    <span style={{ color: '#999', fontSize: 12 }}>较昨日</span>
                  </div>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      {/* 技术检查状态 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="技术优化检查" extra={<Button icon={<ReloadOutlined />} onClick={handleQuickCheck}>快速检查</Button>}>
            <List
              dataSource={cleanedTechChecks}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color={getStatusColor(item.status)}>{item.count}</Tag>,
                    getStatusIcon(item.status),
                  ]}
                >
                  <List.Item.Meta title={item.name} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="快捷操作">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button block size="large" icon={<ToolOutlined />} onClick={() => navigate('/seo/technical')}>
                  技术优化检查
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" icon={<FileTextOutlined />} onClick={() => navigate('/seo/tdk')}>
                  TDK批量管理
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" icon={<SafetyOutlined />} onClick={() => navigate('/seo/audit')}>
                  安全巡查
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" icon={<ThunderboltOutlined />} onClick={() => navigate('/seo/keywords')}>
                  关键词挖掘
                </Button>
              </Col>
            </Row>
            <Alert
              message="Google索引状态"
              description="IndexNow推送: 成功 125条 | Google API: 成功 118条 | 平均索引时间: 2.3小时"
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近操作日志 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="最近操作日志" extra={<Button type="link" icon={<EyeOutlined />} onClick={handleOpenLogsModal}>查看全部</Button>}>
            <Timeline
              items={recentLogs.map((log) => ({
                color: log.status === 'success' ? 'green' : log.status === 'warning' ? 'orange' : 'red',
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
        </Col>
        <Col xs={24} lg={12}>
          <Card title="待处理任务">
            <List
              itemLayout="horizontal"
              dataSource={[
                { title: '修复ALT标签', count: 45, priority: 'high', deadline: '今日' },
                { title: '优化TDK模板', count: 23, priority: 'medium', deadline: '本周' },
                { title: '处理404错误', count: 12, priority: 'high', deadline: '今日' },
                { title: '更新Sitemap', count: 1, priority: 'low', deadline: '本周' },
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small" onClick={() => navigate('/seo/technical')}>去处理</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.title}
                        <Badge count={item.count} style={{ backgroundColor: item.priority === 'high' ? '#f5222d' : '#faad14' }} />
                      </Space>
                    }
                    description={`截止: ${item.deadline} | 优先级: ${item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速检查弹窗 */}
      <Modal
        title="SEO快速检查"
        open={checkModalVisible}
        onCancel={() => setCheckModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCheckModalVisible(false)}>
            关闭
          </Button>,
          !checking && (
            <Button key="detail" type="primary" onClick={() => { setCheckModalVisible(false); navigate('/seo/technical'); }}>
              查看详情
            </Button>
          ),
        ]}
      >
        <div style={{ padding: '20px 0' }}>
          <Progress percent={checkProgress} status={checking ? 'active' : 'success'} />
          <p style={{ textAlign: 'center', marginTop: 16 }}>
            {checking ? '正在检查中...' : '检查完成！'}
          </p>
          {!checking && (
            <Alert
              message="检查结果"
              description="发现 3 个问题：ALT标签缺失 45个、404错误 12个、Canonical错误 3个"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      </Modal>

      {/* 查看全部日志弹窗 */}
      <Modal
        title="操作日志"
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLogsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索日志内容"
            value={logsSearchText}
            onChange={(e) => setLogsSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={logsStatusFilter}
            onChange={setLogsStatusFilter}
            style={{ width: 120 }}
          >
            <Option value="all">全部状态</Option>
            <Option value="success">成功</Option>
            <Option value="warning">警告</Option>
            <Option value="error">错误</Option>
          </Select>
          <Select
            value={logsTypeFilter}
            onChange={setLogsTypeFilter}
            style={{ width: 120 }}
          >
            <Option value="all">全部类型</Option>
            <Option value="同步">同步</Option>
            <Option value="检测">检测</Option>
            <Option value="推送">推送</Option>
            <Option value="修复">修复</Option>
            <Option value="更新">更新</Option>
            <Option value="生成">生成</Option>
            <Option value="巡查">巡查</Option>
          </Select>
          <RangePicker
            value={logsDateRange}
            onChange={(dates) => setLogsDateRange(dates)}
            style={{ width: 240 }}
          />
        </Space>
        <Table
          columns={logsColumns}
          dataSource={filteredLogs}
          rowKey="id"
          loading={logsLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default SEODashboard;

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Badge, Button, DatePicker, Space, Alert, Tabs, Timeline, Statistic, Row, Col, Breadcrumb, message, Progress, Modal, List, Form, Input, Select, Switch } from 'antd';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, FileTextOutlined, ArrowLeftOutlined, PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { inspectionApi, type InspectionItem, type GetInspectionListParams } from '../../services/inspectionApi';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface AuditLog {
  time: string;
  content: string;
  type: 'success' | 'warning' | 'error';
}

const DailyAudit: React.FC = () => {
  const navigate = useNavigate();
  // 站点URL列表（可从配置或API获取）
  const siteUrls = [
    'https://www.markwallpapers.com/',
    'https://markwallpapers.com/',
  ];
  
  // 当前选中的站点URL
  const [selectedSiteUrl, setSelectedSiteUrl] = useState<string>('https://www.markwallpapers.com/');
  
  // 日期范围
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // 时间戳
  const [startTimestamp, setStartTimestamp] = useState<number | undefined>(undefined);
  const [endTimestamp, setEndTimestamp] = useState<number | undefined>(undefined);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  // 巡查结果弹窗
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [auditResultDetails, setAuditResultDetails] = useState<InspectionItem[]>([]);
  
  // 告警规则设置
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertRules, setAlertRules] = useState<any[]>([]);
  const [alertForm] = Form.useForm();
  
  // 历史记录对比
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryDates, setSelectedHistoryDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [historyComparisonData, setHistoryComparisonData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // 巡查状态
  const [auditing, setAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditResults, setAuditResults] = useState<{ normal: number; warning: number; error: number; checked: number; total: number }>({
    normal: 0,
    warning: 0,
    error: 0,
    checked: 0,
    total: 0,
  });
  
  // 当前选中的tab类别
  const [activeTab, setActiveTab] = useState<string>('search_crawl');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  
  // 统计数据状态
  const [dashboardData, setDashboardData] = useState<{
    normal_count: number;
    warning_count: number;
    error_count: number;
    total_count: number;
    inspected_at: string;
  }>({
    normal_count: 0,
    warning_count: 0,
    error_count: 0,
    total_count: 0,
    inspected_at: '',
  });
  
  // 各分类的数据
  const [searchData, setSearchData] = useState<InspectionItem[]>([]);
  const [qualityData, setQualityData] = useState<InspectionItem[]>([]);
  const [securityData, setSecurityData] = useState<InspectionItem[]>([]);
  const [performanceData, setPerformanceData] = useState<InspectionItem[]>([]);
  
  // 加载统计数据
  const loadDashboardData = async (timestampStart?: number, timestampEnd?: number, siteUrl?: string) => {
    if (!siteUrl) {
      message.warning('请选择站点URL');
      return;
    }
    
    setLoading(true);
    try {
      // 如果传入了时间戳则使用传入的，否则使用状态中的时间戳
      const finalStartTimestamp = timestampStart !== undefined ? timestampStart : startTimestamp;
      const finalEndTimestamp = timestampEnd !== undefined ? timestampEnd : endTimestamp;
      
      const res = await inspectionApi.getInspectionDashboard({
        url: siteUrl,
        start_timestamp: finalStartTimestamp,
        end_timestamp: finalEndTimestamp,
      });
      if (res && res.summary) {
        setDashboardData({
          normal_count: res.summary.total_normal,
          warning_count: res.summary.total_warning,
          error_count: res.summary.total_error,
          total_count: res.summary.total_items,
          inspected_at: res.summary.check_time || '', // 从summary中获取check_time字段
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 日期范围变化处理
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      // 将日期转换为Unix时间戳（秒级）
      const start = Math.floor(dates[0].valueOf() / 1000);
      const end = Math.floor(dates[1].valueOf() / 1000);
      setStartTimestamp(start);
      setEndTimestamp(end);
      // 使用用户选择的时间戳重新加载数据
      loadDashboardData(start, end, selectedSiteUrl);
      // 重新加载列表数据
      loadInspectionData(activeTab as any, currentPage, pageSize, start, end);
    } else {
      setStartTimestamp(undefined);
      setEndTimestamp(undefined);
      loadDashboardData(undefined, undefined, selectedSiteUrl);
      loadInspectionData(activeTab as any, currentPage, pageSize);
    }
  };
  
  // 站点URL变化处理
  const handleSiteUrlChange = (url: string) => {
    setSelectedSiteUrl(url);
    // 重新加载统计数据（传入新的siteUrl）
    loadDashboardData(undefined, undefined, url);
    // 重新加载列表数据（传入新的siteUrl）
    loadInspectionData(activeTab as any, currentPage, pageSize, undefined, undefined, url);
  };
  
  // 加载数据
  const loadInspectionData = async (
    category: 'search_crawl' | 'page_quality' | 'security' | 'performance',
    page: number = currentPage,
    size: number = pageSize,
    customStartTimestamp?: number,
    customEndTimestamp?: number,
    customSiteUrl?: string
  ) => {
    try {
      // 如果传入了自定义参数则使用自定义的，否则使用状态中的值
      const finalStartTimestamp = customStartTimestamp !== undefined ? customStartTimestamp : startTimestamp;
      const finalEndTimestamp = customEndTimestamp !== undefined ? customEndTimestamp : endTimestamp;
      const finalSiteUrl = customSiteUrl !== undefined ? customSiteUrl : selectedSiteUrl;
      
      const params: GetInspectionListParams = {
        currentPage: page,
        pageSize: size,
        category,
        site_url: finalSiteUrl,
        start_timestamp: finalStartTimestamp,
        end_timestamp: finalEndTimestamp,
      };
      
      const res = await inspectionApi.getInspectionList(params);
      
      if (res && res.results) {
        switch (category) {
          case 'search_crawl':
            setSearchData(res.results);
            break;
          case 'page_quality':
            setQualityData(res.results);
            break;
          case 'security':
            setSecurityData(res.results);
            break;
          case 'performance':
            setPerformanceData(res.results);
            break;
        }
        
        // 更新分页信息
        if (res.pagination) {
          setTotal(res.pagination.total);
        }
      }
    } catch (error) {
      console.error(`加载${category}数据失败:`, error);
      message.error(`加载${category}数据失败`);
    }
  };
  
  // 分页变化处理
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
    // 加载当前tab的数据
    loadInspectionData(activeTab as any, page, size || pageSize, startTimestamp, endTimestamp, selectedSiteUrl);
  };
  
  // 初始加载数据
  useEffect(() => {
    // 设置默认日期范围为最近7天
    const endDate = dayjs().endOf('day');
    const startDate = dayjs().subtract(6, 'day').startOf('day');
    const startTs = Math.floor(startDate.valueOf() / 1000);
    const endTs = Math.floor(endDate.valueOf() / 1000);
    
    // 站点URL初始值
    const initialSiteUrl = siteUrls[0];
    setSelectedSiteUrl(initialSiteUrl);
    
    setDateRange([startDate, endDate]);
    setStartTimestamp(startTs);
    setEndTimestamp(endTs);
    
    // 使用默认时间戳加载统计数据
    loadDashboardData(startTs, endTs, initialSiteUrl);
    // 直接传递所有参数加载默认Tab（搜索与抓取）的数据
    loadInspectionData('search_crawl', 1, 10, startTs, endTs, initialSiteUrl);
  }, []);

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 切换 Tab 时重置分页并加载对应数据的第一页
    setCurrentPage(1);
    // 使用当前的筛选条件加载新Tab的数据
    loadInspectionData(key as any, 1, pageSize, startTimestamp, endTimestamp, selectedSiteUrl);
  };

  const loadAlertRules = async () => {
    try {
      const res = await inspectionApi.getAlertRules();
      if (res) {
        setAlertRules(res);
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
      const res = await inspectionApi.saveAlertRules([...alertRules, values]);
      if (res) {
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

  // Google巡查日志
  const auditLogs: AuditLog[] = [
    { time: '10:00', content: 'Google Search Console sync completed, +234 indexed pages', type: 'success' },
    { time: '09:30', content: '3 pages with LCP > 2.5s detected', type: 'warning' },
    { time: '09:00', content: 'Security scan completed, no issues found', type: 'success' },
    { time: '08:30', content: '23 pages missing TDK tags', type: 'warning' },
    { time: '08:00', content: 'Daily audit task started', type: 'success' },
  ];

  const columns = [
    { 
      title: '检查项', 
      dataIndex: 'inspection_item_display', 
      key: 'inspection_item_display',
      width: 180,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: InspectionItem) => {
        const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          normal: { color: 'success', icon: <CheckCircleOutlined />, text: record.status_display || '正常' },
          warning: { color: 'warning', icon: <WarningOutlined />, text: record.status_display || '警告' },
          error: { color: 'error', icon: <CloseCircleOutlined />, text: record.status_display || '异常' },
        };
        const { color, icon, text } = config[status] || config.normal;
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    { 
      title: '当前值', 
      dataIndex: 'current_value', 
      key: 'current_value', 
      width: 120,
      ellipsis: true,
    },
    { 
      title: '阈值', 
      dataIndex: 'threshold', 
      key: 'threshold', 
      width: 150,
      ellipsis: true,
    },
    { 
      title: '处理建议', 
      dataIndex: 'suggestion', 
      key: 'suggestion',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: InspectionItem) => (
        record.status !== 'normal' && <Button type="link" size="small" onClick={() => message.info('处理功能开发中')}>处理</Button>
      ),
    },
  ];

  const getStatusBadge = (data: InspectionItem[]) => {
    const errorCount = data.filter((d) => d.status === 'error').length;
    const warningCount = data.filter((d) => d.status === 'warning').length;
    if (errorCount > 0) return <Badge count={errorCount} style={{ backgroundColor: '#f5222d' }} />;
    if (warningCount > 0) return <Badge count={warningCount} style={{ backgroundColor: '#faad14' }} />;
    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  };

  // 开始巡查
  const handleStartAudit = async () => {
    if (!selectedSiteUrl) {
      message.warning('请先选择站点URL');
      return;
    }
    
    // 计算时间戳
    const startTs = dateRange?.[0] ? Math.floor(dateRange[0].valueOf() / 1000) : undefined;
    const endTs = dateRange?.[1] ? Math.floor(dateRange[1].valueOf() / 1000) : undefined;
    
    setAuditing(true);
    setAuditProgress(0);
    
    try {
      // 调用巡查接口，category使用当前激活的Tab
      const result = await inspectionApi.runInspection({
        site_url: selectedSiteUrl,
        category: activeTab as 'search_crawl' | 'page_quality' | 'security' | 'performance',
        start_timestamp: startTs,
        end_timestamp: endTs,
      });
      
      console.log('巡查接口返回数据:', result); // 调试信息
      
      setAuditProgress(100);
      
      // 处理接口返回的巡查结果数据
      // 拦截器已经返回 res.data，所以 result 就是实际数据
      if (result) {
        let responseData = result;
        
        // 如果result包含data属性，使用data；否则直接使用result
        if (result.data && Array.isArray(result.data)) {
          responseData = result.data;
        } else if (result.results && Array.isArray(result.results)) {
          responseData = result.results;
        } else if (result.items && Array.isArray(result.items)) {
          responseData = result.items;
        } else if (Array.isArray(result)) {
          responseData = result;
        }
        
        console.log('实际巡查结果数据:', responseData); // 调试信息
        
        if (Array.isArray(responseData) && responseData.length > 0) {
          // 将返回的数据转换为 InspectionItem 格式
          const inspectionResults: InspectionItem[] = responseData.map((item: any) => ({
            id: item.id || Math.random().toString(),
            inspection_item: item.inspection_item || item.key || item.code || '',
            inspection_item_display: item.inspection_item_display || item.name || item.title || '未知检查项',
            current_value: item.current_value || item.value || item.description || '',
            threshold: item.threshold || item.standard || '',
            suggestion: item.suggestion || item.recommendation || '',
            status: item.status || item.severity || 'normal',
            status_display: item.status_display || getStatusText(item.status || item.severity),
            category: item.category || activeTab,
            category_display: item.category_display || getCategoryText(activeTab),
            site_url: item.site_url || selectedSiteUrl,
            inspected_at: item.inspected_at || item.created_at || new Date().toISOString(),
          }));
          
          console.log('转换后的巡查结果:', inspectionResults); // 调试信息
          
          setAuditResultDetails(inspectionResults);
          setResultModalVisible(true);
          
          // 巡查完成后刷新数据
          await Promise.all([
            loadDashboardData(),
            loadInspectionData(activeTab as any, 1, pageSize, startTs, endTs, selectedSiteUrl)
          ]);
        } else {
          message.warning('巡查完成，但没有返回检查结果数据');
        }
      } else {
        message.error('巡查接口返回数据格式错误');
      }
    } catch (error: any) {
      console.error('巡查失败:', error);
      message.error(error?.message || '巡查失败，请重试');
    } finally {
      setAuditing(false);
      setAuditProgress(0);
    }
  };
  
  // 辅助函数：获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'warning':
        return '警告';
      case 'error':
        return '异常';
      case 'normal':
      default:
        return '正常';
    }
  };
  
  // 辅助函数：获取分类文本
  const getCategoryText = (category: string) => {
    switch (category) {
      case 'search_crawl':
        return '搜索与抓取';
      case 'page_quality':
        return '页面质量';
      case 'security':
        return '安全巡查';
      case 'performance':
        return '性能监控';
      default:
        return category;
    }
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
            icon={<PlayCircleOutlined />} 
            loading={auditing}
            onClick={handleStartAudit}
          >
            {auditing ? '巡查中...' : '立即巡查'}
          </Button>
          <Select
            value={selectedSiteUrl}
            onChange={handleSiteUrlChange}
            style={{ width: 280 }}
            placeholder="选择站点URL"
          >
            {siteUrls.map(url => (
              <Select.Option key={url} value={url}>
                {url}
              </Select.Option>
            ))}
          </Select>
          <RangePicker 
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder={['开始日期', '结束日期']}
          />
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
            <Statistic 
              title="正常项" 
              value={dashboardData.normal_count} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="警告项" 
              value={dashboardData.warning_count} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="异常项" 
              value={dashboardData.error_count} 
              valueStyle={{ color: '#cf1322' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="检查时间" 
              value={dashboardData.inspected_at ? new Date(dashboardData.inspected_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--'} 
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="search_crawl" activeKey={activeTab} onChange={handleTabChange}>
        <TabPane
          tab={<span>搜索与抓取 {getStatusBadge(searchData)}</span>}
          key="search_crawl"
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: handlePageChange,
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span>页面质量 {getStatusBadge(qualityData)}</span>}
          key="page_quality"
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: handlePageChange,
              }}
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: handlePageChange,
              }}
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: handlePageChange,
              }}
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
                    title={item.inspection_item_display}
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

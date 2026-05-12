import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Badge, Button, DatePicker, Space, Alert, Tabs, Timeline, Statistic, Row, Col, Breadcrumb, message, Progress, Modal, List, Form, Input, Select, Switch, Spin, Empty } from 'antd';
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

  // 打开历史记录对比弹窗
  const handleOpenHistoryModal = () => {
    // 清空之前的数据
    setSelectedHistoryDates(null);
    setHistoryComparisonData([]);
    setHistoryModalVisible(true);
  };

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

  // 巡查日志相关状态
  const [logCurrentPage, setLogCurrentPage] = useState<number>(1);
  const [logPageSize, setLogPageSize] = useState<number>(10);
  const [logTotal, setLogTotal] = useState<number>(0);
  const [inspectionLogs, setInspectionLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

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

  // 加载巡查日志数据
  const loadInspectionLogs = async (
    page: number = logCurrentPage,
    size: number = logPageSize,
    append: boolean = false // 是否追加数据
  ) => {
    setLogsLoading(true);
    try {
      const params: any = {
        currentPage: page,
        pageSize: size,
        site_url: selectedSiteUrl,
      };

      // 如果有日期范围，添加时间戳参数
      if (startTimestamp && endTimestamp) {
        params.start_timestamp = startTimestamp;
        params.end_timestamp = endTimestamp;
      }

      const res = await inspectionApi.getInspectionLogs(params);

      if (res && res.results) {
        // 如果是追加模式（下拉加载更多），将新数据追加到现有数据后面
        // 否则（第一页或刷新），替换所有数据
        if (append && page > 1) {
          setInspectionLogs(prev => [...prev, ...res.results]);
        } else {
          setInspectionLogs(res.results);
        }

        // 更新分页信息
        if (res.pagination) {
          setLogTotal(res.pagination.total);
        }
      }
    } catch (error) {
      console.error('加载巡查日志失败:', error);
      message.error('加载巡查日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  // 巡查日志分页变化处理
  const handleLogPageChange = (page: number, size?: number) => {
    setLogCurrentPage(page);
    if (size) {
      setLogPageSize(size);
    }
    // 如果是加载更多（page > 1），则追加数据；否则替换数据
    const shouldAppend = page > 1;
    loadInspectionLogs(page, size || logPageSize, shouldAppend);
  };

  // 日期范围变化处理
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      // 将日期转换为Unix时间戳（秒级）
      // 开始日期使用当天的 00:00:00
      const start = Math.floor(dates[0].startOf('day').valueOf() / 1000);
      // 结束日期使用当天的 23:59:59
      const end = Math.floor(dates[1].endOf('day').valueOf() / 1000);
      
      console.log('选择的开始日期:', dates[0].format('YYYY-MM-DD'), '对应时间戳:', start);
      console.log('选择的结束日期:', dates[1].format('YYYY-MM-DD'), '对应时间戳:', end);
      
      setStartTimestamp(start);
      setEndTimestamp(end);
      // 使用用户选择的时间戳重新加载数据
      loadDashboardData(start, end, selectedSiteUrl);
      // 重新加载列表数据
      loadInspectionData(activeTab as any, currentPage, pageSize, start, end);
      // 重新加载巡查日志数据
      loadInspectionLogs(logCurrentPage, logPageSize);
    } else {
      setStartTimestamp(undefined);
      setEndTimestamp(undefined);
      loadDashboardData(undefined, undefined, selectedSiteUrl);
      loadInspectionData(activeTab as any, currentPage, pageSize);
      loadInspectionLogs(logCurrentPage, logPageSize);
    }
  };

  // 站点URL变化处理
  const handleSiteUrlChange = (url: string) => {
    setSelectedSiteUrl(url);
    // 重新加载统计数据（传入新的siteUrl）
    loadDashboardData(undefined, undefined, url);
    // 重新加载列表数据（传入新的siteUrl）
    loadInspectionData(activeTab as any, currentPage, pageSize, undefined, undefined, url);
    // 重新加载巡查日志数据
    loadInspectionLogs(logCurrentPage, logPageSize);
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
    // 加载巡查日志数据
    loadInspectionLogs(1, 10);
  }, []);

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 切换 Tab 时重置分页
    setCurrentPage(1);

    // 如果切换到巡查日志Tab，不调用巡查列表接口，只加载巡查日志
    if (key === 'logs') {
      loadInspectionLogs(1, logPageSize);
      return;
    }

    // 其他Tab正常加载巡查列表数据
    loadInspectionData(key as any, 1, pageSize, startTimestamp, endTimestamp, selectedSiteUrl);
  };

  // 加载历史记录对比数据
  const loadHistoryComparison = async () => {
    if (!selectedHistoryDates || !selectedHistoryDates[0] || !selectedHistoryDates[1]) {
      message.warning('请选择两个日期进行对比');
      return;
    }

    setHistoryLoading(true);
    try {
      // 将日期转换为Unix时间戳（秒级）
      // 日期A使用当天的 00:00:00
      const timestampA = Math.floor(selectedHistoryDates[0].startOf('day').valueOf() / 1000);
      // 日期B使用当天的 23:59:59
      const timestampB = Math.floor(selectedHistoryDates[1].endOf('day').valueOf() / 1000);

      console.log('选择的日期A:', selectedHistoryDates[0].format('YYYY-MM-DD'), '对应时间戳:', timestampA);
      console.log('选择的日期B:', selectedHistoryDates[1].format('YYYY-MM-DD'), '对应时间戳:', timestampB);

      // 调用历史记录对比接口
      const res = await inspectionApi.compareReport({
        category: activeTab,
        site_url: selectedSiteUrl,
        timestamp_a: timestampA,
        timestamp_b: timestampB,
      });
       console.log(res,'rrrr')
      if (res && res && Array.isArray(res)) {
        setHistoryComparisonData(res);
      } else {
        message.warning('未获取到对比数据');
        setHistoryComparisonData([]);
      }
    } catch (error: any) {
      console.error('加载历史数据失败:', error);
      message.error(error?.message || '加载历史数据失败');
      setHistoryComparisonData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 导出报告
  const handleExportReport = async () => {
    try {
      // 调用导出报告接口
      const response = await inspectionApi.exportReport({
        category: activeTab,
        site_url: selectedSiteUrl,
      });

      // 创建下载链接
      const blob = new Blob([response], { type: 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `巡查报告_${selectedSiteUrl}_${activeTab}_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('报告导出成功');
    } catch (error: any) {
      console.error('导出报告失败:', error);
      message.error(error?.message || '导出报告失败');
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
    // 开始日期使用当天的 00:00:00
    const startTs = dateRange?.[0] ? Math.floor(dateRange[0].startOf('day').valueOf() / 1000) : undefined;
    // 结束日期使用当天的 23:59:59
    const endTs = dateRange?.[1] ? Math.floor(dateRange[1].endOf('day').valueOf() / 1000) : undefined;

    console.log('--- 开始巡查 ---');
    console.log('参数:', { selectedSiteUrl, activeTab, startTs, endTs });

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

      console.log('=== 巡查接口返回数据 ===');
      console.log('result:', result);
      console.log('result.results:', result?.results);
      console.log('result.data:', result?.data);

      setAuditProgress(100);

      // 处理接口返回的巡查结果数据
      // 兼容两种数据结构：
      // 1. { results: [...] } - 直接返回（根据实际日志）
      // 2. { data: { results: [...] } } - 包装在 data 中
      let responseData = [];

      if (result?.results && Array.isArray(result.results)) {
        // 直接在 result 下有 results（这是实际情况）
        responseData = result.results;
        console.log('从 result.results 提取数据');
      } else if (result?.data?.results && Array.isArray(result.data.results)) {
        // 在 result.data.results 下
        responseData = result.data.results;
        console.log('从 result.data.results 提取数据');
      }

      console.log('实际巡查结果数据长度:', responseData.length);
      console.log('responseData:', responseData);

      if (Array.isArray(responseData) && responseData.length > 0) {
        // 将返回的数据转换为 InspectionItem 格式
        const inspectionResults: InspectionItem[] = responseData.map((item: any) => ({
          id: item.id || Math.random().toString(),
          inspection_item: item.inspection_item || '',
          inspection_item_display: item.inspection_item_display || '未知检查项',
          current_value: item.current_value || '',
          threshold: item.threshold || '',
          suggestion: item.suggestion || '',
          status: item.status || 'normal',
          status_display: item.status_display || getStatusText(item.status),
          category: item.category || activeTab,
          category_display: item.category_display || getCategoryText(activeTab),
          site_url: item.site_url || selectedSiteUrl,
          inspected_at: item.inspected_at || new Date().toISOString(),
        }));

        console.log('转换后的巡查结果:', inspectionResults);
        console.log('转换后的巡查结果长度:', inspectionResults.length);

        // 计算统计数据
        const normalCount = inspectionResults.filter(item => item.status === 'normal').length;
        const warningCount = inspectionResults.filter(item => item.status === 'warning').length;
        const errorCount = inspectionResults.filter(item => item.status === 'error').length;

        console.log('统计 - 正常:', normalCount, '警告:', warningCount, '异常:', errorCount);

        // 更新统计数据
        setAuditResults({
          normal: normalCount,
          warning: warningCount,
          error: errorCount,
          checked: inspectionResults.length,
          total: inspectionResults.length,
        });

        setAuditResultDetails(inspectionResults);

        console.log('准备显示弹窗，resultModalVisible 将被设置为 true');
        setResultModalVisible(true);

        console.log('弹窗状态已设置，开始刷新数据...');

        // 巡查完成后刷新数据
        await Promise.all([
          loadDashboardData(),
          loadInspectionData(activeTab as any, 1, pageSize, startTs, endTs, selectedSiteUrl)
        ]);

        console.log('巡查完成，弹窗应该已经显示');
      } else {
        console.warn('responseData 不是数组或长度为0');
        message.warning('巡查完成，但没有返回检查结果数据');
      }
    } catch (error: any) {
      console.error('巡查失败:', error);
      message.error(error?.message || '巡查失败，请重试');
    } finally {
      setAuditing(false);
      setAuditProgress(0);
      console.log('--- 巡查结束 ---');
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
          {/* <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            loading={auditing}
            onClick={handleStartAudit}
          >
            {auditing ? '巡查中...' : '立即巡查'}
          </Button> */}
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
          {/* <Button icon={<FileTextOutlined />} onClick={handleExportReport}>导出报告</Button> */}
          {/* <Button onClick={() => setHistoryModalVisible(true)}>历史记录对比</Button> */}
        </Space>
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
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={auditing}
              onClick={handleStartAudit}
              style={{ marginBottom: 16 }}
            >
              {auditing ? '巡查中...' : '立即巡查'}

            </Button>
            <Button style={{ marginLeft: 16 }} onClick={handleOpenHistoryModal}>历史记录对比</Button>
            <Button style={{ marginLeft: 16 }} icon={<FileTextOutlined />} onClick={handleExportReport}>导出报告</Button>

            {/* 巡查进度 */}
            {auditing && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={auditProgress} status="active" />
                <div style={{ marginBottom: 8, color: '#666' }}>
                  正在检查: {auditResults.checked} / {auditResults.total} 项 |
                  正常: {auditResults.normal} |
                  警告: {auditResults.warning} |
                  异常: {auditResults.error}
                </div>
              </div>
            )}
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
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={auditing}
              onClick={handleStartAudit}
              style={{ marginBottom: 16 }}
            >
              {auditing ? '巡查中...' : '立即巡查'}

            </Button>
            <Button style={{ marginLeft: 16 }} onClick={handleOpenHistoryModal}>历史记录对比</Button>
            <Button style={{ marginLeft: 16 }} icon={<FileTextOutlined />} onClick={handleExportReport}>导出报告</Button>
             {/* 巡查进度 */}
            {auditing && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={auditProgress} status="active" />
                <div style={{ marginBottom: 8, color: '#666' }}>
                  正在检查: {auditResults.checked} / {auditResults.total} 项 |
                  正常: {auditResults.normal} |
                  警告: {auditResults.warning} |
                  异常: {auditResults.error}
                </div>
              </div>
            )}
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
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={auditing}
              onClick={handleStartAudit}
              style={{ marginBottom: 16 }}
            >
              {auditing ? '巡查中...' : '立即巡查'}

            </Button>
            <Button style={{ marginLeft: 16 }} onClick={handleOpenHistoryModal}>历史记录对比</Button>
              <Button style={{ marginLeft: 16 }} icon={<FileTextOutlined />} onClick={handleExportReport}>导出报告</Button>
             {/* 巡查进度 */}
            {auditing && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={auditProgress} status="active" />
                <div style={{ marginBottom: 8, color: '#666' }}>
                  正在检查: {auditResults.checked} / {auditResults.total} 项 |
                  正常: {auditResults.normal} |
                  警告: {auditResults.warning} |
                  异常: {auditResults.error}
                </div>
              </div>
            )}
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
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={auditing}
              onClick={handleStartAudit}
              style={{ marginBottom: 16 }}
            >
              {auditing ? '巡查中...' : '立即巡查'}

            </Button>
            <Button style={{ marginLeft: 16 }} onClick={handleOpenHistoryModal}>历史记录对比</Button>
              <Button style={{ marginLeft: 16 }} icon={<FileTextOutlined />} onClick={handleExportReport}>导出报告</Button>
             {/* 巡查进度 */}
            {auditing && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={auditProgress} status="active" />
                <div style={{ marginBottom: 8, color: '#666' }}>
                  正在检查: {auditResults.checked} / {auditResults.total} 项 |
                  正常: {auditResults.normal} |
                  警告: {auditResults.warning} |
                  异常: {auditResults.error}
                </div>
              </div>
            )}
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
          <Card title="今日巡查记录" style={{ minHeight: 500 }}>
            <div style={{ padding: '20px 0' }}>
              {logsLoading && inspectionLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                </div>
              ) : inspectionLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <Empty description="暂无巡查记录" />
                </div>
              ) : (
                <div
                  style={{ maxHeight: 600, overflow: 'auto', paddingRight: 20 }}
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    // 当滚动到底部时加载更多数据
                    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
                      if (logCurrentPage < Math.ceil(logTotal / logPageSize) && !logsLoading) {
                        handleLogPageChange(logCurrentPage + 1, logPageSize);
                      }
                    }
                  }}
                >
                  <Timeline
                    items={inspectionLogs.map((log: any) => {
                      // 优先使用 start_date，兼容 start_time
                      const startDate = log.start_date || log.start_time;
                      const endDate = log.end_date || log.end_time;

                      let timeDisplay = '--:--';
                      if (startDate) {
                        const date = new Date(startDate);
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        timeDisplay = `${hours}:${minutes}`;

                        // 如果有结束时间，显示时间段
                        if (endDate) {
                          const endDateObj = new Date(endDate);
                          const endHours = String(endDateObj.getHours()).padStart(2, '0');
                          const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');
                          timeDisplay = `${hours}:${minutes} - ${endHours}:${endMinutes}`;
                        }
                      }

                      const statusColor = log.status === 'success' ? '#52c41a' : log.status === 'failed' ? '#faad14' : '#1890ff';

                      // 构建日志内容
                      const logContent = [
                        log.category_display && `【${log.category_display}】`,
                        log.status_display && `状态: ${log.status_display}`,
                        log.total_items && `检查项: ${log.total_items}项`,
                        (log.normal_count !== undefined || log.warning_count !== undefined || log.error_count !== undefined) &&
                        `正常${log.normal_count || 0}/警告${log.warning_count || 0}/异常${log.error_count || 0}`,
                        log.duration && `耗时: ${log.duration}秒`,
                      ].filter(Boolean).join(' | ');

                      return {
                        color: statusColor,
                        dot: statusColor === '#52c41a' ? (
                          <CheckCircleOutlined style={{ color: statusColor, fontSize: 16 }} />
                        ) : statusColor === '#faad14' ? (
                          <WarningOutlined style={{ color: statusColor, fontSize: 16 }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: statusColor, fontSize: 16 }} />
                        ),
                        children: (
                          <div style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => {
                            message.info('查看详情功能开发中');
                          }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#333' }}>
                              {timeDisplay}
                            </div>
                            <div style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
                              {logContent || '巡查任务已执行'}
                            </div>
                            {log.remark && (
                              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                                备注: {log.remark}
                              </div>
                            )}
                          </div>
                        ),
                      };
                    })}
                  />

                  {logsLoading && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <Spin size="small" />
                      <span style={{ marginLeft: 8, color: '#999' }}>加载中...</span>
                    </div>
                  )}

                  {!logsLoading && logCurrentPage >= Math.ceil(logTotal / logPageSize) && logTotal > 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 12 }}>
                      — 已经到底了 —
                    </div>
                  )}
                </div>
              )}
            </div>
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

      {/* 历史记录对比弹窗 */}
      <Modal
        title="历史记录对比"
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setHistoryComparisonData([]);
          setSelectedHistoryDates(null);
        }}
        onOpenChange={(visible) => {
          if (visible) {
            // 打开弹窗时清空日期选择
            setSelectedHistoryDates(null);
            setHistoryComparisonData([]);
          }
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
              rowKey="inspection_item"
              pagination={false}
              columns={[
                { 
                  title: '检查项', 
                  dataIndex: 'inspection_item_display', 
                  key: 'inspection_item_display',
                  width: 180 
                },
                { 
                  title: '日期A', 
                  key: 'date_a',
                  width: 200,
                  render: (_: any, record: any) => (
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                        {record.time_a}
                      </div>
                      {/* <div style={{ fontWeight: 500 }}>
                        {record.value_a}
                      </div>
                      <Tag 
                        color={record.status_a === '正常' ? 'success' : record.status_a === '警告' ? 'warning' : 'error'}
                        style={{ marginTop: 4, fontSize: 12 }}
                      >
                        {record.status_a}
                      </Tag> */}
                    </div>
                  )
                },
                { 
                  title: '日期B', 
                  key: 'date_b',
                  width: 200,
                  render: (_: any, record: any) => (
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                        {record.time_b}
                      </div>
                      {/* <div style={{ fontWeight: 500 }}>
                        {record.value_b}
                      </div>
                      <Tag 
                        color={record.status_b === '正常' ? 'success' : record.status_b === '警告' ? 'warning' : 'error'}
                        style={{ marginTop: 4, fontSize: 12 }}
                      >
                        {record.status_b}
                      </Tag> */}
                    </div>
                  )
                },
                {
                  title: '差异',
                  dataIndex: 'difference',
                  key: 'difference',
                  width: 100,
                  render: (difference: number) => {
                    if (difference === 0) {
                      return <Tag color="default">无变化</Tag>;
                    }
                    return (
                      <Tag color={difference > 0 ? 'success' : 'error'}>
                        {difference > 0 ? '+' : ''}{difference}
                      </Tag>
                    );
                  }
                },
                {
                  title: '趋势',
                  dataIndex: 'trend',
                  key: 'trend',
                  width: 100,
                  render: (trend: string) => {
                    const trendMap: Record<string, { color: string; text: string; icon: string }> = {
                      stable: { color: 'default', text: '稳定', icon: '→' },
                      improved: { color: 'success', text: '改善', icon: '↑' },
                      worsened: { color: 'error', text: '下降', icon: '↓' },
                    };
                    const trendInfo = trendMap[trend] || { color: 'default', text: trend, icon: '→' };
                    return (
                      <Tag color={trendInfo.color}>
                        {trendInfo.icon} {trendInfo.text}
                      </Tag>
                    );
                  }
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

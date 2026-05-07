import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, DatePicker, Select, Button, Table, Tag, Statistic, Tabs, Progress, Space, Alert, Breadcrumb, message, Spin, Dropdown } from 'antd';
import { Line, Pie } from '@ant-design/charts';
import { GlobalOutlined, SearchOutlined, LinkOutlined, ArrowLeftOutlined, ReloadOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { seoApi } from '../../services/seoApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

interface KeywordRanking {
  id: number;
  keyword: string;
  searchEngine: string;
  currentRank: number;
  previousRank: number;
  change: number;
  searchVolume: number;
  url: string;
}

interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
  bounceRate: number;
  avgDuration: string;
}

const trafficDataStatic: TrafficSource[] = [
  { source: 'Google Search', visits: 68420, percentage: 68.2, bounceRate: 28.5, avgDuration: '4:25' },
  { source: 'Google Discover', visits: 12560, percentage: 12.5, bounceRate: 32.1, avgDuration: '3:45' },
  { source: 'Google News', visits: 8420, percentage: 8.4, bounceRate: 25.8, avgDuration: '5:12' },
  { source: 'Google Images', visits: 6890, percentage: 6.9, bounceRate: 35.2, avgDuration: '2:35' },
  { source: 'Google Video', visits: 3890, percentage: 3.9, bounceRate: 42.5, avgDuration: '6:18' },
];

const landingPageDataStatic = [
  { page: '/wallpaper/4k-star-sky', visits: 12580, bounceRate: 28.5, avgTime: '4:32', conversion: 12.5 },
  { page: '/category/anime', visits: 9820, bounceRate: 32.1, avgTime: '3:45', conversion: 8.3 },
  { page: '/wallpaper/nature-forest', visits: 8650, bounceRate: 25.8, avgTime: '5:12', conversion: 15.2 },
  { page: '/tag/4k', visits: 7420, bounceRate: 35.2, avgTime: '2:58', conversion: 6.8 },
  { page: '/search?q=手机壁纸', visits: 6890, bounceRate: 42.5, avgTime: '2:25', conversion: 4.5 },
];

const SEOAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // 初始化默认时间范围（最近7天）
  const defaultDateRange: [Dayjs, Dayjs] = [dayjs().subtract(7, 'day'), dayjs()];
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange);
  const [selectedPath, setSelectedPath] = useState<string>('https://www.markwallpapers.com/');
  const [loading, setLoading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [_gscData, setGscData] = useState({
    clicks: 12580,
    impressions: 256000,
    ctr: 4.91,
    position: 8.5,
  });
  
  // 收录趋势数据
  const [inclusionTrendData, setInclusionTrendData] = useState<Array<{
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }>>([]);
  
  // 动态数据状态
  const [landingPageData] = useState(landingPageDataStatic);
  const [trafficData, setTrafficData] = useState<TrafficSource[]>(trafficDataStatic);
  
  // 核心指标 - 从API获取
  const [coreMetrics, setCoreMetrics] = useState({
    totalIndexed: 0,
    totalIndexedWeeklyIncrement: 0,
    seoTraffic: 0,
    seoTrafficWeeklyIncrement: 0,
    avgRanking: 0,
    avgRankingWeeklyIncrement: 0,
    backlinkCount: 0,
    backlinkCountWeeklyIncrement: 0,
  });

  // 数据分析详细数据
  const [analysisDetail, setAnalysisDetail] = useState({
    indexTrend: [] as Array<{ date: string; indexed_count: number }>,
    keywordRankings: [] as Array<{
      keyword: string;
      current_rank: number;
      previous_rank: number;
      search_volume: number;
      url: string;
    }>,
    landingPages: [] as Array<{
      page_path: string;
      visits: number;
      bounce_rate: number;
      avg_duration: string;
      conversion_rate: number;
    }>,
  });

  // 计算默认时间范围（最近7天）
  const getDefaultTimeRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      startTimestamp: Math.floor(start.getTime() / 1000),
      endTimestamp: Math.floor(end.getTime() / 1000),
    };
  };

  // 加载核心指标数据
  const loadCoreMetrics = async () => {
    try {
      const res = await seoApi.getDataAnalysisDashboard(selectedPath);
      if (res && res.data) {
        setCoreMetrics({
          totalIndexed: res.data.total_indexed || 0,
          totalIndexedWeeklyIncrement: res.data.total_indexed_weekly_increment || 0,
          seoTraffic: res.data.seo_traffic || 0,
          seoTrafficWeeklyIncrement: res.data.seo_traffic_weekly_increment || 0,
          avgRanking: res.data.avg_ranking || 0,
          avgRankingWeeklyIncrement: res.data.avg_ranking_weekly_increment || 0,
          backlinkCount: res.data.backlink_count || 0,
          backlinkCountWeeklyIncrement: res.data.backlink_count_weekly_increment || 0,
        });
      }
    } catch (err) {
      console.error('加载核心指标数据失败:', err);
      message.error('加载数据失败');
    }
  };

  // 加载数据分析详细数据
  const loadAnalysisDetail = async () => {
    try {
      const { startTimestamp, endTimestamp } = getDefaultTimeRange();
      const res = await seoApi.getDataAnalysisDetail({
        site_url: selectedPath,
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
      });
      if (res && res.data) {
        setAnalysisDetail({
          indexTrend: res.data.index_trend || [],
          keywordRankings: res.data.keyword_rankings || [],
          landingPages: res.data.landing_pages || [],
        });
      }
    } catch (err) {
      console.error('加载数据分析详细数据失败:', err);
      message.error('加载详细数据失败');
    }
  };

  // 图表配置 - 收录趋势（四个指标分开展示）
  const lineConfig = {
    data: [
      // 点击次数数据
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: item.clicks,
        category: '点击量',
      })),
      // 曝光量数据
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: item.impressions,
        category: '曝光量',
      })),
      // 点击率数据（乘以1000以便在同一坐标系展示）
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: Math.round(item.ctr * 10),
        category: '点击率(x10)',
      })),
      // 平均排名数据（乘以100以便在同一坐标系展示）
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: Math.round(item.position * 100),
        category: '平均排名(x100)',
      })),
    ],
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: { appear: { animation: 'path-in', duration: 1000 } },
    color: ['#1890ff', '#722ed1', '#52c41a', '#fa8c16'],
  };

  // 收录趋势表格列定义
  const inclusionTrendColumns = [
    { title: '当天日期', dataIndex: 'date', key: 'date', width: 120 },
    { 
      title: '曝光 / 展现量', 
      dataIndex: 'impressions', 
      key: 'impressions', 
      width: 150,
      render: (v: number) => v.toLocaleString() 
    },
    { 
      title: '点击量', 
      dataIndex: 'clicks', 
      key: 'clicks', 
      width: 120,
      render: (v: number) => v.toLocaleString() 
    },
    { 
      title: '点击率', 
      dataIndex: 'ctr', 
      key: 'ctr', 
      width: 120,
      render: (v: number) => `${v.toFixed(2)}%` 
    },
    { 
      title: '平均排名', 
      dataIndex: 'position', 
      key: 'position', 
      width: 120,
      render: (v: number) => v.toFixed(1) 
    },
  ];

  // 关键词排名表格列定义
  const keywordColumns = [
    { title: '关键词', dataIndex: 'keyword', key: 'keyword', ellipsis: true },
    { title: '当前排名', dataIndex: 'current_rank', key: 'current_rank', render: (v: number) => <Tag color={v <= 10 ? 'success' : v <= 30 ? 'warning' : 'default'}>{v}</Tag> },
    { title: '上次排名', dataIndex: 'previous_rank', key: 'previous_rank' },
    { 
      title: '排名变化', 
      key: 'change',
      render: (_: any, record: any) => {
        const change = record.previous_rank - record.current_rank;
        return (
          <Tag color={change > 0 ? 'success' : change < 0 ? 'error' : 'default'}>
            {change > 0 ? `↑${change}` : change < 0 ? `↓${Math.abs(change)}` : '-'}
          </Tag>
        );
      }
    },
    { title: '搜索量', dataIndex: 'search_volume', key: 'search_volume', render: (v: number) => v.toLocaleString() },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
  ];

  // 着陆页表格列定义
  const landingColumns = [
    { title: '着陆页', dataIndex: 'page_path', key: 'page_path', ellipsis: true },
    { title: '访问量', dataIndex: 'visits', key: 'visits', render: (v: number) => v.toLocaleString() },
    { title: '跳出率', dataIndex: 'bounce_rate', key: 'bounce_rate', render: (v: number) => `${v}%` },
    { title: '平均停留', dataIndex: 'avg_duration', key: 'avg_duration' },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (v: number) => <Progress percent={v} size="small" status={v > 10 ? 'success' : 'normal'} />,
    },
  ];

  const pieConfig = {
    data: trafficData.map(d => ({ type: d.source, value: d.visits })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'outer', content: '{name} {percentage}' },
  };

  // 加载Google Search Console数据
  const loadGSCData = async () => {
    try {
      const { startTimestamp, endTimestamp } = dateRange 
        ? { 
            startTimestamp: Math.floor(dateRange[0]?.valueOf() / 1000), 
            endTimestamp: Math.floor(dateRange[1]?.valueOf() / 1000) 
          }
        : getDefaultTimeRange();
      
      const res = await seoApi.getSearchConsoleData({
        site_url: selectedPath,
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
      });
      if (res.code === 200) {
        setGscData({
          clicks: res.data.clicks,
          impressions: res.data.impressions,
          ctr: res.data.ctr,
          position: res.data.position,
        });
        // 保存收录趋势数据
        if (res.data.dates && res.data.dates.length > 0) {
          setInclusionTrendData(res.data.dates.map(item => ({
            date: item.date,
            impressions: item.impressions,
            clicks: item.clicks,
            ctr: item.ctr,
            position: item.position,
          })));
        }
      }
    } catch (_err) {
      message.error('加载GSC数据失败');
    }
  };

  // 初始加载
  useEffect(() => {
    loadGSCData();
    loadCoreMetrics();
    loadAnalysisDetail();
  }, []);

  // 当路径改变时重新加载数据
  useEffect(() => {
    loadCoreMetrics();
    loadAnalysisDetail();
  }, [selectedPath]);

  // 刷新数据
  const handleRefresh = async () => {
    setLoading(true);
    message.loading('正在刷新数据...', 1);
    
    try {
      await Promise.all([
        loadGSCData(),
        loadCoreMetrics(),
        loadAnalysisDetail(),
      ]);
      message.success('数据刷新成功！');
    } catch (err) {
      message.error('刷新失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出JSON报告
  const handleExportJSON = () => {
    const reportData = {
      title: 'SEO数据分析报告',
      date: new Date().toLocaleString(),
      metrics: coreMetrics,
      traffic: trafficData,
      landingPages: landingPageData,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('JSON报告导出成功！');
  };

  // 导出PDF报告
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setPdfExporting(true);
    message.loading('正在生成PDF报告...', 0);
    
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      let imgY = 10;
      
      // 添加标题
      pdf.setFontSize(16);
      pdf.text('SEO数据分析报告', pdfWidth / 2, 10, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`生成时间: ${new Date().toLocaleString()}`, pdfWidth / 2, 18, { align: 'center' });
      
      imgY = 25;
      
      // 计算需要多少页
      const scaledHeight = imgHeight * ratio * (pdfWidth - 20) / (imgWidth * ratio);
      let heightLeft = scaledHeight;
      let position = imgY;
      
      // 添加第一页
      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, scaledHeight);
      heightLeft -= (pdfHeight - imgY);
      
      // 如果内容超过一页，添加更多页
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight + imgY;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, scaledHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      pdf.save(`seo-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      message.success('PDF报告导出成功！');
    } catch (err) {
      message.error('PDF导出失败，请重试');
      console.error('PDF export error:', err);
    } finally {
      setPdfExporting(false);
    }
  };

  // 查询数据
  const handleSearch = () => {
    setLoading(true);
    message.loading('正在查询数据...', 1);
    
    setTimeout(() => {
      // 根据筛选条件过滤数据
      if (selectedPath !== 'all') {
        const filteredTraffic = trafficDataStatic.filter(t => 
          t.source.toLowerCase().includes(selectedPath.toLowerCase())
        );
        setTrafficData(filteredTraffic.length > 0 ? filteredTraffic : trafficDataStatic);
      } else {
        setTrafficData(trafficDataStatic);
      }
      
      setLoading(false);
      message.success('查询完成！');
    }, 800);
  };

  const trafficColumns = [
    { title: '流量来源', dataIndex: 'source', key: 'source' },
    { title: '访问量', dataIndex: 'visits', key: 'visits', render: (v: number) => v.toLocaleString() },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (p: number) => <Progress percent={p} size="small" showInfo={false} />,
    },
    { title: '跳出率', dataIndex: 'bounceRate', key: 'bounceRate', render: (v: number) => `${v}%` },
    { title: '平均停留', dataIndex: 'avgDuration', key: 'avgDuration' },
  ];

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>数据分析</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        SEO数据分析
      </h2>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <RangePicker 
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
          />
          <Select 
            placeholder="选择路径" 
            style={{ width: 280 }} 
            value={selectedPath}
            onChange={setSelectedPath}
          >
            <Option value="https://www.markwallpapers.com/">https://www.markwallpapers.com/</Option>
            <Option value="https://markwallpapers.com/">https://markwallpapers.com/</Option>
          </Select>
        
          <Button type="primary" icon={<SearchOutlined />} onClick={handleRefresh} loading={loading}>搜索</Button>
           {/* <Button  icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>重置</Button> */}
          <Dropdown menu={{ items: [
            { key: 'pdf', label: '导出PDF', icon: <FilePdfOutlined />, onClick: handleExportPDF },
            { key: 'json', label: '导出JSON', icon: <FileExcelOutlined />, onClick: handleExportJSON },
          ]}}>
            <Button icon={<DownloadOutlined />} loading={pdfExporting}>导出报告</Button>
          </Dropdown>
        </Space>
      </Card>

      <Spin spinning={loading}>
        <div ref={reportRef}>
        {/* 核心指标 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总收录量"
                value={coreMetrics.totalIndexed}
                prefix={<GlobalOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color="success">+{coreMetrics.totalIndexedWeeklyIncrement} 本周</Tag>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="SEO流量"
                value={coreMetrics.seoTraffic}
                prefix={<SearchOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={coreMetrics.seoTrafficWeeklyIncrement >= 0 ? 'success' : 'error'}>
                  {coreMetrics.seoTrafficWeeklyIncrement >= 0 ? '+' : ''}{coreMetrics.seoTrafficWeeklyIncrement}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均排名"
                value={coreMetrics.avgRanking}
                prefix={<SearchOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={coreMetrics.avgRankingWeeklyIncrement <= 0 ? 'success' : 'error'}>
                  {coreMetrics.avgRankingWeeklyIncrement <= 0 ? '↑' : '↓'} {Math.abs(coreMetrics.avgRankingWeeklyIncrement)}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="外链数量"
                value={coreMetrics.backlinkCount}
                prefix={<LinkOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color="success">+{coreMetrics.backlinkCountWeeklyIncrement} 本周</Tag>
              </div>
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="trend">
          <TabPane tab="收录趋势" key="trend">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={24}>
                <Card title="Google收录趋势">
                  <Line {...lineConfig} height={400} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="关键词排名" key="keywords">
            <Card title="关键词排名监控">
              <Table
                columns={keywordColumns}
                dataSource={analysisDetail.keywordRankings}
                rowKey="keyword"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>

          <TabPane tab="着陆页分析" key="landing">
            <Card title="Top着陆页表现">
              <Table
                columns={landingColumns}
                dataSource={analysisDetail.landingPages}
                rowKey="page_path"
                pagination={false}
              />
            </Card>
          </TabPane>

          <TabPane tab="流量来源" key="traffic">
            <Card title="Google流量来源细分">
              <Table
                columns={trafficColumns}
                dataSource={trafficData}
                rowKey="source"
                pagination={false}
              />
            </Card>
          </TabPane>
        </Tabs>
        </div>
      </Spin>
    </div>
  );
};

export default SEOAnalytics;

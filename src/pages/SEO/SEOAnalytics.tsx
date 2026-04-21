import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, DatePicker, Select, Button, Table, Tag, Statistic, Tabs, Progress, Space, Alert, Breadcrumb, message, Spin, Dropdown } from 'antd';
import { Line, Pie } from '@ant-design/charts';
import { RiseOutlined, FallOutlined, GlobalOutlined, SearchOutlined, LinkOutlined, ArrowLeftOutlined, ReloadOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
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

// 静态数据（作为初始值）
const indexTrendDataStatic = [
  { date: '04-11', google: 8500, indexed: 8200, discovered: 300 },
  { date: '04-12', google: 8620, indexed: 8320, discovered: 280 },
  { date: '04-13', google: 8740, indexed: 8450, discovered: 250 },
  { date: '04-14', google: 8850, indexed: 8560, discovered: 320 },
  { date: '04-15', google: 8920, indexed: 8650, discovered: 290 },
  { date: '04-16', google: 8980, indexed: 8720, discovered: 310 },
  { date: '04-17', google: 9050, indexed: 8800, discovered: 280 },
];

const trafficDataStatic: TrafficSource[] = [
  { source: 'Google Search', visits: 68420, percentage: 68.2, bounceRate: 28.5, avgDuration: '4:25' },
  { source: 'Google Discover', visits: 12560, percentage: 12.5, bounceRate: 32.1, avgDuration: '3:45' },
  { source: 'Google News', visits: 8420, percentage: 8.4, bounceRate: 25.8, avgDuration: '5:12' },
  { source: 'Google Images', visits: 6890, percentage: 6.9, bounceRate: 35.2, avgDuration: '2:35' },
  { source: 'Google Video', visits: 3890, percentage: 3.9, bounceRate: 42.5, avgDuration: '6:18' },
];

const keywordDataStatic: KeywordRanking[] = [
  { id: 1, keyword: '4k wallpaper', searchEngine: 'Google', currentRank: 3, previousRank: 5, change: 2, searchVolume: 185000, url: '/category/4k' },
  { id: 2, keyword: 'hd wallpaper', searchEngine: 'Google', currentRank: 5, previousRank: 6, change: 1, searchVolume: 148000, url: '/category/hd' },
  { id: 3, keyword: 'anime wallpaper', searchEngine: 'Google', currentRank: 2, previousRank: 4, change: 2, searchVolume: 256000, url: '/category/anime' },
  { id: 4, keyword: 'nature wallpaper', searchEngine: 'Google', currentRank: 8, previousRank: 12, change: 4, searchVolume: 95000, url: '/category/nature' },
  { id: 5, keyword: 'mobile wallpaper', searchEngine: 'Google', currentRank: 6, previousRank: 8, change: 2, searchVolume: 167000, url: '/category/mobile' },
  { id: 6, keyword: 'live wallpaper', searchEngine: 'Google', currentRank: 4, previousRank: 7, change: 3, searchVolume: 129000, url: '/category/live' },
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
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchEngine, setSearchEngine] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [_gscData, setGscData] = useState({
    clicks: 12580,
    impressions: 256000,
    ctr: 4.91,
    position: 8.5,
  });
  
  // 动态数据状态
  const [indexTrendData, setIndexTrendData] = useState(indexTrendDataStatic);
  const [keywordData, setKeywordData] = useState<KeywordRanking[]>(keywordDataStatic);
  const [landingPageData] = useState(landingPageDataStatic);
  const [trafficData, setTrafficData] = useState<TrafficSource[]>(trafficDataStatic);
  
  // 核心指标
  const [coreMetrics, _setCoreMetrics] = useState({
    totalIndexed: 28280,
    weeklyChange: 680,
    seoTraffic: 100380,
    trafficChange: 12.5,
    avgRank: 4.2,
    rankChange: -0.8,
    backlinks: 12580,
    backlinkChange: 320,
  });

  // 图表配置
  const lineConfig = {
    data: indexTrendData.flatMap(d => [
      { date: d.date, value: d.google, category: 'Google发现' },
      { date: d.date, value: d.indexed, category: '已收录' },
      { date: d.date, value: d.discovered, category: '新发现' },
    ]),
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: { appear: { animation: 'path-in', duration: 1000 } },
    color: ['#1890ff', '#52c41a', '#722ed1'],
  };

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
      const res = await seoApi.getSearchConsoleData({
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      });
      if (res.code === 200) {
        setGscData({
          clicks: res.data.clicks,
          impressions: res.data.impressions,
          ctr: res.data.ctr,
          position: res.data.position,
        });
      }
    } catch (_err) {
      message.error('加载GSC数据失败');
    }
  };

  // 加载关键词排名数据
  const loadKeywordRankings = async () => {
    try {
      const res = await seoApi.getKeywordRankings({ page: 1, pageSize: 10 });
      if (res.code === 200) {
        setKeywordData(res.data.items);
      }
    } catch (_err) {
      message.error('加载关键词数据失败');
    }
  };

  // 加载收录趋势数据
  const loadIndexTrend = async () => {
    try {
      const res = await seoApi.getIndexTrend({ days: 7 });
      if (res.code === 200) {
        setIndexTrendData(res.data);
      }
    } catch (_err) {
      message.error('加载收录趋势失败');
    }
  };

  // 初始加载
  useEffect(() => {
    loadGSCData();
    loadKeywordRankings();
    loadIndexTrend();
  }, []);

  // 刷新数据
  const handleRefresh = async () => {
    setLoading(true);
    message.loading('正在刷新数据...', 1);
    
    try {
      await Promise.all([
        loadGSCData(),
        loadKeywordRankings(),
        loadIndexTrend(),
      ]);
      message.success('数据刷新成功！');
    } catch (_err) {
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
      keywords: keywordData,
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
      if (searchEngine !== 'all') {
        const filteredTraffic = trafficDataStatic.filter(t => 
          t.source.toLowerCase().includes(searchEngine.toLowerCase())
        );
        setTrafficData(filteredTraffic.length > 0 ? filteredTraffic : trafficDataStatic);
      } else {
        setTrafficData(trafficDataStatic);
      }
      
      setLoading(false);
      message.success('查询完成！');
    }, 800);
  };

  const keywordColumns = [
    { title: '关键词', dataIndex: 'keyword', key: 'keyword', width: 150 },
    { title: '搜索引擎', dataIndex: 'searchEngine', key: 'searchEngine', width: 100 },
    {
      title: '当前排名',
      dataIndex: 'currentRank',
      key: 'currentRank',
      width: 100,
      render: (rank: number) => (
        <Tag color={rank <= 3 ? 'success' : rank <= 10 ? 'processing' : 'default'}>
          第{rank}位
        </Tag>
      ),
    },
    {
      title: '排名变化',
      dataIndex: 'change',
      key: 'change',
      width: 100,
      render: (change: number) => {
        if (change > 0) return <Tag icon={<RiseOutlined />} color="success">↑{change}</Tag>;
        if (change < 0) return <Tag icon={<FallOutlined />} color="error">↓{Math.abs(change)}</Tag>;
        return <Tag>-</Tag>;
      },
    },
    { title: '搜索量', dataIndex: 'searchVolume', key: 'searchVolume', render: (v: number) => v.toLocaleString() },
    { title: '着陆页', dataIndex: 'url', key: 'url', ellipsis: true },
  ];

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

  const landingColumns = [
    { title: '着陆页', dataIndex: 'page', key: 'page', ellipsis: true },
    { title: '访问量', dataIndex: 'visits', key: 'visits', render: (v: number) => v.toLocaleString() },
    { title: '跳出率', dataIndex: 'bounceRate', key: 'bounceRate', render: (v: number) => `${v}%` },
    { title: '平均停留', dataIndex: 'avgTime', key: 'avgTime' },
    {
      title: '转化率',
      dataIndex: 'conversion',
      key: 'conversion',
      render: (v: number) => <Progress percent={v} size="small" status={v > 10 ? 'success' : 'normal'} />,
    },
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
          <RangePicker onChange={setDateRange} />
          <Select 
            placeholder="Google服务" 
            style={{ width: 150 }} 
            allowClear
            value={searchEngine}
            onChange={setSearchEngine}
          >
            <Option value="search">Google Search</Option>
            <Option value="discover">Google Discover</Option>
            <Option value="news">Google News</Option>
            <Option value="images">Google Images</Option>
            <Option value="all">全部</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>刷新数据</Button>
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
                <Tag color="success">+{coreMetrics.weeklyChange} 本周</Tag>
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
                <Tag color={coreMetrics.trafficChange >= 0 ? 'success' : 'error'}>
                  {coreMetrics.trafficChange >= 0 ? '+' : ''}{coreMetrics.trafficChange}%
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均排名"
                value={coreMetrics.avgRank}
                prefix={<SearchOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={coreMetrics.rankChange <= 0 ? 'success' : 'error'}>
                  {coreMetrics.rankChange <= 0 ? '↑' : '↓'} {Math.abs(coreMetrics.rankChange)}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="外链数量"
                value={coreMetrics.backlinks}
                prefix={<LinkOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color="success">+{coreMetrics.backlinkChange} 本周</Tag>
              </div>
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="trend">
          <TabPane tab="收录趋势" key="trend">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card title="Google收录趋势">
                  <Line {...lineConfig} height={300} />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="流量来源分布">
                  <Pie {...pieConfig} height={300} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="关键词排名" key="keywords">
            <Card title="核心关键词排名">
              <Alert
                message="Google关键词排名监控"
                description="跟踪核心关键词在Google搜索结果中的排名变化"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={keywordColumns}
                dataSource={keywordData}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </TabPane>

          <TabPane tab="着陆页分析" key="landing">
            <Card title="Top着陆页表现">
              <Table
                columns={landingColumns}
                dataSource={landingPageData}
                rowKey="page"
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

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
  
  // 防止重复加载的标志位
  const hasLoadedInitialData = useRef(false);
  
  // 防止并发请求的标志位
  const isRefreshing = useRef(false);
  
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
      search_engine: string;
      current_position: number;
      position_change: number;
      estimated_volume: number;
      landing_page: string;
    }>,
    landingPages: [] as Array<{
      page: string;
      visits: number;
      bounce_rate: number;
      avg_time_on_page: number;
      conversion_rate: number;
    }>,
    trafficSources: [] as Array<{
      source: string;
      visits: number;
      percentage: number;
      bounce_rate: number;
      avg_time_on_page: number;
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
      message.error('加载数据失败');
    }
  };

  // 加载数据分析详细数据
  const loadAnalysisDetail = async () => {
    try {
      // 使用用户选择的日期范围，如果没有选择则使用默认最近7天
      const { startTimestamp, endTimestamp } = dateRange && dateRange[0] && dateRange[1]
        ? { 
            startTimestamp: Math.floor(dateRange[0].valueOf() / 1000), 
            endTimestamp: Math.floor(dateRange[1].valueOf() / 1000) 
          }
        : getDefaultTimeRange();
      
      const res = await seoApi.getDataAnalysisDetail({
        site_url: selectedPath,
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
      });
      if (res && res.data) {
        // 设置收录趋势数据（inclusion_trend）
        if (res.data.inclusion_trend && res.data.inclusion_trend.length > 0) {
          const trendData = res.data.inclusion_trend.map((item: any) => ({
            date: item.date,
            impressions: item.impressions,
            clicks: item.clicks,
            ctr: item.ctr,
            position: item.position,
          }));
          console.log('📈 收录趋势原始数据:', res.data.inclusion_trend);
          console.log('📈 收录趋势处理后数据:', trendData);
          setInclusionTrendData(trendData);
        } else {
          console.warn('⚠️ inclusion_trend 数据为空:', res.data.inclusion_trend);
        }
        
        setAnalysisDetail({
          indexTrend: res.data.index_trend || [],
          keywordRankings: res.data.keyword_rankings.map((item: any) => ({
            keyword: item.keyword,
            search_engine: item.search_engine,
            current_position: item.current_position,
            position_change: item.position_change,
            estimated_volume: item.estimated_volume,
            landing_page: item.landing_page,
          })) || [],
          // 处理landing_page_analysis：后端可能返回数组或对象
          landingPages: Array.isArray(res.data.landing_page_analysis) 
            ? res.data.landing_page_analysis  // 如果已经是数组，直接使用
            : (res.data.landing_page_analysis && res.data.landing_page_analysis.page)
              ? [res.data.landing_page_analysis]  // 如果是对象且有效，包装成数组
              : [],
          // 使用接口返回的traffic_sources数据
          trafficSources: res.data.traffic_sources || [],
        });
        
        console.log('✅ landingPages 数据已设置:', analysisDetail.landingPages);
      }
    } catch (err) {
      message.error('加载详细数据失败');
    }
  };

  // 图表配置 - 收录趋势（四个指标分开展示）
  // 注意：当数据为空时，返回空数组避免报错
  const lineConfig = inclusionTrendData.length > 0 ? {
    data: [
      // 曝光量数据
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: item.impressions || 0,
        category: '曝光量',
      })),
      // 点击次数数据
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: item.clicks || 0,
        category: '点击量',
      })),
      // 平均排名数据（直接使用原始值）
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: item.position || 0,
        category: '平均排名',
      })),
      // 点击率数据（直接使用原始值）
      ...inclusionTrendData.map(item => ({
        date: item.date,
        value: item.ctr || 0,
        category: '点击率',
      })),
    ],
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    autoFit: true,
    animation: { 
      appear: { animation: 'path-in', duration: 1000 },
      enter: { animation: 'wave-in', duration: 800 }
    },
    // 使用 colorField 配合 color 配置
    colorField: 'category',
    color: ['#1890ff', '#52c41a', '#fa8c16', '#722ed1'],
    // 图例配置
    legend: {
      position: 'top' as const,
      itemName: {
        style: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
    },
    // 提示框配置 - 优化显示数值
    tooltip: {
      showMarkers: true,
      shared: true,
      showCrosshairs: true,
      crosshairs: {
        type: 'x' as const,
      },
      // 自定义 tooltip 内容
      customContent: (title: string, items: any[]) => {
        if (!items || items.length === 0) return '';
        
        const container = document.createElement('div');
        container.style.padding = '12px';
        container.style.background = '#fff';
        container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        container.style.borderRadius = '4px';
        container.style.minWidth = '150px';
        
        // 标题（日期）
        const titleEl = document.createElement('div');
        titleEl.style.marginBottom = '8px';
        titleEl.style.color = '#666';
        titleEl.style.fontSize = '12px';
        titleEl.textContent = title;
        container.appendChild(titleEl);
        
        // 数据项列表
        const listEl = document.createElement('div');
        items.forEach((item: any) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.marginBottom = '4px';
          row.style.fontSize = '12px';
          row.style.lineHeight = '20px';
          
          // 颜色点
          const dot = document.createElement('span');
          dot.style.display = 'inline-block';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.backgroundColor = item.color || '#1890ff';
          dot.style.marginRight = '8px';
          dot.style.flexShrink = '0';
          
          // 名称
          const name = document.createElement('span');
          name.style.flex = '1';
          name.style.color = '#333';
          name.textContent = item.name || '未知';
          
          // 数值 - 直接显示
          const value = document.createElement('span');
          value.style.color = '#666';
          value.style.marginLeft = '12px';
          value.style.fontWeight = '500';
          value.style.flexShrink = '0';
          
          // 获取实际数值
          const rawValue = item.data?.value ?? item.value ?? 0;
          const seriesName = item.name || '';
          
          // 格式化数值
          if (seriesName === '平均排名') {
            value.textContent = rawValue.toFixed(1);
          } else if (seriesName === '点击率') {
            value.textContent = rawValue.toFixed(2) + '%';
          } else if (seriesName === '曝光量' || seriesName === '点击量') {
            value.textContent = Number(rawValue).toLocaleString();
          } else {
            value.textContent = String(rawValue);
          }
          
          row.appendChild(dot);
          row.appendChild(name);
          row.appendChild(value);
          listEl.appendChild(row);
        });
        
        container.appendChild(listEl);
        return container;
      },
    },
    // 点样式
    point: {
      size: 4,
      shape: 'circle',
    },
    // 折线样式
    lineStyle: {
      lineWidth: 2,
    },
    // X轴配置 - 调整间距从10开始
    xAxis: {
      label: {
        autoRotate: false,
        autoHide: false,
        offset: 10,
      },
      tickLine: null,
      grid: null,
    },
    // 确保Y轴从0开始，更好地展示所有数据线
    meta: {
      value: {
        min: 0,
        alias: '数值',
      },
    },
  } as any : undefined;

  // 调试：打印图表数据（只在数据存在时）
  if (lineConfig) {
    console.log('📊 图表数据:', {
      'inclusionTrendData长度': inclusionTrendData.length,
      '图表数据总数': lineConfig.data.length,
      '分类列表': [...new Set(lineConfig.data.map((d: any) => d.category))],
      '是否有数据': lineConfig.data.length > 0,
    });
    
    if (lineConfig.data.length > 0) {
      console.log(' 示例数据点:', lineConfig.data.slice(0, 4));
    }
  } else {
    console.log('⏳ 图表数据加载中或暂无数据');
  }

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
    { 
      title: '关键词', 
      dataIndex: 'keyword', 
      key: 'keyword', 
      ellipsis: true, 
      width: 200,
    },
    { 
      title: '搜索引擎', 
      dataIndex: 'search_engine', 
      key: 'search_engine', 
      width: 120,
    },
    { 
      title: '当前平均排名', 
      dataIndex: 'current_position', 
      key: 'current_position', 
      width: 140,
      render: (v: number) => <Tag color={v <= 10 ? 'success' : v <= 30 ? 'warning' : 'default'} style={{ fontSize: '14px', padding: '4px 12px' }}>{v}</Tag> 
    },
    { 
      title: '排名涨跌变化', 
      dataIndex: 'position_change', 
      key: 'position_change',
      width: 140,
      render: (v: number) => {
        if (v === 0) return <Tag color="default" style={{ fontSize: '14px', padding: '4px 12px' }}>-</Tag>;
        return (
          <Tag color={v > 0 ? 'success' : 'error'} style={{ fontSize: '14px', padding: '4px 12px' }}>
            {v > 0 ? `↑${v}` : `↓${Math.abs(v)}`}
          </Tag>
        );
      }
    },
    { 
      title: '搜索量', 
      dataIndex: 'estimated_volume', 
      key: 'estimated_volume', 
      width: 120, 
      render: (v: number) => v.toLocaleString() 
    },
    { 
      title: '落地页', 
      dataIndex: 'landing_page', 
      key: 'landing_page', 
      ellipsis: true,
      width: 300,
    },
  ];

  // 着陆页表格列定义
  const landingColumns = [
    { 
      title: '着陆页', 
      dataIndex: 'page', 
      key: 'page', 
      ellipsis: true,
      width: 300,
    },
    { 
      title: '访问量', 
      dataIndex: 'visits', 
      key: 'visits', 
      width: 120,
      render: (v: number) => v != null ? v.toLocaleString() : '--'
    },
    { 
      title: '跳出率', 
      dataIndex: 'bounce_rate', 
      key: 'bounce_rate', 
      width: 120,
      render: (v: number) => v != null ? `${v.toFixed(1)}%` : '--'
    },
    { 
      title: '平均停留', 
      dataIndex: 'avg_time_on_page', 
      key: 'avg_time_on_page',
      width: 120,
      render: (v: number) => v != null ? `${v}s` : '--'
    },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      width: 150,
      render: (v: number) => {
        if (v == null) return '--';
        return <Progress percent={v} size="small" status={v > 10 ? 'success' : 'normal'} />;
      },
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
    } catch {
      message.error('加载GSC数据失败');
    }
  };

  // 初始加载（只调用一次）
  useEffect(() => {
    // 防止React StrictMode导致的重复执行
    if (hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;
    
    loadGSCData();
    loadCoreMetrics();
    loadAnalysisDetail(); // 加载详细数据分析
  }, []);

  // 注意：路径和日期改变时不再自动调用接口
  // 用户需要手动点击"搜索"按钮来刷新数据

  // 刷新数据（同时刷新详细分析数据）
  const handleRefresh = async () => {
    // 防止并发请求
    if (isRefreshing.current) {
      console.warn('⚠️ 请求正在进行中，忽略重复调用');
      return;
    }
    
    // 防止重复点击
    if (loading) return;
    
    isRefreshing.current = true;
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
      isRefreshing.current = false;
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
    } catch {
      message.error('PDF导出失败，请重试');
    } finally {
      setPdfExporting(false);
    }
  };

  const trafficColumns = [
    { title: '流量来源', dataIndex: 'source', key: 'source', width: 200 },
    { title: '访问量', dataIndex: 'visits', key: 'visits', width: 120, render: (v: number) => v != null ? v.toLocaleString() : '--' },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 150,
      render: (p: number) => p != null ? <Progress percent={p} size="small" showInfo={false} /> : '--',
    },
    { title: '跳出率', dataIndex: 'bounce_rate', key: 'bounce_rate', width: 120, render: (v: number) => v != null ? `${v.toFixed(1)}%` : '--' },
    { title: '平均停留', dataIndex: 'avg_time_on_page', key: 'avg_time_on_page', width: 120, render: (v: number) => v != null ? `${v}s` : '--' },
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
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                      <Spin size="large" tip="数据加载中..." />
                    </div>
                  ) : inclusionTrendData.length > 0 ? (
                    <Line {...lineConfig} height={400} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      暂无数据，请点击搜索按钮加载数据
                    </div>
                  )}
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
                size="middle"
                bordered
                scroll={{ x: 'max-content' }}
                pagination={{ 
                  pageSize: 10,
                  position: ['bottomRight'],
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`
                }}
                rowClassName={() => 'keyword-row'}
              />
            </Card>
          </TabPane>

          <TabPane tab="着陆页分析" key="landing">
            <Card title="Top着陆页表现">
              <Table
                columns={landingColumns}
                dataSource={analysisDetail.landingPages}
                rowKey="page"
                pagination={false}
              />
            </Card>
          </TabPane>

          <TabPane tab="流量来源" key="traffic">
            <Card title="Google流量来源细分">
              <Table
                columns={trafficColumns}
                dataSource={analysisDetail.trafficSources}
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

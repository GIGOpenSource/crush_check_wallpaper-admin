import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Progress, Alert, Tabs, Modal, Form, Input, Switch, message, Timeline, Statistic, Row, Col, Select, Breadcrumb, Spin } from 'antd';

import { ReloadOutlined, DownloadOutlined, EyeOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, GlobalOutlined, FileTextOutlined, ArrowLeftOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listSitemaps, getSitemapUrls, getSitemapStatistics, createSitemapUrl, generateSitemap, generateSitemapXml, downloadSitemap, submitToSearchEngines, getSitemapSubmissionHistory, getSitemapStatus } from '../../services/seoApi';
import type { SitemapFile, SitemapUrl, SitemapHistory, SitemapStatistics as SitemapStatisticsType } from '../../services/seoApi';

const { TabPane } = Tabs;
const { TextArea } = Input;

const SitemapManager: React.FC = () => {
  const navigate = useNavigate();
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [addUrlModalVisible, setAddUrlModalVisible] = useState(false);  // 新增 URL 弹窗
  const [selectedSitemap, setSelectedSitemap] = useState<SitemapFile | null>(null);
  const [form] = Form.useForm();
  const [generateForm] = Form.useForm();
  const [addUrlForm] = Form.useForm();  // 新增 URL 表单
  const [loading, setLoading] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);  // 保存 URL 加载状态
  const [sitemapFiles, setSitemapFiles] = useState<SitemapFile[]>([]);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [sitemapTotal, setSitemapTotal] = useState(0);
  const [sitemapPage, setSitemapPage] = useState(1);
  const [sitemapPageSize] = useState(10);
  
  // 自动更新配置弹窗
  const [autoUpdateModalVisible, setAutoUpdateModalVisible] = useState(false);
  const [autoUpdateForm] = Form.useForm();
  const [savingAutoUpdate, setSavingAutoUpdate] = useState(false);

  // 提交到搜索引擎弹窗状态
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedSitemapIds, setSelectedSitemapIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 提交历史记录
  const [sitemapHistory, setSitemapHistory] = useState<SitemapHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // URL 列表状态
  const [urlList, setUrlList] = useState<SitemapUrl[]>([]);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlTotal, setUrlTotal] = useState(0);
  const [urlPage, setUrlPage] = useState(1);
  const [urlPageSize] = useState(10);
  const [urlSearch, setUrlSearch] = useState('');
  const [urlStatusFilter, setUrlStatusFilter] = useState<string>('');

  // 统计数据状态
  const [statistics, setStatistics] = useState<SitemapStatisticsType>({
    total_urls: 0,
    indexed_count: 0,
    pending_count: 0,
    index_rate: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // 加载Sitemap列表
  useEffect(() => {
    loadSitemaps();
    loadSitemapHistory();
    loadUrls();
    loadStatistics();
  }, []);

  // 格式化日期时间
  const formatDateTime = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).replace(/\//g, '-');
    } catch (_err) {
      return dateStr;
    }
  };

  // 加载Sitemap文件列表
  const loadSitemaps = async (page: number = sitemapPage) => {
    setSitemapLoading(true);
    try {
      const res = await listSitemaps({
        currentPage: page,
        pageSize: sitemapPageSize,
      });
      if (res.code === 200) {
        // 后端返回分页结构：data.results 是数组，data.pagination 是分页信息
        const data = res.data as any;
        const results = Array.isArray(data?.results) ? data.results : [];
        const pagination = data?.pagination || {};
        
        // 字段映射：将后端返回的字段映射为前端期望的格式
        const mappedResults = results.map((item: any) => ({
          id: item.id,
          name: item.title || `sitemap_${item.id}.xml`,          // title -> name
          type: item.type || 'sitemap',
          urls: item.url_count || 0,                             // url_count -> urls
          size: item.file_size || '0KB',                         // file_size -> size
          lastUpdate: formatDateTime(item.updated_at),           // updated_at -> lastUpdate (格式化)
          status: item.is_active ? 'valid' : 'invalid',          // is_active -> status
          autoUpdate: item.auto_update ?? false,
        }));
        
        setSitemapFiles(mappedResults);
        setSitemapTotal(pagination.total || 0);
        setSitemapPage(page);
      }
    } catch (_err) {
      message.error('加载Sitemap列表失败');
      setSitemapFiles([]);
    } finally {
      setSitemapLoading(false);
    }
  };

  // 加载提交历史记录
  const loadSitemapHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getSitemapSubmissionHistory();
      if (res.code === 200 && res.data) {
        setSitemapHistory(res.data);
      }
    } catch (err: any) {
      console.error('加载提交历史失败:', err);
      message.error(err?.message || '加载提交历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 加载 URL 列表
  const loadUrls = async (page: number = urlPage) => {
    setUrlLoading(true);
    try {
      const res = await getSitemapUrls({
        currentPage: page,
        pageSize: urlPageSize,
        content: urlSearch || undefined,
        index_status: urlStatusFilter || undefined,
      });
      if (res.code === 200 && res.data) {
        // 后端返回的数据结构：data.results 是数组，data.pagination 是分页信息
        const results = (res.data as any).results || [];
        const pagination = (res.data as any).pagination || {};
        
        // 映射后端字段到前端字段
        const mappedData: SitemapUrl[] = results.map((item: any) => ({
          id: item.id,
          loc: item.content || '',  // content -> loc
          lastmod: item.updated_at || '',  // updated_at -> lastmod
          changefreq: item.changefreq || 'weekly',
          priority: item.priority || 0.5,
          status: item.index_status || 'pending',  // index_status -> status
        }));
        
        setUrlList(mappedData);
        setUrlTotal(pagination.total || 0);
        setUrlPage(page);
      }
    } catch (err: any) {
      console.error('加载URL列表失败:', err);
      message.error(err?.message || '加载URL列表失败');
    } finally {
      setUrlLoading(false);
    }
  };

  // 加载统计数据
  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const res = await getSitemapStatistics();
      if (res.code === 200 && res.data) {
        setStatistics(res.data);
      }
    } catch (err: any) {
      console.error('加载统计数据失败:', err);
      message.error(err?.message || '加载统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  };

  // 提交新增 URL 表单
  const handleAddUrl = async () => {
    try {
      const values = await addUrlForm.validateFields();
      setSavingUrl(true);
      
      const res = await createSitemapUrl({
        content: values.content,
        index_status: values.index_status,
        changefreq: values.changefreq,
        priority: values.priority,
        title: values.title,
      });
      
      // 支持 200 和 201 状态码
      if (res.code === 200 || res.code === 201) {
        message.success('添加成功');
        setAddUrlModalVisible(false);
        addUrlForm.resetFields();
        loadUrls();  // 刷新列表
        loadStatistics();  // 刷新统计数据
      }
    } catch (err: any) {
      console.error('添加失败:', err);
      message.error(err?.message || '添加失败');
    } finally {
      setSavingUrl(false);
    }
  };

  const columns = [
    { title: '文件名', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, ellipsis: true, render: (type: string) => <Tag color={type === 'index' ? 'blue' : 'default'}>{type === 'index' ? '索引' : '地图'}</Tag> },
    { title: 'URL数量', dataIndex: 'urls', key: 'urls', width: 100, ellipsis: true },
    { title: '文件大小', dataIndex: 'size', key: 'size', width: 100, ellipsis: true },
    { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate', width: 180, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      ellipsis: true,
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          valid: { color: 'success', icon: <CheckCircleOutlined />, text: '有效' },
          invalid: { color: 'warning', icon: <CloseCircleOutlined />, text: '无效' },
          error: { color: 'error', icon: <CloseCircleOutlined />, text: '错误' },
          active: { color: 'success', icon: <CheckCircleOutlined />, text: '活跃' },
          inactive: { color: 'default', icon: <CloseCircleOutlined />, text: '非活跃' },
        };
        const item = config[status] || { color: 'default', icon: null, text: status || '未知' };
        return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>;
      },
    },
    // {
    //   title: '自动更新',
    //   dataIndex: 'autoUpdate',
    //   key: 'autoUpdate',
    //   width: 100,
    //   ellipsis: true,
    //   render: (auto: boolean, record: SitemapFile) => (
    //     <Switch 
    //       checked={auto} 
    //       size="small" 
    //       onChange={(checked) => handleToggleAutoUpdate(record, checked)}
    //     />
    //   ),
    // },
    {
      title: '操作',
      key: 'action',
      width: 200,
      ellipsis: true,
      render: (_: unknown, record: SitemapFile) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {/* <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button> */}
        </Space>
      ),
    },
  ];

  const urlColumns = [
    { title: 'URL', dataIndex: 'loc', key: 'loc', ellipsis: true },
    { 
      title: '最后修改', 
      dataIndex: 'lastmod', 
      key: 'lastmod', 
      width: 180,
      render: (date: string) => {
        if (!date) return '--';
        try {
          const d = new Date(date);
          return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }).replace(/\//g, '-');
        } catch {
          return date;
        }
      }
    },
    { title: '更新频率', dataIndex: 'changefreq', key: 'changefreq', width: 100 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100, render: (p: number) => <Progress percent={p * 100} size="small" showInfo={false} /> },
    {
      title: '索引状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          indexed: { color: 'success', text: '已索引' },
          pending: { color: 'processing', text: '待索引' },
          excluded: { color: 'default', text: '已排除' },
          error: { color: 'error', text: '错误' },
        };
        const statusInfo = map[status] || { color: 'default', text: status || '--' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
  ];

  const handleView = (record: SitemapFile) => {
    setSelectedSitemap(record);
    setViewModalVisible(true);
  };

  const handleEdit = (record: SitemapFile) => {
    setSelectedSitemap(record);
    form.setFieldsValue({
      name: record.name,
      autoUpdate: record.autoUpdate,
    });
    setEditModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      message.success('保存成功');
      setEditModalVisible(false);
    });
  };

  // 打开自动更新配置
  const handleOpenAutoUpdateConfig = (record: SitemapFile) => {
    setSelectedSitemap(record);
    autoUpdateForm.setFieldsValue({
      enabled: record.autoUpdate,
      frequency: record.autoUpdate ? 'daily' : 'weekly',
      time: '02:00',
      notify: true,
    });
    setAutoUpdateModalVisible(true);
  };

  // 保存自动更新配置
  const handleSaveAutoUpdate = async () => {
    try {
      const values = await autoUpdateForm.validateFields();
      setSavingAutoUpdate(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地状态
      if (selectedSitemap) {
        setSitemapFiles(prev => prev.map(item => 
          item.id === selectedSitemap.id 
            ? { ...item, autoUpdate: values.enabled }
            : item
        ));
      }
      
      message.success(`自动更新${values.enabled ? '已启用' : '已禁用'}`);
      setAutoUpdateModalVisible(false);
    } catch (_err) {
      message.error('保存失败');
    } finally {
      setSavingAutoUpdate(false);
    }
  };

  // 切换自动更新开关
  const handleToggleAutoUpdate = async (record: SitemapFile, checked: boolean) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 更新本地状态
      setSitemapFiles(prev => prev.map(item => 
        item.id === record.id 
          ? { ...item, autoUpdate: checked }
          : item
      ));
      
      message.success(`自动更新${checked ? '已启用' : '已禁用'}`);
      
      // 如果启用，打开配置弹窗
      if (checked) {
        handleOpenAutoUpdateConfig({ ...record, autoUpdate: checked });
      }
    } catch (_err) {
      message.error('操作失败');
    }
  };

  const handleGenerate = () => {
    generateForm.validateFields().then(async (values) => {
      setLoading(true);
      try {
        const res = await generateSitemapXml({
          changefreq: values.changefreq,
          priority: values.priority,
          content_type: values.content_type,
        });
        if (res.code === 200 || res.code === 201) {
          message.success(`Sitemap生成成功！${res.data.generated_count ? `共生成 ${res.data.generated_count} 个URL` : ''}`);
          setGenerateModalVisible(false);
          generateForm.resetFields();
          loadSitemaps(); // 刷新列表
        }
      } catch (err: any) {
        message.error(err?.message || 'Sitemap生成失败');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDownload = async (record: SitemapFile) => {
    try {
      const blob = await downloadSitemap(record.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`已下载 ${record.name}`);
    } catch (_err) {
      message.error('下载失败');
    }
  };

  const handleDownloadAll = () => {
    sitemapFiles.forEach((file, index) => {
      setTimeout(() => handleDownload(file), index * 500);
    });
    message.success('开始下载全部sitemap文件...');
  };

  // 打开提交到搜索引擎弹窗
  const handleOpenSubmitModal = () => {
    setSelectedSitemapIds([]);
    setSubmitModalVisible(true);
  };

  // 关闭提交弹窗
  const handleCloseSubmitModal = () => {
    setSubmitModalVisible(false);
    setSelectedSitemapIds([]);
  };

  // 提交到搜索引擎
  const handleSubmitToSearchEngines = async () => {
    if (selectedSitemapIds.length === 0) {
      message.warning('请至少选择一个 Sitemap 文件');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitToSearchEngines(selectedSitemapIds);
      if (res.code === 200) {
        message.success(`成功提交 ${selectedSitemapIds.length} 个 Sitemap 文件到搜索引擎`);
        handleCloseSubmitModal();
        // 刷新提交历史
        loadSitemapHistory();
      } else {
        message.error(res.message || '提交失败');
      }
    } catch (err: any) {
      console.error('提交到搜索引擎失败:', err);
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 刷新所有数据
  const handleRefreshAll = async () => {
    message.loading('正在刷新数据...', 0);
    try {
      await Promise.all([
        loadSitemaps(),
        loadSitemapHistory(),
        loadUrls(),
        loadStatistics(),
        loadSitemapStatus(),
      ]);
      message.destroy();
      message.success('数据刷新成功');
    } catch (err: any) {
      message.destroy();
      console.error('刷新数据失败:', err);
      message.error('刷新数据失败，请稍后重试');
    }
  };

  // 搜索功能
  const handleSearch = () => {
    loadUrls(1);
  };

  // 重置功能
  const handleReset = () => {
    setUrlSearch('');
    setUrlStatusFilter('');
    loadUrls(1);
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>Sitemap管理</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
          Sitemap管理
        </span>
        <Button icon={<ReloadOutlined />} onClick={handleRefreshAll}>
          刷新数据
        </Button>
      </h2>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="总URL数" 
              value={statistics.total_urls} 
              loading={statsLoading}
              prefix={<FileTextOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="已索引" 
              value={statistics.indexed_count} 
              loading={statsLoading}
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="待索引" 
              value={statistics.pending_count} 
              loading={statsLoading}
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="索引率" 
              value={statistics.index_rate} 
              loading={statsLoading}
              suffix="%" 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="files">
        <TabPane tab="Sitemap文件" key="files">
          <Card>
            <Alert
              message="Sitemap状态正常"
              description="所有sitemap文件均可正常访问，最后更新时间为 2026-04-17 10:00"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<ReloadOutlined />} onClick={() => setGenerateModalVisible(true)}>
                重新生成
              </Button>
              <Button icon={<GlobalOutlined />} onClick={handleOpenSubmitModal}>
                提交到搜索引擎
              </Button>
            </Space>
            <Table 
              columns={columns} 
              dataSource={sitemapFiles} 
              rowKey="id" 
              loading={sitemapLoading}
              scroll={{ x: 'max-content' }}
              pagination={{
                current: sitemapPage,
                pageSize: sitemapPageSize,
                total: sitemapTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page) => loadSitemaps(page),
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="URL列表" key="urls">
          <Card>
            <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: '8px' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddUrlModalVisible(true)}>
                新增
              </Button>
              <Input
                placeholder="搜索URL" 
                style={{ width: 240 }}
                value={urlSearch}
                onChange={(e) => setUrlSearch(e.target.value)}
                // onSearch={() => loadUrls(1)}
                allowClear
              />
              <Select 
                placeholder="索引状态" 
                style={{ width: 120 }} 
                allowClear
                value={urlStatusFilter}
                onChange={(value) => {
                  setUrlStatusFilter(value || '');
                  loadUrls(1);
                }}
              >
                 <Select.Option value="">全部</Select.Option>
                <Select.Option value="indexed">已索引</Select.Option>
                <Select.Option value="pending">待索引</Select.Option>
                <Select.Option value="error">错误</Select.Option>
              </Select>
              <Button onClick={handleSearch} type="primary">搜索</Button>
              <Button onClick={handleReset}>重置</Button>
              {/* <Button type="primary" onClick={() => message.success('批量提交成功')}>批量提交</Button> */}
            </Space>
            <Table
              columns={urlColumns}
              dataSource={urlList}
              rowKey="id"
              loading={urlLoading}
              pagination={{
                current: urlPage,
                pageSize: urlPageSize,
                total: urlTotal,
                onChange: (page) => loadUrls(page),
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="提交历史" key="history">
          <Card title="Sitemap提交状态">
            <Spin spinning={historyLoading} tip="加载中...">
              {sitemapHistory.length > 0 ? (
                <Table
                  columns={[
                    {
                      title: '类型',
                      dataIndex: 'type',
                      key: 'type',
                      width: 120,
                      render: (type: string) => {
                        if (!type || type.trim() === '') {
                          return <Tag color="default">未知</Tag>;
                        }
                        return (
                          <Tag color={type === 'sitemap_index' ? 'blue' : 'default'}>
                            {type === 'sitemap_index' ? '索引' : '地图'}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Sitemap路径',
                      dataIndex: 'path',
                      key: 'path',
                      ellipsis: true,
                      render: (path: string) => path || '--',
                    },
                    {
                      title: '最后提交时间',
                      dataIndex: 'last_submitted',
                      key: 'last_submitted',
                      width: 180,
                      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '--',
                    },
                    // {
                    //   title: '状态',
                    //   dataIndex: 'is_pending',
                    //   key: 'is_pending',
                    //   width: 100,
                    //   render: (isPending: boolean) => (
                    //     <Tag color={isPending ? 'processing' : 'success'}>
                    //       {isPending ? '待处理' : '已处理'}
                    //     </Tag>
                    //   ),
                    // },
                    {
                      title: '状态',
                      key: 'status',
                      width: 100,
                      render: (_: any, record: SitemapHistory) => {
                        const hasErrors = record.errors && parseInt(record.errors) > 0;
                        return (
                          <Tag color={hasErrors ? 'error' : 'success'}>
                            {hasErrors ? '失败' : '成功'}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: '错误数',
                      dataIndex: 'errors',
                      key: 'errors',
                      width: 80,
                      render: (errors: string) => (
                        <Tag color={errors && parseInt(errors) > 0 ? 'error' : 'default'}>
                          {errors || '0'}
                        </Tag>
                      ),
                    },
                    {
                      title: '警告数',
                      dataIndex: 'warnings',
                      key: 'warnings',
                      width: 80,
                      render: (warnings: string) => (
                        <Tag color={warnings && parseInt(warnings) > 0 ? 'warning' : 'default'}>
                          {warnings || '0'}
                        </Tag>
                      ),
                    },
                  ]}
                  dataSource={sitemapHistory}
                  rowKey="path"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <div>暂无Sitemap提交记录</div>
                </div>
              )}
            </Spin>
          </Card>
        </TabPane>
      </Tabs>

      {/* 查看弹窗 */}
      <Modal
        title="Sitemap内容预览"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[<Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>]}
        width={800}
      >
        {selectedSitemap && (
          <div>
            <p><strong>文件名:</strong> {selectedSitemap.name}</p>
            {/* <p><strong>URL:</strong> {selectedSitemap.url}</p>
            <p><strong>包含URL数:</strong> {selectedSitemap.urls}</p> */}
            <TextArea
              rows={15}
              value={`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/wallpaper/4k-star-sky</loc>
    <lastmod>2026-04-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/wallpaper/anime-girl</loc>
    <lastmod>2026-04-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ...
</urlset>`}
              readOnly
            />
          </div>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑Sitemap配置"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="文件名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {/* <Form.Item name="autoUpdate" label="自动更新" valuePropName="checked">
            <Switch />
          </Form.Item> */}
        </Form>
      </Modal>

      {/* 生成弹窗 */}
      <Modal
        title="生成Sitemap"
        open={generateModalVisible}
        onOk={handleGenerate}
        onCancel={() => {
          setGenerateModalVisible(false);
          generateForm.resetFields();
        }}
        confirmLoading={loading}
      >
        <Form form={generateForm} layout="vertical">
          <Form.Item 
            name="content_type" 
            label="包含内容类型" 
            rules={[{ required: true, message: '请选择内容类型' }]}
            initialValue="article"
          >
            <Select placeholder="选择要生成的内容类型">
              <Select.Option value="article">文章</Select.Option>
              <Select.Option value="category">分类</Select.Option>
              <Select.Option value="tag">标签</Select.Option>
              <Select.Option value="page">页面</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="changefreq" 
            label="更新频率" 
            rules={[{ required: true, message: '请选择更新频率' }]}
            initialValue="daily"
          >
            <Select>
              <Select.Option value="always">总是</Select.Option>
              <Select.Option value="hourly">每小时</Select.Option>
              <Select.Option value="daily">每天</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
              <Select.Option value="yearly">每年</Select.Option>
              <Select.Option value="never">从不</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="priority" 
            label="优先级" 
            rules={[
              { required: true, message: '请输入优先级' },
              { type: 'number', min: 0.1, max: 1, message: '优先级范围是 0.1 ~ 1' }
            ]}
            initialValue={0.5}
          >
            <Input type="number" min={0.1} max={1} step={0.1} placeholder="请输入优先级 (0.1 ~ 1)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 提交到搜索引擎选择弹窗 */}
      <Modal
        title="选择要提交的 Sitemap 文件"
        open={submitModalVisible}
        onOk={handleSubmitToSearchEngines}
        onCancel={handleCloseSubmitModal}
        confirmLoading={submitting}
        width={800}
      >
        <Alert
          message="请选择要提交到搜索引擎的 Sitemap 文件"
          description="提交后，搜索引擎将重新索引这些 Sitemap 文件中的 URL"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          rowSelection={{
            selectedRowKeys: selectedSitemapIds,
            onChange: (selectedRowKeys: React.Key[]) => {
              setSelectedSitemapIds(selectedRowKeys as number[]);
            },
          }}
          columns={[
            { title: '文件名', dataIndex: 'name', key: 'name', ellipsis: true },
            { 
              title: '状态', 
              dataIndex: 'status', 
              key: 'status', 
              width: 100,
              render: (status: string) => {
                const config: Record<string, { color: string; text: string }> = {
                  valid: { color: 'success', text: '有效' },
                  invalid: { color: 'warning', text: '无效' },
                  error: { color: 'error', text: '错误' },
                };
                const item = config[status] || { color: 'default', text: status || '未知' };
                return <Tag color={item.color}>{item.text}</Tag>;
              },
            },
            { title: 'URL数量', dataIndex: 'urls', key: 'urls', width: 100 },
            { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate', width: 180 },
          ]}
          dataSource={sitemapFiles}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Modal>

      {/* 自动更新配置弹窗 */}
      <Modal
        title="自动更新配置"
        open={autoUpdateModalVisible}
        onOk={handleSaveAutoUpdate}
        onCancel={() => setAutoUpdateModalVisible(false)}
        confirmLoading={savingAutoUpdate}
        width={500}
      >
        <Form form={autoUpdateForm} layout="vertical">
          <Form.Item name="enabled" label="启用自动更新" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="frequency" label="更新频率" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="hourly">每小时</Select.Option>
              <Select.Option value="daily">每天</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="time" label="执行时间" rules={[{ required: true }]}>
            <Input placeholder="例如: 02:00" />
          </Form.Item>
          <Form.Item name="notify" label="更新通知" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          <Alert
            message="配置说明"
            description="启用后，系统将按照设定频率自动生成并提交Sitemap。建议在网站内容更新较少的时间段执行。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>

      {/* 新增 URL 弹窗 */}
      <Modal
        title="新增 Sitemap URL"
        open={addUrlModalVisible}
        onOk={handleAddUrl}
        onCancel={() => {
          setAddUrlModalVisible(false);
          addUrlForm.resetFields();
        }}
        confirmLoading={savingUrl}
        width={600}
      >
        <Form form={addUrlForm} layout="vertical">
          <Form.Item 
            name="content" 
            label="URL" 
            rules={[
              { required: true, message: '请输入URL' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input placeholder="例如: https://example.com/article/123" />
          </Form.Item>
          <Form.Item 
            name="index_status" 
            label="索引状态" 
            rules={[{ required: true, message: '请选择索引状态' }]}
            initialValue="pending"
          >
            <Select>
              <Select.Option value="pending">待索引</Select.Option>
              <Select.Option value="indexed">已索引</Select.Option>
              <Select.Option value="excluded">已排除</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="changefreq" 
            label="更新频率" 
            rules={[{ required: true, message: '请选择更新频率' }]}
            initialValue="weekly"
          >
            <Select>
              <Select.Option value="always">总是</Select.Option>
              <Select.Option value="hourly">每小时</Select.Option>
              <Select.Option value="daily">每天</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
              <Select.Option value="yearly">每年</Select.Option>
              <Select.Option value="never">从不</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="priority" 
            label="优先级" 
            rules={[
              { required: true, message: '请输入优先级' },
              { 
                validator: (_, value) => {
                  if (value >= 0.1 && value <= 1) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('优先级范围: 0.1 ~ 1'));
                }
              }
            ]}
            initialValue={0.5}
          >
            <Input type="number" step="0.1" min="0.1" max="1" placeholder="0.1 ~ 1" />
          </Form.Item>
          <Form.Item 
            name="title" 
            label="分类" 
            rules={[{ required: true, message: '请选择分类' }]}
            initialValue="article"
          >
            <Select>
              <Select.Option value="article">文章</Select.Option>
              <Select.Option value="category">分类</Select.Option>
              <Select.Option value="tag">标签</Select.Option>
              <Select.Option value="page">页面</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SitemapManager;

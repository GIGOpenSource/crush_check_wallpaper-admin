import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Progress, Alert, Tabs, Modal, Form, Input, Switch, message, Timeline, Statistic, Row, Col, Select, Breadcrumb } from 'antd';
import { ReloadOutlined, DownloadOutlined, EyeOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, GlobalOutlined, FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi } from '../../services/seoApi';

const { TabPane } = Tabs;
const { TextArea } = Input;

interface SitemapFile {
  id: number;
  name: string;
  url: string;
  type: 'index' | 'sitemap';
  urls: number;
  size: string;
  lastUpdate: string;
  status: 'valid' | 'invalid' | 'error';
  autoUpdate: boolean;
}

interface SitemapUrl {
  id: number;
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
  status: 'indexed' | 'pending' | 'error';
}

const SitemapManager: React.FC = () => {
  const navigate = useNavigate();
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [selectedSitemap, setSelectedSitemap] = useState<SitemapFile | null>(null);
  const [form] = Form.useForm();
  const [generateForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sitemapFiles, setSitemapFiles] = useState<SitemapFile[]>([]);
  const [_sitemapLoading, setSitemapLoading] = useState(false);
  
  // 自动更新配置弹窗
  const [autoUpdateModalVisible, setAutoUpdateModalVisible] = useState(false);
  const [autoUpdateForm] = Form.useForm();
  const [savingAutoUpdate, setSavingAutoUpdate] = useState(false);

  // 加载Sitemap列表
  useEffect(() => {
    loadSitemaps();
  }, []);

  const loadSitemaps = async () => {
    setSitemapLoading(true);
    try {
      const res = await seoApi.getSitemaps();
      if (res.code === 200) {
        setSitemapFiles(res.data);
      }
    } catch (_err) {
      message.error('加载Sitemap列表失败');
    } finally {
      setSitemapLoading(false);
    }
  };

  // 静态数据已移除，使用API获取真实数据

  // URL列表
  const urlList: SitemapUrl[] = [
    { id: 1, loc: 'https://example.com/wallpaper/4k-star-sky', lastmod: '2026-04-17', changefreq: 'weekly', priority: 0.8, status: 'indexed' },
    { id: 2, loc: 'https://example.com/wallpaper/anime-girl', lastmod: '2026-04-17', changefreq: 'weekly', priority: 0.8, status: 'indexed' },
    { id: 3, loc: 'https://example.com/category/nature', lastmod: '2026-04-16', changefreq: 'daily', priority: 0.9, status: 'indexed' },
    { id: 4, loc: 'https://example.com/tag/4k', lastmod: '2026-04-15', changefreq: 'daily', priority: 0.7, status: 'pending' },
    { id: 5, loc: 'https://example.com/about', lastmod: '2026-04-10', changefreq: 'monthly', priority: 0.5, status: 'indexed' },
  ];

  const columns = [
    { title: '文件名', dataIndex: 'name', key: 'name', width: 180 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => <Tag color={type === 'index' ? 'blue' : 'default'}>{type === 'index' ? '索引' : '地图'}</Tag> },
    { title: 'URL数量', dataIndex: 'urls', key: 'urls', width: 100 },
    { title: '文件大小', dataIndex: 'size', key: 'size', width: 100 },
    { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate', width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          valid: { color: 'success', icon: <CheckCircleOutlined />, text: '有效' },
          invalid: { color: 'warning', icon: <CloseCircleOutlined />, text: '无效' },
          error: { color: 'error', icon: <CloseCircleOutlined />, text: '错误' },
        };
        const { color, icon, text } = config[status];
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: '自动更新',
      dataIndex: 'autoUpdate',
      key: 'autoUpdate',
      width: 100,
      render: (auto: boolean, record: SitemapFile) => (
        <Switch 
          checked={auto} 
          size="small" 
          onChange={(checked) => handleToggleAutoUpdate(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: SitemapFile) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button>
        </Space>
      ),
    },
  ];

  const urlColumns = [
    { title: 'URL', dataIndex: 'loc', key: 'loc', ellipsis: true },
    { title: '最后修改', dataIndex: 'lastmod', key: 'lastmod', width: 120 },
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
          error: { color: 'error', text: '错误' },
        };
        return <Tag color={map[status].color}>{map[status].text}</Tag>;
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
        const res = await seoApi.generateSitemap({
          types: values.types || ['posts', 'categories'],
          changefreq: values.changefreq || 'weekly',
          priority: values.priority || 0.8,
          includeImages: values.includeImages || false,
          compress: values.compress || false,
        });
        if (res.code === 200) {
          message.success('Sitemap生成成功');
          setGenerateModalVisible(false);
          loadSitemaps(); // 刷新列表
        }
      } catch (_err) {
        message.error('Sitemap生成失败');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDownload = async (record: SitemapFile) => {
    try {
      const blob = await seoApi.downloadSitemap(record.id);
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

  const handleSubmitToSearchEngines = async () => {
    try {
      const sitemapIds = sitemapFiles.map(s => s.id);
      const res = await seoApi.submitToSearchEngines(sitemapIds);
      if (res.code === 200) {
        message.success(`成功提交 ${res.data.submitted} 个Sitemap到Google Search Console`);
      }
    } catch (_err) {
      message.error('提交失败');
    }
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>Sitemap管理</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        Sitemap管理
      </h2>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总URL数" value={1627} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="已索引" value={1580} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="待索引" value={45} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="索引率" value={97.2} suffix="%" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setGenerateModalVisible(true)}>
            重新生成
          </Button>
          <Button icon={<GlobalOutlined />} onClick={handleSubmitToSearchEngines}>
            提交到搜索引擎
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadAll}>下载全部</Button>
        </Space>
      </Card>

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
            <Table columns={columns} dataSource={sitemapFiles} rowKey="id" />
          </Card>
        </TabPane>

        <TabPane tab="URL列表" key="urls">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              <Input.Search placeholder="搜索URL" style={{ width: 300 }} />
              <Select placeholder="索引状态" style={{ width: 120 }} allowClear>
                <Select.Option value="indexed">已索引</Select.Option>
                <Select.Option value="pending">待索引</Select.Option>
                <Select.Option value="error">错误</Select.Option>
              </Select>
              <Button type="primary" onClick={() => message.success('批量提交成功')}>批量提交</Button>
            </Space>
            <Table
              columns={urlColumns}
              dataSource={urlList}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="提交历史" key="history">
          <Card>
            <Timeline
              items={[
                { color: 'green', children: <><strong>2026-04-17 10:00</strong><p>Successfully submitted to Google Search Console</p></> },
                { color: 'green', children: <><strong>2026-04-17 09:45</strong><p>Googlebot fetched sitemap.xml (200 OK)</p></> },
                { color: 'blue', children: <><strong>2026-04-17 09:30</strong><p>Auto-generated sitemap-posts.xml with 50 new URLs</p></> },
                { color: 'blue', children: <><strong>2026-04-16 08:00</strong><p>Auto-generated sitemap-categories.xml</p></> },
              ]}
            />
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
            <p><strong>URL:</strong> {selectedSitemap.url}</p>
            <p><strong>包含URL数:</strong> {selectedSitemap.urls}</p>
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
          <Form.Item name="autoUpdate" label="自动更新" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成弹窗 */}
      <Modal
        title="生成Sitemap"
        open={generateModalVisible}
        onOk={handleGenerate}
        onCancel={() => setGenerateModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={generateForm} layout="vertical">
          <Form.Item name="types" label="包含内容类型" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择要包含的内容类型">
              <Select.Option value="posts">文章</Select.Option>
              <Select.Option value="categories">分类</Select.Option>
              <Select.Option value="tags">标签</Select.Option>
              <Select.Option value="pages">页面</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="changefreq" label="默认更新频率" initialValue="daily">
            <Select>
              <Select.Option value="always">总是</Select.Option>
              <Select.Option value="hourly">每小时</Select.Option>
              <Select.Option value="daily">每天</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="默认优先级" initialValue={0.5}>
            <Select>
              <Select.Option value={1.0}>1.0 (最高)</Select.Option>
              <Select.Option value={0.8}>0.8</Select.Option>
              <Select.Option value={0.5}>0.5 (默认)</Select.Option>
              <Select.Option value={0.3}>0.3</Select.Option>
              <Select.Option value={0.1}>0.1 (最低)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
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
    </div>
  );
};

export default SitemapManager;

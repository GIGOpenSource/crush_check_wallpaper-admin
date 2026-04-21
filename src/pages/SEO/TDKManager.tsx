import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Table, Tag, Space, Modal, Alert, Tabs, message, Breadcrumb, Upload } from 'antd';
import { EditOutlined, EyeOutlined, CopyOutlined, ArrowLeftOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi } from '../../services/seoApi';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

interface TDKTemplate {
  id: number;
  pageType: string;
  titleTemplate: string;
  descriptionTemplate: string;
  keywordsTemplate: string;
  applyCount: number;
  lastUpdate: string;
}

interface PageTDK {
  id: number;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  pageType: string;
  charCount: { title: number; desc: number };
}

const TDKManager: React.FC = () => {
  const navigate = useNavigate();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [, setEditingRecord] = useState<PageTDK | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TDKTemplate | null>(null);
  // 文件输入引用（预留）
  const [templates, setTemplates] = useState<TDKTemplate[]>([
    {
      id: 1,
      pageType: '文章页',
      titleTemplate: '{标题前50字}-{分类词}-{品牌词}',
      descriptionTemplate: '前150字符+相关标签词',
      keywordsTemplate: '{分类词},{标签1},{标签2},{标签3}',
      applyCount: 856,
      lastUpdate: '2026-04-15',
    },
    {
      id: 2,
      pageType: '分类页',
      titleTemplate: '{分类名}-{相关词}-{品牌词}',
      descriptionTemplate: '分类描述+热门标签',
      keywordsTemplate: '{分类词},壁纸,高清壁纸',
      applyCount: 24,
      lastUpdate: '2026-04-14',
    },
    {
      id: 3,
      pageType: '标签页',
      titleTemplate: '{标签词}:最新{标签词}壁纸下载-{品牌词}',
      descriptionTemplate: '精选{标签词}壁纸，高清4K分辨率，免费下载',
      keywordsTemplate: '{标签词},壁纸,4K壁纸',
      applyCount: 156,
      lastUpdate: '2026-04-13',
    },
    {
      id: 4,
      pageType: '首页',
      titleTemplate: '{品牌词}-高清4K壁纸免费下载平台',
      descriptionTemplate: '提供海量高清4K壁纸、手机壁纸、动态壁纸，免费下载使用',
      keywordsTemplate: '壁纸,4K壁纸,高清壁纸,手机壁纸',
      applyCount: 1,
      lastUpdate: '2026-04-10',
    },
  ]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  
  // 预览弹窗状态
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<PageTDK | null>(null);
  const [previewData, setPreviewData] = useState({
    googleTitle: '',
    googleDesc: '',
    googleUrl: '',
    bingTitle: '',
    bingDesc: '',
    bingUrl: '',
  });

  // 批量选择状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchEditModalVisible, setBatchEditModalVisible] = useState(false);
  const [batchEditForm] = Form.useForm();
  const [batchEditing, setBatchEditing] = useState(false);



  // 页面TDK数据
  const pageTDKs: PageTDK[] = [
    {
      id: 1,
      url: '/wallpaper/4k-star-sky',
      title: '4K星空壁纸-夜景壁纸-壁纸大全',
      description: '精选4K超高清星空壁纸，3840x2160分辨率，完美适配电脑桌面，免费下载使用',
      keywords: ['4K壁纸', '星空壁纸', '夜景壁纸', '高清壁纸'],
      pageType: '文章页',
      charCount: { title: 24, desc: 52 },
    },
    {
      id: 2,
      url: '/category/anime',
      title: '动漫壁纸-二次元高清壁纸-壁纸大全',
      description: '海量动漫壁纸，二次元风格，高清分辨率，适配手机和电脑',
      keywords: ['动漫壁纸', '二次元', '高清壁纸'],
      pageType: '分类页',
      charCount: { title: 23, desc: 38 },
    },
    {
      id: 3,
      url: '/tag/nature',
      title: '自然风景:最新自然风景壁纸下载-壁纸大全',
      description: '精选自然风景壁纸，山川湖海，高清4K分辨率，免费下载',
      keywords: ['自然风景', '壁纸', '4K壁纸'],
      pageType: '标签页',
      charCount: { title: 30, desc: 37 },
    },
  ];

  const handleEditTemplate = (record: TDKTemplate) => {
    setEditingTemplate(record);
    templateForm.setFieldsValue({
      pageType: record.pageType,
      titleTemplate: record.titleTemplate,
      descriptionTemplate: record.descriptionTemplate,
      keywordsTemplate: record.keywordsTemplate,
    });
    setTemplateModalVisible(true);
  };

  const handleSaveTemplate = () => {
    templateForm.validateFields().then((values) => {
      if (editingTemplate) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingTemplate.id
              ? { ...t, ...values, lastUpdate: new Date().toISOString().split('T')[0] }
              : t
          )
        );
        message.success('模板保存成功');
        setTemplateModalVisible(false);
        setEditingTemplate(null);
      }
    });
  };

  const handleCopyTemplate = (record: TDKTemplate) => {
    const newTemplate: TDKTemplate = {
      ...record,
      id: Date.now(),
      pageType: `${record.pageType} (复制)`,
      applyCount: 0,
      lastUpdate: new Date().toISOString().split('T')[0],
    };
    setTemplates((prev) => [...prev, newTemplate]);
    message.success('模板复制成功');
  };

  const templateColumns = [
    { title: '页面类型', dataIndex: 'pageType', key: 'pageType', width: 120 },
    { title: 'Title模板', dataIndex: 'titleTemplate', key: 'titleTemplate', ellipsis: true },
    { title: 'Description模板', dataIndex: 'descriptionTemplate', key: 'descriptionTemplate', ellipsis: true },
    { title: 'Keywords模板', dataIndex: 'keywordsTemplate', key: 'keywordsTemplate', ellipsis: true },
    { title: '应用页面数', dataIndex: 'applyCount', key: 'applyCount', width: 100 },
    { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: TDKTemplate) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditTemplate(record)}>
            编辑
          </Button>
          <Button type="link" icon={<CopyOutlined />} onClick={() => handleCopyTemplate(record)}>
            复制
          </Button>
        </Space>
      ),
    },
  ];

  const pageColumns = [
    { title: '页面URL', dataIndex: 'url', key: 'url', width: 200 },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: PageTDK) => (
        <div>
          <div>{text}</div>
          <Tag color={record.charCount.title > 60 ? 'error' : record.charCount.title > 55 ? 'warning' : 'success'}>
            {record.charCount.title} 字符
          </Tag>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text: string, record: PageTDK) => (
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>{text}</div>
          <Tag color={record.charCount.desc > 160 ? 'error' : record.charCount.desc > 150 ? 'warning' : 'success'}>
            {record.charCount.desc} 字符
          </Tag>
        </div>
      ),
    },
    {
      title: 'Keywords',
      dataIndex: 'keywords',
      key: 'keywords',
      render: (keywords: string[]) => (
        <Space wrap>
          {keywords.map((k, i) => <Tag key={i}>{k}</Tag>)}
        </Space>
      ),
    },
    { title: '页面类型', dataIndex: 'pageType', key: 'pageType', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: PageTDK) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: PageTDK) => {
    setEditingRecord(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      keywords: record.keywords.join(', '),
    });
    setEditModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      message.success('保存成功');
      setEditModalVisible(false);
    });
  };

  // 打开批量编辑弹窗
  const handleOpenBatchEdit = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要编辑的页面');
      return;
    }
    batchEditForm.resetFields();
    setBatchEditModalVisible(true);
  };

  // 批量编辑保存
  const handleBatchEditSave = async () => {
    try {
      await batchEditForm.validateFields();
      setBatchEditing(true);
      
      // 模拟批量编辑API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      message.success(`成功批量更新 ${selectedRowKeys.length} 个页面的TDK`);
      setBatchEditModalVisible(false);
      setSelectedRowKeys([]);
      batchEditForm.resetFields();
    } catch (_err) {
      message.error('批量编辑失败');
    } finally {
      setBatchEditing(false);
    }
  };

  // 批量应用模板
  const handleBatchApply = () => {
    batchForm.validateFields().then((values) => {
      const affectedCount = values.pageType === 'all' ? 1200 : 300;
      
      // 找到选中的模板
      const selectedTemplate = templates.find(t => t.pageType === values.pageType) || templates[0];
      
      // 模拟批量应用过程
      message.loading(`正在应用模板到 ${affectedCount} 个页面...`, 2);
      
      setTimeout(() => {
        message.success(`批量应用成功！共影响 ${affectedCount} 个页面，模板：${selectedTemplate.pageType}`);
        setBatchModalVisible(false);
        batchForm.resetFields();
      }, 2000);
    });
  };

  // 导出TDK报告
  const handleExportTDK = async () => {
    try {
      const blob = await seoApi.exportTDKReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tdk-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('TDK报告导出成功');
    } catch (_err) {
      message.error('导出失败');
    }
  };

  // 导入TDK数据
  const handleImportTDK = async (file: File) => {
    try {
      const res = await seoApi.importTDKData(file);
      if (res.code === 200) {
        message.success(`成功导入 ${res.data.imported} 条TDK数据`);
      }
    } catch (_err) {
      message.error('导入失败');
    }
    return false; // 阻止默认上传行为
  };

  // 预览功能
  const handlePreview = (record: PageTDK) => {
    setPreviewRecord(record);
    
    // 模拟不同搜索引擎的展示效果
    setPreviewData({
      googleTitle: record.title.length > 60 ? record.title.substring(0, 57) + '...' : record.title,
      googleDesc: record.description.length > 160 ? record.description.substring(0, 157) + '...' : record.description,
      googleUrl: `https://example.com${record.url}`,
      bingTitle: record.title.length > 65 ? record.title.substring(0, 62) + '...' : record.title,
      bingDesc: record.description.length > 170 ? record.description.substring(0, 167) + '...' : record.description,
      bingUrl: `https://example.com${record.url}`,
    });
    
    setPreviewModalVisible(true);
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>TDK管理</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        TDK批量管理
      </h2>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" onClick={() => setBatchModalVisible(true)}>
            批量应用模板
          </Button>
          <Button onClick={() => message.success('检测完成，未发现重复标题')}>检测重复标题</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportTDK}>导出TDK报告</Button>
          <Upload
            accept=".csv,.xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleImportTDK}
          >
            <Button icon={<UploadOutlined />}>导入TDK数据</Button>
          </Upload>
        </Space>
      </Card>

      <Tabs defaultActiveKey="templates">
        <TabPane tab="TDK模板" key="templates">
          <Card>
            <Alert
              message="模板变量说明"
              description="{标题前50字} - 自动提取文章前50字符 | {分类词} - 文章所属分类 | {标签1/2/3} - 文章标签 | {品牌词} - 站点品牌名称"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={templateColumns}
              dataSource={templates}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="页面TDK" key="pages">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              <Select placeholder="页面类型" style={{ width: 120 }} allowClear>
                <Option value="article">文章页</Option>
                <Option value="category">分类页</Option>
                <Option value="tag">标签页</Option>
              </Select>
              <Select placeholder="字符长度" style={{ width: 120 }} allowClear>
                <Option value="title_long">Title超长</Option>
                <Option value="desc_long">Desc超长</Option>
                <Option value="title_short">Title过短</Option>
              </Select>
              <Input.Search placeholder="搜索URL/标题" style={{ width: 250 }} />
            </Space>
            {selectedRowKeys.length > 0 && (
              <Alert
                message={`已选择 ${selectedRowKeys.length} 个页面`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Space>
                    <Button type="primary" onClick={handleOpenBatchEdit}>
                      批量编辑
                    </Button>
                    <Button onClick={() => setSelectedRowKeys([])}>
                      清空选择
                    </Button>
                  </Space>
                }
              />
            )}
            <Table
              columns={pageColumns}
              dataSource={pageTDKs}
              rowKey="id"
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="重复检测" key="duplicate">
          <Card title="重复标题检测">
            <Alert
              message="发现 3 组重复标题"
              description="建议修改重复标题，确保每个页面标题唯一"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={[
                { title: '重复标题', dataIndex: 'title' },
                { title: '涉及页面', dataIndex: 'pages', render: (p: string[]) => p.join(', ') },
                { title: '重复次数', dataIndex: 'count' },
                { title: '操作', render: () => <Button type="link" onClick={() => message.info('批量修改功能开发中')}>批量修改</Button> },
              ]}
              dataSource={[
                { title: '高清壁纸下载-壁纸大全', pages: ['/wallpaper/1', '/wallpaper/2', '/wallpaper/3'], count: 3 },
                { title: '4K壁纸-高清壁纸-壁纸大全', pages: ['/wallpaper/4', '/wallpaper/5'], count: 2 },
              ]}
              rowKey="title"
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 编辑TDK弹窗 */}
      <Modal
        title="编辑TDK"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true }]}
          >
            <Input maxLength={70} showCount placeholder="建议55-65字符" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <TextArea
              rows={3}
              maxLength={170}
              showCount
              placeholder="建议150-160字符"
            />
          </Form.Item>
          <Form.Item
            name="keywords"
            label="Keywords"
          >
            <Input placeholder="多个关键词用逗号分隔" />
          </Form.Item>
          <Alert
            message="SEO优化提示"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Title应包含核心关键词，长度控制在60字符以内</li>
                <li>Description应准确概括内容，吸引用户点击</li>
                <li>Keywords建议3-5个，避免堆砌</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* 批量应用弹窗 */}
      <Modal
        title="批量应用TDK模板"
        open={batchModalVisible}
        onOk={handleBatchApply}
        onCancel={() => setBatchModalVisible(false)}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="pageType"
            label="应用范围"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择页面类型">
              <Option value="all">全部页面</Option>
              <Option value="article">仅文章页</Option>
              <Option value="category">仅分类页</Option>
              <Option value="tag">仅标签页</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="template"
            label="选择模板"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择TDK模板">
              {templates.map((t) => (
                <Option key={t.id} value={t.id}>{t.pageType}模板</Option>
              ))}
            </Select>
          </Form.Item>
          <Alert
            message="注意"
            description="批量应用将覆盖现有TDK，请谨慎操作！建议先备份数据。"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      {/* 编辑模板弹窗 */}
      <Modal
        title={editingTemplate ? `编辑模板 - ${editingTemplate.pageType}` : '编辑模板'}
        open={templateModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setTemplateModalVisible(false);
          setEditingTemplate(null);
        }}
        width={700}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            name="pageType"
            label="页面类型"
            rules={[{ required: true }]}
          >
            <Input placeholder="如：文章页、分类页、标签页" />
          </Form.Item>
          <Form.Item
            name="titleTemplate"
            label="Title模板"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="支持变量：{标题前50字}、{分类词}、{品牌词}、{标签1}等"
            />
          </Form.Item>
          <Form.Item
            name="descriptionTemplate"
            label="Description模板"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="支持变量：{分类词}、{标签词}等"
            />
          </Form.Item>
          <Form.Item
            name="keywordsTemplate"
            label="Keywords模板"
          >
            <Input placeholder="多个关键词用逗号分隔，支持变量" />
          </Form.Item>
          <Alert
            message="模板变量说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li><strong>{'{标题前50字}'}</strong> - 自动提取文章前50字符</li>
                <li><strong>{'{分类词}'}</strong> - 文章所属分类名称</li>
                <li><strong>{'{品牌词}'}</strong> - 站点品牌名称</li>
                <li><strong>{'{标签1/2/3}'}</strong> - 文章标签（按顺序）</li>
                <li><strong>{'{标签词}'}</strong> - 当前标签页的标签名称</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="TDK预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {previewRecord && (
          <div>
            <Alert
              message="搜索引擎展示效果预览"
              description="以下是在Google和Bing搜索结果中的展示效果预览"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            {/* Google 预览 */}
            <Card title="Google 搜索结果" style={{ marginBottom: 24 }}>
              <div style={{ 
                fontFamily: 'arial,sans-serif',
                maxWidth: 600,
                padding: 16,
                backgroundColor: '#fff',
                borderRadius: 8,
              }}>
                <div style={{ 
                  color: '#1a0dab',
                  fontSize: 20,
                  lineHeight: 1.3,
                  marginBottom: 8,
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}>
                  {previewData.googleTitle}
                </div>
                <div style={{ 
                  color: '#006621',
                  fontSize: 14,
                  lineHeight: 1.3,
                  marginBottom: 8,
                }}>
                  {previewData.googleUrl}
                </div>
                <div style={{ 
                  color: '#545454',
                  fontSize: 14,
                  lineHeight: 1.58,
                }}>
                  {previewData.googleDesc}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Tag color="blue">Title: {previewRecord.title.length} 字符 (建议 ≤60)</Tag>
                <Tag color="green">Description: {previewRecord.description.length} 字符 (建议 ≤160)</Tag>
              </div>
            </Card>

            {/* Bing 预览 */}
            <Card title="Bing 搜索结果">
              <div style={{ 
                fontFamily: 'Segoe UI,Helvetica,Arial,sans-serif',
                maxWidth: 600,
                padding: 16,
                backgroundColor: '#fff',
                borderRadius: 8,
              }}>
                <div style={{ 
                  color: '#001ba0',
                  fontSize: 18,
                  lineHeight: 1.33,
                  marginBottom: 6,
                  cursor: 'pointer',
                }}>
                  {previewData.bingTitle}
                </div>
                <div style={{ 
                  color: '#006d21',
                  fontSize: 13,
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}>
                  {previewData.bingUrl}
                </div>
                <div style={{ 
                  color: '#666',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  {previewData.bingDesc}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Tag color="blue">Title: {previewRecord.title.length} 字符 (建议 ≤65)</Tag>
                <Tag color="green">Description: {previewRecord.description.length} 字符 (建议 ≤170)</Tag>
              </div>
            </Card>

            {/* Keywords 展示 */}
            <Card title="Keywords" style={{ marginTop: 24 }}>
              <Space wrap>
                {previewRecord.keywords.map((k, i) => (
                  <Tag key={i} color="purple">{k}</Tag>
                ))}
              </Space>
              <div style={{ marginTop: 8, color: '#666' }}>
                共 {previewRecord.keywords.length} 个关键词
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* 批量编辑弹窗 */}
      <Modal
        title={`批量编辑TDK (${selectedRowKeys.length} 个页面)`}
        open={batchEditModalVisible}
        onOk={handleBatchEditSave}
        onCancel={() => {
          setBatchEditModalVisible(false);
          batchEditForm.resetFields();
        }}
        confirmLoading={batchEditing}
        width={600}
      >
        <Alert
          message="批量编辑说明"
          description="以下字段将应用到所有选中的页面。留空表示不修改该字段。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={batchEditForm} layout="vertical">
          <Form.Item
            name="title"
            label="Title (标题)"
          >
            <Input.TextArea
              rows={2}
              placeholder="留空表示不修改"
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description (描述)"
          >
            <Input.TextArea
              rows={3}
              placeholder="留空表示不修改"
            />
          </Form.Item>
          <Form.Item
            name="keywords"
            label="Keywords (关键词)"
          >
            <Input placeholder="多个关键词用逗号分隔，留空表示不修改" />
          </Form.Item>
          <Form.Item
            name="appendKeywords"
            label="追加关键词"
          >
            <Input placeholder="在原有关键词后追加，留空表示不追加" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TDKManager;

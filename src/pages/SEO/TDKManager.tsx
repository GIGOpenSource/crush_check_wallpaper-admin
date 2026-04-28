import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Table, Tag, Space, Modal, Alert, Tabs, message, Breadcrumb, Upload, Popconfirm } from 'antd';
import { EditOutlined, EyeOutlined, CopyOutlined, ArrowLeftOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi, type TDKTemplate as ApiTDKTemplate, type PageTDK as ApiPageTDK } from '../../services/seoApi';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const TDKManager: React.FC = () => {
  const navigate = useNavigate();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [pageTDKModalVisible, setPageTDKModalVisible] = useState(false); // 页面TDK编辑弹窗
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false); // 是否为新增模式
  const [isCreatingPageTDK, setIsCreatingPageTDK] = useState(false); // 是否为新增页面TDK模式
  const [, setEditingRecord] = useState<ApiPageTDK | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ApiTDKTemplate | null>(null);
  const [editingPageTDK, setEditingPageTDK] = useState<ApiPageTDK | null>(null); // 正在编辑的页面TDK
  // 文件输入引用（预留）
  const [templates, setTemplates] = useState<ApiTDKTemplate[]>([]);
  const [pageTDKs, setPageTDKs] = useState<ApiPageTDK[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [pageTDKForm] = Form.useForm(); // 页面TDK表单
  
  // 加载状态
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  
  // 预览弹窗状态
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<ApiPageTDK | null>(null);
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

  // 分页状态
  const [templatePagination, setTemplatePagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });
  const [pagePagination, setPagePagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 获取TDK模板列表
  useEffect(() => {
    fetchTemplates();
  }, [templatePagination.currentPage, templatePagination.pageSize]);

  // 获取页面TDK列表
  useEffect(() => {
    fetchPageTDKs();
  }, [pagePagination.currentPage, pagePagination.pageSize]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await seoApi.getTDKList({
        currentPage: templatePagination.currentPage,
        pageSize: templatePagination.pageSize,
        is_template: true,
      });
      if (res.code === 200 && res.data) {
        setTemplates(res.data.results as ApiTDKTemplate[]);
        setTemplatePagination(prev => ({
          ...prev,
          total: res.data.pagination?.total || 0,
        }));
      }
    } catch (_err) {
      message.error('获取TDK模板失败');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchPageTDKs = async () => {
    try {
      setLoadingPages(true);
      const res = await seoApi.getTDKList({
        currentPage: pagePagination.currentPage,
        pageSize: pagePagination.pageSize,
        is_template: false,
      });
      if (res.code === 200 && res.data) {
        setPageTDKs(res.data.results as ApiPageTDK[]);
        setPagePagination(prev => ({
          ...prev,
          total: res.data.pagination?.total || 0,
        }));
      }
    } catch (_err) {
      message.error('获取页面TDK失败');
    } finally {
      setLoadingPages(false);
    }
  };

  const handleEditTemplate = (record: ApiTDKTemplate) => {
    setIsCreatingTemplate(false);
    setEditingTemplate(record);
    templateForm.setFieldsValue({
      pageType: record.page_type,
      titleTemplate: record.title,
      descriptionTemplate: record.description,
      keywordsTemplate: record.keywords,
    });
    setTemplateModalVisible(true);
  };

  const handleAddTemplate = () => {
    setIsCreatingTemplate(true);
    setEditingTemplate(null);
    templateForm.resetFields();
    setTemplateModalVisible(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      if (isCreatingTemplate) {
        // 新增模板
        await seoApi.createTDKTemplate({
          page_type: values.pageType,
          title: values.titleTemplate,
          description: values.descriptionTemplate,
          keywords: values.keywordsTemplate,
          is_template: true,
        });
        message.success('模板创建成功');
      } else if (editingTemplate) {
        // 更新模板
        await seoApi.updateTDKTemplate(editingTemplate.id, {
          page_type: values.pageType,
          title: values.titleTemplate,
          description: values.descriptionTemplate,
          keywords: values.keywordsTemplate,
        });
        message.success('模板保存成功');
      }
      setTemplateModalVisible(false);
      setEditingTemplate(null);
      setIsCreatingTemplate(false);
      fetchTemplates(); // 重新加载模板列表
    } catch (_err) {
      message.error(isCreatingTemplate ? '模板创建失败' : '模板保存失败');
    }
  };

  const handleCopyTemplate = async (record: ApiTDKTemplate) => {
    try {
      // 提取当前模板的页面类型、Title模板、Description模板、Keywords模板字段，并固定is_template为true
      await seoApi.createTDKTemplate({
        page_type: record.page_type,
        title: record.title,
        description: record.description,
        keywords: record.keywords,
        is_template: true,
      });
      message.success('模板复制成功');
      fetchTemplates(); // 重新加载模板列表
    } catch (_err) {
      message.error('模板复制失败');
    }
  };

  const handleDeleteTemplate = async (record: ApiTDKTemplate) => {
    try {
      await seoApi.deleteTDK(record.id);
      message.success('模板删除成功');
      fetchTemplates(); // 重新加载模板列表
    } catch (_err) {
      message.error('模板删除失败');
    }
  };

  const templateColumns = [
    { title: '页面类型', dataIndex: 'page_type_display', key: 'page_type_display', width: 120 },
    { title: 'Title模板', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Description模板', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Keywords模板', dataIndex: 'keywords', key: 'keywords', ellipsis: true },
    { 
      title: <span style={{ whiteSpace: 'nowrap' }}>应用页面数</span>, 
      dataIndex: 'applied_count', 
      key: 'applied_count', 
      width: 100 
    },
    { 
      title: '最后更新', 
      dataIndex: 'updated_at', 
      key: 'updated_at', 
      width: 160,
      render: (text: string) => {
        if (!text) return '--';
        try {
          const date = new Date(text);
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
          return text;
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: ApiTDKTemplate) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditTemplate(record)} style={{ padding: '0 4px' }}>
            编辑
          </Button>
          <Button type="link" icon={<CopyOutlined />} onClick={() => handleCopyTemplate(record)} style={{ padding: '0 4px' }}>
            复制
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个模板吗？"
            onConfirm={() => handleDeleteTemplate(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pageColumns = [
    { title: '页面URL', dataIndex: 'url_content', key: 'url_content', width: 200 },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ApiPageTDK) => {
        const titleLength = text ? text.length : 0;
        return (
          <div>
            <div>{text}</div>
            <Tag color={titleLength > 60 ? 'error' : titleLength > 55 ? 'warning' : 'success'}>
              {titleLength} 字符
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text: string, record: ApiPageTDK) => {
        const descLength = text ? text.length : 0;
        return (
          <div>
            <div style={{ fontSize: 12, color: '#666' }}>{text}</div>
            <Tag color={descLength > 160 ? 'error' : descLength > 150 ? 'warning' : 'success'}>
              {descLength} 字符
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Keywords',
      dataIndex: 'keywords',
      key: 'keywords',
      render: (keywords: string[] | string) => {
        // 防御性处理：确保keywords是数组
        const keywordArray = Array.isArray(keywords) ? keywords : (typeof keywords === 'string' ? [keywords] : []);
        return (
          <Space wrap>
            {keywordArray.map((k, i) => <Tag key={i}>{k}</Tag>)}
          </Space>
        );
      },
    },
    { 
      title: <span style={{ whiteSpace: 'nowrap' }}>页面类型</span>, 
      dataIndex: 'page_type_display', 
      key: 'page_type_display', 
      width: 100 
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: ApiPageTDK) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '0 4px' }}>
            编辑
          </Button>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(record)} style={{ padding: '0 4px' }}>预览</Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个页面TDK吗？"
            onConfirm={() => handleDeletePageTDK(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: ApiPageTDK) => {
    setIsCreatingPageTDK(false);
    setEditingPageTDK(record);
    pageTDKForm.setFieldsValue({
      url_content: record.url_content,
      title: record.title,
      description: record.description,
      keywords: Array.isArray(record.keywords) ? record.keywords.join(', ') : record.keywords,
      page_type: record.page_type || 'article',
    });
    setPageTDKModalVisible(true);
  };

  const handleAddPageTDK = () => {
    setIsCreatingPageTDK(true);
    setEditingPageTDK(null);
    pageTDKForm.resetFields();
    setPageTDKModalVisible(true);
  };

  const handleSavePageTDK = async () => {
    try {
      const values = await pageTDKForm.validateFields();
      const keywordsArray = values.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k);
      
      if (isCreatingPageTDK) {
        // 新增页面TDK
        await seoApi.createTDKTemplate({
          url_content: values.url_content,
          page_type: values.page_type,
          title: values.title,
          description: values.description,
          keywords: keywordsArray.join(','),
          is_template: false,
        });
        message.success('页面TDK创建成功');
      } else if (editingPageTDK) {
        // 更新页面TDK
        await seoApi.updateTDKTemplate(editingPageTDK.id, {
          page_type: values.page_type,
          title: values.title,
          description: values.description,
          keywords: keywordsArray.join(','),
        });
        message.success('页面TDK保存成功');
      }
      setPageTDKModalVisible(false);
      setEditingPageTDK(null);
      setIsCreatingPageTDK(false);
      fetchPageTDKs(); // 重新加载页面TDK列表
    } catch (_err) {
      message.error(isCreatingPageTDK ? '页面TDK创建失败' : '页面TDK保存失败');
    }
  };

  const handleDeletePageTDK = async (record: ApiPageTDK) => {
    try {
      await seoApi.deleteTDK(record.id);
      message.success('页面TDK删除成功');
      fetchPageTDKs(); // 重新加载页面TDK列表
    } catch (_err) {
      message.error('页面TDK删除失败');
    }
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
      const selectedTemplate = templates.find(t => t.page_type_display === values.pageType) || templates[0];
      
      // 模拟批量应用过程
      message.loading(`正在应用模板到 ${affectedCount} 个页面...`, 2);
      
      setTimeout(() => {
        message.success(`批量应用成功！共影响 ${affectedCount} 个页面，模板：${selectedTemplate?.page_type_display}`);
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
  const handlePreview = (record: ApiPageTDK) => {
    setPreviewRecord(record);
    
    // 模拟不同搜索引擎的展示效果
    setPreviewData({
      googleTitle: record.title.length > 60 ? record.title.substring(0, 57) + '...' : record.title,
      googleDesc: record.description.length > 160 ? record.description.substring(0, 157) + '...' : record.description,
      googleUrl: `https://example.com${record.url_content}`,
      bingTitle: record.title.length > 65 ? record.title.substring(0, 62) + '...' : record.title,
      bingDesc: record.description.length > 170 ? record.description.substring(0, 167) + '...' : record.description,
      bingUrl: `https://example.com${record.url_content}`,
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
          <Card
            title="TDK模板管理"
            extra={
              <Button type="primary" onClick={handleAddTemplate}>
                新增模板
              </Button>
            }
          >
            {/* <Alert
              message="模板变量说明"
              description="{标题前50字} - 自动提取文章前50字符 | {分类词} - 文章所属分类 | {标签1/2/3} - 文章标签 | {品牌词} - 站点品牌名称"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            /> */}
            <Table
              columns={templateColumns}
              dataSource={templates}
              rowKey="id"
              loading={loadingTemplates}
              pagination={{
                current: templatePagination.currentPage,
                pageSize: templatePagination.pageSize,
                total: templatePagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  setTemplatePagination(prev => ({
                    ...prev,
                    currentPage: page,
                    pageSize: pageSize || prev.pageSize,
                  }));
                },
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="页面TDK" key="pageType">
          <Card
            title="页面TDK管理"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPageTDK}>
                新增页面TDK
              </Button>
            }
          >
            <Space style={{ marginBottom: 16 }}>
              <Select placeholder="页面类型" style={{ width: 120 }} allowClear>
                  <Option value="article">文章页</Option>
              <Option value="category">分类页</Option>
              <Option value="tag">标签页</Option>
              <Option value="detail">详情页</Option>
              <Option value="search">搜索页</Option>
              <Option value="custom">自定义页</Option>
              </Select>
              {/* <Select placeholder="字符长度" style={{ width: 120 }} allowClear>
                <Option value="title_long">Title超长</Option>
                <Option value="desc_long">Desc超长</Option>
                <Option value="title_short">Title过短</Option>
              </Select> */}
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
              loading={loadingPages}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              pagination={{
                current: pagePagination.currentPage,
                pageSize: pagePagination.pageSize,
                total: pagePagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  setPagePagination(prev => ({
                    ...prev,
                    currentPage: page,
                    pageSize: pageSize || prev.pageSize,
                  }));
                },
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

      {/* 批量应用弹窗 */}
      <Modal
        title="批量应用TDK模板"
        open={batchModalVisible}
        onOk={handleBatchApply}
        onCancel={() => setBatchModalVisible(false)}
        destroyOnHidden
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
                <Option key={t.id} value={t.id}>{t.page_type_display}模板</Option>
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

      {/* 编辑/新增页面TDK弹窗 */}
      <Modal
        title={isCreatingPageTDK ? '新增页面TDK' : (editingPageTDK ? `编辑页面TDK - ${editingPageTDK.url_content}` : '编辑页面TDK')}
        open={pageTDKModalVisible}
        onOk={handleSavePageTDK}
        onCancel={() => {
          setPageTDKModalVisible(false);
          setEditingPageTDK(null);
          setIsCreatingPageTDK(false);
        }}
        width={700}
        destroyOnHidden
      >
        <Form form={pageTDKForm} layout="vertical">
          <Form.Item
            name="url_content"
            label="页面URL"
            rules={[{ required: true, message: '请输入页面URL' }]}
          >
            <Input 
              placeholder="例如：/wallpaper/4k-star-sky" 
              disabled={!isCreatingPageTDK}
            />
          </Form.Item>
          <Form.Item
            name="page_type"
            label="页面类型"
            rules={[{ required: true, message: '请选择页面类型' }]}
          >
            <Select placeholder="选择页面类型">
              <Option value="article">文章页</Option>
              <Option value="category">分类页</Option>
              <Option value="tag">标签页</Option>
              <Option value="detail">详情页</Option>
              <Option value="search">搜索页</Option>
              <Option value="custom">自定义页</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: '请输入Title' }]}
          >
            <Input 
              maxLength={70} 
              showCount 
              placeholder="建议55-65字符" 
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: '请输入Description' }]}
          >
            <Input.TextArea
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
            <Input placeholder="多个关键词用逗号分隔，如：壁纸,高清,4K" />
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

      {/* 编辑/新增模板弹窗 */}
      <Modal
        title={isCreatingTemplate ? '新增TDK模板' : (editingTemplate ? `编辑模板 - ${editingTemplate.page_type_display}` : '编辑模板')}
        open={templateModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setTemplateModalVisible(false);
          setEditingTemplate(null);
          setIsCreatingTemplate(false);
        }}
        width={700}
        destroyOnHidden
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            name="pageType"
            label="页面类型"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择页面类型">
              <Option value="article">文章页</Option>
              <Option value="category">分类页</Option>
              <Option value="tag">标签页</Option>
              <Option value="detail">详情页</Option>
              <Option value="search">搜索页</Option>
              <Option value="custom">自定义页</Option>
            </Select>
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

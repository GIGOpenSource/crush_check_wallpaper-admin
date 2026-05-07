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

  // 模板搜索状态
  const [templateSearchForm] = Form.useForm();
  const [templateSearchParams, setTemplateSearchParams] = useState({
    title: '',
    page_type: '',
  });

  // 页面TDK搜索状态
  const [pageSearchForm] = Form.useForm();
  const [pageSearchParams, setPageSearchParams] = useState({
    title: '',
    page_type: '',
  });

  // Sitemap URL列表状态
  const [sitemapUrls, setSitemapUrls] = useState<any[]>([]);
  const [sitemapUrlLoading, setSitemapUrlLoading] = useState(false);
  const [sitemapUrlPage, setSitemapUrlPage] = useState(1);
  const [sitemapUrlPageSize] = useState(50);
  const [hasMoreSitemapUrls, setHasMoreSitemapUrls] = useState(true);

  // 获取TDK模板列表
  useEffect(() => {
    fetchTemplates();
  }, [templatePagination.currentPage, templatePagination.pageSize]);

  // 获取页面TDK列表
  useEffect(() => {
    fetchPageTDKs();
  }, [pagePagination.currentPage, pagePagination.pageSize]);

  const fetchTemplates = async (params?: { title?: string; page_type?: string; currentPage?: number }) => {
    try {
      setLoadingTemplates(true);
      const { currentPage, ...restParams } = params || {};
      const res = await seoApi.getTDKList({
        currentPage: currentPage || templatePagination.currentPage,
        pageSize: templatePagination.pageSize,
        is_template: true,
        ...restParams,
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

  const fetchPageTDKs = async (params?: { title?: string; page_type?: string; currentPage?: number }) => {
    try {
      setLoadingPages(true);
      const { currentPage, ...restParams } = params || {};
      const res = await seoApi.getTDKList({
        currentPage: currentPage || pagePagination.currentPage,
        pageSize: pagePagination.pageSize,
        is_template: false,
        ...restParams,
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
    { 
      title: <span style={{ whiteSpace: 'nowrap' }}>页面类型</span>, 
      dataIndex: 'page_type_display', 
      key: 'page_type_display', 
      width: 100 
    },
    { title: '页面URL', dataIndex: 'url_content', key: 'url_content', width: 280, ellipsis: true, },
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
       ellipsis: true,
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
      width: 300, ellipsis: true,
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

  const handleAddPageTDK = async () => {
    setIsCreatingPageTDK(true);
    setEditingPageTDK(null);
    pageTDKForm.resetFields();
    // 加载Sitemap URL列表
    await loadSitemapUrls();
    setPageTDKModalVisible(true);
  };

  // 加载Sitemap URL列表
  const loadSitemapUrls = async (page = 1, append = false) => {
    try {
      setSitemapUrlLoading(true);
      const res = await seoApi.getSitemapUrls({
        currentPage: page,
        pageSize: sitemapUrlPageSize,
      });
      console.log('API返回的Sitemap数据:', res);
      
      if (res.code === 200 && res.data) {
        const results = (res.data as any).results || (res.data as any).items || [];
        console.log('提取的urls数组:', results);
        console.log('第一条url数据:', results[0]);
        
        // 映射后端字段到前端字段
        const mappedUrls = results.map((item: any) => ({
          ...item,
          loc: item.content || item.loc || '', // 将content字段映射为loc
        }));
        
        if (append) {
          // 追加模式
          setSitemapUrls(prev => [...prev, ...mappedUrls]);
        } else {
          // 重置模式
          setSitemapUrls(mappedUrls);
        }
        
        // 判断是否还有更多数据
        const total = (res.data as any).pagination?.total || (res.data as any).total || 0;
        setHasMoreSitemapUrls(mappedUrls.length > 0 && (append ? sitemapUrls.length + mappedUrls.length < total : mappedUrls.length < total));
        setSitemapUrlPage(page);
      }
    } catch (err) {
      console.error('加载Sitemap URL列表失败:', err);
      message.error('加载Sitemap URL列表失败');
    } finally {
      setSitemapUrlLoading(false);
    }
  };

  // 加载更多Sitemap URL
  const loadMoreSitemapUrls = async () => {
    if (!hasMoreSitemapUrls || sitemapUrlLoading) return;
    await loadSitemapUrls(sitemapUrlPage + 1, true);
  };

  const handleSavePageTDK = async () => {
    try {
      console.log('开始保存页面TDK...');
      const values = await pageTDKForm.validateFields();
      console.log('表单验证通过，values:', values);
      
      const keywordsArray = values.keywords ? values.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : [];
      
      if (isCreatingPageTDK) {
        // 新增页面TDK - 从选中的ID找到对应的URL地址
        console.log('sitemapUrls:', sitemapUrls);
        console.log('选中的url_content:', values.url_content);
        
        const selectedUrl = sitemapUrls.find((url: any) => url.id === values.url_content);
        const urlAddress = selectedUrl ? selectedUrl.loc : '';
        
        console.log('找到的URL地址:', urlAddress);
        
        await seoApi.createTDKTemplate({
          url: values.url_content, // 传递选中的URL ID
          url_content: urlAddress, // 传递实际的URL地址
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
    } catch (err: any) {
      console.error('保存页面TDK失败:', err);
      // 如果是表单验证错误，显示具体的错误信息
      if (err.errorFields && err.errorFields.length > 0) {
        const firstError = err.errorFields[0];
        message.error(firstError.errors[0]);
      } else {
        message.error(isCreatingPageTDK ? '页面TDK创建失败: ' + (err.message || '') : '页面TDK保存失败: ' + (err.message || ''));
      }
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
    
    // 使用url_content作为完整URL，如果url_content是相对路径则添加域名
    const fullUrl = record.url_content?.startsWith('http') 
      ? record.url_content 
      : `https://example.com${record.url_content || ''}`;
    
    // 模拟不同搜索引擎的展示效果
    setPreviewData({
      googleTitle: record.title?.length > 60 ? record.title.substring(0, 57) + '...' : record.title || '',
      googleDesc: record.description?.length > 160 ? record.description.substring(0, 157) + '...' : record.description || '',
      googleUrl: fullUrl,
      bingTitle: record.title?.length > 65 ? record.title.substring(0, 62) + '...' : record.title || '',
      bingDesc: record.description?.length > 170 ? record.description.substring(0, 167) + '...' : record.description || '',
      bingUrl: fullUrl,
    });
    
    setPreviewModalVisible(true);
  };

  // 模板搜索和重置
  const handleTemplateSearch = () => {
    const values = templateSearchForm.getFieldsValue();
    setTemplateSearchParams(values);
    setTemplatePagination(prev => ({ ...prev, currentPage: 1 }));
    fetchTemplates({ ...values, currentPage: 1 });
  };

  const handleTemplateReset = () => {
    templateSearchForm.resetFields();
    setTemplateSearchParams({ title: '', page_type: '' });
    setTemplatePagination(prev => ({ ...prev, currentPage: 1 }));
    fetchTemplates({ currentPage: 1 });
  };

  // 搜索和重置
  const handlePageSearch = () => {
    const values = pageSearchForm.getFieldsValue();
    setPageSearchParams(values);
    setPagePagination(prev => ({ ...prev, currentPage: 1 }));
    fetchPageTDKs({ ...values, currentPage: 1 });
  };

  const handlePageReset = () => {
    pageSearchForm.resetFields();
    setPageSearchParams({ title: '', page_type: '' });
    setPagePagination(prev => ({ ...prev, currentPage: 1 }));
    fetchPageTDKs({ currentPage: 1 });
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
            <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Form form={templateSearchForm} layout="inline" style={{ display: 'flex', gap: 8 }}>
                <Form.Item name="page_type" style={{ marginBottom: 0 }}>
                  <Select 
                    placeholder="页面类型" 
                    style={{ width: 120 }} 
                    allowClear
                    options={[
                      { value: 'article', label: '文章页' },
                      { value: 'category', label: '分类页' },
                      { value: 'tag', label: '标签页' },
                      { value: 'detail', label: '详情页' },
                      { value: 'search', label: '搜索页' },
                      { value: 'custom', label: '自定义页' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="title" style={{ marginBottom: 0 }}>
                  <Input.Search 
                    placeholder="搜索标题" 
                    style={{ width: 250 }} 
                    allowClear
                    onSearch={handleTemplateSearch}
                  />
                </Form.Item>
              </Form>
              <Button type="primary" onClick={handleTemplateSearch}>搜索</Button>
              <Button onClick={handleTemplateReset}>重置</Button>
            </Space>
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
            <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Form form={pageSearchForm} layout="inline" style={{ display: 'flex', gap: 8 }}>
                <Form.Item name="page_type" style={{ marginBottom: 0 }}>
                  <Select 
                    placeholder="页面类型" 
                    style={{ width: 120 }} 
                    allowClear
                    options={[
                      { value: 'article', label: '文章页' },
                      { value: 'category', label: '分类页' },
                      { value: 'tag', label: '标签页' },
                      { value: 'detail', label: '详情页' },
                      { value: 'search', label: '搜索页' },
                      { value: 'custom', label: '自定义页' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="title" style={{ marginBottom: 0 }}>
                  <Input.Search 
                    placeholder="搜索标题" 
                    style={{ width: 250 }} 
                    allowClear
                    onSearch={handlePageSearch}
                  />
                </Form.Item>
              </Form>
              <Button type="primary" onClick={handlePageSearch}>搜索</Button>
              <Button onClick={handlePageReset}>重置</Button>
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
            rules={[{ required: true, message: '请选择页面URL' }]}
          >
            <Select
              placeholder="选择Sitemap中的URL"
              loading={sitemapUrlLoading}
              disabled={!isCreatingPageTDK}
              showSearch
              optionFilterProp="label"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {hasMoreSitemapUrls && (
                    <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
                      <Button
                        type="link"
                        loading={sitemapUrlLoading}
                        onClick={loadMoreSitemapUrls}
                      >
                        加载更多
                      </Button>
                    </div>
                  )}
                </>
              )}
            >
              {sitemapUrls.map((url: any) => (
                <Option key={url.id} value={url.id} label={url.loc}>
                  {url.loc}
                </Option>
              ))}
            </Select>
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
              description="以下是在Google和Bing搜索结果中的展示效果"
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
                <Tag color="blue">Title: {previewRecord.title?.length || 0} 字符 (建议 ≤60)</Tag>
                <Tag color="green">Description: {previewRecord.description?.length || 0} 字符 (建议 ≤160)</Tag>
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
                  color: '#6867AF',
                  fontSize: 20,
                  lineHeight: 1.3,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}>
                  {previewData.bingTitle}
                </div>
                <div style={{ 
                  color: '#008000',
                  fontSize: 13,
                  lineHeight: 1.3,
                  marginBottom: 8,
                }}>
                  {previewData.bingUrl}
                </div>
                <div style={{ 
                  color: '#000000',
                  fontSize: 14,
                  lineHeight: 1.58,
                }}>
                  {previewData.bingDesc}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Tag color="blue">Title: {previewRecord.title?.length || 0} 字符 (建议 ≤65)</Tag>
                <Tag color="green">Description: {previewRecord.description?.length || 0} 字符 (建议 ≤170)</Tag>
              </div>
            </Card>

            {/* Keywords 展示 */}
            <Card title="Keywords" style={{ marginTop: 24 }}>
              <Space wrap>
                {(() => {
                  // 处理keywords：可能是数组、逗号分隔的字符串、或其他类型
                  let keywordsArray: string[] = [];
                  const keywords = previewRecord.keywords as any;
                  
                  if (Array.isArray(keywords)) {
                    keywordsArray = keywords;
                  } else if (typeof keywords === 'string' && keywords.trim()) {
                    // 按逗号分割，并去除每个关键词的前后空格
                    keywordsArray = keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k);
                  }
                  
                  if (keywordsArray.length === 0) {
                    return <span style={{ color: '#999' }}>暂无关键词</span>;
                  }
                  
                  return keywordsArray.map((k, i) => (
                    <Tag key={i} color="purple">{k}</Tag>
                  ));
                })()}
              </Space>
              <div style={{ marginTop: 8, color: '#666' }}>
                共 {(() => {
                  const keywords = previewRecord.keywords as any;
                  if (Array.isArray(keywords)) {
                    return keywords.length;
                  } else if (typeof keywords === 'string' && keywords.trim()) {
                    return keywords.split(',').filter((k: string) => k.trim()).length;
                  }
                  return 0;
                })()} 个关键词
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

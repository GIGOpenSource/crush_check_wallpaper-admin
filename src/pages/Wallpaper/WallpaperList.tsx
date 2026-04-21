import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Image, Dropdown, message, Modal, Form, Tabs, Tooltip, Popconfirm } from 'antd';
const { TextArea } = Input;
import { SearchOutlined, ReloadOutlined, MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckOutlined, CloseOutlined, GlobalOutlined } from '@ant-design/icons';
import { 
  getWallpaperList,
  batchAuditWallpaper,
  batchDeleteWallpaper,
  type Wallpaper as ApiWallpaper,
  type GetWallpaperListParams
} from '../../services/wallpaperApi';

// 扩展 API 返回的 Wallpaper 类型，添加页面特有的字段
interface Wallpaper extends ApiWallpaper {
  view_count?: number;
  download_count?: number;
  hot_score?: number;
  status: 'normal' | 'pending' | 'rejected' | 'disabled';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  altText?: string;
}

const { TabPane } = Tabs;

const WallpaperList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Wallpaper[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<GetWallpaperListParams>({});
  const [searchText, setSearchText] = useState<string>('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingWallpaper, setRejectingWallpaper] = useState<Wallpaper | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form] = Form.useForm();

  // 加载壁纸列表
  useEffect(() => {
    loadWallpaperList();
  }, [currentPage, pageSize]);

  const loadWallpaperList = async (params?: GetWallpaperListParams) => {
    setLoading(true);
    try {
      const requestParams: GetWallpaperListParams = {
        currentPage,
        pageSize,
        ...searchParams,
        ...params,
      };
      const response = await getWallpaperList(requestParams);
      // 将 API 返回的数据转换为页面需要的格式
      const convertedData: Wallpaper[] = response.results.map(item => ({
        ...item,
        view_count: item.view_count || 0,
        download_count: item.download_count || 0,
        hot_score: item.hot_score || 0,
        status: item.audit_status === 'approved' ? 'normal' : 
                item.audit_status === 'pending' ? 'pending' : 'rejected',
      }));
      setDataSource(convertedData);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('加载壁纸列表失败:', error);
      message.error('加载壁纸列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadWallpaperList();
  };

  // 重置
  const handleReset = () => {
    setSearchParams({});
    setCurrentPage(1);
    loadWallpaperList();
  };

  const handlePreview = (record: Wallpaper) => {
    message.info(`预览: ${record.name}`);
  };

  const handleEdit = (record: Wallpaper) => {
    setEditingWallpaper(record);
    form.setFieldsValue({
      name: record.name,
      altText: record.altText,
      seoTitle: record.seoTitle,
      seoDescription: record.seoDescription,
      seoKeywords: record.seoKeywords?.join(','),
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      console.log('保存编辑:', values);
      message.success('保存成功');
      setEditModalVisible(false);
      loadWallpaperList();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  const handleDelete = (record: Wallpaper) => {
    batchDeleteWallpaper({
      wallpaper_ids: [record.id],
    })
      .then(() => {
        message.success(`已删除: ${record.name}`);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('删除失败:', error);
        message.error('删除失败');
      });
  };

  // 单个通过（使用 Popconfirm）
  const handleAuditPass = (record: Wallpaper) => {
    batchAuditWallpaper({
      wallpaper_ids: [record.id],
      remark: '',
      action: 'approve',
    })
      .then(() => {
        message.success(`通过审核: ${record.name}`);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('审核失败:', error);
        message.error('审核失败');
      });
  };

  // 打开拒绝弹窗
  const handleOpenRejectModal = (record: Wallpaper) => {
    setRejectingWallpaper(record);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // 提交拒绝
  const handleSubmitReject = async () => {
    if (!rejectReason || rejectReason.trim() === '') {
      message.error('请输入拒绝原因');
      return;
    }
    
    if (!rejectingWallpaper) return;
    
    try {
      await batchAuditWallpaper({
        wallpaper_ids: [rejectingWallpaper.id],
        remark: rejectReason.trim(),
        action: 'reject',
      });
      message.success(`拒绝审核: ${rejectingWallpaper.name}`);
      setRejectModalVisible(false);
      setRejectingWallpaper(null);
      setRejectReason('');
      loadWallpaperList();
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    }
  };

  const handleAuditPassConfirm = (record: Wallpaper) => {
    return (
      <Popconfirm
        title="确认通过"
        description={`确定要通过壁纸 "${record.name}" 的审核吗？`}
        onConfirm={() => handleAuditPass(record)}
        okText="确认通过"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Button 
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          通过
        </Button>
      </Popconfirm>
    );
  };

  const handleAuditRejectButton = (record: Wallpaper) => {
    return (
      <Button 
        type="link"
        size="small"
        danger
        icon={<CloseOutlined />}
        onClick={() => handleOpenRejectModal(record)}
      >
        拒绝
      </Button>
    );
  };

  // 批量通过
  const handleBatchPass = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    
    batchAuditWallpaper({
      wallpaper_ids: selectedRowKeys.map(key => Number(key)),
      remark: '',
      action: 'approve',
    })
      .then(() => {
        message.success(`已通过 ${selectedRowKeys.length} 个壁纸`);
        setSelectedRowKeys([]);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('批量通过失败:', error);
        message.error('批量通过失败');
      });
  };

  const handleBatchPassConfirm = () => {
    return (
      <Popconfirm
        title="确认批量通过"
        description={`确定要通过选中的 ${selectedRowKeys.length} 个壁纸吗？`}
        onConfirm={handleBatchPass}
        okText="确认通过"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Button 
          type="primary" 
          icon={<CheckOutlined />}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          批量通过
        </Button>
      </Popconfirm>
    );
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的壁纸');
      return;
    }
    
    batchDeleteWallpaper({
      wallpaper_ids: selectedRowKeys.map(key => Number(key)),
    })
      .then(() => {
        message.success(`已删除 ${selectedRowKeys.length} 个壁纸`);
        setSelectedRowKeys([]);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('批量删除失败:', error);
        message.error('批量删除失败');
      });
  };

  const handleBatchDeleteConfirm = () => {
    return (
      <Popconfirm
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedRowKeys.length} 个壁纸吗？`}
        onConfirm={handleBatchDelete}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Button danger>批量删除</Button>
      </Popconfirm>
    );
  };

  // 批量拒绝（使用 Modal 输入必填原因）
  const [batchRejectModalVisible, setBatchRejectModalVisible] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');

  const handleOpenBatchRejectModal = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    setBatchRejectReason('');
    setBatchRejectModalVisible(true);
  };

  const handleSubmitBatchReject = async () => {
    if (!batchRejectReason || batchRejectReason.trim() === '') {
      message.error('请输入拒绝原因');
      return;
    }
    
    try {
      const wallpaperIds = selectedRowKeys.map(key => Number(key));
      await batchAuditWallpaper({
        wallpaper_ids: wallpaperIds,
        remark: batchRejectReason.trim(),
        action: 'reject',
      });
      message.success(`已拒绝 ${selectedRowKeys.length} 个壁纸`);
      setSelectedRowKeys([]);
      setBatchRejectModalVisible(false);
      setBatchRejectReason('');
      loadWallpaperList();
    } catch (error) {
      console.error('批量拒绝失败:', error);
      message.error('批量拒绝失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      ellipsis: true,
      render: (text: number) => (
        <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
      ),
    },
    {
      title: '缩略图',
      dataIndex: 'thumb_url',
      key: 'thumb_url',
      width: 120,
      render: (url: string) => (
        <Image 
          src={url} 
          width={100} 
          height={60} 
          style={{ objectFit: 'cover', borderRadius: 4 }} 
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      ellipsis: true,
      render: (categories: string[] | Array<{ id: number; name: string }>) => {
        const categoryList = (categories || []).map((cat) => {
          if (typeof cat === 'object' && cat !== null) {
            return (cat as { id: number; name: string }).name;
          }
          return cat;
        });
        
        return (
          <Space wrap>
            {categoryList.map((cat, index) => (
              <Tag key={`${cat}-${index}`}>{cat}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      ellipsis: true,
      render: (tags: string[] | Array<{ id: number; name: string }>) => {
        const tagList = (tags || []).map((tag) => {
          if (typeof tag === 'object' && tag !== null) {
            return (tag as { id: number; name: string }).name;
          }
          return tag;
        });
        
        return (
          <Space wrap>
            {tagList.map((tag, index) => (
              <Tag key={`${tag}-${index}`} color="blue">{tag}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '尺寸',
      key: 'size',
      width: 100,
      render: (_: unknown, record: Wallpaper) => (
        <span style={{ whiteSpace: 'nowrap' }}>{record.width}x{record.height}</span>
      ),
    },
    {
      title: '格式',
      dataIndex: 'image_format',
      key: 'image_format',
      width: 80,
      ellipsis: true,
    },
    {
      title: '浏览',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
      render: (count: number) => count || 0,
      sorter: (a: Wallpaper, b: Wallpaper) => (a.view_count || 0) - (b.view_count || 0),
    },
    {
      title: '下载',
      dataIndex: 'download_count',
      key: 'download_count',
      width: 80,
      render: (count: number) => count || 0,
      sorter: (a: Wallpaper, b: Wallpaper) => (a.download_count || 0) - (b.download_count || 0),
    },
    {
      title: '热度',
      dataIndex: 'hot_score',
      key: 'hot_score',
      width: 80,
      render: (score: number) => score || 0,
      sorter: (a: Wallpaper, b: Wallpaper) => (a.hot_score || 0) - (b.hot_score || 0),
    },
    {
      title: '上传者',
      key: 'uploader',
      width: 120,
      ellipsis: true,
      render: (_: unknown, record: Wallpaper) => (
        <Tooltip title={record.uploader?.nickname}>
          <span style={{ whiteSpace: 'nowrap' }}>{record.uploader?.nickname || '未知用户'}</span>
        </Tooltip>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      ellipsis: true,
      render: (text: string) => {
        if (!text) return '-';
        return new Date(text).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(/\//g, '-');
      },
      sorter: (a: Wallpaper, b: Wallpaper) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
    },
    {
      title: '状态',
      dataIndex: 'audit_status',
      key: 'audit_status',
      width: 100,
      fixed: 'left' as const,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          approved: { color: 'success', text: '已通过' },
          pending: { color: 'warning', text: '待审核' },
          rejected: { color: 'error', text: '已拒绝' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 350,
      fixed: 'right' as const,
      render: (_: unknown, record: Wallpaper) => (
        <Space wrap>
          <Button 
            type="primary" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button 
            type="primary" 
            size="small"
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.audit_status === 'pending' && (
            <>
              {handleAuditPassConfirm(record)}
              <Button 
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleOpenRejectModal(record)}
              >
                拒绝
              </Button>
            </>
          )}
          <Button 
            type="primary" 
            size="small"
            icon={<GlobalOutlined />} 
            onClick={() => handleEdit(record)}
          >
            SEO设置
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除壁纸 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>壁纸管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索壁纸名称"
            value={searchParams.name}
            onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            value={searchParams.audit_status}
            onChange={(value) => setSearchParams({ ...searchParams, audit_status: value })}
            allowClear
            options={[
              { value: 'pending', label: '待审核' },
              { value: 'approved', label: '已通过' },
              { value: 'rejected', label: '已拒绝' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            {handleBatchPassConfirm()}
            <Button 
              danger
              icon={<CloseOutlined />}
              onClick={handleOpenBatchRejectModal}
            >
              批量拒绝
            </Button>
            {handleBatchDeleteConfirm()}
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          pagination={{
            total,
            pageSize,
            current: currentPage,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{ 
            type: 'checkbox',
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 编辑/SEO设置弹窗 */}
      <Modal
        title={`编辑壁纸 - ${editingWallpaper?.name}`}
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Form.Item name="name" label="壁纸名称" rules={[{ required: true }]}>
                <Input placeholder="请输入壁纸名称" />
              </Form.Item>
              <Form.Item name="altText" label="图片Alt文本">
                <Input placeholder="请输入图片Alt描述，用于SEO和 accessibility" />
              </Form.Item>
            </TabPane>
            <TabPane tab="SEO设置" key="seo">
              <Form.Item name="seoTitle" label="SEO标题">
                <Input placeholder="建议50-60个字符，包含关键词" maxLength={60} showCount />
              </Form.Item>
              <Form.Item name="seoDescription" label="SEO描述">
                <Input.TextArea 
                  rows={3} 
                  placeholder="建议150-160个字符，描述壁纸内容"
                  maxLength={160}
                  showCount
                />
              </Form.Item>
              <Form.Item name="seoKeywords" label="SEO关键词">
                <Input placeholder="多个关键词用逗号分隔，如：4K壁纸,星空壁纸,高清" />
              </Form.Item>
              <div style={{ background: '#f6ffed', padding: 12, borderRadius: 4, marginTop: 16 }}>
                <strong>SEO优化建议：</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>标题应包含主要关键词，长度控制在60字符以内</li>
                  <li>描述应准确概括内容，吸引用户点击</li>
                  <li>关键词数量建议3-5个，避免堆砌</li>
                  <li>Alt文本应描述图片内容，便于搜索引擎理解</li>
                </ul>
              </div>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      {/* 单个拒绝弹窗 */}
      <Modal
        title={`拒绝壁纸 - ${rejectingWallpaper?.name}`}
        open={rejectModalVisible}
        onOk={handleSubmitReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectingWallpaper(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <Form.Item label="拒绝原因（必填）" required>
            <TextArea
              rows={4}
              placeholder="请输入拒绝原因"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量拒绝弹窗 */}
      <Modal
        title="批量拒绝壁纸"
        open={batchRejectModalVisible}
        onOk={handleSubmitBatchReject}
        onCancel={() => {
          setBatchRejectModalVisible(false);
          setBatchRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <p style={{ marginBottom: 16 }}>确定要拒绝选中的 {selectedRowKeys.length} 个壁纸吗？</p>
          <Form.Item label="拒绝原因（必填）" required>
            <TextArea
              rows={4}
              placeholder="请输入拒绝原因"
              value={batchRejectReason}
              onChange={(e) => setBatchRejectReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default WallpaperList;



































































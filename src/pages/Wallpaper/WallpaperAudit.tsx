import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Image, Modal, message, Input, Tooltip, Popconfirm } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  getWallpaperAuditList, 
  auditWallpaper,
  batchAuditWallpaper,
  type Wallpaper,
  type GetWallpaperListParams,
  type AuditWallpaperParams,
} from '../../services/wallpaperApi';
import axios from 'axios';

const { TextArea } = Input;

const WallpaperAudit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Wallpaper[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [searchParams, setSearchParams] = useState<GetWallpaperListParams>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 拒绝弹窗状态
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingWallpaper, setRejectingWallpaper] = useState<Wallpaper | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // 批量拒绝弹窗状态
  const [batchRejectModalVisible, setBatchRejectModalVisible] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');

  // 加载待审核壁纸列表
  useEffect(() => {
    loadAuditList();
  }, [currentPage, pageSize]);

  const loadAuditList = async (params?: GetWallpaperListParams) => {
    setLoading(true);
    try {
      const requestParams: GetWallpaperListParams = {
        currentPage,
        pageSize,
        audit_status: 'pending',  // 固定查询待审核的
        ...searchParams,
        ...params,
      };
      const response = await getWallpaperAuditList(requestParams);
      setDataSource(response.results);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('加载审核列表失败:', error);
      message.error('加载审核列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadAuditList();
  };

  // 重置
  const handleReset = () => {
    setSearchParams({});
    setCurrentPage(1);
    loadAuditList();
  };

  const handlePreview = (record: Wallpaper) => {
    // 设置预览的壁纸并显示预览
    setPreviewWallpaper(record);
    setShowImagePreview(true);
  };

  // 格式化时间
  const formatTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');
  };

  const handlePass = (record: Wallpaper) => {
    batchAuditWallpaper({
      wallpaper_ids: [record.id],
      remark: '',
      action: 'approve',
    })
      .then(() => {
        message.success(`已通过: ${record.name}`);
        loadAuditList();
      })
      .catch((error) => {
        console.error('通过审核失败:', error);
        if (axios.isAxiosError(error)) {
          const errorMsg = error.response?.data?.message || error.response?.data?.error || '通过审核失败';
          message.error(errorMsg);
        } else {
          message.error('通过审核失败');
        }
      });
  };

  // 打开单个拒绝弹窗
  const handleReject = (record: Wallpaper) => {
    setRejectingWallpaper(record);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // 提交单个拒绝
  const submitReject = async () => {
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
      message.success(`已拒绝: ${rejectingWallpaper.name}`);
      setRejectModalVisible(false);
      setRejectingWallpaper(null);
      loadAuditList();
    } catch (error) {
      console.error('拒绝审核失败:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || '拒绝审核失败';
        message.error(errorMsg);
      } else {
        message.error('拒绝审核失败');
      }
    }
  };

  // 打开批量拒绝弹窗
  const handleBatchRejectClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    setBatchRejectReason('');
    setBatchRejectModalVisible(true);
  };

  // 提交批量拒绝
  const submitBatchReject = async () => {
    if (!batchRejectReason || batchRejectReason.trim() === '') {
      message.error('请输入拒绝原因');
      return;
    }
    
    const wallpaperIds = selectedRowKeys.map(key => Number(key));
    try {
      await batchAuditWallpaper({
        wallpaper_ids: wallpaperIds,
        remark: batchRejectReason.trim(),
        action: 'reject',
      });
      message.success(`已拒绝 ${selectedRowKeys.length} 个壁纸`);
      setBatchRejectModalVisible(false);
      setSelectedRowKeys([]);
      loadAuditList();
    } catch (error) {
      console.error('批量拒绝失败:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || '批量拒绝失败';
        message.error(errorMsg);
      } else {
        message.error('批量拒绝失败');
      }
    }
  };

  // 批量通过
  const handleBatchPass = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    
    const wallpaperIds = selectedRowKeys.map(key => Number(key));
    batchAuditWallpaper({
      wallpaper_ids: wallpaperIds,
      remark: '',
      action: 'approve',
    })

      .then(() => {
        message.success(`已通过 ${selectedRowKeys.length} 个壁纸`);
        setSelectedRowKeys([]);
        loadAuditList();
      })
      .catch((error) => {
        console.error('批量通过失败:', error);
        if (axios.isAxiosError(error)) {
          const errorMsg = error.response?.data?.message || error.response?.data?.error || '批量通过失败';
          message.error(errorMsg);
        } else {
          message.error('批量通过失败');
        }
      });
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
      title: '预览',
      dataIndex: 'thumb_url',
      key: 'thumb_url',
      width: 120,
      render: (_url: string, record: Wallpaper) => (
        <Image
          src={record.thumb_url}
          width={100}
          height={60}
          style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: 4 }}
          preview={false}
          onClick={() => handlePreview(record)}
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
      title: '操作',
      key: 'action',
      width: 280,
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
          <Popconfirm
            title="确认通过"
            description={`确定要通过壁纸 "${record.name}" 的审核吗？`}
            onConfirm={() => handlePass(record)}
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
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>壁纸审核</h2>
      
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
            <Tag color="warning">待审核: {total}</Tag>
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
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={handleBatchRejectClick}
            >
              批量拒绝
            </Button>
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
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ x: 1500 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />
      </Card>

      {/* 图片预览组件 - 使用key确保每次显示正确的图片 */}
      {showImagePreview && previewWallpaper && (
        <Image
          key={previewWallpaper.id}  // 使用壁纸ID作为key，确保切换图片时重新渲染
          src={previewWallpaper.url}  // 直接使用 thumb_url
          alt={previewWallpaper.name}
          style={{ display: 'none' }}
          preview={{
            visible: true,
            onVisibleChange: (visible) => {
              setShowImagePreview(visible);
              if (!visible) {
                setPreviewWallpaper(null);
              }
            },
          }}
        />
      )}

      {/* 单个拒绝弹窗 */}
      <Modal
        title="拒绝壁纸"
        open={rejectModalVisible}
        onOk={submitReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectingWallpaper(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要拒绝壁纸 "{rejectingWallpaper?.name}" 吗？</p>
        <p style={{ marginTop: 8, marginBottom: 4, color: 'red' }}>拒绝原因（必填）：</p>
        <TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* 批量拒绝弹窗 */}
      <Modal
        title="批量拒绝壁纸"
        open={batchRejectModalVisible}
        onOk={submitBatchReject}
        onCancel={() => {
          setBatchRejectModalVisible(false);
          setBatchRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要拒绝选中的 {selectedRowKeys.length} 个壁纸吗？</p>
        <p style={{ marginTop: 8, marginBottom: 4, color: 'red' }}>拒绝原因（必填）：</p>
        <TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={batchRejectReason}
          onChange={(e) => setBatchRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default WallpaperAudit;

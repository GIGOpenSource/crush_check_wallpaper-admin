import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Image, Modal, message, Input, Tooltip } from 'antd';
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [searchParams, setSearchParams] = useState<GetWallpaperListParams>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
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
    Modal.confirm({
      title: '确认通过',
      content: `确定要通过壁纸 "${record.name}" 的审核吗？`,
      okText: '确认通过',
      cancelText: '取消',
      onOk: async () => {
        try {
          console.log('开始审核壁纸:', record.id, { audit_status: 'approved' });
          const response = await auditWallpaper(record.id, { 
            audit_status: 'approved' 
          });
          console.log('审核响应:', response);
          message.success(`已通过: ${record.name}`);
          loadAuditList();
        } catch (error) {
          console.error('通过审核失败:', error);
          if (axios.isAxiosError(error)) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || '通过审核失败';
            message.error(errorMsg);
          } else {
            message.error('通过审核失败');
          }
        }
      },
    });
  };

  const handleReject = (record: Wallpaper) => {
    let rejectReason = '';
    
    Modal.confirm({
      title: '确认拒绝',
      content: (
        <div>
          <p>确定要拒绝壁纸 "{record.name}" 吗？</p>
          <p style={{ marginTop: 8, marginBottom: 4 }}>拒绝原因（选填）：</p>
          <TextArea
            rows={3}
            placeholder="请输入拒绝原因"
            onChange={(e) => { rejectReason = e.target.value; }}
          />
        </div>
      ),
      okText: '确认拒绝',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const params: AuditWallpaperParams = { 
            audit_status: 'rejected',
            remark: rejectReason || undefined
          };
          console.log('开始拒绝壁纸:', record.id, params);
          const response = await auditWallpaper(record.id, params);
          console.log('拒绝响应:', response);
          message.success(`已拒绝: ${record.name}`);
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
      },
    });
  };

  // 批量通过
  const handleBatchPass = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    
    Modal.confirm({
      title: '确认批量通过',
      content: `确定要通过选中的 ${selectedRowKeys.length} 个壁纸吗？`,
      okText: '确认通过',
      cancelText: '取消',
      onOk: async () => {
        try {
          const wallpaperIds = selectedRowKeys.map(key => Number(key));
          console.log('开始批量通过:', wallpaperIds);
          const response = await batchAuditWallpaper({
            wallpaper_ids: wallpaperIds,
            action: 'approve',
          });
          console.log('批量通过响应:', response);
          message.success(`已通过 ${selectedRowKeys.length} 个壁纸`);
          setSelectedRowKeys([]);
          loadAuditList();
        } catch (error) {
          console.error('批量通过失败:', error);
          if (axios.isAxiosError(error)) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || '批量通过失败';
            message.error(errorMsg);
          } else {
            message.error('批量通过失败');
          }
        }
      },
    });
  };

  // 批量拒绝
  const handleBatchReject = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    
    let rejectReason = '';
    
    Modal.confirm({
      title: '确认批量拒绝',
      content: (
        <div>
          <p>确定要拒绝选中的 {selectedRowKeys.length} 个壁纸吗？</p>
          <p style={{ marginTop: 8, marginBottom: 4 }}>拒绝原因（选填）：</p>
          <TextArea
            rows={3}
            placeholder="请输入拒绝原因"
            onChange={(e) => { rejectReason = e.target.value; }}
          />
        </div>
      ),
      okText: '确认拒绝',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const wallpaperIds = selectedRowKeys.map(key => Number(key));
          const params: {
            wallpaper_ids: number[];
            remark?: string;
            action: 'approve' | 'reject';
          } = {
            wallpaper_ids: wallpaperIds,
            remark: rejectReason || undefined,
            action: 'reject',
          };
          console.log('开始批量拒绝:', params);
          const response = await batchAuditWallpaper(params);
          console.log('批量拒绝响应:', response);
          message.success(`已拒绝 ${selectedRowKeys.length} 个壁纸`);
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
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '预览',
      dataIndex: 'thumb_url',
      key: 'thumb_url',
      width: 150,
      render: (url: string, record: Wallpaper) => (
        <Image
          src={url}
          width={120}
          height={72}
          style={{ objectFit: 'cover', cursor: 'pointer' }}
          preview={false}
          onClick={() => handlePreview(record.url)}
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (categories: string[] | Array<{ id: number; name: string }>) => {
        // 处理 category 可能是对象数组的情况
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
      render: (tags: string[] | Array<{ id: number; name: string }>) => {
        // 处理 tags 可能是对象数组的情况
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
      width: 120,
      render: (_: unknown, record: Wallpaper) => `${record.width}x${record.height}`,
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 80,
    },
    {
      title: '上传者',
      key: 'uploader',
      width: 120,
      render: (_: unknown, record: Wallpaper) => (
        <span>{record.uploader?.nickname || '未知用户'}</span>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => formatTime(text),
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
            onClick={() => handlePreview(record.url)}
          >
            预览
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => handlePass(record)}
          >
            通过
          </Button>
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
            <Tooltip title="批量通过">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                onClick={handleBatchPass}
              >
                批量通过
              </Button>
            </Tooltip>
            <Tooltip title="批量拒绝">
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={handleBatchReject}
              >
                批量拒绝
              </Button>
            </Tooltip>
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
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />
      </Card>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={1000}
      >
        <img
          alt="preview"
          style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default WallpaperAudit;

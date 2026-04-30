import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Avatar, Input, Space, message, Popconfirm, Tooltip, Image } from 'antd';
import { UserOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, PictureOutlined } from '@ant-design/icons';
import { 
  getCommentList, 
  deleteComment,
  type Comment,
  type GetCommentListParams
} from '../../services/commentApi';

const CommentList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<GetCommentListParams>({});
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // 加载评论列表
  useEffect(() => {
    loadCommentList();
  }, [currentPage, pageSize]);

  const loadCommentList = async (params?: GetCommentListParams) => {
    setLoading(true);
    try {
      const requestParams = {
        currentPage,
        pageSize,
        ...searchParams,
        ...params,
      };
      const response = await getCommentList(requestParams);
      setDataSource(response.results);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('加载评论列表失败:', error);
      message.error('加载评论列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadCommentList();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchParams({});
    setCurrentPage(1);
    loadCommentList();
  };

  // 删除评论
  const handleDelete = async (record: Comment) => {
    try {
      await deleteComment(record.id);
      message.success('删除评论成功');
      loadCommentList();
    } catch (error) {
      console.error('删除评论失败:', error);
      message.error('删除评论失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async (selectedRowKeys: React.Key[]) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的评论');
      return;
    }
    try {
      await deleteComment(selectedRowKeys[0] as number); // 逐个删除
      message.success('删除成功');
      loadCommentList();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户',
      key: 'customer_info',
      width: 180,
      render: (_: unknown, record: Comment) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            size="small" 
            src={record.customer_info?.avatar_url} 
          />
          <span>{record.customer_info?.nickname || '未知用户'}</span>
        </Space>
      ),
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '所属壁纸',
      key: 'wallpaper_object',
      width: 300,
      render: (_: unknown, record: Comment) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 40, height: 40, flexShrink: 0 }}>
            {record.wallpaper_object?.thumb_url ? (
              <Image
                src={record.wallpaper_object.thumb_url}
                alt={record.wallpaper_object.name}
                width={40}
                height={40}
                style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                preview={false}
                onClick={() => {
                  setPreviewImageUrl(record.wallpaper_object!.thumb_url);
                  setShowImagePreview(true);
                }}
              />
            ) : (
              <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PictureOutlined style={{ color: '#999' }} />
              </div>
            )}
          </div>
          <Tooltip title={record.wallpaper_object?.name}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.wallpaper_object?.name || '未知壁纸'}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '点赞',
      dataIndex: 'like_count',
      key: 'like_count',
      width: 80,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => formatTime(text),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Comment) => (
        <Popconfirm
          title="确认删除"
          description="确定要删除这条评论吗？"
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
      ),
    },
  ];

  return (
    <div>
      {/* 图片预览组件 */}
      {showImagePreview && (
        <Image
          src={previewImageUrl}
          style={{ display: 'none' }}
          preview={{
            visible: true,
            onVisibleChange: (visible) => {
              setShowImagePreview(visible);
              if (!visible) {
                setPreviewImageUrl('');
              }
            },
          }}
        />
      )}

      <h2 style={{ marginBottom: 24 }}>评论管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索评论内容"
            value={searchParams.content}
            onChange={(e) => setSearchParams({ ...searchParams, content: e.target.value })}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
            onPressEnter={handleSearch}
          />
          <Input
            placeholder="搜索用户昵称"
            value={searchParams.nickname}
            onChange={(e) => setSearchParams({ ...searchParams, nickname: e.target.value })}
            style={{ width: 200 }}
            prefix={<UserOutlined />}
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
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default CommentList;

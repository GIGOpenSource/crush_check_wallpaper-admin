import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Avatar, Tag, Statistic, Row, Col, Table, Tabs, Spin, message, Button, Image } from 'antd';
import { UserOutlined, PictureOutlined, StarOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerUserDetail, type CustomerUser } from '../../services/userApi';
import { getUserUploads, getUserCollections, type Wallpaper } from '../../services/wallpaperApi';

const { TabPane } = Tabs;

// 性别映射
const genderMap: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };

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

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<CustomerUser | null>(null);
  
  // 上传的壁纸相关状态
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadData, setUploadData] = useState<Wallpaper[]>([]);
  const [uploadPagination, setUploadPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 收藏的壁纸相关状态
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionData, setCollectionData] = useState<Wallpaper[]>([]);
  const [collectionPagination, setCollectionPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 图片预览状态
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null);

  // 加载用户详情
  useEffect(() => {
    if (id) {
      loadUserDetail(parseInt(id));
    }
  }, [id]);

  const loadUserDetail = async (userId: number) => {
    setLoading(true);
    try {
      const response = await getCustomerUserDetail(userId);
      setUserInfo(response);
      // 加载用户上传的壁纸
      loadUserUploads(userId);
      // 加载用户收藏的壁纸
      loadUserCollections(userId);
    } catch (error) {
      console.error('加载用户详情失败:', error);
      message.error('加载用户详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载用户上传的壁纸
  const loadUserUploads = async (customerId: number, page = 1, pageSize = 10) => {
    setUploadLoading(true);
    try {
      const response = await getUserUploads(customerId, {
        currentPage: page,
        pageSize: pageSize,
      });
      setUploadData(response.results || []);
      setUploadPagination({
        current: response.pagination?.currentPage || page,
        pageSize: response.pagination?.page_size || pageSize,
        total: response.pagination?.total || 0,
      });
    } catch (error) {
      console.error('加载用户上传壁纸失败:', error);
      message.error('加载用户上传壁纸失败');
    } finally {
      setUploadLoading(false);
    }
  };

  // 加载用户收藏的壁纸
  const loadUserCollections = async (customerId: number, page = 1, pageSize = 10) => {
    setCollectionLoading(true);
    try {
      const response = await getUserCollections(customerId, {
        currentPage: page,
        pageSize: pageSize,
      });
      
      // 将wrapper下的壁纸数据扁平化，与上传壁纸的数据结构保持一致
      const collectionWallpapers: Wallpaper[] = (response.results || []).map((item: any) => {
        const wallpaper = item.wallpaper || {};
        return {
          ...wallpaper,
          // 保留wrapper的其他字段（如果有需要）
          collect_id: item.id,
          collect_created_at: item.created_at,
        } as Wallpaper;
      });
      
      setCollectionData(collectionWallpapers);
      setCollectionPagination({
        current: response.pagination?.currentPage || page,
        pageSize: response.pagination?.page_size || pageSize,
        total: response.pagination?.total || 0,
      });
    } catch (error) {
      console.error('加载用户收藏壁纸失败:', error);
      message.error('加载用户收藏壁纸失败');
    } finally {
      setCollectionLoading(false);
    }
  };

  // 处理上传壁纸分页变化
  const handleUploadTableChange = (pagination: any) => {
    if (userInfo?.id) {
      loadUserUploads(userInfo.id, pagination.current, pagination.pageSize);
    }
  };

  // 处理收藏壁纸分页变化
  const handleCollectionTableChange = (pagination: any) => {
    if (userInfo?.id) {
      loadUserCollections(userInfo.id, pagination.current, pagination.pageSize);
    }
  };

  // 处理图片预览
  const handlePreview = (record: Wallpaper) => {
    setPreviewWallpaper(record);
    setShowImagePreview(true);
  };

  // 返回用户列表
  const handleBack = () => {
    navigate('/users');
  };

  // 用户上传的壁纸列定义
  const uploadColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
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
      title: '壁纸名称', 
      dataIndex: 'name', 
      key: 'name',
      ellipsis: true,
    },
    { 
      title: '分类', 
      dataIndex: 'category', 
      key: 'category', 
      width: 150,
      render: (category: any) => {
        if (!category) return '-';
        if (Array.isArray(category)) {
          return category.map((item: any) => typeof item === 'object' ? item.name : item).join(', ');
        }
        return category;
      }
    },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count', width: 100 },
    { title: '下载量', dataIndex: 'download_count', key: 'download_count', width: 100 },
    { 
      title: '上传时间', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      width: 180,
      render: (time: string) => formatTime(time),
    },
    // {
    //   title: '操作',
    //   key: 'action',
    //   width: 100,
    //   fixed: 'right' as const,
    //   render: (_: unknown, record: Wallpaper) => (
    //     <Button 
    //       type="primary" 
    //       size="small"
    //       icon={<EyeOutlined />} 
    //       onClick={() => handlePreview(record)}
    //     >
    //       预览
    //     </Button>
    //   ),
    // },
  ];

  // 用户收藏的壁纸列定义
  const collectionColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
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
      title: '壁纸名称', 
      dataIndex: 'name', 
      key: 'name',
      ellipsis: true,
    },
    { 
      title: '上传者', 
      dataIndex: 'uploader', 
      key: 'uploader', 
      width: 150,
      render: (uploader: any) => {
        if (!uploader) return '-';
        return uploader.nickname || uploader.name || '-';
      }
    },
    { 
      title: '分类', 
      dataIndex: 'category', 
      key: 'category', 
      width: 200,
      render: (category: any) => {
        if (!category) return '-';
        if (Array.isArray(category)) {
          return category.map((item: any) => typeof item === 'object' ? item.name : item).join(', ');
        }
        return category;
      }
    },
    { 
      title: '收藏时间', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      width: 180,
      render: (time: string) => formatTime(time),
    },
    // {
    //   title: '操作',
    //   key: 'action',
    //   width: 100,
    //   fixed: 'right' as const,
    //   render: (_: unknown, record: Wallpaper) => (
    //     <Button 
    //       type="primary" 
    //       size="small"
    //       icon={<EyeOutlined />} 
    //       onClick={() => handlePreview(record)}
    //     >
    //       预览
    //     </Button>
    //   ),
    // },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <p>用户不存在</p>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回
        </Button>
        <h2 style={{ margin: 0 }}>用户详情</h2>
      </div>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={100} 
                icon={<UserOutlined />} 
                src={userInfo.avatar_url} 
              />
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                {userInfo.nickname || '--'}
              </h3>
              <p style={{ color: '#666', marginBottom: 8 }}>{userInfo.email}</p>
              <Tag color={userInfo.status === 1 ? 'success' : 'error'}>
                {userInfo.status === 1 ? '正常' : '已禁用'}
              </Tag>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="等级" value={userInfo.level} />
              </Col>
              <Col span={12}>
                <Statistic title="粉丝数" value={userInfo.followers_count || 0} />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic title="关注数" value={userInfo.following_count || 0} />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic title="上传数" value={userInfo.upload_count || 0} />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic title="收藏数" value={userInfo.collection_count || 0} />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="基本信息">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="用户ID">{userInfo.id}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
              <Descriptions.Item label="昵称">{userInfo.nickname || '--'}</Descriptions.Item>
              <Descriptions.Item label="性别">
                {genderMap[userInfo.gender] || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="等级">{userInfo.level}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={userInfo.status === 1 ? 'success' : 'error'}>
                  {userInfo.status === 1 ? '正常' : '已禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {formatTime(userInfo.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {formatTime(userInfo.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="uploads">
          <TabPane 
            tab={
              <span>
                上传的壁纸 ({userInfo.upload_count || 0})
              </span>
            } 
            key="uploads"
          >
            <Table
              columns={uploadColumns}
              dataSource={uploadData}
              rowKey="id"
              loading={uploadLoading}
              pagination={{
                current: uploadPagination.current,
                pageSize: uploadPagination.pageSize,
                total: uploadPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={handleUploadTableChange}
              scroll={{ x: 800 }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                收藏的壁纸 ({userInfo.collection_count || 0})
              </span>
            } 
            key="collections"
          >
            <Table
              columns={collectionColumns}
              dataSource={collectionData}
              rowKey="id"
              loading={collectionLoading}
              pagination={{
                current: collectionPagination.current,
                pageSize: collectionPagination.pageSize,
                total: collectionPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={handleCollectionTableChange}
              scroll={{ x: 800 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 图片预览组件 */}
      {showImagePreview && previewWallpaper && (
        <Image
          key={previewWallpaper.id}
          src={previewWallpaper.url}
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
    </div>
  );
};

export default UserDetail;

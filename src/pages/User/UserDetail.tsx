import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Avatar, Tag, Statistic, Row, Col, Table, Tabs, Spin, message, Button } from 'antd';
import { UserOutlined, PictureOutlined, StarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerUserDetail, type CustomerUser } from '../../services/userApi';

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
    } catch (error) {
      console.error('加载用户详情失败:', error);
      message.error('加载用户详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 返回用户列表
  const handleBack = () => {
    navigate('/users');
  };

  // 用户上传的壁纸
  const uploadColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '壁纸名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
    { title: '浏览量', dataIndex: 'views', key: 'views', width: 100 },
    { title: '下载量', dataIndex: 'downloads', key: 'downloads', width: 100 },
    { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  ];

  const uploadData = userInfo?.uploads || [];

  // 用户收藏的壁纸
  const collectionColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '壁纸名称', dataIndex: 'name', key: 'name' },
    { title: '上传者', dataIndex: 'uploader', key: 'uploader', width: 120 },
    { title: '收藏时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  ];

  const collectionData = userInfo?.collections || [];

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
                src={userInfo.avatar_url || userInfo.avatar} 
              />
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                {userInfo.nickname || '--'}
              </h3>
              <p style={{ color: '#666', marginBottom: 8 }}>{userInfo.email}</p>
              <Tag color={userInfo.status === 'normal' ? 'success' : 'error'}>
                {userInfo.status === 'normal' ? '正常' : '已禁用'}
              </Tag>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="等级" value={userInfo.level} />
              </Col>
              <Col span={12}>
                <Statistic title="粉丝数" value={(userInfo as any).followersCount || 0} />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic title="关注数" value={(userInfo as any).followingCount || 0} />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic title="上传数" value={(userInfo as any).upload_count || userInfo.uploadCount || 0} />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic title="收藏数" value={(userInfo as any).collection_count || userInfo.collectionCount || 0} />
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
                <Tag color={userInfo.status === 'normal' ? 'success' : 'error'}>
                  {userInfo.status === 'normal' ? '正常' : '已禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间" span={2}>
                {formatTime((userInfo as any).created_at || userInfo.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录时间" span={2}>
                {formatTime((userInfo as any).updated_at || userInfo.lastLogin)}
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
                <PictureOutlined />
                上传的壁纸 ({(userInfo as any).upload_count || userInfo.uploadCount || 0})
              </span>
            }
            key="uploads"
          >
            <Table
              columns={uploadColumns}
              dataSource={uploadData}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <StarOutlined />
                收藏的壁纸 ({(userInfo as any).collection_count || userInfo.collectionCount || 0})
              </span>
            }
            key="collections"
          >
            <Table
              columns={collectionColumns}
              dataSource={collectionData}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default UserDetail;

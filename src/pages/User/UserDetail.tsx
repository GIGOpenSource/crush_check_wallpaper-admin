import React from 'react';
import { Card, Descriptions, Avatar, Tag, Statistic, Row, Col, Table, Tabs } from 'antd';
import { UserOutlined, PictureOutlined, StarOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';

const { TabPane } = Tabs;

const UserDetail: React.FC = () => {
  useParams<{ id: string }>();

  // 模拟用户详情数据
  const userInfo = {
    id: 1,
    email: 'user1@example.com',
    nickname: '用户1',
    gender: 1,
    avatar: '',
    level: 5,
    points: 1250,
    uploadCount: 23,
    collectionCount: 156,
    createdAt: '2026-01-15 10:30:00',
    lastLogin: '2026-04-17 09:20:00',
    status: 'normal',
  };

  // 用户上传的壁纸
  const uploadColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '壁纸名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '浏览量', dataIndex: 'views', key: 'views' },
    { title: '下载量', dataIndex: 'downloads', key: 'downloads' },
    { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  const uploadData = [
    { id: 1, name: '4K星空壁纸', category: 'PC壁纸', views: 12500, downloads: 3400, createdAt: '2026-04-15' },
    { id: 2, name: '动漫风景', category: '手机壁纸', views: 8200, downloads: 2100, createdAt: '2026-04-10' },
  ];

  // 用户收藏的壁纸
  const collectionColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '壁纸名称', dataIndex: 'name', key: 'name' },
    { title: '上传者', dataIndex: 'uploader', key: 'uploader' },
    { title: '收藏时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  const collectionData = [
    { id: 1, name: '极简风格壁纸', uploader: '用户A', createdAt: '2026-04-16' },
    { id: 2, name: '自然风光', uploader: '用户B', createdAt: '2026-04-14' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>用户详情</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={100} icon={<UserOutlined />} src={userInfo.avatar} />
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>{userInfo.nickname}</h3>
              <p style={{ color: '#666' }}>{userInfo.email}</p>
              <Tag color={userInfo.status === 'normal' ? 'success' : 'error'}>
                {userInfo.status === 'normal' ? '正常' : '已禁用'}
              </Tag>
            </div>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="等级" value={userInfo.level} />
              </Col>
              <Col span={8}>
                <Statistic title="积分" value={userInfo.points} />
              </Col>
              <Col span={8}>
                <Statistic title="上传" value={userInfo.uploadCount} />
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={16}>
          <Card title="基本信息">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="用户ID">{userInfo.id}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
              <Descriptions.Item label="昵称">{userInfo.nickname}</Descriptions.Item>
              <Descriptions.Item label="性别">
                {userInfo.gender === 1 ? '男' : userInfo.gender === 2 ? '女' : '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">{userInfo.createdAt}</Descriptions.Item>
              <Descriptions.Item label="最后登录">{userInfo.lastLogin}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={userInfo.status === 'normal' ? 'success' : 'error'}>
                  {userInfo.status === 'normal' ? '正常' : '已禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="收藏数">{userInfo.collectionCount}</Descriptions.Item>
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
                上传的壁纸 ({userInfo.uploadCount})
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
                收藏的壁纸 ({userInfo.collectionCount})
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

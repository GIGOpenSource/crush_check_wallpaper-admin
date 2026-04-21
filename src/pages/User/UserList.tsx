import React, { useState } from 'react';
import { Table, Card, Button, Input, Select, DatePicker, Space, Tag, Avatar, Dropdown, message } from 'antd';
import { UserOutlined, SearchOutlined, ReloadOutlined, MoreOutlined, EditOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;

interface User {
  id: number;
  email: string;
  nickname: string;
  gender: number;
  avatar: string;
  level: number;
  points: number;
  uploadCount: number;
  collectionCount: number;
  createdAt: string;
  lastLogin: string;
  status: 'normal' | 'disabled';
}

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 模拟用户数据
  const userData: User[] = [
    {
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
    },
    {
      id: 2,
      email: 'user2@example.com',
      nickname: '用户2',
      gender: 2,
      avatar: '',
      level: 3,
      points: 680,
      uploadCount: 8,
      collectionCount: 89,
      createdAt: '2026-02-20 14:15:00',
      lastLogin: '2026-04-16 18:45:00',
      status: 'normal',
    },
    {
      id: 3,
      email: 'user3@example.com',
      nickname: '用户3',
      gender: 0,
      avatar: '',
      level: 8,
      points: 2340,
      uploadCount: 45,
      collectionCount: 312,
      createdAt: '2025-12-01 09:00:00',
      lastLogin: '2026-04-17 08:30:00',
      status: 'disabled',
    },
  ];

  const handleViewDetail = (record: User) => {
    navigate(`/users/${record.id}`);
  };

  const handleEdit = (record: User) => {
    message.info(`编辑用户: ${record.nickname}`);
  };

  const handleDisable = (record: User) => {
    message.warning(`禁用用户: ${record.nickname}`);
  };

  const handleDelete = (record: User) => {
    message.error(`删除用户: ${record.nickname}`);
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => (
        <Avatar icon={<UserOutlined />} src={avatar} />
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: number) => {
        const map: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };
        return map[gender] || '未知';
      },
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      sorter: (a: User, b: User) => a.level - b.level,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      sorter: (a: User, b: User) => a.points - b.points,
    },
    {
      title: '上传数',
      dataIndex: 'uploadCount',
      key: 'uploadCount',
      width: 100,
    },
    {
      title: '收藏数',
      dataIndex: 'collectionCount',
      key: 'collectionCount',
      width: 100,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: User, b: User) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'normal' ? 'success' : 'error'}>
          {status === 'normal' ? '正常' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: User) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <UserOutlined />,
                label: '查看详情',
                onClick: () => handleViewDetail(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: '编辑',
                onClick: () => handleEdit(record),
              },
              {
                key: 'disable',
                icon: <StopOutlined />,
                label: record.status === 'normal' ? '禁用' : '启用',
                onClick: () => handleDisable(record),
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: '删除',
                danger: true,
                onClick: () => handleDelete(record),
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>用户管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索邮箱/昵称/ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="性别"
            style={{ width: 120 }}
            allowClear
            options={[
              { value: 0, label: '未知' },
              { value: 1, label: '男' },
              { value: 2, label: '女' },
            ]}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            options={[
              { value: 'normal', label: '正常' },
              { value: 'disabled', label: '已禁用' },
            ]}
          />
          <RangePicker placeholder={['注册开始', '注册结束']} />
          <Button type="primary" icon={<SearchOutlined />}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />}>重置</Button>
        </Space>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary">批量禁用</Button>
            <Button danger>批量删除</Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={userData}
          rowKey="id"
          loading={loading}
          pagination={{
            total: userData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{ type: 'checkbox' }}
        />
      </Card>
    </div>
  );
};

export default UserList;

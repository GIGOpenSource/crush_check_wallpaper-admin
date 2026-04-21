import React from 'react';
import { Table, Card, Button, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const AdminList: React.FC = () => {
  const admins = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: '超级管理员', status: 'normal', lastLogin: '2026-04-17 10:30' },
    { id: 2, username: 'operator1', email: 'op1@example.com', role: '操作员', status: 'normal', lastLogin: '2026-04-16 15:20' },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color={r === '超级管理员' ? 'red' : 'blue'}>{r}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="success">{s === 'normal' ? '正常' : '禁用'}</Tag> },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin' },
    { title: '操作', key: 'action', render: () => (
      <Space>
        <Button type="text" icon={<EditOutlined />}>编辑</Button>
        <Button type="text" danger icon={<DeleteOutlined />}>删除</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理员管理</h2>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />}>新增管理员</Button>
        </div>
        <Table columns={columns} dataSource={admins} rowKey="id" />
      </Card>
    </div>
  );
};

export default AdminList;

import React from 'react';
import { Table, Card, Button, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const RoleList: React.FC = () => {
  const roles = [
    { id: 1, name: '超级管理员', description: '拥有所有权限', userCount: 1 },
    { id: 2, name: '管理员', description: '除系统设置外的所有权限', userCount: 2 },
    { id: 3, name: '操作员', description: '内容管理、查看统计', userCount: 5 },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '角色名称', dataIndex: 'name', key: 'name', render: (n: string) => <Tag color="blue">{n}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount' },
    { title: '操作', key: 'action', render: () => (
      <>
        <Button type="text" icon={<EditOutlined />}>编辑</Button>
        <Button type="text" danger icon={<DeleteOutlined />}>删除</Button>
      </>
    )},
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>角色管理</h2>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />}>新增角色</Button>
        </div>
        <Table columns={columns} dataSource={roles} rowKey="id" />
      </Card>
    </div>
  );
};

export default RoleList;

import React from 'react';
import { Table, Card, Button, Space, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const ReportList: React.FC = () => {
  const reports = [
    { id: 1, type: '壁纸', target: '4K星空壁纸', reason: '侵权内容', reporter: '用户A', status: 'pending', createdAt: '2026-04-17' },
    { id: 2, type: '评论', target: '不当言论', reason: '辱骂他人', reporter: '用户B', status: 'resolved', createdAt: '2026-04-16' },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '举报对象', dataIndex: 'target', key: 'target' },
    { title: '举报原因', dataIndex: 'reason', key: 'reason' },
    { title: '举报人', dataIndex: 'reporter', key: 'reporter' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'pending' ? 'warning' : 'success'}>{s === 'pending' ? '待处理' : '已处理'}</Tag> },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '操作', key: 'action', render: () => (
      <Space>
        <Button type="primary" icon={<CheckOutlined />}>通过</Button>
        <Button icon={<CloseOutlined />}>忽略</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>举报处理</h2>
      <Card>
        <Table columns={columns} dataSource={reports} rowKey="id" />
      </Card>
    </div>
  );
};

export default ReportList;

import React from 'react';
import { Table, Card, Button, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const NotificationList: React.FC = () => {
  const navigate = useNavigate();
  const notifications = [
    { id: 1, title: '系统维护通知', type: 'system', target: '全部用户', sendTime: '2026-04-17', status: 'sent' },
    { id: 2, title: '新功能上线', type: 'feature', target: '全部用户', sendTime: '2026-04-16', status: 'sent' },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '发送对象', dataIndex: 'target', key: 'target' },
    { title: '发送时间', dataIndex: 'sendTime', key: 'sendTime' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="success">{s === 'sent' ? '已发送' : '待发送'}</Tag> },
    { title: '操作', key: 'action', render: () => <Button danger icon={<DeleteOutlined />} onClick={() => message.success('删除成功')}>删除</Button> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>通知列表</h2>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/notifications/send')}>发送通知</Button>
        </div>
        <Table columns={columns} dataSource={notifications} rowKey="id" />
      </Card>
    </div>
  );
};

export default NotificationList;

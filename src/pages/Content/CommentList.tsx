import React from 'react';
import { Table, Card, Button, Avatar, message } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';

const CommentList: React.FC = () => {
  const comments = [
    { id: 1, content: '这张壁纸真好看！', user: '用户1', avatar: '', wallpaper: '4K星空壁纸', likes: 23, createdAt: '2026-04-17 10:30' },
    { id: 2, content: '已收藏，谢谢分享', user: '用户2', avatar: '', wallpaper: '动漫风景', likes: 15, createdAt: '2026-04-17 09:20' },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '用户', dataIndex: 'user', key: 'user', render: (text: string) => <><Avatar icon={<UserOutlined />} size="small" /> {text}</> },
    { title: '评论内容', dataIndex: 'content', key: 'content' },
    { title: '所属壁纸', dataIndex: 'wallpaper', key: 'wallpaper' },
    { title: '点赞', dataIndex: 'likes', key: 'likes' },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '操作', key: 'action', render: () => <Button danger icon={<DeleteOutlined />} onClick={() => message.success('删除成功')}>删除</Button> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>评论管理</h2>
      <Card>
        <Table columns={columns} dataSource={comments} rowKey="id" />
      </Card>
    </div>
  );
};

export default CommentList;

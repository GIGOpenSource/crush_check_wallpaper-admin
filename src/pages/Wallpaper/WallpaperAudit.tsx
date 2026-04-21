import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Image, Modal, message } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';

interface Wallpaper {
  id: number;
  name: string;
  thumbUrl: string;
  url: string;
  category: string[];
  tags: string[];
  width: number;
  height: number;
  format: string;
  description: string;
  uploader: string;
  uploaderId: number;
  createdAt: string;
}

const WallpaperAudit: React.FC = () => {
  const [loading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 模拟待审核壁纸数据
  const pendingData: Wallpaper[] = [
    {
      id: 1,
      name: '4K星空壁纸',
      thumbUrl: 'https://via.placeholder.com/200x120',
      url: 'https://via.placeholder.com/1920x1080',
      category: ['PC壁纸', '静态壁纸'],
      tags: ['星空', '4K', '夜景'],
      width: 3840,
      height: 2160,
      format: 'jpg',
      description: '这是一张精美的4K星空壁纸',
      uploader: '用户1',
      uploaderId: 1,
      createdAt: '2026-04-17 10:30:00',
    },
    {
      id: 2,
      name: '动漫风景',
      thumbUrl: 'https://via.placeholder.com/200x120',
      url: 'https://via.placeholder.com/1080x1920',
      category: ['手机壁纸', '静态壁纸'],
      tags: ['动漫', '风景', '日系'],
      width: 1080,
      height: 1920,
      format: 'png',
      description: '日系动漫风格风景壁纸',
      uploader: '用户2',
      uploaderId: 2,
      createdAt: '2026-04-17 09:20:00',
    },
    {
      id: 3,
      name: '动态雨滴',
      thumbUrl: 'https://via.placeholder.com/200x120',
      url: 'https://via.placeholder.com/1920x1080',
      category: ['PC壁纸', '动态壁纸'],
      tags: ['动态', '雨滴', '治愈'],
      width: 1920,
      height: 1080,
      format: 'mp4',
      description: '治愈系动态雨滴壁纸',
      uploader: '用户3',
      uploaderId: 3,
      createdAt: '2026-04-17 08:15:00',
    },
  ];

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  const handlePass = (record: Wallpaper) => {
    Modal.confirm({
      title: '确认通过',
      content: `确定要通过壁纸 "${record.name}" 的审核吗？`,
      onOk: () => {
        message.success(`已通过: ${record.name}`);
      },
    });
  };

  const handleReject = (record: Wallpaper) => {
    Modal.confirm({
      title: '确认拒绝',
      content: `确定要拒绝壁纸 "${record.name}" 吗？`,
      onOk: () => {
        message.error(`已拒绝: ${record.name}`);
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '预览',
      dataIndex: 'thumbUrl',
      key: 'thumbUrl',
      width: 150,
      render: (url: string, record: Wallpaper) => (
        <Image
          src={url}
          width={120}
          height={72}
          style={{ objectFit: 'cover', cursor: 'pointer' }}
          preview={false}
          onClick={() => handlePreview(record.url)}
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (categories: string[]) => (
        <Space wrap>
          {categories.map((cat) => (
            <Tag key={cat}>{cat}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags.map((tag) => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '尺寸',
      key: 'size',
      width: 120,
      render: (_: unknown, record: Wallpaper) => `${record.width}x${record.height}`,
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 80,
    },
    {
      title: '上传者',
      dataIndex: 'uploader',
      key: 'uploader',
      width: 100,
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Wallpaper) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record.url)}
          >
            预览
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => handlePass(record)}
          >
            通过
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>壁纸审核</h2>
      
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Tag color="warning">待审核: {pendingData.length}</Tag>
            <Button type="primary">批量通过</Button>
            <Button danger>批量拒绝</Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={pendingData}
          rowKey="id"
          loading={loading}
          pagination={{
            total: pendingData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{ type: 'checkbox' }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={1000}
      >
        <img
          alt="preview"
          style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default WallpaperAudit;

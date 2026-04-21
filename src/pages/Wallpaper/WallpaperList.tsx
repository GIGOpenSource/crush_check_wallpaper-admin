import React, { useState } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Image, Dropdown, message, Modal, Form, Tabs } from 'antd';
import { SearchOutlined, ReloadOutlined, MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckOutlined, CloseOutlined, GlobalOutlined } from '@ant-design/icons';

interface Wallpaper {
  id: number;
  name: string;
  thumbUrl: string;
  category: string[];
  tags: string[];
  width: number;
  height: number;
  format: string;
  views: number;
  downloads: number;
  likes: number;
  collections: number;
  hotScore: number;
  uploader: string;
  createdAt: string;
  status: 'normal' | 'pending' | 'rejected' | 'disabled';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  altText?: string;
}

const { TabPane } = Tabs;

const WallpaperList: React.FC = () => {
  const [loading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null);
  const [form] = Form.useForm();

  // 模拟壁纸数据
  const wallpaperData: Wallpaper[] = [
    {
      id: 1,
      name: '4K星空壁纸',
      thumbUrl: 'https://via.placeholder.com/100x60',
      category: ['PC壁纸', '静态壁纸'],
      tags: ['星空', '4K', '夜景'],
      width: 3840,
      height: 2160,
      format: 'jpg',
      views: 12500,
      downloads: 3400,
      likes: 890,
      collections: 567,
      hotScore: 15680,
      uploader: '用户1',
      createdAt: '2026-04-15 10:30:00',
      status: 'normal',
      seoTitle: '4K星空壁纸 - 高清夜景桌面壁纸下载',
      seoDescription: '精选4K超高清星空壁纸，3840x2160分辨率，完美适配电脑桌面，免费下载使用',
      seoKeywords: ['4K壁纸', '星空壁纸', '夜景壁纸', '高清壁纸'],
      altText: '4K超高清星空夜景壁纸',
    },
    {
      id: 2,
      name: '动漫风景',
      thumbUrl: 'https://via.placeholder.com/100x60',
      category: ['手机壁纸', '静态壁纸'],
      tags: ['动漫', '风景', '日系'],
      width: 1080,
      height: 1920,
      format: 'png',
      views: 8200,
      downloads: 2100,
      likes: 567,
      collections: 423,
      hotScore: 9820,
      uploader: '用户2',
      createdAt: '2026-04-14 15:20:00',
      status: 'normal',
      seoTitle: '动漫风景壁纸 - 日系二次元手机壁纸',
      seoDescription: '精选日系动漫风格风景壁纸，1080x1920分辨率，适配手机屏幕',
      seoKeywords: ['动漫壁纸', '日系壁纸', '二次元', '手机壁纸'],
      altText: '日系动漫风景手机壁纸',
    },
    {
      id: 3,
      name: '动态雨滴',
      thumbUrl: 'https://via.placeholder.com/100x60',
      category: ['PC壁纸', '动态壁纸'],
      tags: ['动态', '雨滴', '治愈'],
      width: 1920,
      height: 1080,
      format: 'mp4',
      views: 5600,
      downloads: 1200,
      likes: 345,
      collections: 234,
      hotScore: 6780,
      uploader: '用户3',
      createdAt: '2026-04-13 09:15:00',
      status: 'pending',
      seoTitle: '动态雨滴壁纸 - 治愈系Live壁纸',
      seoDescription: '治愈系动态雨滴壁纸，动态Live效果，让桌面更有生命力',
      seoKeywords: ['动态壁纸', 'Live壁纸', '雨滴', '治愈系'],
      altText: '动态雨滴治愈系壁纸',
    },
  ];

  const handleView = (record: Wallpaper) => {
    message.info(`查看壁纸: ${record.name}`);
  };

  const handleEdit = (record: Wallpaper) => {
    setEditingWallpaper(record);
    form.setFieldsValue({
      name: record.name,
      seoTitle: record.seoTitle || '',
      seoDescription: record.seoDescription || '',
      seoKeywords: record.seoKeywords?.join(', ') || '',
      altText: record.altText || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    form.validateFields().then((values) => {
      message.success(`保存成功: ${values.name}`);
      setEditModalVisible(false);
    });
  };

  const handleDelete = (record: Wallpaper) => {
    message.error(`删除壁纸: ${record.name}`);
  };

  const handleAudit = (record: Wallpaper, pass: boolean) => {
    message.success(`${pass ? '通过' : '拒绝'}审核: ${record.name}`);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '缩略图',
      dataIndex: 'thumbUrl',
      key: 'thumbUrl',
      width: 120,
      render: (url: string) => (
        <Image src={url} width={100} height={60} style={{ objectFit: 'cover' }} />
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
      title: '浏览',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      sorter: (a: Wallpaper, b: Wallpaper) => a.views - b.views,
    },
    {
      title: '下载',
      dataIndex: 'downloads',
      key: 'downloads',
      width: 100,
      sorter: (a: Wallpaper, b: Wallpaper) => a.downloads - b.downloads,
    },
    {
      title: '热度',
      dataIndex: 'hotScore',
      key: 'hotScore',
      width: 100,
      sorter: (a: Wallpaper, b: Wallpaper) => a.hotScore - b.hotScore,
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
      sorter: (a: Wallpaper, b: Wallpaper) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          normal: { color: 'success', text: '正常' },
          pending: { color: 'warning', text: '待审核' },
          rejected: { color: 'error', text: '已拒绝' },
          disabled: { color: 'default', text: '已下架' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Wallpaper) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          {record.status === 'pending' && (
            <>
              <Button type="text" icon={<CheckOutlined />} style={{ color: '#52c41a' }} onClick={() => handleAudit(record, true)} />
              <Button type="text" icon={<CloseOutlined />} style={{ color: '#f5222d' }} onClick={() => handleAudit(record, false)} />
            </>
          )}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'seo',
                  icon: <GlobalOutlined />,
                  label: 'SEO设置',
                  onClick: () => handleEdit(record),
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>壁纸管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索名称/ID/标签"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="平台"
            style={{ width: 120 }}
            allowClear
            options={[
              { value: 'PC', label: 'PC壁纸' },
              { value: 'PHONE', label: '手机壁纸' },
            ]}
          />
          <Select
            placeholder="类型"
            style={{ width: 120 }}
            allowClear
            options={[
              { value: 'static', label: '静态壁纸' },
              { value: 'live', label: '动态壁纸' },
            ]}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            options={[
              { value: 'normal', label: '正常' },
              { value: 'pending', label: '待审核' },
              { value: 'rejected', label: '已拒绝' },
              { value: 'disabled', label: '已下架' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />}>重置</Button>
        </Space>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary">批量通过</Button>
            <Button danger>批量拒绝</Button>
            <Button danger>批量删除</Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={wallpaperData}
          rowKey="id"
          loading={loading}
          pagination={{
            total: wallpaperData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{ type: 'checkbox' }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 编辑/SEO设置弹窗 */}
      <Modal
        title={`编辑壁纸 - ${editingWallpaper?.name}`}
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Form.Item name="name" label="壁纸名称" rules={[{ required: true }]}>
                <Input placeholder="请输入壁纸名称" />
              </Form.Item>
              <Form.Item name="altText" label="图片Alt文本">
                <Input placeholder="请输入图片Alt描述，用于SEO和 accessibility" />
              </Form.Item>
            </TabPane>
            <TabPane tab="SEO设置" key="seo">
              <Form.Item name="seoTitle" label="SEO标题">
                <Input placeholder="建议50-60个字符，包含关键词" maxLength={60} showCount />
              </Form.Item>
              <Form.Item name="seoDescription" label="SEO描述">
                <Input.TextArea 
                  rows={3} 
                  placeholder="建议150-160个字符，描述壁纸内容"
                  maxLength={160}
                  showCount
                />
              </Form.Item>
              <Form.Item name="seoKeywords" label="SEO关键词">
                <Input placeholder="多个关键词用逗号分隔，如：4K壁纸,星空壁纸,高清" />
              </Form.Item>
              <div style={{ background: '#f6ffed', padding: 12, borderRadius: 4, marginTop: 16 }}>
                <strong>SEO优化建议：</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>标题应包含主要关键词，长度控制在60字符以内</li>
                  <li>描述应准确概括内容，吸引用户点击</li>
                  <li>关键词数量建议3-5个，避免堆砌</li>
                  <li>Alt文本应描述图片内容，便于搜索引擎理解</li>
                </ul>
              </div>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </div>
  );
};

export default WallpaperList;

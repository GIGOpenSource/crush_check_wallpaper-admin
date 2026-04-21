import React, { useState } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface TagItem {
  id: number;
  name: string;
  wallpaperCount: number;
  createdAt: string;
}

const TagList: React.FC = () => {
  const [loading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // 模拟标签数据
  const tagData: TagItem[] = [
    { id: 1, name: '星空', wallpaperCount: 1250, createdAt: '2026-01-15 10:30:00' },
    { id: 2, name: '动漫', wallpaperCount: 980, createdAt: '2026-01-16 14:20:00' },
    { id: 3, name: '风景', wallpaperCount: 1560, createdAt: '2026-01-17 09:15:00' },
    { id: 4, name: '4K', wallpaperCount: 2340, createdAt: '2026-01-18 16:45:00' },
    { id: 5, name: '极简', wallpaperCount: 670, createdAt: '2026-01-19 11:30:00' },
  ];

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: TagItem) => {
    setEditingTag(record);
    form.setFieldsValue({ name: record.name });
    setModalVisible(true);
  };

  const handleDelete = (record: TagItem) => {
    message.success(`删除标签: ${record.name}`);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingTag) {
        message.success(`更新标签: ${values.name}`);
      } else {
        message.success(`创建标签: ${values.name}`);
      }
      setModalVisible(false);
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '壁纸数量',
      dataIndex: 'wallpaperCount',
      key: 'wallpaperCount',
      sorter: (a: TagItem, b: TagItem) => a.wallpaperCount - b.wallpaperCount,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: TagItem, b: TagItem) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: TagItem) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除标签 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>标签管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索标签名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />}>
            搜索
          </Button>
        </Space>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增标签
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={tagData}
          rowKey="id"
          loading={loading}
          pagination={{
            total: tagData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingTag ? '编辑标签' : '新增标签'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TagList;

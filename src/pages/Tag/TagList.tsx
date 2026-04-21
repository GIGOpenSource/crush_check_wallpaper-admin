import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  getTagList, 
  createTag, 
  updateTag, 
  deleteTag,
  type Tag as TagItem,
  type CreateOrUpdateTagParams
} from '../../services/tagApi';

const TagList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<TagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // 加载标签列表
  useEffect(() => {
    loadTagList();
  }, [currentPage, pageSize]);

  const loadTagList = async (search?: string) => {
    setLoading(true);
    try {
      const params = {
        currentPage,
        pageSize,
        ...(search && { name: search }),
      };
      const response = await getTagList(params);
      setDataSource(response.results);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('加载标签列表失败:', error);
      message.error('加载标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadTagList(searchText);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setCurrentPage(1);
    loadTagList();
  };

  // 新增标签
  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑标签
  const handleEdit = (record: TagItem) => {
    setEditingTag(record);
    form.setFieldsValue({ name: record.name });
    setModalVisible(true);
  };

  // 删除标签
  const handleDelete = async (record: TagItem) => {
    try {
      await deleteTag(record.id);
      message.success(`删除标签: ${record.name} 成功`);
      loadTagList(searchText);
    } catch (error) {
      console.error('删除标签失败:', error);
      message.error('删除标签失败');
    }
  };

  // 提交表单
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const params: CreateOrUpdateTagParams = { name: values.name };
      
      if (editingTag) {
        // 更新标签
        await updateTag(editingTag.id, params);
        message.success(`更新标签: ${values.name} 成功`);
      } else {
        // 创建标签
        await createTag(params);
        message.success(`创建标签成功`);
      }
      
      // 关闭弹窗
      setModalVisible(false);
      // 重新加载列表
      loadTagList(searchText);
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');
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
      dataIndex: 'wallpaper_count',
      key: 'wallpaper_count',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      render: (text: string) => formatTime(text),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: TagItem) => (
        <Space size={2}>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除标签 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
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
            onPressEnter={handleSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
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
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
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

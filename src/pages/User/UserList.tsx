import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Avatar, message, Modal, Form, Popconfirm, Upload } from 'antd';
import { UserOutlined, SearchOutlined, ReloadOutlined, MoreOutlined, EditOutlined, StopOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  getCustomerUserList, 
  deleteCustomerUser, 
  batchDisableCustomerUsers, 
  batchDeleteCustomerUsers,
  updateCustomerUser,
  type CustomerUser,
  type GetCustomerUserListParams 
} from '../../services/userApi';

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<CustomerUser[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    nickname: '',
    email: '',
    status: undefined as string | undefined,
    gender: undefined as number | undefined,
  });

  // 编辑弹窗
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<CustomerUser | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 加载用户列表
  const loadUserList = async (params: GetCustomerUserListParams = searchParams) => {
    setLoading(true);
    try {
      const response = await getCustomerUserList(params);
      setDataSource(response.results);
      setTotal(response.pagination.total);
      setCurrentPage(response.pagination.currentPage);    // 使用 currentPage
      setPageSize(response.pagination.page_size);
    } catch (error) {
      console.error('加载用户列表失败:', error);
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadUserList();
  }, []);

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadUserList({ ...searchParams, currentPage: 1, pageSize });
  };

  // 重置
  const handleReset = () => {
    const initialParams = {
      nickname: '',
      email: '',
      status: undefined as string | undefined,
      gender: undefined as number | undefined,
    };
    setSearchParams(initialParams);
    setCurrentPage(1);
    loadUserList({ ...initialParams, currentPage: 1, pageSize: 10 });
  };

  // 查看详情
  const handleViewDetail = (record: CustomerUser) => {
    navigate(`/users/${record.id}`);
  };

  // 打开编辑弹窗
  const handleEdit = (record: CustomerUser) => {
    setEditingUser(record);
    form.setFieldsValue({
      nickname: record.nickname,
      email: record.email,
      gender: record.gender,
      level: record.level,
      avatar_url: record.avatar_url,
    });
    setEditModalVisible(true);
  };

  // 提交编辑
  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        // 构建后端API期望的字段
        const apiData = {
          nickname: values.nickname,
          gender: values.gender,
          level: values.level,
          avatar_url: values.avatar_url,
        };
        await updateCustomerUser(editingUser.id, apiData);
        message.success('更新成功');
        setEditModalVisible(false);
        loadUserList(searchParams);
      }
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败');
    }
  };

  // 禁用/启用用户
  const handleToggleStatus = async (record: CustomerUser) => {
    try {
      const newStatus = record.status === 1 ? 2 : 1;
      await updateCustomerUser(record.id, { status: newStatus });
      message.success(newStatus === 1 ? '启用成功' : '禁用成功');
      loadUserList(searchParams);
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  // 删除用户
  const handleDelete = async (record: CustomerUser) => {
    try {
      await deleteCustomerUser(record.id);
      message.success('删除成功');
      loadUserList(searchParams);
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 批量禁用
  const handleBatchDisable = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要禁用的用户');
      return;
    }
    try {
      await batchDisableCustomerUsers(selectedRowKeys as number[]);
      message.success('批量禁用成功');
      setSelectedRowKeys([]);
      loadUserList(searchParams);
    } catch (error) {
      console.error('批量禁用失败:', error);
      message.error('批量禁用失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的用户');
      return;
    }
    try {
      await batchDeleteCustomerUsers(selectedRowKeys as number[]);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      loadUserList(searchParams);
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '头像',
      dataIndex: 'avatar_url',
      key: 'avatar_url',
      width: 80,
      render: (avatar_url: string) => (
        <Avatar icon={<UserOutlined />} src={avatar_url} />
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
      render: (text: string) => text || '--',
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
      // sorter: true,
    },
    {
      title: '粉丝数',
      dataIndex: 'followers_count',
      key: 'followers_count',
      width: 100,
      // sorter: true,
    },
    {
      title: '关注数',
      dataIndex: 'following_count',
      key: 'following_count',
      width: 100,
      // sorter: true,
    },
    {
      title: '上传数',
      dataIndex: 'upload_count',
      key: 'upload_count',
      width: 100,
    },
    {
      title: '收藏数',
      dataIndex: 'collection_count',
      key: 'collection_count',
      width: 100,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      sorter: true,
      render: (text: string) => {
        if (!text) return '-';
        // 格式化时间：2026-04-21 09:19:04
        return new Date(text).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-');
      },
      // sorter: (a: Wallpaper, b: Wallpaper) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
    },
    {
      title: '最后登录',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 200,
      render: (text: string) => {
        if (!text) return '-';
        // 格式化时间：2026-04-21 09:19:04
        return new Date(text).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-');
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 1 | 2) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '正常' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: unknown, record: CustomerUser) => (
        <Space size={2}>
          <Button 
            type="link" 
            size="small" 
            icon={<UserOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={record.status === 1 ? <StopOutlined /> : <UserOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个用户吗？"
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
      <h2 style={{ marginBottom: 24 }}>用户管理</h2>
      
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索昵称"
            value={searchParams.nickname}
            onChange={(e) => setSearchParams({ ...searchParams, nickname: e.target.value })}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Input
            placeholder="搜索邮箱"
            value={searchParams.email}
            onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="性别"
            style={{ width: 120 }}
            allowClear
            value={searchParams.gender}
            onChange={(value) => setSearchParams({ ...searchParams, gender: value })}
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
            value={searchParams.status}
            onChange={(value) => setSearchParams({ ...searchParams, status: value ? String(value) : undefined })}
            options={[
              { value: '1', label: '正常' },
              { value: '2', label: '已禁用' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 表格区域 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Popconfirm
              title="确认批量禁用"
              description={`确定要禁用选中的 ${selectedRowKeys.length} 个用户吗？`}
              onConfirm={handleBatchDisable}
              okText="确定"
              cancelText="取消"
              disabled={selectedRowKeys.length === 0}
            >
              <Button disabled={selectedRowKeys.length === 0}>批量禁用</Button>
            </Popconfirm>
            <Popconfirm
              title="确认批量删除"
              description={`确定要删除选中的 ${selectedRowKeys.length} 个用户吗？此操作不可恢复！`}
              onConfirm={handleBatchDelete}
              okText="确定删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              disabled={selectedRowKeys.length === 0}
            >
              <Button danger disabled={selectedRowKeys.length === 0}>批量删除</Button>
            </Popconfirm>
          </Space>
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
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
              loadUserList({ ...searchParams, currentPage: page, pageSize: size });
            },
          }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱' }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select>
              <Select.Option value={0}>未知</Select.Option>
              <Select.Option value={1}>男</Select.Option>
              <Select.Option value={2}>女</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="level" label="等级" rules={[{ required: true, message: '请输入等级' }]}>
            <Input type="number" min={1} max={100} />
          </Form.Item>
          <Form.Item name="avatar_url" label="头像">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 头像预览 */}
              <div>
                {form.getFieldValue('avatar_url') ? (
                  <Avatar
                    src={form.getFieldValue('avatar_url')}
                    size={80}
                  />
                ) : (
                  <Avatar size={80} icon={<UserOutlined />} />
                )}
              </div>
              {/* 上传按钮 */}
              <Upload
                name="file"
                action="/api/client/upload-image/"
                headers={{
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                }}
                showUploadList={false}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('只能上传图片文件!');
                    return false;
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error('图片大小不能超过 2MB!');
                    return false;
                  }
                  return true;
                }}
                onChange={(info) => {
                  if (info.file.status === 'uploading') {
                    setUploading(true);
                  }
                  if (info.file.status === 'done') {
                    setUploading(false);
                    // 获取上传后的图片URL
                    const imageUrl = info.file.response?.url || info.file.response?.data?.url;
                    if (imageUrl) {
                      form.setFieldValue('avatar_url', imageUrl);
                      message.success('头像上传成功');
                    }
                  } else if (info.file.status === 'error') {
                    setUploading(false);
                    message.error('头像上传失败');
                  }
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  上传头像
                </Button>
              </Upload>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;

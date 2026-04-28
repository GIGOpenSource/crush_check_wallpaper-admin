import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { 
  getRoleList, 
  createRole, 
  updateRole, 
  deleteRole,
  type Role,
} from '../../services/roleApi';

const { Option } = Select;
const { TextArea } = Input;

const RoleList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  
  // 搜索状态
  const [searchName, setSearchName] = useState('');

  // 加载角色列表
  const loadRoles = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const response = await getRoleList(page, pageSize, {
        name: searchName || undefined,
      });
      setRoles(response.results || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('加载角色列表失败:', error);
      message.error('加载角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles(1);
  }, []);

  // 打开新增弹窗
  const handleAddRole = () => {
    setEditingRole(null);
    setModalTitle('新增角色');
    form.resetFields();
    form.setFieldsValue({ user_type: 'admin' });
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEditRole = (record: Role) => {
    setEditingRole(record);
    setModalTitle('编辑角色');
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      user_type: record.user_type || 'admin',
    });
    setModalVisible(true);
  };

  // 保存角色
  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingRole) {
        // 编辑模式
        await updateRole(editingRole.id, values);
        message.success('角色信息更新成功');
      } else {
        // 新增模式
        await createRole(values);
        message.success('角色创建成功');
      }
      
      setModalVisible(false);
      loadRoles(currentPage);
    } catch (error) {
      console.error('保存角色失败:', error);
      message.error('保存角色失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除角色
  const handleDeleteRole = async (id: number) => {
    try {
      setLoading(true);
      await deleteRole(id);
      message.success('角色删除成功');
      loadRoles(currentPage);
    } catch (error) {
      console.error('删除角色失败:', error);
      message.error('删除角色失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadRoles(1);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchName('');
    setCurrentPage(1);
    loadRoles(1);
  };

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80,
    },
    { 
      title: '角色名称', 
      dataIndex: 'name', 
      key: 'name',
      width: 150,
      ellipsis: true,
      render: (name: string) => (
        <Tag color="blue">{name}</Tag>
      ),
    },
    { 
      title: '角色编码', 
      dataIndex: 'code', 
      key: 'code',
      width: 150,
      render: (code: string) => code || '--',
    },
    { 
      title: '用户类型', 
      dataIndex: 'user_type', 
      key: 'user_type',
      width: 120,
      render: (userType: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          admin: { color: 'red', text: '管理员' },
          customer: { color: 'blue', text: '普通用户' },
        };
        const config = typeMap[userType] || { color: 'default', text: userType || '--' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    { 
      title: '描述', 
      dataIndex: 'description', 
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '--',
    },
    { 
      title: '用户数', 
      dataIndex: 'user_count', 
      key: 'user_count',
      width: 100,
      render: (count: number) => count || 0,
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      width: 180,
      render: (time: string) => {
        if (!time) return '--';
        return new Date(time).toLocaleString('zh-CN', {
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
      title: '操作', 
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Role) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此角色吗？"
            description={`删除后，关联的${record.user_count || 0}个用户将失去该角色权限`}
            onConfirm={() => handleDeleteRole(record.id)}
            okText="删除"
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
      <h2 style={{ marginBottom: 24 }}>角色管理</h2>
      <Card>
        {/* 搜索区域 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* 左侧：新增按钮 */}
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddRole}
          >
            新增角色
          </Button>
          
          {/* 右侧：搜索框 */}
          <Space>
            <Input
              placeholder="搜索角色名称"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page) => {
              setCurrentPage(page);
              loadRoles(page);
            },
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: '暂无角色数据' }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveRole}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色名称"
            name="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item
            label="角色编码"
            name="code"
          >
            <Input placeholder="请输入角色编码（如：admin, operator）" />
          </Form.Item>

          <Form.Item
            label="用户类型"
            name="user_type"
            rules={[{ required: true, message: '请选择用户类型' }]}
          >
            <Select placeholder="请选择用户类型">
              <Option value="admin">管理员</Option>
              <Option value="customer">普通用户</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="请输入角色描述"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleList;

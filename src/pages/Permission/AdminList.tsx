import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, Select, message, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { 
  getAdminList, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin,
  type Admin,
} from '../../services/adminApi';
import { getRoleList, type Role } from '../../services/roleApi';

const { Option } = Select;
const { TextArea } = Input;

const AdminList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [form] = Form.useForm();
  
  // 角色列表
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  
  // 搜索状态
  const [searchUsername, setSearchUsername] = useState('');

  // 加载管理员列表
  const loadAdmins = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const response = await getAdminList(page, pageSize, {
        username: searchUsername || undefined,
      });
      setAdmins(response.results || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('加载管理员列表失败:', error);
      message.error('加载管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载角色列表
  const loadRoles = async () => {
    setRoleLoading(true);
    try {
      const response = await getRoleList(1, 100, { status: 1 });
      setRoles(response.results || []);
    } catch (error) {
      console.error('加载角色列表失败:', error);
      message.error('加载角色列表失败');
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins(1);
    loadRoles();
  }, []);

  // 打开新增弹窗
  const handleAddAdmin = () => {
    setEditingAdmin(null);
    setModalTitle('新增管理员');
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEditAdmin = (record: Admin) => {
    setEditingAdmin(record);
    setModalTitle('编辑管理员');
    
    // 确保角色列表加载完成后再设置表单值
    if (roles.length === 0) {
      // 如果角色列表还未加载，先加载角色列表
      loadRoles().then(() => {
        setTimeout(() => {
          form.setFieldsValue({
            username: record.username,
            email: record.email,
            phone: record.phone,
            role_id: record.role_id,
            remark: record.remark,
          });
        }, 100);
      });
    } else {
      // 角色列表已加载，直接设置表单值
      form.setFieldsValue({
        username: record.username,
        email: record.email,
        phone: record.phone,
        role_id: record.role_id,
        remark: record.remark,
      });
    }
    
    setModalVisible(true);
  };

  // 保存管理员
  const handleSaveAdmin = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingAdmin) {
        // 编辑模式：如果密码为空，则不传递密码字段
        const updateData = { ...values };
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        await updateAdmin(editingAdmin.id, updateData);
        message.success('管理员信息更新成功');
      } else {
        // 新增模式
        await createAdmin(values);
        message.success('管理员创建成功');
      }
      
      setModalVisible(false);
      loadAdmins(currentPage);
    } catch (error: any) {
      console.error('保存管理员失败:', error);
      // 拦截器已经显示了错误提示，这里不需要重复显示
      // 如果需要在业务层自定义错误处理，可以配置 showErrorMessage: false
    } finally {
      setLoading(false);
    }
  };

  // 删除管理员
  const handleDeleteAdmin = async (id: number) => {
    try {
      setLoading(true);
      await deleteAdmin(id);
      message.success('管理员删除成功');
      loadAdmins(currentPage);
    } catch (error: any) {
      console.error('删除管理员失败:', error);
      // 展示后端返回的具体错误信息
      const errorMsg = error?.message || error?.response?.data?.message || '删除管理员失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadAdmins(1);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchUsername('');
    setCurrentPage(1);
    loadAdmins(1);
  };

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80,
    },
    { 
      title: '用户名', 
      dataIndex: 'username', 
      key: 'username',
      width: 150,
      ellipsis: true,
    },
    { 
      title: '邮箱', 
      dataIndex: 'email', 
      key: 'email',
      width: 200,
      ellipsis: true,
      render: (email: string) => email || '--',
    },
    { 
      title: '手机号', 
      dataIndex: 'phone', 
      key: 'phone',
      width: 150,
      render: (phone: string) => phone || '--',
    },
    { 
      title: '角色', 
      dataIndex: 'role_display', 
      key: 'role_display',
      width: 150,
      render: (roleDisplay: string) => (
        <Tag color={roleDisplay === '超级管理员' ? 'red' : 'blue'}>
          {roleDisplay || '未分配'}
        </Tag>
      ),
    },
    { 
      title: '最后登录', 
      dataIndex: 'last_login', 
      key: 'last_login',
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
      render: (_: unknown, record: Admin) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleEditAdmin(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此管理员吗？"
            description="删除后该管理员将无法登录系统"
            onConfirm={() => handleDeleteAdmin(record.id)}
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
      <h2 style={{ marginBottom: 24 }}>管理员管理</h2>
      <Card>
        {/* 搜索区域 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* 左侧：新增按钮 */}
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddAdmin}
          >
            新增管理员
          </Button>
          
          {/* 右侧：搜索框 */}
          <Space>
            <Input
              placeholder="搜索用户名"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
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
          dataSource={admins}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page) => {
              setCurrentPage(page);
              loadAdmins(page);
            },
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: '暂无管理员数据' }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveAdmin}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingAdmin} />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={
              editingAdmin
                ? [] // 编辑时密码非必填
                : [
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码长度不能少于6位' },
                  ]
            }
            tooltip={editingAdmin ? '留空则不修改密码' : undefined}
          >
            <Input.Password 
              placeholder={editingAdmin ? "请输入新密码（留空则不修改）" : "请输入密码（至少6位）"} 
            />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role_id"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select 
              placeholder="请选择角色"
              loading={roleLoading}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
          >
            <TextArea
              rows={4}
              placeholder="请输入备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminList;

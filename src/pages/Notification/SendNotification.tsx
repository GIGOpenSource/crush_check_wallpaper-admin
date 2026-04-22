import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Radio, message, Space, Modal, Table } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sendNotification, type SendNotificationParams } from '../../services/notificationApi';
import { getCustomerUserList, type CustomerUser } from '../../services/userApi';

const { TextArea } = Input;

const SendNotification: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userList, setUserList] = useState<CustomerUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 加载用户列表
  const loadUsers = async (page = 1) => {
    setUserLoading(true);
    try {
      const response = await getCustomerUserList({
        currentPage: page,
        pageSize: 100, // 获取更多用户以便选择
      });
      setUserList(response.results);
      setPagination({
        current: response.pagination.currentPage,
        pageSize: response.pagination.page_size,
        total: response.pagination.total,
      });
    } catch (error) {
      console.error('加载用户列表失败:', error);
      message.error('加载用户列表失败');
    } finally {
      setUserLoading(false);
    }
  };

  // 当打开用户选择弹窗时加载用户
  useEffect(() => {
    if (userModalVisible) {
      loadUsers();
    }
  }, [userModalVisible]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const params: SendNotificationParams = {
        title: values.title,
        content: values.content,
        notification_type: values.notification_type,
        send_to: values.send_to,
      };
      
      // 如果选择部分用户，添加user_ids
      if (values.send_to === 'specific' && selectedUserIds.length > 0) {
        params.user_ids = selectedUserIds;
      }
      
      await sendNotification(params);
      message.success('通知发送成功');
      form.resetFields();
      setSelectedUserIds([]);
      // 延迟跳转到列表页
      setTimeout(() => {
        navigate('/notifications');
      }, 1000);
    } catch (error) {
      console.error('发送通知失败:', error);
      message.error('发送通知失败');
    } finally {
      setLoading(false);
    }
  };

  // 用户选择表格列定义
  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
  ];

  // 打开用户选择弹窗
  const handleOpenUserModal = () => {
    setUserModalVisible(true);
  };

  // 确认选择用户
  const handleConfirmUsers = () => {
    setUserModalVisible(false);
    message.success(`已选择 ${selectedUserIds.length} 个用户`);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>发送通知</h2>
      <Card>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          initialValues={{
            send_to: 'all',
            notification_type: 'system',
          }}
        >
          <Form.Item 
            name="title" 
            label="通知标题" 
            rules={[{ required: true, message: '请输入通知标题' }]}
          >
            <Input placeholder="请输入通知标题" maxLength={100} showCount />
          </Form.Item>
          
          <Form.Item 
            name="notification_type" 
            label="通知类型" 
            rules={[{ required: true, message: '请选择通知类型' }]}
          >
            <Select 
              placeholder="请选择通知类型"
              options={[
                { value: 'system', label: '系统通知' },
                { value: 'feature', label: '功能更新' },
                { value: 'Activity', label: '活动通知' },
              ]} 
            />
          </Form.Item>
          
          <Form.Item 
            name="send_to" 
            label="发送对象" 
            rules={[{ required: true, message: '请选择发送对象' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="all">全部用户</Radio>
                <Radio value="specific">部分用户</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item 
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.send_to !== currentValues.send_to}
          >
            {({ getFieldValue }) =>
              getFieldValue('send_to') === 'specific' && (
                <Form.Item
                  label="选择用户"
                  required
                >
                  <Button onClick={handleOpenUserModal}>
                    选择用户 {selectedUserIds.length > 0 && `(已选${selectedUserIds.length}个)`}
                  </Button>
                </Form.Item>
              )
            }
          </Form.Item>
          
          <Form.Item 
            name="content" 
            label="通知内容" 
            rules={[{ required: true, message: '请输入通知内容' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="请输入通知内容" 
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                发送通知
              </Button>
              <Button onClick={() => navigate('/notifications')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 用户选择弹窗 */}
      <Modal
        title="选择用户"
        open={userModalVisible}
        onOk={handleConfirmUsers}
        onCancel={() => setUserModalVisible(false)}
        width={800}
        confirmLoading={userLoading}
      >
        <Table
          rowKey="id"
          columns={userColumns}
          dataSource={userList}
          loading={userLoading}
          rowSelection={{
            selectedRowKeys: selectedUserIds,
            onChange: (selectedKeys) => {
              setSelectedUserIds(selectedKeys as number[]);
            },
          }}
          pagination={{
            ...pagination,
            onChange: (page) => {
              setPagination({ ...pagination, current: page });
              loadUsers(page);
            },
          }}
        />
      </Modal>
    </div>
  );
};

export default SendNotification;
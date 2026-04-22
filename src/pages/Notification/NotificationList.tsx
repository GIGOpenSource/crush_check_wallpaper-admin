import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, message, Popconfirm, Space, Input, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  getNotificationList,
  deleteNotification,
  type Notification as ApiNotification,
  type GetNotificationListParams
} from '../../services/notificationApi';

// 扩展 API 返回的 Notification 类型，添加页面特有的字段
interface Notification extends ApiNotification {}

const NotificationList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<GetNotificationListParams>({});

  // 加载通知列表
  useEffect(() => {
    loadNotificationList();
  }, [currentPage, pageSize]);

  const loadNotificationList = async (params?: GetNotificationListParams) => {
    setLoading(true);
    try {
      const requestParams: GetNotificationListParams = {
        currentPage,
        pageSize,
        ...searchParams,
        ...params,
      };
      const response = await getNotificationList(requestParams);
      setDataSource(response.results);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('加载通知列表失败:', error);
      message.error('加载通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadNotificationList();
  };

  // 重置
  const handleReset = () => {
    setSearchParams({});
    setCurrentPage(1);
    loadNotificationList();
  };

  // 删除通知
  const handleDelete = (id: number) => {
    deleteNotification(id)
      .then(() => {
        message.success('删除成功');
        loadNotificationList();
      })
      .catch((error) => {
        console.error('删除失败:', error);
        message.error('删除失败');
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
      title: '标题',
      key: 'title',
      width: 250,
      ellipsis: true,
      render: (_: unknown, record: Notification) => {
        return record.extra_data?.title || '-';
      },
    },
    {
      title: '内容',
      key: 'content',
      width: 300,
      ellipsis: true,
      render: (_: unknown, record: Notification) => {
        return record.extra_data?.content || '-';
      },
    },
    {
      title: '类型',
      dataIndex: 'notification_type',
      key: 'notification_type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          system: { color: 'blue', text: '系统' },
          feature: { color: 'green', text: '功能' },
          Activity: { color: 'orange', text: '活动' },
        };
        const { color, text } = typeMap[type] || { color: 'default', text: type };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '发送对象',
      key: 'send_to',
      width: 150,
      render: (_: unknown, record: Notification) => {
        const sendTo = record.extra_data?.send_to as string;
        const sendToMap: Record<string, string> = {
          all: '全部用户',
          specific: '部分用户',
        };
        return sendToMap[sendTo] || sendTo || '-';
      },
    },
    {
      title: '发送时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => {
        if (!text) return '-';
        return new Date(text).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(/\//g, '-');
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: Notification) => (
        <Popconfirm
          title="确定删除此通知吗？"
          description="删除后无法恢复"
          onConfirm={() => handleDelete(record.id)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>通知列表</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索通知标题"
            value={searchParams.title}
            onChange={(e) => setSearchParams({ ...searchParams, title: e.target.value })}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="类型"
            style={{ width: 120 }}
            value={searchParams.notification_type}
            onChange={(value) => setSearchParams({ ...searchParams, notification_type: value })}
            allowClear
            options={[
              { value: 'system', label: '系统' },
              { value: 'feature', label: '功能' },
              { value: 'Activity', label: '活动' },
            ]}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/notifications/send')}>
            发送通知
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          pagination={{
            total,
            pageSize,
            current: currentPage,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default NotificationList;

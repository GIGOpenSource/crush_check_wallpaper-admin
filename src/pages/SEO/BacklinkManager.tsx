import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, Select, message, Alert, Tabs, Statistic, Row, Col, Progress, Breadcrumb, Popconfirm, Timeline } from 'antd';
import { PlusOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi } from '../../services/seoApi';

const { Option } = Select;

interface Backlink {
  id: number;
  source_page: string;
  target_page: string;
  anchor_text: string;
  da_score: number;
  attribute: string;
  attribute_display: string;
  status: string;
  status_display: string;
  quality_score: number;
  remark: string;
  created_at: string;
  updated_at: string;
}

const BacklinkManager: React.FC = () => {
  const navigate = useNavigate();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedBacklink, setSelectedBacklink] = useState<Backlink | null>(null);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [backlinksLoading, setBacklinksLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // 加载外链数据
  const loadBacklinks = async () => {
    setBacklinksLoading(true);
    try {
      const res = await seoApi.getBacklinks({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText,
      });
      if (res.code === 200) {
        // SEO模块API返回结构：pagination + results
        const results = res.data?.results || [];
        const total = res.data?.pagination?.total || res.data?.total || 0;
        setBacklinks(results);
        setPagination(prev => ({ 
          ...prev, 
          total,
          page: res.data?.pagination?.page || prev.current,
          pageSize: res.data?.pagination?.page_size || prev.pageSize,
        }));
      }
    } catch (_err) {
      message.error('加载外链数据失败');
    } finally {
      setBacklinksLoading(false);
    }
  };

  useEffect(() => {
    // 使用setTimeout避免同步调用setState
    const timer = setTimeout(() => {
      loadBacklinks();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchText]);

  const columns = [
    { title: '来源页面', dataIndex: 'source_page', key: 'source_page', ellipsis: true },
    { title: '目标页面', dataIndex: 'target_page', key: 'target_page', ellipsis: true },
    { title: '锚文本', dataIndex: 'anchor_text', key: 'anchor_text', width: 150 },
    {
      title: 'DA评分',
      dataIndex: 'da_score',
      key: 'da_score',
      width: 100,
      render: (score: number) => <Progress percent={score} size="small" status={score > 50 ? 'success' : 'normal'} />,
    },
    {
      title: '质量评分',
      dataIndex: 'quality_score',
      key: 'quality_score',
      width: 100,
      render: (score: number) => (
        score > 0 ? (
          <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}>
            {score}分
          </Tag>
        ) : (
          <Tag>未分析</Tag>
        )
      ),
    },
    {
      title: '属性',
      dataIndex: 'attribute_display',
      key: 'attribute_display',
      width: 120,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status_display',
      key: 'status_display',
      width: 100,
      render: (text: string) => {
        const colorMap: Record<string, string> = {
          '待审核': 'default',
          '已通过': 'success',
          '已拒绝': 'error',
        };
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Backlink) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个外链吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: Backlink) => {
    setSelectedBacklink(record);
    editForm.setFieldsValue({
      source_page: record.source_page,
      target_page: record.target_page,
      anchor_text: record.anchor_text,
      da_score: record.da_score,
      attribute: record.attribute,
      remark: record.remark,
      status: record.status,
    });
    setEditModalVisible(true);
  };

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const res = await seoApi.createBacklink(values);
      if (res.code === 201 || res.code === 200) {
        message.success('外链添加成功');
        setAddModalVisible(false);
        form.resetFields();
        loadBacklinks(); // 刷新列表
      }
    } catch (_err) {
      message.error('添加失败');
    }
  };

  const handleUpdate = async () => {
    if (!selectedBacklink) return;
    try {
      const values = await editForm.validateFields();
      const res = await seoApi.updateBacklink(selectedBacklink.id, values);
      if (res.code === 200) {
        message.success('外链更新成功');
        setEditModalVisible(false);
        editForm.resetFields();
        loadBacklinks(); // 刷新列表
      }
    } catch (_err) {
      message.error('更新失败');
    }
  };

  const handleDelete = async (record: Backlink) => {
    try {
      const res = await seoApi.deleteBacklink(record.id);
      if (res.code === 200) {
        message.success('删除成功');
        loadBacklinks(); // 刷新列表
      }
    } catch (_err) {
      message.error('删除失败');
    }
  };

  const handleScan = async () => {
    message.info('扫描功能开发中...');
  };

  // 域名分析相关数据与列定义
  const domainScores = [
    { key: '1', domain: 'example.com', score: 90, status: 'safe' },
    { key: '2', domain: 'test-site.org', score: 45, status: 'warning' },
  ];

  const domainColumns = [
    { title: '域名', dataIndex: 'domain', key: 'domain' },
    { 
      title: '安全评分', 
      dataIndex: 'score', 
      key: 'score',
      render: (score: number) => <Progress percent={score} size="small" status={score > 60 ? 'success' : 'exception'} />
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => <Tag color={status === 'safe' ? 'success' : 'warning'}>{status === 'safe' ? '安全' : '需关注'}</Tag>
    },
  ];

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb 
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate('/seo')}>SEO管理</a> },
          { title: '外链管理' },
        ]}
      />
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        外链管理
      </h2>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总外链数" value={pagination.total} prefix={<LinkOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="已通过" value={backlinks?.filter(b => b.status_display === '已通过').length || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="已拒绝" value={backlinks?.filter(b => b.status_display === '已拒绝').length || 0} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="待审核" value={backlinks?.filter(b => b.status_display === '待审核').length || 0} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            添加外链
          </Button>
          <Input.Search
            placeholder="搜索来源页面、目标页面或锚文本"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </Space>
      </Card>

      <Tabs 
        defaultActiveKey="backlinks"
        items={[
          {
            key: 'backlinks',
            label: '外链列表',
            children: (
              <Card>
                <Alert
                  message="外链管理"
                  description="管理网站的外部链接，监控链接质量和状态"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={columns}
                  dataSource={backlinks}
                  rowKey="id"
                  loading={backlinksLoading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    onChange: (page, pageSize) => {
                      setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
                    },
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'domains',
            label: '域名分析',
            children: (
              <Card>
                <Alert
                  message="域名安全评分"
                  description="基于域名权威度、历史记录、内容质量等因素计算的安全评分"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={domainColumns}
                  dataSource={domainScores}
                  rowKey="domain"
                />
              </Card>
            ),
          },
          {
            key: 'logs',
            label: '检测日志',
            children: (
              <Card>
                <Timeline
                  items={[
                    { color: 'green', children: <><strong>2026-04-17 10:00</strong><p>完成全站外链扫描，发现 3 个新外链</p></> },
                    { color: 'red', children: <><strong>2026-04-17 09:30</strong><p>检测到 1 个外链失效：suspicious-site.com</p></> },
                    { color: 'orange', children: <><strong>2026-04-16 08:00</strong><p>发现 1 个可疑域名：spam-site.com</p></> },
                    { color: 'green', children: <><strong>2026-04-15 10:00</strong><p>外链健康度检查完成，整体良好</p></> },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'build',
            label: '外链建设',
            children: (
              <Card title="外链建设建议">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message="高质量外链来源"
                    description="行业相关博客、权威媒体、合作伙伴网站、社交媒体"
                    type="success"
                    showIcon
                  />
                  <Alert
                    message="避免的外链类型"
                    description="链接农场、PBN网络、自动生成的外链、与内容无关的外链"
                    type="error"
                    showIcon
                  />
                  <Card type="inner" title="待联系网站">
                    <Table
                      columns={[
                        { title: '网站', dataIndex: 'site' },
                        { title: 'DA评分', dataIndex: 'da' },
                        { title: '相关性', dataIndex: 'relevance', render: (r: string) => <Tag color="blue">{r}</Tag> },
                        { title: '操作', render: () => <Button type="primary" size="small" onClick={() => message.info('联系功能开发中')}>联系</Button> },
                      ]}
                      dataSource={[
                        { site: 'designhub.com', da: 78, relevance: '高' },
                        { site: 'wallpaperhub.net', da: 65, relevance: '高' },
                        { site: 'techblog.com', da: 82, relevance: '中' },
                      ]}
                      pagination={false}
                    />
                  </Card>
                </Space>
              </Card>
            ),
          },
        ]}
      />

      {/* 添加外链弹窗 */}
      <Modal
        title="添加外链"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="source_page" label="来源页面" rules={[{ required: true, message: '请输入来源页面URL' }]}>
            <Input placeholder="https://example.com/page" />
          </Form.Item>
          <Form.Item name="target_page" label="目标页面" rules={[{ required: true, message: '请输入目标页面URL' }]}>
            <Input placeholder="https://your-site.com/page" />
          </Form.Item>
          <Form.Item name="anchor_text" label="锚文本" rules={[{ required: true, message: '请输入锚文本' }]}>
            <Input placeholder="点击文本" />
          </Form.Item>
          <Form.Item name="da_score" label="DA评分">
            <Input type="number" min={0} max={100} placeholder="0-100" />
          </Form.Item>
          <Form.Item name="attribute" label="链接属性">
            <Select defaultValue="dofollow">
              <Option value="dofollow">Dofollow</Option>
              <Option value="nofollow">Nofollow</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑外链弹窗 */}
      <Modal
        title="编辑外链"
        open={editModalVisible}
        onOk={handleUpdate}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="source_page" label="来源页面" rules={[{ required: true, message: '请输入来源页面URL' }]}>
            <Input placeholder="https://example.com/page" />
          </Form.Item>
          <Form.Item name="target_page" label="目标页面" rules={[{ required: true, message: '请输入目标页面URL' }]}>
            <Input placeholder="https://your-site.com/page" />
          </Form.Item>
          <Form.Item name="anchor_text" label="锚文本" rules={[{ required: true, message: '请输入锚文本' }]}>
            <Input placeholder="点击文本" />
          </Form.Item>
          <Form.Item name="da_score" label="DA评分">
            <Input type="number" min={0} max={100} placeholder="0-100" />
          </Form.Item>
          <Form.Item name="attribute" label="链接属性">
            <Select>
              <Option value="dofollow">Dofollow</Option>
              <Option value="nofollow">Nofollow</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Option value="pending">待审核</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default BacklinkManager;
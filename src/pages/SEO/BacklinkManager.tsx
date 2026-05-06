import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, Select, App, Alert, Tabs, Statistic, Row, Col, Progress, Breadcrumb, Popconfirm, Timeline, Pagination, message } from 'antd';
import { PlusOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, ArrowLeftOutlined, EditOutlined, ReloadOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi, type DomainAnalysis, type DetectionLog } from '../../services/seoApi';

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
  
  // 外链统计数据
  const [statistics, setStatistics] = useState({
    total_count: 0,
    active_count: 0,
    inactive_count: 0,
    toxic_count: 0,
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  
  // 域名分析相关状态
  const [domainAnalysis, setDomainAnalysis] = useState<DomainAnalysis[]>([]);
  const [domainAnalysisLoading, setDomainAnalysisLoading] = useState(false);
  const [domainPagination, setDomainPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [domainSearchText, setDomainSearchText] = useState('');
  const [domainStatusFilter, setDomainStatusFilter] = useState<string | undefined>(undefined);

  // 检测日志相关状态
  const [detectionLogs, setDetectionLogs] = useState<DetectionLog[]>([]);
  const [detectionLogsLoading, setDetectionLogsLoading] = useState(false);
  const [detectionLogPagination, setDetectionLogPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detectionLogSearchText, setDetectionLogSearchText] = useState('');

  // 加载外链统计数据
  const loadStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const res = await seoApi.getBacklinkStatistics();
      if (res.code === 200 && res.data) {
        setStatistics(res.data);
      }
    } catch (_err) {
      message.error('加载统计数据失败');
    } finally {
      setStatisticsLoading(false);
    }
  };
  
  // 加载外链数据
  const loadBacklinks = async () => {
    setBacklinksLoading(true);
    try {
      const res = await seoApi.getBacklinks({
        currentPage: pagination.current,
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
          current: res.data?.pagination?.page || prev.current,
          pageSize: res.data?.pagination?.page_size || prev.pageSize,
        }));
      }
    } catch (_err) {
      message.error('加载外链数据失败');
    } finally {
      setBacklinksLoading(false);
    }
  };

  // 加载外链和统计数据
  useEffect(() => {
    loadStatistics();
    const timer = setTimeout(() => {
      loadBacklinks();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchText]);

  // 加载域名分析数据
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDomainAnalysis();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainPagination.current, domainPagination.pageSize, domainSearchText, domainStatusFilter]);

  // 加载检测日志数据
  const loadDetectionLogs = async () => {
    setDetectionLogsLoading(true);
    try {
      const res = await seoApi.getDetectionLogs({
        currentPage: 1,
        pageSize: 999,
        search: detectionLogSearchText || undefined,
      });
      if (res.code === 200 && res.data) {
        const logs = res.data.results || [];
        setDetectionLogs(logs);
      }
    } catch (err) {
      message.error('加载检测日志失败');
      console.error('加载检测日志失败:', err);
    } finally {
      setDetectionLogsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDetectionLogs();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          '有效': 'success',
          '失效': 'error',
          '有毒': 'error',
        };
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => {
        if (!text) return '--';
        const date = new Date(text);
        return date.toLocaleString('zh-CN', {
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
      quality_score: record.quality_score,
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

  // 加载域名分析数据
  const loadDomainAnalysis = async () => {
    setDomainAnalysisLoading(true);
    try {
      const res = await seoApi.getDomainAnalysisList({
        currentPage: domainPagination.current,
        pageSize: domainPagination.pageSize,
        domain: domainSearchText,
        status: domainStatusFilter,
      });
      if (res.code === 200) {
        const results = res.data?.results || [];
        const total = res.data?.pagination?.total || 0;
        setDomainAnalysis(results);
        setDomainPagination(prev => ({
          ...prev,
          total,
          current: res.data?.pagination?.page || prev.current,
          pageSize: res.data?.pagination?.page_size || prev.pageSize,
        }));
      }
    } catch (_err) {
      message.error('加载域名分析数据失败');
    } finally {
      setDomainAnalysisLoading(false);
    }
  };

  // 域名分析表格列定义
  const domainColumns = [
    { 
      title: '域名', 
      dataIndex: 'domain', 
      key: 'domain',
      ellipsis: true,
    },
    { 
      title: '安全评分', 
      dataIndex: 'safety_score', 
      key: 'safety_score',
      width: 300,
      align: 'center' as const,
      render: (score: number) => {
        // 空值保护
        if (score === undefined || score === null) {
          return <Tag>未评分</Tag>;
        }
        
        const status = score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception';
        const tagColor = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';
        
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            width: '100%'
          }}>
            <Progress 
              percent={Math.min(100, Math.max(0, score))} 
              size="small" 
              status={status}
              showInfo={true}
              format={() => `${score}分`}
              strokeColor={{
                '0%': tagColor === 'success' ? '#52c41a' : tagColor === 'warning' ? '#faad14' : '#f5222d',
                '100%': tagColor === 'success' ? '#73d13d' : tagColor === 'warning' ? '#ffc53d' : '#ff4d4f',
              }}
              style={{ flex: 1, maxWidth: '200px' }}
            />
          </div>
        );
      },
    },
    { 
      title: '状态', 
      dataIndex: 'status_display', 
      key: 'status_display',
      width: 100,
      render: (text: string) => {
        const colorMap: Record<string, string> = {
          '安全': 'success',
          '需关注': 'warning',
          '危险': 'error',
        };
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      },
    },
    { 
      title: '操作', 
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: DomainAnalysis) => (
        <Popconfirm
          title="确认开始分析"
          description={`确定要重新分析域名 "${record.domain}" 吗？`}
          onConfirm={() => handleReAnalyze([record.id])}
          okText="确定"
          cancelText="取消"
        >
          <Button 
            type="link" 
            size="small"
          >
            开始分析
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 重新分析域名
  const handleReAnalyze = async (ids: number[]) => {
    try {
      const res = await seoApi.reAnalyzeDomain(ids);
         console.log(res,'rrr')
      // 根据日志输出，res 是完整的响应对象：{code: 200, message: '...', data: {...}}
      if (res && res.code == 200) {
        console.log(res);
        message.success('分析成功');
        // 刷新列表
        loadDomainAnalysis();
      } else {
        message.error('分析失败');
      }
    } catch (err: any) {
      message.error(err?.message || '分析失败');
    }
  };

  // 批量分析
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[]);
    },
  };

  const handleBatchAnalyze = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要分析的域名');
      return;
    }
    await handleReAnalyze(selectedRowKeys);
  };

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
          <Card loading={statisticsLoading}>
            <Statistic title="总外链数" value={statistics.total_count} prefix={<LinkOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={statisticsLoading}>
            <Statistic title="有效" value={statistics.active_count} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={statisticsLoading}>
            <Statistic title="失效" value={statistics.inactive_count} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={statisticsLoading}>
            <Statistic title="有毒" value={statistics.toxic_count} valueStyle={{ color: '#722ed1' }} />
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
                <Space style={{ marginBottom: 16 }}>
                  <Input.Search
                    placeholder="搜索域名"
                    value={domainSearchText}
                    onChange={(e) => setDomainSearchText(e.target.value)}
                    onSearch={loadDomainAnalysis}
                    style={{ width: 300 }}
                  />
                  <Select
                    placeholder="状态筛选"
                    allowClear
                    value={domainStatusFilter}
                    onChange={(value) => {
                      setDomainStatusFilter(value);
                      setDomainPagination(prev => ({ ...prev, current: 1 }));
                    }}
                    style={{ width: 150 }}
                  >
                    <Select.Option value="safe">安全</Select.Option>
                    <Select.Option value="warning">需关注</Select.Option>
                    <Select.Option value="danger">危险</Select.Option>
                  </Select>
                  <Button onClick={loadDomainAnalysis}>刷新</Button>
                  <Popconfirm
                    title="确认批量分析"
                    description={`确定要重新分析选中的 ${selectedRowKeys.length} 个域名吗？`}
                    onConfirm={handleBatchAnalyze}
                    okText="确定"
                    cancelText="取消"
                    disabled={selectedRowKeys.length === 0}
                  >
                    <Button 
                      type="primary" 
                      icon={<ReloadOutlined />}
                      disabled={selectedRowKeys.length === 0}
                    >
                      批量分析
                    </Button>
                  </Popconfirm>
                </Space>
                <Table
                  columns={domainColumns}
                  dataSource={domainAnalysis}
                  rowKey="id"
                  loading={domainAnalysisLoading}
                  pagination={{
                    current: domainPagination.current,
                    pageSize: domainPagination.pageSize,
                    total: domainPagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    onChange: (page, pageSize) => {
                      setDomainPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
                    },
                  }}
                  rowSelection={rowSelection}
                />
              </Card>
            ),
          },
          {
            key: 'logs',
            label: '检测日志',
            children: (
              <Card>
                {/* <Space style={{ marginBottom: 16 }}>
                  <Button onClick={loadDetectionLogs}>刷新</Button>
                </Space> */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                  <Timeline
                    mode="left"
                    style={{ textAlign: 'left', margin: '0', padding: '0', width: '100%' }}
                    items={detectionLogs.map((log) => {
                      // 根据检测结果确定颜色
                      let color = 'green';
                      if (log.result_summary?.includes('异常') || log.result_summary?.includes('失败')) {
                        color = 'red';
                      } else if (log.result_summary?.includes('警告')) {
                        color = 'orange';
                      }

                      // 格式化时间
                      const formattedTime = log.check_time 
                        ? new Date(log.check_time).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).replace(/\//g, '-')
                        : '--';

                      return {
                        color,
                        children: (
                          <div style={{ paddingLeft: '8px' }}>
                            <div style={{ marginBottom: '4px' }}>
                              <strong style={{ fontSize: '14px', marginRight: '8px' }}>
                                {formattedTime}
                              </strong>
                            </div>
                            <div style={{ color: '#666', paddingLeft: '0' }}>
                              {log.content || log.result_summary || '--'}
                            </div>
                          </div>
                        ),
                      };
                    })}
                  />
                </div>
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
          <Form.Item name="da_score" label="DA评分" rules={[{ required: true, message: '请输入DA评分' }]}>
            <Input type="number" min={0} max={100} placeholder="0-100" />
          </Form.Item>
          <Form.Item name="attribute" label="链接属性" rules={[{ required: true, message: '请选择链接属性' }]}>
            <Select>
              <Option value="dofollow">Dofollow</Option>
              <Option value="nofollow">Nofollow</Option>
              <Option value="ugc">UGC</Option>
              <Option value="sponsored">Sponsored</Option>
            </Select>
          </Form.Item>
          <Form.Item name="quality_score" label="质量评分">
            <Input type="number" min={0} max={100} placeholder="0-100" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Option value="pending">待审核</Option>
              <Option value="active">有效</Option>
              <Option value="inactive">失效</Option>
              <Option value="toxic">有毒</Option>
            </Select>
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
          <Form.Item name="da_score" label="DA评分" rules={[{ required: true, message: '请输入DA评分' }]}>
            <Input type="number" min={0} max={100} placeholder="0-100" />
          </Form.Item>
          <Form.Item name="attribute" label="链接属性" rules={[{ required: true, message: '请选择链接属性' }]}>
            <Select>
              <Option value="dofollow">Dofollow</Option>
              <Option value="nofollow">Nofollow</Option>
              <Option value="ugc">UGC</Option>
              <Option value="sponsored">Sponsored</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Option value="pending">待审核</Option>
              <Option value="active">有效</Option>
              <Option value="inactive">失效</Option>
              <Option value="toxic">有毒</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default BacklinkManager;
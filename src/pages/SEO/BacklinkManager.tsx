import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Input, Modal, Form, Select, App, Alert, Tabs, Statistic, Row, Col, Progress, Breadcrumb, Popconfirm, Timeline, Pagination, Divider, Descriptions, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, ArrowLeftOutlined, EditOutlined, ReloadOutlined, ClockCircleOutlined, EyeOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi, type DomainAnalysis, type DetectionLog, type Backlink } from '../../services/seoApi';

const { Option } = Select;
const { Title, Paragraph } = Typography;

const BacklinkManager: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
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
  const [domainStatusFilter, setDomainStatusFilter] = useState<string>('');
  
  // 检测日志相关状态
  const [detectionLogs, setDetectionLogs] = useState<DetectionLog[]>([]);
  const [detectionLogsLoading, setDetectionLogsLoading] = useState(false);
  const [detectionLogSearchText, setDetectionLogSearchText] = useState('');
  
  // 外链建设相关状态
  const [buildBacklinks, setBuildBacklinks] = useState<Backlink[]>([]);
  const [buildBacklinksLoading, setBuildBacklinksLoading] = useState(false);
  const [buildPagination, setBuildPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [buildSearchText, setBuildSearchText] = useState('');
  
  // 联系弹窗相关状态
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedBuildBacklink, setSelectedBuildBacklink] = useState<Backlink | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

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
        source_page: searchText,
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

  // 加载外链建设数据
  const loadBuildBacklinks = async () => {
    setBuildBacklinksLoading(true);
    try {
      const res = await seoApi.getBacklinks({
        currentPage: buildPagination.current,
        pageSize: buildPagination.pageSize,
        source_page: buildSearchText,
        build_status: 'pending',
      });
      if (res.code === 200) {
        const results = res.data?.results || [];
        const total = res.data?.pagination?.total || res.data?.total || 0;
        setBuildBacklinks(results);
        setBuildPagination(prev => ({ 
          ...prev, 
          total,
          current: res.data?.pagination?.page || prev.current,
          pageSize: res.data?.pagination?.page_size || prev.pageSize,
        }));
      }
    } catch (_err) {
      message.error('加载外链建设数据失败');
    } finally {
      setBuildBacklinksLoading(false);
    }
  };

  // 打开联系弹窗
  const handleShowContact = (record: Backlink) => {
    setSelectedBuildBacklink(record);
    setContactModalVisible(true);
  };

  // 关闭联系弹窗
  const handleContactModalClose = () => {
    setContactModalVisible(false);
    setSelectedBuildBacklink(null);
  };

  // 一键扫描外链机会
  const handleScanOpportunities = async () => {
    setScanLoading(true);
    try {
      const res = await seoApi.scanBacklinkOpportunities();
      console.log('扫描接口返回:', res);
      // 根据项目规范：检查 res.code 是否为 200 或 201
      if (res.code === 200 || res.code === 201) {
        // 优先使用后端返回的 message，如果没有则使用默认提示
        message.success(res.message || '扫描成功');
        loadBuildBacklinks();
      } else {
        message.error(res.message || '扫描失败');
      }
    } catch (err) {
      console.error('扫描失败:', err);
      message.error('扫描失败');
    } finally {
      setScanLoading(false);
    }
  };

  // 监听外链建设标签页的筛选条件变化
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBuildBacklinks();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPagination.current, buildPagination.pageSize, buildSearchText]);

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
                
                {/* 操作栏 - 移到列表内部 */}
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
                    添加外链
                  </Button>
                  <Input.Search
                    placeholder="搜索来源页面"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={loadBacklinks}
                    style={{ width: 300 }}
                  />
                  <Button onClick={loadBacklinks}>刷新</Button>
                </Space>

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
              <Card>
                <Alert
                  message="外链建设建议"
                  description="管理待处理的外链建设任务，跟踪外链获取进度"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                {/* 操作栏 */}
                <Space style={{ marginBottom: 16 }}>
                  <Input.Search
                    placeholder="搜索来源页面"
                    value={buildSearchText}
                    onChange={(e) => setBuildSearchText(e.target.value)}
                    onSearch={loadBuildBacklinks}
                    style={{ width: 300 }}
                  />
                  <Button onClick={loadBuildBacklinks}>刷新</Button>
                  <Popconfirm
                    title="确认扫描"
                    description="确定要扫描新的外链机会吗？"
                    onConfirm={handleScanOpportunities}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="primary" icon={<ReloadOutlined />} loading={scanLoading}>
                      一键扫描
                    </Button>
                  </Popconfirm>
                </Space>

                <Table
                  columns={[
                    { 
                      title: '来源页面', 
                      dataIndex: 'source_page', 
                      key: 'source_page', 
                      width: 250,
                      ellipsis: true,
                    },
                    { 
                      title: '目标页面', 
                      dataIndex: 'target_page', 
                      key: 'target_page', 
                      width: 250,
                      ellipsis: true,
                    },
                    {
                      title: 'DA评分',
                      dataIndex: 'da_score',
                      key: 'da_score',
                      width: 150,
                      render: (score: number) => <Progress percent={score} size="small" status={score > 50 ? 'success' : 'normal'} />,
                    },
                    {
                      title: '相关性',
                      dataIndex: 'relevance',
                      key: 'relevance',
                      width: 100,
                      render: (text: string) => {
                        const relevanceMap: Record<string, string> = {
                          'high': '高',
                          'medium': '中',
                          'low': '低',
                        };
                        return <Tag color="blue">{relevanceMap[text] || text}</Tag>;
                      },
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: (_: any, record: Backlink) => (
                        <Button type="primary" onClick={() => handleShowContact(record)}>联系</Button>
                      ),
                    },
                  ]}
                  dataSource={buildBacklinks}
                  rowKey="id"
                  loading={buildBacklinksLoading}
                  scroll={{ x: 'max-content' }}
                  pagination={{
                    current: buildPagination.current,
                    pageSize: buildPagination.pageSize,
                    total: buildPagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    onChange: (page, pageSize) => {
                      setBuildPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
                    },
                  }}
                />
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

      {/* 联系信息弹窗 */}
      <Modal
        title="联系信息"
        open={contactModalVisible}
        onCancel={handleContactModalClose}
        footer={[
          <Button key="close" onClick={handleContactModalClose}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedBuildBacklink && (
          <div style={{ padding: '16px 0' }}>
            {/* <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="来源页面">
                <a href={selectedBuildBacklink.source_page} target="_blank" rel="noopener noreferrer">
                  {selectedBuildBacklink.source_page}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="目标页面">
                <a href={selectedBuildBacklink.target_page} target="_blank" rel="noopener noreferrer">
                  {selectedBuildBacklink.target_page}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="锚文本">{selectedBuildBacklink.anchor_text || '--'}</Descriptions.Item>
              <Descriptions.Item label="链接属性">
                <Tag color="blue">{selectedBuildBacklink.attribute_display}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="建设状态">
                <Tag color="orange">{selectedBuildBacklink.build_status_display}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="相关性">
                <Tag color="blue">
                  {{
                    'high': '高',
                    'medium': '中',
                    'low': '低',
                  }[selectedBuildBacklink.relevance] || selectedBuildBacklink.relevance}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="DA评分">
                <Progress percent={selectedBuildBacklink.da_score} size="small" status={selectedBuildBacklink.da_score > 50 ? 'success' : 'normal'} />
              </Descriptions.Item>
              <Descriptions.Item label="质量评分">{selectedBuildBacklink.quality_score || '--'}</Descriptions.Item>
            </Descriptions> */}

            {/* <Divider /> */}

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="邮箱">{selectedBuildBacklink.contact_info?.email || '--'}</Descriptions.Item>
              <Descriptions.Item label="电话">{selectedBuildBacklink.contact_info?.phone || '--'}</Descriptions.Item>
            </Descriptions>

            {selectedBuildBacklink.remark && (
              <>
                <Divider />
                <div>
                  <Title level={5}>备注</Title>
                  <Paragraph>{selectedBuildBacklink.remark}</Paragraph>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BacklinkManager;
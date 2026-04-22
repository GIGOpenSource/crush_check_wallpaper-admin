/**
 * RecommendationManagerV2.tsx - 推荐管理页面（策略模式）
 * 
 * 功能说明：
 * 1. 每个位置（首页/热门页）支持多个推荐策略
 * 2. 每个策略最多包含50个内容
 * 3. 策略支持设置生效时间（永久或时间段）
 * 4. 策略内的内容支持排序
 * 5. 策略可以启用/停用
 * 
 * 推荐规则：
 * - 优先展示生效中的策略内容（按策略优先级和内容排序）
 * - 策略内容展示完后，按系统规则（热度、时间等）继续展示
 */

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  message,
  Tabs,
  Badge,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Alert,
  List,
  Typography,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FireOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AppstoreAddOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { 
  getStrategyList, 
  createStrategy, 
  updateStrategy, 
  deleteStrategy,
  getContentLibrary,
  addContentToStrategy,
  removeContentFromStrategy,
  type RecommendationStrategy,
  type StrategyContentItem,
  type ContentItem,
} from '../../services/recommendationApi';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

/**
 * 推荐策略数据接口
 * 注意：此接口已从 recommendationApi 导入，此处不再重复定义以避免冲突
 */

const POSITION_CONFIG = {
  home: {
    name: '首页推荐策略',
    icon: <HomeOutlined />,
    color: '#1890ff',
    maxContentPerStrategy: 50,
    description: '首页内容推荐策略，每个策略最多50个内容',
  },
  hot: {
    name: '热门页推荐策略',
    icon: <FireOutlined />,
    color: '#f5222d',
    maxContentPerStrategy: 50,
    description: '热门页内容推荐策略，每个策略最多50个内容',
  },
  banner: {
    name: '精选轮播图',
    icon: <AppstoreAddOutlined />,
    color: '#722ed1',
    maxContentPerStrategy: 10,
    description: '精选轮播图推荐策略，每个策略最多10个内容',
  },
};

const RecommendationManagerV2: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [strategies, setStrategies] = useState<RecommendationStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 策略弹窗
  const [strategyModalVisible, setStrategyModalVisible] = useState(false);
  const [strategyModalTitle, setStrategyModalTitle] = useState('添加策略');
  const [editingStrategy, setEditingStrategy] = useState<RecommendationStrategy | null>(null);
  const [strategyForm] = Form.useForm();
  
  // 内容管理弹窗
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [managingStrategy, setManagingStrategy] = useState<RecommendationStrategy | null>(null);
  const [selectedContentIds, setSelectedContentIds] = useState<number[]>([]);
  
  // 内容库弹窗
  const [contentLibraryVisible, setContentLibraryVisible] = useState(false);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSearchText, setContentSearchText] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  
  // 策略列表选择
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<number[]>([]);
  
  // 搜索
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 加载策略数据
  const loadStrategies = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const strategyType = activeTab as 'home' | 'hot' | 'banner';
      const response = await getStrategyList(page, pageSize, strategyType);
      setStrategies(response.results || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('加载策略列表失败:', error);
      message.error('加载策略列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies(1);
  }, [activeTab]);

  // 切换标签页时重置分页
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedStrategyIds([]);
    setCurrentPage(1);
  };

  // 策略列表列定义
  const strategyColumns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (name: string, record: RecommendationStrategy) => (
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{name}</div>
          <Tooltip title={`ID: ${record.id} | 优先级: ${record.priority}`}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.id}
            </Text>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '应用区域',
      dataIndex: 'apply_area',
      key: 'apply_area',
      width: 120,
      render: (applyArea: string) => {
        const areaMap: Record<string, { color: string; text: string }> = {
          global: { color: 'blue', text: '全球' },
          cn: { color: 'red', text: '中国大陆' },
          overseas: { color: 'green', text: '海外' },
          us: { color: 'orange', text: '美国' },
          jp: { color: 'purple', text: '日本' },
          kr: { color: 'cyan', text: '韩国' },
        };
        const config = areaMap[applyArea] || { color: 'default', text: applyArea || '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => (
        <Tag color={priority >= 90 ? 'red' : priority >= 70 ? 'orange' : 'blue'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: '内容数量',
      key: 'contentCount',
      width: 120,
      render: (_: unknown, record: RecommendationStrategy) => {
        const contentCount = record.wallpaper_ids?.length || 0;
        const contentLimit = record.content_limit || POSITION_CONFIG[record.strategy_type]?.maxContentPerStrategy || 50;
        const isNearLimit = contentCount >= contentLimit * 0.8; // 达到80%时显示警告色
        
        return (
          <Tag color={isNearLimit ? 'orange' : 'blue'}>
            {contentCount} / {contentLimit}
          </Tag>
        );
      },
    },
    {
      title: '生效时间',
      key: 'time',
      width: 200,
      render: (_: unknown, record: RecommendationStrategy) => {
        const formatDate = (dateStr: string) => {
          if (!dateStr) return '--';
          try {
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }).replace(/\//g, '-');
          } catch {
            return dateStr;
          }
        };
        
        return (
          <div>
            <div style={{ fontSize: 12 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {formatDate(record.start_time)}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              至 {formatDate(record.end_time)}
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          draft: { color: 'default', text: '草稿', icon: <ClockCircleOutlined /> },
          active: { color: 'success', text: '激活', icon: <CheckCircleOutlined /> },
          inactive: { color: 'warning', text: '未激活', icon: <CloseCircleOutlined /> },
        };
        const { color, text, icon } = config[status] || config.draft;
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: '统计数据',
      key: 'stats',
      width: 150,
      render: (_: unknown, record: RecommendationStrategy) => (
        <div style={{ fontSize: 12 }}>
          <div>曝光: {(record.total_view_count || 0).toLocaleString()}</div>
          <div>点击: {(record.total_click_count || 0).toLocaleString()}</div>
          <div style={{ color: '#52c41a' }}>CTR: {(record.avg_ctr || 0).toFixed(2)}%</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: RecommendationStrategy) => (
        <Space>
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={() => handleManageContent(record)}
          >
            管理内容
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditStrategy(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此策略吗？"
            description="删除后策略内的所有推荐内容将失效"
            onConfirm={() => handleDeleteStrategy(record.id)}
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

  // 处理添加策略
  const handleAddStrategy = () => {
    setEditingStrategy(null);
    setStrategyModalTitle('添加推荐策略');
    strategyForm.resetFields();
    const defaultLimit = POSITION_CONFIG[activeTab as keyof typeof POSITION_CONFIG]?.maxContentPerStrategy || 50;
    strategyForm.setFieldsValue({
      position: activeTab,
      priority: 50,
      content_limit: defaultLimit,
      status: 'draft',
    });
    setStrategyModalVisible(true);
  };

  // 处理编辑策略
  const handleEditStrategy = (record: RecommendationStrategy) => {
    setEditingStrategy(record);
    setStrategyModalTitle(`编辑策略: ${record.name}`);
    
    strategyForm.setFieldsValue({
      name: record.name,
      position: record.strategy_type,
      priority: record.priority,
      apply_area: record.apply_area,
      content_limit: record.content_limit || POSITION_CONFIG[record.strategy_type as keyof typeof POSITION_CONFIG]?.maxContentPerStrategy || 50,
      status: record.status,
      remark: record.remark,
      timeRange: record.start_time && record.end_time
        ? [dayjs(record.start_time), dayjs(record.end_time)]
        : undefined,
    });
    setStrategyModalVisible(true);
  };

  // 处理保存策略
  const handleSaveStrategy = async () => {
    try {
      const values = await strategyForm.validateFields();
      
      let startTime = '';
      let endTime = '';
      if (values.timeRange && values.timeRange.length === 2) {
        startTime = values.timeRange[0].format('YYYY-MM-DD HH:mm:ss');
        endTime = values.timeRange[1].format('YYYY-MM-DD HH:mm:ss');
      }
      
      setLoading(true);
      if (editingStrategy) {
        await updateStrategy(editingStrategy.id, {
          name: values.name,
          strategy_type: values.position,
          priority: values.priority,
          apply_area: values.apply_area,
          content_limit: values.content_limit,
          start_time: startTime,
          end_time: endTime,
          status: values.status,
          remark: values.remark,
        });
        message.success('策略修改成功');
      } else {
        await createStrategy({
          name: values.name,
          strategy_type: values.position,
          priority: values.priority,
          apply_area: values.apply_area,
          content_limit: values.content_limit,
          start_time: startTime,
          end_time: endTime,
          status: values.status,
          remark: values.remark,
        });
        message.success('策略添加成功');
      }
      
      setStrategyModalVisible(false);
      loadStrategies(currentPage);
    } catch (error) {
      console.error('保存策略失败:', error);
      message.error('保存策略失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理删除策略
  const handleDeleteStrategy = async (id: number) => {
    try {
      setLoading(true);
      await deleteStrategy(id);
      message.success('策略删除成功');
      loadStrategies(currentPage);
    } catch (error) {
      console.error('删除策略失败:', error);
      message.error('删除策略失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理批量删除策略
  const handleBatchDeleteStrategies = () => {
    if (selectedStrategyIds.length === 0) {
      message.warning('请至少选择一项策略');
      return;
    }
    
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedStrategyIds.length} 个策略吗？策略内的所有内容将失效。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          // Assuming deleteStrategy can be called in parallel or there's a batch endpoint. 
          // For now, calling individual deletes.
          await Promise.all(selectedStrategyIds.map(id => deleteStrategy(id)));
          setSelectedStrategyIds([]);
          message.success(`成功删除 ${selectedStrategyIds.length} 个策略`);
          loadStrategies(currentPage);
        } catch (error) {
          console.error('批量删除策略失败:', error);
          message.error('批量删除策略失败');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 处理管理内容
  const handleManageContent = (record: RecommendationStrategy) => {
    setManagingStrategy(record);
    setContentModalVisible(true);
    setSelectedContentIds([]);
  };

  // 打开内容库弹窗
  const handleOpenContentLibrary = () => {
    if (!managingStrategy) return;
    
    const maxCount = managingStrategy.content_limit || POSITION_CONFIG[managingStrategy.strategy_type]?.maxContentPerStrategy || 50;
    const availableSlots = maxCount - (managingStrategy.content_count || 0);
    if (availableSlots <= 0) {
      message.warning(`该策略已达到最大内容数量限制（${maxCount}个）`);
      return;
    }
    
    setContentLibraryVisible(true);
    setSelectedContentIds([]);
    loadContentList();
  };

  // 加载内容库
  const loadContentList = async () => {
    setContentLoading(true);
    try {
      const data = await getContentLibrary();
      setContentList(data);
    } catch (error) {
      console.error('加载内容库失败:', error);
      message.error('加载内容库失败');
    } finally {
      setContentLoading(false);
    }
  };

  // 处理添加内容
  const handleAddContent = async () => {
    if (!managingStrategy) return;
    
    const maxCount = managingStrategy.content_limit || POSITION_CONFIG[managingStrategy.strategy_type]?.maxContentPerStrategy || 50;
    if ((managingStrategy.content_count || 0) >= maxCount) {
      message.warning(`该策略已达到最大内容数量限制（${maxCount}个）`);
      return;
    }

    const availableSlots = maxCount - (managingStrategy.content_count || 0);
    
    if (selectedContentIds.length > availableSlots) {
      message.error(`超出最大限制，最多还可添加${availableSlots}个内容`);
      return;
    }

    try {
      setLoading(true);
      // Add all selected contents to the strategy in one batch call
      await addContentToStrategy(managingStrategy.id, selectedContentIds);
      
      message.success(`成功添加${selectedContentIds.length}个内容到策略`);
      setContentLibraryVisible(false);
      setSelectedContentIds([]);
      
      // Refresh strategy list to update content counts
      loadStrategies(currentPage);
      
      // Refresh managing strategy details if needed, or just close modal
      // To keep UI consistent, we might want to re-fetch the specific strategy or just close
      // For now, reloading is safer.
      if (contentModalVisible) {
         // Optionally refresh the managing strategy view if we had a getStrategyDetail API
         // For now, we just close the library modal.
      }
    } catch (error) {
      console.error('添加内容失败:', error);
      message.error('添加内容失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理从策略移除内容
  const handleRemoveContent = async (strategyContentId: number, contentId: number) => {
    if (!managingStrategy) return;
    
    try {
      setLoading(true);
      await removeContentFromStrategy(managingStrategy.id, contentId);
      message.success('内容已移除');
      
      // Refresh strategy list to update content counts
      loadStrategies(currentPage);
      
      // Update local managing strategy state to reflect removal immediately in UI
      const updatedContents = managingStrategy.contents.filter(c => c.id !== strategyContentId);
      setManagingStrategy({
        ...managingStrategy,
        contents: updatedContents,
        content_count: updatedContents.length,
      });
    } catch (error) {
      console.error('移除内容失败:', error);
      message.error('移除内容失败');
    } finally {
      setLoading(false);
    }
  };

  // 筛选数据
  const filteredStrategies = strategies
    .filter(s => s.strategy_type === activeTab)
    .filter(s => {
      if (filterStatus === 'all') return true;
      return s.status === filterStatus;
    })
    .filter(s => {
      if (!searchText) return true;
      return s.name.toLowerCase().includes(searchText.toLowerCase());
    });

  // 统计
  const stats = {
    total: strategies.filter(s => s.strategy_type === activeTab).length,
    active: strategies.filter(s => s.strategy_type === activeTab && s.status === 'active').length,
    expired: strategies.filter(s => s.strategy_type === activeTab && s.status === 'inactive').length,
    totalContents: strategies
      .filter(s => s.strategy_type === activeTab)
      .reduce((sum, s) => sum + (s.content_count || 0), 0),
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        推荐策略管理
      </h2>

      <Alert
        message="推荐策略说明"
        description="每个位置（首页/热门页）可以创建多个推荐策略，每个策略最多包含50个内容，策略支持设置生效时间。前端优先展示生效中的策略内容。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        style={{ marginBottom: 24 }}
      >
        {Object.entries(POSITION_CONFIG).map(([key, config]) => (
          <TabPane
            tab={
              <span>
                {config.icon}
                {config.name}
                <Badge
                  count={strategies.filter(s => s.strategy_type === key && s.status === 'active').length}
                  style={{ marginLeft: 8, backgroundColor: config.color }}
                />
              </span>
            }
            key={key}
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic title="策略总数" value={stats.total} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic title="生效中" value={stats.active} valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic title="已过期" value={stats.expired} valueStyle={{ color: '#999' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic title="内容总数" value={stats.totalContents} />
                </Card>
              </Col>
            </Row>

            <Card style={{ marginBottom: 24 }}>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddStrategy}
                >
                  添加策略
                </Button>
                {selectedStrategyIds.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDeleteStrategies}
                  >
                    批量删除 ({selectedStrategyIds.length})
                  </Button>
                )}
                <Input
                  placeholder="搜索策略名称"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 200 }}
                  allowClear
                />
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 120 }}
                >
                  <Option value="all">全部状态</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="active">激活</Option>
                  <Option value="inactive">未激活</Option>
                </Select>
                <span style={{ color: '#999' }}>
                  {config.description}
                </span>
              </Space>
            </Card>

            <Card>
              <Table
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: selectedStrategyIds,
                  onChange: (selectedRowKeys) => {
                    setSelectedStrategyIds(selectedRowKeys as number[]);
                  },
                }}
                columns={strategyColumns}
                dataSource={filteredStrategies}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1400 }}
                pagination={{
                  current: currentPage,
                  pageSize,
                  total,
                  onChange: setCurrentPage,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                locale={{ emptyText: '暂无策略，请点击"添加策略"' }}
              />
            </Card>
          </TabPane>
        ))}
      </Tabs>

      {/* 策略添加/编辑弹窗 */}
      <Modal
        title={strategyModalTitle}
        open={strategyModalVisible}
        onOk={handleSaveStrategy}
        onCancel={() => setStrategyModalVisible(false)}
        width={600}
      >
        <Form
          form={strategyForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="策略名称"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input placeholder="例如：首页主推策略" />
          </Form.Item>

          <Form.Item
            name="position"
            label="应用位置"
            rules={[{ required: true, message: '请选择应用位置' }]}
          >
            <Select placeholder="选择应用位置">
              {Object.entries(POSITION_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>{config.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="apply_area"
                label="应用区域"
                rules={[{ required: true, message: '请选择应用区域' }]}
                tooltip="策略生效的地理区域"
              >
                <Select placeholder="选择应用区域">
                  <Option value="global">全球</Option>
                  <Option value="cn">中国大陆</Option>
                  <Option value="overseas">海外</Option>
                  <Option value="us">美国</Option>
                  <Option value="jp">日本</Option>
                  <Option value="kr">韩国</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="content_limit"
                label="内容数量限制"
                rules={[{ required: true, message: '请输入内容数量限制' }]}
                tooltip="该策略下最多可添加的内容数量"
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="例如：50" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请输入优先级' }]}
            tooltip="数字越大优先级越高，冲突时优先展示高优先级策略"
          >
            <InputNumber min={1} max={999} style={{ width: '100%' }} placeholder="例如：100" />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="有效期"
            rules={[{ required: true, message: '请选择有效期' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="draft">草稿</Option>
              <Option value="active">激活</Option>
              <Option value="inactive">未激活</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={3} placeholder="输入备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 内容管理弹窗 */}
      <Modal
        title={managingStrategy ? `管理内容 - ${managingStrategy.name}` : '管理内容'}
        open={contentModalVisible}
        onCancel={() => {
          setContentModalVisible(false);
          setManagingStrategy(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setContentModalVisible(false);
            setManagingStrategy(null);
          }}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {managingStrategy && (
          <>
            <Alert
              message={`当前策略包含 ${managingStrategy.content_count || 0} 个内容，最多可添加 ${managingStrategy.content_limit || POSITION_CONFIG[managingStrategy.strategy_type]?.maxContentPerStrategy || 50} 个`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button
                  type="primary"
                  size="small"
                  icon={<AppstoreAddOutlined />}
                  onClick={handleOpenContentLibrary}
                  disabled={(managingStrategy.content_count || 0) >= (managingStrategy.content_limit || POSITION_CONFIG[managingStrategy.strategy_type]?.maxContentPerStrategy || 50)}
                >
                  从内容库添加
                </Button>
              }
            />
            
            <List
              dataSource={managingStrategy.contents}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveContent(item.id, item.content_id)}
                    >
                      移除
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <img
                        src={item.content_image}
                        alt={item.content_title}
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      />
                    }
                    title={
                      <Space>
                        <Tag color="blue">{index + 1}</Tag>
                        {item.content_title}
                      </Space>
                    }
                    description={
                      <Tag style={{ fontSize: 12 }}>
                        {item.contentType === 'wallpaper' ? '壁纸' : 
                         item.contentType === 'category' ? '分类' : 
                         item.contentType === 'tag' ? '标签' : '合集'}
                      </Tag>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: <Empty description="暂无内容，请点击上方按钮添加" /> }}
            />
          </>
        )}
      </Modal>

      {/* 内容库选择弹窗 */}
      <Modal
        title="从内容库选择"
        open={contentLibraryVisible}
        onOk={handleAddContent}
        onCancel={() => {
          setContentLibraryVisible(false);
          setSelectedContentIds([]);
        }}
        width={900}
        okText="添加到策略"
        cancelText="取消"
      >
        <Alert
          message="批量选择说明"
          description={`已选择 ${selectedContentIds.length} 项内容。选择后将添加到当前策略中。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索内容标题"
            value={contentSearchText}
            onChange={(e) => setContentSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={contentTypeFilter}
            onChange={setContentTypeFilter}
            style={{ width: 120 }}
          >
            <Option value="all">全部类型</Option>
            <Option value="wallpaper">壁纸</Option>
            <Option value="category">分类</Option>
            <Option value="tag">标签</Option>
            <Option value="collection">合集</Option>
          </Select>
          <Button onClick={loadContentList}>刷新</Button>
        </Space>

        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedContentIds,
            onChange: (selectedRowKeys) => {
              setSelectedContentIds(selectedRowKeys as number[]);
            },
          }}
          columns={[
            {
              title: '内容',
              key: 'content',
              render: (_: unknown, record: ContentItem) => (
                <Space>
                  <img
                    src={record.image}
                    alt={record.title}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>{record.title}</div>
                    <Tag style={{ fontSize: 12 }}>{record.typeName}</Tag>
                  </div>
                </Space>
              ),
            },
            {
              title: '浏览量',
              dataIndex: 'views',
              key: 'views',
              width: 100,
              render: (views: number) => views.toLocaleString(),
            },
            {
              title: '下载量',
              dataIndex: 'downloads',
              key: 'downloads',
              width: 100,
              render: (downloads: number) => downloads.toLocaleString(),
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 120,
            },
          ]}
          dataSource={contentList
            .filter(item => {
              if (contentTypeFilter === 'all') return true;
              return item.type === contentTypeFilter;
            })
            .filter(item => {
              if (!contentSearchText) return true;
              return item.title.toLowerCase().includes(contentSearchText.toLowerCase());
            })
          }
          rowKey="id"
          loading={contentLoading}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无内容' }}
        />
      </Modal>
    </div>
  );
};

export default RecommendationManagerV2;

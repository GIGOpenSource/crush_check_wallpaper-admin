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

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

/**
 * 策略中的内容项
 */
interface StrategyContentItem {
  id: number;
  contentId: number;
  contentType: 'wallpaper' | 'category' | 'tag' | 'collection';
  contentTitle: string;
  contentImage: string;
  sortOrder: number;
}

/**
 * 推荐策略数据接口
 */
interface RecommendationStrategy {
  id: number;
  name: string;
  position: 'home' | 'hot';
  positionName: string;
  
  // 优先级：数字越大优先级越高，冲突时优先展示高优先级策略
  priority: number;
  
  // 语言设置：策略针对的语言版本
  language: 'all' | 'zh' | 'en' | 'ja' | 'ko';
  
  startTime: string;
  endTime: string;
  isPermanent: boolean;
  status: 'active' | 'paused' | 'expired';
  contents: StrategyContentItem[];
  contentCount: number;
  totalViewCount: number;
  totalClickCount: number;
  avgCtr: number;
  createdAt: string;
  updatedAt: string;
  operator: string;
  remark: string;
}

/**
 * 内容库中的内容项
 */
interface ContentItem {
  id: number;
  title: string;
  image: string;
  type: 'wallpaper' | 'category' | 'tag' | 'collection';
  typeName: string;
  views: number;
  downloads: number;
  createdAt: string;
}

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
};

const RecommendationManagerV2: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [strategies, setStrategies] = useState<RecommendationStrategy[]>([]);
  const [loading] = useState(false);
  
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

  // 模拟加载数据
  useEffect(() => {
    // 使用setTimeout避免同步调用setState
    const timer = setTimeout(() => {
    const mockStrategies: RecommendationStrategy[] = [
      {
        id: 1,
        name: '首页主推策略',
        position: 'home',
        positionName: '首页推荐策略',
        priority: 100,
        language: 'all',
        startTime: '2026-04-01 00:00:00',
        endTime: '2026-06-01 23:59:59',
        isPermanent: false,
        status: 'active',
        contents: [
          { id: 1, contentId: 101, contentType: 'wallpaper', contentTitle: '4K星空夜景壁纸', contentImage: 'https://via.placeholder.com/150', sortOrder: 1 },
          { id: 2, contentId: 102, contentType: 'wallpaper', contentTitle: '动漫风景高清壁纸', contentImage: 'https://via.placeholder.com/150', sortOrder: 2 },
          { id: 3, contentId: 103, contentType: 'category', contentTitle: '极简主义壁纸合集', contentImage: 'https://via.placeholder.com/150', sortOrder: 3 },
        ],
        contentCount: 3,
        totalViewCount: 25800,
        totalClickCount: 5120,
        avgCtr: 19.8,
        createdAt: '2026-04-01 10:00:00',
        updatedAt: '2026-04-17 15:30:00',
        operator: '管理员',
        remark: '首页主要推荐内容',
      },
      {
        id: 2,
        name: '热门精选策略',
        position: 'hot',
        positionName: '热门页推荐策略',
        priority: 80,
        language: 'en',
        startTime: '',
        endTime: '',
        isPermanent: true,
        status: 'active',
        contents: [
          { id: 4, contentId: 104, contentType: 'wallpaper', contentTitle: '赛博朋克风格壁纸', contentImage: 'https://via.placeholder.com/150', sortOrder: 1 },
          { id: 5, contentId: 105, contentType: 'wallpaper', contentTitle: '唯美樱花壁纸', contentImage: 'https://via.placeholder.com/150', sortOrder: 2 },
        ],
        contentCount: 2,
        totalViewCount: 15000,
        totalClickCount: 3200,
        avgCtr: 21.3,
        createdAt: '2026-04-10 09:00:00',
        updatedAt: '2026-04-17 14:20:00',
        operator: '管理员',
        remark: '长期热门推荐',
      },
    ];
    setStrategies(mockStrategies);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 策略列表列定义
  const strategyColumns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: RecommendationStrategy) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 16 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.id} | 优先级: {record.priority} | 
            {record.language === 'all' ? '全语言' : 
             record.language === 'zh' ? '中文' :
             record.language === 'en' ? '英文' :
             record.language === 'ja' ? '日文' : '韩文'}
          </Text>
        </div>
      ),
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
      render: (_: unknown, record: RecommendationStrategy) => (
        <Tag color={record.contentCount >= 50 ? 'red' : 'blue'}>
          {record.contentCount} / 50
        </Tag>
      ),
    },
    {
      title: '生效时间',
      key: 'time',
      render: (_: unknown, record: RecommendationStrategy) => (
        <div>
          {record.isPermanent ? (
            <Tag icon={<ClockCircleOutlined />} color="blue">永久有效</Tag>
          ) : (
            <>
              <div style={{ fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {record.startTime}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                至 {record.endTime}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          active: { color: 'success', text: '生效中', icon: <CheckCircleOutlined /> },
          paused: { color: 'warning', text: '已暂停', icon: <CloseCircleOutlined /> },
          expired: { color: 'error', text: '已过期', icon: <ClockCircleOutlined /> },
        };
        const { color, text, icon } = config[status];
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: '统计数据',
      key: 'stats',
      width: 150,
      render: (_: unknown, record: RecommendationStrategy) => (
        <div style={{ fontSize: 12 }}>
          <div>曝光: {record.totalViewCount.toLocaleString()}</div>
          <div>点击: {record.totalClickCount.toLocaleString()}</div>
          <div style={{ color: '#52c41a' }}>CTR: {record.avgCtr}%</div>
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
    strategyForm.setFieldsValue({
      position: activeTab,
      priority: 50,
      language: 'all',
      isPermanent: true,
      status: 'active',
    });
    setStrategyModalVisible(true);
  };

  // 处理编辑策略
  const handleEditStrategy = (record: RecommendationStrategy) => {
    setEditingStrategy(record);
    setStrategyModalTitle('编辑推荐策略');
    
    const formValues = {
      name: record.name,
      position: record.position,
      priority: record.priority,
      language: record.language,
      isPermanent: record.isPermanent,
      status: record.status,
      remark: record.remark,
      timeRange: record.isPermanent 
        ? null 
        : [dayjs(record.startTime), dayjs(record.endTime)],
    };
    
    strategyForm.setFieldsValue(formValues);
    setStrategyModalVisible(true);
  };

  // 处理保存策略
  const handleSaveStrategy = async () => {
    try {
      const values = await strategyForm.validateFields();
      
      let startTime = '';
      let endTime = '';
      if (!values.isPermanent && values.timeRange) {
        startTime = values.timeRange[0].format('YYYY-MM-DD HH:mm:ss');
        endTime = values.timeRange[1].format('YYYY-MM-DD HH:mm:ss');
      }
      
      const positionConfig = POSITION_CONFIG[values.position as keyof typeof POSITION_CONFIG];
      
      if (editingStrategy) {
        const updated = strategies.map(s =>
          s.id === editingStrategy.id
            ? {
                ...s,
                name: values.name,
                position: values.position,
                positionName: positionConfig.name,
                priority: values.priority,
                language: values.language,
                isPermanent: values.isPermanent,
                startTime,
                endTime,
                status: values.status,
                remark: values.remark,
                updatedAt: new Date().toLocaleString(),
              }
            : s
        );
        setStrategies(updated);
        message.success('策略修改成功');
      } else {
        const newStrategy: RecommendationStrategy = {
          id: Date.now(),
          name: values.name,
          position: values.position,
          positionName: positionConfig.name,
          priority: values.priority,
          language: values.language,
          isPermanent: values.isPermanent,
          startTime,
          endTime,
          status: values.status,
          contents: [],
          contentCount: 0,
          totalViewCount: 0,
          totalClickCount: 0,
          avgCtr: 0,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
          operator: '管理员',
          remark: values.remark || '',
        };
        setStrategies([...strategies, newStrategy]);
        message.success('策略添加成功');
      }
      
      setStrategyModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理删除策略
  const handleDeleteStrategy = (id: number) => {
    setStrategies(strategies.filter(s => s.id !== id));
    message.success('策略删除成功');
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
      onOk: () => {
        setStrategies(strategies.filter(s => !selectedStrategyIds.includes(s.id)));
        setSelectedStrategyIds([]);
        message.success(`成功删除 ${selectedStrategyIds.length} 个策略`);
      },
    });
  };

  // 处理管理内容
  const handleManageContent = (record: RecommendationStrategy) => {
    setManagingStrategy(record);
    setContentModalVisible(true);
    setSelectedContentIds([]);
  };

  // 处理从内容库添加
  const handleOpenContentLibrary = () => {
    if (!managingStrategy) return;
    
    const maxCount = POSITION_CONFIG[managingStrategy.position].maxContentPerStrategy;
    if (managingStrategy.contentCount >= maxCount) {
      message.warning(`该策略已达到最大内容数量限制（${maxCount}个）`);
      return;
    }
    
    setContentLibraryVisible(true);
    setSelectedContentIds([]);
    loadContentList();
  };

  // 加载内容库
  const loadContentList = () => {
    setContentLoading(true);
    setTimeout(() => {
      const mockContentList: ContentItem[] = [
        { id: 201, title: '唯美樱花壁纸', image: 'https://via.placeholder.com/150', type: 'wallpaper', typeName: '壁纸', views: 15000, downloads: 3200, createdAt: '2026-04-15' },
        { id: 202, title: '极简黑白壁纸', image: 'https://via.placeholder.com/150', type: 'wallpaper', typeName: '壁纸', views: 12000, downloads: 2800, createdAt: '2026-04-14' },
        { id: 203, title: '动漫风景合集', image: 'https://via.placeholder.com/150', type: 'collection', typeName: '合集', views: 8500, downloads: 1500, createdAt: '2026-04-13' },
        { id: 204, title: '4K游戏壁纸', image: 'https://via.placeholder.com/150', type: 'wallpaper', typeName: '壁纸', views: 22000, downloads: 5600, createdAt: '2026-04-12' },
        { id: 205, title: '自然风光分类', image: 'https://via.placeholder.com/150', type: 'category', typeName: '分类', views: 18000, downloads: 0, createdAt: '2026-04-11' },
        { id: 206, title: '赛博朋克风格', image: 'https://via.placeholder.com/150', type: 'tag', typeName: '标签', views: 9500, downloads: 2100, createdAt: '2026-04-10' },
        { id: 207, title: '星空夜景壁纸', image: 'https://via.placeholder.com/150', type: 'wallpaper', typeName: '壁纸', views: 30000, downloads: 8900, createdAt: '2026-04-09' },
        { id: 208, title: '城市建筑壁纸', image: 'https://via.placeholder.com/150', type: 'wallpaper', typeName: '壁纸', views: 11000, downloads: 2400, createdAt: '2026-04-08' },
      ];
      setContentList(mockContentList);
      setContentLoading(false);
    }, 500);
  };

  // 确认添加内容到策略
  const handleAddContentToStrategy = () => {
    if (!managingStrategy) return;
    
    if (selectedContentIds.length === 0) {
      message.warning('请至少选择一项内容');
      return;
    }

    const maxCount = POSITION_CONFIG[managingStrategy.position].maxContentPerStrategy;
    const availableSlots = maxCount - managingStrategy.contentCount;
    
    if (selectedContentIds.length > availableSlots) {
      message.error(`超出最大限制，最多还可添加${availableSlots}个内容`);
      return;
    }

    const selectedItems = contentList.filter(item => selectedContentIds.includes(item.id));
    const newContents: StrategyContentItem[] = selectedItems.map((item, index) => ({
      id: Date.now() + index,
      contentId: item.id,
      contentType: item.type,
      contentTitle: item.title,
      contentImage: item.image,
      sortOrder: managingStrategy.contentCount + index + 1,
    }));

    const updatedStrategies = strategies.map(s => {
      if (s.id === managingStrategy.id) {
        return {
          ...s,
          contents: [...s.contents, ...newContents],
          contentCount: s.contentCount + newContents.length,
          updatedAt: new Date().toLocaleString(),
        };
      }
      return s;
    });

    setStrategies(updatedStrategies);
    setManagingStrategy({
      ...managingStrategy,
      contents: [...managingStrategy.contents, ...newContents],
      contentCount: managingStrategy.contentCount + newContents.length,
    });
    
    message.success(`成功添加${selectedItems.length}个内容到策略`);
    setContentLibraryVisible(false);
    setSelectedContentIds([]);
  };

  // 处理从策略移除内容
  const handleRemoveContent = (contentId: number) => {
    if (!managingStrategy) return;
    
    const updatedContents = managingStrategy.contents.filter(c => c.id !== contentId);
    
    const updatedStrategies = strategies.map(s => {
      if (s.id === managingStrategy.id) {
        return {
          ...s,
          contents: updatedContents,
          contentCount: updatedContents.length,
          updatedAt: new Date().toLocaleString(),
        };
      }
      return s;
    });

    setStrategies(updatedStrategies);
    setManagingStrategy({
      ...managingStrategy,
      contents: updatedContents,
      contentCount: updatedContents.length,
    });
    
    message.success('内容已移除');
  };

  // 筛选数据
  const filteredStrategies = strategies
    .filter(s => s.position === activeTab)
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
    total: strategies.filter(s => s.position === activeTab).length,
    active: strategies.filter(s => s.position === activeTab && s.status === 'active').length,
    expired: strategies.filter(s => s.position === activeTab && s.status === 'expired').length,
    totalContents: strategies
      .filter(s => s.position === activeTab)
      .reduce((sum, s) => sum + s.contentCount, 0),
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
        onChange={(key) => {
          setActiveTab(key);
          setSelectedStrategyIds([]);
        }}
        style={{ marginBottom: 24 }}
      >
        {Object.entries(POSITION_CONFIG).map(([key, config]) => (
          <TabPane
            tab={
              <span>
                {config.icon}
                {config.name}
                <Badge
                  count={strategies.filter(s => s.position === key && s.status === 'active').length}
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
                  <Option value="active">生效中</Option>
                  <Option value="paused">已暂停</Option>
                  <Option value="expired">已过期</Option>
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
                pagination={{ pageSize: 10 }}
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
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请输入优先级' }]}
                tooltip="数字越大优先级越高，冲突时优先展示高优先级策略"
              >
                <InputNumber min={1} max={999} style={{ width: '100%' }} placeholder="例如：100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="language"
                label="语言"
                rules={[{ required: true, message: '请选择语言' }]}
                tooltip="策略针对的语言版本，全语言表示所有版本都生效"
              >
                <Select placeholder="选择语言">
                  <Option value="all">全语言</Option>
                  <Option value="zh">中文</Option>
                  <Option value="en">英文</Option>
                  <Option value="ja">日文</Option>
                  <Option value="ko">韩文</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isPermanent"
            valuePropName="checked"
          >
            <Switch checkedChildren="永久有效" unCheckedChildren="设置有效期" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.isPermanent !== currentValues.isPermanent
            }
          >
            {({ getFieldValue }) => {
              const isPermanent = getFieldValue('isPermanent');
              return !isPermanent ? (
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
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="active">生效中</Option>
              <Option value="paused">已暂停</Option>
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
              message={`当前策略包含 ${managingStrategy.contentCount} 个内容，最多可添加 ${POSITION_CONFIG[managingStrategy.position].maxContentPerStrategy} 个`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button
                  type="primary"
                  size="small"
                  icon={<AppstoreAddOutlined />}
                  onClick={handleOpenContentLibrary}
                  disabled={managingStrategy.contentCount >= POSITION_CONFIG[managingStrategy.position].maxContentPerStrategy}
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
                      onClick={() => handleRemoveContent(item.id)}
                    >
                      移除
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <img
                        src={item.contentImage}
                        alt={item.contentTitle}
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      />
                    }
                    title={
                      <Space>
                        <Tag color="blue">{index + 1}</Tag>
                        {item.contentTitle}
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
        onOk={handleAddContentToStrategy}
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

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
  Image,
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
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { 
  getStrategyList, 
  getStrategyStatistics,
  getStrategyContents,
  createStrategy, 
  updateStrategy, 
  deleteStrategy,
  getContentLibrary,
  addContentToStrategy,
  removeContentFromStrategy,
  type RecommendationStrategy,
  type StrategyContentItem,
  type ContentItem,
  type StrategyStatistics,
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
  
  // 已存在的壁纸ID列表（用于勾选和禁用）
  const [existingWallpaperIds, setExistingWallpaperIds] = useState<number[]>([]);
  
  // 内容库分页
  const [contentCurrentPage, setContentCurrentPage] = useState(1);
  const [contentPageSize] = useState(10);
  const [contentTotal, setContentTotal] = useState(0);
  
  // 策略列表选择
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<number[]>([]);
  
  // 搜索
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // 搜索触发标记（用于控制是否应用本地过滤）
  const [searchTriggered, setSearchTriggered] = useState(false);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 统计数据
  const [statistics, setStatistics] = useState<StrategyStatistics>({
    total_count: 0,
    active_count: 0,
    expired_count: 0,
    total_content_count: 0,
  });

  // 加载策略数据
  const loadStrategies = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const strategyType = activeTab as 'home' | 'hot' | 'banner';
      
      // 并行加载策略列表和统计数据
      const [response, statsResponse] = await Promise.all([
        getStrategyList(page, pageSize, strategyType),
        getStrategyStatistics(strategyType),
      ]);
      
      // 应用搜索和筛选条件
      let filteredStrategies = response.results || [];
      
      // 按策略名称搜索
      if (searchText) {
        filteredStrategies = filteredStrategies.filter(strategy => 
          strategy.name?.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      // 按状态筛选
      if (filterStatus && filterStatus !== 'all') {
        filteredStrategies = filteredStrategies.filter(strategy => 
          strategy.status === filterStatus
        );
      }
      
      setStrategies(filteredStrategies);
      setTotal(response.pagination?.total || 0);
      setStatistics(statsResponse);
      setSearchTriggered(true); // 标记搜索已触发
    } catch (error) {
      console.error('加载策略数据失败:', error);
      message.error('加载策略数据失败');
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
    setSearchTriggered(false); // 切换Tab时重置搜索标记
    setCurrentPage(1);
  };

  // 重置搜索条件
  const handleReset = () => {
    setSearchText('');
    setFilterStatus('all');
    setSearchTriggered(false); // 重置搜索标记
    setCurrentPage(1);
    loadStrategies(1);
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
        // 使用后端返回的 content_current_count 字段，如果没有则使用 content_count 或 wallpaper_ids.length 作为后备
        const contentCount = record.content_current_count ?? record.content_count ?? record.wallpaper_ids?.length ?? 0;
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

  // 内容列表列定义
  const contentColumns = [
    {
      title: '壁纸',
      key: 'wallpaper',
      width: 300,
      render: (_: unknown, record: StrategyContentItem) => (
        <Space>
          <Image
            src={record.wallpaper_info.thumb_url}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.content_title || record.wallpaper_info?.name || '--'}</div>
            <Tag color="blue">壁纸</Tag>
          </div>
        </Space>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (sortOrder: number) => (
        <Tag color="purple">{sortOrder}</Tag>
      ),
    },
    {
      title: '添加时间',
      key: 'createdAt',
      width: 180,
      render: (_: unknown, record: StrategyContentItem) => {
        const createdAt = (record as any).created_at;
        if (!createdAt) return '--';
        return new Date(createdAt).toLocaleString('zh-CN', {
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
      width: 100,
      render: (_: unknown, record: StrategyContentItem) => (
        <Popconfirm
          title="确定移除此壁纸吗？"
          description="移除后该壁纸将不再在此策略中推荐"
          onConfirm={() => handleRemoveContent(record.id || 0)}
          okText="移除"
          okType="danger"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
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
  const handleManageContent = async (record: RecommendationStrategy) => {
    setManagingStrategy(record);
    setContentModalVisible(true);
    setSelectedContentIds([]);
    
    // 加载策略内容列表
    try {
      const response = await getStrategyContents(1, 50, record.id);
      const updatedContents = response.results || [];
      
      // 更新策略的内容列表
      setManagingStrategy({
        ...record,
        contents: updatedContents,
        content_count: updatedContents.length,
      });
    } catch (error) {
      console.error('加载策略内容失败:', error);
      message.error('加载策略内容失败');
    }
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
    
    // 获取已存在的壁纸ID列表（使用wallpaper字段）
    const existingIds = (managingStrategy.contents || [])
      .filter(item => item.wallpaper && item.wallpaper_info)
      .map(item => item.wallpaper as number);
    setExistingWallpaperIds(existingIds);
    
    // 设置已选中的ID为已存在的ID
    setSelectedContentIds(existingIds);
    
    setContentLibraryVisible(true);
    loadContentList();
  };

  // 加载内容库
  const loadContentList = async (page: number = 1) => {
    setContentLoading(true);
    try {
      const response = await getContentLibrary(
        page,
        contentPageSize,
        contentSearchText || undefined
      );
      // 将壁纸数据转换为ContentItem格式
      const items: ContentItem[] = (response.results || []).map((wallpaper: any) => ({
        id: wallpaper.id,
        title: wallpaper.name,
        image: wallpaper.thumb_url,
        type: 'wallpaper' as const,
        type_name: '壁纸',
        views: wallpaper.view_count || 0,
        downloads: wallpaper.download_count || 0,
        createdAt: wallpaper.created_at,
      }));
      setContentList(items);
      setContentTotal(response.pagination?.total || 0);
      setContentCurrentPage(page);
    } catch (error) {
      console.error('加载内容库失败:', error);
      message.error('加载内容库失败');
    } finally {
      setContentLoading(false);
    }
  };

  // 搜索内容
  const handleContentSearch = () => {
    setContentCurrentPage(1);
    loadContentList(1);
  };

  // 刷新内容列表（用于按钮点击）
  const handleRefreshContent = () => {
    loadContentList(contentCurrentPage);
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
    
    // 过滤出新选择的壁纸ID（排除已存在的）
    const newSelectedIds = selectedContentIds.filter(id => !existingWallpaperIds.includes(id));
    
    if (newSelectedIds.length === 0) {
      message.warning('没有新选择的壁纸');
      return;
    }
    
    if (newSelectedIds.length > availableSlots) {
      message.error(`超出最大限制，最多还可添加${availableSlots}个壁纸`);
      return;
    }

    try {
      setLoading(true);
      // 只添加新选择的壁纸
      await addContentToStrategy(managingStrategy.id, newSelectedIds);
      
      message.success(`成功添加${newSelectedIds.length}个壁纸到策略`);
      setContentLibraryVisible(false);
      setSelectedContentIds([]);
      setExistingWallpaperIds([]);
      
      // 刷新策略列表
      loadStrategies(currentPage);
      
      // 重新加载策略内容列表
      if (managingStrategy.id) {
        const response = await getStrategyContents(1, 50, managingStrategy.id);
        const updatedContents = response.results || [];
        setManagingStrategy({
          ...managingStrategy,
          contents: updatedContents,
          content_count: updatedContents.length,
        });
      }
    } catch (error) {
      console.error('添加壁纸失败:', error);
      message.error('添加壁纸失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理从策略移除内容
  const handleRemoveContent = async (strategyContentId: number) => {
    if (!managingStrategy) return;
    
    try {
      setLoading(true);
      await removeContentFromStrategy(strategyContentId);
      message.success('内容已移除');
      
      // 重新加载策略内容列表
      const response = await getStrategyContents(1, 50, managingStrategy.id);
      const updatedContents = response.results || [];
      
      // 更新策略的内容列表
      setManagingStrategy({
        ...managingStrategy,
        contents: updatedContents,
        content_count: updatedContents.length,
      });
      
      // 重新加载统计数据
      const statsResponse = await getStrategyStatistics(managingStrategy.strategy_type);
      setStatistics(statsResponse);
    } catch (error) {
      console.error('移除内容失败:', error);
      message.error('移除内容失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理批量移除内容
  const handleBatchRemoveContents = async () => {
    if (!managingStrategy || selectedContentIds.length === 0) return;
    
    try {
      setLoading(true);
      // 批量移除选中的内容
      await Promise.all(selectedContentIds.map(id => removeContentFromStrategy(id)));
      message.success(`成功移除 ${selectedContentIds.length} 个内容`);
      setSelectedContentIds([]);
      
      // 重新加载策略内容列表
      const response = await getStrategyContents(1, 50, managingStrategy.id);
      const updatedContents = response.results || [];
      
      // 更新策略的内容列表
      setManagingStrategy({
        ...managingStrategy,
        contents: updatedContents,
        content_count: updatedContents.length,
      });
      
      // 重新加载统计数据
      const statsResponse = await getStrategyStatistics(managingStrategy.strategy_type);
      setStatistics(statsResponse);
    } catch (error) {
      console.error('批量移除内容失败:', error);
      message.error('批量移除内容失败');
    } finally {
      setLoading(false);
    }
  };

  // 筛选数据 - 只有在点击搜索按钮后才应用过滤
  const shouldFilter = searchTriggered; // 标记是否已触发搜索
  const filteredStrategies = (shouldFilter ? strategies : strategies)
    .filter(s => s.strategy_type === activeTab)
    .filter(s => {
      if (!shouldFilter || filterStatus === 'all') return true;
      return s.status === filterStatus;
    })
    .filter(s => {
      if (!shouldFilter || !searchText) return true;
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
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Space>
            <Button type="primary" onClick={handleAddStrategy} icon={<PlusOutlined />}>
              添加策略
            </Button>
            <Popconfirm
              title="确定批量删除吗？"
              description="删除后策略内的所有推荐内容将失效"
              onConfirm={handleBatchDeleteStrategies}
              okText="删除"
              cancelText="取消"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                批量删除
              </Button>
            </Popconfirm>
          </Space>
        </Col>
        <Col span={12}>
          <Space style={{ justifyContent: 'flex-end' }}>
            <Input
              placeholder="搜索策略名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => loadStrategies(1)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="draft">草稿</Option>
              <Option value="active">激活</Option>
              <Option value="inactive">未激活</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => { setCurrentPage(1); loadStrategies(1); }}>搜索</Button>
            {/* <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button> */}
          </Space>
        </Col>
      </Row>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab={<span><HomeOutlined /> 首页推荐策略</span>} key="home">
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="策略总数"
                  value={statistics.total_count}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="生效中"
                  value={statistics.active_count}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已过期"
                  value={statistics.expired_count}
                  valueStyle={{ color: '#999' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="内容总数"
                  value={statistics.total_content_count}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: (page) => {
                  setCurrentPage(page);
                  loadStrategies(page);
                },
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条`,
              }}
              locale={{ emptyText: '暂无策略数据' }}
            />
          </Card>
        </TabPane>
        <TabPane tab={<span><FireOutlined /> 热门推荐</span>} key="hot">
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="策略总数"
                  value={statistics.total_count}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="生效中"
                  value={statistics.active_count}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已过期"
                  value={statistics.expired_count}
                  valueStyle={{ color: '#999' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="内容总数"
                  value={statistics.total_content_count}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: (page) => {
                  setCurrentPage(page);
                  loadStrategies(page);
                },
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条`,
              }}
              locale={{ emptyText: '暂无策略数据' }}
            />
          </Card>
        </TabPane>
        <TabPane tab={<span><AppstoreAddOutlined /> 精选轮播图</span>} key="banner">
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="策略总数"
                  value={statistics.total_count}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="生效中"
                  value={statistics.active_count}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已过期"
                  value={statistics.expired_count}
                  valueStyle={{ color: '#999' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="内容总数"
                  value={statistics.total_content_count}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: (page) => {
                  setCurrentPage(page);
                  loadStrategies(page);
                },
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条`,
              }}
              locale={{ emptyText: '暂无策略数据' }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 策略编辑弹窗 */}
      <Modal
        title={strategyModalTitle}
        open={strategyModalVisible}
        onOk={handleSaveStrategy}
        onCancel={() => setStrategyModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={strategyForm} layout="vertical">
          <Form.Item
            label="策略名称"
            name="name"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input placeholder="请输入策略名称" />
          </Form.Item>
          <Form.Item
            label="应用位置"
            name="position"
            rules={[{ required: true, message: '请选择应用位置' }]}
          >
            <Select placeholder="请选择应用位置">
              <Option value="home">首页推荐</Option>
              <Option value="hot">热门推荐</Option>
              <Option value="banner">精选轮播图</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="优先级"
            name="priority"
            rules={[{ required: true, message: '请输入优先级' }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="数值越大优先级越高（0-100）"
            />
          </Form.Item>
          <Form.Item
            label="应用区域"
            name="apply_area"
          >
            <Input placeholder="请输入应用区域，如：首页顶部、热门页面等" />
          </Form.Item>
          <Form.Item
            label="内容数量限制"
            name="content_limit"
            rules={[{ required: true, message: '请输入内容数量限制' }]}
          >
            <InputNumber
              min={1}
              max={100}
              style={{ width: '100%' }}
              placeholder="该策略最多可添加的内容数量"
            />
          </Form.Item>
          <Form.Item
            label="生效时间"
            name="timeRange"
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
          <Form.Item
            label="策略状态"
            name="status"
            rules={[{ required: true, message: '请选择策略状态' }]}
          >
            <Select placeholder="请选择策略状态">
              <Option value="draft">草稿</Option>
              <Option value="active">激活</Option>
              <Option value="inactive">未激活</Option>
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

      {/* 内容管理弹窗 */}
      <Modal
        title={`管理策略内容: ${managingStrategy?.name || ''}`}
        open={contentModalVisible}
        onCancel={() => {
          setContentModalVisible(false);
          setManagingStrategy(null);
        }}
        width={1200}
        footer={null}
      >
        <Alert
          message="内容管理说明"
          description={`当前策略已添加 ${managingStrategy?.content_count || 0} 个内容。点击"从内容库添加"可以从壁纸库中选择新的壁纸添加到策略中。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleOpenContentLibrary} icon={<PlusOutlined />}>
            从内容库添加
          </Button>
          <Popconfirm
            title="确定批量移除吗？"
            description="移除后这些壁纸将不再在此策略中推荐"
            onConfirm={handleBatchRemoveContents}
            okText="移除"
            okType="danger"
            cancelText="取消"
            disabled={selectedContentIds.length === 0}
          >
            {/* <Button danger icon={<DeleteOutlined />} disabled={selectedContentIds.length === 0}>
              批量移除 ({selectedContentIds.length})
            </Button> */}
          </Popconfirm>
        </Space>

        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedContentIds,
            onChange: (selectedRowKeys) => {
              setSelectedContentIds(selectedRowKeys as number[]);
            },
          }}
          columns={contentColumns}
          dataSource={managingStrategy?.contents || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: '暂无内容数据，请从内容库添加' }}
        />
      </Modal>

      {/* 内容库选择弹窗 */}
      <Modal
        title="从内容库选择"
        open={contentLibraryVisible}
        onOk={handleAddContent}
        onCancel={() => {
          setContentLibraryVisible(false);
          setSelectedContentIds([]);
          setExistingWallpaperIds([]);
        }}
        width={900}
        okText="添加到策略"
        cancelText="取消"
      >
        <Alert
          message="批量选择说明"
          description={`已选择 ${selectedContentIds.filter(id => !existingWallpaperIds.includes(id)).length} 项新内容（已存在 ${selectedContentIds.filter(id => existingWallpaperIds.includes(id)).length} 项）。选择后将添加到当前策略中。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索壁纸名称"
            value={contentSearchText}
            onChange={(e) => setContentSearchText(e.target.value)}
            onPressEnter={handleContentSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" onClick={handleContentSearch}>搜索</Button>
          <Button onClick={handleRefreshContent}>刷新</Button>
        </Space>

        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedContentIds,
            onChange: (selectedRowKeys) => {
              setSelectedContentIds(selectedRowKeys as number[]);
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
              if (selected) {
                // 全选：添加当前页所有未禁用的项
                const selectableIds = contentList
                  .filter(item => !existingWallpaperIds.includes(item.id))
                  .map(item => item.id);
                // 合并已有的选择和新选择的项
                const newSelectedIds = Array.from(new Set([...selectedContentIds, ...selectableIds]));
                setSelectedContentIds(newSelectedIds);
              } else {
                // 取消全选：移除当前页的项
                const currentPageIds = contentList.map(item => item.id);
                const newSelectedIds = selectedContentIds.filter(id => !currentPageIds.includes(id));
                setSelectedContentIds(newSelectedIds);
              }
            },
            getCheckboxProps: (record: ContentItem) => ({
              // 已存在的壁纸禁用选择
              disabled: existingWallpaperIds.includes(record.id),
              name: record.title,
            }),
          }}
          columns={[
            {
              title: '壁纸',
              key: 'wallpaper',
              width: 300,
              render: (_, record: ContentItem) => (
                <Space>
                  <Image
                    src={record.image}
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>{record.title}</div>
                    <Tag color="blue">{record.type_name}</Tag>
                    {existingWallpaperIds.includes(record.id) && (
                      <Tag color="green" style={{ fontSize: 12 }}>已添加</Tag>
                    )}
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
              width: 180,
              render: (createdAt: string) => {
                if (!createdAt) return '--';
                return new Date(createdAt).toLocaleString('zh-CN', {
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
          ]}
          dataSource={contentList}
          rowKey="id"
          loading={contentLoading}
          pagination={{
            current: contentCurrentPage,
            pageSize: contentPageSize,
            total: contentTotal,
            onChange: (page) => {
              setContentCurrentPage(page);
              loadContentList(page);
            },
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: '暂无壁纸数据' }}
        />
      </Modal>
    </div>
  );
};

export default RecommendationManagerV2;

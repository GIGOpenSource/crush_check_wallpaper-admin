import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Tag, Space, Progress, Tabs, List, Statistic, Row, Col, Alert, Select, Breadcrumb, message, Modal, Form, Descriptions, Divider, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, DownloadOutlined, StarOutlined, FireOutlined, RiseOutlined, FallOutlined, PlusOutlined, ArrowLeftOutlined, EyeOutlined, HeartOutlined, HeartFilled, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi } from '../../services/seoApi';
import { getKeywordDashboardStatistics, type KeywordDashboardStatistics } from '../../services/keywordDashboardApi';
import { getKeywords, getFavoriteKeywords, createKeyword, aiMineHotKeywords, aiExpandLongTail, batchFavoriteKeywords, type KeywordItem, type CreateKeywordParams, type AIExpandLongTailParams } from '../../services/keywordApi';

const { TabPane } = Tabs;
const { Search } = Input;

interface LongTailKeyword {
  id: number;
  keyword: string;
  parentKeyword: string;
  searchVolume: number;
  difficulty: number;
  recommendation: string;
}

interface Keyword {
  id: number;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'rising' | 'falling' | 'stable';
  competition: 'high' | 'medium' | 'low';
  relatedCount: number;
  category: string;
}

const KeywordResearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [addForm] = Form.useForm();
  const [createForm] = Form.useForm(); // 创建关键词表单
  const [createModalVisible, setCreateModalVisible] = useState(false); // 创建关键词弹窗
  const [hotKeywords, setHotKeywords] = useState<Keyword[]>([]);
  const [longTailKeywords, setLongTailKeywords] = useState<LongTailKeyword[]>([]);
  const [normalKeywords, setNormalKeywords] = useState<Keyword[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 收藏的关键词
  const [favorites, setFavorites] = useState<Keyword[]>([]);
  const [activeTab, setActiveTab] = useState('hot');

  // 关键词统计数据
  const [dashboardStats, setDashboardStats] = useState<KeywordDashboardStatistics>({
    total_count: 0,
    long_tail_count: 0,
    today_new: 0,
    yesterday_new: 0,
    new_change: 0,
    new_trend: 'up',
    optimized_count: 0,
  });

  // 加载关键词数据统计
  const loadDashboardStats = async () => {
    try {
      const res = await getKeywordDashboardStatistics();
      if (res) {
        setDashboardStats(res);
      }
    } catch (_err) {
      console.error('加载关键词统计数据失败');
    }
  };

  // 将API返回的KeywordItem转换为前端使用的Keyword格式
  const convertKeywordItem = (item: KeywordItem): Keyword => ({
    id: item.id,
    keyword: item.keyword,
    searchVolume: item.monthly_search_volume,
    difficulty: item.optimization_difficulty,
    cpc: parseFloat(item.cpc) || 0, // 将字符串CPC转换为数字
    trend: item.trend, // rising/falling/stable
    competition: item.competition >= 0.7 ? 'high' : item.competition >= 0.4 ? 'medium' : 'low',
    relatedCount: 0, // API未返回此字段，设置为默认值
    category: item.category_display || item.category || '',
  });

  // 将API返回的KeywordItem转换为长尾词格式
  const convertToLongTailKeyword = (item: KeywordItem): LongTailKeyword => ({
    id: item.id,
    keyword: item.keyword,
    parentKeyword: item.parent_keyword || item.category_display || '',
    searchVolume: item.monthly_search_volume,
    difficulty: item.optimization_difficulty,
    recommendation: item.optimization_difficulty < 40 ? '强烈推荐' : item.optimization_difficulty < 60 ? '推荐' : '一般',
  });

  // 加载关键词数据 - 根据当前tab和搜索条件
  const loadKeywords = async () => {
    setLoading(true);
    try {
      let res;

      // 如果有搜索值，使用关键词列表接口进行搜索
      if (searchValue) {
        res = await getKeywords({
          currentPage: pagination.current,
          pageSize: pagination.pageSize,
          // is_favorite: false,
          keyword_type: activeTab === 'longtail' ? 'long_tail' : activeTab === 'mykeywords' ? 'normal' : 'hot',
          // category: searchValue, // 使用category参数进行筛选
        });
        if (res && res.results) {
          const converted = res.results.map(convertKeywordItem);
          if (activeTab === 'longtail') {
            setLongTailKeywords(res.results.map(convertToLongTailKeyword));
          } else if (activeTab === 'mykeywords') {
            setNormalKeywords(converted);
          } else {
            setHotKeywords(converted);
          }
          setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }));
        }
      } else {
        // 没有搜索值时，根据当前tab加载不同类型的关键词
        switch (activeTab) {
          case 'hot':
            res = await getKeywords({
              currentPage: pagination.current,
              pageSize: pagination.pageSize,
              // is_favorite: false,
              keyword_type: 'hot',
            });
            if (res && res.results) {
              setHotKeywords(res.results.map(convertKeywordItem));
              setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }));
            }
            break;
          case 'longtail':
            res = await getKeywords({
              currentPage: pagination.current,
              pageSize: pagination.pageSize,
              // is_favorite: false,
              keyword_type: 'long_tail',
            });
            if (res && res.results) {
              const converted = res.results.map(convertToLongTailKeyword);
              setLongTailKeywords(converted);
              setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }));
            }
            break;
          case 'mykeywords':
            res = await getKeywords({
              currentPage: pagination.current,
              pageSize: pagination.pageSize,
              // is_favorite: false,
              keyword_type: 'normal',
            });
            if (res && res.results) {
              setNormalKeywords(res.results.map(convertKeywordItem));
              setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }));
            }
            break;
          case 'favorites':
            res = await getFavoriteKeywords(pagination.current, pagination.pageSize);
            if (res && res.results) {
              setFavorites(res.results.map(convertKeywordItem));
              setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }));
            }
            break;
        }
      }
    } catch (_err) {
      message.error('加载关键词数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载关键词数据
  useEffect(() => {
    const timer = setTimeout(() => {
      loadKeywords();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, activeTab]);

  // 加载关键词数据统计
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const handleSearch = async () => {
    // 如果是热门关键词Tab且有搜索值，调用AI挖掘热门关键词接口
    if (activeTab === 'hot' && searchValue) {
      setLoading(true);
      try {
        console.log('开始调用AI挖掘热门关键词接口...');
        const res = await aiMineHotKeywords({ seed_keyword: searchValue });
        console.log('AI挖掘接口返回结果:', res);
        
        if (res && Array.isArray(res)) {
          const converted = res.map(convertKeywordItem);
          setHotKeywords(converted);
          setPagination(prev => ({ ...prev, total: converted.length, current: 1 }));
          message.success(`成功挖掘 ${converted.length} 个热门关键词`);
        }
        
        // 无论AI挖掘是否成功，都刷新列表数据
        console.log('开始刷新列表数据...');
        await loadKeywords();
        console.log('列表数据刷新完成');
      } catch (err) {
        console.error('AI挖掘热门关键词失败:', err);
        message.error('AI挖掘热门关键词失败');
        // 失败后也要刷新列表
        await loadKeywords();
      } finally {
        setLoading(false);
      }
    } else {
      // 其他情况使用原有的搜索逻辑
      setPagination(prev => ({ ...prev, current: 1 }));
      loadKeywords();
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 60) return '#f5222d';
    if (difficulty >= 40) return '#faad14';
    return '#52c41a';
  };

  const getCompetitionTag = (competition: string) => {
    const map: Record<string, { color: string; text: string }> = {
      high: { color: 'error', text: '高' },
      medium: { color: 'warning', text: '中' },
      low: { color: 'success', text: '低' },
    };
    return <Tag color={map[competition]?.color || 'default'}>{map[competition]?.text || competition}</Tag>;
  };

  const handleAddKeyword = () => {
    addForm.validateFields().then((values) => {
      message.success(`关键词 "${values.keyword}" 添加成功！`);
      setAddModalVisible(false);
      addForm.resetFields();
    });
  };

  // 创建关键词
  const handleCreateKeyword = async () => {
    try {
      const values = await createForm.validateFields();
      const params: CreateKeywordParams = {
        keyword: values.keyword,
        keyword_type: values.keyword_type,
        is_favorite: values.is_favorite || false,
      };

      await createKeyword(params);
      message.success(`关键词 "${values.keyword}" 创建成功！`);
      setCreateModalVisible(false);
      createForm.resetFields();
      // 刷新当前tab的数据
      loadKeywords();
    } catch (error) {
      console.error('创建关键词失败:', error);
      message.error('创建关键词失败');
    }
  };

  const handleViewDetail = (record: Keyword) => {
    setSelectedKeyword(record);
    setDetailModalVisible(true);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'falling') return <FallOutlined style={{ color: '#f5222d' }} />;
    return <span style={{ color: '#999' }}>-</span>;
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 检查是否已收藏
  const isFavorite = (keywordId: number) => {
    return favorites.some(k => k.id === keywordId);
  };

  // 添加/取消收藏
  const toggleFavorite = async (record: Keyword) => {
    try {
      const isFav = isFavorite(record.id);
      
      // 调用批量收藏接口
      await batchFavoriteKeywords({
        ids: [record.id],
        is_favorite: !isFav,
      });
      
      // 更新本地状态
      if (isFav) {
        setFavorites(prev => prev.filter(k => k.id !== record.id));
        message.success(`已取消收藏 "${record.keyword}"`);
      } else {
        setFavorites(prev => [...prev, record]);
        message.success(`已收藏 "${record.keyword}"`);
      }
      
      // 刷新当前列表数据
      loadKeywords();
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('收藏操作失败');
    }
  };

  // 移除收藏
  const removeFavorite = (keywordId: number) => {
    const keyword = favorites.find(k => k.id === keywordId);
    setFavorites(prev => prev.filter(k => k.id !== keywordId));
    if (keyword) {
      message.success(`已移除 "${keyword.keyword}"`);
    }
  };

  // 处理取消收藏（调用API）
  const handleRemoveFavorite = async (keywordId: number) => {
    try {
      await batchFavoriteKeywords({
        ids: [keywordId],
        is_favorite: false,
      });
      
      // 更新本地状态
      const keyword = favorites.find(k => k.id === keywordId);
      setFavorites(prev => prev.filter(k => k.id !== keywordId));
      
      if (keyword) {
        message.success(`已取消收藏 "${keyword.keyword}"`);
      }
      
      // 刷新列表数据
      loadKeywords();
    } catch (error) {
      console.error('取消收藏失败:', error);
      message.error('取消收藏失败');
    }
  };

  // 长尾关键词收藏/取消收藏
  const handleLongTailToggleFavorite = async (record: LongTailKeyword) => {
    try {
      const isFav = isFavorite(record.id);
      
      // 调用批量收藏接口
      await batchFavoriteKeywords({
        ids: [record.id],
        is_favorite: !isFav,
      });
      
      // 更新本地状态
      if (isFav) {
        setFavorites(prev => prev.filter(k => k.id !== record.id));
        message.success(`已取消收藏 "${record.keyword}"`);
      } else {
        // 将长尾关键词转换为Keyword格式后添加到收藏
        const keywordData: Keyword = {
          id: record.id,
          keyword: record.keyword,
          searchVolume: record.searchVolume,
          difficulty: record.difficulty,
          cpc: 0,
          trend: 'stable',
          competition: 'medium',
          relatedCount: 0,
          category: '',
        };
        setFavorites(prev => [...prev, keywordData]);
        message.success(`已收藏 "${record.keyword}"`);
      }
      
      // 刷新当前列表数据
      loadKeywords();
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('收藏操作失败');
    }
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: '搜索量',
      dataIndex: 'searchVolume',
      key: 'searchVolume',
      sorter: (a: Keyword, b: Keyword) => a.searchVolume - b.searchVolume,
      render: (text: number) => text.toLocaleString(),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      sorter: (a: Keyword, b: Keyword) => a.difficulty - b.difficulty,
      render: (text: number) => <Progress percent={text} strokeColor={getDifficultyColor(text)} />,
    },
    {
      title: 'CPC',
      dataIndex: 'cpc',
      key: 'cpc',
      sorter: (a: Keyword, b: Keyword) => a.cpc - b.cpc,
      render: (text: number) => `$${text.toFixed(2)}`,
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (text: string) => getTrendIcon(text),
    },
    {
      title: '竞争',
      dataIndex: 'competition',
      key: 'competition',
      render: (text: string) => getCompetitionTag(text),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Keyword) => (
        <Space>
          {/* <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button> */}
          <Button type="link" icon={isFavorite(record.id) ? <HeartFilled /> : <HeartOutlined />} onClick={() => toggleFavorite(record)}>收藏</Button>
        </Space>
      ),
    },
  ];

  const longTailColumns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: '父关键词',
      dataIndex: 'parentKeyword',
      key: 'parentKeyword',
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: '搜索量',
      dataIndex: 'searchVolume',
      key: 'searchVolume',
      sorter: (a: LongTailKeyword, b: LongTailKeyword) => a.searchVolume - b.searchVolume,
      render: (text: number) => text.toLocaleString(),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      sorter: (a: LongTailKeyword, b: LongTailKeyword) => a.difficulty - b.difficulty,
      render: (text: number) => <Progress percent={text} strokeColor={getDifficultyColor(text)} />,
    },
    {
      title: '推荐',
      dataIndex: 'recommendation',
      key: 'recommendation',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: LongTailKeyword) => {
        const isFav = isFavorite(record.id);
        return (
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                color: isFav ? '#1890ff' : '#1890ff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={() => handleLongTailToggleFavorite(record)}
            >
              {isFav ? (
                <HeartFilled style={{ fontSize: '16px' }} />
              ) : (
                <HeartOutlined style={{ fontSize: '16px' }} />
              )}
              <span>收藏</span>
            </span>
          </div>
        );
      },
    },
  ];

  const competitorKeywords = [
    {
      domain: 'example.com',
      keywords: 1234,
      overlap: 12,
      topKeywords: ['keyword1', 'keyword2', 'keyword3'],
    },
    {
      domain: 'example.org',
      keywords: 5678,
      overlap: 34,
      topKeywords: ['keyword4', 'keyword5', 'keyword6'],
    },
  ];

  const [generateKeyword, setGenerateKeyword] = useState('');
  const [generatePos, setGeneratePos] = useState('');
  const [generateModifiers, setGenerateModifiers] = useState('');
  const [generateForm] = Form.useForm();

  // 生成长尾词
  const handleGenerateLongTail = async () => {
    try {
      const values = await generateForm.validateFields();
      
      if (!values.parent_keyword.trim()) {
        message.warning('请输入核心词');
        return;
      }

      setLoading(true);
      console.log('开始调用AI扩展长尾词接口...');
      const res = await aiExpandLongTail({ 
        parent_keyword: values.parent_keyword.trim(),
        pos: values.pos,
        modifiers: values.modifiers || '',
      });
      console.log('AI扩展接口返回结果:', res);
      
      // 拦截器已经直接返回data，res就是AIExpandLongTailResponse类型
      if (res && res.keywords && Array.isArray(res.keywords)) {
        const keywordsArray = res.keywords;
        const converted = keywordsArray.map((item: any) => ({
          id: item.id || Date.now() + Math.random(),
          keyword: item.long_tail_keyword || item.keyword || '',
          parentKeyword: item.parent_keyword || values.parent_keyword,
          searchVolume: item.monthly_search_volume || 0,
          difficulty: item.optimization_difficulty || 0,
          recommendation: (item.optimization_difficulty || 0) < 40 ? '强烈推荐' : (item.optimization_difficulty || 0) < 60 ? '推荐' : '一般',
        }));
        setLongTailKeywords(converted);
        setPagination(prev => ({ ...prev, total: res.total || converted.length, current: 1 }));
        
        console.log(`成功生成 ${converted.length} 个长尾关键词`);
        message.success(`成功为 "${values.parent_keyword.trim()}" 生成 ${converted.length} 个长尾关键词`);
        
        // 清空表单数据
        generateForm.resetFields();
      }
      
      // 刷新列表数据
      await loadKeywords();
    } catch (err: any) {
      if (err.errorFields) {
        // Form 验证失败
        return;
      }
      console.error('生成长尾词失败:', err);
      const keyword = generateForm.getFieldValue('parent_keyword') || '未知';
      message.error(`为 "${keyword}" 生成长尾词失败`);
      // 失败后也要刷新列表
      await loadKeywords();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>关键词挖掘</Breadcrumb.Item>
      </Breadcrumb>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
          关键词挖掘
        </h2>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => message.success('数据导出成功')}>导出数据</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>创建关键词</Button>
        </Space>
      </div>
      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="关键词库"
              value={dashboardStats.total_count}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="长尾词"
              value={dashboardStats.long_tail_count}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={dashboardStats.today_new}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已优化"
              value={dashboardStats.optimized_count}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="热门关键词" key="hot">
          <Card>
            {/* 搜索栏 */}
            <Space style={{ marginBottom: 16 }}>
              <Search
                placeholder="输入关键词进行挖掘"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onSearch={handleSearch}
                loading={loading}
                style={{ width: 400 }}
                enterButton={<><SearchOutlined /> 挖掘</>}
              />
            </Space>

            <Alert
              message="Google关键词数据说明"
              description="基于Google Keyword Planner数据,搜索量为月均全球搜索量,优化难度0-100分,CPC为美元单次点击预估费用"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={hotKeywords}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                onChange: (page, pageSize) => {
                  setPagination(prev => ({ ...prev, current: page, pageSize }));
                },
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="长尾关键词" key="longtail">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="推荐长尾词">
                <Table
                  columns={longTailColumns}
                  dataSource={longTailKeywords}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                      setPagination(prev => ({ ...prev, current: page, pageSize }));
                    },
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="生成工具">
                <Form form={generateForm} layout="vertical">
                  <Form.Item
                    name="parent_keyword"
                    label="核心词"
                    rules={[{ required: true, message: '请输入核心词' }]}
                  >
                    <Input placeholder="请输入核心词" />
                  </Form.Item>
                  <Form.Item
                    name="pos"
                    label="词性"
                    initialValue="noun"
                  >
                    <Select placeholder="选择词性">
                      <Select.Option value="noun">名词</Select.Option>
                      <Select.Option value="adj">形容词</Select.Option>
                      <Select.Option value="verb">动词</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="modifiers"
                    label="修饰词"
                  >
                    <Input placeholder="输入修饰词(逗号分隔,如:4k,高清,免费,下载)" />
                  </Form.Item>
                  <Form.Item>
                    <Button 
                      type="primary" 
                      block 
                      loading={loading}
                      onClick={handleGenerateLongTail}
                    >
                      生成长尾词
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="竞品分析" key="competitor">
          <Card title="竞品关键词对比">
            <List
              itemLayout="horizontal"
              dataSource={competitorKeywords}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(item as unknown as Keyword)}>查看详情</Button>,
                    <Button type="primary" onClick={() => message.success('词库导出成功')}>导出词库</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.domain}
                    description={
                      <Space>
                        <span>关键词数: {item.keywords.toLocaleString()}</span>
                        <span>重叠词: {item.overlap.toLocaleString()}</span>
                      </Space>
                    }
                  />
                  <div>
                    <span style={{ marginRight: 8 }}>TOP关键词:</span>
                    {item.topKeywords.map((k, i) => (
                      <Tag key={i} color="blue">{k}</Tag>
                    ))}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab={`我的收藏 (${favorites.length})`} key="favorites">
          <Card>
            {favorites.length === 0 ? (
              <Alert
                message="暂无收藏关键词"
                description="在热门关键词或长尾词页面点击心形图标即可收藏"
                type="info"
                showIcon
              />
            ) : (
              <Table
                columns={[
                  ...columns.filter(col => col.key !== 'action'),
                  {
                    title: '操作',
                    key: 'action',
                    render: (_: unknown, record: Keyword) => (
                      <Space>
                        {/* <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button> */}
                        <Popconfirm
                          title="确认取消收藏吗？"
                          okText="确认"
                          cancelText="取消"
                          onConfirm={() => handleRemoveFavorite(record.id)}
                        >
                          <Button type="link" danger icon={<DeleteOutlined />}>移除</Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                dataSource={favorites}
                rowKey="id"
                loading={loading}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  onChange: (page, pageSize) => {
                    setPagination(prev => ({ ...prev, current: page, pageSize }));
                  },
                }}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="我的词库" key="mykeywords">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              {/* <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>添加关键词</Button> */}
              <Button onClick={() => message.info('批量导入功能开发中')}>批量导入</Button>
              <Button onClick={() => message.success('导出成功')}>批量导出</Button>
            </Space>
            <Table
              columns={[
                ...columns,
                {
                  title: '操作',
                  key: 'action',
                  render: () => (
                    <Space>
                      <Button type="link">编辑</Button>
                      <Button type="link" danger>删除</Button>
                    </Space>
                  ),
                },
              ]}
              dataSource={normalKeywords}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                onChange: (page, pageSize) => {
                  setPagination(prev => ({ ...prev, current: page, pageSize }));
                },
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 添加关键词弹窗 */}
      <Modal
        title="添加关键词"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setAddModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleAddKeyword}>添加</Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="keyword"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="请输入关键词" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建关键词弹窗 */}
      <Modal
        title="创建关键词"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateKeyword}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Form.Item
            name="keyword"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="请输入关键词" />
          </Form.Item>
          <Form.Item
            name="keyword_type"
            label="关键词类型"
            rules={[{ required: true, message: '请选择关键词类型' }]}
            initialValue="hot"
          >
            <Select placeholder="选择关键词类型">
              <Select.Option value="hot">热门</Select.Option>
              <Select.Option value="long_tail">长尾词</Select.Option>
              <Select.Option value="normal">词库</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="is_favorite"
            label="是否收藏"
            valuePropName="checked"
            initialValue={false}
          >
            <Select>
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 关键词详情弹窗 */}
      <Modal
        title="关键词详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedKeyword && (
          <Descriptions column={2}>
            <Descriptions.Item label="关键词">{selectedKeyword.keyword}</Descriptions.Item>
            <Descriptions.Item label="搜索量">{selectedKeyword.searchVolume.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="难度">{selectedKeyword.difficulty}</Descriptions.Item>
            <Descriptions.Item label="CPC">{`$${selectedKeyword.cpc.toFixed(2)}`}</Descriptions.Item>
            <Descriptions.Item label="趋势">{getTrendIcon(selectedKeyword.trend)}</Descriptions.Item>
            <Descriptions.Item label="竞争">{getCompetitionTag(selectedKeyword.competition)}</Descriptions.Item>
            <Descriptions.Item label="相关词数量">{selectedKeyword.relatedCount}</Descriptions.Item>
            <Descriptions.Item label="类别">{selectedKeyword.category}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default KeywordResearch;

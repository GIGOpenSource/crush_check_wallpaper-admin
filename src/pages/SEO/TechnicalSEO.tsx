import React, { useState } from 'react';
import { Card, Table, Tag, Button, Progress, Space, Alert, Tabs, List, Badge, Breadcrumb, message, Modal, Descriptions, Popconfirm, Form, Input, Select, TimePicker, Switch } from 'antd';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, PlayCircleOutlined, ArrowLeftOutlined, EyeOutlined, ToolOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { seoApi } from '../../services/seoApi';

const { TabPane } = Tabs;

interface CheckItem {
  id: number;
  name: string;
  status: 'success' | 'warning' | 'error';
  total: number;
  passed: number;
  failed: number;
  lastCheck: string;
}

// 问题详情类型
interface IssueDetail {
  id: number;
  url: string;
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  severity: 'high' | 'medium' | 'low';
}

const TechnicalSEO: React.FC = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  
  // 查看详情弹窗状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCheckItem, setSelectedCheckItem] = useState<CheckItem | null>(null);
  const [issueDetails, setIssueDetails] = useState<IssueDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 修复进度状态
  const [fixingIssues, setFixingIssues] = useState<Record<number, boolean>>({});
  
  // 批量选择状态
  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>([]);
  const [batchFixing, setBatchFixing] = useState(false);
  
  // 定时任务设置弹窗
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [scheduledTasks, _setScheduledTasks] = useState<any[]>([]);
  const [taskForm] = Form.useForm();

  // Google技术优化检查
  const structureChecks: CheckItem[] = [
    { id: 1, name: 'Core Web Vitals', status: 'success', total: 1200, passed: 1200, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 2, name: 'Mobile Usability', status: 'success', total: 1200, passed: 1200, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 3, name: 'HTTPS Coverage', status: 'success', total: 1200, passed: 1200, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 4, name: 'Canonical标签', status: 'success', total: 1200, passed: 1200, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 5, name: 'Hreflang标签', status: 'success', total: 0, passed: 0, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 6, name: 'Schema结构化数据', status: 'warning', total: 1200, passed: 1150, failed: 50, lastCheck: '2026-04-17 10:00' },
    { id: 7, name: '图片ALT标签', status: 'warning', total: 3500, passed: 3455, failed: 45, lastCheck: '2026-04-17 10:00' },
    { id: 8, name: 'Sitemap', status: 'success', total: 1, passed: 1, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 9, name: 'Robots.txt', status: 'success', total: 1, passed: 1, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 10, name: '404页面处理', status: 'success', total: 1, passed: 1, failed: 0, lastCheck: '2026-04-17 10:00' },
    { id: 11, name: 'PageSpeed Score', status: 'warning', total: 1200, passed: 1100, failed: 100, lastCheck: '2026-04-17 10:00' },
  ];

  // 问题页面列表
  const problemPages = [
    { id: 1, url: '/wallpaper/1234', issue: 'ALT标签缺失', type: 'warning', suggestion: '添加描述性ALT: "4K星空夜景壁纸"' },
    { id: 2, url: '/wallpaper/5678', issue: 'ALT标签缺失', type: 'warning', suggestion: '添加描述性ALT: "动漫风景手机壁纸"' },
    { id: 3, url: '/404', issue: '返回200状态码', type: 'error', suggestion: '修改为返回真实404状态码' },
    { id: 4, url: '/wallpaper/9999', issue: 'Schema标记错误', type: 'warning', suggestion: '修复Article结构化数据格式' },
  ];

  const columns = [
    {
      title: '检查项',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          success: { color: 'success', icon: <CheckCircleOutlined />, text: '正常' },
          warning: { color: 'warning', icon: <WarningOutlined />, text: '警告' },
          error: { color: 'error', icon: <CloseCircleOutlined />, text: '错误' },
        };
        const { color, icon, text } = config[status];
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: '检查数量',
      key: 'count',
      render: (_: unknown, record: CheckItem) => (
        <span>{record.passed} / {record.total}</span>
      ),
    },
    {
      title: '通过率',
      key: 'rate',
      render: (_: unknown, record: CheckItem) => {
        const rate = Math.round((record.passed / record.total) * 100);
        return (
          <Progress
            percent={rate}
            size="small"
            status={rate >= 95 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
          />
        );
      },
    },
    {
      title: '失败数',
      dataIndex: 'failed',
      key: 'failed',
      render: (failed: number) => failed > 0 ? <Badge count={failed} style={{ backgroundColor: '#f5222d' }} /> : '-',
    },
    {
      title: '最后检查',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CheckItem) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>查看详情</Button>
          {record.failed > 0 && (
            <Popconfirm
              title="确认修复"
              description={`确定要修复 ${record.name} 的 ${record.failed} 个问题吗？`}
              onConfirm={() => handleViewDetail(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="primary" size="small" icon={<ToolOutlined />}>修复</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const problemColumns = [
    { title: '页面URL', dataIndex: 'url', key: 'url' },
    { title: '问题类型', dataIndex: 'issue', key: 'issue' },
    {
      title: '严重程度',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'error' ? 'error' : 'warning'}>
          {type === 'error' ? '严重' : '警告'}
        </Tag>
      ),
    },
    { title: '修复建议', dataIndex: 'suggestion', key: 'suggestion', width: 300 },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small" onClick={() => message.info('查看页面功能开发中')}>查看页面</Button>
          <Button type="primary" size="small" onClick={() => message.success('修复成功')}>一键修复</Button>
        </Space>
      ),
    },
  ];

  const handleStartCheck = () => {
    setChecking(true);
    setCheckProgress(0);
    const timer = setInterval(() => {
      setCheckProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setChecking(false);
          message.success('全站检查完成！');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // 查看检查项详情
  const handleViewDetail = (record: CheckItem) => {
    setSelectedCheckItem(record);
    setDetailModalVisible(true);
    setDetailLoading(true);
    
    // 模拟加载详情数据
    setTimeout(() => {
      const mockDetails: IssueDetail[] = record.failed > 0 ? [
        {
          id: 1,
          url: '/wallpaper/1234',
          title: `${record.name}问题`,
          description: `该页面存在${record.name}相关问题，需要修复。`,
          currentValue: record.name === '图片ALT标签' ? 'alt=""' : undefined,
          suggestedValue: record.name === '图片ALT标签' ? 'alt="4K星空夜景壁纸"' : undefined,
          severity: 'high',
        },
        {
          id: 2,
          url: '/wallpaper/5678',
          title: `${record.name}问题`,
          description: `该页面存在${record.name}相关问题，需要修复。`,
          currentValue: record.name === '图片ALT标签' ? 'alt="image"' : undefined,
          suggestedValue: record.name === '图片ALT标签' ? 'alt="动漫风景手机壁纸"' : undefined,
          severity: 'medium',
        },
      ] : [];
      setIssueDetails(mockDetails);
      setDetailLoading(false);
    }, 800);
  };

  // 修复单个问题
  const handleFixIssue = async (issueId: number) => {
    setFixingIssues(prev => ({ ...prev, [issueId]: true }));
    
    try {
      const res = await seoApi.fixIssue(issueId, 'auto');
      if (res.code === 200) {
        setFixingIssues(prev => ({ ...prev, [issueId]: false }));
        setIssueDetails(prev => prev.filter(issue => issue.id !== issueId));
        message.success('修复成功！');
        
        // 更新检查项的失败数
        if (selectedCheckItem) {
          setSelectedCheckItem({
            ...selectedCheckItem,
            failed: Math.max(0, selectedCheckItem.failed - 1),
            passed: selectedCheckItem.passed + 1,
          });
        }
      }
    } catch (_err) {
      setFixingIssues(prev => ({ ...prev, [issueId]: false }));
      message.error('修复失败，请重试');
    }
  };

  // 一键修复所有问题
  const handleFixAll = () => {
    Modal.confirm({
      title: '确认一键修复',
      content: `确定要修复所有 ${issueDetails.length} 个问题吗？`,
      onOk: async () => {
        const allIds = issueDetails.map(i => i.id);
        const newFixing: Record<number, boolean> = {};
        allIds.forEach(id => newFixing[id] = true);
        setFixingIssues(newFixing);
        
        try {
          const res = await seoApi.batchFixIssues(allIds, 'auto');
          if (res.code === 200) {
            setFixingIssues({});
            setIssueDetails([]);
            setSelectedIssueIds([]);
            message.success(`成功修复 ${res.data.fixedCount} 个问题！`);
            
            if (selectedCheckItem) {
              setSelectedCheckItem({
                ...selectedCheckItem,
                failed: 0,
                passed: selectedCheckItem.total,
                status: 'success',
              });
            }
          }
        } catch (_err) {
          setFixingIssues({});
          message.error('批量修复失败，请重试');
        }
      },
    });
  };

  // 批量修复选中的问题
  const handleBatchFixSelected = () => {
    if (selectedIssueIds.length === 0) {
      message.warning('请先选择要修复的问题');
      return;
    }
    
    Modal.confirm({
      title: '确认批量修复',
      content: `确定要修复选中的 ${selectedIssueIds.length} 个问题吗？`,
      onOk: async () => {
        setBatchFixing(true);
        const newFixing: Record<number, boolean> = {};
        selectedIssueIds.forEach(id => newFixing[id] = true);
        setFixingIssues(newFixing);
        
        try {
          const res = await seoApi.batchFixIssues(selectedIssueIds, 'auto');
          if (res.code === 200) {
            setFixingIssues({});
            setIssueDetails(prev => prev.filter(item => !selectedIssueIds.includes(item.id)));
            setSelectedIssueIds([]);
            message.success(`成功修复 ${res.data.fixedCount} 个问题！`);
            
            // 更新检查项状态
            if (selectedCheckItem) {
              const remainingFailed = issueDetails.length - selectedIssueIds.length;
              setSelectedCheckItem({
                ...selectedCheckItem,
                failed: remainingFailed,
                passed: selectedCheckItem.total - remainingFailed,
                status: remainingFailed === 0 ? 'success' : remainingFailed < 10 ? 'warning' : 'error',
              });
            }
          }
        } catch (_err) {
          setFixingIssues({});
          message.error('批量修复失败，请重试');
        } finally {
          setBatchFixing(false);
        }
      },
    });
  };

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys: selectedIssueIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedIssueIds(selectedRowKeys as number[]);
    },
  };

  // 导出报告
  const handleExportReport = () => {
    const reportData = {
      title: 'SEO技术优化检查报告',
      date: new Date().toLocaleString(),
      checks: structureChecks,
      problems: problemPages,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('报告导出成功！');
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>技术优化</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        技术优化检查
      </h2>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartCheck}
            loading={checking}
            size="large"
          >
            开始全站检查
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportReport}>导出报告</Button>
          <Button onClick={() => setTaskModalVisible(true)}>设置定时任务</Button>
        </Space>
        {checking && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={checkProgress} status="active" />
            <p style={{ color: '#666', marginTop: 8 }}>正在检查中，请稍候...</p>
          </div>
        )}
      </Card>

      <Tabs defaultActiveKey="structure">
        <TabPane tab="基础结构检查" key="structure">
          <Card>
            <Alert
              message="Google技术优化检查"
              description="针对Google搜索引擎的核心优化指标，包括Core Web Vitals、移动适配、HTTPS安全、结构化数据等Google排名因素"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={structureChecks}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="问题页面" key="problems">
          <Card>
            <Alert
              message={`共发现 ${problemPages.length} 个问题页面`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={problemColumns}
              dataSource={problemPages}
              rowKey="id"
            />
          </Card>
        </TabPane>

        <TabPane tab="Google推送" key="push">
          <Card title="Google索引推送">
            <List
              itemLayout="horizontal"
              dataSource={[
                { name: 'Google Indexing API', status: 'active', count: 125, success: 118, lastPush: '2026-04-17 09:30' },
                { name: 'IndexNow Protocol', status: 'active', count: 45, success: 45, lastPush: '2026-04-17 09:30' },
                { name: 'Google Search Console', status: 'active', count: 200, success: 195, lastPush: '2026-04-17 08:00' },
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" onClick={() => message.info('配置功能开发中')}>配置</Button>,
                    <Button type="link" onClick={() => message.info('查看日志功能开发中')}>查看日志</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={`今日推送: ${item.count}条 | 成功: ${item.success}条 | 最后推送: ${item.lastPush}`}
                  />
                  <Tag color={item.status === 'active' ? 'success' : 'default'}>
                    {item.status === 'active' ? '已启用' : '未启用'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab="广告与安全" key="safety">
          <Card title="广告链接检查">
            <Alert
              message="所有广告链接已正确添加nofollow+sponsored属性"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={[
                { title: '广告位', dataIndex: 'position' },
                { title: '链接', dataIndex: 'url' },
                { title: '属性', dataIndex: 'attrs' },
                { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color="success">{s}</Tag> },
              ]}
              dataSource={[
                { position: '首页顶部', url: 'https://ad.example.com/1', attrs: 'nofollow, sponsored', status: '合规' },
                { position: '文章页侧边', url: 'https://ad.example.com/2', attrs: 'nofollow, sponsored', status: '合规' },
              ]}
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 查看详情弹窗 */}
      <Modal
        title={selectedCheckItem ? `${selectedCheckItem.name} - 问题详情` : '问题详情'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedIssueIds.length > 0 && (
            <Button 
              key="batchfix" 
              type="primary" 
              icon={<ToolOutlined />} 
              onClick={handleBatchFixSelected}
              loading={batchFixing}
            >
              修复选中 ({selectedIssueIds.length})
            </Button>
          ),
          issueDetails.length > 0 && (
            <Button key="fixall" type="primary" icon={<ToolOutlined />} onClick={handleFixAll}>
              一键修复全部 ({issueDetails.length})
            </Button>
          ),
        ]}
      >
        {selectedCheckItem && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="检查项">{selectedCheckItem.name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedCheckItem.status === 'success' ? 'success' : selectedCheckItem.status === 'warning' ? 'warning' : 'error'}>
                  {selectedCheckItem.status === 'success' ? '正常' : selectedCheckItem.status === 'warning' ? '警告' : '错误'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="检查总数">{selectedCheckItem.total}</Descriptions.Item>
              <Descriptions.Item label="通过数">{selectedCheckItem.passed}</Descriptions.Item>
              <Descriptions.Item label="失败数">{selectedCheckItem.failed}</Descriptions.Item>
              <Descriptions.Item label="通过率">
                {Math.round((selectedCheckItem.passed / selectedCheckItem.total) * 100)}%
              </Descriptions.Item>
            </Descriptions>

            {selectedIssueIds.length > 0 && (
              <Alert
                message={`已选择 ${selectedIssueIds.length} 个问题`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Button size="small" onClick={() => setSelectedIssueIds([])}>
                    清空选择
                  </Button>
                }
              />
            )}

            {issueDetails.length > 0 ? (
              <Table
                dataSource={issueDetails}
                rowKey="id"
                loading={detailLoading}
                pagination={false}
                size="small"
                rowSelection={rowSelection}
                columns={[
                  {
                    title: '页面URL',
                    dataIndex: 'url',
                    key: 'url',
                    render: (url: string) => <code>{url}</code>,
                  },
                  {
                    title: '问题描述',
                    dataIndex: 'description',
                    key: 'description',
                  },
                  {
                    title: '严重程度',
                    dataIndex: 'severity',
                    key: 'severity',
                    width: 100,
                    render: (severity: string) => (
                      <Tag color={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'default'}>
                        {severity === 'high' ? '高' : severity === 'medium' ? '中' : '低'}
                      </Tag>
                    ),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 100,
                    render: (_: unknown, record: IssueDetail) => (
                      <Button
                        type="primary"
                        size="small"
                        loading={fixingIssues[record.id]}
                        onClick={() => handleFixIssue(record.id)}
                      >
                        修复
                      </Button>
                    ),
                  },
                ]}
              />
            ) : (
              <Alert
                message="恭喜！"
                description="该检查项没有发现任何问题。"
                type="success"
                showIcon
              />
            )}
          </>
        )}
      </Modal>

      {/* 定时任务设置弹窗 */}
      <Modal
        title="定时任务设置"
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setTaskModalVisible(false)}>取消</Button>,
          <Button key="save" type="primary" onClick={() => message.success('定时任务保存成功')}>保存设置</Button>,
        ]}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item label="任务名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如：每日SEO检查" />
          </Form.Item>
          <Form.Item label="任务类型" name="type" rules={[{ required: true }]}>
            <Select placeholder="选择任务类型">
              <Select.Option value="check">SEO检查</Select.Option>
              <Select.Option value="sitemap">Sitemap生成</Select.Option>
              <Select.Option value="backlink">外链检测</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="执行时间" name="time" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="执行频率" name="frequency" rules={[{ required: true }]}>
            <Select placeholder="选择执行频率">
              <Select.Option value="daily">每天</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 24 }}>
          <h4>现有定时任务</h4>
          <Table
            size="small"
            dataSource={scheduledTasks}
            columns={[
              { title: '任务名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'type' },
              { title: '执行时间', dataIndex: 'cron' },
              { title: '状态', dataIndex: 'enabled', render: (enabled: boolean) => <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '禁用'}</Tag> },
              { title: '操作', render: () => <Button type="link" danger>删除</Button> },
            ]}
            pagination={false}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TechnicalSEO;

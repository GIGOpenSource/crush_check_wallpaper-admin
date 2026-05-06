import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, Alert, Tag, Space, Table, Modal, message, Tabs, Row, Col, Statistic, Breadcrumb, Select, Spin } from 'antd';
import { SaveOutlined, EyeOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, ArrowLeftOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRobotsContent, updateRobotsContent } from '../../services/robotsApi';

const { TabPane } = Tabs;
const { TextArea } = Input;

interface RobotsRule {
  id: number;
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  sitemap?: string;
}

const RobotsManager: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [addRuleModalVisible, setAddRuleModalVisible] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testUserAgent, setTestUserAgent] = useState('*');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [rules, setRules] = useState<RobotsRule[]>([
    {
      id: 1,
      userAgent: '*',
      allow: ['/wallpaper/', '/category/', '/tag/'],
      disallow: ['/admin/', '/api/', '/private/', '/search?'],
      crawlDelay: 1,
      sitemap: 'https://example.com/sitemap.xml',
    },
    {
      id: 2,
      userAgent: 'Googlebot',
      allow: ['/'],
      disallow: ['/admin/'],
      crawlDelay: 0,
    },
    {
      id: 3,
      userAgent: 'Googlebot-Image',
      allow: ['/wallpaper/', '/category/'],
      disallow: ['/admin/'],
      crawlDelay: 0,
    },
  ]);
  const [addRuleForm] = Form.useForm();
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [robotsContent, setRobotsContent] = useState('');
  
  // 规则验证状态
  const [validationResults, setValidationResults] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    details: string[];
  } | null>(null);
  const [validating, setValidating] = useState(false);

  const columns = [
    { title: 'User-agent', dataIndex: 'userAgent', key: 'userAgent', width: 150 },
    {
      title: 'Allow',
      dataIndex: 'allow',
      key: 'allow',
      render: (allow: string[]) => (
        <Space wrap>
          {allow.map((path, i) => <Tag key={i} color="success">{path}</Tag>)}
        </Space>
      ),
    },
    {
      title: 'Disallow',
      dataIndex: 'disallow',
      key: 'disallow',
      render: (disallow: string[]) => (
        <Space wrap>
          {disallow.map((path, i) => <Tag key={i} color="error">{path}</Tag>)}
        </Space>
      ),
    },
    { title: 'Crawl-delay', dataIndex: 'crawlDelay', key: 'crawlDelay', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: RobotsRule) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => message.info('查看功能开发中')}>查看</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  // 加载Robots内容
  const loadRobotsContent = async () => {
    setLoading(true);
    try {
      const response = await getRobotsContent();
      const content = response.content || '';
      setRobotsContent(content);
      form.setFieldsValue({ content });
    } catch (error) {
      console.error('加载Robots内容失败:', error);
      message.error('加载Robots内容失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRobotsContent();
  }, []);

  const handleSave = async () => {
    const content = form.getFieldValue('content');
    
    if (!content || !content.trim()) {
      message.error('Robots.txt内容不能为空');
      return;
    }

    setSaving(true);
    try {
      await updateRobotsContent(content);
      message.success('Robots.txt 保存成功');
      // 刷新内容
      await loadRobotsContent();
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error(error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = () => {
    addRuleForm.validateFields().then((values) => {
      const newRule: RobotsRule = {
        id: Date.now(),
        userAgent: values.userAgent,
        allow: values.allow ? values.allow.split('\n').filter((p: string) => p.trim()) : [],
        disallow: values.disallow ? values.disallow.split('\n').filter((p: string) => p.trim()) : [],
        crawlDelay: values.crawlDelay || 0,
        sitemap: values.sitemap,
      };
      setRules([...rules, newRule]);
      message.success('规则添加成功');
      setAddRuleModalVisible(false);
      addRuleForm.resetFields();
    });
  };

  const handleDeleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
    message.success('规则已删除');
  };

  // 验证Robots规则
  const validateRules = () => {
    setValidating(true);
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 检查是否有通用规则
    const hasUniversalRule = rules.some(r => r.userAgent === '*');
    if (!hasUniversalRule) {
      warnings.push('缺少通用规则 (User-agent: *)，建议添加以覆盖所有爬虫');
    }
    
    // 检查规则冲突
    rules.forEach((rule, index) => {
      // 检查Allow和Disallow冲突
      const conflicts = rule.allow.filter(a => 
        rule.disallow.some(d => a.startsWith(d) || d.startsWith(a))
      );
      if (conflicts.length > 0) {
        errors.push(`规则 ${index + 1}: Allow和Disallow存在冲突路径: ${conflicts.join(', ')}`);
      }
      
      // 检查路径格式
      rule.allow.forEach(path => {
        if (!path.startsWith('/')) {
          errors.push(`规则 ${index + 1}: Allow路径 "${path}" 必须以 "/" 开头`);
        }
      });
      
      rule.disallow.forEach(path => {
        if (!path.startsWith('/')) {
          errors.push(`规则 ${index + 1}: Disallow路径 "${path}" 必须以 "/" 开头`);
        }
      });
      
      // 检查crawlDelay
      if (rule.crawlDelay && (rule.crawlDelay < 0 || rule.crawlDelay > 60)) {
        warnings.push(`规则 ${index + 1}: Crawl-delay ${rule.crawlDelay} 超出推荐范围 (0-60)`);
      }
    });
    
    // 检查是否有Sitemap
    const hasSitemap = rules.some(r => r.sitemap);
    if (!hasSitemap) {
      warnings.push('未配置Sitemap，建议添加以帮助搜索引擎更好地索引网站');
    }
    
    setTimeout(() => {
      if (errors.length > 0) {
        setValidationResults({
          type: 'error',
          message: `发现 ${errors.length} 个错误，请修复后再保存`,
          details: [...errors, ...warnings],
        });
      } else if (warnings.length > 0) {
        setValidationResults({
          type: 'warning',
          message: `发现 ${warnings.length} 个警告，建议优化`,
          details: warnings,
        });
      } else {
        setValidationResults({
          type: 'success',
          message: '规则验证通过，未发现异常',
          details: ['所有Robots规则格式正确，无冲突'],
        });
      }
      setValidating(false);
    }, 500);
  };

  const handleTest = async () => {
    if (!testUrl) {
      message.warning('请输入要测试的URL');
      return;
    }
    
    // 本地解析robots规则
    const content = form.getFieldValue('content') || '';
    const lines = content.split('\n');
    const results: any[] = [];
    
    // 简单的robots规则解析
    let currentUserAgent = '';
    let matched = false;
    let result = 'Allow';
    let matchedRule = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        currentUserAgent = trimmed.substring(11).trim();
        // 检查是否匹配当前测试的User-Agent
        if (currentUserAgent === testUserAgent || currentUserAgent === '*') {
          matched = true;
        } else {
          matched = false;
        }
      } else if (matched) {
        if (trimmed.toLowerCase().startsWith('disallow:')) {
          const path = trimmed.substring(9).trim();
          if (testUrl.startsWith(path)) {
            result = 'Disallow';
            matchedRule = `Disallow: ${path}`;
          }
        } else if (trimmed.toLowerCase().startsWith('allow:')) {
          const path = trimmed.substring(6).trim();
          if (testUrl.startsWith(path)) {
            result = 'Allow';
            matchedRule = `Allow: ${path}`;
          }
        }
      }
    }
    
    setTestResults([{
      userAgent: testUserAgent,
      result,
      rule: matchedRule || '无匹配规则',
      explanation: result === 'Allow' ? '搜索引擎可以抓取此URL' : '搜索引擎禁止抓取此URL',
    }]);
    
    message.success('测试完成');
  };

  const generateRobotsContent = () => {
    let content = '';
    rules.forEach((rule) => {
      content += `User-agent: ${rule.userAgent}\n`;
      rule.allow.forEach((path) => {
        content += `Allow: ${path}\n`;
      });
      rule.disallow.forEach((path) => {
        content += `Disallow: ${path}\n`;
      });
      if (rule.crawlDelay && rule.crawlDelay > 0) {
        content += `Crawl-delay: ${rule.crawlDelay}\n`;
      }
      content += '\n';
    });
    content += `Sitemap: https://example.com/sitemap.xml`;
    return content;
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/seo')}>SEO管理</a></Breadcrumb.Item>
        <Breadcrumb.Item>Robots.txt</Breadcrumb.Item>
      </Breadcrumb>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seo')} style={{ marginRight: 8 }} />
        Robots.txt 管理
      </h2>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="规则数量" value={rules.length} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Allow路径" value={8} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Disallow路径" value={12} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="最后更新" value="2小时前" />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="editor">
        <TabPane tab="可视化编辑" key="editor">
          <Card>
            <Alert
              message="Robots.txt 作用说明"
              description="Robots.txt 用于告诉搜索引擎哪些页面可以抓取，哪些不可以。错误的配置可能导致重要页面无法被收录！"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {/* 规则验证结果 */}
            {validationResults && (
              <Alert
                message={validationResults.message}
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validationResults.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                }
                type={validationResults.type}
                showIcon
                closable
                onClose={() => setValidationResults(null)}
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Table columns={columns} dataSource={rules} rowKey="id" pagination={false} />
            <Space style={{ marginTop: 16 }}>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => setAddRuleModalVisible(true)}>
                添加规则
              </Button>
              <Button icon={<CheckCircleOutlined />} onClick={validateRules} loading={validating}>
                验证规则
              </Button>
            </Space>
          </Card>
        </TabPane>

        <TabPane tab="代码编辑" key="code">
          <Card
            title="Robots.txt 内容"
            extra={
              <Space>
                <Button icon={<EyeOutlined />} onClick={() => setPreviewModalVisible(true)}>
                  预览
                </Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                  保存
                </Button>
              </Space>
            }
          >
            <Spin spinning={loading} tip="加载中...">
              <Form form={form}>
                <Form.Item name="content">
                  <TextArea
                    rows={20}
                    style={{ fontFamily: 'monospace', fontSize: 14 }}
                    placeholder="请输入Robots.txt内容..."
                  />
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </TabPane>

        <TabPane tab="规则测试" key="test">
          <Card title="URL抓取测试">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="测试说明"
                description="输入URL路径和User-Agent，测试搜索引擎是否可以抓取该页面"
                type="info"
                showIcon
              />
              <Space>
                <Select
                  value={testUserAgent}
                  onChange={setTestUserAgent}
                  style={{ width: 200 }}
                  placeholder="选择User-Agent"
                >
                  <Select.Option value="*">所有爬虫 (*)</Select.Option>
                  <Select.Option value="Googlebot">Googlebot</Select.Option>
                  <Select.Option value="Googlebot-Image">Googlebot-Image</Select.Option>
                  <Select.Option value="Bingbot">Bingbot</Select.Option>
                  <Select.Option value="Baiduspider">Baiduspider</Select.Option>
                </Select>
                <Input
                  placeholder="输入URL路径，如：/wallpaper/123"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  style={{ width: 300 }}
                />
                <Button type="primary" icon={<ExperimentOutlined />} onClick={handleTest}>测试</Button>
              </Space>
              {testResults.length > 0 && (
                <Table
                  columns={[
                    { title: 'User-agent', dataIndex: 'userAgent' },
                    { title: '结果', dataIndex: 'result', render: (r: string) => <Tag color={r === 'Allow' ? 'success' : 'error'}>{r}</Tag> },
                    { title: '匹配规则', dataIndex: 'rule' },
                    { title: '说明', dataIndex: 'explanation' },
                  ]}
                  dataSource={testResults}
                  pagination={false}
                />
              )}
            </Space>
          </Card>
        </TabPane>

        <TabPane tab="最佳实践" key="guide">
          <Card title="Robots.txt 配置指南">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="必须禁止的路径"
                description="后台管理、用户隐私、API接口等敏感路径必须禁止抓取"
                type="warning"
                showIcon
              />
              <Alert
                message="建议允许的路径"
                description="文章页、分类页、标签页等核心内容页面应该允许抓取"
                type="success"
                showIcon
              />
              <Alert
                message="常见错误"
                description="不要禁止 CSS/JS 文件，会影响搜索引擎正确渲染页面；不要使用 robots.txt 隐藏敏感内容"
                type="error"
                showIcon
              />
              <Card type="inner" title="推荐配置模板">
                <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
{`# Allow all search engines
User-agent: *
Allow: /wallpaper/
Allow: /category/
Allow: /tag/
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /search?
Crawl-delay: 1

# Googlebot
User-agent: Googlebot
Allow: /
Disallow: /admin/

# Google Images
User-agent: Googlebot-Image
Allow: /wallpaper/
Allow: /category/
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml`}
                </pre>
              </Card>
            </Space>
          </Card>
        </TabPane>
      </Tabs>

      {/* 预览弹窗 */}
      <Modal
        title="Robots.txt 预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
          {generateRobotsContent()}
        </pre>
      </Modal>

      {/* 测试结果弹窗 */}
      <Modal
        title="测试结果"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={[<Button key="close" onClick={() => setTestModalVisible(false)}>关闭</Button>]}
      >
        <p><strong>测试URL:</strong> {testUrl}</p>
        <Alert
          message="该URL可以被所有搜索引擎抓取"
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* 添加规则弹窗 */}
      <Modal
        title="添加 Robots 规则"
        open={addRuleModalVisible}
        onCancel={() => setAddRuleModalVisible(false)}
        onOk={handleAddRule}
        okText="添加"
        cancelText="取消"
        width={600}
      >
        <Form form={addRuleForm} layout="vertical">
          <Form.Item
            name="userAgent"
            label="User-agent"
            rules={[{ required: true, message: '请输入User-agent' }]}
          >
            <Input placeholder="例如: * 或 Googlebot" />
          </Form.Item>
          <Form.Item
            name="allow"
            label="Allow 路径"
          >
            <TextArea rows={3} placeholder="每行一个路径，例如:/wallpaper/" />
          </Form.Item>
          <Form.Item
            name="disallow"
            label="Disallow 路径"
          >
            <TextArea rows={3} placeholder="每行一个路径，例如:/admin/" />
          </Form.Item>
          <Form.Item
            name="crawlDelay"
            label="Crawl-delay (秒)"
          >
            <Input type="number" min={0} placeholder="抓取延迟秒数" />
          </Form.Item>
          <Form.Item
            name="sitemap"
            label="Sitemap 地址"
          >
            <Input placeholder="https://example.com/sitemap.xml" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RobotsManager;

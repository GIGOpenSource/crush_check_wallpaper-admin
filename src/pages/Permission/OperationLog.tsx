import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Modal, Button, Row, Col, Input, DatePicker, Form } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { 
  getOperationLogList,
  getOperationLogDetail,
  type OperationLog,
} from '../../services/operationLogApi';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const OperationLog: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<OperationLog | null>(null);
  
  // 搜索状态
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState<{
    operator?: string;
    module?: string;
    action?: string;
    start_time?: string;
    end_time?: string;
  }>({});

  // 加载日志列表
  const loadLogs = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const response = await getOperationLogList(page, pageSize, searchParams);
      setLogs(response.results || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('加载操作日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  // 搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: any = {
      operator: values.operator,
      module: values.module,
      action: values.action,
    };
    
    if (values.dateRange && values.dateRange.length === 2) {
      params.start_time = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
      params.end_time = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
    }
    
    setSearchParams(params);
    setCurrentPage(1);
    loadLogs(1);
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
    setCurrentPage(1);
    loadLogs(1);
  };

  // 查看详情
  const handleViewDetail = async (record: OperationLog) => {
    try {
      setLoading(true);
      const detail = await getOperationLogDetail(record.id);
      setCurrentLog(detail);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('加载日志详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 操作类型颜色映射
  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      '创建': 'green',
      '修改': 'blue',
      '删除': 'red',
      '审核通过': 'green',
      '审核拒绝': 'red',
      '导出': 'purple',
      '登录': 'cyan',
      '登出': 'default',
    };
    return colorMap[action] || 'default';
  };

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80,
      fixed: 'left' as const,
    },
    { 
      title: '操作人', 
      dataIndex: 'operator_name', 
      key: 'operator_name',
      width: 120,
      render: (name: string, record: OperationLog) => name || record.operator || '--',
    },
    { 
      title: '操作模块', 
      dataIndex: 'module', 
      key: 'module',
      width: 120,
      render: (module: string) => (
        <Tag color="blue">{module}</Tag>
      ),
    },
    { 
      title: '操作类型', 
      dataIndex: 'operation_type_display', 
      key: 'operation_type_display',
      width: 120,
      render: (type: string) => (
        <Tag color={getActionColor(type || '')}>{type || '--'}</Tag>
      ),
    },
    { 
      title: '操作对象', 
      key: 'operator_info',
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: OperationLog) => {
        const username = record.operator_info?.username;
        return username || '--';
      },
    },
    { 
      title: 'IP地址', 
      dataIndex: 'ip_address', 
      key: 'ip_address',
      width: 140,
      render: (ip: string) => ip || '--',
    },
    { 
      title: '请求方式', 
      dataIndex: 'request_method', 
      key: 'request_method',
      width: 100,
      render: (method: string) => {
        if (!method) return '--';
        const colorMap: Record<string, string> = {
          'GET': 'green',
          'POST': 'blue',
          'PUT': 'orange',
          'DELETE': 'red',
        };
        return <Tag color={colorMap[method] || 'default'}>{method}</Tag>;
      },
    },
    { 
      title: '状态', 
      dataIndex: 'response_code', 
      key: 'response_code',
      width: 100,
      render: (code: number) => {
        if (!code) return '--';
        const color = code >= 200 && code < 300 ? 'success' : 'error';
        return <Tag color={color}>{code}</Tag>;
      },
    },
    // { 
    //   title: '耗时', 
    //   dataIndex: 'duration', 
    //   key: 'duration',
    //   width: 100,
    //   render: (duration: number) => {
    //     if (!duration) return '--';
    //     const color = duration > 1000 ? 'error' : duration > 500 ? 'warning' : 'success';
    //     return <Tag color={color}>{duration}ms</Tag>;
    //   },
    // },
    { 
      title: '操作时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      width: 180,
      render: (time: string) => {
        if (!time) return '--';
        return new Date(time).toLocaleString('zh-CN', {
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
      fixed: 'right' as const,
      render: (_: unknown, record: OperationLog) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          style={{ padding: 0 }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>操作日志</h2>
      <Card>
        {/* 搜索区域 */}
        <Form form={form} style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '16px',
            alignItems: 'flex-end',
            marginBottom: '16px'
          }}>
            <div style={{ flex: '0 0 auto', minWidth: 240 }}>
              <Form.Item 
                name="operator" 
                label="操作人" 
                style={{ marginBottom: 0 }}
                labelCol={{ style: { width: 70 } }}
                wrapperCol={{ flex: 1 }}
              >
                <Input placeholder="请输入操作人" allowClear />
              </Form.Item>
            </div>
            
            <div style={{ flex: '0 0 auto', minWidth: 240 }}>
              <Form.Item 
                name="module" 
                label="操作模块" 
                style={{ marginBottom: 0 }}
                labelCol={{ style: { width: 70 } }}
                wrapperCol={{ flex: 1 }}
              >
                <Input placeholder="请输入模块" allowClear />
              </Form.Item>
            </div>
            
            <div style={{ flex: '0 0 auto', minWidth: 280 }}>
              <Form.Item 
                name="action" 
                label="操作类型" 
                style={{ marginBottom: 0 }}
                labelCol={{ style: { width: 70 } }}
                wrapperCol={{ flex: 1 }}
              >
                <Input placeholder="请输入操作类型" allowClear />
              </Form.Item>
            </div>
            
            <div style={{ flex: '0 0 auto', minWidth: 380 }}>
              <Form.Item 
                name="dateRange" 
                label="操作时间" 
                style={{ marginBottom: 0 }}
                labelCol={{ style: { width: 70 } }}
                wrapperCol={{ flex: 1 }}
              >
                <RangePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Form.Item>
            </div>
            
            {/* 搜索和重置按钮 */}
            <div style={{ flex: '0 0 auto' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </div>
          </div>
        </Form>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page) => {
              setCurrentPage(page);
              loadLogs(page);
            },
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            size: 'default',
          }}
          locale={{ emptyText: (
            <div style={{ padding: '40px 0', color: '#999' }}>
              {/* <div style={{ fontSize: 16, marginBottom: 8 }}>📋</div> */}
              <div>暂无操作日志</div>
            </div>
          )}}
          size="middle"
          bordered={false}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="操作日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {currentLog && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1890ff' }}>
                基本信息
              </div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>操作人</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {currentLog.operator_info?.username || currentLog.operator || '--'}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>操作模块</div>
                    <div>
                      <Tag color="blue" style={{ fontSize: 14 }}>{currentLog.module}</Tag>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>操作类型</div>
                    <div>
                      <Tag color={getActionColor(currentLog.operation_type_display || '')} style={{ fontSize: 14 }}>
                        {currentLog.operation_type_display || '--'}
                      </Tag>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1890ff' }}>
                网络信息
              </div>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>操作对象</div>
                    <div style={{ fontSize: 14 }}>{currentLog.operator_info?.username || '--'}</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>IP地址</div>
                    <div style={{ fontSize: 14, fontFamily: 'monospace' }}>{currentLog.ip_address || '--'}</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>请求方式</div>
                    <div>
                      {currentLog.request_method ? (
                        <Tag color={
                          currentLog.request_method === 'GET' ? 'green' :
                          currentLog.request_method === 'POST' ? 'blue' :
                          currentLog.request_method === 'PUT' ? 'orange' :
                          currentLog.request_method === 'DELETE' ? 'red' : 'default'
                        }>
                          {currentLog.request_method}
                        </Tag>
                      ) : '--'}
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>状态码</div>
                    <div>
                      {currentLog.response_code ? (
                        <Tag color={currentLog.response_code >= 200 && currentLog.response_code < 300 ? 'success' : 'error'}>
                          {currentLog.response_code}
                        </Tag>
                      ) : '--'}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1890ff' }}>
                性能信息
              </div>
              <Row gutter={16}>
                {/* <Col span={12}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>请求耗时</div>
                    <div style={{ fontSize: 14 }}>
                      {currentLog.duration ? (
                        <Tag color={
                          currentLog.duration > 1000 ? 'error' :
                          currentLog.duration > 500 ? 'warning' : 'success'
                        }>
                          {currentLog.duration}ms
                        </Tag>
                      ) : '--'}
                    </div>
                  </div>
                </Col> */}
                <Col span={12}>
                  <div style={{ 
                    background: '#f5f7fa', 
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ color: '#999', marginBottom: 6, fontSize: 12 }}>操作时间</div>
                    <div style={{ fontSize: 14 }}>
                      {currentLog.created_at ? new Date(currentLog.created_at).toLocaleString('zh-CN') : '--'}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1890ff' }}>
                请求详情
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', marginBottom: 8, fontSize: 12 }}>请求URL</div>
                <div style={{ 
                  background: '#f5f7fa', 
                  padding: '12px 16px', 
                  borderRadius: 8,
                  border: '1px solid #e8e8e8',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: 13
                }}>
                  {currentLog.request_url || '--'}
                </div>
              </div>
              
              {/* <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', marginBottom: 8, fontSize: 12 }}>请求参数</div>
                <TextArea
                  value={currentLog.request_params || '--'}
                  readOnly
                  rows={4}
                  style={{ 
                    fontFamily: 'monospace',
                    fontSize: 13,
                    background: '#f5f7fa',
                    border: '1px solid #e8e8e8',
                    borderRadius: 8
                  }}
                />
              </div> */}
              
              {/* <div>
                <div style={{ color: '#999', marginBottom: 8, fontSize: 12 }}>响应信息</div>
                <div style={{ 
                  background: '#f5f7fa', 
                  padding: '12px 16px', 
                  borderRadius: 8,
                  border: '1px solid #e8e8e8',
                  fontSize: 13
                }}>
                  {currentLog.response_msg || '--'}
                </div>
              </div> */}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OperationLog;

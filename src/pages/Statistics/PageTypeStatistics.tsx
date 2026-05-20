import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, Row, Col, Statistic, Spin, message, Button } from 'antd';
import { DesktopOutlined, MobileOutlined, GlobalOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { getPageStatsDashboard, getPageDetails } from '../../services/pageStatsApi';
import type { PageStatsDashboard, PageDetail } from '../../services/pageStatsApi';

interface PageTypeStatItem {
  type: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const PageTypeStatistics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<PageStatsDashboard | null>(null);
  const [pageData, setPageData] = useState<PageDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 获取Dashboard数据
  const fetchDashboardData = async () => {
    console.log('=== 开始获取Dashboard数据 ===');
    try {
      setLoading(true);
      console.log('调用 getPageStatsDashboard()...');
      const res = await getPageStatsDashboard();
      console.log('接口返回数据:', res);
      
      // 根据项目规范，拦截器已返回 res.data，直接检查 res
      if (res) {
        console.log('设置Dashboard数据:', res);
        setDashboardData(res);
      } else {
        console.warn('接口返回失败:', res);
        message.error('获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败，请检查接口是否可用');
    } finally {
      setLoading(false);
      console.log('=== Dashboard数据获取完成 ===');
    }
  };

  // 获取页面详细列表
  const fetchPageDetails = async (page: number = 1, size: number = 10) => {
    console.log('=== 开始获取页面详细列表 ===', { page, size });
    try {
      setLoading(true);
      console.log('调用 getPageDetails()...');
      const res = await getPageDetails({
        currentPage: page,
        pageSize: size,
      });
      console.log('接口返回数据:', res);
      
      // 根据项目规范，拦截器已返回 res.data
      if (res) {
        console.log('设置页面列表数据:', res.results);
        const dataArray = Array.isArray(res.results) ? res.results : [];
        setPageData(dataArray);
        setTotal(res.pagination?.total || 0);
      } else {
        console.warn('接口返回失败:', res);
        message.error('获取页面列表失败');
      }
    } catch (error) {
      console.error('获取页面列表失败:', error);
      message.error('获取页面列表失败，请检查接口是否可用');
    } finally {
      setLoading(false);
      console.log('=== 页面详细列表获取完成 ===');
    }
  };

  useEffect(() => {
    console.log('=== 组件加载，初始化数据 ===');
    fetchDashboardData();
    fetchPageDetails(currentPage, pageSize);
  }, []);

  // 刷新数据
  const handleRefresh = async () => {
    console.log('=== 手动刷新数据 ===');
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchPageDetails(currentPage, pageSize),
      ]);
      message.success('数据刷新成功');
    } catch (error) {
      console.error('刷新数据失败:', error);
      message.error('刷新数据失败');
    } finally {
      setLoading(false);
      console.log('=== 数据刷新完成 ===');
    }
  };

  // 页面类型分布统计（根据实际接口返回的数据调整）
  const typeStats: PageTypeStatItem[] = [
    { 
      type: 'desktop', 
      name: '桌面端', 
      count: dashboardData?.desktop_visits || 0, 
      icon: <DesktopOutlined />, 
      color: '#52c41a' 
    },
    { 
      type: 'android', 
      name: 'Android端', 
      count: dashboardData?.android_visits || 0, 
      icon: <MobileOutlined />, 
      color: '#3ddc84' 
    },
    { 
      type: 'ios', 
      name: 'iOS端', 
      count: dashboardData?.ios_visits || 0, 
      icon: <MobileOutlined />, 
      color: '#007aff' 
    },
    { 
      type: 'tablet', 
      name: '平板端', 
      count: dashboardData?.tablet_visits || 0, 
      icon: <GlobalOutlined />, 
      color: '#722ed1' 
    },
  ];

  const getPageTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      desktop: { color: 'blue', text: '桌面端' },
      mobile: { color: 'orange', text: '移动端' },
      responsive: { color: 'green', text: '响应式' },
      hybrid: { color: 'purple', text: '混合式' },
    };
    const { color, text } = typeMap[type] || { color: 'default', text: type };
    return <Tag color={color}>{text}</Tag>;
  };

  const getDeviceTypeTag = (deviceType?: string) => {
    if (!deviceType) return <Tag>-</Tag>;
    const deviceMap: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
      pc: { color: 'blue', text: 'PC', icon: <DesktopOutlined /> },
      mobile: { color: 'green', text: 'Mobile', icon: <MobileOutlined /> },
      ipad: { color: 'purple', text: 'iPad', icon: <GlobalOutlined /> },
    };
    const deviceInfo = deviceMap[deviceType] || { color: 'default', text: deviceType };
    return (
      <Tag color={deviceInfo.color} icon={deviceInfo.icon}>
        {deviceInfo.text}
      </Tag>
    );
  };

  const getSeoProgress = (score: number) => {
    let status: 'success' | 'normal' | 'exception' = 'normal';
    if (score >= 90) status = 'success';
    else if (score >= 70) status = 'normal';
    else status = 'exception';
    return <Progress percent={score} size="small" status={status} />;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      align: 'center' as const,
    },
    {
      title: '页面名称',
      dataIndex: 'page_name',
      key: 'page_name',
      width: 120,
      ellipsis: true,
    },
    {
      title: '页面路径',
      dataIndex: 'page_path',
      key: 'page_path',
      width: 200,
      ellipsis: true,
      render: (path: string) => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{path}</code>,
    },
    {
      title: '页面类型',
      dataIndex: 'page_type',
      key: 'page_type',
      width: 100,
      align: 'center' as const,
      render: (type: string) => getPageTypeTag(type),
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      width: 100,
      align: 'center' as const,
      render: (deviceType?: string) => getDeviceTypeTag(deviceType),
    },
    {
      title: '访问量',
      dataIndex: 'visit_count',
      key: 'visit_count',
      width: 100,
      align: 'right' as const,
      sorter: (a: PageDetail, b: PageDetail) => a.visit_count - b.visit_count,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '平均停留',
      dataIndex: 'avg_stay_time',
      key: 'avg_stay_time',
      width: 100,
      align: 'right' as const,
      render: (time: number) => `${time.toFixed(2)}秒`,
    },
    {
      title: '跳出率',
      dataIndex: 'bounce_rate',
      key: 'bounce_rate',
      width: 90,
      align: 'right' as const,
      sorter: (a: PageDetail, b: PageDetail) => a.bounce_rate - b.bounce_rate,
      render: (rate: number) => `${rate}%`,
    },
    {
      title: 'SEO评分',
      dataIndex: 'seo_score',
      key: 'seo_score',
      width: 120,
      align: 'center' as const,
      sorter: (a: PageDetail, b: PageDetail) => a.seo_score - b.seo_score,
      render: (score: number) => getSeoProgress(score),
    },
    {
      title: '最后更新',
      dataIndex: 'last_updated',
      key: 'last_updated',
      width: 180,
      sorter: (a: PageDetail, b: PageDetail) => new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime(),
      render: (time: string) => {
        if (!time) return '-';
        const date = new Date(time);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      },
    },
    {
      title: '状态',
      dataIndex: 'status_display',
      key: 'status_display',
      width: 80,
      align: 'center' as const,
      render: (display: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          '正常': { color: 'success', text: '正常' },
          '停用': { color: 'default', text: '停用' },
          '启用': { color: 'success', text: '启用' },
        };
        const statusInfo = statusMap[display || ''] || { color: 'default', text: display || '--' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        {/* 页面标题和刷新按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>前端页面类型统计</h2>
          <Button 
            type="primary" 
            icon={<ReloadOutlined spin={loading} />} 
            onClick={handleRefresh} 
            loading={loading}
          >
            刷新数据
          </Button>
        </div>

        {/* 页面类型分布卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {typeStats.map((stat) => (
            <Col xs={12} sm={12} lg={6} key={stat.type}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 24,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#666' }}>{stat.name}</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{stat.count} 个</div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 统计概览 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title="总页面数" value={dashboardData?.total_pages || 0} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title="总访问量" value={dashboardData?.total_visits?.toLocaleString() || '0'} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title="平均SEO评分" value={dashboardData?.avg_seo_score?.toFixed(1) || '0.0'} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title="平均跳出率" value={`${dashboardData?.avg_bounce_rate || '0.0'}%`} />
            </Card>
          </Col>
        </Row>

        {/* 详细表格 */}
        <Card title="页面详细统计">
          <Table
            columns={columns}
            dataSource={pageData}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个页面`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
                fetchPageDetails(page, size);
              },
            }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default PageTypeStatistics;
import React from 'react';
import { Card, Row, Col, Statistic, Tabs } from 'antd';
import { Line, Pie } from '@ant-design/charts';
import { UserOutlined, PictureOutlined, EyeOutlined, LikeOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const Statistics: React.FC = () => {
  const userGrowthData = [
    { date: '2026-04-10', value: 120 },
    { date: '2026-04-11', value: 132 },
    { date: '2026-04-12', value: 101 },
    { date: '2026-04-13', value: 134 },
    { date: '2026-04-14', value: 90 },
    { date: '2026-04-15', value: 230 },
    { date: '2026-04-16', value: 210 },
  ];

  const categoryData = [
    { type: 'PC壁纸', value: 18600 },
    { type: '手机壁纸', value: 22400 },
    { type: '静态壁纸', value: 34200 },
    { type: '动态壁纸', value: 6800 },
  ];

  const lineConfig = {
    data: userGrowthData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    height: 300,
  };

  const pieConfig = {
    data: categoryData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    height: 300,
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据统计</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总用户数" value={12580} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总壁纸数" value={45620} prefix={<PictureOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总浏览量" value={1256800} prefix={<EyeOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总点赞数" value={234500} prefix={<LikeOutlined />} /></Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="用户统计" key="1">
            <Line {...lineConfig} />
          </TabPane>
          <TabPane tab="内容统计" key="2">
            <Pie {...pieConfig} />
          </TabPane>
          <TabPane tab="互动统计" key="3">
            <Line {...lineConfig} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Statistics;

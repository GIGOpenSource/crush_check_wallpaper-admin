import React, { useState } from 'react';
import { Table, Card, Button, Select, Switch, Space, Tag, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SaveOutlined } from '@ant-design/icons';

interface NavTag {
  id: number;
  tagId: number;
  tagName: string;
  navName: string;
  region: string;
  sort: number;
  isShow: boolean;
  wallpaperCount: number;
}

const NavigationTag: React.FC = () => {
  const [loading] = useState(false);

  // 模拟导航标签数据
  const [navData, setNavData] = useState<NavTag[]>([
    { id: 1, tagId: 1, tagName: '星空', navName: '星空', region: 'global', sort: 1, isShow: true, wallpaperCount: 1250 },
    { id: 2, tagId: 2, tagName: '动漫', navName: '二次元', region: 'global', sort: 2, isShow: true, wallpaperCount: 980 },
    { id: 3, tagId: 3, tagName: '风景', navName: '风景', region: 'global', sort: 3, isShow: true, wallpaperCount: 1560 },
    { id: 4, tagId: 4, tagName: '4K', navName: '4K超清', region: 'global', sort: 4, isShow: true, wallpaperCount: 2340 },
    { id: 5, tagId: 5, tagName: '极简', navName: '极简主义', region: 'global', sort: 5, isShow: false, wallpaperCount: 670 },
  ]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newData = [...navData];
    [newData[index], newData[index - 1]] = [newData[index - 1], newData[index]];
    // 更新排序值
    newData.forEach((item, i) => {
      item.sort = i + 1;
    });
    setNavData(newData);
  };

  const handleMoveDown = (index: number) => {
    if (index === navData.length - 1) return;
    const newData = [...navData];
    [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
    // 更新排序值
    newData.forEach((item, i) => {
      item.sort = i + 1;
    });
    setNavData(newData);
  };

  const handleShowChange = (id: number, checked: boolean) => {
    const newData = navData.map((item) =>
      item.id === id ? { ...item, isShow: checked } : item
    );
    setNavData(newData);
    message.success(`已${checked ? '显示' : '隐藏'}导航标签`);
  };

  const handleSave = () => {
    message.success('保存成功');
  };

  const columns = [
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '标签名称',
      dataIndex: 'tagName',
      key: 'tagName',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '导航显示名称',
      dataIndex: 'navName',
      key: 'navName',
    },
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
      render: (region: string) => region === 'global' ? '全球' : region,
    },
    {
      title: '壁纸数量',
      dataIndex: 'wallpaperCount',
      key: 'wallpaperCount',
    },
    {
      title: '显示',
      dataIndex: 'isShow',
      key: 'isShow',
      render: (isShow: boolean, record: NavTag) => (
        <Switch
          checked={isShow}
          onChange={(checked) => handleShowChange(record.id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, _record: NavTag, index: number) => (
        <Space>
          <Button
            type="text"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveUp(index)}
          />
          <Button
            type="text"
            icon={<ArrowDownOutlined />}
            disabled={index === navData.length - 1}
            onClick={() => handleMoveDown(index)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>导航标签管理</h2>
      
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="选择标签"
              style={{ width: 200 }}
              options={[
                { value: 1, label: '星空' },
                { value: 2, label: '动漫' },
                { value: 3, label: '风景' },
              ]}
            />
            <Button type="primary">添加到导航</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存排序
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={navData}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default NavigationTag;

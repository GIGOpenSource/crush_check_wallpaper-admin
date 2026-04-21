import React from 'react';
import { Table, Card } from 'antd';

const OperationLog: React.FC = () => {
  const logs = [
    { id: 1, operator: 'admin', module: '用户管理', action: '删除用户', target: '用户123', ip: '192.168.1.1', time: '2026-04-17 10:30:00' },
    { id: 2, operator: 'admin', module: '壁纸管理', action: '审核通过', target: '壁纸456', ip: '192.168.1.1', time: '2026-04-17 10:25:00' },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '操作模块', dataIndex: 'module', key: 'module' },
    { title: '操作类型', dataIndex: 'action', key: 'action' },
    { title: '操作对象', dataIndex: 'target', key: 'target' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    { title: '操作时间', dataIndex: 'time', key: 'time' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>操作日志</h2>
      <Card>
        <Table columns={columns} dataSource={logs} rowKey="id" />
      </Card>
    </div>
  );
};

export default OperationLog;

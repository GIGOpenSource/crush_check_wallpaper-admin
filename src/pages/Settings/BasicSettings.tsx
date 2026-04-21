import React from 'react';
import { Card, Form, Input, Switch, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const BasicSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = () => {
    message.success('保存成功');
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>基础设置</h2>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="siteName" label="站点名称" rules={[{ required: true }]}>
            <Input placeholder="请输入站点名称" />
          </Form.Item>
          <Form.Item name="siteDescription" label="站点描述">
            <Input.TextArea rows={3} placeholder="请输入站点描述" />
          </Form.Item>
          <Form.Item name="icp" label="备案号">
            <Input placeholder="请输入备案号" />
          </Form.Item>
          <Form.Item name="contactEmail" label="联系邮箱">
            <Input placeholder="请输入联系邮箱" />
          </Form.Item>
          <Form.Item name="auditEnabled" label="开启壁纸审核" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="commentEnabled" label="开启评论审核" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="registerEnabled" label="允许用户注册" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存设置</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BasicSettings;

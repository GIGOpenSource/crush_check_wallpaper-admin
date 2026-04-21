import React from 'react';
import { Card, Form, Input, Select, Button, Radio, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const SendNotification: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = () => {
    message.success('通知发送成功');
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>发送通知</h2>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="通知标题" rules={[{ required: true }]}>
            <Input placeholder="请输入通知标题" />
          </Form.Item>
          <Form.Item name="type" label="通知类型" rules={[{ required: true }]}>
            <Select options={[{ value: 'system', label: '系统通知' }, { value: 'feature', label: '功能更新' }, { value: 'activity', label: '活动通知' }]} />
          </Form.Item>
          <Form.Item name="target" label="发送对象" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="all">全部用户</Radio>
              <Radio value="specific">指定用户</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="content" label="通知内容" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="请输入通知内容" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />}>发送通知</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SendNotification;

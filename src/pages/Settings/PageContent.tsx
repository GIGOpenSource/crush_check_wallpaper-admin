import React from 'react';
import { Card, Form, Input, Button, Tabs, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { TabPane } = Tabs;

const PageContent: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = () => {
    message.success('保存成功');
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>页面内容管理</h2>
      <Card>
        <Form form={form} onFinish={onFinish}>
          <Tabs defaultActiveKey="privacy">
            <TabPane tab="隐私政策" key="privacy">
              <Form.Item name="privacy">
                <TextArea rows={15} placeholder="请输入隐私政策内容" />
              </Form.Item>
            </TabPane>
            <TabPane tab="用户协议" key="terms">
              <Form.Item name="terms">
                <TextArea rows={15} placeholder="请输入用户协议内容" />
              </Form.Item>
            </TabPane>
            <TabPane tab="关于我们" key="about">
              <Form.Item name="about">
                <TextArea rows={15} placeholder="请输入关于我们内容" />
              </Form.Item>
            </TabPane>
            <TabPane tab="帮助中心" key="help">
              <Form.Item name="help">
                <TextArea rows={15} placeholder="请输入帮助中心内容" />
              </Form.Item>
            </TabPane>
          </Tabs>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存内容</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PageContent;

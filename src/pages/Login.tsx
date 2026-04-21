import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async () => {
    setLoading(true);
    try {
      // TODO: 调用登录接口
      // 登录信息处理
      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row
      justify="center"
      align="middle"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card
          title={
            <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}>
              壁纸管理后台
            </div>
          }
          bordered={false}
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: 12,
          }}
        >
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44 }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;

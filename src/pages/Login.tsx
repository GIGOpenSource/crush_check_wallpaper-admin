import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/userApi';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 获取用户原本想访问的页面
  const from = (location.state as any)?.from || '/dashboard';

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    
    try {
      // 调用登录接口
      const response = await login({
        username: values.username,
        password: values.password,
      });

      // 保存token到localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      // 保存用户信息
      // 如果后端返回了userInfo，使用后端的数据；否则使用登录时输入的账号
      const userInfo = response.userInfo || {
        username: values.username,
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      message.success('登录成功');
      
      // 跳转到原本想访问的页面，或者默认的仪表盘
      navigate(from, { replace: true });
    } catch (error) {
      console.error('登录失败，错误详情:', error);
      // 错误消息已在request拦截器中显示
      // 这里可以添加额外的错误处理逻辑
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

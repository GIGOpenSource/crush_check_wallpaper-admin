import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, PictureOutlined } from '@ant-design/icons';
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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰圆圈 */}
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: -100,
          left: -100,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          bottom: -150,
          right: -150,
          filter: 'blur(80px)',
        }}
      />
      
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <Col xs={22} sm={16} md={12} lg={8} xl={6} style={{ position: 'relative', zIndex: 1 }}>
        <Card
          bordered={false}
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)',
            borderRadius: 20,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '40px 30px',
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Logo和标题区域 */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {/* <div
              style={{
                width: 70,
                height: 70,
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              }}
            >
              <PictureOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div> */}
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              壁纸管理后台
            </h1>
            <p style={{ margin: '8px 0 0', color: '#999', fontSize: 14 }}>
              Wallpaper Management System
            </p>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
              style={{ marginBottom: 20 }}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#667eea' }} />}
                placeholder="用户名"
                style={{
                  height: 48,
                  borderRadius: 12,
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.3s',
                }}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#667eea' }} />}
                placeholder="密码"
                style={{
                  height: 48,
                  borderRadius: 12,
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.3s',
                }}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 50,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.35)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.35)';
                }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          {/* 底部提示 */}
          {/* <div
            style={{
              marginTop: 24,
              textAlign: 'center',
              color: '#999',
              fontSize: 12,
            }}
          >
            © 2024 Wallpaper Admin. All rights reserved.
          </div> */}
        </Card>
      </Col>

      <style>{`
        .custom-input:hover {
          border-color: #667eea !important;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1) !important;
        }
        .custom-input:focus,
        .custom-input-focused {
          border-color: #667eea !important;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default Login;

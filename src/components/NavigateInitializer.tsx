import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { setNavigate, setMessageInstance } from '../services/request';

/**
 * 导航和消息初始化组件
 * 用于在应用启动时设置全局导航函数和 message 实例
 */
const NavigateInitializer: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    // 设置全局导航函数
    setNavigate(navigate);
    // 设置全局 message 实例
    setMessageInstance(message);
  }, [navigate, message]);

  return null;
};

export default NavigateInitializer;
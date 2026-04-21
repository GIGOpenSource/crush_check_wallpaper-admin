import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '../services/request';

/**
 * 导航初始化组件
 * 用于在应用启动时设置全局导航函数
 */
const NavigateInitializer: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 设置全局导航函数
    setNavigate(navigate);
  }, [navigate]);

  return null;
};

export default NavigateInitializer;

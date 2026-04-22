import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Switch, Button, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getBasicSettings, updateBasicSettings } from '../../services/settingsApi';
import type { BasicSettings } from '../../services/settingsApi';

const BasicSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载基础设置数据
  useEffect(() => {
    loadBasicSettings();
  }, []);

  const loadBasicSettings = async () => {
    setLoading(true);
    try {
      const data = await getBasicSettings();
      form.setFieldsValue({
        siteName: data.site_name,
        siteDescription: data.site_description,
        icp: data.icp_number,
        contactEmail: data.contact_email,
        auditEnabled: data.enable_wallpaper_audit,
        commentEnabled: data.enable_comment_audit,
        registerEnabled: data.allow_user_register,
      });
    } catch (error) {
      console.error('加载基础设置失败:', error);
      message.error('加载基础设置失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const data: BasicSettings = {
        site_name: values.siteName,
        site_description: values.siteDescription,
        icp_number: values.icp,
        contact_email: values.contactEmail,
        enable_wallpaper_audit: values.auditEnabled,
        enable_comment_audit: values.commentEnabled,
        allow_user_register: values.registerEnabled,
      };
      
      await updateBasicSettings(data);
      message.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>基础设置</h2>
      <Card>
        <Spin spinning={loading}>
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={onFinish}
            initialValues={{
              auditEnabled: false,
              commentEnabled: false,
              registerEnabled: true,
            }}
          >
            <Form.Item name="siteName" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]}>
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
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />} 
                loading={saving}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default BasicSettings;
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Form, Button, Tabs, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getAllPageContent, savePageContent } from '../../services/settingsApi';
import type { PageContent } from '../../services/settingsApi';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

const { TabPane } = Tabs;

// 编辑器配置（外部定义避免重复创建）
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',
    'blockquote',
    '|',
    'bold',
    'underline',
    'italic',
    'color',
    'bgColor',
    '|',
    'fontSize',
    'fontFamily',
    'lineHeight',
    '|',
    'bulletedList',
    'numberedList',
    'todo',
    '|',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    '|',
    'insertLink',
    'insertImage',
    'insertTable',
    'insertVideo',
    '|',
    'undo',
    'redo',
    '|',
    'fullScreen',
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      // 如果需要支持图片上传，可以在这里配置
      // server: '/api/upload-image',
      // fieldName: 'file',
    },
  },
};

// 编辑器容器组件
interface EditorContainerProps {
  html: string;
  onCreated: (editor: IDomEditor) => void;
  onChange: (html: string) => void;
  visible: boolean;
}

const EditorContainer: React.FC<EditorContainerProps> = React.memo(({ html, onCreated, onChange, visible }) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  // 销毁编辑器
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // 只有在visible为true时才渲染编辑器
  if (!visible) {
    return <div style={{ height: '550px' }} />;
  }

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px' }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        key={visible ? 'editor-active' : 'editor-inactive'}
        defaultConfig={editorConfig}
        value={html}
        onCreated={onCreated}
        onChange={(ed) => onChange(ed.getHtml())}
        mode="default"
        style={{ height: '500px', overflowY: 'hidden' }}
      />
    </div>
  );
});

EditorContainer.displayName = 'EditorContainer';

const PageContent: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('help');

  // 富文本编辑器HTML内容
  const [htmlHelp, setHtmlHelp] = useState('');
  const [htmlAbout, setHtmlAbout] = useState('');
  const [htmlPrivacy, setHtmlPrivacy] = useState('');

  // 编辑器实例
  const [editorHelp, setEditorHelp] = useState<IDomEditor | null>(null);
  const [editorAbout, setEditorAbout] = useState<IDomEditor | null>(null);
  const [editorPrivacy, setEditorPrivacy] = useState<IDomEditor | null>(null);

  // 记录已激活的标签页（用于延迟渲染编辑器）
  const [activatedTabs] = useState<Set<string>>(() => new Set(['help']));

  // 加载所有页面内容
  useEffect(() => {
    loadPageContent();
  }, []);

  const loadPageContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPageContent();
      setHtmlHelp(data.help || '');
      setHtmlAbout(data.about || '');
      setHtmlPrivacy(data.privacy || '');
      
      // 更新表单值（用于提交时验证）
      form.setFieldsValue({
        privacy: data.privacy || '',
        about: data.about || '',
        help: data.help || '',
      });
    } catch (error) {
      console.error('加载页面内容失败:', error);
      message.error('加载页面内容失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  // 标签页切换处理
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    activatedTabs.add(key);
  }, [activatedTabs]);

  const onFinish = useCallback(async (values: PageContent) => {
    setSaving(true);
    try {
      // 根据当前激活的标签页保存对应的内容
      const type = activeTab as 'help' | 'about' | 'privacy';
      let content = '';
      
      // 从富文本编辑器获取HTML内容
      switch (type) {
        case 'help':
          content = editorHelp?.getHtml() || '';
          break;
        case 'about':
          content = editorAbout?.getHtml() || '';
          break;
        case 'privacy':
          content = editorPrivacy?.getHtml() || '';
          break;
      }
      
      if (!content || content === '<p><br></p>') {
        message.warning('内容不能为空');
        setSaving(false);
        return;
      }
      
      await savePageContent(type, content);
      message.success('保存成功');
      
      // 重新加载所有页面内容以保持数据同步
      await loadPageContent();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [activeTab, editorHelp, editorAbout, editorPrivacy, loadPageContent]);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>页面内容管理</h2>
      <Spin spinning={loading}>
        <Card>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Tabs 
              activeKey={activeTab}
              onChange={handleTabChange}
            >
              <TabPane tab="帮助与支持" key="help">
                <Form.Item 
                  name="help" 
                  label="帮助与支持内容"
                  style={{ marginBottom: 0 }}
                >
                  <EditorContainer
                    html={htmlHelp}
                    onCreated={setEditorHelp}
                    onChange={setHtmlHelp}
                    visible={activatedTabs.has('help')}
                  />
                </Form.Item>
              </TabPane>
              <TabPane tab="关于我们" key="about">
                <Form.Item 
                  name="about" 
                  label="关于我们内容"
                  style={{ marginBottom: 0 }}
                >
                  <EditorContainer
                    html={htmlAbout}
                    onCreated={setEditorAbout}
                    onChange={setHtmlAbout}
                    visible={activatedTabs.has('about')}
                  />
                </Form.Item>
              </TabPane>
              <TabPane tab="隐私政策" key="privacy">
                <Form.Item 
                  name="privacy" 
                  label="隐私政策内容"
                  style={{ marginBottom: 0 }}
                >
                  <EditorContainer
                    html={htmlPrivacy}
                    onCreated={setEditorPrivacy}
                    onChange={setHtmlPrivacy}
                    visible={activatedTabs.has('privacy')}
                  />
                </Form.Item>
              </TabPane>
            </Tabs>
            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                保存内容
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default PageContent;

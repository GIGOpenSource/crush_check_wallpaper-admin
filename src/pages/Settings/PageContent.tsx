import React, { useEffect, useState, useCallback } from 'react';
import { Card, Form, Button, Tabs, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getAllPageContent, savePageContent } from '../../services/settingsApi';
import type { PageContent } from '../../services/settingsApi';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

// 动态注册wangEditor模块
import('@wangeditor/editor').then(() => {
  // 自动注册所有模块
}).catch(error => {
  console.error('wangEditor模块加载失败:', error);
});

// 编辑器配置（外部定义避免重复创建）
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',
    'blockquote',
    '|',
    'bold',
    'underline',
    'italic',
    'through',
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
    'justifyJustify',
    '|',
    'insertLink',
    'insertImage',
    'insertTable',
    '|',
    'undo',
    'redo',
    '|',
    'clearStyle',
    'fullScreen',
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入内容...',
  autoFocus: false,
  scroll: true,
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
  const editorRef = React.useRef<IDomEditor | null>(null);

  // 销毁编辑器
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        setEditor(null);
      }
    };
  }, []);

  const handleCreated = useCallback((ed: IDomEditor) => {
    editorRef.current = ed;
    setEditor(ed);
    onCreated(ed);
  }, [onCreated]);

  const handleChange = useCallback((ed: IDomEditor) => {
    onChange(ed.getHtml());
  }, [onChange]);

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px' }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={html}
        onCreated={handleCreated}
        onChange={handleChange}
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
  const [pageIdHelp, setPageIdHelp] = useState<number>();
  const [pageIdAbout, setPageIdAbout] = useState<number>();
  const [pageIdPrivacy, setPageIdPrivacy] = useState<number>();
  const [editorHelp, setEditorHelp] = useState<IDomEditor | null>(null);
  const [editorAbout, setEditorAbout] = useState<IDomEditor | null>(null);
  const [editorPrivacy, setEditorPrivacy] = useState<IDomEditor | null>(null);

  // 记录已激活的标签页（用于延迟渲染编辑器）
  const [activatedTabs, setActivatedTabs] = useState<Set<string>>(() => new Set(['help']));

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
      
      setPageIdHelp(data.help_id);
      setPageIdAbout(data.about_id);
      setPageIdPrivacy(data.privacy_id);
      
      // 更新表单值（用于提交时验证）
      form.setFieldsValue({
        privacy: data.privacy || '',
        about: data.about || '',
        help: data.help || '',
      });
      
      // 激活所有标签页的编辑器
      setActivatedTabs(new Set(['help', 'about', 'privacy']));
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
    setActivatedTabs(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  }, []);

  const onFinish = useCallback(async (values: PageContent) => {
    setSaving(true);
    try {
      // 根据当前激活的标签页保存对应的内容
      const type = activeTab as 'help' | 'about' | 'privacy';
      let content = '';
      let pageId: number | undefined;
      
      // 从富文本编辑器获取HTML内容
      switch (type) {
        case 'help':
          content = editorHelp?.getHtml() || '';
          pageId = pageIdHelp;
          break;
        case 'about':
          content = editorAbout?.getHtml() || '';
          pageId = pageIdAbout;
          break;
        case 'privacy':
          content = editorPrivacy?.getHtml() || '';
          pageId = pageIdPrivacy;
          break;
      }
      
      if (!content || content === '<p><br></p>') {
        message.warning('内容不能为空');
        setSaving(false);
        return;
      }
      
      await savePageContent(type, content, pageId);
      message.success('保存成功');
      
      // 重新加载所有页面内容以保持数据同步
      await loadPageContent();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [activeTab, editorHelp, editorAbout, editorPrivacy, pageIdHelp, pageIdAbout, pageIdPrivacy, loadPageContent]);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>页面内容管理</h2>
      <Spin spinning={loading}>
        <Card>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Tabs 
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                {
                  key: 'help',
                  label: '帮助与支持',
                  children: (
                    <Form.Item 
                      name="help" 
                      label=""
                      style={{ marginBottom: 0 }}
                    >
                      <EditorContainer
                        html={htmlHelp}
                        onCreated={setEditorHelp}
                        onChange={setHtmlHelp}
                        visible={activatedTabs.has('help')}
                      />
                    </Form.Item>
                  ),
                },
                {
                  key: 'about',
                  label: '关于我们',
                  children: (
                    <Form.Item 
                      name="about" 
                      label=""
                      style={{ marginBottom: 0 }}
                    >
                      <EditorContainer
                        html={htmlAbout}
                        onCreated={setEditorAbout}
                        onChange={setHtmlAbout}
                        visible={activatedTabs.has('about')}
                      />
                    </Form.Item>
                  ),
                },
                {
                  key: 'privacy',
                  label: '隐私政策',
                  children: (
                    <Form.Item 
                      name="privacy" 
                      label=""
                      style={{ marginBottom: 0 }}
                    >
                      <EditorContainer
                        html={htmlPrivacy}
                        onCreated={setEditorPrivacy}
                        onChange={setHtmlPrivacy}
                        visible={activatedTabs.has('privacy')}
                      />
                    </Form.Item>
                  ),
                },
              ]}
            />
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
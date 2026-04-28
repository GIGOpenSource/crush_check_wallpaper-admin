import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Input, message, Modal, Upload, Select, Row, Col, Popconfirm, InputNumber, Image, Space, Tabs, Tooltip, Input as AntdInput } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, UploadOutlined, EyeOutlined, GlobalOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { Tag as AntdTag } from 'antd';
import { getWallpaperList, batchDeleteWallpaper, batchAuditWallpaper, createWallpaperWithImage, updateWallpaper, updateWallpaperWithImage, uploadImage } from '../../services/wallpaperApi';
import { getTagList } from '../../services/tagApi';
import type { Wallpaper as ApiWallpaper, GetWallpaperListParams } from '../../services/wallpaperApi';
import type { Tag as ApiTag } from '../../services/tagApi';

const { TextArea } = AntdInput;

// 扩展 API 返回的 Wallpaper 类型，添加页面特有的字段
interface Wallpaper extends ApiWallpaper {
  view_count?: number;
  download_count?: number;
  hot_score?: number;
  status: 'normal' | 'pending' | 'rejected' | 'disabled';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  altText?: string;
  category_names?: string[]; // 分类名称数组
  tag_ids?: number[]; // 标签ID数组
}

const { TabPane } = Tabs;

const WallpaperList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Wallpaper[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<GetWallpaperListParams>({});
  const [searchText, setSearchText] = useState<string>('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingWallpaper, setRejectingWallpaper] = useState<Wallpaper | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form] = Form.useForm();
  const [tagList, setTagList] = useState<ApiTag[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [tagPage, setTagPage] = useState(1);
  const [tagLoading, setTagLoading] = useState(false);
  const [hasMoreTags, setHasMoreTags] = useState(true);
  const [currentEditingTagMap, setCurrentEditingTagMap] = useState<Record<number, string>>({}); // 当前编辑壁纸的标签ID->名称映射
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]); // 原始分类ID（用于保留其他分类）
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // 加载壁纸列表
  useEffect(() => {
    loadWallpaperList();
    loadTagList();
  }, [currentPage, pageSize]);

  const loadTagList = async (page: number = 1, append: boolean = false) => {
    if (tagLoading || (!append && !hasMoreTags)) return;
    
    setTagLoading(true);
    try {
      const response = await getTagList({ 
        currentPage: page, 
        pageSize: 50 
      });
      
      if (append) {
        // 追加模式：加载更多标签
        setTagList(prev => [...prev, ...response.results]);
      } else {
        // 初始加载模式：替换标签列表
        setTagList(response.results);
      }
      
      // 判断是否还有更多数据
      const totalPages = response.pagination.total_pages || 1;
      setHasMoreTags(page < totalPages);
      setTagPage(page);
    } catch (error) {
      console.error('加载标签列表失败:', error);
    } finally {
      setTagLoading(false);
    }
  };

  // 加载更多标签
  const loadMoreTags = () => {
    if (hasMoreTags && !tagLoading) {
      loadTagList(tagPage + 1, true);
    }
  };

  const loadWallpaperList = async (params?: GetWallpaperListParams) => {
    setLoading(true);
    try {
      const requestParams: GetWallpaperListParams = {
        currentPage,
        pageSize,
        ...searchParams,
        ...params,
      };
      const response = await getWallpaperList(requestParams);
      // 将 API 返回的数据转换为页面需要的格式
      const convertedData: Wallpaper[] = response.results.map(item => ({
        ...item,
        view_count: item.view_count || 0,
        download_count: item.download_count || 0,
        hot_score: item.hot_score || 0,
        status: item.audit_status === 'approved' ? 'normal' : 
                item.audit_status === 'pending' ? 'pending' : 'rejected',
      }));
      setDataSource(convertedData);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('加载壁纸列表失败:', error);
      message.error('加载壁纸列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadWallpaperList();
  };

  // 重置
  const handleReset = () => {
    setSearchParams({});
    setCurrentPage(1);
    loadWallpaperList();
  };

  const handlePreview = (record: Wallpaper) => {
    // 设置预览的壁纸并显示预览
    setPreviewWallpaper(record);
    setShowImagePreview(true);
  };

  const handleEdit = (record: Wallpaper) => {
    setEditingWallpaper(record);
    
    // 处理分类数据 - 将category数组转换为设备类型
    const categoryNames = Array.isArray(record.category) 
      ? record.category.map(cat => typeof cat === 'object' ? (cat as any).name : cat)
      : [];
    
    // 从分类中提取设备类型（壁纸类型固定为静态）
    let deviceType = undefined;
    
    categoryNames.forEach(cat => {
      if (cat === '手机壁纸') deviceType = 'mobile';
      else if (cat === '电脑壁纸') deviceType = 'desktop';
    });
    
    // 提取原始分类ID（保留非1、2、3的其他分类ID）
    const otherCategoryIds: number[] = [];
    if (Array.isArray(record.category)) {
      (record.category as any[]).forEach(cat => {
        if (typeof cat === 'object' && cat !== null && cat.id != null) {
          const categoryId = cat.id;
          // 只保留非1、2、3的其他分类ID
          if (categoryId !== 1 && categoryId !== 2 && categoryId !== 3) {
            otherCategoryIds.push(categoryId);
          }
        }
      });
    }
    
    // 保存原始分类ID
    setOriginalCategoryIds(otherCategoryIds);
    
    // 处理标签数据 - 提取标签ID和名称映射
    let tagIds: number[] = [];
    const tagIdToNameMap: Record<number, string> = {}; // 构建ID到名称的映射
    
    if (record.tag_ids && Array.isArray(record.tag_ids)) {
      // 如果后端直接返回tag_ids，直接使用
      tagIds = record.tag_ids;
    } else if (Array.isArray(record.tags)) {
      // 如果返回tags数组，提取ID并构建映射
      (record.tags as any[]).forEach(tag => {
        if (tag != null) {
          if (typeof tag === 'object' && tag.id != null && tag.name != null) {
            tagIds.push(tag.id);
            tagIdToNameMap[tag.id] = tag.name; // 保存ID到名称的映射
          } else if (typeof tag === 'number') {
            tagIds.push(tag);
          }
        }
      });
    }
    
    // 保存当前编辑壁纸的标签映射
    setCurrentEditingTagMap(tagIdToNameMap);
    
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      wallpaper_type: '静态壁纸', // 固定为静态壁纸
      device_type: deviceType,
      tags: tagIds, // Select组件会根据value匹配options中的label显示名称
      view_count: record.view_count || 0,
      download_count: record.download_count || 0,
      hot_score: record.hot_score || 0,
      seoTitle: record.seoTitle,
      seoDescription: record.seoDescription,
      seoKeywords: record.seoKeywords?.join(','),
    });
    
    // 设置缩略图预览
    if (record.thumb_url) {
      setFileList([{
        uid: '-1',
        name: 'thumb.jpg',
        status: 'done',
        url: record.thumb_url,
      }]);
    } else {
      setFileList([]);
    }
    
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingWallpaper) return;
    
    try {
      const values = await form.validateFields();
      
      // 构建category_ids：始终包含3（静态壁纸）+ 其他分类ID + 设备类型ID
      const categoryIds: number[] = [3]; // 始终包含静态壁纸
      
      // 添加其他分类ID（非1、2、3的分类）
      if (originalCategoryIds.length > 0) {
        categoryIds.push(...originalCategoryIds);
      }
      
      // 根据设备类型添加对应的ID
      if (values.device_type === 'mobile') {
        categoryIds.push(2); // 添加手机壁纸
      } else if (values.device_type === 'desktop') {
        categoryIds.push(1); // 添加电脑壁纸
      }
      
      // 判断是否修改了图片
      const isImageChanged = fileList.length > 0 && fileList[0].originFileObj;
      
      if (isImageChanged) {
        // 如果修改了图片，使用 updateWallpaperWithImage
        const updateData = {
          name: values.name,
          description: values.description,
          category_ids: categoryIds,
          tag_ids: values.tags,
          file: fileList[0].originFileObj as File,
          is_change: true,
          view_count: values.view_count,
          download_count: values.download_count,
          hot_score: values.hot_score,
        };
        
        await updateWallpaperWithImage(editingWallpaper.id, updateData);
      } else {
        // 如果没有修改图片，使用普通的 updateWallpaper
        const updateData: any = {
          name: values.name,
          description: values.description,
          category_ids: categoryIds,
          tag_ids: values.tags,
          is_change: false,
          view_count: values.view_count,
          download_count: values.download_count,
          hot_score: values.hot_score,
        };
        
        await updateWallpaper(editingWallpaper.id, updateData);
      }
      
      message.success('保存成功');
      setEditModalVisible(false);
      setEditingWallpaper(null);
      setFileList([]);
      setOriginalCategoryIds([]); // 清除原始分类ID
      form.resetFields();
      loadWallpaperList();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  // 打开新建壁纸弹窗
  const handleCreate = () => {
    setCreateModalVisible(true);
    form.resetFields();
    setFileList([]);
  };

  // 保存新建壁纸
  const handleSaveCreate = async () => {
    try {
      const values = await form.validateFields();
      
      // 检查是否已上传图片
      if (fileList.length === 0 || !fileList[0].originFileObj) {
        message.error('请先选择壁纸图片');
        return;
      }
      
      // 构建category_ids：始终包含3（静态壁纸）+ 设备类型ID
      const categoryIds: number[] = [3]; // 始终包含静态壁纸
      
      // 根据设备类型添加对应的ID
      if (values.device_type === 'mobile') {
        categoryIds.push(2); // 添加手机壁纸
      } else if (values.device_type === 'desktop') {
        categoryIds.push(1); // 添加电脑壁纸
      }
      
      // 准备创建数据
      const createData = {
        name: values.name,
        description: values.description,
        category_ids: categoryIds, // 使用分类ID数组
        tag_ids: values.tags, // 标签必填，直接传递
        file: fileList[0].originFileObj as File, // 二进制图片文件
        view_count: values.view_count || 0,
        download_count: values.download_count || 0,
        hot_score: values.hot_score || 0,
      };
      
      await createWallpaperWithImage(createData);
      message.success('创建成功');
      setCreateModalVisible(false);
      setFileList([]);
      form.resetFields();
      loadWallpaperList();
    } catch (error) {
      console.error('创建失败:', error);
      message.error('创建失败');
    }
  };

  // 处理图片上传变化
  const handleUploadChange = async ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
    
    // 如果有新上传的文件，调用上传接口
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setUploading(true);
      try {
        const file = fileList[0].originFileObj as File;
        const response = await uploadImage(file);
        
        // 上传成功后，更新文件列表中的URL
        const updatedFileList = fileList.map(file => ({
          ...file,
          url: response.url,
          thumbUrl: response.url,
        }));
        setFileList(updatedFileList);
        
        message.success('图片上传成功');
      } catch (error) {
        console.error('图片上传失败:', error);
        message.error('图片上传失败');
        // 上传失败，移除文件
        setFileList([]);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDelete = (record: Wallpaper) => {
    batchDeleteWallpaper({
      wallpaper_ids: [record.id],
    })
      .then(() => {
        message.success(`已删除: ${record.name}`);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('删除失败:', error);
        message.error('删除失败');
      });
  };

  // 单个通过（使用 Popconfirm）
  const handleAuditPass = (record: Wallpaper) => {
    batchAuditWallpaper({
      wallpaper_ids: [record.id],
      remark: '',
      action: 'approve',
    })
      .then(() => {
        message.success(`通过审核: ${record.name}`);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('审核失败:', error);
        message.error('审核失败');
      });
  };

  // 打开拒绝弹窗
  const handleOpenRejectModal = (record: Wallpaper) => {
    setRejectingWallpaper(record);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // 提交拒绝
  const handleSubmitReject = async () => {
    if (!rejectReason || rejectReason.trim() === '') {
      message.error('请输入拒绝原因');
      return;
    }
    
    if (!rejectingWallpaper) return;
    
    try {
      await batchAuditWallpaper({
        wallpaper_ids: [rejectingWallpaper.id],
        remark: rejectReason.trim(),
        action: 'reject',
      });
      message.success(`拒绝审核: ${rejectingWallpaper.name}`);
      setRejectModalVisible(false);
      setRejectingWallpaper(null);
      setRejectReason('');
      loadWallpaperList();
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    }
  };

  const handleAuditPassConfirm = (record: Wallpaper) => {
    return (
      <Popconfirm
        title="确认通过"
        description={`确定要通过壁纸 "${record.name}" 的审核吗？`}
        onConfirm={() => handleAuditPass(record)}
        okText="确认通过"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Button 
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          通过
        </Button>
      </Popconfirm>
    );
  };

  const handleAuditRejectButton = (record: Wallpaper) => {
    return (
      <Button 
        type="link"
        size="small"
        danger
        icon={<CloseOutlined />}
        onClick={() => handleOpenRejectModal(record)}
      >
        拒绝
      </Button>
    );
  };

  // 批量通过
  const handleBatchPass = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    
    batchAuditWallpaper({
      wallpaper_ids: selectedRowKeys.map(key => Number(key)),
      remark: '',
      action: 'approve',
    })
      .then(() => {
        message.success(`已通过 ${selectedRowKeys.length} 个壁纸`);
        setSelectedRowKeys([]);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('批量通过失败:', error);
        message.error('批量通过失败');
      });
  };

  const handleBatchPassConfirm = () => {
    return (
      <Popconfirm
        title="确认批量通过"
        description={`确定要通过选中的 ${selectedRowKeys.length} 个壁纸吗？`}
        onConfirm={handleBatchPass}
        okText="确认通过"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Button 
          type="primary" 
          icon={<CheckOutlined />}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          批量通过
        </Button>
      </Popconfirm>
    );
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的壁纸');
      return;
    }
    
    batchDeleteWallpaper({
      wallpaper_ids: selectedRowKeys.map(key => Number(key)),
    })
      .then(() => {
        message.success(`已删除 ${selectedRowKeys.length} 个壁纸`);
        setSelectedRowKeys([]);
        loadWallpaperList();
      })
      .catch((error) => {
        console.error('批量删除失败:', error);
        message.error('批量删除失败');
      });
  };

  const handleBatchDeleteConfirm = () => {
    return (
      <Popconfirm
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedRowKeys.length} 个壁纸吗？`}
        onConfirm={handleBatchDelete}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Button danger>批量删除</Button>
      </Popconfirm>
    );
  };

  // 批量拒绝（使用 Modal 输入必填原因）
  const [batchRejectModalVisible, setBatchRejectModalVisible] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');

  const handleOpenBatchRejectModal = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的壁纸');
      return;
    }
    setBatchRejectReason('');
    setBatchRejectModalVisible(true);
  };

  const handleSubmitBatchReject = async () => {
    if (!batchRejectReason || batchRejectReason.trim() === '') {
      message.error('请输入拒绝原因');
      return;
    }
    
    try {
      const wallpaperIds = selectedRowKeys.map(key => Number(key));
      await batchAuditWallpaper({
        wallpaper_ids: wallpaperIds,
        remark: batchRejectReason.trim(),
        action: 'reject',
      });
      message.success(`已拒绝 ${selectedRowKeys.length} 个壁纸`);
      setSelectedRowKeys([]);
      setBatchRejectModalVisible(false);
      setBatchRejectReason('');
      loadWallpaperList();
    } catch (error) {
      console.error('批量拒绝失败:', error);
      message.error('批量拒绝失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      ellipsis: true,
      render: (text: number) => (
        <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
      ),
    },
    {
      title: '缩略图',
      dataIndex: 'thumb_url',
      key: 'thumb_url',
      width: 120,
      render: (url: string) => (
        <Image 
          src={url} 
          width={100} 
          height={60} 
          style={{ objectFit: 'cover', borderRadius: 4 }} 
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      ellipsis: true,
      render: (categories: string[] | Array<{ id: number; name: string }>) => {
        const categoryList = (categories || []).map((cat) => {
          if (typeof cat === 'object' && cat !== null) {
            return (cat as { id: number; name: string }).name;
          }
          return cat;
        });
        
        return (
          <Space wrap>
            {categoryList.map((cat, index) => (
              <AntdTag key={`${cat}-${index}`}>{cat}</AntdTag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      ellipsis: true,
      render: (tags: string[] | Array<{ id: number; name: string }>) => {
        const tagList = (tags || []).map((tag) => {
          if (typeof tag === 'object' && tag !== null) {
            return (tag as { id: number; name: string }).name;
          }
          return tag;
        });
        
        return (
          <Space wrap>
            {tagList.map((tag, index) => (
              <AntdTag key={`${tag}-${index}`} color="blue">{tag}</AntdTag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => {
        if (!text) return '-';
        return (
          <Tooltip title={text}>
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              display: 'block'
            }}>
              {text}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '尺寸',
      key: 'size',
      width: 100,
      render: (_: unknown, record: Wallpaper) => (
        <span style={{ whiteSpace: 'nowrap' }}>{record.width}x{record.height}</span>
      ),
    },
    {
      title: '格式',
      dataIndex: 'image_format',
      key: 'image_format',
      width: 80,
      ellipsis: true,
    },
    {
      title: '浏览',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
      render: (count: number) => count || 0,
      sorter: (a: Wallpaper, b: Wallpaper) => (a.view_count || 0) - (b.view_count || 0),
    },
    {
      title: '下载',
      dataIndex: 'download_count',
      key: 'download_count',
      width: 80,
      render: (count: number) => count || 0,
      sorter: (a: Wallpaper, b: Wallpaper) => (a.download_count || 0) - (b.download_count || 0),
    },
    {
      title: '热度',
      dataIndex: 'hot_score',
      key: 'hot_score',
      width: 80,
      render: (score: number) => score || 0,
      sorter: (a: Wallpaper, b: Wallpaper) => (a.hot_score || 0) - (b.hot_score || 0),
    },
    {
      title: '上传者',
      key: 'uploader',
      width: 120,
      ellipsis: true,
      render: (_: unknown, record: Wallpaper) => (
        <Tooltip title={record.uploader?.nickname}>
          <span style={{ whiteSpace: 'nowrap' }}>{record.uploader?.nickname || '未知用户'}</span>
        </Tooltip>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      ellipsis: true,
      render: (text: string) => {
        if (!text) return '-';
        return new Date(text).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(/\//g, '-');
      },
      sorter: (a: Wallpaper, b: Wallpaper) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
    },
    {
      title: '状态',
      dataIndex: 'audit_status',
      key: 'audit_status',
      width: 100,
      fixed: 'left' as const,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          approved: { color: 'success', text: '已通过' },
          pending: { color: 'warning', text: '待审核' },
          rejected: { color: 'error', text: '已拒绝' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <AntdTag color={color}>{text}</AntdTag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 350,
      fixed: 'right' as const,
      render: (_: unknown, record: Wallpaper) => (
        <Space wrap>
          <Button 
            type="primary" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button 
            type="primary" 
            size="small"
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.audit_status === 'pending' && (
            <>
              {handleAuditPassConfirm(record)}
              <Button 
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleOpenRejectModal(record)}
              >
                拒绝
              </Button>
            </>
          )}
          <Button 
            type="primary" 
            size="small"
            icon={<GlobalOutlined />} 
            onClick={() => handleEdit(record)}
          >
            SEO设置
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除壁纸 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 图片预览组件 - 使用key确保每次显示正确的图片 */}
      {showImagePreview && previewWallpaper && (
        <Image
          key={previewWallpaper.id}  // 使用壁纸ID作为key，确保切换图片时重新渲染
          src={previewWallpaper.thumb_url}  // 直接使用 thumb_url
          alt={previewWallpaper.name}
          style={{ display: 'none' }}
          preview={{
            visible: true,
            onVisibleChange: (visible) => {
              setShowImagePreview(visible);
              if (!visible) {
                setPreviewWallpaper(null);
              }
            },
          }}
        />
      )}

      <h2 style={{ marginBottom: 24 }}>壁纸管理</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索壁纸名称"
            value={searchParams.name}
            onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            value={searchParams.audit_status}
            onChange={(value) => setSearchParams({ ...searchParams, audit_status: value })}
            allowClear
            options={[
              { value: 'pending', label: '待审核' },
              { value: 'approved', label: '已通过' },
              { value: 'rejected', label: '已拒绝' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="primary" onClick={handleCreate}>
            新建壁纸
          </Button>
          <Space>
            {handleBatchPassConfirm()}
            <Button 
              danger
              icon={<CloseOutlined />}
              onClick={handleOpenBatchRejectModal}
            >
              批量拒绝
            </Button>
            {handleBatchDeleteConfirm()}
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          pagination={{
            total,
            pageSize,
            current: currentPage,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{ 
            type: 'checkbox',
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 编辑/SEO设置弹窗 */}
      <Modal
        title={`编辑壁纸 - ${editingWallpaper?.name}`}
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingWallpaper(null);
          setFileList([]);
          setCurrentEditingTagMap({}); // 清除标签映射
          setOriginalCategoryIds([]); // 清除原始分类ID
          form.resetFields();
        }}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="name" label="壁纸名称" rules={[{ required: true, message: '请输入壁纸名称' }]}>
                    <Input placeholder="请输入壁纸名称" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="description" label="壁纸描述">
                <TextArea 
                  rows={3} 
                  placeholder="请输入壁纸描述"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="wallpaper_type" label="壁纸类型" initialValue="静态壁纸" getValueFromEvent={() => '静态壁纸'}>
                    <Input disabled placeholder="静态壁纸" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="device_type" label="设备类型" rules={[{ required: true, message: '请选择设备类型' }]}>
                    <Select placeholder="请选择设备类型">
                      <Select.Option value="mobile">手机壁纸</Select.Option>
                      <Select.Option value="desktop">电脑壁纸</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item 
                name="tags" 
                label="标签" 
                rules={[{ required: true, message: '请至少选择一个标签' }]}
              >
                <Select 
                  mode="multiple" 
                  placeholder="请选择标签（支持搜索和滚动加载更多）"
                  options={tagList.map(tag => ({
                    label: tag.name,
                    value: tag.id,
                  }))}
                  // 自定义已选中标签的显示
                  tagRender={(props) => {
                    const { label, value, closable, onClose } = props;
                    // 优先从当前编辑壁纸的标签映射中查找名称
                    const tagName = currentEditingTagMap[value as number];
                    // 如果找不到，再从全局tagList中查找
                    const tag = tagName ? { name: tagName } : tagList.find(t => t.id === value);
                    const displayName = tag ? tag.name : `标签 ${value}`;
                    
                    return (
                      <span
                        style={{
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                          padding: '2px 8px',
                          marginRight: 4,
                          marginBottom: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {displayName}
                        {closable && (
                          <span
                            onClick={onClose}
                            style={{
                              marginLeft: 4,
                              cursor: 'pointer',
                              color: '#999',
                              fontSize: 12,
                            }}
                          >
                            ×
                          </span>
                        )}
                      </span>
                    );
                  }}
                  optionRender={(option) => (
                    <span>{option.label}</span>
                  )}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onPopupScroll={(e) => {
                    const target = e.target as HTMLElement;
                    // 当滚动到底部时加载更多
                    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
                      loadMoreTags();
                    }
                  }}
                  notFoundContent={tagLoading ? '加载中...' : '暂无数据'}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {hasMoreTags && !tagLoading && (
                        <div 
                          style={{ 
                            padding: '8px', 
                            textAlign: 'center',
                            borderTop: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            color: '#1890ff'
                          }}
                          onClick={loadMoreTags}
                        >
                          加载更多...
                        </div>
                      )}
                      {tagLoading && (
                        <div 
                          style={{ 
                            padding: '8px', 
                            textAlign: 'center',
                            borderTop: '1px solid #f0f0f0',
                            color: '#999'
                          }}
                        >
                          加载中...
                        </div>
                      )}
                    </>
                  )}
                />
              </Form.Item>
              
              <Form.Item label="缩略图">
                <div style={{ marginBottom: 8 }}>
                  {fileList.length > 0 && fileList[0].url && (
                    <Image 
                      src={fileList[0].url} 
                      width={200} 
                      height={120} 
                      style={{ objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} 
                    />
                  )}
                </div>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  maxCount={1}
                  beforeUpload={() => false} // 阻止自动上传
                  accept="image/*"
                >
                  {fileList.length < 1 && (
                    <div>
                      <UploadOutlined />
                    </div>
                  )}
                </Upload>
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="view_count" label="浏览量">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="download_count" label="下载量">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="hot_score" label="热度">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="SEO设置" key="seo">
              <Form.Item name="seoTitle" label="SEO标题">
                <Input placeholder="建议50-60个字符，包含关键词" maxLength={60} showCount />
              </Form.Item>
              <Form.Item name="seoDescription" label="SEO描述">
                <Input.TextArea 
                  rows={3} 
                  placeholder="建议150-160个字符，描述壁纸内容"
                  maxLength={160}
                  showCount
                />
              </Form.Item>
              <Form.Item name="seoKeywords" label="SEO关键词">
                <Input placeholder="多个关键词用逗号分隔，如：4K壁纸,星空壁纸,高清" />
              </Form.Item>
              <div style={{ background: '#f6ffed', padding: 12, borderRadius: 4, marginTop: 16 }}>
                <strong>SEO优化建议：</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>标题应包含主要关键词，长度控制在60字符以内</li>
                  <li>描述应准确概括内容，吸引用户点击</li>
                  <li>关键词数量建议3-5个，避免堆砌</li>
                  <li>Alt文本应描述图片内容，便于搜索引擎理解</li>
                </ul>
              </div>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      {/* 新建壁纸弹窗 */}
      <Modal
        title="新建壁纸"
        open={createModalVisible}
        onOk={handleSaveCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          setFileList([]);
          form.resetFields();
        }}
        width={900}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="name" label="壁纸名称" rules={[{ required: true, message: '请输入壁纸名称' }]}>
                    <Input placeholder="请输入壁纸名称" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="description" label="壁纸描述">
                <TextArea 
                  rows={3} 
                  placeholder="请输入壁纸描述"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="wallpaper_type" label="壁纸类型" initialValue="静态壁纸">
                    <Input disabled placeholder="静态壁纸" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="device_type" label="设备类型" rules={[{ required: true, message: '请选择设备类型' }]}>
                    <Select placeholder="请选择设备类型">
                      <Select.Option value="mobile">手机壁纸</Select.Option>
                      <Select.Option value="desktop">电脑壁纸</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="tags" label="标签" rules={[{ required: true, message: '请至少选择一个标签' }]}>
                <Select 
                  mode="multiple" 
                  placeholder="请选择标签（支持搜索和滚动加载更多）"
                  options={tagList.map(tag => ({
                    label: tag.name,
                    value: tag.id,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onPopupScroll={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
                      loadMoreTags();
                    }
                  }}
                  notFoundContent={tagLoading ? '加载中...' : '暂无数据'}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {hasMoreTags && !tagLoading && (
                        <div 
                          style={{ 
                            padding: '8px', 
                            textAlign: 'center',
                            borderTop: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            color: '#1890ff'
                          }}
                          onClick={loadMoreTags}
                        >
                          加载更多...
                        </div>
                      )}
                      {tagLoading && (
                        <div 
                          style={{ 
                            padding: '8px', 
                            textAlign: 'center',
                            borderTop: '1px solid #f0f0f0',
                            color: '#999'
                          }}
                        >
                          加载中...
                        </div>
                      )}
                    </>
                  )}
                />
              </Form.Item>
              
              <Form.Item label="缩略图" rules={[{ required: true, message: '请上传缩略图' }]}>
                <div style={{ marginBottom: 8 }}>
                  {fileList.length > 0 && fileList[0].url && (
                    <Image 
                      src={fileList[0].url} 
                      width={200} 
                      height={120} 
                      style={{ objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} 
                    />
                  )}
                </div>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  maxCount={1}
                  beforeUpload={() => false}
                  accept="image/*"
                >
                  {fileList.length < 1 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>上传缩略图</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="view_count" label="浏览量" initialValue={0}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="download_count" label="下载量" initialValue={0}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="hot_score" label="热度" initialValue={0}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      {/* 单个拒绝弹窗 */}
      <Modal
        title={`拒绝壁纸 - ${rejectingWallpaper?.name}`}
        open={rejectModalVisible}
        onOk={handleSubmitReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectingWallpaper(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <Form.Item label="拒绝原因（必填）" required>
            <TextArea
              rows={4}
              placeholder="请输入拒绝原因"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量拒绝弹窗 */}
      <Modal
        title="批量拒绝壁纸"
        open={batchRejectModalVisible}
        onOk={handleSubmitBatchReject}
        onCancel={() => {
          setBatchRejectModalVisible(false);
          setBatchRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <p style={{ marginBottom: 16 }}>确定要拒绝选中的 {selectedRowKeys.length} 个壁纸吗？</p>
          <Form.Item label="拒绝原因（必填）" required>
            <TextArea
              rows={4}
              placeholder="请输入拒绝原因"
              value={batchRejectReason}
              onChange={(e) => setBatchRejectReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default WallpaperList;











































































































































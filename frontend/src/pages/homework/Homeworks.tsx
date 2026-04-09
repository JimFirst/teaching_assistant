import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Space, Tag, Upload, Card, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getHomeworks, getClasses, createHomework, updateHomework, deleteHomework, recognizeHomework } from "@/api";
import type { Homework, Class, RecognizedQuestion } from "@/types";
import type { User } from "@/types";
import dayjs from 'dayjs';

const Homeworks: React.FC<{ user: User }> = ({ user }) => {
  const [data, setData] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [recognizedQuestions, setRecognizedQuestions] = useState<RecognizedQuestion[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [homeworksRes, classesRes] = await Promise.all([
        getHomeworks(),
        getClasses()
      ]);
      if (homeworksRes.success && homeworksRes.data) {
        setData(homeworksRes.data.map(h => ({
          ...h,
          className: classesRes.data?.find(c => c.id === h.classId)?.name
        })));
      }
      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
      }
    } catch (error) {
      message.error('获取作业列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingHomework(null);
    setImageFile(null);
    setRecognizedQuestions([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Homework) => {
    setEditingHomework(record);
    setImageFile(null);
    setRecognizedQuestions([]);
    form.setFieldsValue({
      title: record.title,
      content: record.content || '',
      deadline: record.deadline ? dayjs(record.deadline) : undefined,
      classId: record.classId
    });
    setModalVisible(true);
  };

  const handleRecognizeImage = async () => {
    if (!imageFile) {
      message.warning('请先上传作业图片');
      return;
    }
    setRecognizing(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await recognizeHomework(formData);
      if (res.success && res.data) {
        setRecognizedQuestions(res.data.questions);
        message.success(res.message || '识别成功');
      } else {
        message.error(res.message || '识别失败');
      }
    } catch (error) {
      message.error('识别失败');
    } finally {
      setRecognizing(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteHomework(id);
      if (res.success) {
        message.success('删除成功');
        fetchData();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content || '');
      formData.append('deadline', values.deadline.format('YYYY-MM-DD HH:mm:ss'));
      formData.append('classId', String(values.classId));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (recognizedQuestions.length > 0) {
        formData.append('questions', JSON.stringify(recognizedQuestions));
      }

      if (editingHomework) {
        const res = await updateHomework(editingHomework.id, formData);
        if (res.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchData();
        } else {
          message.error(res.message || '更新失败');
        }
      } else {
        const res = await createHomework(formData);
        if (res.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchData();
        } else {
          message.error(res.message || '创建失败');
        }
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '班级', dataIndex: 'className', key: 'className', render: (text: string) => <Tag>{text || '-'}</Tag> },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline', render: (text: string) => text ? text.slice(0, 16) : '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (text: string) => text ? text.slice(0, 16) : '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Homework) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/homework/${record.id}`)}>
            查看
          </Button>
          {user.role !== 'student' && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定删除此作业吗？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
          {user.role === 'student' && (
            <Button type="link" onClick={() => navigate(`/homework/${record.id}/submit`)}>
              提交
            </Button>
          )}
          {user.role === 'teacher' && (
            <Button type="link" icon={<SendOutlined />} onClick={() => navigate(`/homework/${record.id}/submit`)}>
              代交
            </Button>
          )}
        </Space>
      )
    }
  ];

  const canCreate = user.role === 'admin' || user.role === 'teacher';

  return (
    <div>
      {canCreate && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            发布作业
          </Button>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingHomework ? '编辑作业' : '发布作业'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入作业标题' }]}>
            <Input placeholder="请输入作业标题" />
          </Form.Item>
          <Form.Item name="content" label="内容">
            <Input.TextArea rows={4} placeholder="请输入作业内容" />
          </Form.Item>
          <Form.Item name="classId" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
            <Select placeholder="请选择班级">
              {classes.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="deadline" label="截止时间" rules={[{ required: true, message: '请选择截止时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="作业图片">
            <Upload
              beforeUpload={(file) => {
                setImageFile(file);
                setRecognizedQuestions([]);
                return false;
              }}
              maxCount={1}
              listType="picture"
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>点击上传图片</Button>
            </Upload>
            {editingHomework?.imageUrl && (
              <div style={{ marginTop: 8 }}>
                <Tag>已有图片: {editingHomework.imageUrl}</Tag>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Button 
                type="primary" 
                icon={<RobotOutlined />} 
                onClick={handleRecognizeImage}
                loading={recognizing}
                disabled={!imageFile}
              >
                AI识别题目
              </Button>
            </div>
            {recognizedQuestions.length > 0 && (
              <Card size="small" style={{ marginTop: 16 }} title="识别结果">
                {recognizedQuestions.map((q, index) => (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold' }}>题目{q.questionOrder}: {q.questionText}</div>
                    <div style={{ color: '#666', marginTop: 4 }}>答案: {q.answerText}</div>
                    {index < recognizedQuestions.length - 1 && <Divider style={{ margin: '8px 0' }} />}
                  </div>
                ))}
              </Card>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Homeworks;
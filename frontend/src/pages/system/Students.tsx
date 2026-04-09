import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getStudents, getClasses, createStudent, updateStudent, deleteStudent } from "@/api";
import type { Student, Class } from "@/types";

const Students: React.FC = () => {
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const [data, setData] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    classIdParam ? parseInt(classIdParam, 10) : undefined
  );
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        getStudents(selectedClassId),
        getClasses()
      ]);
      if (studentsRes.success && studentsRes.data) {
        setData(studentsRes.data.map(s => ({
          ...s,
          className: classesRes.data?.find(c => c.id === s.classId)?.name
        })));
      }
      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
      }
    } catch (error) {
      message.error('获取学生列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClassId]);

  const handleAdd = () => {
    setEditingStudent(null);
    form.resetFields();
    if (selectedClassId) {
      form.setFieldsValue({ classId: selectedClassId });
    }
    setModalVisible(true);
  };

  const handleEdit = (record: Student) => {
    setEditingStudent(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteStudent(id);
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
      if (editingStudent) {
        const res = await updateStudent(editingStudent.id, values);
        if (res.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchData();
        } else {
          message.error(res.message || '更新失败');
        }
      } else {
        const res = await createStudent(values as Omit<Student, 'id'>);
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
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    { title: '联系方式', dataIndex: 'phone', key: 'phone', render: (text: string) => text || '-' },
    { title: '班级', dataIndex: 'className', key: 'className', render: (text: string) => <Tag>{text || '-'}</Tag> },
    { title: '用户账号', dataIndex: 'username', key: 'username', render: (text: string) => text || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Student) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此学生吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增学生
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingStudent ? '编辑学生' : '新增学生'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="studentNo" label="学号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="联系方式">
            <Input />
          </Form.Item>
          <Form.Item name="classId" label="班级" rules={[{ required: true }]}>
            <Select>
              {classes.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Students;
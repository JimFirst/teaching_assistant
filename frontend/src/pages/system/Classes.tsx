import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Tag,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getUsers,
} from "@/api";
import type { Class, User } from "@/types";

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getClasses();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (error) {
      message.error("获取班级列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await getUsers();
      if (res.success && res.data) {
        setTeachers(res.data.filter((u) => u.role === "teacher"));
      }
    } catch (error) {
      console.error("获取教师列表失败", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, []);

  const handleAdd = () => {
    setEditingClass(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Class) => {
    setEditingClass(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      teacherIds: record.teacherIds || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteClass(id);
      if (res.success) {
        message.success("删除成功");
        fetchData();
      } else {
        message.error(res.message || "删除失败");
      }
    } catch (error: unknown) {
      const err = error as Error;
      message.error(err.message || "删除失败");
    }
  };

  const handleManageStudents = (classId: number) => {
    navigate(`/students?classId=${classId}`);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingClass) {
        const res = await updateClass(editingClass.id, values);
        if (res.success) {
          message.success("更新成功");
          setModalVisible(false);
          fetchData();
        } else {
          message.error(res.message || "更新失败");
        }
      } else {
        const res = await createClass(values as Omit<Class, "id">);
        if (res.success) {
          message.success("创建成功");
          setModalVisible(false);
          fetchData();
        } else {
          message.error(res.message || "创建失败");
        }
      }
    } catch (error) {}
  };

  const columns = [
    { title: "班级名称", dataIndex: "name", key: "name" },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "绑定教师",
      dataIndex: "teachers",
      key: "teachers",
      render: (teacherList: User[] | undefined) => {
        if (!teacherList || teacherList.length === 0) return "-";
        return teacherList.map((t) => (
          <Tag key={t.id} color="blue">
            {t.username}
          </Tag>
        ));
      },
    },
    {
      title: "学生数量",
      dataIndex: "studentCount",
      key: "studentCount",
      width: 100,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (text: string) =>
        text ? new Date(text).toLocaleString("zh-CN") : "-",
    },
    {
      title: "操作",
      key: "action",
      width: 240,
      render: (_: unknown, record: Class) => (
        <Space>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => handleManageStudents(record.id)}
          >
            学生管理
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此班级吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增班级
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingClass ? "编辑班级" : "新增班级"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="班级名称"
            rules={[{ required: true, message: "请输入班级名称" }]}
          >
            <Input placeholder="请输入班级名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入班级描述" />
          </Form.Item>
          <Form.Item
            name="teacherIds"
            label="绑定教师"
            tooltip="选择后可多选，绑定的教师可以查看此班级"
          >
            <Select mode="multiple" placeholder="选择教师" allowClear>
              {teachers.map((teacher) => (
                <Select.Option key={teacher.id} value={teacher.id}>
                  {teacher.username}{" "}
                  {teacher.subject ? `(${teacher.subject})` : ""}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Classes;

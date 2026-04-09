import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getUsers, createUser, updateUser, deleteUser } from "@/api";
import type { User } from "@/types";
import dayjs from "dayjs";

const Users: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (error) {
      message.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteUser(id);
      if (res.success) {
        message.success("删除成功");
        fetchData();
      } else {
        message.error(res.message || "删除失败");
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        const res = await updateUser(editingUser.id, values);
        if (res.success) {
          message.success("更新成功");
          setModalVisible(false);
          fetchData();
        } else {
          message.error(res.message || "更新失败");
        }
      } else {
        const res = await createUser(values as Omit<User, "id">);
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
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "账号", dataIndex: "account", key: "account" },
    { title: "用户名", dataIndex: "username", key: "username" },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) =>
        role === "admin" ? "管理员" : role === "teacher" ? "教师" : "学生",
    },
    {
      title: "学科",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string) => subject || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此用户吗？"
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
          新增用户
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingUser ? "编辑用户" : "新增用户"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="account"
            label="账号"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input placeholder="登录账号" />
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="中文名字" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={
              editingUser ? [] : [{ required: true, message: "请输入密码" }]
            }
          >
            <Input.Password
              placeholder={editingUser ? "留空表示不修改密码" : ""}
            />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="teacher">教师</Select.Option>
              <Select.Option value="student">学生</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="subject" label="学科">
            <Select allowClear placeholder="选择学科">
              <Select.Option value="语文">语文</Select.Option>
              <Select.Option value="数学">数学</Select.Option>
              <Select.Option value="英语">英语</Select.Option>
              <Select.Option value="科学">科学</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;

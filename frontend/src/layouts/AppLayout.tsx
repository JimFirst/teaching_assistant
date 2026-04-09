import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, theme, message } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { User } from "@/types";

const { Header, Sider, Content } = Layout;

export function Loading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Spin size="large" />
    </div>
  );
}

function Spin({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const spinSize = size === "large" ? 40 : size === "small" ? 20 : 30;
  return (
    <div
      style={{
        border: "3px solid #f3f3f3",
        borderTop: "3px solid #1890ff",
        borderRadius: "50%",
        width: spinSize,
        height: spinSize,
        animation: "spin 1s linear infinite",
      }}
    />
  );
}

export function AppLayout({ user }: { user: User }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    message.success("已退出登录");
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { key: "/", icon: <HomeOutlined />, label: "首页" },
    ...(user.role === "admin"
      ? [
          { key: "/users", icon: <UserOutlined />, label: "用户管理" },
          { key: "/classes", icon: <TeamOutlined />, label: "班级管理" },
          { key: "/students", icon: <TeamOutlined />, label: "学生管理" },
          { key: "/homeworks", icon: <BookOutlined />, label: "作业管理" },
          { key: "/grades", icon: <FileTextOutlined />, label: "成绩管理" },
        ]
      : []),
    ...(user.role === "teacher"
      ? [
          { key: "/homeworks", icon: <BookOutlined />, label: "作业管理" },
          { key: "/grades", icon: <FileTextOutlined />, label: "成绩管理" },
        ]
      : []),
    ...(user.role === "student"
      ? [
          { key: "/homeworks", icon: <BookOutlined />, label: "我的作业" },
          { key: "/grades", icon: <FileTextOutlined />, label: "我的成绩" },
        ]
      : []),
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          教师助手
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 16 }}>
            {user.username} (
            {user.role === "admin"
              ? "管理员"
              : user.role === "teacher"
                ? "教师"
                : "学生"}
            )
          </span>
          <a onClick={handleLogout} style={{ cursor: "pointer" }}>
            <LogoutOutlined /> 退出
          </a>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

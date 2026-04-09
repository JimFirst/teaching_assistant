import { Card, Row, Col, Statistic } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { User } from "@/types";

interface HomeProps {
  user: User;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        {getWelcomeMessage()}，{user.name}！
      </h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户角色"
              value={user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : '学生'}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        {user.role === 'admin' && (
          <>
            <Col span={6}>
              <Card>
                <Statistic
                  title="系统功能"
                  value="全部"
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="作业管理"
                  value="可管理"
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成绩管理"
                  value="可查看"
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
          </>
        )}
        {user.role === 'teacher' && (
          <>
            <Col span={8}>
              <Card>
                <Statistic
                  title="作业发布"
                  value="可发布"
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="成绩批改"
                  value="可批改"
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
          </>
        )}
        {user.role === 'student' && (
          <>
            <Col span={8}>
              <Card>
                <Statistic
                  title="作业提交"
                  value="可提交"
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="成绩查看"
                  value="可查看"
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};

export default Home;
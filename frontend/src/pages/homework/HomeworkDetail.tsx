import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Table, Tag, message, Spin, List, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { getHomework, getSubmissions } from "@/api";
import type { Homework, HomeworkSubmission, Question } from "@/types";
import type { User } from "@/types";

const { Text } = Typography;

const HomeworkDetail: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [homeworkRes, submissionsRes] = await Promise.all([
          getHomework(parseInt(id)),
          getSubmissions(parseInt(id))
        ]);
        if (homeworkRes.success && homeworkRes.data) {
          setHomework(homeworkRes.data);
        }
        if (submissionsRes.success && submissionsRes.data) {
          setSubmissions(submissionsRes.data);
        }
      } catch (error) {
        message.error('获取作业详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const canEdit = user.role === 'admin' || user.role === 'teacher';

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', render: (text: string) => text?.slice(0, 19) || '-' },
    { title: '状态', dataIndex: 'graded', key: 'graded', render: (graded: boolean, record: HomeworkSubmission) => (
      graded ? (
        <Tag color="green">已批改 {record.score}分</Tag>
      ) : (
        <Tag color="orange">待批改</Tag>
      )
    )},
    ...(canEdit ? [{
      title: '操作',
      key: 'action',
      render: (_: unknown, record: HomeworkSubmission) => (
        record.graded ? (
          <Tag>{record.feedback}</Tag>
        ) : (
          <Button type="link" onClick={() => navigate(`/grades?submissionId=${record.id}`)}>
            批改
          </Button>
        )
      )
    }] : [])
  ];

  if (loading) {
    return <Spin size="large" />;
  }

  if (!homework) {
    return <div>作业不存在</div>;
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/homeworks')} style={{ marginBottom: 16 }}>
        返回
      </Button>
      <Card title={homework.title} extra={canEdit && <Button icon={<EditOutlined />} onClick={() => navigate(`/homeworks`)}>编辑</Button>}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="内容">{homework.content || '-'}</Descriptions.Item>
          <Descriptions.Item label="班级">{homework.className || '-'}</Descriptions.Item>
          <Descriptions.Item label="截止时间">{homework.deadline?.slice(0, 16) || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{homework.createdAt?.slice(0, 19) || '-'}</Descriptions.Item>
          {homework.imageUrl && (
            <Descriptions.Item label="作业图片" span={2}>
              <img src={homework.imageUrl} alt="作业图片" style={{ maxWidth: 300, maxHeight: 300 }} />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 问题列表 */}
      {homework.questions && homework.questions.length > 0 && (
        <Card title="问题列表" style={{ marginTop: 16 }}>
          <List
            dataSource={homework.questions}
            renderItem={(question: Question, index: number) => (
              <List.Item>
                <List.Item.Meta
                  title={`问题 ${index + 1}: ${question.questionText}`}
                  description={
                    question.answers && question.answers.length > 0 ? (
                      <div>
                        <Text type="secondary">参考答案:</Text>
                        <ul>
                          {question.answers.map((answer: any) => (
                            <li key={answer.id}>{answer.answerText}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Text type="secondary">暂无参考答案</Text>
                    )
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card title="提交列表" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default HomeworkDetail;
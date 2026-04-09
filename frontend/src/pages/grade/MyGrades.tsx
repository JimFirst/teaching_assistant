import { useState, useEffect } from 'react';
import { Table, Tag, Card, Empty, Spin, Descriptions } from 'antd';
import { getMySubmissions } from "@/api";
import type { User } from "@/types";

interface MyGradesProps {
  user: User;
}

interface SubmissionData {
  id: number;
  homeworkId: number;
  studentId: number;
  studentName?: string;
  answers: string | Record<string, string>;
  submittedAt: string;
  grade?: {
    id: number;
    score: number;
    feedback: string;
  } | null;
  homework?: {
    id: number;
    title: string;
    deadline?: string;
  };
}

const MyGrades: React.FC<MyGradesProps> = ({ user }) => {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyGrades();
  }, []);

  const fetchMyGrades = async () => {
    setLoading(true);
    try {
      const res = await getMySubmissions();
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (error) {
      console.error('获取成绩失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '作业ID',
      dataIndex: 'homeworkId',
      key: 'homeworkId',
      width: 80
    },
    {
      title: '作业标题',
      dataIndex: ['homework', 'title'],
      key: 'homeworkTitle',
      render: (_: unknown, record: SubmissionData) => (
        <Tag color="blue">{record.homework?.title || '未知作业'}</Tag>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (text: string) => text?.slice(0, 19) || '-'
    },
    {
      title: '批改状态',
      key: 'status',
      render: (_: unknown, record: SubmissionData) =>
        record.grade ? (
          <Tag color="green">已批改</Tag>
        ) : (
          <Tag color="orange">待批改</Tag>
        )
    },
    {
      title: '成绩',
      key: 'score',
      render: (_: unknown, record: SubmissionData) =>
        record.grade?.score !== undefined ? (
          <Tag color={record.grade.score >= 60 ? 'green' : 'red'} style={{ fontSize: 16, padding: '4px 12px' }}>
            {record.grade.score} 分
          </Tag>
        ) : (
          <Tag color="default">-</Tag>
        )
    },
    {
      title: '评语',
      key: 'feedback',
      ellipsis: true,
      render: (_: unknown, record: SubmissionData) => record.grade?.feedback || '-'
    }
  ];

  const expandedRowRender = (record: SubmissionData) => {
    const answers = record.answers;
    const answerList: { questionId: string; answerText: string }[] = [];

    if (typeof answers === 'object' && answers !== null) {
      Object.entries(answers).forEach(([questionId, answerText]) => {
        answerList.push({ questionId, answerText: answerText as string });
      });
    }

    return (
      <Card size="small" title="提交的答案" style={{ marginTop: 16 }}>
        {answerList.length > 0 ? (
          answerList.map((item, index) => (
            <Descriptions key={item.questionId} column={1} size="small" bordered>
              <Descriptions.Item label={`第 ${index + 1} 题`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{item.answerText || '(未回答)'}</div>
              </Descriptions.Item>
            </Descriptions>
          ))
        ) : (
          <Empty description="无答案内容" />
        )}
        {record.grade?.feedback && (
          <div style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="教师评语">
                <div style={{ whiteSpace: 'pre-wrap', color: '#1890ff' }}>{record.grade.feedback}</div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>我的成绩</h2>

      {submissions.length === 0 ? (
        <Empty description="暂无作业提交记录" />
      ) : (
        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          expandable={{
            expandedRowRender
          }}
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default MyGrades;

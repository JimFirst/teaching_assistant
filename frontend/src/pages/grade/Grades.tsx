import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Input, message, Card, Tag, Select, Space, Drawer } from 'antd';
import { CheckOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons';
import { getHomeworks, getAllSubmissions, gradeSubmission, getGrades, autoGrade } from "@/api";
import type { Homework, HomeworkSubmission, Grade, Question } from "@/types";
import type { User } from "@/types";

const Grades: React.FC<{ user: User }> = ({ user }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<HomeworkSubmission | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<HomeworkSubmission | null>(null);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<number | undefined>(undefined);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gradesRes, homeworksRes] = await Promise.all([
        getGrades(),
        getHomeworks()
      ]);
      if (gradesRes.success && gradesRes.data) {
        setGrades(gradesRes.data.map(g => ({
          ...g,
          homeworkTitle: homeworksRes.data?.find(h => h.id === g.homeworkId)?.title,
          studentName: g.studentName
        })));
      }
      if (homeworksRes.success && homeworksRes.data) {
        setHomeworks(homeworksRes.data);
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (homeworkId?: number) => {
    setLoading(true);
    try {
      const res = await getAllSubmissions(homeworkId);
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (error) {
      message.error('获取提交列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user.role === 'admin' || user.role === 'teacher') {
      fetchSubmissions(selectedHomeworkId);
    }
  }, [selectedHomeworkId, user.role]);

  const handleGrade = (submission: HomeworkSubmission) => {
    setGradingSubmission(submission);
    form.setFieldsValue({ score: submission.score || 80, feedback: submission.feedback || '' });
    setModalVisible(true);
  };

  const handleView = (submission: HomeworkSubmission) => {
    setViewingSubmission(submission);
    setDrawerVisible(true);
  };

  const handleSubmitGrade = async () => {
    try {
      const values = await form.validateFields();
      if (!gradingSubmission) return;
      const res = await gradeSubmission(gradingSubmission.id, values.score, values.feedback);
      if (res.success) {
        message.success('批改成功');
        setModalVisible(false);
        fetchSubmissions(selectedHomeworkId);
      } else {
        message.error(res.message || '批改失败');
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  // AI 自动批改
  const handleAutoGrade = async (submission: HomeworkSubmission) => {
    try {
      const res = await autoGrade(submission.id);
      if (res.success) {
        message.success('AI自动批改完成');
        fetchSubmissions(selectedHomeworkId);
      } else {
        message.error(res.message || 'AI批改失败');
      }
    } catch (error) {
      message.error('AI批改失败');
    }
  };

  const canGrade = user.role === 'admin' || user.role === 'teacher';

  // 如果是学生，显示自己的成绩
  if (user.role === 'student') {
    const gradeColumns = [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
      { title: '作业', dataIndex: 'homeworkTitle', key: 'homeworkTitle', render: (text: string) => <Tag>{text}</Tag> },
      { title: '成绩', dataIndex: 'score', key: 'score', render: (score: number) => score ? <Tag color={score >= 60 ? 'green' : 'red'}>{score}</Tag> : <Tag color="orange">待批改</Tag> },
      { title: '评语', dataIndex: 'feedback', key: 'feedback', ellipsis: true },
      { title: '批改时间', dataIndex: 'gradedAt', key: 'gradedAt', render: (text: string) => text?.slice(0, 19) }
    ];

    return (
      <div>
        <h2 style={{ marginBottom: 16 }}>我的成绩</h2>
        <Table
          columns={gradeColumns}
          dataSource={grades}
          rowKey="id"
          loading={loading}
        />
      </div>
    );
  }

  // 教师/管理员视图
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', render: (text: string) => text?.slice(0, 19) },
    {
      title: '答案内容',
      key: 'answers',
      render: (_: unknown, record: HomeworkSubmission) => {
        const answers = record.answers;
        if (typeof answers === 'object' && answers !== null) {
          const answerCount = Object.keys(answers).length;
          return <Tag color="blue">{answerCount} 道题</Tag>;
        }
        return <Tag>{String(answers || '').substring(0, 20)}...</Tag>;
      }
    },
    {
      title: '批改状态',
      key: 'status',
      render: (_: unknown, record: HomeworkSubmission) => (
        record.graded ? (
          <Tag color="green">已批改 ({record.score}分)</Tag>
        ) : (
          <Tag color="orange">待批改</Tag>
        )
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: unknown, record: HomeworkSubmission) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {canGrade && !record.graded && (
            <>
              <Button type="link" icon={<RobotOutlined />} onClick={() => handleAutoGrade(record)}>
                AI批改
              </Button>
              <Button type="link" icon={<CheckOutlined />} onClick={() => handleGrade(record)}>
                批改
              </Button>
            </>
          )}
          {canGrade && record.graded && (
            <>
              <Button type="link" icon={<RobotOutlined />} onClick={() => handleAutoGrade(record)}>
                重评
              </Button>
              <Button type="link" icon={<CheckOutlined />} onClick={() => handleGrade(record)}>
                修改
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>成绩管理</h2>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择作业筛选"
          allowClear
          style={{ width: 200 }}
          value={selectedHomeworkId}
          onChange={setSelectedHomeworkId}
        >
          {homeworks.map(hw => (
            <Select.Option key={hw.id} value={hw.id}>{hw.title}</Select.Option>
          ))}
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={submissions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 批改弹窗 */}
      <Modal
        title="批改作业"
        open={modalVisible}
        onOk={handleSubmitGrade}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        {gradingSubmission && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>学生:</strong> {gradingSubmission.studentName}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>提交时间:</strong> {gradingSubmission.submittedAt?.slice(0, 19)}
            </div>
            <Form form={form} layout="vertical">
              <Form.Item name="score" label="成绩" rules={[{ required: true, message: '请输入成绩' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="feedback" label="评语">
                <Input.TextArea rows={4} placeholder="请输入评语..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 查看答案抽屉 */}
      <Drawer
        title="提交详情"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {viewingSubmission && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p><strong>学生姓名:</strong> {viewingSubmission.studentName}</p>
              <p><strong>学号:</strong> {viewingSubmission.studentNo}</p>
              <p><strong>提交时间:</strong> {viewingSubmission.submittedAt?.slice(0, 19)}</p>
            </Card>

            <h3>提交的答案</h3>
            {viewingSubmission.answers && typeof viewingSubmission.answers === 'object' ? (
              <div>
                {Object.entries(viewingSubmission.answers).map(([questionId, answer], index) => (
                  <Card key={questionId} size="small" style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                      第 {index + 1} 题
                    </div>
                    <div style={{ color: answer ? '#333' : '#999' }}>
                      {answer || '(未回答)'}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ color: '#666' }}>
                {String(viewingSubmission.answers || '无内容')}
              </div>
            )}

            {viewingSubmission.graded && (
              <div style={{ marginTop: 24 }}>
                <h3>批改结果</h3>
                <Card size="small">
                  <p><strong>成绩:</strong> <Tag color={viewingSubmission.score && viewingSubmission.score >= 60 ? 'green' : 'red'}>{viewingSubmission.score}</Tag></p>
                  <p><strong>评语:</strong></p>
                  <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                    {viewingSubmission.feedback || '无评语'}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Grades;

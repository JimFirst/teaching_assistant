import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Form, Input, message, Spin, List, Tag, Divider, Select, Upload } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, UploadOutlined, RobotOutlined } from '@ant-design/icons';
import { getHomework, submitHomeworkWithAnswers, getMySubmissions, getStudents } from "@/api";
import type { Homework, Question, Student } from "@/types";
import type { User } from "@/types";

interface AnswerRecord {
  [questionId: number]: string;
}

const HomeworkSubmit: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form] = Form.useForm();

  const isTeacher = user.role === 'teacher';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const homeworkRes = await getHomework(parseInt(id));
        if (homeworkRes.success && homeworkRes.data) {
          setHomework(homeworkRes.data);
          
          if (isTeacher && homeworkRes.data.classId) {
            const studentsRes = await getStudents(homeworkRes.data.classId);
            if (studentsRes.success && studentsRes.data) {
              setStudents(studentsRes.data);
            }
          }
        }

        if (isTeacher) {
          if (selectedStudentId) {
            const submissionsRes = await getMySubmissions(parseInt(id));
            if (submissionsRes.success && submissionsRes.data && submissionsRes.data.length > 0) {
              const lastSubmission = submissionsRes.data[0];
              setExistingSubmission(lastSubmission);
              setSubmitted(true);
              if (lastSubmission.answers) {
                form.setFieldsValue(lastSubmission.answers as AnswerRecord);
              }
            }
          }
        } else {
          const submissionsRes = await getMySubmissions(parseInt(id));
          if (submissionsRes.success && submissionsRes.data && submissionsRes.data.length > 0) {
            const lastSubmission = submissionsRes.data[0];
            setExistingSubmission(lastSubmission);
            setSubmitted(true);
            if (lastSubmission.answers) {
              form.setFieldsValue(lastSubmission.answers as AnswerRecord);
            }
          }
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, form, isTeacher, selectedStudentId]);

  const handleStudentChange = (studentId: number | null) => {
    setSelectedStudentId(studentId);
    setSubmitted(false);
    setExistingSubmission(null);
    form.resetFields();
  };

  const handleSubmit = async (values: AnswerRecord) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const answers: AnswerRecord = {};
      Object.keys(values).forEach(key => {
        const questionId = parseInt(key);
        const answer = values[questionId];
        if (answer && typeof answer === 'string' && answer.trim()) {
          answers[questionId] = answer.trim();
        }
      });

      if (Object.keys(answers).length === 0 && !imageFile) {
        message.warning('请至少填写一道题的答案或上传作业图片');
        setSubmitting(false);
        return;
      }

      const res = await submitHomeworkWithAnswers(
        parseInt(id), 
        answers, 
        isTeacher && selectedStudentId ? selectedStudentId : undefined,
        imageFile || undefined
      );
      if (res.success) {
        message.success('提交成功');
        setSubmitted(true);
        setExistingSubmission(res.data);
        if (res.data?.grade?.score !== undefined) {
          message.info(`自动批改得分: ${res.data.grade.score}分`);
        }
        navigate('/homeworks');
      } else {
        message.error(res.message || '提交失败');
      }
    } catch (error: any) {
      message.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!homework) {
    return <div>作业不存在</div>;
  }

  const isExpired = homework.deadline ? new Date(homework.deadline) < new Date() : false;
  const questions: Question[] = homework.questions || [];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/homeworks')} style={{ marginBottom: 16 }}>
        返回
      </Button>
      <Card title={homework.title}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="描述">{homework.description || homework.content || '无'}</Descriptions.Item>
          <Descriptions.Item label="班级">{homework.className}</Descriptions.Item>
          <Descriptions.Item label="截止时间">{homework.deadline?.slice(0, 16)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{homework.createdAt?.slice(0, 19)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {isTeacher && (
        <Card title="选择学生" style={{ marginTop: 16 }}>
          <Select
            style={{ width: 300 }}
            placeholder="请选择学生"
            value={selectedStudentId}
            onChange={handleStudentChange}
            allowClear
            options={students.map(s => ({
              label: `${s.name} (${s.studentNo})`,
              value: s.id
            }))}
          />
        </Card>
      )}

      {submitted && existingSubmission && (
        <Card
          title={<><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />已提交的答案</>}
          style={{ marginTop: 16 }}
        >
          <List
            dataSource={questions}
            renderItem={(question, index) => {
              const answer = existingSubmission.answers?.[question.id] || existingSubmission.answers?.[String(question.id)];
              return (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                      第{index + 1}题: {question.questionText}
                    </div>
                    <div style={{ color: answer ? '#52c41a' : '#999' }}>
                      {answer || '(未回答)'}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
          <Divider />
          <div style={{ textAlign: 'right', color: '#888' }}>
            提交时间: {existingSubmission.submittedAt?.slice(0, 19)}
            {existingSubmission.grade && (
              <Tag color="green" style={{ marginLeft: 16 }}>
                已批改: {existingSubmission.grade.score}分
              </Tag>
            )}
          </div>
        </Card>
      )}

      {((isTeacher && selectedStudentId) || !isTeacher) && (
        <Card title={isTeacher && selectedStudentId ? `为学生提交作业` : "提交作业"} style={{ marginTop: 16 }}>
          {isExpired ? (
            <div style={{ color: 'red', textAlign: 'center', padding: 20 }}>
              该作业已截止，无法提交
            </div>
          ) : submitted ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#52c41a' }}>
              <CheckCircleOutlined style={{ fontSize: 24, marginRight: 8 }} />
              已提交过此作业，如需修改请在下方重新填写并提交
            </div>
          ) : null}

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <Form.Item
                  key={question.id}
                  name={question.id}
                  label={`第${index + 1}题: ${question.questionText}`}
                >
                  <Input.TextArea rows={4} placeholder="请输入答案..." />
                </Form.Item>
              ))
            ) : (
              <Form.Item name="content" label="作业内容">
                <Input.TextArea rows={10} placeholder="请输入作业内容..." />
              </Form.Item>
            )}
            <Form.Item label="上传作业图片（可选）">
              <Upload
                beforeUpload={(file) => {
                  setImageFile(file);
                  return false;
                }}
                maxCount={1}
                listType="picture"
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>点击上传图片</Button>
              </Upload>
              {imageFile && (
                <div style={{ marginTop: 8, color: '#52c41a' }}>
                  已选择图片: {imageFile.name}
                </div>
              )}
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} size="large">
                {submitted ? '更新提交' : '提交作业'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default HomeworkSubmit;
import { useCallback, useEffect, useState } from "react";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import {
  buildClassroomDetailPathByRole,
  getExamListPathByRole,
  getProfilePathByRole,
  buildStudentExamAttemptPath,
} from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import AttemptMonitorPanel from "../../anti-cheat/components/AttemptMonitorPanel";
import ExamForm from "../components/ExamForm";
import QuestionCard from "../components/QuestionCard";
import QuestionForm from "../components/QuestionForm";
import { getExamStatusVariant } from "../examHelpers";

// Hàm này dựng danh sách settings ngắn gọn để card thông tin chi tiết dễ render hơn.
function buildSettingItems(exam) {
  return [
    {
      label: "Random câu hỏi",
      value: exam.settings.shuffleQuestions ? "Có" : "Không",
    },
    {
      label: "Random đáp án",
      value: exam.settings.shuffleAnswers ? "Có" : "Không",
    },
    {
      label: "Số lần làm tối đa",
      value: `${exam.settings.maxAttempts} lần`,
    },
    {
      label: "Hiện kết quả sau khi nộp",
      value: exam.settings.showResultAfterSubmit ? "Có" : "Không",
    },
    {
      label: "Yêu cầu fullscreen",
      value: exam.settings.requireFullscreen ? "Có" : "Không",
    },
  ];
}

// Hàm này kiểm tra role hiện tại có được mở question bank ở trang chi tiết đề thi hay không.
function canRoleInspectQuestionBank(role) {
  return role === "Admin" || role === "Teacher";
}

// Hàm này dựng vài số liệu nhanh cho khu vực quản lý câu hỏi để teacher/admin nhìn tổng quan ngay.
function buildQuestionSummaryItems(exam, questions) {
  const singleChoiceCount = questions.filter((question) => question.questionType === "SingleChoice").length;
  const multipleChoiceCount = questions.filter((question) => question.questionType === "MultipleChoice").length;
  const shortAnswerCount = questions.filter((question) => question.questionType === "ShortAnswer").length;
  const totalQuestionScore = questions.reduce(
    (totalValue, question) => totalValue + Number(question.score || 0),
    0,
  );

  return [
    { label: "Tổng câu hỏi", value: exam.questionCount },
    { label: "Tổng điểm", value: totalQuestionScore },
    { label: "Một đáp án", value: singleChoiceCount },
    { label: "Nhiều đáp án", value: multipleChoiceCount },
    { label: "Tự luận", value: shortAnswerCount },
  ];
}

// Hàm này tính điểm trung bình từ danh sách attempt đã có điểm để hiển thị đúng hơn ở exam detail.
function calculateAverageScore(attempts = []) {
  const scoredAttempts = attempts
    .map((attempt) => attempt.score)
    .filter((scoreValue) => typeof scoreValue === "number");

  if (scoredAttempts.length === 0) {
    return null;
  }

  const totalValue = scoredAttempts.reduce((sumValue, scoreValue) => sumValue + scoreValue, 0);
  return Math.round((totalValue / scoredAttempts.length) * 10) / 10;
}

// Trang này là màn chi tiết bài kiểm tra, đồng thời là nơi teacher chỉnh sửa exam metadata và question bank.
export default function ExamDetailPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [antiCheatSummary, setAntiCheatSummary] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [armedDeleteQuestionId, setArmedDeleteQuestionId] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [isStartingAttempt, setIsStartingAttempt] = useState(false);

  // Hàm này gọi song song các endpoint cần thiết cho detail page để dữ liệu metadata và question bank đi cùng nhau.
  const fetchExamDetailData = useCallback(async () => {
    const requestList = [examApi.getById(examId), classroomApi.getAll()];

    if (canRoleInspectQuestionBank(user?.role)) {
      requestList.push(examApi.getQuestionList(examId));
    }

    const [examResponse, classroomResponse, questionResponse] = await Promise.all(requestList);
    const questions = questionResponse?.data ?? [];
    let nextExam = {
      ...examResponse.data,
      totalQuestionScore: questions.length > 0 ? examApi.calculateTotalQuestionScore(questions) : null,
    };
    let nextAntiCheatSummary = null;
    let nextAttempts = [];

    if (nextExam.canEdit) {
      try {
        const attemptsResponse = await examAttemptApi.getByExam(examId);
        nextAttempts = attemptsResponse.data;

        nextExam = {
          ...nextExam,
          averageScore: calculateAverageScore(nextAttempts),
        };
      } catch {
        // Đoạn này mình chủ động bỏ qua để trang chi tiết vẫn mở được dù API attempt tạm thời chưa phản hồi.
      }
    }

    if (nextExam.canEdit && nextExam.enableAntiCheat) {
      try {
        const antiCheatResponse = await antiCheatApi.getExamSummary(examId);
        nextAntiCheatSummary = antiCheatResponse.data;
      } catch {
        nextAntiCheatSummary = null;
      }
    }

    return {
      classrooms: classroomResponse.data,
      exam: nextExam,
      questions,
      antiCheatSummary: nextAntiCheatSummary,
      attempts: nextAttempts,
    };
  }, [examId, user?.role]);

  // Hàm này tải detail exam và question bank để các thao tác CRUD sau đó chỉ cần gọi reload lại một nơi.
  async function loadExamDetail() {
    setIsLoading(true);

    try {
      const nextData = await fetchExamDetailData();
      setExam(nextData.exam);
      setClassrooms(nextData.classrooms);
      setQuestions(nextData.questions);
      setAntiCheatSummary(nextData.antiCheatSummary);
      setAttempts(nextData.attempts);
      setLoadErrorMessage("");
    } catch (error) {
      setExam(null);
      setQuestions([]);
      setAntiCheatSummary(null);
      setAttempts([]);
      const nextMessage = error.message || "Không thể tải chi tiết bài kiểm tra.";
      setLoadErrorMessage(nextMessage);
      showToast({
        tone: "danger",
        title: "Tải đề thi thất bại",
        message: nextMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    const loadingTimeoutId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoading(true);
      }
    }, 0);

    // Hàm này lấy dữ liệu ngay khi đổi exam id để detail page luôn đúng record hiện tại.
    async function loadInitialExamDetail() {
      try {
        const nextData = await fetchExamDetailData();

        if (!isMounted) {
          return;
        }

        setExam(nextData.exam);
        setClassrooms(nextData.classrooms);
        setQuestions(nextData.questions);
        setAntiCheatSummary(nextData.antiCheatSummary);
        setAttempts(nextData.attempts);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setExam(null);
        setQuestions([]);
        setAntiCheatSummary(null);
        setAttempts([]);
        const nextMessage = error.message || "Không thể tải chi tiết bài kiểm tra.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải đề thi thất bại",
          message: nextMessage,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialExamDetail();

    return () => {
      window.clearTimeout(loadingTimeoutId);
      isMounted = false;
    };
  }, [fetchExamDetailData, showToast]);

  // Hàm này lưu chỉnh sửa exam của teacher rồi tải lại detail để card thông tin luôn mới.
  async function handleUpdateExam(payload) {
    setIsSaving(true);

    try {
      const response = await examApi.update(examId, payload);
      await loadExamDetail();
      showToast({
        tone: "success",
        title: "Đã cập nhật đề thi",
        message: response.message,
      });
      setIsDeleteArmed(false);
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật đề thi thất bại",
        message: error.message || "Không thể cập nhật bài kiểm tra.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // Hàm này thêm câu hỏi mới vào đề hiện tại rồi reload lại summary và danh sách question ngay sau đó.
  async function handleCreateQuestion(payload) {
    setIsQuestionSubmitting(true);

    try {
      const response = await examApi.createQuestion(examId, payload);
      await loadExamDetail();
      showToast({
        tone: "success",
        title: "Đã thêm câu hỏi",
        message: response.message,
      });
      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Thêm câu hỏi thất bại",
        message: error.message || "Không thể thêm câu hỏi mới.",
      });
      return false;
    } finally {
      setIsQuestionSubmitting(false);
    }
  }

  // Hàm này bật hoặc tắt chế độ chỉnh sửa inline cho đúng câu hỏi mà teacher vừa chọn.
  function handleToggleEditQuestion(questionId) {
    setArmedDeleteQuestionId(null);
    setEditingQuestionId((previousQuestionId) => {
      return previousQuestionId === questionId ? null : questionId;
    });
  }

  // Hàm này lưu thay đổi của một câu hỏi cùng toàn bộ đáp án của nó.
  async function handleUpdateQuestion(questionId, payload) {
    setIsQuestionSubmitting(true);

    try {
      const response = await examApi.updateQuestion(examId, questionId, payload);
      await loadExamDetail();
      setEditingQuestionId(null);
      setArmedDeleteQuestionId(null);
      showToast({
        tone: "success",
        title: "Đã cập nhật câu hỏi",
        message: response.message,
      });
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật câu hỏi thất bại",
        message: error.message || "Không thể cập nhật câu hỏi.",
      });
      return false;
    } finally {
      setIsQuestionSubmitting(false);
    }
  }

  // Hàm này dùng xác nhận 2 bước để tránh teacher xóa nhầm câu hỏi khỏi đề thi.
  async function handleDeleteQuestion(questionId) {
    if (armedDeleteQuestionId !== questionId) {
      setEditingQuestionId(null);
      setArmedDeleteQuestionId(questionId);
      return;
    }

    setIsQuestionSubmitting(true);
    setDeletingQuestionId(questionId);

    try {
      const response = await examApi.deleteQuestion(examId, questionId);
      await loadExamDetail();
      setArmedDeleteQuestionId(null);
      showToast({
        tone: "success",
        title: "Đã xóa câu hỏi",
        message: response.message,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa câu hỏi thất bại",
        message: error.message || "Không thể xóa câu hỏi.",
      });
    } finally {
      setDeletingQuestionId(null);
      setIsQuestionSubmitting(false);
    }
  }

  // Hàm này xóa exam sau khi teacher đã xác nhận 2 bước để tránh bấm nhầm.
  async function handleDeleteExam() {
    if (!isDeleteArmed) {
      setIsDeleteArmed(true);
      return;
    }

    setIsSaving(true);

    try {
      const response = await examApi.delete(examId);
      navigate(getExamListPathByRole(user?.role), {
        replace: true,
        state: { message: response.message },
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa đề thi thất bại",
        message: error.message || "Không thể xóa bài kiểm tra.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStartAttempt() {
    setIsStartingAttempt(true);

    try {
      const response = await examAttemptApi.start(examId);
      navigate(buildStudentExamAttemptPath(response.data.attempt.id));
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Không thể vào phòng thi",
        message: error.message || "Không thể bắt đầu làm bài lúc này.",
      });
    } finally {
      setIsStartingAttempt(false);
    }
  }

  const questionSummaryItems = exam ? buildQuestionSummaryItems(exam, questions) : [];
  const averageScoreLabel = typeof exam?.averageScore === "number" ? exam.averageScore : "--";
  const totalQuestionScoreLabel =
    typeof exam?.totalQuestionScore === "number" ? exam.totalQuestionScore : "--";

  if (isLoading) {
    return (
      <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
        Đang tải chi tiết bài kiểm tra...
      </div>
    );
  }

  if (!exam) {
    return (
      <EmptyState
        title="Không tìm thấy bài kiểm tra."
        description={loadErrorMessage}
        action={
          <Link className="eg-button eg-button-primary" to={getExamListPathByRole(user?.role)}>
            Quay lại danh sách đề thi
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chi tiết bài kiểm tra"
        title={exam.title}
        actions={
          user?.role === "Student" ? (
            <Button disabled={isStartingAttempt} onClick={handleStartAttempt}>
              {isStartingAttempt ? "Đang vào phòng thi..." : "Bắt đầu làm bài"}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={getExamStatusVariant(exam.statusLabel)}>{exam.statusLabel}</Badge>
              <Badge variant={exam.isPublished ? "info" : "neutral"}>
                {exam.isPublished ? "Đã publish" : "Chưa publish"}
              </Badge>
              <Badge variant={exam.enableAntiCheat ? "caution" : "neutral"}>
                {exam.enableAntiCheat ? "Anti-cheat bật" : "Anti-cheat tắt"}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-sm font-semibold text-primary">Lớp học</p>
                <p className="mt-2 text-sm leading-6 text-secondary">{exam.classroomName}</p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-sm font-semibold text-primary">Giảng viên</p>
                <p className="mt-2 text-sm leading-6 text-secondary">{exam.teacherName}</p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-sm font-semibold text-primary">Mở đề</p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  {exam.startTime ? formatShortDateTime(exam.startTime) : "Chưa đặt lịch"}
                </p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-sm font-semibold text-primary">Đóng đề</p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  {exam.endTime ? formatShortDateTime(exam.endTime) : "Chưa đặt lịch"}
                </p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-sm font-semibold text-primary">Thời lượng</p>
                <p className="mt-2 text-sm leading-6 text-secondary">{exam.durationMinutes} phút</p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-sm font-semibold text-primary">Số lượt làm</p>
                <p className="mt-2 text-sm leading-6 text-secondary">{exam.attemptCount} lượt</p>
              </div>
            </div>

            <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
              Tạo lúc {formatShortDateTime(exam.createdAt)} • Cập nhật{" "}
              {formatShortDateTime(exam.updatedAt || exam.createdAt)}
            </div>
          </Card>

          {exam.canEdit ? (
            <ExamForm
              classroomOptions={classrooms}
              exam={exam}
              isSubmitting={isSaving}
              key={`${exam.id}-${exam.updatedAt || exam.createdAt}`}
              onSubmitExam={handleUpdateExam}
              submitLabel="Lưu thay đổi"
              title="Chỉnh sửa bài kiểm tra"
            />
          ) : null}

          {exam.canViewQuestionBank ? (
            <Card className="space-y-5">
              <h3 className="text-lg font-semibold text-primary">Ngân hàng câu hỏi</h3>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {questionSummaryItems.map((item) => (
                  <div key={item.label} className="rounded-[16px] border border-border bg-neutral p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-secondary">
                      {item.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-primary">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {exam.canEdit && exam.canViewQuestionBank ? (
            <QuestionForm
              defaultOrderIndex={questions.length + 1}
              isSubmitting={isQuestionSubmitting}
              key={`create-question-${exam.id}-${questions.length}`}
              onSubmitQuestion={handleCreateQuestion}
              submitLabel="Thêm câu hỏi"
              title="Thêm câu hỏi mới"
            />
          ) : null}

          {exam.canViewQuestionBank ? (
            questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-4">
                    <QuestionCard
                      canManage={exam.canEdit}
                      isDeleting={deletingQuestionId === question.id}
                      isEditing={editingQuestionId === question.id}
                      onDeleteQuestion={() => handleDeleteQuestion(question.id)}
                      onEditQuestion={() => handleToggleEditQuestion(question.id)}
                      question={question}
                    />

                    {armedDeleteQuestionId === question.id ? (
                      <p className="rounded-[16px] border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
                        Bạn bấm thêm một lần nữa vào nút xóa của câu này để xác nhận thao tác.
                      </p>
                    ) : null}

                    {editingQuestionId === question.id ? (
                      <QuestionForm
                        defaultOrderIndex={question.orderIndex}
                        isSubmitting={isQuestionSubmitting}
                        key={`edit-question-${question.id}-${question.updatedAt || question.createdAt}`}
                        onCancel={() => setEditingQuestionId(null)}
                        onSubmitQuestion={(payload) => handleUpdateQuestion(question.id, payload)}
                        question={question}
                        submitLabel="Lưu câu hỏi"
                        title={`Chỉnh sửa câu ${question.orderIndex}`}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Đề thi này chưa có câu hỏi nào."
              />
            )
          ) : null}

          {exam.canDelete ? (
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Nguy hiểm</h3>
              {isDeleteArmed ? (
                <p className="text-sm text-danger">
                  Bạn bấm thêm một lần nữa để xác nhận xóa đề thi này.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button disabled={isSaving} onClick={handleDeleteExam} variant="danger">
                  {isSaving ? "Đang xử lý..." : isDeleteArmed ? "Xác nhận xóa đề thi" : "Xóa đề thi"}
                </Button>
                {isDeleteArmed ? (
                  <Button
                    disabled={isSaving}
                    onClick={() => setIsDeleteArmed(false)}
                    variant="secondary"
                  >
                    Hủy thao tác xóa
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Cấu hình đề thi</h3>
            <div className="space-y-3">
              {buildSettingItems(exam).map((item) => (
                <div key={item.label} className="rounded-[16px] border border-border bg-neutral p-4">
                  <p className="text-sm font-semibold text-primary">{item.label}</p>
                  <p className="mt-2 text-sm text-secondary">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Tóm tắt đề thi</h3>
            <div className="space-y-3 text-sm text-secondary">
              <p>
                <span className="font-semibold text-primary">Số câu hỏi:</span> {exam.questionCount} câu
              </p>
              <p>
                <span className="font-semibold text-primary">Tổng điểm:</span> {totalQuestionScoreLabel}
              </p>
              <p>
                <span className="font-semibold text-primary">Điểm trung bình:</span> {averageScoreLabel}
              </p>
              <p>
                <span className="font-semibold text-primary">Publish:</span>{" "}
                {exam.isPublished ? "Đã bật" : "Chưa bật"}
              </p>
            </div>
          </Card>

          {exam.enableAntiCheat ? (
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Tóm tắt anti-cheat</h3>
              {antiCheatSummary ? (
                <div className="space-y-3 text-sm text-secondary">
                  <p>
                    <span className="font-semibold text-primary">Tổng lượt làm:</span>{" "}
                    {antiCheatSummary.totalAttempts}
                  </p>
                  <p>
                    <span className="font-semibold text-primary">Lượt bị gắn cờ:</span>{" "}
                    {antiCheatSummary.flaggedAttempts}
                  </p>
                  <p>
                    <span className="font-semibold text-primary">Tổng log:</span>{" "}
                    {antiCheatSummary.totalLogs}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-secondary">Chưa có dữ liệu.</p>
              )}
            </Card>
          ) : null}

          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Liên kết nhanh</h3>
            <div className="flex flex-wrap gap-3">
              <Link className="eg-button eg-button-secondary" to={getExamListPathByRole(user?.role)}>
                Danh sách đề thi
              </Link>
              <Link
                className="eg-button eg-button-ghost"
                to={buildClassroomDetailPathByRole(user?.role, exam.classroomId)}
              >
                Xem lớp học
              </Link>
              <Link className="eg-button eg-button-ghost" to={getProfilePathByRole(user?.role)}>
                Hồ sơ cá nhân
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {exam.canEdit ? (
        <AttemptMonitorPanel
          antiCheatSummary={antiCheatSummary}
          exam={exam}
          showToast={showToast}
          attempts={attempts}
        />
      ) : null}
    </div>
  );
}

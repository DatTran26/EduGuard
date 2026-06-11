import { getStoredRefreshToken, getStoredUser } from "../utils/tokenStorage";

const MOCK_DATABASE_STORAGE_KEY = "eduguard_mock_database";
const MOCK_DATABASE_VERSION = 4;
const MOCK_API_DELAY_MS = 120;

// Hàm này trả về thời gian hiện tại theo ISO để các bản ghi mock nhìn giống dữ liệu DB thật hơn.
function getNowIsoString() {
  return new Date().toISOString();
}

// Hàm này dựng sẵn dữ liệu user nền để mình test đầy đủ route Admin, Teacher và Student.
function buildSeedUsers() {
  const createdAt = "2026-06-10T08:00:00.000Z";

  return [
    {
      id: 1,
      fullName: "Quản trị viên EduGuard",
      avatarUrl: "",
      isActive: true,
      createdAt,
      updatedAt: null,
      email: "admin@eduguard.local",
      userName: "admin@eduguard.local",
      role: "Admin",
      // Trường này chỉ tồn tại trong mock frontend để giả lập login trước khi có Identity thật.
      password: "12345678",
    },
    {
      id: 2,
      fullName: "Trần Minh Huy",
      avatarUrl: "",
      isActive: true,
      createdAt,
      updatedAt: null,
      email: "teacher@eduguard.local",
      userName: "teacher@eduguard.local",
      role: "Teacher",
      password: "12345678",
    },
    {
      id: 3,
      fullName: "Nguyễn Hải An",
      avatarUrl: "",
      isActive: true,
      createdAt,
      updatedAt: null,
      email: "student@eduguard.local",
      userName: "student@eduguard.local",
      role: "Student",
      password: "12345678",
    },
    {
      id: 4,
      fullName: "Lê Thu Hà",
      avatarUrl: "",
      isActive: true,
      createdAt,
      updatedAt: null,
      email: "student2@eduguard.local",
      userName: "student2@eduguard.local",
      role: "Student",
      password: "12345678",
    },
    {
      id: 5,
      fullName: "Đỗ Gia Bảo",
      avatarUrl: "",
      isActive: true,
      createdAt,
      updatedAt: null,
      email: "student3@eduguard.local",
      userName: "student3@eduguard.local",
      role: "Student",
      password: "12345678",
    },
  ];
}

// Hàm này dựng bảng classroom seed theo đúng field chính được mô tả trong tài liệu entity.
function buildSeedClassrooms() {
  return [
    {
      id: 1,
      name: "Lập trình Web 2B",
      description: "Lớp thực hành giao diện và tích hợp API cho đồ án EduGuard.",
      joinCode: "WEB2B9",
      teacherId: 2,
      createdAt: "2026-06-10T08:15:00.000Z",
      updatedAt: null,
    },
    {
      id: 2,
      name: "Exam Lab",
      description: "Không gian thử nghiệm luồng tạo đề thi và cấu trúc dữ liệu bài kiểm tra.",
      joinCode: "EXMLAB",
      teacherId: 2,
      createdAt: "2026-06-10T09:00:00.000Z",
      updatedAt: null,
    },
  ];
}

// Hàm này dựng bảng classroom member seed để Student có thể xem thành viên sau khi vào lớp.
function buildSeedClassroomMembers() {
  return [
    {
      id: 1,
      classroomId: 1,
      studentId: 3,
      joinedAt: "2026-06-10T08:30:00.000Z",
      status: "Active",
    },
    {
      id: 2,
      classroomId: 1,
      studentId: 4,
      joinedAt: "2026-06-10T08:40:00.000Z",
      status: "Active",
    },
    {
      id: 3,
      classroomId: 2,
      studentId: 5,
      joinedAt: "2026-06-10T09:10:00.000Z",
      status: "Active",
    },
  ];
}

// Hàm này dựng bảng assignment seed để dashboard teacher và student có dữ liệu tiến độ cơ bản.
function buildSeedAssignments() {
  return [
    {
      id: 1,
      classroomId: 1,
      teacherId: 2,
      title: "Bài tập route bảo vệ",
      description: "Hoàn thiện ProtectedRoute và PublicRoute cho frontend.",
      deadline: "2026-06-18T10:00:00.000Z",
      maxScore: 10,
      createdAt: "2026-06-11T02:00:00.000Z",
    },
    {
      id: 2,
      classroomId: 1,
      teacherId: 2,
      title: "Bài tập form classroom",
      description: "Dựng form tạo lớp và xử lý validate cơ bản.",
      deadline: "2026-06-20T12:00:00.000Z",
      maxScore: 10,
      createdAt: "2026-06-12T03:00:00.000Z",
    },
    {
      id: 3,
      classroomId: 2,
      teacherId: 2,
      title: "Mock exam builder",
      description: "Thiết kế dữ liệu tạo đề thi để chuẩn bị cho giai đoạn tiếp theo.",
      deadline: "2026-06-22T09:00:00.000Z",
      maxScore: 10,
      createdAt: "2026-06-12T08:00:00.000Z",
    },
  ];
}

// Hàm này dựng bảng submission seed để teacher dashboard tính được tỷ lệ nộp bài.
function buildSeedSubmissions() {
  return [
    {
      id: 1,
      assignmentId: 1,
      studentId: 3,
      content: "Đã hoàn thiện route guard và test qua role Student.",
      score: 9,
      feedback: "Flow ổn, cần gọn code hơn một chút.",
      submittedAt: "2026-06-14T03:30:00.000Z",
      gradedAt: "2026-06-14T06:00:00.000Z",
    },
    {
      id: 2,
      assignmentId: 1,
      studentId: 4,
      content: "Đã hoàn thiện route guard và redirect theo role.",
      score: 8.5,
      feedback: "Tốt, cần chú ý comment rõ hơn.",
      submittedAt: "2026-06-14T04:00:00.000Z",
      gradedAt: "2026-06-14T06:10:00.000Z",
    },
    {
      id: 3,
      assignmentId: 3,
      studentId: 5,
      content: "Đã mock cấu trúc dữ liệu exam builder.",
      score: 8.8,
      feedback: "Cấu trúc khá ổn, cần thêm validate.",
      submittedAt: "2026-06-15T02:00:00.000Z",
      gradedAt: "2026-06-15T04:30:00.000Z",
    },
  ];
}

// Hàm này dựng bảng exam seed để dashboard có dữ liệu lịch thi và kết quả thi.
function buildSeedExams() {
  return [
    {
      id: 1,
      classroomId: 1,
      teacherId: 2,
      title: "Quiz CSS Layout",
      description: "Bài kiểm tra ngắn về flexbox, grid và spacing system.",
      durationMinutes: 30,
      startTime: "2026-06-13T01:00:00.000Z",
      endTime: "2026-06-13T01:30:00.000Z",
      isPublished: true,
      enableAntiCheat: true,
      createdAt: "2026-06-12T01:00:00.000Z",
    },
    {
      id: 2,
      classroomId: 1,
      teacherId: 2,
      title: "Kiểm tra giữa kỳ UI",
      description: "Kiểm tra cấu trúc component, form và luồng classroom.",
      durationMinutes: 45,
      startTime: "2026-06-21T01:00:00.000Z",
      endTime: "2026-06-21T01:45:00.000Z",
      isPublished: true,
      enableAntiCheat: true,
      createdAt: "2026-06-15T05:00:00.000Z",
    },
    {
      id: 3,
      classroomId: 2,
      teacherId: 2,
      title: "Quiz API Contract",
      description: "Kiểm tra hiểu biết về response chung và tích hợp frontend.",
      durationMinutes: 25,
      startTime: "2026-06-14T08:00:00.000Z",
      endTime: "2026-06-14T08:25:00.000Z",
      isPublished: true,
      enableAntiCheat: true,
      createdAt: "2026-06-13T04:00:00.000Z",
    },
  ];
}

// Hàm này dựng bảng exam setting seed để đề thi có cấu hình gần với backend thật hơn.
function buildSeedExamSettings() {
  return [
    {
      id: 1,
      examId: 1,
      shuffleQuestions: true,
      shuffleAnswers: true,
      maxAttempts: 1,
      showResultAfterSubmit: true,
      requireFullscreen: true,
    },
    {
      id: 2,
      examId: 2,
      shuffleQuestions: false,
      shuffleAnswers: true,
      maxAttempts: 1,
      showResultAfterSubmit: false,
      requireFullscreen: true,
    },
    {
      id: 3,
      examId: 3,
      shuffleQuestions: true,
      shuffleAnswers: false,
      maxAttempts: 2,
      showResultAfterSubmit: true,
      requireFullscreen: false,
    },
  ];
}

// Hàm này dựng bảng question seed để exam detail có thể hiển thị số câu hỏi đã có.
function buildSeedQuestions() {
  return [
    {
      id: 1,
      examId: 1,
      content: "Thuộc tính nào dùng để tạo khoảng cách giữa các item trong grid/flex?",
      questionType: "SingleChoice",
      score: 2,
      orderIndex: 1,
      createdAt: "2026-06-12T01:05:00.000Z",
    },
    {
      id: 2,
      examId: 1,
      content: "Khi nào nên dùng CSS Grid thay vì Flexbox?",
      questionType: "ShortAnswer",
      score: 3,
      orderIndex: 2,
      createdAt: "2026-06-12T01:07:00.000Z",
    },
    {
      id: 3,
      examId: 2,
      content: "ProtectedRoute dùng để làm gì trong SPA?",
      questionType: "SingleChoice",
      score: 2,
      orderIndex: 1,
      createdAt: "2026-06-15T05:05:00.000Z",
    },
    {
      id: 4,
      examId: 3,
      content: "Response API thành công nên có các field nào?",
      questionType: "MultipleChoice",
      score: 2,
      orderIndex: 1,
      createdAt: "2026-06-13T04:05:00.000Z",
    },
  ];
}

// Hàm này dựng bảng answer seed để dữ liệu exam sát hơn với entity trong docs.
function buildSeedAnswers() {
  return [
    {
      id: 1,
      questionId: 1,
      content: "gap",
      isCorrect: true,
      orderIndex: 1,
    },
    {
      id: 2,
      questionId: 1,
      content: "align-items",
      isCorrect: false,
      orderIndex: 2,
    },
    {
      id: 3,
      questionId: 1,
      content: "object-fit",
      isCorrect: false,
      orderIndex: 3,
    },
    {
      id: 4,
      questionId: 3,
      content: "Chặn route cần đăng nhập và kiểm tra quyền truy cập",
      isCorrect: true,
      orderIndex: 1,
    },
    {
      id: 5,
      questionId: 3,
      content: "Tăng tốc độ render component",
      isCorrect: false,
      orderIndex: 2,
    },
    {
      id: 6,
      questionId: 4,
      content: "success",
      isCorrect: true,
      orderIndex: 1,
    },
    {
      id: 7,
      questionId: 4,
      content: "message",
      isCorrect: true,
      orderIndex: 2,
    },
    {
      id: 8,
      questionId: 4,
      content: "data",
      isCorrect: true,
      orderIndex: 3,
    },
  ];
}

// Hàm này dựng bảng exam attempt seed để teacher/student dashboard có dữ liệu điểm và suspicion.
function buildSeedExamAttempts() {
  return [
    {
      id: 1,
      examId: 1,
      studentId: 3,
      startedAt: "2026-06-13T01:00:00.000Z",
      submittedAt: "2026-06-13T01:24:00.000Z",
      score: 8.5,
      suspicionScore: 4,
      status: "Submitted",
    },
    {
      id: 2,
      examId: 1,
      studentId: 4,
      startedAt: "2026-06-13T01:02:00.000Z",
      submittedAt: "2026-06-13T01:27:00.000Z",
      score: 6.8,
      suspicionScore: 15,
      status: "Submitted",
    },
    {
      id: 3,
      examId: 3,
      studentId: 5,
      startedAt: "2026-06-14T08:01:00.000Z",
      submittedAt: "2026-06-14T08:20:00.000Z",
      score: 9.2,
      suspicionScore: 2,
      status: "Submitted",
    },
  ];
}

// Hàm này dựng bảng cheating log seed để teacher dashboard có danh sách rủi ro cao.
function buildSeedCheatingLogs() {
  return [
    {
      id: 1,
      examAttemptId: 2,
      type: "TAB_SWITCH",
      description: "Học sinh rời khỏi tab trong lúc làm bài.",
      suspicionPoint: 5,
      metadata: null,
      occurredAt: "2026-06-13T01:10:00.000Z",
    },
    {
      id: 2,
      examAttemptId: 2,
      type: "COPY_PASTE",
      description: "Phát hiện thao tác copy/paste trong lúc làm bài.",
      suspicionPoint: 10,
      metadata: null,
      occurredAt: "2026-06-13T01:18:00.000Z",
    },
    {
      id: 3,
      examAttemptId: 1,
      type: "WINDOW_BLUR",
      description: "Cửa sổ trình duyệt mất focus trong thời gian ngắn.",
      suspicionPoint: 4,
      metadata: null,
      occurredAt: "2026-06-13T01:12:00.000Z",
    },
  ];
}

// Hàm này dựng notification seed để dashboard student có phần nhắc việc và lịch gần nhất.
function buildSeedNotifications() {
  return [
    {
      id: 1,
      userId: 3,
      title: "Nhắc hạn nộp bài",
      message: "Bài tập form classroom sẽ hết hạn vào 20/06.",
      type: "AssignmentDeadline",
      isRead: false,
      createdAt: "2026-06-16T03:00:00.000Z",
    },
    {
      id: 2,
      userId: 3,
      title: "Lịch thi mới",
      message: "Kiểm tra giữa kỳ UI sẽ mở vào 21/06.",
      type: "ExamSchedule",
      isRead: false,
      createdAt: "2026-06-16T08:00:00.000Z",
    },
    {
      id: 3,
      userId: 4,
      title: "Cần lưu ý anti-cheat",
      message: "Bài quiz gần nhất của bạn có điểm nghi ngờ cao.",
      type: "AntiCheatWarning",
      isRead: true,
      createdAt: "2026-06-14T09:30:00.000Z",
    },
    {
      id: 4,
      userId: 5,
      title: "Đã chấm điểm",
      message: "Bài quiz API Contract đã có kết quả.",
      type: "ResultAvailable",
      isRead: false,
      createdAt: "2026-06-15T05:30:00.000Z",
    },
  ];
}

// Hàm này dựng activity log seed để admin dashboard có timeline ban đầu ngay cả khi chưa có thao tác mới.
function buildSeedActivityLogs() {
  return [
    {
      id: 1,
      userId: 2,
      action: "CLASSROOM_CREATE",
      description: "Giảng viên teacher@eduguard.local tạo lớp Lập trình Web 2B.",
      ipAddress: null,
      userAgent: "Seeded activity",
      createdAt: "2026-06-10T08:15:00.000Z",
    },
    {
      id: 2,
      userId: 3,
      action: "CLASSROOM_JOIN",
      description: "Học sinh student@eduguard.local tham gia lớp Lập trình Web 2B.",
      ipAddress: null,
      userAgent: "Seeded activity",
      createdAt: "2026-06-10T08:30:00.000Z",
    },
    {
      id: 3,
      userId: 2,
      action: "EXAM_PUBLISH",
      description: "Giảng viên teacher@eduguard.local công bố bài kiểm tra giữa kỳ UI.",
      ipAddress: null,
      userAgent: "Seeded activity",
      createdAt: "2026-06-15T05:10:00.000Z",
    },
  ];
}

// Hàm này tạo toàn bộ mock database ban đầu để app có cảm giác như đang đọc từ DB thật.
function buildSeedDatabase() {
  return {
    version: MOCK_DATABASE_VERSION,
    users: buildSeedUsers(),
    classrooms: buildSeedClassrooms(),
    classroomMembers: buildSeedClassroomMembers(),
    assignments: buildSeedAssignments(),
    submissions: buildSeedSubmissions(),
    exams: buildSeedExams(),
    examSettings: buildSeedExamSettings(),
    questions: buildSeedQuestions(),
    answers: buildSeedAnswers(),
    examAttempts: buildSeedExamAttempts(),
    cheatingLogs: buildSeedCheatingLogs(),
    refreshTokens: [],
    notifications: buildSeedNotifications(),
    activityLogs: buildSeedActivityLogs(),
  };
}

// Hàm này kiểm tra nhanh cấu trúc database đọc từ localStorage có còn hợp lệ không.
function isValidDatabaseShape(database) {
  return Boolean(
    database &&
      Array.isArray(database.users) &&
      Array.isArray(database.classrooms) &&
      Array.isArray(database.classroomMembers) &&
      Array.isArray(database.refreshTokens) &&
      Array.isArray(database.activityLogs),
  );
}

// Hàm này thêm các bảng còn thiếu cho localStorage cũ để mình mở rộng mock DB mà không phải reset sạch.
function ensureDatabaseSchema(database) {
  const previousVersion = Number(database.version) || 0;
  const hasSeededNotifications = Array.isArray(database.notifications) && database.notifications.length > 0;
  const hasSeededActivities = Array.isArray(database.activityLogs) && database.activityLogs.length > 0;

  return {
    version: MOCK_DATABASE_VERSION,
    users: Array.isArray(database.users) ? database.users : buildSeedUsers(),
    classrooms: Array.isArray(database.classrooms) ? database.classrooms : buildSeedClassrooms(),
    classroomMembers: Array.isArray(database.classroomMembers)
      ? database.classroomMembers
      : buildSeedClassroomMembers(),
    assignments: Array.isArray(database.assignments) ? database.assignments : buildSeedAssignments(),
    submissions: Array.isArray(database.submissions) ? database.submissions : buildSeedSubmissions(),
    exams: Array.isArray(database.exams) ? database.exams : buildSeedExams(),
    examSettings: Array.isArray(database.examSettings)
      ? database.examSettings
      : buildSeedExamSettings(),
    questions: Array.isArray(database.questions) ? database.questions : buildSeedQuestions(),
    answers: Array.isArray(database.answers) ? database.answers : buildSeedAnswers(),
    examAttempts: Array.isArray(database.examAttempts)
      ? database.examAttempts
      : buildSeedExamAttempts(),
    cheatingLogs: Array.isArray(database.cheatingLogs)
      ? database.cheatingLogs
      : buildSeedCheatingLogs(),
    refreshTokens: Array.isArray(database.refreshTokens) ? database.refreshTokens : [],
    notifications:
      Array.isArray(database.notifications) && (hasSeededNotifications || previousVersion >= MOCK_DATABASE_VERSION)
        ? database.notifications
        : buildSeedNotifications(),
    activityLogs:
      Array.isArray(database.activityLogs) && (hasSeededActivities || previousVersion >= MOCK_DATABASE_VERSION)
        ? database.activityLogs
        : buildSeedActivityLogs(),
  };
}

// Hàm này đọc mock database từ localStorage, nếu lỗi thì tự seed lại để app không bị văng.
export function readMockDatabase() {
  try {
    const rawValue = window.localStorage.getItem(MOCK_DATABASE_STORAGE_KEY);

    if (!rawValue) {
      const seededDatabase = buildSeedDatabase();
      writeMockDatabase(seededDatabase);
      return seededDatabase;
    }

    const parsedDatabase = JSON.parse(rawValue);

    if (!isValidDatabaseShape(parsedDatabase)) {
      const seededDatabase = buildSeedDatabase();
      writeMockDatabase(seededDatabase);
      return seededDatabase;
    }

    const normalizedDatabase = ensureDatabaseSchema(parsedDatabase);
    writeMockDatabase(normalizedDatabase);
    return normalizedDatabase;
  } catch {
    const seededDatabase = buildSeedDatabase();
    writeMockDatabase(seededDatabase);
    return seededDatabase;
  }
}

// Hàm này lưu mock database mới xuống máy sau mỗi thao tác create, update hoặc delete.
export function writeMockDatabase(database) {
  window.localStorage.setItem(MOCK_DATABASE_STORAGE_KEY, JSON.stringify(database));
}

// Hàm này bọc response theo format chung trong docs để code frontend giống gọi backend thật.
export function buildApiResponse({ success = true, message = "", data = null, errors = [] }) {
  return {
    success,
    message,
    data,
    errors,
  };
}

// Hàm này tạo object lỗi có status và message để page phía trên xử lý cho dễ.
export function createApiError(message, status = 400, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

// Hàm này giả lập độ trễ mạng ngắn để cảm giác thao tác gần với request API hơn.
export function executeMockRequest(handler) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(handler());
      } catch (error) {
        reject(error);
      }
    }, MOCK_API_DELAY_MS);
  });
}

// Hàm này tìm id lớn nhất hiện có rồi cộng thêm 1 để mô phỏng identity int trong database.
export function getNextNumericId(items) {
  return items.reduce((maxValue, item) => Math.max(maxValue, Number(item.id) || 0), 0) + 1;
}

// Hàm này chuẩn hóa email để so sánh login và kiểm tra trùng dữ liệu ổn định hơn.
export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Hàm này lấy thông tin user gọn gàng theo kiểu DTO thay vì lộ cả password mock ra ngoài.
export function toUserDto(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    role: user.role,
  };
}

// Hàm này tạo user cầu nối trong mock DB khi frontend đã đăng nhập bằng backend thật nhưng chưa có dữ liệu mock tương ứng.
function buildShadowUserFromSession(database, storedUser) {
  const normalizedEmail = normalizeEmail(storedUser.email ?? "");
  const preferredUserId = Number(storedUser.id) || getNextNumericId(database.users);
  const nextUserId = database.users.some((user) => user.id === preferredUserId)
    ? getNextNumericId(database.users)
    : preferredUserId;

  return {
    id: nextUserId,
    fullName: storedUser.fullName?.trim() || normalizedEmail || "Người dùng EduGuard",
    avatarUrl: storedUser.avatarUrl?.trim?.() || "",
    isActive: storedUser.isActive ?? true,
    createdAt: storedUser.createdAt || getNowIsoString(),
    updatedAt: storedUser.updatedAt ?? null,
    email: normalizedEmail,
    userName: normalizedEmail,
    role: storedUser.role || "Student",
    password: "",
  };
}

// Hàm này áp role và thông tin mới nhất từ session backend vào user mock đã có cùng id/email.
function applyStoredUserSnapshot(targetUser, storedUser) {
  targetUser.fullName = storedUser.fullName?.trim() || targetUser.fullName;
  targetUser.avatarUrl = storedUser.avatarUrl?.trim?.() || targetUser.avatarUrl;
  targetUser.isActive = storedUser.isActive ?? targetUser.isActive;
  targetUser.role = storedUser.role || targetUser.role;
  targetUser.updatedAt = getNowIsoString();

  if (storedUser.email) {
    const normalizedEmail = normalizeEmail(storedUser.email);
    targetUser.email = normalizedEmail;
    targetUser.userName = normalizedEmail;
  }

  return targetUser;
}

// Hàm này đồng bộ user trong session sang mock DB để các module chưa nối backend vẫn dùng tiếp được.
function syncStoredUserIntoMockDatabase(database, storedUser) {
  const matchedById = database.users.find((user) => user.id === storedUser.id);

  if (matchedById) {
    applyStoredUserSnapshot(matchedById, storedUser);
    writeMockDatabase(database);

    return matchedById;
  }

  const normalizedEmail = storedUser.email ? normalizeEmail(storedUser.email) : "";

  if (normalizedEmail) {
    const matchedByEmail = database.users.find(
      (user) => normalizeEmail(user.email) === normalizedEmail,
    );

    if (matchedByEmail) {
      applyStoredUserSnapshot(matchedByEmail, storedUser);
      writeMockDatabase(database);

      return matchedByEmail;
    }
  }

  const shadowUser = buildShadowUserFromSession(database, storedUser);
  database.users.push(shadowUser);
  writeMockDatabase(database);

  return shadowUser;
}

// Hàm này lấy user đang đăng nhập từ session localStorage và tự nối sang mock DB khi cần.
export function getCurrentStoredUser(database) {
  const storedUser = getStoredUser();

  if (!storedUser) {
    return null;
  }

  return syncStoredUserIntoMockDatabase(database, storedUser);
}

// Hàm này chặn mọi request protected khi session hiện tại không còn hợp lệ.
export function requireCurrentUser(database) {
  const currentUser = getCurrentStoredUser(database);

  if (!currentUser) {
    throw createApiError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
  }

  if (!currentUser.isActive) {
    throw createApiError("Tài khoản hiện đang bị khóa.", 403);
  }

  return currentUser;
}

// Hàm này đổi vai trò kỹ thuật sang nhãn tiếng Việt để danh sách thành viên dễ đọc hơn.
function getRoleDisplayName(role) {
  if (role === "Teacher") {
    return "Giáo viên";
  }

  if (role === "Admin") {
    return "Quản trị viên";
  }

  return "Học sinh";
}

// Hàm này tạo mã lớp ngẫu nhiên và tránh đụng với các lớp đang có trong mock database.
export function generateUniqueJoinCode(classrooms) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let nextCode = "";

  do {
    nextCode = Array.from({ length: 6 }, () => {
      const randomIndex = Math.floor(Math.random() * characters.length);
      return characters[randomIndex];
    }).join("");
  } while (classrooms.some((classroom) => classroom.joinCode === nextCode));

  return nextCode;
}

// Hàm này ghi lại activity log cơ bản để sau này muốn dựng audit trail sẽ có dữ liệu nền.
export function appendActivityLog(database, { userId, action, description }) {
  database.activityLogs.unshift({
    id: getNextNumericId(database.activityLogs),
    userId: userId ?? null,
    action,
    description,
    ipAddress: null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    createdAt: getNowIsoString(),
  });
}

// Hàm này tạo access token mock chỉ để giữ hình dạng gần giống luồng JWT trong docs.
function buildAccessToken(user) {
  return `mock-access-token-${user.id}-${Date.now()}`;
}

// Hàm này tạo refresh token mock rồi lưu vào bảng refreshTokens như backend thật sẽ làm.
export function issueRefreshToken(database, userId) {
  const refreshToken = `mock-refresh-token-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  database.refreshTokens.push({
    id: getNextNumericId(database.refreshTokens),
    userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: getNowIsoString(),
    revokedAt: null,
    isRevoked: false,
  });

  return refreshToken;
}

// Hàm này thu hồi refresh token đang dùng khi user đăng xuất hoặc đổi phiên.
export function revokeRefreshToken(database, refreshToken) {
  if (!refreshToken) {
    return;
  }

  const matchedToken = database.refreshTokens.find((tokenItem) => tokenItem.token === refreshToken);

  if (!matchedToken || matchedToken.isRevoked) {
    return;
  }

  matchedToken.isRevoked = true;
  matchedToken.revokedAt = getNowIsoString();
}

// Hàm này gộp teacher và student thành danh sách thành viên mà UI có thể hiển thị trực tiếp.
export function buildClassroomMembers(classroom, database) {
  const teacher = database.users.find((user) => user.id === classroom.teacherId);
  const activeMembers = database.classroomMembers
    .filter((member) => member.classroomId === classroom.id && member.status === "Active")
    .map((member) => {
      const student = database.users.find((user) => user.id === member.studentId);

      if (!student) {
        return null;
      }

      return {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        avatarUrl: student.avatarUrl,
        joinedAt: member.joinedAt,
        status: member.status,
        role: getRoleDisplayName(student.role),
      };
    })
    .filter(Boolean)
    .sort((firstMember, secondMember) => {
      return firstMember.fullName.localeCompare(secondMember.fullName, "vi");
    });

  if (!teacher) {
    return activeMembers;
  }

  return [
    {
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
      avatarUrl: teacher.avatarUrl,
      joinedAt: classroom.createdAt,
      status: "Owner",
      role: getRoleDisplayName(teacher.role),
    },
    ...activeMembers,
  ];
}

// Hàm này kiểm tra người dùng hiện tại có quyền xem classroom cụ thể hay không.
export function canUserViewClassroom(currentUser, classroom, database) {
  if (currentUser.role === "Admin") {
    return true;
  }

  if (currentUser.role === "Teacher") {
    return classroom.teacherId === currentUser.id;
  }

  return database.classroomMembers.some(
    (member) =>
      member.classroomId === classroom.id &&
      member.studentId === currentUser.id &&
      member.status === "Active",
  );
}

// Hàm này dựng DTO classroom để page chỉ việc render mà không phải tự nối quan hệ thủ công.
export function toClassroomDto(classroom, database, currentUser) {
  const teacher = database.users.find((user) => user.id === classroom.teacherId);
  const members = buildClassroomMembers(classroom, database);
  const isJoined =
    currentUser?.role === "Student"
      ? database.classroomMembers.some(
          (member) =>
            member.classroomId === classroom.id &&
            member.studentId === currentUser.id &&
            member.status === "Active",
        )
      : false;

  return {
    id: classroom.id,
    name: classroom.name,
    description: classroom.description,
    joinCode: classroom.joinCode,
    teacherId: classroom.teacherId,
    teacherName: teacher?.fullName ?? "Chưa rõ giáo viên",
    createdAt: classroom.createdAt,
    updatedAt: classroom.updatedAt,
    memberCount: members.length,
    members,
    isJoined,
    canEdit: currentUser?.role === "Teacher" && currentUser.id === classroom.teacherId,
    canDelete: currentUser?.role === "Teacher" && currentUser.id === classroom.teacherId,
  };
}

// Hàm này lấy ra danh sách classroom đúng với quyền của từng role đang đăng nhập.
export function getVisibleClassrooms(database, currentUser) {
  const classroomItems = database.classrooms
    .filter((classroom) => canUserViewClassroom(currentUser, classroom, database))
    .sort((firstClassroom, secondClassroom) => {
      return new Date(secondClassroom.createdAt) - new Date(firstClassroom.createdAt);
    });

  return classroomItems.map((classroom) => toClassroomDto(classroom, database, currentUser));
}

// Hàm này lấy classroom theo id và chặn luôn các trường hợp user xem lớp không đúng quyền.
export function getAccessibleClassroomById(database, currentUser, classroomId) {
  const numericId = Number(classroomId);
  const classroom = database.classrooms.find((item) => item.id === numericId);

  if (!classroom) {
    throw createApiError("Không tìm thấy lớp học.", 404);
  }

  if (!canUserViewClassroom(currentUser, classroom, database)) {
    throw createApiError("Bạn không có quyền xem lớp học này.", 403);
  }

  return classroom;
}

// Hàm này đổi refresh token cũ sang token mới để mô phỏng flow rotate token cơ bản.
export function rotateRefreshToken(database, currentRefreshToken) {
  const matchedToken = database.refreshTokens.find(
    (tokenItem) => tokenItem.token === currentRefreshToken,
  );

  if (!matchedToken || matchedToken.isRevoked) {
    throw createApiError("Refresh token không hợp lệ.", 401);
  }

  if (new Date(matchedToken.expiresAt).getTime() < Date.now()) {
    matchedToken.isRevoked = true;
    matchedToken.revokedAt = getNowIsoString();
    throw createApiError("Refresh token đã hết hạn.", 401);
  }

  matchedToken.isRevoked = true;
  matchedToken.revokedAt = getNowIsoString();

  return issueRefreshToken(database, matchedToken.userId);
}

// Hàm này trả access token mới từ refresh token hiện tại để giữ nguyên contract API auth.
export function buildRefreshResponse(database, currentRefreshToken) {
  const nextRefreshToken = rotateRefreshToken(database, currentRefreshToken);
  const tokenRecord = database.refreshTokens.find((tokenItem) => tokenItem.token === nextRefreshToken);
  const user = database.users.find((userItem) => userItem.id === tokenRecord?.userId);

  if (!user) {
    throw createApiError("Không tìm thấy người dùng của refresh token.", 404);
  }

  return buildApiResponse({
    message: "Làm mới token thành công.",
    data: {
      accessToken: buildAccessToken(user),
      refreshToken: nextRefreshToken,
      user: toUserDto(user),
    },
  });
}

// Hàm này trả về refresh token đang được lưu trong session hiện tại để logout thuận tiện hơn.
export function getCurrentStoredRefreshToken() {
  return getStoredRefreshToken();
}

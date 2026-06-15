import { getStoredUser } from "../utils/tokenStorage";

export const QUESTION_TYPE_VALUE_BY_CODE = {
  1: "SingleChoice",
  2: "MultipleChoice",
  3: "TrueFalse",
  4: "ShortAnswer",
};

export const QUESTION_TYPE_CODE_BY_VALUE = Object.entries(QUESTION_TYPE_VALUE_BY_CODE).reduce(
  (accumulator, [code, value]) => ({
    ...accumulator,
    [value]: Number(code),
  }),
  {},
);

export const EXAM_ATTEMPT_STATUS_VALUE_BY_CODE = {
  1: "InProgress",
  2: "Submitted",
};

// Hàm này đổi response envelope chuẩn của backend thành object gọn để frontend dùng thống nhất.
export function unwrapApiResponse(response) {
  const apiResponse = response?.data;

  if (!apiResponse?.success) {
    throw new Error(apiResponse?.message || "Yêu cầu không thành công.");
  }

  return apiResponse;
}

// Hàm này gom message lỗi từ axios/backend để toast trên UI luôn hiển thị dễ hiểu.
export function buildClientError(error) {
  if (error instanceof Error && typeof error.status !== "undefined") {
    return error;
  }

  const message =
    error.response?.data?.message ||
    error.response?.data?.title ||
    error.message ||
    "Đã có lỗi xảy ra trong lúc gọi API.";
  const nextError = new Error(message);

  nextError.status = error.response?.status;
  nextError.details = Array.isArray(error.response?.data?.errors) ? error.response.data.errors : [];
  return nextError;
}

// Hàm này bọc lời gọi axios để mọi API module đều xử lý lỗi theo một chuẩn chung.
export async function requestApi(requestFactory) {
  try {
    const response = await requestFactory();
    return unwrapApiResponse(response);
  } catch (error) {
    throw buildClientError(error);
  }
}

// Hàm này đọc user hiện tại từ session local để adapter phía FE biết role và quyền hiển thị.
export function getCurrentSessionUser() {
  return getStoredUser();
}

// Hàm này kiểm tra user hiện tại có thuộc một trong các role yêu cầu hay không.
export function hasAnyRole(user, roles = []) {
  if (!user || roles.length === 0) {
    return false;
  }

  return roles.includes(user.role);
}

// Hàm này suy ra trạng thái đề thi từ publish flag và mốc thời gian để UI không tự lặp logic.
export function buildExamStatusLabel(exam) {
  if (!exam?.isPublished) {
    return "Bản nháp";
  }

  const now = Date.now();
  const startTime = exam.startTime ? new Date(exam.startTime).getTime() : null;
  const endTime = exam.endTime ? new Date(exam.endTime).getTime() : null;

  if (startTime && now < startTime) {
    return "Sắp mở";
  }

  if (startTime && endTime && now >= startTime && now <= endTime) {
    return "Đang mở";
  }

  if (endTime && now > endTime) {
    return "Đã đóng";
  }

  return "Đang hiển thị";
}

// Hàm này đổi enum question type từ backend về giá trị string mà UI form và badge đang dùng.
export function normalizeQuestionType(questionType) {
  if (typeof questionType === "string" && QUESTION_TYPE_CODE_BY_VALUE[questionType]) {
    return questionType;
  }

  return QUESTION_TYPE_VALUE_BY_CODE[Number(questionType)] ?? "SingleChoice";
}

// Hàm này đổi question type string ở frontend về mã enum số mà backend ASP.NET đang nhận.
export function toQuestionTypeCode(questionType) {
  if (typeof questionType === "number") {
    return questionType;
  }

  return QUESTION_TYPE_CODE_BY_VALUE[questionType] ?? QUESTION_TYPE_CODE_BY_VALUE.SingleChoice;
}

// Hàm này đổi status của attempt về chuỗi dễ đọc để FE dùng ổn định dù backend trả enum số.
export function normalizeAttemptStatus(status) {
  if (typeof status === "string" && status.length > 0) {
    return status;
  }

  return EXAM_ATTEMPT_STATUS_VALUE_BY_CODE[Number(status)] ?? "InProgress";
}

// Hàm này làm tròn điểm trung bình về 1 chữ số thập phân để hiển thị gọn hơn.
export function roundToOneDecimal(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

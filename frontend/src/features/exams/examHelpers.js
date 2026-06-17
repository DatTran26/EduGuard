import { parseDateValue } from "../../utils/formatDate";

export const QUESTION_TYPE_OPTIONS = [
  { label: "Một đáp án", value: "SingleChoice" },
  { label: "Nhiều đáp án", value: "MultipleChoice" },
  { label: "Đúng / Sai", value: "TrueFalse" },
  { label: "Tự luận ngắn", value: "ShortAnswer" },
];

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_UTC_OFFSET_MINUTES = 7 * 60;

const vietnamDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VIETNAM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function buildDateTimeLocalValue(parts) {
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function formatVietnamDateTimeParts(value) {
  if (!value) {
    return null;
  }

  const dateObject = parseDateValue(value);

  if (!dateObject) {
    return null;
  }

  const partLookup = {};

  vietnamDateTimeFormatter.formatToParts(dateObject).forEach((part) => {
    if (part.type !== "literal") {
      partLookup[part.type] = part.value;
    }
  });

  return {
    year: partLookup.year,
    month: partLookup.month,
    day: partLookup.day,
    hour: partLookup.hour,
    minute: partLookup.minute,
  };
}

function parseDateTimeLocalInputValue(value) {
  const matchedParts = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!matchedParts) {
    return null;
  }

  const [, year, month, day, hour, minute] = matchedParts;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

function createUtcDateFromVietnamInputValue(value) {
  const parsedValue = parseDateTimeLocalInputValue(value);

  if (!parsedValue) {
    return null;
  }

  const utcTime =
    Date.UTC(
      parsedValue.year,
      parsedValue.month - 1,
      parsedValue.day,
      parsedValue.hour,
      parsedValue.minute,
    ) -
    VIETNAM_UTC_OFFSET_MINUTES * 60 * 1000;

  return new Date(utcTime);
}

// Hàm này đổi status đề thi sang màu badge để danh sách và trang chi tiết nhìn thống nhất hơn.
export function getExamStatusVariant(statusLabel) {
  if (statusLabel === "Bản nháp") {
    return "neutral";
  }

  if (statusLabel === "Sắp mở") {
    return "caution";
  }

  if (statusLabel === "Đang mở") {
    return "success";
  }

  if (statusLabel === "Đã đóng") {
    return "danger";
  }

  return "info";
}

// Hàm này đổi mã loại câu hỏi sang nhãn tiếng Việt để card câu hỏi nhìn dễ hiểu hơn.
export function getQuestionTypeLabel(questionType) {
  const matchedOption = QUESTION_TYPE_OPTIONS.find((option) => option.value === questionType);
  return matchedOption?.label ?? "Loại câu hỏi khác";
}

// Hàm này đổi chuỗi ISO sang format `datetime-local` cố định theo giờ Việt Nam để teacher không bị lệch múi giờ.
export function toDateTimeLocalInputValue(value) {
  const parts = formatVietnamDateTimeParts(value);
  return parts ? buildDateTimeLocalValue(parts) : "";
}

// Hàm này đổi giá trị `datetime-local` theo giờ Việt Nam về ISO UTC để payload gửi backend không phụ thuộc timezone máy local.
export function toVietnamISOString(value) {
  const utcDate = createUtcDateFromVietnamInputValue(value);
  return utcDate ? utcDate.toISOString() : null;
}

// Hàm này tự suy ra giờ đóng đề mặc định = giờ mở đề + thời gian làm bài, vẫn giữ chuẩn giờ Việt Nam trong form.
export function calculateEndTimeInputValue(startTimeValue, durationMinutesValue) {
  const durationMinutes = Number(durationMinutesValue);

  if (!startTimeValue || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return "";
  }

  const startUtcDate = createUtcDateFromVietnamInputValue(startTimeValue);

  if (!startUtcDate) {
    return "";
  }

  const endDate = new Date(startUtcDate.getTime() + durationMinutes * 60 * 1000);
  return toDateTimeLocalInputValue(endDate);
}

// Hàm này nhận biết một đề đã có giờ đóng đề chỉnh tay hay chưa để form không tự ghi đè mất cấu hình của giảng viên.
export function hasCustomEndTimeOverride(startTimeValue, durationMinutesValue, endTimeValue) {
  if (!endTimeValue) {
    return false;
  }

  const expectedEndTimeValue = calculateEndTimeInputValue(startTimeValue, durationMinutesValue);

  if (!expectedEndTimeValue) {
    return true;
  }

  return endTimeValue !== expectedEndTimeValue;
}

export function hasCustomEndTimeForExam(exam) {
  return hasCustomEndTimeOverride(
    toDateTimeLocalInputValue(exam?.startTime),
    exam?.durationMinutes,
    toDateTimeLocalInputValue(exam?.endTime),
  );
}

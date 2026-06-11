export const QUESTION_TYPE_OPTIONS = [
  { label: "Một đáp án", value: "SingleChoice" },
  { label: "Nhiều đáp án", value: "MultipleChoice" },
  { label: "Đúng / Sai", value: "TrueFalse" },
  { label: "Tự luận ngắn", value: "ShortAnswer" },
];

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

// Hàm này đổi chuỗi ISO sang format `datetime-local` để input lịch thời gian dùng được.
export function toDateTimeLocalInputValue(value) {
  if (!value) {
    return "";
  }

  const dateObject = new Date(value);

  if (Number.isNaN(dateObject.getTime())) {
    return "";
  }

  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const day = String(dateObject.getDate()).padStart(2, "0");
  const hours = String(dateObject.getHours()).padStart(2, "0");
  const minutes = String(dateObject.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

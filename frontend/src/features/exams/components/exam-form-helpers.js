import {
  calculateEndTimeInputValue as calculateVietnamEndTimeInputValue,
  hasCustomEndTimeForExam,
  toDateTimeLocalInputValue,
  toVietnamISOString,
} from "../examHelpers";

/**
 * Calculates the end time based on start time and duration.
 * @param {string} startTimeValue
 * @param {number|string} durationMinutesValue
 * @returns {string} ISO date string formatted for datetime-local
 */
export function calculateEndTimeInputValue(startTimeValue, durationMinutesValue) {
  return calculateVietnamEndTimeInputValue(startTimeValue, durationMinutesValue);
}

/**
 * Builds initial form values from an exam object or defaults.
 * @param {object|null} exam
 * @param {string|number} defaultClassroomId
 * @returns {object} Initial form state values
 */
export function buildExamFormValues(exam, defaultClassroomId = "") {
  return {
    classroomId: exam?.classroomId ? String(exam.classroomId) : String(defaultClassroomId || ""),
    description: exam?.description ?? "",
    durationMinutes: exam?.durationMinutes ? String(exam.durationMinutes) : "30",
    enableAntiCheat: Boolean(exam?.enableAntiCheat),
    endTime: toDateTimeLocalInputValue(exam?.endTime),
    settings: {
      maxAttempts: exam?.settings?.maxAttempts ? String(exam.settings.maxAttempts) : "1",
      requireFullscreen: Boolean(exam?.settings?.requireFullscreen),
      showResultAfterSubmit: Boolean(exam?.settings?.showResultAfterSubmit),
      shuffleAnswers: Boolean(exam?.settings?.shuffleAnswers),
      shuffleQuestions: Boolean(exam?.settings?.shuffleQuestions),
    },
    startTime: toDateTimeLocalInputValue(exam?.startTime),
    title: exam?.title ?? "",
  };
}

// Hàm này gom các validate FE cơ bản để teacher thấy lỗi trước khi request lên backend.
export function validateExamFormValues(formValues) {
  const nextErrors = {};
  const durationMinutes = Number(formValues?.durationMinutes);
  const maxAttempts = Number(formValues?.settings?.maxAttempts);
  const title = String(formValues?.title ?? "").trim();
  const expectedEndTimeValue = calculateEndTimeInputValue(
    formValues?.startTime,
    formValues?.durationMinutes,
  );

  if (!Number(formValues?.classroomId)) {
    nextErrors.classroomId = "Vui lòng chọn lớp học cho bài kiểm tra.";
  }

  if (!title) {
    nextErrors.title = "Vui lòng nhập tiêu đề bài kiểm tra.";
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    nextErrors.durationMinutes = "Thời gian làm bài phải lớn hơn 0 phút.";
  }

  if (!Number.isFinite(maxAttempts) || maxAttempts <= 0) {
    nextErrors.maxAttempts = "Số lần làm tối đa phải lớn hơn 0.";
  }

  if (formValues?.startTime && formValues?.endTime) {
    const startTimeIso = toVietnamISOString(formValues.startTime);
    const endTimeIso = toVietnamISOString(formValues.endTime);

    if (startTimeIso && endTimeIso && new Date(endTimeIso) <= new Date(startTimeIso)) {
      nextErrors.endTime = "Thời gian đóng đề phải sau thời gian mở đề.";
    }
  }

  if (
    !nextErrors.endTime &&
    formValues?.endTime &&
    expectedEndTimeValue &&
    formValues.endTime < expectedEndTimeValue
  ) {
    nextErrors.endTime =
      "Giờ đóng đề phải lớn hơn hoặc bằng giờ mở đề + thời gian làm bài. Nếu muốn cho sinh viên thêm thời gian, hãy đặt muộn hơn mốc tự động.";
  }

  return nextErrors;
}

/**
 * Formats the form state values into the API payload format.
 * @param {object} formValues
 * @returns {object} API payload
 */
export function buildSubmitPayload(formValues) {
  return {
    classroomId: Number(formValues.classroomId),
    description: formValues.description.trim(),
    durationMinutes: Number(formValues.durationMinutes),
    enableAntiCheat: Boolean(formValues.enableAntiCheat),
    endTime: toVietnamISOString(formValues.endTime),
    settings: {
      maxAttempts: Number(formValues.settings.maxAttempts),
      requireFullscreen: Boolean(formValues.settings.requireFullscreen),
      showResultAfterSubmit: Boolean(formValues.settings.showResultAfterSubmit),
      shuffleAnswers: Boolean(formValues.settings.shuffleAnswers),
      shuffleQuestions: Boolean(formValues.settings.shuffleQuestions),
    },
    startTime: toVietnamISOString(formValues.startTime),
    title: formValues.title.trim(),
  };
}

export { hasCustomEndTimeForExam };
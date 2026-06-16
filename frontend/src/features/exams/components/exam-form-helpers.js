import { toDateTimeLocalInputValue } from "../examHelpers";

/**
 * Calculates the end time based on start time and duration.
 * @param {string} startTimeValue 
 * @param {number|string} durationMinutesValue 
 * @returns {string} ISO date string formatted for datetime-local
 */
export function calculateEndTimeInputValue(startTimeValue, durationMinutesValue) {
  const durationMinutes = Number(durationMinutesValue);

  if (!startTimeValue || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return "";
  }

  const startDate = new Date(startTimeValue);

  if (Number.isNaN(startDate.getTime())) {
    return "";
  }

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return toDateTimeLocalInputValue(endDate);
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
    isPublished: Boolean(exam?.isPublished),
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

/**
 * Formats the form state values into the API payload format.
 * @param {object} formValues 
 * @param {object|null} exam 
 * @returns {object} API payload
 */
export function buildSubmitPayload(formValues, exam) {
  const shouldPublishAfterSave = Boolean(formValues.isPublished) && (!exam || !exam.isPublished);

  return {
    classroomId: Number(formValues.classroomId),
    description: formValues.description.trim(),
    durationMinutes: Number(formValues.durationMinutes),
    enableAntiCheat: Boolean(formValues.enableAntiCheat),
    endTime: formValues.endTime ? new Date(formValues.endTime).toISOString() : null,
    isPublished: shouldPublishAfterSave,
    settings: {
      maxAttempts: Number(formValues.settings.maxAttempts),
      requireFullscreen: Boolean(formValues.settings.requireFullscreen),
      showResultAfterSubmit: Boolean(formValues.settings.showResultAfterSubmit),
      shuffleAnswers: Boolean(formValues.settings.shuffleAnswers),
      shuffleQuestions: Boolean(formValues.settings.shuffleQuestions),
    },
    startTime: formValues.startTime ? new Date(formValues.startTime).toISOString() : null,
    title: formValues.title.trim(),
  };
}

import axiosClient from "./axiosClient";
import { requestApi } from "./apiHelpers";

// INTEGRATION STATUS:
// - File này đã map sẵn toàn bộ assignment endpoints thật của backend.
// - UI assignment theo lớp chưa được dựng ở FE, nhưng API client đã sẵn để nối màn hình kế tiếp.

function normalizeAssignmentDto(assignment) {
  return {
    id: Number(assignment?.id) || 0,
    classroomId: Number(assignment?.classroomId) || 0,
    teacherId: Number(assignment?.teacherId) || 0,
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    deadline: assignment?.deadline ?? null,
    maxScore: Number(assignment?.maxScore) || 0,
    createdAt: assignment?.createdAt ?? null,
    submissionCount: Number(assignment?.submissionCount) || 0,
  };
}

function normalizeSubmissionDto(submission) {
  return {
    id: Number(submission?.id) || 0,
    assignmentId: Number(submission?.assignmentId) || 0,
    studentId: Number(submission?.studentId) || 0,
    studentName: submission?.studentName ?? "",
    studentEmail: submission?.studentEmail ?? "",
    content: submission?.content ?? "",
    score: typeof submission?.score === "number" ? submission.score : null,
    feedback: submission?.feedback ?? "",
    submittedAt: submission?.submittedAt ?? null,
    gradedAt: submission?.gradedAt ?? null,
  };
}

function buildAssignmentWritePayload(payload) {
  return {
    title: payload.title?.trim() ?? "",
    description: payload.description?.trim() || null,
    deadline: payload.deadline || null,
    maxScore: Number(payload.maxScore) || 0,
  };
}

export const assignmentApi = {
  async getByClassroom(classroomId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/classrooms/${classroomId}/assignments`),
    );

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data)
        ? apiResponse.data.map((assignment) => normalizeAssignmentDto(assignment))
        : [],
    };
  },

  async getById(assignmentId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/assignments/${assignmentId}`));

    return {
      ...apiResponse,
      data: normalizeAssignmentDto(apiResponse.data),
    };
  },

  async create(classroomId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/classrooms/${classroomId}/assignments`, buildAssignmentWritePayload(payload)),
    );

    return {
      ...apiResponse,
      data: normalizeAssignmentDto(apiResponse.data),
    };
  },

  async update(assignmentId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.put(`/assignments/${assignmentId}`, buildAssignmentWritePayload(payload)),
    );

    return {
      ...apiResponse,
      data: normalizeAssignmentDto(apiResponse.data),
    };
  },

  async patch(assignmentId, payload) {
    const apiResponse = await requestApi(() => axiosClient.patch(`/assignments/${assignmentId}`, payload));

    return {
      ...apiResponse,
      data: normalizeAssignmentDto(apiResponse.data),
    };
  },

  async delete(assignmentId) {
    const apiResponse = await requestApi(() => axiosClient.delete(`/assignments/${assignmentId}`));

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },

  async submit(assignmentId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/assignments/${assignmentId}/submit`, {
        content: payload.content?.trim() ?? "",
      }),
    );

    return {
      ...apiResponse,
      data: normalizeSubmissionDto(apiResponse.data),
    };
  },

  async getSubmissions(assignmentId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/assignments/${assignmentId}/submissions`),
    );

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data)
        ? apiResponse.data.map((submission) => normalizeSubmissionDto(submission))
        : [],
    };
  },

  async grade(submissionId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/submissions/${submissionId}/grade`, {
        score: typeof payload.score === "number" ? payload.score : Number(payload.score) || 0,
        feedback: payload.feedback?.trim() || null,
      }),
    );

    return {
      ...apiResponse,
      data: normalizeSubmissionDto(apiResponse.data),
    };
  },
};

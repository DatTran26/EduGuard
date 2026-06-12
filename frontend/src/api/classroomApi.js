import axiosClient from "./axiosClient";
import { getCurrentSessionUser, hasAnyRole, requestApi } from "./apiHelpers";

// INTEGRATION STATUS:
// - File này đã nối classroom API thật của backend cho teacher/student/admin theo các endpoint hiện có.
// - Join code được backend tự sinh khi tạo lớp; frontend chỉ hiển thị lại chứ không còn tự random ở local.
// - Riêng member list hiện backend chỉ mở cho teacher chủ lớp hoặc student đã tham gia, nên admin chỉ xem được detail cơ bản.

function normalizeClassroomDto(classroom, currentUser, memberCount = null) {
  const normalizedMemberCount = typeof memberCount === "number" ? memberCount : null;

  return {
    id: Number(classroom?.id) || 0,
    name: classroom?.name ?? "",
    description: classroom?.description ?? "",
    joinCode: classroom?.joinCode ?? "",
    teacherId: Number(classroom?.teacherId) || 0,
    teacherName: classroom?.teacherName ?? "Giảng viên chưa xác định",
    createdAt: classroom?.createdAt ?? null,
    updatedAt: classroom?.createdAt ?? null,
    memberCount: normalizedMemberCount,
    canEdit:
      currentUser?.role === "Teacher" && Number(currentUser.id) === Number(classroom?.teacherId),
    isJoined: currentUser?.role === "Student",
  };
}

function normalizeMemberStatus(status) {
  if (status === "Active") {
    return "Đang tham gia";
  }

  if (status === "Removed") {
    return "Đã rời lớp";
  }

  return status || "Chưa xác định";
}

function normalizeClassroomMemberDto(member) {
  return {
    id: Number(member?.id) || 0,
    studentId: Number(member?.studentId) || 0,
    fullName: member?.fullName ?? "",
    email: member?.email ?? "",
    joinedAt: member?.joinedAt ?? null,
    role: "Sinh viên",
    status: member?.status ?? "",
    statusLabel: normalizeMemberStatus(member?.status),
  };
}

async function getMemberListApiResponse(classroomId) {
  const apiResponse = await requestApi(() => axiosClient.get(`/classrooms/${classroomId}/members`));

  return {
    ...apiResponse,
    data: Array.isArray(apiResponse.data)
      ? apiResponse.data.map((member) => normalizeClassroomMemberDto(member))
      : [],
  };
}

async function resolveMemberCount(classroomId, currentUser) {
  if (!currentUser || hasAnyRole(currentUser, ["Admin"])) {
    return null;
  }

  try {
    const memberResponse = await getMemberListApiResponse(classroomId);
    return memberResponse.data.length + 1;
  } catch {
    return null;
  }
}

export const classroomApi = {
  async getAll() {
    const currentUser = getCurrentSessionUser();
    const apiResponse = await requestApi(() => axiosClient.get("/classrooms"));
    const classroomItems = Array.isArray(apiResponse.data) ? apiResponse.data : [];
    const memberCounts = await Promise.all(
      classroomItems.map(async (classroom) => ({
        classroomId: Number(classroom.id),
        memberCount: await resolveMemberCount(classroom.id, currentUser),
      })),
    );
    const memberCountMap = new Map(
      memberCounts.map((item) => [item.classroomId, item.memberCount]),
    );

    return {
      ...apiResponse,
      data: classroomItems.map((classroom) =>
        normalizeClassroomDto(classroom, currentUser, memberCountMap.get(Number(classroom.id))),
      ),
    };
  },

  async getById(classroomId) {
    const currentUser = getCurrentSessionUser();
    const apiResponse = await requestApi(() => axiosClient.get(`/classrooms/${classroomId}`));
    const memberCount = await resolveMemberCount(classroomId, currentUser);

    return {
      ...apiResponse,
      data: normalizeClassroomDto(apiResponse.data, currentUser, memberCount),
    };
  },

  async getMembers(classroomId) {
    return getMemberListApiResponse(classroomId);
  },

  async create(payload) {
    const currentUser = getCurrentSessionUser();
    const apiResponse = await requestApi(() =>
      axiosClient.post("/classrooms", {
        name: payload.name?.trim() ?? "",
        description: payload.description?.trim() || null,
      }),
    );

    return {
      ...apiResponse,
      data: normalizeClassroomDto(apiResponse.data, currentUser, 1),
    };
  },

  async update(classroomId, payload) {
    const currentUser = getCurrentSessionUser();
    const apiResponse = await requestApi(() =>
      axiosClient.put(`/classrooms/${classroomId}`, {
        name: payload.name?.trim() ?? "",
        description: payload.description?.trim() || null,
      }),
    );
    const memberCount = await resolveMemberCount(classroomId, currentUser);

    return {
      ...apiResponse,
      data: normalizeClassroomDto(apiResponse.data, currentUser, memberCount),
    };
  },

  async delete(classroomId) {
    const apiResponse = await requestApi(() => axiosClient.delete(`/classrooms/${classroomId}`));

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },

  async join(joinCode) {
    const currentUser = getCurrentSessionUser();
    const apiResponse = await requestApi(() =>
      axiosClient.post("/classrooms/join", {
        joinCode: joinCode.trim().toUpperCase(),
      }),
    );
    const memberCount = await resolveMemberCount(apiResponse.data?.id, currentUser);

    return {
      ...apiResponse,
      data: normalizeClassroomDto(apiResponse.data, currentUser, memberCount),
    };
  },

  async removeMember(classroomId, studentId) {
    const apiResponse = await requestApi(() =>
      axiosClient.delete(`/classrooms/${classroomId}/members/${studentId}`),
    );

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },
};

import axiosClient from "./axiosClient";
import {
  areUserIdsEqual,
  getCurrentSessionUser,
  hasAnyRole,
  normalizeUserId,
  requestApi,
} from "./apiHelpers";

// INTEGRATION STATUS:
// - File này đã nối classroom API thật của backend cho teacher/student/admin theo các endpoint hiện có.
// - Join code được backend tự sinh khi tạo lớp; frontend chỉ hiển thị lại chứ không còn tự random ở local.
// - Riêng member list hiện backend chỉ mở cho teacher chủ lớp hoặc student đã tham gia, nên admin chỉ xem được detail cơ bản.

function normalizeClassroomDto(classroom, currentUser, membershipMeta = {}) {
  const normalizedMemberCount =
    typeof membershipMeta.memberCount === "number" ? membershipMeta.memberCount : null;

  return {
    id: Number(classroom?.id) || 0,
    name: classroom?.name ?? "",
    description: classroom?.description ?? "",
    joinCode: classroom?.joinCode ?? "",
    teacherId: normalizeUserId(classroom?.teacherId),
    teacherName: classroom?.teacherName ?? "Giảng viên chưa xác định",
    createdAt: classroom?.createdAt ?? null,
    updatedAt: classroom?.createdAt ?? null,
    memberCount: normalizedMemberCount,
    joinedAt: membershipMeta.joinedAt ?? null,
    canEdit:
      currentUser?.role === "Teacher" && areUserIdsEqual(currentUser.id, classroom?.teacherId),
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
    studentId: normalizeUserId(member?.studentId),
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

async function resolveClassroomMembershipMeta(classroomId, currentUser) {
  if (!currentUser || hasAnyRole(currentUser, ["Admin"])) {
    return {
      memberCount: null,
      joinedAt: null,
    };
  }

  try {
    const memberResponse = await getMemberListApiResponse(classroomId);
    const currentMember =
      currentUser.role === "Student"
        ? memberResponse.data.find(
            (member) =>
              areUserIdsEqual(member.studentId, currentUser.id) ||
              (currentUser.email &&
                member.email &&
                currentUser.email.toLowerCase() === member.email.toLowerCase()),
          )
        : null;

    return {
      memberCount: memberResponse.data.length + 1,
      joinedAt: currentMember?.joinedAt ?? null,
    };
  } catch {
    return {
      memberCount: null,
      joinedAt: null,
    };
  }
}

export const classroomApi = {
  async getAll() {
    const currentUser = getCurrentSessionUser();
    const apiResponse = await requestApi(() => axiosClient.get("/classrooms"));
    const classroomItems = Array.isArray(apiResponse.data) ? apiResponse.data : [];
    const membershipMetaList = await Promise.all(
      classroomItems.map(async (classroom) => ({
        classroomId: Number(classroom.id),
        membershipMeta: await resolveClassroomMembershipMeta(classroom.id, currentUser),
      })),
    );
    const membershipMetaMap = new Map(
      membershipMetaList.map((item) => [item.classroomId, item.membershipMeta]),
    );

    return {
      ...apiResponse,
      data: classroomItems.map((classroom) =>
        normalizeClassroomDto(classroom, currentUser, membershipMetaMap.get(Number(classroom.id))),
      ),
    };
  },

  async getById(classroomId) {
    const currentUser = getCurrentSessionUser();
    const apiResponse = await requestApi(() => axiosClient.get(`/classrooms/${classroomId}`));
    const membershipMeta = await resolveClassroomMembershipMeta(classroomId, currentUser);

    return {
      ...apiResponse,
      data: normalizeClassroomDto(apiResponse.data, currentUser, membershipMeta),
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
      data: normalizeClassroomDto(apiResponse.data, currentUser, { memberCount: 1, joinedAt: null }),
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
    const membershipMeta = await resolveClassroomMembershipMeta(classroomId, currentUser);

    return {
      ...apiResponse,
      data: normalizeClassroomDto(apiResponse.data, currentUser, membershipMeta),
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
    const membershipMeta = await resolveClassroomMembershipMeta(apiResponse.data?.id, currentUser);

    return {
      ...apiResponse,
      data: normalizeClassroomDto(apiResponse.data, currentUser, membershipMeta),
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

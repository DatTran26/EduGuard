import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentApi } from "../../api/assignmentApi";
import { classroomApi } from "../../api/classroomApi";
import { examApi } from "../../api/examApi";
import {
  buildClassroomDetailPathByRole,
  buildExamDetailPathByRole,
  routeConfig,
} from "../../routes/routeConfig";
import { FiBookOpen, FiClipboard, FiFileText, FiSearch, FiUsers } from "react-icons/fi";

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function getSearchResultTypeLabel(type) {
  if (type === "assignment") {
    return "Bài tập";
  }

  if (type === "exam") {
    return "Đề thi";
  }

  if (type === "student") {
    return "Học sinh";
  }

  return "Lớp học";
}

function getSearchResultIcon(type) {
  if (type === "assignment") {
    return FiFileText;
  }

  if (type === "exam") {
    return FiClipboard;
  }

  if (type === "student") {
    return FiUsers;
  }

  return FiBookOpen;
}

function buildSearchItems(role, searchSource) {
  const classroomItems = searchSource.classrooms.map((classroom) => ({
    id: `classroom-${classroom.id}`,
    type: "classroom",
    title: classroom.name,
    description: `${classroom.teacherName} • ${classroom.joinCode}`,
    href: buildClassroomDetailPathByRole(role, classroom.id),
    keywords: [classroom.name, classroom.teacherName, classroom.joinCode],
  }));
  const examItems = searchSource.exams.map((exam) => ({
    id: `exam-${exam.id}`,
    type: "exam",
    title: exam.title,
    description: `${exam.classroomName} • ${exam.statusLabel}`,
    href: buildExamDetailPathByRole(role, exam.id),
    keywords: [exam.title, exam.classroomName, exam.statusLabel],
  }));
  const assignmentItems = searchSource.assignments.map((assignment) => ({
    id: `assignment-${assignment.id}`,
    type: "assignment",
    title: assignment.title,
    description: `${assignment.classroomName} • Hạn nộp`,
    href: `${routeConfig.teacherAssignments}?classroomId=${assignment.classroomId}&assignmentId=${assignment.id}`,
    keywords: [assignment.title, assignment.classroomName],
  }));
  const studentItems = searchSource.students.map((student) => ({
    id: `student-${student.classroomId}-${student.studentId}`,
    type: "student",
    title: student.fullName,
    description: `${student.classroomName} • ${student.email}`,
    href: `${buildClassroomDetailPathByRole(role, student.classroomId)}?tab=students&studentId=${student.studentId}`,
    keywords: [student.fullName, student.email, student.classroomName],
  }));

  return [...classroomItems, ...assignmentItems, ...examItems, ...studentItems];
}

export default function TeacherShellSearch({ user }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchSource, setSearchSource] = useState({
    classrooms: [],
    exams: [],
    assignments: [],
    students: [],
  });
  const searchItems = useMemo(() => buildSearchItems(user?.role, searchSource), [searchSource, user?.role]);
  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
      return [];
    }

    return searchItems
      .filter((item) => item.keywords.some((keyword) => normalizeSearchText(keyword).includes(normalizedQuery)))
      .slice(0, 8);
  }, [query, searchItems]);

  useEffect(() => {
    if (!user?.role) {
      return undefined;
    }

    let isMounted = true;

    async function loadSearchSource() {
      setIsLoading(true);

      try {
        const [classroomResponse, examResponse] = await Promise.all([
          classroomApi.getAll(),
          examApi.getAll(),
        ]);
        const classrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
        const exams = Array.isArray(examResponse.data) ? examResponse.data : [];
        let assignments = [];
        let students = [];

        if (user.role === "Teacher") {
          const [assignmentGroups, memberGroups] = await Promise.all([
            Promise.all(
              classrooms.map(async (classroom) => {
                try {
                  const response = await assignmentApi.getByClassroom(classroom.id);
                  return (Array.isArray(response.data) ? response.data : []).map((assignment) => ({
                    ...assignment,
                    classroomName: classroom.name,
                  }));
                } catch {
                  return [];
                }
              }),
            ),
            Promise.all(
              classrooms.map(async (classroom) => {
                try {
                  const response = await classroomApi.getMembers(classroom.id);
                  return (Array.isArray(response.data) ? response.data : []).map((member) => ({
                    ...member,
                    classroomId: classroom.id,
                    classroomName: classroom.name,
                  }));
                } catch {
                  return [];
                }
              }),
            ),
          ]);

          assignments = assignmentGroups.flat();
          students = memberGroups.flat();
        }

        if (isMounted) {
          setSearchSource({ classrooms, exams, assignments, students });
        }
      } catch {
        if (isMounted) {
          setSearchSource({ classrooms: [], exams: [], assignments: [], students: [] });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSearchSource();

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!panelRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleSelect(href) {
    setQuery("");
    setIsOpen(false);
    navigate(href);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (searchResults.length > 0) {
      handleSelect(searchResults[0].href);
    }
  }

  return (
    <div className="relative w-full max-w-[560px]" ref={panelRef}>
      <form onSubmit={handleSubmit}>
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary">
          <FiSearch className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder={user?.role === "Teacher" ? "Tìm lớp, bài tập, đề thi, học sinh..." : "Tìm lớp học hoặc đề thi..."}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-full border border-border bg-surface-sunken py-1.5 pl-9 pr-4 text-xs text-primary transition-all duration-200 placeholder:text-secondary focus:border-tertiary focus:outline-none focus:ring-3 focus:ring-tertiary/16"
        />
      </form>

      {isOpen ? (
        <div className="eg-dropdown-panel absolute left-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-[20px] p-2">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-primary">Tìm kiếm nhanh</p>
            <p className="pt-0.5 text-[10px] text-secondary">
              {user?.role === "Teacher"
                ? "Tìm lớp học, bài tập, đề thi và học sinh trong phạm vi của bạn."
                : "Tìm lớp học và đề thi khả dụng trong khu vực hiện tại."}
            </p>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="px-3 py-8 text-xs text-secondary">Đang lập chỉ mục tìm kiếm...</div>
            ) : query.trim().length === 0 ? (
              <div className="px-3 py-8 text-xs text-secondary">Nhập từ khóa để bắt đầu tìm kiếm.</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((item) => {
                  const ItemIcon = getSearchResultIcon(item.type);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.href)}
                      className="flex w-full items-start gap-3 rounded-[16px] border border-border bg-surface px-3 py-3 text-left transition-all duration-200 hover:bg-surface-sunken"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-border bg-neutral text-primary">
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-xs font-semibold text-primary">{item.title}</span>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-secondary">
                            {getSearchResultTypeLabel(item.type)}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-secondary">{item.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-8 text-xs text-secondary">Không tìm thấy kết quả phù hợp.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

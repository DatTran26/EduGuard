import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { classroomApi } from "../../api/classroomApi";
import { buildTeacherTasksPath, routeConfig } from "../../routes/routeConfig";
import { FiChevronDown, FiChevronRight, FiPlus } from "react-icons/fi";

function buildQuickCreateOptions(classroomCount) {
  return [
    {
      id: "classroom",
      label: "Tạo lớp học",
      description: "Mở form tạo lớp mới",
      href: `${routeConfig.teacherClassrooms}?create=1`,
      disabled: false,
    },
    {
      id: "assignment",
      label: "Tạo bài tập",
      description: classroomCount > 0 ? "Đi tới workspace bài tập" : "Cần có lớp học trước",
      href: buildTeacherTasksPath("assignment", { create: 1 }),
      disabled: classroomCount === 0,
    },
    {
      id: "exam",
      label: "Tạo đề thi",
      description: classroomCount > 0 ? "Đi tới workspace đề thi" : "Cần có lớp học trước",
      href: buildTeacherTasksPath("exam", { create: 1 }),
      disabled: classroomCount === 0,
    },
  ];
}

function DropdownChevronIcon({ isOpen }) {
  return (
    <FiChevronDown
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
    />
  );
}

export default function TeacherQuickCreateButton({ classroomCount = null }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [fetchedClassroomCount, setFetchedClassroomCount] = useState(0);
  const resolvedClassroomCount = classroomCount ?? fetchedClassroomCount;
  const quickCreateOptions = useMemo(
    () => buildQuickCreateOptions(resolvedClassroomCount),
    [resolvedClassroomCount],
  );

  useEffect(() => {
    if (classroomCount !== null && typeof classroomCount !== "undefined") {
      return undefined;
    }

    let isMounted = true;

    async function loadClassroomCount() {
      try {
        const response = await classroomApi.getAll();

        if (isMounted) {
          setFetchedClassroomCount(Array.isArray(response.data) ? response.data.length : 0);
        }
      } catch {
        if (isMounted) {
          setFetchedClassroomCount(0);
        }
      }
    }

    loadClassroomCount();

    return () => {
      isMounted = false;
    };
  }, [classroomCount]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
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

  function handleNavigate(href) {
    setIsOpen(false);
    navigate(href);
  }

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((previousValue) => !previousValue)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-surface-sunken"
      >
        <FiPlus className="h-4 w-4" />
        <span>Tạo nhanh</span>
        <DropdownChevronIcon isOpen={isOpen} />
      </button>

      {isOpen ? (
        <div className="eg-dropdown-panel absolute right-0 top-[calc(100%+8px)] z-20 w-[280px] overflow-hidden rounded-[20px] p-2" role="menu">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-primary">Quick create</p>
            <p className="pt-0.5 text-[10px] text-secondary">Đi tới đúng màn hình soạn thảo mà không rời shell hiện tại quá nhiều bước.</p>
          </div>

          <div className="space-y-1 p-1">
            {quickCreateOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => handleNavigate(item.href)}
                className="flex w-full items-start justify-between rounded-[14px] px-3 py-3 text-left transition-all duration-200 hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  <span className="block text-xs font-semibold text-primary">{item.label}</span>
                  <span className="mt-1 block text-[11px] text-secondary">{item.description}</span>
                </span>
                <FiChevronRight className="h-4 w-4 text-secondary" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

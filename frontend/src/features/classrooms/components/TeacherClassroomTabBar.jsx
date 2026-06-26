import { useEffect, useRef, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import ClassroomInfoPanel from "./ClassroomInfoPanel";
import { TEACHER_CLASSROOM_TABS } from "./teacher-classroom-tabs";

export default function TeacherClassroomTabBar({
  activeTab,
  onTabChange,
  classroom,
  onEdit,
  onDelete,
  isSaving,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function handleEdit() {
    setIsMenuOpen(false);
    onEdit?.();
  }

  function handleDelete() {
    setIsMenuOpen(false);
    onDelete?.();
  }

  return (
    <div className="sticky top-[64px] z-10 -mx-4 px-4 py-3 bg-neutral/80 backdrop-blur-md border-b border-border/50 transition-all duration-150">
      <div className="flex items-center justify-between gap-2">
        <div className="max-w-fit rounded-full border border-border bg-surface p-1 shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex gap-1">
            {TEACHER_CLASSROOM_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-brand text-white shadow-sm"
                    : "text-secondary hover:bg-surface-sunken hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="Thông tin lớp học"
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border bg-surface text-secondary transition-all duration-150 hover:bg-surface-sunken hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 ${
              isMenuOpen ? "border-tertiary/30 text-primary" : "border-border"
            }`}
          >
            <FiMoreVertical className="h-5 w-5" />
          </button>

          {isMenuOpen ? (
            <div
              className="eg-dropdown-panel absolute right-0 top-[calc(100%+8px)] z-20 w-[min(calc(100vw-2rem),360px)] rounded-[20px] p-4"
              role="dialog"
              aria-label="Thông tin lớp học"
            >
              <p className="mb-3 text-sm font-semibold text-primary">Thông tin lớp học</p>
              <ClassroomInfoPanel
                classroom={classroom}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isSaving={isSaving}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

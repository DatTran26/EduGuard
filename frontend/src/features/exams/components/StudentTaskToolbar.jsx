import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

export default function StudentTaskToolbar({
  classrooms = [],
  onClassroomChange,
  onReset,
  onSearchChange,
  onStatusChange,
  searchTerm,
  selectedClassroomId,
  selectedStatus = "",
  statusOptions = [],
}) {
  const hasActiveFilters =
    Boolean(selectedClassroomId) ||
    Boolean(String(searchTerm || "").trim()) ||
    Boolean(selectedStatus);

  return (
    <div className="rounded-[24px] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <label className="space-y-2 xl:w-[240px]">
          <span className="text-[0.82rem] font-medium text-secondary">Lớp học</span>
          <select
            className="eg-input"
            onChange={(event) => onClassroomChange(event.target.value)}
            value={selectedClassroomId}
          >
            <option value="">Tất cả lớp học</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={String(classroom.id)}>
                {classroom.name}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 flex-1 space-y-2">
          <span className="text-[0.82rem] font-medium text-secondary">Tìm kiếm</span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-secondary">
              <FiSearch className="h-4 w-4" />
            </span>
            <Input
              className="pl-10"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên..."
              value={searchTerm}
            />
          </div>
        </label>

        {statusOptions.length > 0 ? (
          <label className="space-y-2 xl:w-[220px]">
            <span className="text-[0.82rem] font-medium text-secondary">Trạng thái</span>
            <select
              className="eg-input"
              onChange={(event) => onStatusChange(event.target.value)}
              value={selectedStatus}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {hasActiveFilters ? (
          <Button className="xl:shrink-0" onClick={onReset} variant="secondary">
            <FiRefreshCw className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        ) : null}
      </div>
    </div>
  );
}

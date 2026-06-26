import { useState, useRef } from "react";
import { FiFilter } from "react-icons/fi";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";

export default function ClassroomToolbar({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  onResetFilters,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const isResetDisabled =
    !searchTerm && statusFilter === "all" && sortOption === "newest";

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // slight delay to prevent accidental closes when transitioning from button to popover
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon Button */}
      <button
        type="button"
        className={`flex h-11 w-11 items-center justify-center rounded-full border bg-surface transition-all duration-200 hover:bg-surface-sunken hover:border-brand shadow-sm ${
          isOpen ? "border-brand text-brand ring-2 ring-brand/10" : "border-border text-primary"
        }`}
        aria-label="Filter Classrooms"
      >
        <FiFilter className="h-5 w-5" />
      </button>

      {/* Floating Filter Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 p-5 bg-surface border border-border rounded-[25px] shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-bold text-primary mb-3 pb-2 border-b border-border">Bộ lọc lớp học</h4>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-secondary" htmlFor="classroom-search">
                Tìm kiếm lớp
              </label>
              <Input
                id="classroom-search"
                placeholder="Tìm lớp theo tên hoặc mã..."
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-secondary" htmlFor="classroom-status">
                Trạng thái
              </label>
              <select
                id="classroom-status"
                className="eg-input w-full"
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="open">Đang mở</option>
                <option value="closed">Đã đóng</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-secondary" htmlFor="classroom-sort">
                Sắp xếp
              </label>
              <select
                id="classroom-sort"
                className="eg-input w-full"
                value={sortOption}
                onChange={(event) => onSortOptionChange(event.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="name-az">Tên A-Z</option>
                <option value="most-students">Nhiều sinh viên nhất</option>
              </select>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <Button
                disabled={isResetDisabled}
                variant="ghost"
                onClick={onResetFilters}
                className="w-full text-xs"
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

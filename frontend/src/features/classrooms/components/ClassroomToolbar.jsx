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
  const isResetDisabled =
    !searchTerm && statusFilter === "all" && sortOption === "newest";

  return (
    <div className="flex flex-col gap-4 p-4 bg-surface border border-border rounded-[20px] shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 flex-1">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-secondary" htmlFor="classroom-search">
            Tìm kiếm lớp
          </label>
          <Input
            id="classroom-search"
            placeholder="Tìm lớp theo tên hoặc mã lớp..."
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
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
      </div>

      <div className="flex shrink-0 items-center justify-end">
        <Button
          disabled={isResetDisabled}
          variant="ghost"
          onClick={onResetFilters}
          className="w-full lg:w-auto"
        >
          Đặt lại bộ lọc
        </Button>
      </div>
    </div>
  );
}

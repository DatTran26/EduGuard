import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";
import { ADMIN_CLASSROOM_SORT_OPTIONS } from "./classroom-list-helpers";

export default function ClassroomListAdminFilters({
  searchTerm,
  onSearchTermChange,
  sortOption,
  onSortOptionChange,
  onResetFilters,
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Bộ lọc lớp học</h3>
        <Button
          disabled={!searchTerm && sortOption === "name-asc"}
          variant="ghost"
          onClick={onResetFilters}
        >
          Đặt lại
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <label className="eg-label" htmlFor="admin-classroom-search">
            Tìm kiếm lớp học
          </label>
          <Input
            id="admin-classroom-search"
            placeholder="Nhập tên lớp học hoặc tên giảng viên"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </div>

        <div>
          <label className="eg-label" htmlFor="admin-classroom-sort">
            Sắp xếp danh sách
          </label>
          <select
            id="admin-classroom-sort"
            className="eg-input"
            value={sortOption}
            onChange={(event) => onSortOptionChange(event.target.value)}
          >
            {ADMIN_CLASSROOM_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}

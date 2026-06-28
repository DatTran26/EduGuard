import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";

export default function LearningTaskFilters({
  classroomOptions = [],
  filters,
  hasActiveFilters = false,
  onClassroomChange,
  onReset,
  onSearchChange,
  onSortChange,
  onStatusChange,
  sortOptions = [],
  statusOptions = [],
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>
          <p className="mt-1 text-sm text-secondary">
            Lọc nhanh theo lớp học, trạng thái và từ khóa đang cần theo dõi.
          </p>
        </div>

        {hasActiveFilters ? (
          <Button onClick={onReset} variant="secondary">
            Xóa bộ lọc
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Select
          id="teacher-learning-task-classroom-filter"
          label="Lớp học"
          onChange={(event) => onClassroomChange(event.target.value)}
          options={classroomOptions}
          value={filters.classroomId}
        />
        <Select
          id="teacher-learning-task-status-filter"
          label="Trạng thái"
          onChange={(event) => onStatusChange(event.target.value)}
          options={statusOptions}
          value={filters.status}
        />
        <Select
          id="teacher-learning-task-sort-filter"
          label="Sắp xếp"
          onChange={(event) => onSortChange(event.target.value)}
          options={sortOptions}
          value={filters.sort}
        />
        <TextInput
          id="teacher-learning-task-search-filter"
          label="Tìm kiếm"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tên hoạt động hoặc lớp học"
          value={filters.searchTerm}
        />
      </div>
    </Card>
  );
}

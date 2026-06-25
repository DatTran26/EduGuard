import { FiGrid, FiFileText } from "react-icons/fi";

export default function StudentClassroomSummary({ joinedClassroomsCount = 0, pendingTasksCount = 0, isLoading = false }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Joined Classrooms KPI */}
      <div className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FiGrid className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate">
            Lớp đã tham gia
          </p>
          {isLoading ? (
            <div className="mt-1 h-7 w-12 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <p className="text-2xl font-bold text-[#0F172A] mt-0.5 leading-none">
              {joinedClassroomsCount}
            </p>
          )}
        </div>
      </div>

      {/* Pending Tasks KPI */}
      <div className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <FiFileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate">
            Bài cần làm
          </p>
          {isLoading ? (
            <div className="mt-1 h-7 w-12 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <p className="text-2xl font-bold text-[#0F172A] mt-0.5 leading-none">
              {pendingTasksCount}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import Card from "../../../components/common/Card";
import { buildClassroomDetailPathByRole } from "../../../routes/routeConfig";
import { FiArrowRight, FiUser, FiHash } from "react-icons/fi";

export default function StudentClassroomCard({ classroom }) {
  const detailPath = buildClassroomDetailPathByRole("Student", classroom.id);
  
  // Status check: if classroom status is active / open (default to open)
  // Green badge for "Đang học" or "Đã tham gia"
  const isClosed = classroom.status === "closed";
  const statusLabel = isClosed ? "Đã kết thúc" : "Đang học";
  const statusBadgeColor = isClosed
    ? "bg-slate-100 text-slate-600 border-slate-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <Card className="group border border-[#E2E8F0] bg-white p-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-[20px] overflow-hidden">
      <Link to={detailPath} className="flex h-full flex-col justify-between p-6 focus:outline-none">
        <div className="space-y-4">
          {/* Badge header */}
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeColor}`}>
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <FiHash className="h-3 w-3" />
              <span className="font-mono">{classroom.joinCode || "N/A"}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[1.125rem] font-bold tracking-tight text-[#0F172A] group-hover:text-[#2563EB] transition-colors duration-200 line-clamp-2">
            {classroom.name}
          </h3>

          {/* Subtitle / Teacher info */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FiUser className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">
              Giảng viên: <span className="font-medium text-[#0F172A]">{classroom.teacherName || "Chưa phân công"}</span>
            </span>
          </div>
        </div>

        {/* Footer line with dynamic spacing & button */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400 font-medium">
            Mã lớp: <span className="font-mono text-slate-600">{classroom.joinCode || "--"}</span>
          </span>
          
          {/* Vào lớp button */}
          <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-4 text-xs font-bold text-white shadow-sm shadow-[#2563EB]/10 transition-all duration-200 hover:bg-[#1D4ED8] group-hover:translate-x-0.5">
            <span>Vào lớp</span>
            <FiArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Card>
  );
}

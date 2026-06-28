import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiAlertTriangle, FiAlertCircle, FiTerminal, FiSearch, FiSliders, FiRefreshCw } from "react-icons/fi";
import { dashboardApi } from "../../../api/dashboardApi";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import TextInput from "../../../components/forms/TextInput";
import Select from "../../../components/forms/Select";
import MetricBarList from "../../../components/dashboard/MetricBarList";
import StatCard from "../../../components/dashboard/StatCard";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import Button from "../../../components/common/Button";
import {
  ADMIN_MONITORING_SEVERITY_OPTIONS,
  buildIncidentTypeOptions,
  filterCheatingTypeBars,
  filterMonitoringCollection,
  filterRecentIncidents,
  getRiskBadgeVariant,
  getRiskLabel,
} from "../admin-monitoring-helpers";

function ExamRiskList({ items }) {
  if (items.length === 0) {
    return <EmptyState title="Không có đề thi phù hợp." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="eg-risk-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{item.title}</p>
              <p className="mt-1 text-sm text-secondary">{item.classroomName}</p>
            </div>
            <Badge variant={getRiskBadgeVariant(item.totalSuspicion)}>{getRiskLabel(item.totalSuspicion)}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-secondary">
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
              {item.totalSuspicion} điểm
            </span>
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
              {item.flaggedAttempts} lượt cảnh báo
            </span>
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
              {item.totalLogs} log
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentRiskList({ items }) {
  if (items.length === 0) {
    return <EmptyState title="Không có sinh viên phù hợp." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="eg-risk-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{item.studentName}</p>
              <p className="mt-1 truncate text-sm text-secondary">{item.email}</p>
            </div>
            <Badge variant={getRiskBadgeVariant(item.totalSuspicion)}>{getRiskLabel(item.totalSuspicion)}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-secondary">
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
              {item.totalSuspicion} điểm
            </span>
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
              {item.logCount} log
            </span>
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
              {item.attemptCount} lượt làm
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IncidentList({ items }) {
  if (items.length === 0) {
    return <EmptyState title="Không có sự kiện phù hợp." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="eg-risk-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{item.type}</p>
              <p className="mt-1 truncate text-sm text-secondary">{item.studentName}</p>
            </div>
            <Badge variant={getRiskBadgeVariant(item.suspicionPoint)}>{item.suspicionPoint} điểm</Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-secondary">
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">{item.examTitle}</span>
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">{item.classroomName}</span>
            <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
              {formatShortDateTime(item.occurredAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MonitoringSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Header Skeleton */}
      <div className="h-40 rounded-3xl bg-surface-sunken border border-border p-6 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-border rounded-full" />
          <div className="h-8 w-64 bg-border rounded-full" />
          <div className="h-4 w-96 bg-border rounded-full" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3.5 border rounded-2xl bg-surface border-border flex flex-col justify-between h-[80px] min-w-0">
            <div className="flex justify-between items-center gap-2">
              <div className="h-3 w-16 bg-border rounded-full" />
              <div className="h-4 w-4 bg-border rounded-full" />
            </div>
            <div className="h-5 w-10 bg-border rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filter Card Skeleton */}
      <div className="h-[120px] rounded-2xl bg-surface border border-border p-6 space-y-4">
        <div className="h-5 w-24 bg-border rounded-full" />
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="h-10 bg-surface-sunken rounded-xl" />
          <div className="h-10 bg-surface-sunken rounded-xl" />
          <div className="h-10 bg-surface-sunken rounded-xl" />
          <div className="h-10 bg-surface-sunken rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function AdminMonitoringPage() {
  const [monitoringData, setMonitoringData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [incidentTypeFilter, setIncidentTypeFilter] = useState("");
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("violation");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  async function loadMonitoringData() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.getAdminMonitoringDashboard();
      setMonitoringData(response.data);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu giám sát.");
      showToast({
        tone: "danger",
        title: "Tải giám sát thất bại",
        message: err.message || "Không thể tải dữ liệu giám sát.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMonitoringData();
  }, [showToast]);

  const incidentTypeOptions = useMemo(
    () => buildIncidentTypeOptions(monitoringData?.cheatingTypes),
    [monitoringData?.cheatingTypes],
  );

  const filteredExamRiskRanking = useMemo(
    () => filterMonitoringCollection(monitoringData?.examRiskRanking, {
      searchTerm,
      severity: severityFilter,
    }),
    [monitoringData?.examRiskRanking, searchTerm, severityFilter],
  );
  const filteredStudentRiskRanking = useMemo(
    () => filterMonitoringCollection(monitoringData?.studentRiskRanking, {
      searchTerm,
      severity: severityFilter,
    }),
    [monitoringData?.studentRiskRanking, searchTerm, severityFilter],
  );
  const filteredRecentIncidents = useMemo(
    () => filterRecentIncidents(monitoringData?.recentIncidents, {
      searchTerm,
      severity: severityFilter,
      incidentType: incidentTypeFilter,
    }),
    [monitoringData?.recentIncidents, searchTerm, severityFilter, incidentTypeFilter],
  );
  const filteredCheatingTypes = useMemo(
    () => filterCheatingTypeBars(monitoringData?.cheatingTypes, incidentTypeFilter),
    [monitoringData?.cheatingTypes, incidentTypeFilter],
  );

  function handleResetFilters() {
    setSearchTerm("");
    setSeverityFilter("");
    setIncidentTypeFilter("");
  }

  if (isLoading) {
    return <MonitoringSkeleton />;
  }

  if (error || !monitoringData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-border bg-surface rounded-2xl space-y-4">
        <FiAlertTriangle size={48} className="text-danger animate-bounce" />
        <h3 className="text-lg font-bold text-primary">Tải dữ liệu thất bại</h3>
        <p className="text-sm text-secondary max-w-md text-center">
          {error || "Đã xảy ra lỗi không xác định khi tải dữ liệu từ máy chủ."}
        </p>
        <Button onClick={loadMonitoringData} className="flex items-center gap-2">
          <FiRefreshCw /> Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(239 68 68 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-danger/20 bg-danger-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-danger">
              Giám sát hệ thống
            </p>
            <PageHeader
              title="Trung tâm Giám sát"
              description="Theo dõi trực quan các hành vi nghi vấn, rủi ro thi cử và sự kiện chống gian lận trên toàn hệ thống."
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="flex flex-col justify-between p-3.5 border rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/15 border-slate-200 dark:border-slate-800/80 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all duration-200 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Tổng log</p>
            <span className="shrink-0 text-indigo-500"><FiTerminal size={16} /></span>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mt-1 leading-none">{monitoringData.summary.totalLogs}</p>
        </div>
        <div className="flex flex-col justify-between p-3.5 border rounded-2xl bg-amber-50/40 dark:bg-amber-950/15 border-slate-200 dark:border-slate-800/80 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-200 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80 truncate">Lượt cảnh báo</p>
            <span className="shrink-0 text-amber-500"><FiAlertTriangle size={16} /></span>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 mt-1 leading-none">{monitoringData.summary.flaggedAttempts}</p>
        </div>
        <div className="flex flex-col justify-between p-3.5 border rounded-2xl bg-rose-50/40 dark:bg-rose-950/15 border-slate-200 dark:border-slate-800/80 border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all duration-200 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700/80 dark:text-rose-400/80 truncate">Nguy cơ cao</p>
            <span className="shrink-0 text-rose-500"><FiAlertCircle size={16} /></span>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 mt-1 leading-none">{monitoringData.summary.highRiskAttempts}</p>
        </div>
      </div>

      {/* Tab bar & Filter Trigger Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 mb-6 gap-4">
        <div className="flex flex-1 items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveTab("violation")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
              activeTab === "violation"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            Loại vi phạm
          </button>
          <span className="text-slate-300 dark:text-slate-700 select-none mx-0.5">|</span>
          <button
            onClick={() => setActiveTab("exam")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
              activeTab === "exam"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            Đề thi rủi ro
          </button>
          <span className="text-slate-300 dark:text-slate-700 select-none mx-0.5">|</span>
          <button
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
              activeTab === "student"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            Sinh viên cần chú ý
          </button>
          <span className="text-slate-300 dark:text-slate-700 select-none mx-0.5">|</span>
          <button
            onClick={() => setActiveTab("incident")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
              activeTab === "incident"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            Sự kiện gần đây
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300 cursor-pointer ${
            isFilterOpen
              ? "bg-slate-100 border-slate-350 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/40"
          }`}
        >
          <FiSliders className={`h-4 w-4 transition-transform duration-300 ${isFilterOpen ? "rotate-90 text-red-500 dark:text-red-400" : ""}`} />
          <span>Bộ lọc</span>
          {(searchTerm || severityFilter || incidentTypeFilter) && (
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950" />
          )}
        </button>
      </div>

      {/* Collapsible Filter Panel */}
      {isFilterOpen && (
        <Card className="p-5 mb-6 border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 shadow-sm animate-fadeIn">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <TextInput
              id="admin-monitoring-search"
              label="Tìm kiếm"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tên sinh viên, đề thi, lớp học"
              value={searchTerm}
            />
            <Select
              id="admin-monitoring-severity"
              label="Mức độ"
              onChange={(event) => setSeverityFilter(event.target.value)}
              options={ADMIN_MONITORING_SEVERITY_OPTIONS}
              value={severityFilter}
            />
            <Select
              id="admin-monitoring-type"
              label="Loại vi phạm"
              onChange={(event) => setIncidentTypeFilter(event.target.value)}
              options={incidentTypeOptions}
              value={incidentTypeFilter}
            />
            <div className="flex items-end">
              <button
                type="button"
                className="eg-button eg-button-secondary w-full py-2.5 rounded-xl font-bold cursor-pointer transition-colors"
                onClick={handleResetFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Tab Content Card */}
      <Card className="p-6">
        {activeTab === "violation" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Phân tích loại vi phạm</h3>
              <span className="text-xs font-semibold text-secondary">
                Hiển thị {filteredCheatingTypes.length} loại
              </span>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              <MetricBarList items={filteredCheatingTypes} />
            </div>
          </div>
        )}

        {activeTab === "exam" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Danh sách đề thi rủi ro</h3>
              <span className="text-xs font-semibold text-secondary">
                Hiển thị {filteredExamRiskRanking.length} đề thi
              </span>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              <ExamRiskList items={filteredExamRiskRanking} />
            </div>
          </div>
        )}

        {activeTab === "student" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Danh sách sinh viên cần chú ý</h3>
              <span className="text-xs font-semibold text-secondary">
                Hiển thị {filteredStudentRiskRanking.length} sinh viên
              </span>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              <StudentRiskList items={filteredStudentRiskRanking} />
            </div>
          </div>
        )}

        {activeTab === "incident" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Các sự kiện vi phạm gần đây</h3>
              <span className="text-xs font-semibold text-secondary">
                Hiển thị {filteredRecentIncidents.length} sự kiện
              </span>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              <IncidentList items={filteredRecentIncidents} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

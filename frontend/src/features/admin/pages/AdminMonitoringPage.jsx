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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[100px] rounded-2xl bg-surface border border-border p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-border rounded-full" />
              <div className="h-6 w-6 bg-border rounded-lg" />
            </div>
            <div className="h-6 w-16 bg-border rounded-lg" />
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng log"
          tone="neutral"
          value={monitoringData.summary.totalLogs}
          icon={<FiTerminal size={18} />}
        />
        <StatCard
          label="Lượt cảnh báo"
          tone="caution"
          value={monitoringData.summary.flaggedAttempts}
          icon={<FiAlertTriangle size={18} />}
        />
        <StatCard
          label="Nguy cơ cao"
          tone="danger"
          value={monitoringData.summary.highRiskAttempts}
          icon={<FiAlertCircle size={18} />}
        />
        <StatCard
          label="Điểm nghi ngờ"
          tone="info"
          value={monitoringData.summary.totalSuspicionPoints}
          icon={<FiActivity size={18} />}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <FiSliders className="text-secondary" />
          <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
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
              className="eg-button eg-button-secondary w-full"
              onClick={handleResetFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Loại vi phạm</h3>
          <MetricBarList items={filteredCheatingTypes} />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Đề thi rủi ro</h3>
          <ExamRiskList items={filteredExamRiskRanking} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Sinh viên cần chú ý</h3>
          <StudentRiskList items={filteredStudentRiskRanking} />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Sự kiện gần đây</h3>
          <IncidentList items={filteredRecentIncidents} />
        </Card>
      </div>
    </div>
  );
}

import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = {
  activityPrimary: "#1D4ED8",
  activitySecondary: "#DC2626",
  averageScore: "#0F766E",
  submissionRate: "#D97706",
};

const EXAM_STATUS_COLOR_MAP = {
  "Bản nháp": "#64748B",
  "Sắp mở": "#D97706",
  "Đang mở": "#0284C7",
  "Đã đóng": "#059669",
};

const FALLBACK_PIE_COLORS = ["#1D4ED8", "#DC2626", "#7C3AED", "#0F766E"];

function CustomActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const attemptPoint = payload.find((item) => item.dataKey === "attemptCount");
  const alertPoint = payload.find((item) => item.dataKey === "alertCount");

  return (
    <div className="rounded-[14px] border border-border bg-surface p-3 text-xs text-primary shadow-none">
      <p className="mb-2 font-semibold text-primary">{label}</p>
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 text-secondary">
          <span className="block h-2.5 w-2.5 rounded-full bg-[#1D4ED8]" />
          Lượt nộp bài thi
          <span className="font-semibold text-[#1D4ED8]">{attemptPoint?.value ?? 0}</span>
        </p>
        <p className="flex items-center gap-2 text-secondary">
          <span className="block h-2.5 w-2.5 rounded-full bg-[#DC2626]" />
          Cảnh báo bất thường
          <span className="font-semibold text-[#DC2626]">{alertPoint?.value ?? 0}</span>
        </p>
      </div>
    </div>
  );
}

function CustomPerformanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const submissionPoint = payload.find((item) => item.dataKey === "submissionRate");
  const scorePoint = payload.find((item) => item.dataKey === "averageScore");

  return (
    <div className="rounded-[14px] border border-border bg-surface p-3 text-xs text-primary shadow-none">
      <p className="mb-2 font-semibold text-primary">{label}</p>
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 text-secondary">
          <span className="block h-2.5 w-2.5 rounded-[4px] bg-[#D97706]" />
          Tỉ lệ nộp bài
          <span className="font-semibold text-[#D97706]">{submissionPoint?.value ?? 0}%</span>
        </p>
        <p className="flex items-center gap-2 text-secondary">
          <span className="block h-2.5 w-2.5 rounded-[4px] bg-[#0F766E]" />
          Điểm trung bình
          <span className="font-semibold text-[#0F766E]">{scorePoint?.value ?? 0}/10</span>
        </p>
      </div>
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-[14px] border border-border bg-surface p-3 text-xs text-primary shadow-none">
      <p className="mb-2 font-semibold text-primary">{data.label}</p>
      <div className="space-y-1.5">
        <p className="text-secondary">
          Số lượng đề <span className="font-semibold text-primary">{data.value}</span>
        </p>
        <p className="text-secondary">
          Tỉ lệ <span className="font-semibold text-primary">{data.percentage}%</span>
        </p>
      </div>
    </div>
  );
}

export function TeacherActivityTrendChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-secondary">
        Không có dữ liệu hoạt động để hiển thị.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomActivityTooltip />} />
          <Legend
            verticalAlign="top"
            height={34}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", color: "#64748B" }}
          />
          <Line
            type="monotone"
            dataKey="attemptCount"
            name="Lượt nộp bài thi"
            stroke={CHART_COLORS.activityPrimary}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.activityPrimary }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="alertCount"
            name="Cảnh báo bất thường"
            stroke={CHART_COLORS.activitySecondary}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.activitySecondary }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClassroomPerformanceChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-secondary">
        Không có dữ liệu lớp học để hiển thị.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: -8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            yAxisId="left"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            unit="%"
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 10]}
            dx={8}
          />
          <Tooltip content={<CustomPerformanceTooltip />} />
          <Legend
            verticalAlign="top"
            height={34}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", color: "#64748B" }}
          />
          <Bar
            yAxisId="left"
            dataKey="submissionRate"
            name="Tỉ lệ nộp bài"
            fill={CHART_COLORS.submissionRate}
            radius={[8, 8, 0, 0]}
            maxBarSize={34}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="averageScore"
            name="Điểm trung bình"
            stroke={CHART_COLORS.averageScore}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.averageScore }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExamStatusBreakdownChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-secondary">
        Không có dữ liệu trạng thái đề thi.
      </div>
    );
  }

  const chartData = data.filter((item) => item.value > 0);
  const totalExams = data.reduce((sum, item) => sum + item.value, 0);

  if (!chartData.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-secondary">
        Chưa có bài kiểm tra để phân tích.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-2 lg:flex-row lg:items-start lg:justify-between">
      <div className="relative h-[210px] w-[210px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={EXAM_STATUS_COLOR_MAP[entry.label] ?? FALLBACK_PIE_COLORS[index % FALLBACK_PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-primary">{totalExams}</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
            Bài kiểm tra
          </span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2">
        {data.map((item, index) => {
          const color =
            EXAM_STATUS_COLOR_MAP[item.label] ?? FALLBACK_PIE_COLORS[index % FALLBACK_PIE_COLORS.length];

          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-[14px] border border-border-subtle bg-neutral px-3 py-2.5 transition-colors duration-150 hover:bg-surface-sunken"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-3 w-3 flex-shrink-0 rounded-[4px]" style={{ backgroundColor: color }} />
                <span className="truncate text-sm font-semibold text-primary">{item.label}</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-sm font-semibold text-primary">{item.value}</span>
                <span className="w-10 text-[11px] font-medium text-secondary">{item.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

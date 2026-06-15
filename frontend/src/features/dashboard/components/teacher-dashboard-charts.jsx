import {
  ResponsiveContainer,
  ComposedChart,
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

// Institutional Slate Colors
const CHART_COLORS = {
  averageScore: "#1D4ED8", // Tertiary (Accent Blue)
  submissionRate: "#047857", // Success Green
  pieSlice1: "#DC2626", // Danger Red
  pieSlice2: "#B45309", // Caution Orange
  pieSlice3: "#0369A1", // Info Blue
  pieSlice4: "#1D4ED8", // Accent Blue
  pieSlice5: "#64748B", // Secondary Slate
};

const PIE_COLORS = [
  CHART_COLORS.pieSlice1,
  CHART_COLORS.pieSlice2,
  CHART_COLORS.pieSlice3,
  CHART_COLORS.pieSlice4,
  CHART_COLORS.pieSlice5,
];

// Custom Tooltip for Classroom Performance
function CustomPerformanceTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[12px] border border-border bg-surface p-3 text-xs text-primary shadow-none">
        <p className="font-semibold mb-2 text-primary">{label}</p>
        <div className="space-y-1">
          <p className="text-secondary flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-[#047857] block"></span>
            Tỉ lệ nộp bài:{" "}
            <span className="font-semibold text-[#047857]">
              {payload[0].value}%
            </span>
          </p>
          {payload[1] && (
            <p className="text-secondary flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-[4px] bg-[#1D4ED8] block"></span>
              Điểm trung bình:{" "}
              <span className="font-semibold text-[#1D4ED8]">
                {payload[1].value}/10
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Cheating Pie Chart
function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-[12px] border border-border bg-surface p-3 text-xs text-primary shadow-none">
        <p className="font-semibold mb-2 text-primary">{data.label}</p>
        <div className="space-y-1">
          <p className="text-secondary flex items-center gap-1.5">
            Số lượt vi phạm:{" "}
            <span className="font-semibold text-primary">{data.value}</span>
          </p>
          <p className="text-secondary flex items-center gap-1.5">
            Tỉ lệ:{" "}
            <span className="font-semibold text-primary">{data.percentage}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

// 1. Performance Chart Component (Composed Chart)
export function ClassroomPerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-secondary">
        Không có dữ liệu lớp học để hiển thị.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: -10, left: -20, bottom: 0 }}
        >
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
            orientation="left"
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
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", color: "#64748B" }}
            formatter={(value) => (
              <span className="text-secondary font-medium mr-2">
                {value === "submissionRate" ? "Tỉ lệ nộp bài" : "Điểm trung bình"}
              </span>
            )}
          />
          <Bar
            yAxisId="left"
            dataKey="submissionRate"
            fill={CHART_COLORS.submissionRate}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="averageScore"
            stroke={CHART_COLORS.averageScore}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 1 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Cheating Breakdown Chart Component (Donut Pie Chart)
export function CheatingBreakdownChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-secondary">
        Không có dữ liệu cảnh báo để hiển thị.
      </div>
    );
  }

  const totalIncidents = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
      <div className="relative h-[200px] w-[200px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Total label inside the donut hole */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-primary tracking-tight">
            {totalIncidents}
          </span>
          <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.12em] mt-0.5">
            Vi phạm
          </span>
        </div>
      </div>

      {/* Sleek Custom Legend list */}
      <div className="flex-1 w-full space-y-2">
        {data.map((item, index) => {
          const color = PIE_COLORS[index % PIE_COLORS.length];
          return (
            <div
              key={item.label}
              className="flex items-center justify-between p-2 rounded-[12px] hover:bg-surface-sunken transition-colors duration-150"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-[4px] flex-shrink-0"
                  style={{ backgroundColor: color }}
                ></span>
                <span className="text-xs font-semibold text-primary truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-xs font-semibold text-primary">
                  {item.value}
                </span>
                <span className="text-[11px] text-secondary font-medium w-10">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

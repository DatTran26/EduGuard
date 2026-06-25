import Card from "../../../components/common/Card";
import Badge from "../../../components/common/Badge";

// Mock student names to make it look like a real live view
const MOCK_STUDENTS = [
  { id: 1, name: "Nguyễn Hoàng Nam", code: "SV08492" },
  { id: 2, name: "Trần Thị Minh Thư", code: "SV08511" },
  { id: 3, name: "Phạm Minh Đức", code: "SV08422" },
  { id: 4, name: "Lê Thanh Hằng", code: "SV08605" },
];

export default function ProctoringStreamsPlaceholder() {
  return (
    <Card className="relative overflow-hidden border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">
            Giám sát phòng thi trực tiếp (Real-time Stream Monitor)
          </h3>
          <p className="text-xs text-secondary mt-1">
            Theo dõi đồng thời webcam và màn hình chia sẻ của sinh viên thông qua luồng WebRTC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="caution">Beta</Badge>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral text-[11px] font-semibold text-secondary border border-border">
            <span className="w-2 h-2 rounded-full bg-secondary block"></span>
            Chưa có luồng truyền
          </div>
        </div>
      </div>

      {/* Grid of mock streams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 filter blur-[1px]">
        {MOCK_STUDENTS.map((student) => (
          <div
            key={student.id}
            className="flex flex-col rounded-[16px] border border-border bg-neutral overflow-hidden"
          >
            {/* Webcam Stream Placeholder */}
            <div className="relative aspect-video bg-surface-sunken flex flex-col items-center justify-center border-b border-border">
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-secondary font-medium mt-2">
                Chờ webcam...
              </span>
            </div>

            {/* Screen Stream Placeholder */}
            <div className="relative aspect-video bg-surface-sunken flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-secondary font-medium mt-2">
                Chờ chia sẻ màn hình...
              </span>
            </div>

            {/* Student Info Bar */}
            <div className="p-3 bg-surface border-t border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-primary truncate max-w-[120px]">
                {student.name}
              </span>
              <span className="font-mono text-[9px] text-secondary tracking-wider">
                {student.code}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Premium glassmorphic development overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/75 backdrop-blur-[4px] p-6 text-center z-10">
        <div className="max-w-md space-y-4">
          <div className="mx-auto w-12 h-12 rounded-[16px] bg-caution-muted flex items-center justify-center text-caution border border-caution/15">
            <svg
              className="w-6 h-6 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Tính năng đang phát triển
            </h4>
            <p className="text-sm leading-6 text-secondary mt-2">
              Hệ thống giám sát luồng webcam và chia sẻ màn hình trực tiếp thông
              qua <strong>SignalR & WebRTC</strong> đang được xây dựng. Trong
              phiên bản chính thức, giảng viên sẽ có thể theo dõi và can thiệp
              phòng thi thời gian thực.
            </p>
          </div>
          <div className="inline-block px-3 py-1.5 rounded-[8px] bg-neutral border border-border text-[11px] font-semibold text-secondary">
            Dự kiến khả dụng trong Quý III / 2026
          </div>
        </div>
      </div>
    </Card>
  );
}

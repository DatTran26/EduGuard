import { InfinityLoader } from "@/components/ui/loader-13";
import { cn } from "../../utils/cn";

export default function LoadingScreen({
  title = "Đang tải",
  message = "Vui lòng chờ trong giây lát…",
  className,
}) {
  return (
    <div
      className={cn(
        "flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-5 rounded-[28px] border border-border bg-surface p-8 text-center shadow-[0_18px_40px_rgb(15_23_42/10%)]">
        <div className="relative">
          <span
            className="absolute -inset-6 rounded-full bg-tertiary/10 blur-2xl"
            aria-hidden="true"
          />
          <InfinityLoader
            size={56}
            className="relative [&>svg>path:last-child]:stroke-tertiary"
            aria-label={title}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold text-primary">{title}</p>
          <p className="text-sm text-secondary">{message}</p>
        </div>

        <div className="h-px w-full bg-border" />

        <p className="text-[11px] font-medium text-secondary">
          Nếu màn hình này hiển thị quá lâu, hãy thử tải lại trang.
        </p>
      </div>
    </div>
  );
}

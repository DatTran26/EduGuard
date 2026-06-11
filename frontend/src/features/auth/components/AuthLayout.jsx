import { Link } from "react-router-dom";
import Card from "../../../components/common/Card";

// Layout này dùng chung cho login và register để giao diện xác thực nhìn gọn và nhất quán hơn.
export default function AuthLayout({
  title,
  description,
  footerText,
  footerLinkLabel,
  footerLinkTo,
  children,
}) {
  return (
    <div className="min-h-screen bg-neutral px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1180px] gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-primary bg-primary px-6 py-6 text-white md:px-8 md:py-8">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-white/65">
                    EduGuard
                  </p>
                  <p className="mt-2 text-sm text-white/70">Lớp học • Bài thi • Giám sát</p>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/75">
                  Bản demo
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-lg text-[2.7rem] font-semibold leading-tight tracking-tight">
                  Không gian học tập và thi trực tuyến.
                </h1>
                <p className="max-w-md text-sm leading-7 text-white/72">
                  Tiếp tục vào lớp học, bài thi và phần theo dõi của bạn.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[0.82rem] font-medium text-white/65">Lớp học</p>
                  <p className="mt-2 text-lg font-semibold">Gọn gàng</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[0.82rem] font-medium text-white/65">Bài thi</p>
                  <p className="mt-2 text-lg font-semibold">Rõ tiến độ</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[0.82rem] font-medium text-white/65">Giám sát</p>
                  <p className="mt-2 text-lg font-semibold">Ít nhiễu mắt</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/72">
                Giáo viên
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/72">
                Học sinh
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/72">
                Quản trị viên
              </span>
            </div>
          </div>
        </section>

        <Card className="flex items-center rounded-[28px] p-6 md:p-8">
          <div className="mx-auto w-full max-w-[440px] space-y-6">
            <div className="space-y-2">
              <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-secondary">
                Xác thực
              </p>
              <h2 className="text-[2rem] font-semibold leading-tight text-primary">{title}</h2>
              <p className="text-sm leading-6 text-secondary">{description}</p>
            </div>

            {children}

            <p className="text-sm text-secondary">
              {footerText}{" "}
              <Link className="font-semibold text-link hover:underline" to={footerLinkTo}>
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

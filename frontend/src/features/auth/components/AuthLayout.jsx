import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-[#F5F7FA] px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1320px] gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#0F2F57_0%,#173A69_56%,#0A213D_100%)] px-7 py-8 text-white md:px-10 md:py-10 lg:px-12 lg:py-12">
          <div className="absolute -right-16 top-12 h-48 w-48 rounded-full bg-[#D4A94F]/12 blur-3xl" />
          <div className="absolute -left-12 bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col gap-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <img
                alt="Logo EduGuard"
                className="h-28 w-auto object-contain md:h-32 lg:h-36"
                src="/logo-transparent.png"
              />
              <p className="text-[clamp(2rem,4vw,3.6rem)] font-semibold tracking-[0.02em] text-white">
                EduGuard
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <p className="whitespace-nowrap text-[clamp(1.24rem,2.7vw,2.7rem)] font-semibold leading-none tracking-tight text-white">
                    Học tập an toàn.
                  </p>
                  <p className="whitespace-nowrap text-[clamp(1.12rem,2.45vw,2.45rem)] font-semibold leading-none tracking-tight text-[#FFF6E3]">
                    Thi trực tuyến minh bạch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/65 bg-white px-6 py-8 shadow-[0_28px_80px_rgba(15,47,87,0.10)] md:px-10 md:py-10 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-[440px] space-y-8">
              <div className="space-y-3">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-[#0F2F57]/66">
                  XÁC THỰC TÀI KHOẢN
                </p>
                <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-[#0F2F57] md:text-[2.4rem]">
                  {title}
                </h2>
                <p className="text-sm leading-7 text-[#5F6E82] md:text-[0.95rem]">
                  {description}
                </p>
              </div>

              {children}

              <p className="text-sm leading-6 text-[#5F6E82]">
                {footerText}{" "}
                <Link
                  className="font-semibold text-[#1479E8] transition-colors duration-200 hover:text-[#0F2F57] hover:underline"
                  to={footerLinkTo}
                >
                  {footerLinkLabel}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

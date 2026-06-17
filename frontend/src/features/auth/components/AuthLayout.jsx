import { Link } from "react-router-dom";

// Layout này dùng chung cho login và register để giao diện xác thực nhìn gọn, đồng bộ và dễ đọc trên mobile.
export default function AuthLayout({
  title,
  description,
  footerText,
  footerLinkLabel,
  footerLinkTo,
  children,
}) {
  return (
    <div className="eg-auth-shell">
      <div className="eg-auth-grid">
        <section aria-label="Nhận diện thương hiệu EduGuard" className="eg-auth-hero">
          <div className="eg-auth-hero-content">
            <div className="eg-auth-brand">
              <div className="eg-auth-brand-mark">
                <img
                  alt="Logo EduGuard"
                  className="eg-auth-brand-logo"
                  src="/logo-transparent.png"
                />
              </div>

              <div className="eg-auth-brand-copy">
                <p className="eg-auth-brand-title">EduGuard</p>

                <div className="eg-auth-tagline">
                  <p className="eg-auth-tagline-line">Học tập an toàn</p>
                  <p className="eg-auth-tagline-line">Thi trực tuyến minh bạch</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="eg-auth-panel-wrap">
          <div className="eg-auth-panel">
            <div className="eg-auth-panel-inner">
              <div className="eg-auth-panel-copy">
                <p className="eg-auth-panel-kicker">Xác thực tài khoản</p>
                <h1 className="eg-auth-panel-title">{title}</h1>
                {description ? <p className="eg-auth-panel-description">{description}</p> : null}
              </div>

              {children}

              <p className="eg-auth-footer">
                {footerText}{" "}
                <Link className="eg-auth-inline-link" to={footerLinkTo}>
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

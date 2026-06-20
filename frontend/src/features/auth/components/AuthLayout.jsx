import { Link } from "react-router-dom";
import { FiShield, FiBarChart2, FiBook } from "react-icons/fi";

const BRAND_FEATURES = [
  {
    icon: <FiShield size={16} />,
    text: "Giám sát chống gian lận thời gian thực",
  },
  {
    icon: <FiBarChart2 size={16} />,
    text: "Phân tích kết quả và hành vi học tập",
  },
  {
    icon: <FiBook size={16} />,
    text: "Quản lý lớp học và bài thi dễ dàng",
  },
];

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
        {/* ── Left: Branding Panel ── */}
        <section aria-label="Nhận diện thương hiệu EduGuard" className="eg-auth-hero">
          <div className="eg-auth-hero-content">
            <div className="eg-auth-brand">
              {/* Logo */}
              <div className="eg-auth-brand-mark">
                <img
                  alt="Logo EduGuard"
                  className="eg-auth-brand-logo"
                  src="/logo-transparent.png"
                />
              </div>

              {/* Copy */}
              <div className="eg-auth-brand-copy">
                <p className="eg-auth-brand-title">EduGuard</p>

                <div className="eg-auth-tagline">
                  <p className="eg-auth-tagline-line">Học tập an toàn.</p>
                  <p className="eg-auth-tagline-line">Thi trực tuyến minh bạch.</p>
                </div>

                {/* <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "1.7",
                    color: "rgb(148 163 184 / 90%)",
                    maxWidth: "32ch",
                  }}
                >
                  Nền tảng lớp học và thi trực tuyến tích hợp giám sát chống gian lận.
                </p> */}

                {/* Feature list */}
                <ul className="eg-auth-feature-list" aria-label="Tính năng nổi bật">
                  {BRAND_FEATURES.map((feature) => (
                    <li key={feature.text} className="eg-auth-feature-item">
                      <span className="eg-auth-feature-icon" aria-hidden="true">
                        {feature.icon}
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: Auth Card ── */}
        <section className="eg-auth-panel-wrap">
          <div className="eg-auth-panel eg-auth-card-enter">
            <div className="eg-auth-panel-inner">
              <div className="eg-auth-panel-copy">
                <p className="eg-auth-panel-kicker">Xác thực tài khoản</p>
                <h1 className="eg-auth-panel-title">{title}</h1>
                {description ? (
                  <p className="eg-auth-panel-description">{description}</p>
                ) : null}
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

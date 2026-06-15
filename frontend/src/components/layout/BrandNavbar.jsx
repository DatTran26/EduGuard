import { NavLink } from "react-router-dom";
import Badge from "../common/Badge";
import { useAuth } from "../../hooks/useAuth";
import { getNavigationItemsByRole, getRoleLabel } from "../../routes/roleRoutes";
import { cn } from "../../utils/cn";

// Hàm này chọn ra nhóm link chính để đưa lên thanh brand bar, ưu tiên các khu chức năng hơn là hồ sơ.
function getBrandNavigationItems(navigationItems) {
  return navigationItems.filter((item) => item.label !== "Hồ sơ").slice(0, 4);
}

// Hàm này trả class cho quick link trên brand bar để active route nhìn rõ nhưng vẫn nhẹ nhàng.
function getQuickLinkClassName({ isActive }) {
  return cn(
    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-primary text-white shadow-[0_12px_24px_rgba(29,29,31,0.18)]"
      : "bg-neutral text-secondary hover:bg-[rgba(29,29,31,0.06)] hover:text-primary",
  );
}

// Thanh này là navbar ngang phía trên cùng để chừa chỗ cho logo, thương hiệu và vài link điều hướng nhanh.
export default function BrandNavbar() {
  const { user } = useAuth();
  const navigationItems = getBrandNavigationItems(getNavigationItemsByRole(user?.role));

  return (
    <header className="rounded-[28px] border border-border bg-surface px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#14233C,#2D5B8C)] text-lg font-semibold text-white shadow-[0_12px_28px_rgba(20,35,60,0.24)]">
            EG
          </div>
          <div className="space-y-1">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-secondary">
              Logo / Thương hiệu
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-primary">EduGuard Workspace</h2>
              <Badge variant="info">{getRoleLabel(user?.role)}</Badge>
            </div>
            <p className="text-sm leading-6 text-secondary">
              Thanh trên cùng này đang chừa sẵn không gian để bạn đặt logo và bộ nhận diện riêng.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navigationItems.map((item) => (
            <NavLink key={item.path} className={getQuickLinkClassName} to={item.path}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

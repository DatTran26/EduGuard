import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

// Hàm này trả class cho từng item trong sidebar để route đang active nhìn rõ hơn.
function getNavigationLinkClassName({ isActive }) {
  return cn(
    "block rounded-[18px] px-4 py-3 text-sm font-medium transition-all duration-200",
    isActive ? "eg-sidebar-link-active" : "eg-sidebar-link-idle",
  );
}

// Component này là thanh điều hướng bên trái cho khu vực đã đăng nhập.
export default function Sidebar({ navigationItems, roleLabel }) {
  return (
    <aside aria-label="Menu điều hướng chính" className="min-w-0 self-start">
      <div className="eg-shell-panel flex flex-col gap-4 rounded-r-[28px] rounded-l-none p-5">
        <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-secondary">
          {roleLabel}
        </p>

        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            <NavLink key={item.path} className={getNavigationLinkClassName} to={item.path}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

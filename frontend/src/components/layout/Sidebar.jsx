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
export default function Sidebar({
  isOpen,
  navigationItems,
  roleLabel,
  onNavigate,
  onClose,
}) {
  return (
    <>
      <button
        aria-hidden={!isOpen}
        aria-label="Đóng menu điều hướng"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ease-out lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        tabIndex={isOpen ? 0 : -1}
        type="button"
        onClick={onClose}
      />

      <aside
        aria-label="Menu điều hướng chính"
        id="app-sidebar"
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-[min(86vw,304px)] shrink-0 transform-gpu transition-transform duration-[240ms] ease-out lg:sticky lg:top-4 lg:z-auto lg:h-[calc(100vh-2rem)] lg:w-[286px] lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+16px)]",
        )}
      >
      <div
        className="eg-shell-panel flex h-full flex-col gap-4 rounded-r-[28px] p-5 lg:rounded-[30px]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-secondary">
              {roleLabel}
            </p>
            <h2 className="text-xl font-semibold text-primary">Menu chức năng</h2>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-border text-secondary transition-colors duration-200 hover:bg-surface-sunken hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:hidden"
            aria-label="Đóng menu điều hướng"
            onClick={onClose}
          >
            <span aria-hidden="true" className="text-lg leading-none">×</span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              className={getNavigationLinkClassName}
              onClick={onNavigate}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      </aside>
    </>
  );
}

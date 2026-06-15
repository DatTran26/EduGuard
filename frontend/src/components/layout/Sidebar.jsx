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
  onNavigate,
  onClose,
}) {
  // Hàm này đóng sidebar khi người dùng bấm ra ngoài vùng panel trên mobile.
  function handleOverlayClick() {
    onClose();
  }

  // Hàm này chặn sự kiện nổi bọt để click trong panel không làm sidebar bị đóng ngoài ý muốn.
  function handlePanelClick(event) {
    event.stopPropagation();
  }

  return (
    <aside
      className={cn(
        "fixed inset-0 z-40 bg-black/35 transition-opacity duration-200 lg:static lg:block lg:bg-transparent",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100",
      )}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          "eg-shell-panel flex h-full w-[286px] flex-col gap-4 p-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-[calc(100vh-12rem)] lg:rounded-[30px]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        onClick={handlePanelClick}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-secondary">
              Điều hướng
            </p>
            <h2 className="text-xl font-semibold text-primary">Menu chức năng</h2>
          </div>
          <button
            type="button"
            className="rounded-[14px] border border-border px-3 py-2 text-sm text-secondary lg:hidden"
            onClick={onClose}
          >
            Đóng
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
  );
}

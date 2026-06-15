import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

// Hàm này trả class cho từng item trong sidebar để route đang active nhìn rõ hơn.
function getNavigationLinkClassName({ isActive }) {
  return cn(
    "block rounded-[14px] px-4 py-3 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-white/10 text-white font-semibold shadow-sm border border-white/5"
      : "text-slate-400 hover:bg-white/5 hover:text-white",
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
        "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:static lg:block lg:bg-transparent",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100",
      )}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          "flex h-full w-[280px] flex-col gap-6 bg-obsidian border-r border-white/10 p-5 transition-transform duration-200 lg:h-screen lg:rounded-none lg:border-r lg:border-white/5 lg:sticky lg:top-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        onClick={handlePanelClick}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <img
              alt="Logo EduGuard"
              className="h-8 w-auto object-contain"
              src="/logo.png"
            />
            <div>
              <h2 className="text-base font-bold tracking-tight text-white leading-none">
                EduGuard
              </h2>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 mt-1">
                Workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-[12px] border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white lg:hidden"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
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

        <div className="border-t border-white/10 pt-4 mt-auto">
          <p className="text-[10px] text-slate-500 font-medium text-center">
            EduGuard Shield v1.1.0
          </p>
        </div>
      </div>
    </aside>
  );
}


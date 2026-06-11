import { NavLink } from "react-router-dom";
import Avatar from "../common/Avatar";
import { cn } from "../../utils/cn";

// Hàm này trả class cho từng item trong sidebar để route đang active nhìn rõ hơn.
function getNavigationLinkClassName({ isActive }) {
  return cn(
    "block rounded-[12px] px-4 py-3 text-sm font-medium transition-colors duration-150",
    isActive
      ? "bg-[rgba(0,113,227,0.10)] text-primary"
      : "text-secondary hover:bg-[rgba(29,29,31,0.05)] hover:text-primary",
  );
}

// Component này là thanh điều hướng bên trái cho khu vực đã đăng nhập.
export default function Sidebar({
  isOpen,
  navigationItems,
  onNavigate,
  onClose,
  userAvatarUrl,
  userEmail,
  roleLabel,
  userName,
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
          "flex h-full w-[290px] flex-col gap-6 border-r border-border bg-surface p-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-[calc(100vh-12.2rem)] lg:rounded-[24px] lg:border lg:shadow-[0_18px_36px_rgba(15,23,42,0.05)]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        onClick={handlePanelClick}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-secondary">
                Điều hướng
              </p>
              <h2 className="text-xl font-semibold text-primary">Menu chức năng</h2>
            </div>
            <button
              type="button"
              className="rounded-[12px] border border-border px-3 py-2 text-sm text-secondary lg:hidden"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
          <div className="rounded-[20px] border border-border bg-[linear-gradient(180deg,#ffffff,#f6fbf7)] p-4">
            <div className="flex items-center gap-3">
              <Avatar
                alt={`Ảnh đại diện của ${userName}`}
                name={userName}
                sizeClassName="h-14 w-14"
                src={userAvatarUrl}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{userName}</p>
                <p className="mt-1 truncate text-sm text-secondary">{userEmail}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-secondary">
                {roleLabel}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-secondary">
                Demo
              </span>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          <p className="px-2 text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-secondary">
            Điều hướng
          </p>
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

        <div className="mt-auto rounded-[18px] border border-border bg-neutral p-4 text-sm leading-6 text-secondary">
          Bố cục sidebar đã được hạ xuống dưới brand bar để bạn dễ gắn thêm logo và bộ nhận diện riêng ở phía trên.
        </div>
      </div>
    </aside>
  );
}

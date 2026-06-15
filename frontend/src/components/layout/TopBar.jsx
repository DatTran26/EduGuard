import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import { getProfileRouteByRole, getRoleLabel } from "../../routes/roleRoutes";
import { routeConfig } from "../../routes/routeConfig";

function buildUserMenuItems(isDarkMode) {
  return [
    { label: "Thông tin", action: "profile" },
    { label: "Đổi mật khẩu", action: "password" },
    {
      label: isDarkMode ? "Trở về chế độ sáng" : "Bật chế độ tối",
      action: "theme",
    },
    { label: "EduGuard Premium", action: "premium" },
  ];
}

function DropdownChevronIcon({ isOpen }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

// Component này là header chính của khu đã đăng nhập, gom logo, user menu và hành động đăng xuất.
export default function TopBar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuItems = buildUserMenuItems(isDarkMode);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    // Hàm này đóng dropdown khi người dùng bấm ra ngoài vùng menu.
    function handlePointerDown(event) {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    // Hàm này cho phép đóng menu nhanh bằng phím Escape để trải nghiệm bàn phím tự nhiên hơn.
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isUserMenuOpen]);

  // Hàm này đóng dropdown menu người dùng để các thao tác điều hướng phía sau gọn hơn.
  function closeUserMenu() {
    setIsUserMenuOpen(false);
  }

  // Hàm này đảo trạng thái mở/đóng của dropdown người dùng khi bấm vào thẻ profile.
  function toggleUserMenu() {
    setIsUserMenuOpen((previousValue) => !previousValue);
  }

  // Hàm này đưa người dùng tới trang hồ sơ từ dropdown mà không đổi logic trang hồ sơ hiện tại.
  function handleProfileClick() {
    closeUserMenu();
    navigate(getProfileRouteByRole(user?.role));
  }

  // Hàm này giữ chỗ cho các mục dropdown mới mà chưa can thiệp vào logic nghiệp vụ của hệ thống.
  function handleComingSoonAction(featureName) {
    closeUserMenu();
    showToast({
      tone: "info",
      title: featureName,
      message: "Mục này đang được hoàn thiện để đồng bộ với hệ thống EduGuard.",
    });
  }

  // Hàm này đổi theme sáng/tối của toàn app để người dùng chuyển nhanh chế độ làm việc.
  function handleThemeToggle() {
    const nextIsDarkMode = !isDarkMode;
    closeUserMenu();
    toggleTheme();
    showToast({
      tone: "success",
      title: nextIsDarkMode ? "Đã bật chế độ tối" : "Đã trở về chế độ sáng",
      message: nextIsDarkMode
        ? "Giao diện EduGuard đã chuyển sang nền tối để làm việc ban đêm dễ hơn."
        : "Giao diện EduGuard đã quay lại tông sáng mặc định.",
    });
  }

  // Hàm này xử lý click từng item trong dropdown theo đúng loại hành động đã khai báo.
  function handleUserMenuItemClick(action) {
    if (action === "profile") {
      handleProfileClick();
      return;
    }

    if (action === "password") {
      handleComingSoonAction("Đổi mật khẩu");
      return;
    }

    if (action === "theme") {
      handleThemeToggle();
      return;
    }

    handleComingSoonAction("EduGuard Premium");
  }

  // Hàm này xử lý đăng xuất rồi đưa người dùng về lại màn đăng nhập.
  async function handleLogoutClick() {
    closeUserMenu();
    await logout();
    showToast({
      tone: "success",
      title: "Đăng xuất thành công",
      message: "Phiên làm việc đã được đóng an toàn.",
    });
    navigate(routeConfig.login);
  }

  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Nút menu trên mobile */}
        <button
          type="button"
          className="rounded-[10px] border border-border p-2 text-primary lg:hidden hover:bg-surface-sunken transition-all duration-200"
          onClick={onOpenSidebar}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo trên mobile */}
        <img
          alt="Logo EduGuard"
          className="h-8 w-auto object-contain lg:hidden"
          src="/logo.png"
        />

        {/* Thanh tìm kiếm trên desktop */}
        <div className="relative hidden md:block w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm lớp học, sinh viên, bài thi..."
            className="w-full bg-surface-sunken border border-border rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary text-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="info">{getRoleLabel(user?.role)}</Badge>

        <div className="relative" ref={userMenuRef}>
          <button
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            className="eg-user-trigger flex items-center gap-3 rounded-full px-3 py-1.5 text-left transition-all duration-200"
            type="button"
            onClick={toggleUserMenu}
          >
            <Avatar
              alt={`Ảnh đại diện của ${user?.fullName ?? "người dùng"}`}
              name={user?.fullName ?? ""}
              sizeClassName="h-8 w-8"
              src={user?.avatarUrl ?? ""}
            />
            <div className="hidden sm:block min-w-0">
              <p className="truncate text-xs font-semibold text-primary">
                {user?.fullName ?? "Người dùng EduGuard"}
              </p>
            </div>
            <DropdownChevronIcon isOpen={isUserMenuOpen} />
          </button>

          {isUserMenuOpen ? (
            <div
              className="eg-dropdown-panel absolute right-0 top-[calc(100%+8px)] z-20 w-[260px] overflow-hidden rounded-[20px] p-2"
              role="menu"
            >
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-xs font-semibold text-primary">
                  {user?.fullName ?? "Người dùng"}
                </p>
                <p className="truncate pt-0.5 text-[10px] text-secondary">
                  {user?.email ?? "user@eduguard.local"}
                </p>
              </div>

              <div className="space-y-0.5 p-1">
                {userMenuItems.map((item) => (
                  <button
                    key={item.label}
                    className="eg-user-menu-item flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-xs font-medium"
                    role="menuitem"
                    type="button"
                    onClick={() => handleUserMenuItemClick(item.action)}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-secondary">›</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border px-1 pb-1 pt-2">
                <Button
                  className="w-full rounded-[12px] py-2 min-h-0 text-xs"
                  variant="secondary"
                  onClick={handleLogoutClick}
                >
                  Đăng xuất
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}


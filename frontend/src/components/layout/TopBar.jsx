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
import { cn } from "../../utils/cn";

function buildUserMenuItems(isDarkMode) {
  return [
    { label: "Thông tin", action: "profile" },
    { label: "Đổi mật khẩu", action: "password" },
    { label: isDarkMode ? "Trở về chế độ sáng" : "Bật chế độ tối", action: "theme" },
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
export default function TopBar() {
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
    <header className="eg-shell-panel rounded-[32px] px-5 py-5 md:px-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden transition-all duration-200",
              isDarkMode
                ? "rounded-[20px] border border-white/12 bg-white/6 p-2 shadow-[0_14px_28px_rgba(0,0,0,0.26)]"
                : "rounded-none border-transparent bg-transparent p-0 shadow-none",
            )}
          >
            <img
              alt="Logo EduGuard"
              className="h-11 w-auto shrink-0 object-contain md:h-[3rem]"
              src="/logo.png"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-primary md:text-[2rem]">
              EduGuard Workspace
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-secondary">
              {`Chào ${user?.fullName ?? "Người dùng EduGuard"}, tiếp tục công việc nhé.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-3 xl:justify-end">
          <Badge variant="info">{getRoleLabel(user?.role)}</Badge>

          <div
            className="relative min-w-0 basis-full sm:basis-auto"
            ref={userMenuRef}
          >
            <button
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              className="eg-user-trigger flex w-full min-w-0 items-center gap-3 rounded-full px-3 py-2 text-left sm:min-w-[300px]"
              type="button"
              onClick={toggleUserMenu}
            >
              <Avatar
                alt={`Ảnh đại diện của ${user?.fullName ?? "người dùng"}`}
                name={user?.fullName ?? ""}
                sizeClassName="h-11 w-11"
                src={user?.avatarUrl ?? ""}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">
                  {user?.fullName ?? "Người dùng EduGuard"}
                </p>
                <p className="truncate text-xs text-secondary">
                  {user?.email ?? "user@eduguard.local"}
                </p>
              </div>
              <DropdownChevronIcon isOpen={isUserMenuOpen} />
            </button>

            {isUserMenuOpen ? (
              <div
                className="eg-dropdown-panel absolute right-0 top-[calc(100%+12px)] z-20 w-[min(320px,calc(100vw-2.5rem))] overflow-hidden rounded-[26px] p-2"
                role="menu"
              >
                <div className="border-b border-border px-3 py-3">
                  <p className="truncate text-sm font-semibold text-primary">
                    {user?.fullName ?? "Người dùng EduGuard"}
                  </p>
                  <p className="truncate pt-1 text-xs text-secondary">
                    {user?.email ?? "user@eduguard.local"}
                  </p>
                </div>

                <div className="space-y-1 p-2">
                  {userMenuItems.map((item) => (
                    <button
                      key={item.label}
                      className="eg-user-menu-item flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium"
                      role="menuitem"
                      type="button"
                      onClick={() => handleUserMenuItemClick(item.action)}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-secondary">›</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-border px-2 pb-2 pt-3">
                  <Button
                    className="w-full rounded-[18px]"
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
      </div>
    </header>
  );
}

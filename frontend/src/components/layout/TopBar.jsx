import { Fragment, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import { getProfileRouteByRole, getRoleLabel } from "../../routes/roleRoutes";
import { routeConfig } from "../../routes/routeConfig";
import {
  FiBell,
  FiChevronRight,
  FiChevronDown,
  FiLogOut,
  FiMoon,
  FiSun,
  FiStar,
  FiUser,
} from "react-icons/fi";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/flexnative-breadcrumb";

const NOTIFICATION_STORAGE_KEY = "eg.notifications.items.v1";
const NOTIFICATION_LAST_SEEN_KEY = "eg.notifications.lastSeenAt.v1";
const BREADCRUMB_MAX_VISIBLE = 4;

const breadcrumbLabelBySegment = {
  classrooms: "Lớp học",
  exams: "Bài kiểm tra",
  dashboard: "Dashboard",
  profile: "Hồ sơ",
  users: "Người dùng",
  join: "Tham gia lớp",
};

function labelForBreadcrumbSegment(segment) {
  return breadcrumbLabelBySegment[segment] || segment;
}

function buildBreadcrumbTrail(pathname) {
  const segments = (pathname || "/").split("/").filter(Boolean);
  const rolePrefix = segments[0] || "";
  const tail = segments.slice(1);

  const items = [
    {
      label: "Trang chủ",
      href: rolePrefix ? `/${rolePrefix}/dashboard` : "/",
    },
  ];

  let acc = rolePrefix ? `/${rolePrefix}` : "";
  for (const segment of tail) {
    acc += `/${segment}`;
    items.push({
      label: labelForBreadcrumbSegment(segment),
      href: acc,
    });
  }

  if (items.length <= BREADCRUMB_MAX_VISIBLE) {
    return items;
  }

  return [
    items[0],
    { isEllipsis: true },
    ...items.slice(-(BREADCRUMB_MAX_VISIBLE - 2)),
  ];
}

const breadcrumbTextClass =
  "block max-w-[5.5rem] truncate sm:max-w-[7rem] xl:max-w-[9rem] 2xl:max-w-[11rem]";

function buildUserMenuItems(isDarkMode) {
  return [
    {
      label: isDarkMode ? "Trở về chế độ sáng" : "Bật chế độ tối",
      action: "theme",
    },
    { label: "EduGuard Premium", action: "premium" },
  ];
}

function DropdownChevronIcon({ isOpen }) {
  return (
    <FiChevronDown
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
    />
  );
}

function BellIcon() {
  return <FiBell aria-hidden="true" className="h-5 w-5" />;
}

function MenuArrowIcon() {
  return <FiChevronRight aria-hidden="true" className="h-4 w-4 text-secondary" />;
}

function TeacherIcon() {
  return <HiOutlineAcademicCap aria-hidden="true" className="h-4 w-4" />;
}

function RoleEmailBadge({ role }) {
  // Hiện icon giảng viên ở vị trí email (như screenshot). Role khác dùng icon trung tính.
  const icon =
    role === "Teacher" ? (
      <TeacherIcon />
    ) : (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 20c1.7-3.2 4.2-5 7.5-5s5.8 1.8 7.5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-sunken text-primary">
      {icon}
    </span>
  );
}

function safeParseNotifications() {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteNotifications(items) {
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function safeGetLastSeenAt() {
  try {
    return window.localStorage.getItem(NOTIFICATION_LAST_SEEN_KEY) || "";
  } catch {
    return "";
  }
}

function safeSetLastSeenAt(value) {
  try {
    window.localStorage.setItem(NOTIFICATION_LAST_SEEN_KEY, value);
  } catch {
    // ignore
  }
}

// Component này là header chính của khu đã đăng nhập, gom logo, user menu và hành động đăng xuất.
export default function TopBar({
  onOpenSidebar,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState(() => safeParseNotifications());
  const [lastSeenAt, setLastSeenAt] = useState(() => safeGetLastSeenAt());
  const userMenuItems = buildUserMenuItems(isDarkMode);

  useEffect(() => {
    if (!isUserMenuOpen && !isNotificationOpen) {
      return undefined;
    }

    // Hàm này đóng dropdown khi người dùng bấm ra ngoài vùng menu.
    function handlePointerDown(event) {
      const isInsideUserMenu = userMenuRef.current?.contains(event.target);
      const isInsideNotifications = notificationRef.current?.contains(event.target);

      if (!isInsideUserMenu && !isInsideNotifications) {
        setIsUserMenuOpen(false);
        setIsNotificationOpen(false);
      }
    }

    // Hàm này cho phép đóng menu nhanh bằng phím Escape để trải nghiệm bàn phím tự nhiên hơn.
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isUserMenuOpen, isNotificationOpen]);

  useEffect(() => {
    function handleIncomingNotification(event) {
      const nextItem = event?.detail;
      if (!nextItem?.id) {
        return;
      }
      setNotificationItems((previousValue) => [nextItem, ...previousValue].slice(0, 30));
    }

    window.addEventListener("eduguard:notification", handleIncomingNotification);
    return () => window.removeEventListener("eduguard:notification", handleIncomingNotification);
  }, []);

  // Hàm này đóng dropdown menu người dùng để các thao tác điều hướng phía sau gọn hơn.
  function closeUserMenu() {
    setIsUserMenuOpen(false);
  }

  // Hàm này đảo trạng thái mở/đóng của dropdown người dùng khi bấm vào thẻ profile.
  function toggleUserMenu() {
    setIsNotificationOpen(false);
    setIsUserMenuOpen((previousValue) => !previousValue);
  }

  function toggleNotifications() {
    setIsUserMenuOpen(false);
    setIsNotificationOpen((previousValue) => {
      const nextValue = !previousValue;
      if (nextValue) {
        const nowIso = new Date().toISOString();
        safeSetLastSeenAt(nowIso);
        setLastSeenAt(nowIso);
      }
      return nextValue;
    });
  }

  function clearNotifications() {
    const nextItems = [];
    setNotificationItems(nextItems);
    safeWriteNotifications(nextItems);
    const nowIso = new Date().toISOString();
    safeSetLastSeenAt(nowIso);
    setLastSeenAt(nowIso);
    showToast({
      tone: "success",
      title: "Đã dọn thông báo",
      message: "Danh sách thông báo đã được làm sạch.",
    });
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

  const unreadCount = notificationItems.filter((item) => item?.createdAt && item.createdAt > lastSeenAt).length;
  const roleLabel = getRoleLabel(user?.role);

  const breadcrumbItems = buildBreadcrumbTrail(location?.pathname);

  return (
    <header className="z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3 md:gap-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3 lg:max-w-[min(38%,20rem)] xl:max-w-[min(42%,26rem)]">
        {/* Nút menu trên mobile */}
        <button
          type="button"
          className="shrink-0 rounded-[10px] border border-border p-2 text-primary lg:hidden hover:bg-surface-sunken transition-all duration-200"
          onClick={onOpenSidebar}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo trên mobile */}
        <img
          alt="Logo EduGuard"
          className="h-8 w-auto shrink-0 object-contain lg:hidden"
          src="/logo.png"
        />

        {/* Breadcrumb sát góc trái (desktop) */}
        <Breadcrumb className="hidden min-w-0 lg:block">
          <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden sm:gap-1.5">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;

              if (item.isEllipsis) {
                return (
                  <Fragment key={`ellipsis-${index}`}>
                    <BreadcrumbSeparator className="shrink-0 text-secondary/60" />
                    <BreadcrumbItem className="shrink-0">
                      <BreadcrumbEllipsis className="text-secondary" />
                    </BreadcrumbItem>
                  </Fragment>
                );
              }

              return (
                <Fragment key={`${item.label}-${index}`}>
                  {index > 0 ? (
                    <BreadcrumbSeparator className="shrink-0 text-secondary/60" />
                  ) : null}
                  <BreadcrumbItem className="min-w-0 shrink">
                    {isLast ? (
                      <BreadcrumbPage
                        className={cn("text-secondary", breadcrumbTextClass)}
                        title={item.label}
                      >
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className={cn("text-secondary", breadcrumbTextClass)}
                        href={item.href}
                        title={item.label}
                      >
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Thanh tìm kiếm căn giữa header (md+) */}
      <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
        <div className="relative w-full max-w-[520px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm lớp học, sinh viên, bài thi..."
            className="w-full bg-surface-sunken border border-border rounded-full py-1.5 pl-9 pr-4 text-xs text-primary placeholder:text-secondary transition-all duration-200 focus:outline-none focus:border-tertiary focus:ring-3 focus:ring-tertiary/16"
          />
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-4">
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotifications}
            aria-expanded={isNotificationOpen}
            aria-haspopup="menu"
            className="relative inline-flex items-center justify-center rounded-full border border-border bg-surface px-3 py-2 text-primary hover:bg-surface-sunken transition-all duration-200"
            title="Thông báo"
          >
            <BellIcon />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          {isNotificationOpen ? (
            <div
              className="eg-dropdown-panel absolute right-0 top-[calc(100%+8px)] z-20 w-[340px] overflow-hidden rounded-[20px] p-2"
              role="menu"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-primary">Thông báo</p>
                  <p className="pt-0.5 text-[10px] text-secondary">
                    {notificationItems.length > 0 ? "Cập nhật theo thời gian thực" : "Chưa có thông báo nào"}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-[12px] border border-border px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-surface-sunken hover:text-primary transition-all duration-200"
                  onClick={clearNotifications}
                  disabled={notificationItems.length === 0}
                >
                  Dọn
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-1">
                {notificationItems.length > 0 ? (
                  <div className="space-y-1">
                    {notificationItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[16px] border border-border bg-surface px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-primary">
                              {item.title || "Thông báo"}
                            </p>
                            <p className="pt-1 text-[11px] leading-relaxed text-secondary">
                              {item.message || "Bạn có thông báo mới."}
                            </p>
                          </div>
                          <span
                            className={`mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                              item.tone === "danger"
                                ? "bg-rose-500"
                                : item.tone === "success"
                                  ? "bg-emerald-500"
                                  : "bg-sky-500"
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                        {item.createdAt ? (
                          <p className="pt-2 text-[10px] font-medium text-secondary/80">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8">
                    <p className="text-xs font-semibold text-primary">Không có thông báo mới.</p>
                    <p className="pt-1 text-[11px] text-secondary">
                      Khi hệ thống đẩy cảnh báo/nhắc nhở, chúng sẽ xuất hiện ở đây.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

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
                <div className="flex items-center gap-2 pt-1">
                  <RoleEmailBadge role={user?.role} />
                  <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[10px] font-extrabold tracking-wide text-sky-700 shadow-[0_10px_24px_rgb(3_105_161/10%)]">
                    <span className="min-w-0 truncate">{roleLabel}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-0.5 p-1">
                <button
                  type="button"
                  className="eg-user-menu-item flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-xs font-medium"
                  role="menuitem"
                  onClick={handleProfileClick}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FiUser className="h-4 w-4 shrink-0 text-secondary" />
                    <span className="truncate">Thông tin tài khoản</span>
                  </span>
                  <MenuArrowIcon />
                </button>

                {userMenuItems.map((item) => (
                  <button
                    key={item.label}
                    className="eg-user-menu-item flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-xs font-medium"
                    role="menuitem"
                    type="button"
                    onClick={() => handleUserMenuItemClick(item.action)}
                  >
                    <span className="flex items-center gap-2">
                      {item.action === "theme" ? (
                        isDarkMode ? <FiSun className="h-4 w-4 text-secondary" /> : <FiMoon className="h-4 w-4 text-secondary" />
                      ) : (
                        <FiStar className="h-4 w-4 text-secondary" />
                      )}
                      <span>{item.label}</span>
                    </span>
                    <span className="text-xs text-secondary">›</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border px-1 pb-1 pt-2">
                <Button
                  className="w-full rounded-[12px] py-2 min-h-0 text-xs"
                  variant="danger"
                  onClick={handleLogoutClick}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <FiLogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </span>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}


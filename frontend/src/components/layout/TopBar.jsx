import { Fragment, useEffect, useRef, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import { cn } from "../../utils/cn";
import { classroomApi } from "../../api/classroomApi";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import { getProfileRouteByRole, getRoleLabel } from "../../routes/roleRoutes";
import { routeConfig } from "../../routes/routeConfig";
import { notificationApi } from "../../api/notificationApi";
import {
  getNotificationCardClasses,
  getNotificationDotClasses,
  getNotificationTitleClasses,
  resolveNotificationPath,
} from "../../features/notifications/utils/notificationUtils";
import TeacherQuickCreateButton from "./TeacherQuickCreateButton";
import TeacherShellSearch from "./TeacherShellSearch";
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
const BREADCRUMB_MAX_VISIBLE = 4;

const breadcrumbLabelBySegment = {
  admin: "Quản trị",
  assignments: "Bài tập",
  classrooms: "Lớp học",
  exams: "Đề thi",
  dashboard: "Dashboard",
  profile: "Hồ sơ",
  results: "Kết quả",
  users: "Người dùng",
  join: "Tham gia lớp",
  monitoring: "Giám sát thi",
  "proctoring-evidence": "Bằng chứng vi phạm",
  notifications: "Thông báo",
  "proctoring-ai": "AI giám sát",
};

const homeHrefByRoleSegment = {
  admin: routeConfig.adminDashboard,
  teacher: routeConfig.teacherDashboard,
  student: routeConfig.studentClassrooms,
};

function labelForBreadcrumbSegment(segment) {
  return breadcrumbLabelBySegment[segment] || segment;
}

const classroomBreadcrumbRoutePatterns = [
  routeConfig.adminClassroomDetail,
  routeConfig.teacherClassroomDetail,
  routeConfig.studentClassroomDetail,
];

function getClassroomBreadcrumbMatch(pathname) {
  return (
    classroomBreadcrumbRoutePatterns
      .map((path) => matchPath({ path, end: true }, pathname || "/"))
      .find(Boolean) ?? null
  );
}

function buildBreadcrumbTrail(pathname, labelOverrides = {}) {
  const segments = (pathname || "/").split("/").filter(Boolean);
  const rolePrefix = segments[0] || "";
  const tail = segments.slice(1);

  const items = [
    {
      label: "Trang chủ",
      href: homeHrefByRoleSegment[rolePrefix] || "/",
    },
  ];

  let acc = rolePrefix ? `/${rolePrefix}` : "";
  for (const segment of tail) {
    acc += `/${segment}`;
    items.push({
      label: labelOverrides[acc] || labelForBreadcrumbSegment(segment),
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
  "block max-w-[7rem] truncate sm:max-w-[10rem] xl:max-w-[16rem] 2xl:max-w-[20rem]";

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
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [classroomBreadcrumbState, setClassroomBreadcrumbState] = useState({
    classroomId: "",
    label: "",
  });
  const userMenuItems = buildUserMenuItems(isDarkMode);
  const isTeacherView = user?.role === "Teacher";
  const classroomBreadcrumbMatch = getClassroomBreadcrumbMatch(location?.pathname);
  const classroomBreadcrumbPath = classroomBreadcrumbMatch?.pathname || "";
  const classroomBreadcrumbId = classroomBreadcrumbMatch?.params?.classroomId || "";

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

  async function fetchNotifications() {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationApi.getUnreadCount(),
        notificationApi.getMyNotifications()
      ]);
      setUnreadCount(countRes.data?.count ?? 0);
      setNotificationItems((listRes.data || []).slice(0, 5));
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  }

  useEffect(() => {
    function handleNotificationRefresh() {
      void fetchNotifications();
    }

    const initialFetchTimeout = window.setTimeout(handleNotificationRefresh, 0);

    window.addEventListener("eduguard:notification-updated", handleNotificationRefresh);
    window.addEventListener("eduguard:notification", handleNotificationRefresh);
    
    const interval = setInterval(handleNotificationRefresh, 30000);

    return () => {
      window.clearTimeout(initialFetchTimeout);
      window.removeEventListener("eduguard:notification-updated", handleNotificationRefresh);
      window.removeEventListener("eduguard:notification", handleNotificationRefresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!classroomBreadcrumbId || !classroomBreadcrumbPath) {
      return;
    }

    let isMounted = true;

    async function loadClassroomBreadcrumbLabel() {
      try {
        const response = await classroomApi.getById(classroomBreadcrumbId);

        if (!isMounted) {
          return;
        }

        setClassroomBreadcrumbState({
          classroomId: classroomBreadcrumbId,
          label: response.data?.name || `Lớp ${classroomBreadcrumbId}`,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setClassroomBreadcrumbState({
          classroomId: classroomBreadcrumbId,
          label: `Lớp ${classroomBreadcrumbId}`,
        });
      }
    }

    loadClassroomBreadcrumbLabel();

    return () => {
      isMounted = false;
    };
  }, [classroomBreadcrumbId, classroomBreadcrumbPath]);

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
    setIsNotificationOpen((previousValue) => !previousValue);
  }

  async function handleMarkAllAsRead() {
    try {
      await notificationApi.markAllAsRead();
      fetchNotifications();
      showToast({
        tone: "success",
        title: "Thành công",
        message: "Đã đánh dấu đọc tất cả thông báo.",
      });
    } catch (error) {
      console.error("Lỗi đánh dấu đọc tất cả:", error);
    }
  }

  async function handleNotificationClick(item) {
    if (!item.isRead) {
      try {
        await notificationApi.markAsRead(item.userNotificationId);
        fetchNotifications();
        window.dispatchEvent(new CustomEvent("eduguard:notification-updated"));
      } catch (error) {
        console.error("Lỗi đánh dấu đọc thông báo:", error);
      }
    }
    setIsNotificationOpen(false);
    navigate(resolveNotificationPath(item, user?.role));
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

  function handleOpenNotificationsPage() {
    setIsNotificationOpen(false);
    navigate(routeConfig.notifications);
  }
  const roleLabel = getRoleLabel(user?.role);
  const classroomBreadcrumbLabel = classroomBreadcrumbId
    ? classroomBreadcrumbState.classroomId === classroomBreadcrumbId
      ? classroomBreadcrumbState.label
      : "Đang tải lớp..."
    : "";
  const breadcrumbLabelOverrides = {
    ...(user?.role === "Student" ? { [routeConfig.studentExams]: "Bài kiểm tra" } : {}),
    ...(classroomBreadcrumbPath && classroomBreadcrumbLabel
      ? { [classroomBreadcrumbPath]: classroomBreadcrumbLabel }
      : {}),
  };
  const breadcrumbItems = buildBreadcrumbTrail(
    location?.pathname,
    breadcrumbLabelOverrides,
  );
  const shouldCondenseSearch = classroomBreadcrumbLabel.length > 18;

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3 md:gap-4 md:px-6">
      <div
        className={cn(
          "flex min-w-0 items-center gap-3 lg:flex-1",
          shouldCondenseSearch
            ? "xl:max-w-[min(56%,42rem)] 2xl:max-w-[min(62%,50rem)]"
            : "xl:max-w-[min(46%,32rem)] 2xl:max-w-[min(52%,38rem)]",
        )}
      >
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

      <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
        <TeacherShellSearch
          className={shouldCondenseSearch ? "max-w-[460px] xl:max-w-[500px]" : "max-w-[560px]"}
          user={user}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-4">
        {isTeacherView ? <TeacherQuickCreateButton /> : null}
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
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-[12px] border border-border px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-surface-sunken hover:text-primary transition-all duration-200"
                    onClick={handleOpenNotificationsPage}
                  >
                    Xem tất cả
                  </button>
                  <button
                    type="button"
                    className="rounded-[12px] border border-border px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-surface-sunken hover:text-primary transition-all duration-200"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    Đọc hết
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-1">
                {notificationItems.length > 0 ? (
                  <div className="space-y-1">
                    {notificationItems.map((item) => {
                      return (
                      <div
                        key={item.userNotificationId}
                        onClick={() => handleNotificationClick(item)}
                        className={`cursor-pointer rounded-[16px] border p-3 text-left transition-all ${getNotificationCardClasses(item.type, item.isRead, item)}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-xs font-semibold ${getNotificationTitleClasses(item.type, item.isRead, item)}`}>
                              {item.title || "Thông báo"}
                            </p>
                            <p className="pt-1 text-[11px] leading-relaxed text-secondary line-clamp-2">
                              {item.content || "Bạn có thông báo mới."}
                            </p>
                          </div>
                          <span
                            className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${getNotificationDotClasses(item.type, item.isRead, item)}`}
                            aria-hidden="true"
                          />
                        </div>
                        {item.createdAt ? (
                          <p className="pt-2 text-[10px] font-medium text-secondary/80">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </p>
                        ) : null}
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-8">
                    <p className="text-xs font-semibold text-primary">Không có thông báo mới.</p>
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


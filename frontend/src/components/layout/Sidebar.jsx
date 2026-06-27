import { Link, matchPath, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { routeConfig } from "../../routes/routeConfig";
import {
  FiBookOpen,
  FiBell,
  FiBarChart2,
  FiCamera,
  FiClipboard,
  FiFileText,
  FiHome,
  FiShield,
  FiUsers,
  FiUser,
  FiLogIn,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

// Hàm này trả class cho từng item trong sidebar để route đang active nhìn rõ hơn.
function getNavigationLinkClassName(isActive) {
  return cn(
    "relative block rounded-[14px] px-4 py-3 text-sm font-medium transition-all duration-200",
    isActive
      ? "eg-sidebar-link-active font-semibold after:absolute after:left-2 after:top-1/2 after:h-6 after:w-[3px] after:-translate-y-1/2 after:rounded-full after:bg-sky-300/90"
      : "eg-sidebar-link-idle",
  );
}

function SidebarCollapseToggleIcon({ isCollapsed }) {
  return isCollapsed ? <FiChevronsRight className="h-4 w-4" /> : <FiChevronsLeft className="h-4 w-4" />;
}

function getNavigationIconByLabel(label) {
  if (label === "Lớp học" || label === "Lớp của tôi" || label === "Quản lí lớp học") {
    return FiUsers;
  }
  if (label === "Bài tập") {
    return FiFileText;
  }
  if (label === "Bài kiểm tra" || label === "Đề thi" || label === "Quản lí bài kiểm tra") {
    return FiClipboard;
  }
  if (label === "Tham gia lớp") {
    return FiLogIn;
  }
  if (label === "Quản lí người dùng") {
    return FiUser;
  }
  if (label === "Giám sát" || label === "Giám sát thi") {
    return FiShield;
  }
  if (label === "Kho hình ảnh/ Video") {
    return FiCamera;
  }
  if (label === "Kết quả") {
    return FiBarChart2;
  }
  if (label === "Thông báo" || label === "Xem thông báo") {
    return FiBell;
  }
  if (label === "Hồ sơ" || label === "Hồ sơ cá nhân") {
    return FiUser;
  }
  if (label === "Dashboard") {
    return FiHome;
  }
  return FiBookOpen;
}

function getNavigationItemIsActive(itemPath, pathname) {
  if (itemPath === routeConfig.studentClassrooms) {
    return (
      pathname === routeConfig.studentClassrooms ||
      (pathname !== routeConfig.studentJoinClassroom &&
        Boolean(matchPath(routeConfig.studentClassroomDetail, pathname)))
    );
  }

  if (itemPath === routeConfig.studentJoinClassroom) {
    return pathname === routeConfig.studentJoinClassroom;
  }

  if (itemPath === routeConfig.teacherClassrooms) {
    return (
      pathname === routeConfig.teacherClassrooms ||
      Boolean(matchPath(routeConfig.teacherClassroomDetail, pathname))
    );
  }

  if (itemPath === routeConfig.teacherAssignments) {
    return pathname === routeConfig.teacherAssignments;
  }

  if (itemPath === routeConfig.adminClassrooms) {
    return (
      pathname === routeConfig.adminClassrooms ||
      Boolean(matchPath(routeConfig.adminClassroomDetail, pathname))
    );
  }

  if (itemPath === routeConfig.studentExams) {
    return (
      pathname === routeConfig.studentExams ||
      Boolean(matchPath(routeConfig.studentExamDetail, pathname)) ||
      Boolean(matchPath(routeConfig.studentExamAttempt, pathname)) ||
      Boolean(matchPath(routeConfig.studentExamLobby, pathname)) ||
      Boolean(matchPath(routeConfig.studentExamDeviceCheck, pathname)) ||
      Boolean(matchPath(routeConfig.studentExamPaused, pathname))
    );
  }

  if (itemPath === routeConfig.teacherExams) {
    return (
      pathname === routeConfig.teacherExams ||
      (Boolean(matchPath(routeConfig.teacherExamDetail, pathname)) &&
        !Boolean(matchPath(routeConfig.teacherProctoring, pathname)))
    );
  }

  if (itemPath === routeConfig.teacherMonitoring) {
    return (
      pathname === routeConfig.teacherMonitoring ||
      Boolean(matchPath(routeConfig.teacherProctoring, pathname))
    );
  }

  if (itemPath === routeConfig.teacherProctoringEvidence) {
    return pathname === routeConfig.teacherProctoringEvidence;
  }

  if (itemPath === routeConfig.teacherResults) {
    return pathname === routeConfig.teacherResults;
  }

  if (itemPath === routeConfig.teacherNotifications) {
    return pathname === routeConfig.teacherNotifications;
  }

  if (itemPath === routeConfig.adminExams) {
    return pathname === routeConfig.adminExams || Boolean(matchPath(routeConfig.adminExamDetail, pathname));
  }

  if (itemPath === routeConfig.adminProctoringAi) {
    return pathname === routeConfig.adminProctoringAi;
  }

  if (itemPath === routeConfig.adminEmailSettings) {
    return pathname === routeConfig.adminEmailSettings;
  }

  if (itemPath === routeConfig.adminProctoringEvidence) {
    return pathname === routeConfig.adminProctoringEvidence;
  }

  return pathname === itemPath;
}

// Component này là thanh điều hướng bên trái cho khu vực đã đăng nhập.
export default function Sidebar({
  isOpen,
  isCollapsed,
  navigationItems,
  onNavigate,
  onClose,
  onToggleCollapse,
}) {
  const location = useLocation();

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
          "flex h-full w-[280px] flex-col bg-obsidian border-r border-white/10 transition-transform duration-200 lg:h-screen lg:rounded-none lg:border-r lg:border-white/5 lg:sticky lg:top-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[92px]" : "lg:w-[280px]",
        )}
        onClick={handlePanelClick}
      >
        <div
          className={cn(
            "flex h-16 items-center justify-between gap-3 border-b border-white/10",
            isCollapsed ? "px-3" : "px-5",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute -inset-1 rounded-[14px] bg-white/5 blur-[10px]" aria-hidden="true" />
              <img alt="Logo EduGuard" className="relative h-8 w-auto object-contain" src="/logo.png" />
            </div>
            <div className={cn(isCollapsed ? "lg:hidden" : "")}>
              <h2 className="text-base font-bold tracking-tight text-white leading-none">EduGuard</h2>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 mt-1">
                Workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-[12px] border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white lg:hidden"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>

        <nav
          className={cn(
            "flex flex-1 flex-col gap-1.5 pt-6",
            isCollapsed ? "lg:items-stretch px-3" : "px-5",
          )}
        >
          {navigationItems.map((item) => {
            const ItemIcon = getNavigationIconByLabel(item.label);
            const isItemActive = getNavigationItemIsActive(item.path, location.pathname);

            return (
              <Link
                key={item.path}
                aria-current={isItemActive ? "page" : undefined}
                className={cn(
                  getNavigationLinkClassName(isItemActive),
                  isCollapsed ? "lg:px-2 lg:py-2.5 lg:rounded-[16px]" : "",
                )}
                onClick={onNavigate}
                title={item.label}
                to={item.path}
              >
                <span className={cn("flex min-w-0 items-center gap-3", isCollapsed ? "lg:justify-center" : "")}>
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/6 text-white/90",
                      "max-lg:h-auto max-lg:w-auto max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent",
                    )}
                  >
                    <ItemIcon className="h-[18px] w-[18px] max-lg:text-slate-300" />
                  </span>
                  <span className={cn("min-w-0 truncate", isCollapsed ? "lg:hidden" : "")}>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-white/10 pt-4 pb-5 mt-auto", isCollapsed ? "px-3" : "px-5")}>
          <button
            type="button"
            className={cn(
              "mx-auto flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-[10px] font-semibold text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white",
              isCollapsed ? "lg:px-2" : "",
            )}
            onClick={onToggleCollapse}
            title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-[12px] border border-white/10 bg-white/5 text-slate-200">
              <SidebarCollapseToggleIcon isCollapsed={isCollapsed} />
            </span>
            {!isCollapsed ? <span className="hidden lg:inline">Thu gọn</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

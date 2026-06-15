import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "../../hooks/useAuth";
import { getNavigationItemsByRole, getRoleLabel } from "../../routes/roleRoutes";

// Component này là khung giao diện chung cho toàn bộ khu vực đã đăng nhập.
export default function AppShell() {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarState, setSidebarState] = useState({ isOpen: false, pathname: "" });
  const navigationItems = getNavigationItemsByRole(user?.role);
  const roleLabel = getRoleLabel(user?.role);
  const isSidebarOpen = sidebarState.isOpen && sidebarState.pathname === location.pathname;

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        closeSidebar();
      }
    }

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isSidebarOpen]);

  // Hàm này đóng sidebar lại sau khi người dùng thao tác xong.
  function closeSidebar() {
    setSidebarState((previousValue) => ({
      ...previousValue,
      isOpen: false,
    }));
  }

  // Hàm này đảo trạng thái drawer khi người dùng bấm nút menu 3 gạch.
  function toggleSidebar() {
    setSidebarState((previousValue) => ({
      isOpen: !(previousValue.isOpen && previousValue.pathname === location.pathname),
      pathname: location.pathname,
    }));
  }

  return (
    <div className="min-h-screen bg-neutral">
      <div className="mx-auto max-w-[1380px] px-4 py-4 md:px-6 lg:px-8">
        <TopBar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <div className="mt-6 flex min-h-[calc(100vh-10rem)] gap-6">
          <Sidebar
            isOpen={isSidebarOpen}
            navigationItems={navigationItems}
            roleLabel={roleLabel}
            onNavigate={closeSidebar}
            onClose={closeSidebar}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <main className="space-y-6 pb-10">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

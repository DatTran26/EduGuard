import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "../../hooks/useAuth";
import { getNavigationItemsByRole } from "../../routes/roleRoutes";

// Component này là khung giao diện chung cho toàn bộ khu vực đã đăng nhập.
export default function AppShell() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem("eg.sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });
  const navigationItems = getNavigationItemsByRole(user?.role);

  // Hàm này mở sidebar trên mobile khi người dùng bấm nút menu.
  function openSidebar() {
    setIsSidebarOpen(true);
  }

  // Hàm này đóng sidebar lại sau khi người dùng thao tác xong.
  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  function toggleSidebarCollapsed() {
    setIsSidebarCollapsed((previousValue) => {
      const nextValue = !previousValue;
      try {
        window.localStorage.setItem("eg.sidebar.collapsed", nextValue ? "1" : "0");
      } catch {
        // ignore
      }
      return nextValue;
    });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        navigationItems={navigationItems}
        onNavigate={closeSidebar}
        onClose={closeSidebar}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenSidebar={openSidebar}
          onToggleSidebarCollapsed={toggleSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px] space-y-6 pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


import { Outlet } from "react-router-dom";
import { useState } from "react";
import BrandNavbar from "./BrandNavbar";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "../../hooks/useAuth";
import { getNavigationItemsByRole, getRoleLabel } from "../../routes/roleRoutes";

// Component này là khung giao diện chung cho toàn bộ khu vực đã đăng nhập.
export default function AppShell() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigationItems = getNavigationItemsByRole(user?.role);

  // Hàm này mở sidebar trên mobile khi người dùng bấm nút menu.
  function openSidebar() {
    setIsSidebarOpen(true);
  }

  // Hàm này đóng sidebar lại sau khi người dùng thao tác xong.
  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-neutral">
      <div className="mx-auto max-w-[1380px] px-4 py-4 md:px-6 lg:px-8">
        <BrandNavbar />

        <div className="mt-6 flex min-h-[calc(100vh-9rem)] gap-6">
          <Sidebar
            isOpen={isSidebarOpen}
            navigationItems={navigationItems}
            onNavigate={closeSidebar}
            onClose={closeSidebar}
            roleLabel={getRoleLabel(user?.role)}
            userAvatarUrl={user?.avatarUrl ?? ""}
            userEmail={user?.email ?? "user@eduguard.local"}
            userName={user?.fullName ?? "Người dùng EduGuard"}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <TopBar onOpenSidebar={openSidebar} />
            <main className="space-y-6 pb-10">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

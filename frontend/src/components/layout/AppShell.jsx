import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "../../hooks/useAuth";
import { getNavigationItemsByRole, getRoleLabel } from "../../routes/roleRoutes";

// Component này là khung giao diện chung cho toàn bộ khu vực đã đăng nhập.
export default function AppShell() {
  const { user } = useAuth();
  const navigationItems = getNavigationItemsByRole(user?.role);
  const roleLabel = getRoleLabel(user?.role);

  return (
    <div className="min-h-screen bg-neutral">
      <div className="mx-auto max-w-[1380px] px-4 py-4 md:px-6 lg:px-8">
        <TopBar />
      </div>

      <div className="mt-6 pb-10 lg:flex lg:gap-6">
        <div className="pr-4 md:pr-6 lg:w-[292px] lg:shrink-0 lg:pr-0">
          <Sidebar navigationItems={navigationItems} roleLabel={roleLabel} />
        </div>

        <div className="min-w-0 flex-1 px-4 md:px-6 lg:pr-8">
          <main className="mx-auto w-full max-w-[1064px] space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

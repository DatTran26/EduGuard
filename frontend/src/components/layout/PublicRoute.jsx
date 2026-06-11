import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getDefaultPathByRole } from "../../routes/roleRoutes";

// Component này giữ cho màn login/register chỉ hiện khi người dùng chưa có phiên đăng nhập.
export default function PublicRoute() {
  const { isAuthenticated, isHydrating, user } = useAuth();

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-neutral px-4 py-8">
        <div className="mx-auto max-w-xl rounded-[24px] border border-border bg-surface p-6 text-sm text-secondary">
          Đang kiểm tra phiên đăng nhập...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultPathByRole(user?.role)} />;
  }

  return <Outlet />;
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { routeConfig } from "../../routes/routeConfig";
import { getDefaultPathByRole } from "../../routes/roleRoutes";

// Component này chặn các route cần đăng nhập và kiểm tra role nếu route có giới hạn quyền.
export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const { hasRole, isAuthenticated, isHydrating, user } = useAuth();

  if (isHydrating) {
    return (
      <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={routeConfig.login} />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate replace to={getDefaultPathByRole(user?.role)} />;
  }

  return <Outlet />;
}

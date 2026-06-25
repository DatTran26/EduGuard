import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../common/LoadingScreen";
import { getDefaultPathByRole } from "../../routes/roleRoutes";

// Component này giữ cho màn login/register chỉ hiện khi người dùng chưa có phiên đăng nhập.
export default function PublicRoute() {
  const { isAuthenticated, isHydrating, user } = useAuth();

  if (isHydrating) {
    return (
      <LoadingScreen
        title="Đang kiểm tra phiên đăng nhập"
        message="Chỉ một chút nữa thôi, sắp xong rồi…"
      />
    );
  }

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultPathByRole(user?.role)} />;
  }

  return <Outlet />;
}

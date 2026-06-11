import { Link, useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { getProfileRouteByRole, getRoleLabel } from "../../routes/roleRoutes";
import { routeConfig } from "../../routes/routeConfig";

// Component này là thanh trên cùng của vùng đăng nhập, hiển thị user hiện tại và nút đăng xuất.
export default function TopBar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { isSkeletonMode, logout, user } = useAuth();
  const { showToast } = useToast();

  // Hàm này xử lý đăng xuất rồi đưa người dùng về lại màn đăng nhập.
  async function handleLogoutClick() {
    await logout();
    showToast({
      tone: "success",
      title: "Đăng xuất thành công",
      message: "Phiên làm việc đã được đóng an toàn.",
    });
    navigate(routeConfig.login);
  }

  return (
    <header className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface px-4 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] md:flex-row md:items-center md:justify-between md:px-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="lg:hidden" onClick={onOpenSidebar}>
          Mở menu
        </Button>
        <div className="space-y-1">
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-secondary">
            Khu làm việc
          </p>
          <p className="text-sm font-semibold text-primary">
            {`Chào ${user?.fullName ?? "Người dùng EduGuard"}, tiếp tục công việc nhé.`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {isSkeletonMode ? <Badge variant="neutral">Bản demo</Badge> : null}
        <Badge variant="info">{getRoleLabel(user?.role)}</Badge>
        <div className="hidden items-center gap-3 rounded-full border border-border bg-neutral px-3 py-2 sm:flex">
          <Avatar
            alt={`Ảnh đại diện của ${user?.fullName ?? "người dùng"}`}
            name={user?.fullName ?? ""}
            sizeClassName="h-10 w-10"
            src={user?.avatarUrl ?? ""}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{user?.fullName ?? "Người dùng EduGuard"}</p>
            <p className="truncate text-xs text-secondary">{user?.email ?? "user@eduguard.local"}</p>
          </div>
        </div>
        <Link className="eg-button eg-button-ghost" to={getProfileRouteByRole(user?.role)}>
          Hồ sơ
        </Link>
        <Button variant="secondary" onClick={handleLogoutClick}>
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}

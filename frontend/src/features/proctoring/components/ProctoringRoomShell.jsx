import { Outlet } from "react-router-dom";

export default function ProctoringRoomShell() {
  return (
    <div className="eg-proctoring-room min-h-[100dvh] bg-[#070d18] text-slate-100">
      <Outlet />
    </div>
  );
}

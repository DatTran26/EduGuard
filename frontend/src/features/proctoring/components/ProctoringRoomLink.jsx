import { useAuth } from "../../../hooks/useAuth";
import { buildProctoringPathByRole } from "../../../routes/routeConfig";

export default function ProctoringRoomLink({ examId, className, children, ...props }) {
  const { user } = useAuth();

  return (
    <a
      className={className}
      href={buildProctoringPathByRole(user?.role, examId)}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  );
}

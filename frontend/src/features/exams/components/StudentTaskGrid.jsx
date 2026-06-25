import { cn } from "../../../utils/cn";

export default function StudentTaskGrid({ children, className }) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3", className)}>
      {children}
    </div>
  );
}

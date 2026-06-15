import { cn } from "../../utils/cn";

// Component này bọc các khối nội dung chính để giao diện có cùng kiểu card theo design system.
export default function Card({ className, children, ...props }) {
  return (
    <section className={cn("eg-card", className)} {...props}>
      {children}
    </section>
  );
}

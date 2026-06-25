import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";

function maskEmail(email = "") {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, 2);
  return `${visible}***@${domain}`;
}

export default function ExamWatermark({ examId, attemptId }) {
  const { user } = useAuth();
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleTimeString("vi-VN"));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString("vi-VN"));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const text = `${user?.fullName ?? "Học sinh"} · ${maskEmail(user?.email)} · Exam ${examId} · Attempt ${attemptId} · ${timestamp}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]"
    >
      <div className="absolute inset-0 grid grid-cols-2 gap-16 p-8 rotate-[-18deg] scale-125">
        {Array.from({ length: 8 }).map((_, index) => (
          <p key={index} className="whitespace-nowrap text-xs font-semibold text-primary">
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}

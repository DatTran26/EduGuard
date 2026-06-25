import StudentLiveTile from "./StudentLiveTile";

export default function StudentCameraGrid({
  students = [],
  activeAttemptId,
  onSelectStudent,
  onRequestWatch,
}) {
  if (!students.length) {
    return (
      <div className="rounded-[16px] border border-dashed border-border bg-neutral p-8 text-center text-sm text-secondary">
        Chưa có học sinh trong phòng giám sát.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {students.map((student) => (
        <StudentLiveTile
          key={student.attemptId}
          isActive={activeAttemptId === student.attemptId}
          onRequestWatch={onRequestWatch}
          onSelect={onSelectStudent}
          student={student}
        />
      ))}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import { userApi } from "../../../api/userApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { useToast } from "../../../hooks/useToast";

export default function CoProctorPanel({ examId }) {
  const { showToast } = useToast();
  const [proctors, setProctors] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const assignedTeacherIds = useMemo(
    () => new Set(proctors.map((proctor) => proctor.teacherId)),
    [proctors],
  );

  const availableTeachers = useMemo(
    () => teachers.filter((teacher) => !assignedTeacherIds.has(teacher.id)),
    [assignedTeacherIds, teachers],
  );

  const refresh = useCallback(async () => {
    const response = await proctoringApi.getProctors(examId);
    setProctors(response.data ?? []);
  }, [examId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const [proctorResponse, userResponse] = await Promise.all([
          proctoringApi.getProctors(examId),
          userApi.getAll(),
        ]);
        if (!isMounted) {
          return;
        }
        setProctors(proctorResponse.data ?? []);
        setTeachers(
          (userResponse.data ?? []).filter(
            (user) => user.role === "Teacher" && user.isActive !== false,
          ),
        );
      } catch (error) {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Không tải được danh sách co-proctor",
            message: error.message,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [examId, showToast]);

  async function handleAdd() {
    if (!selectedTeacherId) {
      return;
    }

    try {
      await proctoringApi.addProctor(examId, selectedTeacherId);
      setSelectedTeacherId("");
      await refresh();
      showToast({ tone: "success", title: "Đã thêm co-proctor" });
    } catch (error) {
      showToast({ tone: "danger", title: "Thêm co-proctor thất bại", message: error.message });
    }
  }

  async function handleRemove(teacherId) {
    try {
      await proctoringApi.removeProctor(examId, teacherId);
      await refresh();
      showToast({ tone: "success", title: "Đã xóa co-proctor" });
    } catch (error) {
      showToast({ tone: "danger", title: "Xóa co-proctor thất bại", message: error.message });
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h3 className="text-lg font-semibold text-primary">Co-proctor</h3>
        <p className="text-sm text-secondary">
          Mời giáo viên khác cùng giám sát. Mỗi học sinh chỉ một giáo viên xem live tại một thời điểm.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-secondary">Đang tải…</p>
      ) : proctors.length ? (
        <ul className="space-y-2">
          {proctors.map((proctor) => (
            <li
              key={proctor.id}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-neutral px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-primary">{proctor.teacherName}</p>
                <Badge variant="neutral">{proctor.role}</Badge>
              </div>
              {proctor.role !== "Owner" ? (
                <Button onClick={() => handleRemove(proctor.teacherId)} variant="ghost">
                  Xóa
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secondary">Chưa có co-proctor.</p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-primary">Thêm giáo viên</span>
          <select
            className="rounded-[12px] border border-border bg-surface px-3 py-2 text-primary"
            onChange={(event) => setSelectedTeacherId(event.target.value)}
            value={selectedTeacherId}
          >
            <option value="">Chọn giáo viên…</option>
            {availableTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName} ({teacher.email})
              </option>
            ))}
          </select>
        </label>
        <Button disabled={!selectedTeacherId} onClick={handleAdd}>
          Mời co-proctor
        </Button>
      </div>
    </Card>
  );
}

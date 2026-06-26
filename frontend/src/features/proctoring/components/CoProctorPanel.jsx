import { useCallback, useEffect, useMemo, useState } from "react";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import { proctoringApi } from "../../../api/proctoringApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { areUserIdsEqual } from "../../../api/apiHelpers";
import { cn } from "../../../utils/cn";

function getRoleBadgeVariant(role) {
  if (role === "Owner") {
    return "info";
  }
  return "neutral";
}

export default function CoProctorPanel({ examId, isOpen = true, variant = "default" }) {
  const isRoom = variant === "room";
  const { user } = useAuth();
  const { showToast } = useToast();
  const [proctors, setProctors] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshProctors = useCallback(async () => {
    const response = await proctoringApi.getProctors(examId);
    setProctors(response.data ?? []);
    return response.data ?? [];
  }, [examId]);

  const loadDialogData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setCanManage(false);
    setCandidates([]);

    try {
      const proctorList = await refreshProctors();
      const currentUserIsOwner = proctorList.some(
        (proctor) => proctor.role === "Owner" && areUserIdsEqual(proctor.teacherId, user?.id),
      );
      setCanManage(currentUserIsOwner);

      if (currentUserIsOwner) {
        try {
          const candidateResponse = await proctoringApi.getProctorCandidates(examId);
          setCandidates(candidateResponse.data ?? []);
        } catch (error) {
          setLoadError(error.message || "Không tải được danh sách giáo viên để mời.");
        }
      }
    } catch (error) {
      setLoadError(error.message || "Không tải được danh sách co-proctor.");
    } finally {
      setIsLoading(false);
    }
  }, [examId, refreshProctors, user?.id]);

  useEffect(() => {
    if (!isOpen || !examId) {
      return;
    }

    loadDialogData();
  }, [examId, isOpen, loadDialogData]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTeacherId("");
    }
  }, [isOpen]);

  const coProctorCount = useMemo(
    () => proctors.filter((proctor) => proctor.role !== "Owner").length,
    [proctors],
  );

  async function handleAdd() {
    if (!selectedTeacherId || !canManage) {
      return;
    }

    setIsSubmitting(true);
    try {
      await proctoringApi.addProctor(examId, selectedTeacherId);
      setSelectedTeacherId("");
      await loadDialogData();
      showToast({ tone: "success", title: "Đã thêm co-proctor" });
    } catch (error) {
      showToast({ tone: "danger", title: "Thêm co-proctor thất bại", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(teacherId) {
    if (!canManage) {
      return;
    }

    setIsSubmitting(true);
    try {
      await proctoringApi.removeProctor(examId, teacherId);
      await loadDialogData();
      showToast({ tone: "success", title: "Đã xóa co-proctor" });
    } catch (error) {
      showToast({ tone: "danger", title: "Xóa co-proctor thất bại", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <p className={cn("text-sm", isRoom ? "text-slate-400" : "text-secondary")}>Đang tải…</p>
      </div>
    );
  }

  if (loadError && !proctors.length) {
    return (
      <div className="rounded-[14px] border border-rose-400/25 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "flex items-center gap-3 rounded-[14px] border px-4 py-3",
          isRoom ? "border-white/10 bg-white/[0.03]" : "border-border bg-neutral",
        )}
      >
        <span
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-[12px]",
            isRoom ? "bg-sky-500/15 text-sky-200" : "bg-info-muted text-info",
          )}
        >
          <FiUsers className="h-5 w-5" />
        </span>
        <div>
          <p className={cn("text-sm font-medium", isRoom ? "text-slate-200" : "text-primary")}>
            {proctors.length} giáo viên trong phòng
          </p>
          <p className={cn("text-xs", isRoom ? "text-slate-500" : "text-secondary")}>
            {coProctorCount > 0 ? `${coProctorCount} co-proctor` : "Chưa có co-proctor"}
          </p>
        </div>
      </div>

      {proctors.length ? (
        <ul className="space-y-2">
          {proctors.map((proctor) => (
            <li
              key={`${proctor.teacherId}-${proctor.role}`}
              className={cn(
                "flex items-center justify-between gap-3 rounded-[12px] border px-3 py-3",
                isRoom ? "border-white/10 bg-[#0a101c]" : "border-border bg-neutral",
              )}
            >
              <div className="min-w-0">
                <p className={cn("truncate text-sm font-medium", isRoom ? "text-slate-100" : "text-primary")}>
                  {proctor.teacherName}
                </p>
                <div className="mt-1">
                  <Badge variant={getRoleBadgeVariant(proctor.role)}>
                    {proctor.role === "Owner" ? "Chủ phòng" : "Co-proctor"}
                  </Badge>
                </div>
              </div>
              {canManage && proctor.role !== "Owner" ? (
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleRemove(proctor.teacherId)}
                  variant="ghost"
                >
                  Xóa
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-sm", isRoom ? "text-slate-400" : "text-secondary")}>Chưa có co-proctor.</p>
      )}

      {canManage ? (
        <div
          className={cn(
            "space-y-3 rounded-[14px] border p-4",
            isRoom ? "border-white/10 bg-white/[0.02]" : "border-border bg-surface",
          )}
        >
          <div className="flex items-center gap-2">
            <FiUserPlus className={cn("h-4 w-4", isRoom ? "text-sky-300" : "text-link")} />
            <p className={cn("text-sm font-medium", isRoom ? "text-slate-200" : "text-primary")}>
              Mời giáo viên mới
            </p>
          </div>

          {loadError ? (
            <p className="text-sm text-rose-300">{loadError}</p>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className={cn("font-medium", isRoom ? "text-slate-300" : "text-primary")}>Chọn giáo viên</span>
            <select
              className={cn(
                "rounded-[12px] border px-3 py-2.5 text-base",
                isRoom
                  ? "border-white/15 bg-[#060b14] text-slate-100"
                  : "border-border bg-surface text-primary",
              )}
              disabled={isSubmitting || !candidates.length}
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              value={selectedTeacherId}
            >
              <option value="">
                {candidates.length ? "Chọn giáo viên…" : "Không còn giáo viên để mời"}
              </option>
              {candidates.map((teacher) => (
                <option key={teacher.teacherId} value={teacher.teacherId}>
                  {teacher.fullName} ({teacher.email})
                </option>
              ))}
            </select>
          </label>

          <Button disabled={!selectedTeacherId || isSubmitting} onClick={handleAdd}>
            {isSubmitting ? "Đang mời…" : "Mời co-proctor"}
          </Button>
        </div>
      ) : (
        <p className={cn("text-sm leading-6", isRoom ? "text-slate-500" : "text-secondary")}>
          Chỉ giáo viên tạo đề mới được mời hoặc xóa co-proctor. Bạn vẫn có thể xem danh sách giáo viên đang giám sát.
        </p>
      )}
    </div>
  );
}

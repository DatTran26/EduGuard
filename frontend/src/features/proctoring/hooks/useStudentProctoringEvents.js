import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/useToast";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { buildStudentExamPausedPath } from "../../../routes/routeConfig";
import { useProctoringHubConnection } from "./useProctoringHubConnection";

export function useStudentProctoringEvents({ attemptId, enabled }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { invoke } = useProctoringHubConnection({
    enabled,
    onEvent: (eventName, payload) => {
      if (Number(payload?.attemptId) !== Number(attemptId)) {
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.receiveProctoringWarning) {
        showToast({
          tone: "caution",
          title: "Nhắc nhở từ giáo viên",
          message: payload?.message ?? "Hãy tập trung làm bài.",
        });
        return;
      }

      if (
        eventName === EXAM_MONITORING_EVENTS.studentMovedToWaitingRoom ||
        eventName === EXAM_MONITORING_EVENTS.studentWarnedByTeacher
      ) {
        if (eventName === EXAM_MONITORING_EVENTS.studentMovedToWaitingRoom) {
          navigate(buildStudentExamPausedPath(attemptId));
        }
      }

      if (eventName === EXAM_MONITORING_EVENTS.studentAttemptTerminated) {
        showToast({
          tone: "danger",
          title: "Bài làm đã kết thúc",
          message: "Giáo viên đã kết thúc bài làm của bạn.",
        });
      }
    },
  });

  useEffect(() => {
    if (!enabled || !attemptId) {
      return undefined;
    }

    invoke(EXAM_MONITORING_METHODS.studentJoinAttemptStream, attemptId).catch(() => {});
    return undefined;
  }, [attemptId, enabled, invoke]);
}

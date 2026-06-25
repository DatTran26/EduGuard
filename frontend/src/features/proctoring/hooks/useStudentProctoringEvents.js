import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/useToast";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { buildStudentExamAttemptPath, buildStudentExamPausedPath } from "../../../routes/routeConfig";
import { useProctoringHubConnection } from "./useProctoringHubConnection";

export function useStudentProctoringEvents({ attemptId, examId, enabled }) {
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
          message: payload?.message ?? payload?.reason ?? "Hãy tập trung làm bài.",
        });
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.studentMovedToWaitingRoom) {
        navigate(buildStudentExamPausedPath(attemptId));
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.studentAttemptResumed) {
        showToast({
          tone: "success",
          title: "Được phép tiếp tục",
          message: payload?.reason ?? "Giáo viên đã cho bạn làm bài tiếp.",
        });
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.studentAttemptTerminated) {
        showToast({
          tone: "danger",
          title: "Bài làm đã kết thúc",
          message: payload?.reason ?? "Giáo viên đã kết thúc bài làm của bạn.",
        });
        if (examId) {
          navigate(buildStudentExamAttemptPath(attemptId));
        }
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
